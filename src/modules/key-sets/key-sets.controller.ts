import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import { KeySet } from './key-sets.dto';
import KeySetsService, { FindKeySetOptions } from './key-sets.service';

@ApiTags('/accounts/key-sets')
@AuthGuard()
@Controller()
export class KeySetsController {
  public constructor(private readonly keySetsService: KeySetsService) {}

  @ApiOkResponse({ type: [KeySet] })
  @Get('/accounts/:accountUuid/key-sets')
  public async getKeySets(
    @Param('accountUuid') accountUuid: string,
    @Query('primary') primary: boolean
  ): Promise<KeySet[]> {
    const options: FindKeySetOptions = { ownerAccountId: accountUuid };

    if (primary) options.isPrimary = true;

    return this.keySetsService.formatAll(
      await this.keySetsService.getKeySets(options)
    );
  }
}

export default KeySetsController;
