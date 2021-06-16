import { Connection } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import core from '@light-town/core';
import {
  ApiForbiddenException,
  ApiInternalServerException,
  ApiNotFoundException,
  ApiUnauthorizedException,
} from '~/common/exceptions';
import AccountsService from '~/modules/accounts/accounts.service';
import UsersService from '~/modules/users/users.service';
import SessionsService from '~/modules/sessions/sessions.service';
import DevicesService from '~/modules/devices/devices.service';
import {
  SessionVerificationStageEnum,
  SESSION_EXPIRES_AT,
} from '~/modules/sessions/sessions.dto';
import PushNotificationsService from '~/modules/push-notifications/push-notifications.service';
import {
  SignUpPayload,
  SessionCreatePayload,
  SessionCreateResponse,
  SessionStartPayload,
  SessionStartResponse,
  SessionVerifyResponse,
  MFATypesEnum,
  RefreshTokenResponse,
} from './auth.dto';
import AuthGateway from './auth.gateway';
import { OS } from '../devices/devices.dto';
import KeySetsService from '../key-sets/key-sets.service';
import VaultsService from '../vaults/vaults.service';

@Injectable()
export class AuthService {
  public constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
    private readonly authGateway: AuthGateway,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly keySetsService: KeySetsService,
    private readonly vaultsService: VaultsService
  ) {}

  public async signUp(options: SignUpPayload): Promise<void> {
    const { deviceUuid, account, srp, primaryKeySet, primaryVault } = options;

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: deviceUuid, isDeleted: false },
    });

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    const newUser = await this.usersService.create({
      name: account.username,
      avatarUrl: account.avatarUrl,
    });

    const newAccount = await this.accountsService.create({
      key: account.key,
      userId: newUser.id,
      verifier: srp.verifier,
      salt: srp.salt,
    });

    const keySet = await this.keySetsService.create(
      newAccount.id,
      newAccount.id,
      primaryKeySet,
      { isAccountOwner: true, isPrimary: true }
    );

    await this.vaultsService.createVault(
      newAccount.id,
      keySet.id,
      primaryVault
    );
  }

  public async createSession(
    options: SessionCreatePayload
  ): Promise<SessionCreateResponse> {
    const account = await this.accountsService.findOne({
      select: ['id', 'salt', 'verifier', 'mfaType'],
      where: { key: options.accountKey, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    if (!account) throw new ApiNotFoundException(`The account was not found`);

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: options.deviceUuid, isDeleted: false },
    });

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    const ephemeral = core.srp.server.generateEphemeralKeyPair(
      account.verifier
    );

    const session = await this.sessionsService.create({
      secret: ephemeral.secret,
      accountId: account.id,
      deviceId: device.id,
    });

    if (account.mfaType.name !== MFATypesEnum.NONE) {
      const verificationDevice = await this.devicesService.findOneVerificationDevice(
        {
          select: ['id', 'device'],
          where: {
            accountId: account.id,
            isDeleted: false,
          },
          join: {
            alias: 'verificationDevices',
            leftJoinAndSelect: {
              device: 'verificationDevices.device',
            },
          },
        }
      );

      if (!verificationDevice)
        throw new ApiInternalServerException(
          `The verification device was not found`
        );

      await this.sessionsService.update(
        { id: session.id },
        { verificationDeviceId: verificationDevice.id }
      );

      await this.pushNotificationsService.send(verificationDevice.device.id, {
        action: 'VerifySession',
        sessionUuid: session.id,
      });

      return {
        sessionUuid: session.id,
        salt: account.salt,
        serverPublicEphemeral: ephemeral.public,
        sessionVerification: {
          stage: SessionVerificationStageEnum.REQUIRED,
          MFAType: account.mfaType.name,
          verificationDevice: {
            uuid: verificationDevice.id,
            os: <OS>verificationDevice.device.os,
            model: verificationDevice.device.model,
            hostname: verificationDevice.device.hostname,
          },
        },
      };
    }

    const verificationStage = await this.sessionsService.findOneVerificationStage(
      {
        select: ['id'],
        where: {
          name: SessionVerificationStageEnum.COMPLETED,
          isDeleted: false,
        },
      }
    );

    if (!verificationStage)
      throw new ApiInternalServerException(
        `The '${SessionVerificationStageEnum.COMPLETED}' session verify stage was not found`
      );

    await this.sessionsService.update(
      { id: session.id },
      { verificationStageId: verificationStage.id }
    );

    return {
      sessionUuid: session.id,
      salt: account.salt,
      serverPublicEphemeral: ephemeral.public,
      sessionVerification: {
        stage: SessionVerificationStageEnum.NOT_REQUIRED,
        MFAType: account.mfaType.name,
      },
    };
  }

  public async startSession(
    sessionUuid: string,
    options: SessionStartPayload
  ): Promise<SessionStartResponse> {
    const session = await this.sessionsService.findOne({
      select: ['id', 'secret', 'accountId', 'verificationStage'],
      where: {
        id: sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });

    if (!session) throw new ApiNotFoundException(`The session was not found`);

    if (
      ![
        SessionVerificationStageEnum.NOT_REQUIRED,
        SessionVerificationStageEnum.COMPLETED,
      ].includes(<SessionVerificationStageEnum>session.verificationStage.name)
    )
      throw new ApiForbiddenException(`The session was not verified`);

    const account = await this.accountsService.findOne({
      select: ['id', 'salt', 'key', 'verifier', 'mfaType', 'userId'],
      where: { id: session.accountId, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    if (!account)
      throw new ApiInternalServerException('The account was not found');

    try {
      const srpSession = core.srp.server.deriveSession(
        session.secret,
        options.clientPublicEphemeralKey,
        account.salt,
        account.key,
        account.verifier,
        options.clientSessionProofKey
      );

      const expiresAt = Date.now() + SESSION_EXPIRES_AT;

      await this.sessionsService.update(
        { id: session.id },
        { expiresAt: new Date(expiresAt) }
      );

      return {
        token: this.jwtService.sign({ id: account.id }),
        serverSessionProof: srpSession.proof,
      };
    } catch (e) {
      throw new ApiUnauthorizedException('The authentication fails');
    }
  }

  public async verifySession(
    sessionId: string,
    deviceId: string
  ): Promise<SessionVerifyResponse> {
    const session = await this.sessionsService.findOne({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: sessionId,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });

    if (!session) throw new ApiNotFoundException(`The session was not found`);

    if (session.expiresAt.getTime() < new Date().getTime())
      throw new ApiForbiddenException('The session is expired');

    if (
      session.verificationStage.name !== SessionVerificationStageEnum.REQUIRED
    )
      return {
        stage: session.verificationStage.name as SessionVerificationStageEnum,
      };

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: {
        id: deviceId,
        isDeleted: false,
      },
    });

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    if (device.id !== session.verificationDevice.deviceId) {
      throw new ApiForbiddenException(
        `The got device is not for verifying the session`
      );
    }

    const verificationStage = await this.sessionsService.findOneVerificationStage(
      {
        select: ['id'],
        where: {
          name: SessionVerificationStageEnum.COMPLETED,
          isDeleted: false,
        },
      }
    );

    if (!verificationStage)
      throw new ApiInternalServerException(
        `The '${SessionVerificationStageEnum.COMPLETED}' session verify stage was not found`
      );

    await this.sessionsService.update(
      { id: session.id },
      { verificationStageId: verificationStage.id }
    );

    await this.authGateway.updatedSessionVerifyStage(session.id);

    return {
      stage: SessionVerificationStageEnum.COMPLETED,
    };
  }

  public async refreshToken(sessionId: string): Promise<RefreshTokenResponse> {
    const session = await this.sessionsService.findOne({
      select: ['id', 'expiresAt', 'account'],
      where: {
        id: sessionId,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          account: 'sessions.account',
        },
      },
    });

    if (!session) throw new ApiNotFoundException(`The session was not found`);

    if (session.expiresAt.getTime() < Date.now())
      throw new ApiForbiddenException('The session is expired');

    await this.sessionsService.update(
      { id: session.id },
      { expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT) }
    );

    return {
      token: this.jwtService.sign({ id: session.account.id }),
    };
  }
}

export default AuthService;
