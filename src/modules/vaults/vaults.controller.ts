import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '~/modules/auth/auth.guard';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import { Vault, CreateVaultPayload } from './vaults.dto';
import VaultsService from './vaults.service';

@AuthGuard()
@ApiTags('accounts/vaults')
@Controller()
export class VaultsController {
  public constructor(
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService
  ) {}

  @ApiOkResponse({ type: Vault })
  @Post('/accounts/:accountUuid/vaults')
  public async createVault(
    @Param('accountUuid') accountUuid: string,
    @Body() payload: CreateVaultPayload
  ): Promise<Vault> {
    const newVault = await this.vaultsService.create(payload.vault);

    await this.keySetsService.create(accountUuid, newVault.id, payload.keySet);

    return this.vaultsService.format(newVault);
  }

  @ApiOkResponse({ type: [Vault] })
  @Get('/accounts/:accountUuid/vaults')
  public async getVaults(
    @Param('accountUuid') accountUuid: string
  ): Promise<Vault[]> {
    return this.vaultsService.formatAll(
      await this.vaultsService.getVaults(accountUuid)
    );
  }

  @ApiOkResponse({ type: Vault })
  @Get('/accounts/:accountUuid/vaults/:vaultUuid')
  public async getVault(
    @Param('accountUuid') accountUuid: string,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<Vault> {
    return this.vaultsService.format(
      await this.vaultsService.getVault(vaultUuid)
    );
  }

  @Delete('/accounts/:accountUuid/vaults/:vaultUuid')
  public async deleteVault(
    @Param('accountUuid') accountUuid: string,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<void> {
    const keySets = await this.keySetsService.getKeySets({
      vaultId: vaultUuid,
    });

    await Promise.all([
      keySets.map(keySet => this.keySetsService.deleteKeySet(keySet.id)),
      this.vaultsService.deleteVault(vaultUuid),
    ]);
  }
}

export default VaultsController;
