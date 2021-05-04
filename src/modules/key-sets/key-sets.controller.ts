import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { KeySet } from './key-sets.dto';
import KeySetsService, { FindKeySetOptions } from './key-sets.service';

@ApiTags('/key-sets')
@AuthGuard()
@Controller()
export class KeySetsController {
  public constructor(private readonly keySetsService: KeySetsService) {}

  @ApiOkResponse({ type: [KeySet] })
  @Get('/key-sets')
  public async getKeySets(
    @CurrentAccount() account,
    @Query('primary') primary: string
  ): Promise<KeySet[]> {
    const options: FindKeySetOptions = { ownerAccountId: account.id };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.formatAll(
      await this.keySetsService.getKeySets(options)
    );
  }

  @ApiOkResponse({ type: KeySet })
  @Get('/key-sets/:keySetUuid')
  public async getKeySet(
    @CurrentAccount() account,
    @Param('keySetUuid') keySetUuid: string,
    @Query('primary') primary: string
  ): Promise<KeySet> {
    const options: FindKeySetOptions = {
      id: keySetUuid,
      ownerAccountId: account.id,
    };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.format(
      await this.keySetsService.getKeySet(options)
    );
  }

  @ApiOkResponse({ type: KeySet })
  @Get('/accounts/:accountUuid/key-sets')
  public async getAccountPrimaryKeySet(
    @Param('accountUuid') accountUuid: string
  ): Promise<KeySet> {
    const options: FindKeySetOptions = {
      ownerAccountId: accountUuid,
      isPrimary: true,
    };

    return this.keySetsService.format(
      await this.keySetsService.getKeySet(options)
    );
  }
}

export default KeySetsController;
