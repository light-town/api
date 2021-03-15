import { Injectable } from '@nestjs/common';
import { SignUpDTO, SignInDTO, StartSessionDTO } from './auth.dto';
import core from '@light-town/core';
import { AccountsService } from '../accounts/accounts.service';
import { UsersService } from '../users/users.service';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  public constructor(
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
    @InjectConnection()
    private readonly connection: Connection
  ) {}

  public async signUp(options: SignUpDTO): Promise<void> {
    await this.connection.transaction(async () => {
      const user = await this.usersService.create(options.username, {
        avatarURL: options.avatarURL,
      });

      const account = await this.accountsService.create({
        key: options.accountKey,
        userId: user.id,
        verifier: options.verifier,
        salt: options.salt,
      });
    });
  }

  public async signIn(options: SignInDTO) {
    const { accountKey } = options;

    const account = await this.accountsService.findOne({
      select: ['salt', 'verifier'],
      where: { key: accountKey },
    });

    if (!account) {
      return {
        salt: core.common.genSalt(),
        serverPublicEphemeral: core.common.genSalt(),
      };
    }

    const ephemeral = core.srp.server.generateEphemeral(account.verifier);

    return {
      salt: account.salt,
      serverPublicEphemeral: ephemeral.public,
    };
  }
}

export default AuthService;
