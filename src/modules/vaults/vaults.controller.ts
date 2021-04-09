import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AuthGuard from '~/modules/auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import KeySetVaultsService from '../key-set-vaults/key-set-vaults.service';
import KeySetsService from '../key-sets/key-sets.service';
import { Vault, CreateVaultPayload } from './vaults.dto';
import VaultsService from './vaults.service';

@AuthGuard()
@ApiTags('/vaults')
@Controller('/vaults')
export class VaultsController {
  public constructor(
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => KeySetVaultsService))
    private readonly keySetVaultsService: KeySetVaultsService
  ) {}

  @ApiOkResponse({ type: Vault })
  @Post()
  public async createVault(
    @CurrentAccount() account,
    @Body() payload: CreateVaultPayload
  ): Promise<Vault> {
    /// [TODO] check permitions

    const primaryKeySet = await this.keySetsService.getKeySet({
      ownerAccountId: account.id,
      isPrimary: true,
    });

    return this.vaultsService.format(
      await this.vaultsService.create(account.id, payload),
      account.id,
      primaryKeySet?.id
    );
  }

  @ApiOkResponse({ type: [Vault] })
  @Get()
  public async getVaults(@CurrentAccount() account): Promise<Vault[]> {
    /// [TODO] check permitions
    /// [TODO] endpoint for getting the vaults of the key set - /key-sets/:keySetUuid/vaults/

    const foundKeySets = await this.keySetsService.getKeySets({
      ownerAccountId: account.id,
    });

    const foundVaults: Vault[] = [];

    for (const keySet of foundKeySets) {
      const vaults = await this.vaultsService.getVaults(keySet.id);

      for (const vault of vaults) {
        foundVaults.push(
          this.vaultsService.format(vault, account.id, keySet.id)
        );
      }
    }

    return foundVaults;
  }

  @ApiOkResponse({ type: Vault })
  @Get('/:vaultUuid')
  public async getVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<Vault> {
    /// [TODO] check permitions

    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    const keySet = await this.keySetVaultsService.getKeySet(vault.id);

    if (!keySet)
      throw new ApiInternalServerException('The key set was not found');

    return this.vaultsService.format(vault, account.id, keySet.id);
  }

  @Delete('/:vaultUuid')
  public async deleteVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<void> {
    /// [TODO] check permitions
    /// [TODO] delete key set ???

    await this.vaultsService.deleteVault(vaultUuid);
  }
}

export default VaultsController;
