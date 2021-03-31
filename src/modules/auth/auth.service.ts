import { Connection, MoreThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import core from '@light-town/core';
import {
  ApiConflictException,
  ApiForbiddenException,
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AccountsService from '~/modules/accounts/accounts.service';
import UsersService from '~/modules/users/users.service';
import SessionsService from '~/modules/sessions/sessions.service';
import DevicesService from '~/modules/devices/devices.service';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';
import PushNotificationsService from '~/modules/push-notifications/push-notifications.service';
import {
  SignUpPayload,
  SessionCreatePayload,
  SessionCreateResponse,
  SessionStartPayload,
  SessionStartResponse,
  SessionVerifyResponse,
  MFATypesEnum,
} from './auth.dto';
import AuthGateway from './auth.gateway';

export const SESSION_EXPIRES_AT = 10 * 60 * 1000; // 10 minutes
@Injectable()
export class AuthService {
  public constructor(
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly authGateway: AuthGateway,
    private readonly pushNotificationsService: PushNotificationsService
  ) {}

  public async signUp(options: SignUpPayload): Promise<void> {
    await this.connection.transaction(async manager => {
      const device = await this.devicesService.findOne(
        {
          select: ['id'],
          where: { id: options.deviceUuid, isDeleted: false },
        },
        manager
      );

      if (!device) throw new ApiNotFoundException(`The device was not found`);

      const user = await this.usersService.create(
        {
          name: options.username,
          avatarUrl: options.avatarUrl,
        },
        manager
      );

      await this.accountsService.create(
        {
          key: options.accountKey,
          userId: user.id,
          verifier: options.verifier,
          salt: options.salt,
        },
        manager
      );
    });
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
      const lastVerifiedSessionsByMobileDevices = (
        await this.sessionsService.getLastVerifiedSessionsByMobileDevices(
          account.id
        )
      ).filter(session => session.deviceId !== device.id);

      if (!lastVerifiedSessionsByMobileDevices.length)
        throw new ApiInternalServerException(`The verify device was not found`);

      await this.pushNotificationsService.send(
        lastVerifiedSessionsByMobileDevices[0].deviceId,
        {
          action: 'VerifySession',
          sessionUuid: session.id,
        }
      );

      return {
        sessionUuid: session.id,
        salt: account.salt,
        serverPublicEphemeral: ephemeral.public,
        sessionVerify: {
          stage: VerifySessionStageEnum.REQUIRED,
          MFAType: account.mfaType.name,
        },
      };
    }

    const verifyStage = await this.sessionsService.findOneVerifyStage({
      select: ['id'],
      where: { name: VerifySessionStageEnum.COMPLETED, isDeleted: false },
    });

    if (!verifyStage)
      throw new ApiInternalServerException(
        `The '${VerifySessionStageEnum.COMPLETED}' session verify stage was not found`
      );

    await this.sessionsService.update(
      { id: session.id },
      { verifyStageId: verifyStage.id }
    );

    return {
      sessionUuid: session.id,
      salt: account.salt,
      serverPublicEphemeral: ephemeral.public,
      sessionVerify: {
        stage: VerifySessionStageEnum.NOT_REQUIRED,
        MFAType: account.mfaType.name,
      },
    };
  }

  public async startSession(
    sessionUuid: string,
    options: SessionStartPayload
  ): Promise<SessionStartResponse> {
    const sessionEntity = await this.sessionsService.findOne({
      select: ['id', 'secret', 'accountId', 'verifyStage'],
      where: {
        id: sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
        },
      },
    });

    if (!sessionEntity)
      throw new ApiNotFoundException(`The session was not found`);

    const account = await this.accountsService.findOne({
      select: ['id', 'salt', 'key', 'verifier', 'mfaType'],
      where: { id: sessionEntity.accountId, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    if (
      sessionEntity.verifyStage.name !== VerifySessionStageEnum.NOT_REQUIRED &&
      sessionEntity.verifyStage.name !== VerifySessionStageEnum.COMPLETED
    )
      throw new ApiForbiddenException(`The session was not verified`);

    const session = core.srp.server.deriveSession(
      sessionEntity.secret,
      options.clientPublicEphemeralKey,
      account.salt,
      account.key,
      account.verifier,
      options.clientSessionProofKey
    );

    const expiresAt = new Date().getTime() + SESSION_EXPIRES_AT;

    await this.sessionsService.update(
      { id: sessionEntity.id },
      { expiresAt: new Date(expiresAt) }
    );

    return {
      token: this.jwtService.sign(
        { userId: account.userId },
        { expiresIn: expiresAt }
      ),
      serverSessionProof: session.proof,
    };
  }

  public async verifySession(
    sessionUuid: string,
    deviceUuid: string
  ): Promise<SessionVerifyResponse> {
    const session = await this.sessionsService.findOne({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: sessionUuid,
        isDeleted: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) throw new ApiNotFoundException(`The session was not found`);

    if (session.verifyStage.name !== VerifySessionStageEnum.REQUIRED)
      return {
        stage: session.verifyStage.name as VerifySessionStageEnum,
      };

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: {
        id: deviceUuid,
        isDeleted: false,
      },
    });

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    if (device.id === session.deviceId) {
      throw new ApiConflictException(
        `The device to verify the session should be other than the device that created the session`
      );
    }

    const verifyStage = await this.sessionsService.findOneVerifyStage({
      select: ['id'],
      where: { name: VerifySessionStageEnum.COMPLETED, isDeleted: false },
    });

    if (!verifyStage)
      throw new ApiInternalServerException(
        `The '${VerifySessionStageEnum.COMPLETED}' session verify stage was not found`
      );

    await this.sessionsService.update(
      { id: session.id },
      { verifyStageId: verifyStage.id }
    );

    await this.authGateway.updatedSessionVerifyStage(session.id);

    return {
      stage: VerifySessionStageEnum.COMPLETED,
    };
  }
}

export default AuthService;
