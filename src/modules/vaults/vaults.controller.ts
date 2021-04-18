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
@Controller()
export class VaultsController {
  public constructor(
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => KeySetVaultsService))
    private readonly keySetVaultsService: KeySetVaultsService
  ) {}

  @ApiOkResponse({ type: Vault })
  @Post('/vaults')
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
  @Get('/vaults')
  public async getVaults(@CurrentAccount() account): Promise<Vault[]> {
    /// [TODO] check permitions

    const foundKeySets = await this.keySetsService.getKeySets({
      ownerAccountId: account.id,
    });

    const foundVaults: Vault[] = [];

    for (const keySet of foundKeySets) {
      const vaults = await this.vaultsService.getVaultsByKeySet(keySet.id);

      for (const vault of vaults) {
        foundVaults.push(
          this.vaultsService.format(vault, account.id, keySet.id)
        );
      }
    }

    return foundVaults;
  }

  @ApiOkResponse({ type: Vault })
  @Get('/vaults/:vaultUuid')
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

  @Delete('/vaults/:vaultUuid')
  public async deleteVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<void> {
    /// [TODO] check permitions

    const keySets = await this.keySetVaultsService.getKeySets(vaultUuid);

    for (const keySet of keySets) {
      if (keySet.isPrimary) continue;

      const vaultsCount = await this.keySetVaultsService.getVaultIds(keySet.id);

      if (vaultsCount.length !== 1) continue;

      await this.keySetsService.deleteKeySet(keySet.id);
    }

    await this.vaultsService.deleteVault(vaultUuid);
  }

  @ApiOkResponse({ type: [Vault] })
  @Get('/key-sets/:keySetUuid/vaults')
  public async getKeySetVaults(
    @CurrentAccount() account,
    @Param('keySetUuid') keySetUuid: string
  ): Promise<Vault[]> {
    /// [TODO] check permitions

    if (
      !(await this.keySetsService.exists({
        id: keySetUuid,
        ownerAccountId: account.id,
      }))
    )
      throw new ApiNotFoundException('The key set was not found');

    const foundVaults = await this.vaultsService.getVaultsByKeySet(keySetUuid);

    const formatedVaults: Vault[] = [];

    for (const vault of foundVaults) {
      formatedVaults.push(
        this.vaultsService.format(vault, account.id, keySetUuid)
      );
    }

    return formatedVaults;
  }

  @ApiOkResponse({ type: Vault })
  @Get('/key-sets/:keySetUuid/vaults/:vaultUuid')
  public async getKeySetVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Param('keySetUuid') keySetUuid: string
  ): Promise<Vault> {
    /// [TODO] check permitions

    if (
      !(await this.keySetsService.exists({
        id: keySetUuid,
        ownerAccountId: account.id,
      }))
    )
      throw new ApiNotFoundException('The key set was not found');

    const foundVault = await this.vaultsService.getVault({ id: vaultUuid });
    const foundVaultIds = await this.keySetVaultsService.getVaultIds(
      keySetUuid
    );

    if (!foundVaultIds.includes(foundVault?.id))
      throw new ApiNotFoundException('The vault was not found');

    return this.vaultsService.format(foundVault, account.id, keySetUuid);
  }
}

export default VaultsController;
