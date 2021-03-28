import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';
import UsersService from '../users/users.service';
import AccountsService from './accounts.service';

@Controller('/accounts')
export default class AccountsController {
  public constructor(
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  public async getAccount(@Query('key') accountKey: string = null) {
    const account = await this.accountsService.findOne({
      select: ['id', 'mfaType', 'userId'],
      where: { key: accountKey, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    if (!account) throw new ApiNotFoundException('The account was not found');

    const user = await this.usersService.findOne({
      select: ['id', 'name', 'avatarUrl'],
      where: { id: account.userId },
    });

    if (!user)
      throw new ApiInternalServerException('The account user was not found');

    return {
      accountUuid: account.id,
      accountName: user.name,
      accountAvatarUrl: user.avatarUrl,
      userUuid: user.id,
      userName: user.name,
      userAvatarUrl: user.avatarUrl,
      MFAType: account.mfaType.name,
    };
  }
}
