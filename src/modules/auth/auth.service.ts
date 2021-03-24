import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  SignUpPayload,
  SignInPayload,
  StartSessionPayload,
  StartSessionResponse,
  SignInResponse,
  MFATypesEnum,
  VerifySessionPayload,
  VerifySessionResponse,
} from './auth.dto';
import core from '@light-town/core';
import { AccountsService } from '../accounts/accounts.service';
import { UsersService } from '../users/users.service';
import { Connection, MoreThan } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { SessionsService } from '../sessions/sessions.service';
import DevicesService from '../devices/devices.service';
import * as uuid from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { VerifySessionStageEnum } from '../sessions/sessions.dto';
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
    private readonly authGateway: AuthGateway
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

      if (!device) throw new NotFoundException(`The device was not found`);

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

  public async signIn(options: SignInPayload): Promise<SignInResponse> {
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

    if (!account) {
      return {
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
        mfaType: MFATypesEnum.NONE,
      };
    }

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: options.deviceUuid, isDeleted: false },
    });

    if (!device) {
      return {
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
        mfaType: MFATypesEnum.NONE,
      };
    }

    const ephemeral = core.srp.server.generateEphemeral(account.verifier);

    return this.sessionsService
      .create({
        secret: ephemeral.secret,
        accountId: account.id,
        deviceId: device.id,
      })
      .then(session => ({
        sessionUuid: session.id,
        salt: account.salt,
        serverPublicEphemeral: ephemeral.public,
        mfaType: account.mfaType.name,
      }))
      .catch(() => ({
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
        mfaType: MFATypesEnum.NONE,
      }));
  }

  public async startSession(
    options: StartSessionPayload
  ): Promise<StartSessionResponse> {
    const sessionEntity = await this.sessionsService.findOne({
      select: ['id', 'secret', 'accountId', 'verifyStage'],
      where: {
        id: options.sessionUuid,
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
      return {
        token: this.jwtService.sign({ userId: undefined }, { expiresIn: 1 }),
        serverSessionProof: uuid.v4(),
      };

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
    ) {
      throw new ForbiddenException(`The session was not verified`);
    }

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
    payload: VerifySessionPayload
  ): Promise<VerifySessionResponse> {
    const session = await this.sessionsService.findOne({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: payload.sessionUuid,
        isDeleted: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) throw new NotFoundException(`The session was not found`);

    if (session.verifyStage.name !== VerifySessionStageEnum.REQUIRED)
      return {
        stage: session.verifyStage.name as VerifySessionStageEnum,
      };

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: {
        id: payload.deviceUuid,
        isDeleted: false,
      },
    });

    if (!device) throw new NotFoundException(`The device was not found`);

    if (device.id === session.deviceId) {
      throw new ForbiddenException(
        `The device to verify the session should be other than the device that created the session`
      );
    }

    const verifyStage = await this.sessionsService.findOneVerifyStage({
      select: ['id'],
      where: { name: VerifySessionStageEnum.COMPLETED, isDeleted: false },
    });

    if (!verifyStage)
      throw new InternalServerErrorException(
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
