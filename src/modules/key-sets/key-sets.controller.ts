import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import { KeySet } from './key-sets.dto';
import KeySetsService from './key-sets.service';

@ApiTags('/accounts/key-sets')
@Controller()
export class KeySetsController {
  public constructor(private readonly keySetsService: KeySetsService) {}

  @ApiOkResponse({ type: [KeySet] })
  @AuthGuard()
  @Get('/accounts/:accountUuid/key-sets')
  public async getKeySets(
    @Param('accountUuid') accountUuid: string,
    @Query('primary') primary: boolean
  ): Promise<KeySet[]> {
    if (primary)
      return [await this.keySetsService.getPrimaryKeySet(accountUuid)];

    return this.keySetsService.getKeySets(accountUuid);
  }
}

export default KeySetsController;
