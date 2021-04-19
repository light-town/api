import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiForbiddenException } from '~/common/exceptions';
import AuthGuard from '~/modules/auth/auth.guard';
import AccountsService, { FindAccountOptions } from './accounts.service';
import { Account, SetMultiFactorAuthPayload } from './accounts.dto';
import CurrentAccount from '../auth/current-account';

@Controller()
export default class AccountsController {
  public constructor(private readonly accountsService: AccountsService) {}

  @ApiTags('/accounts')
  @ApiOkResponse({ type: [Account] })
  @Get('/accounts')
  public async getAccounts(
    @Query('key') accountKey: string
  ): Promise<Account[]> {
    const options: FindAccountOptions = {};

    if (accountKey) options.key = accountKey;

    return this.accountsService.formatAll(
      await this.accountsService.getAccounts(options)
    );
  }

  // [TODO] Replace to settings controller
  @AuthGuard()
  @ApiTags('/accounts/settings')
  @Post('/accounts/:accountUuid/settings/multi-factor-auth')
  public setMultiFactorAuth(
    @CurrentAccount() account,
    @Param('accountUuid') accountUuid: string,
    @Body() payload: SetMultiFactorAuthPayload
  ): Promise<void> {
    if (account.id !== accountUuid)
      throw new ApiForbiddenException('Аccess denied');

    return this.accountsService.setMultiFactorAuthType(
      accountUuid,
      payload.deviceUuid,
      payload.type
    );
  }

  @AuthGuard()
  @Get('/me')
  public async getMe(@CurrentAccount() account): Promise<Account> {
    return this.accountsService.format(
      await this.accountsService.getAccount({
        id: account.id,
      })
    );
  }
}
