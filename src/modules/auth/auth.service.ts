import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SignUpPayload,
  SignInPayload,
  StartSessionPayload,
  StartSessionResponse,
  SignInResponse,
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
          where: { id: options.deviceUuid },
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
      select: ['id', 'salt', 'verifier'],
      where: { key: options.accountKey },
    });

    if (!account) {
      return {
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
      };
    }

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: options.deviceUuid },
    });

    if (!device) {
      return {
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
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
      }))
      .catch(() => ({
        sessionUuid: uuid.v4(),
        salt: core.common.generateRandomSalt(32),
        serverPublicEphemeral: core.common.generateRandomSalt(32),
      }));
  }

  public async startSession(
    options: StartSessionPayload
  ): Promise<StartSessionResponse> {
    const sessionEntity = await this.sessionsService.findOne({
      select: ['id', 'secret', 'accountId'],
      where: { id: options.sessionUuid },
    });

    if (!sessionEntity)
      return {
        token: this.jwtService.sign({ userId: undefined }, { expiresIn: 1 }),
        serverSessionProof: uuid.v4(),
      };

    const account = await this.accountsService.findOne({
      select: ['salt', 'key', 'verifier'],
      where: { id: sessionEntity.accountId },
    });

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
