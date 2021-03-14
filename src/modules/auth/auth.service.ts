import { Injectable } from '@nestjs/common';
import { SignUpDTO, SignInDTO } from './auth.dto';
import { srp } from '@light-town/core';
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
        userId: user.id,
        verifier: options.verifier,
        salt: options.salt,
      });
    });
  }
}

export default AuthService;
