import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SignUpPayload,
  SignInPayload,
  StartSessionPayload,
  StartSessionResponse,
  SignInResponse,
  MFATypesEnum,
} from './auth.dto';
import core from '@light-town/core';
import { AccountsService } from '../accounts/accounts.service';
import { UsersService } from '../users/users.service';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { SessionsService } from '../sessions/sessions.service';
import DevicesService from '../devices/devices.service';
import * as uuid from 'uuid';
import { JwtService } from '@nestjs/jwt';

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
    private readonly connection: Connection
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
      select: ['id', 'secret', 'accountId'],
      where: { id: options.sessionUuid, isDeleted: false },
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

    if (account.mfaType?.name !== MFATypesEnum.NONE) {
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
}

export default AuthService;
