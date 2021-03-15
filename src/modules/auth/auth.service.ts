import { Injectable } from '@nestjs/common';
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
    await this.connection.transaction(async () => {
      const user = await this.usersService.create(options.username, {
        avatarURL: options.avatarUrl,
      });

      const account = await this.accountsService.create({
        key: options.accountKey,
        userId: user.id,
        verifier: options.verifier,
        salt: options.salt,
      });

      const device = await this.devicesService.create({
        op: options.op,
        userAgent: options.userAgent,
        hostname: options.hostname,
      });
    });
  }

  public async signIn(options: SignInPayload): Promise<SignInResponse> {
    const { accountKey } = options;

    const account = await this.accountsService.findOne({
      select: ['salt', 'verifier'],
      where: { key: accountKey },
    });

    if (!account) {
      return {
        sessionId: uuid.v4(),
        salt: core.common.genSalt(),
        serverPublicEphemeral: core.common.genSalt(),
      };
    }

    const ephemeral = core.srp.server.generateEphemeral(account.verifier);

    return this.sessionsService
      .create({
        secret: ephemeral.secret,
        accountId: account.id,
        deviceId: options.deviceId,
      })
      .then(session => ({
        sessionId: session.id,
        salt: account.salt,
        serverPublicEphemeral: ephemeral.public,
      }))
      .catch(() => ({
        sessionId: uuid.v4(),
        salt: core.common.genSalt(),
        serverPublicEphemeral: core.common.genSalt(),
      }));
  }

  public async startSession(
    options: StartSessionPayload
  ): Promise<StartSessionResponse> {
    const sessionEntity = await this.sessionsService.findOne({
      select: ['id', 'secret', 'accountId'],
      where: { id: options.sessionId },
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
      options.clientPubicEphemeralKey,
      account.salt,
      account.key,
      account.verifier,
      options.clientSessionProofKey
    );

    const expiresAt = new Date().getTime() + SESSION_EXPIRES_AT;

    await this.sessionsService.update({ id: sessionEntity.id }, { expiresAt });

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
