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
import { v3 } from 'uuid';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AuthGuard from '~/modules/auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
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
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService
  ) {}

  @ApiOkResponse({ type: Vault })
  @Post('/vaults')
  public async createVault(
    @CurrentAccount() account,
    @Body() payload: CreateVaultPayload
  ): Promise<Vault> {
    const primaryKeySet = await this.keySetsService.getKeySet({
      ownerAccountId: account.id,
      creatorAccountId: account.id,
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
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      creatorAccountId: account.id,
      isVault: true,
    });

    const foundVaults: Vault[] = [];

    for (const keySetObject of keySetObjects) {
      const vault = await this.vaultsService.getVault({
        id: keySetObject.vaultId,
      });

      foundVaults.push(
        this.vaultsService.format(vault, account.id, keySetObject.keySetId)
      );
    }

    return foundVaults;
  }

  @ApiOkResponse({ type: Vault })
  @Get('/vaults/:vaultUuid')
  public async getVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<Vault> {
    const keySetObject = await this.keySetObjectsService.getKeySetObject({
      vaultId: vaultUuid,
      ownerAccountId: account.id,
      creatorAccountId: account.id,
    });

    if (!keySetObject)
      throw new ApiForbiddenException('The key set object was not found');

    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    return this.vaultsService.format(vault, account.id, keySetObject.keySetId);
  }

  @Delete('/vaults/:vaultUuid')
  public async deleteVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<void> {
    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      vaultId: vault.id,
      creatorAccountId: account.id,
    });

    if (!keySetObjects.length)
      throw new ApiForbiddenException('The key set objects was not found');

    const keySetIds = await keySetObjects.map(kso => kso.keySetId);
    const keySets = await this.keySetsService.getKeySets({ ids: keySetIds });

    for (const keySet of keySets) {
      if (keySet.isPrimary) continue;

      const vaultsCount = await this.keySetObjectsService.getVaultIds(
        keySet.id
      );

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
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetId: keySetUuid,
      ownerAccountId: account.id,
    });

    const availableVaultIds = keySetObjects.map(kso => kso.vaultId);

    const vaults = await this.vaultsService.getVaults({
      ids: availableVaultIds,
    });

    return vaults.map(v =>
      this.vaultsService.format(v, account.id, keySetUuid)
    );
  }

  @ApiOkResponse({ type: Vault })
  @Get('/key-sets/:keySetUuid/vaults/:vaultUuid')
  public async getKeySetVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Param('keySetUuid') keySetUuid: string
  ): Promise<Vault> {
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetId: keySetUuid,
      vaultId: vaultUuid,
      creatorAccountId: account.id,
    });

    const availableVaultIds = keySetObjects.map(kso => kso.vaultId);

    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    if (!availableVaultIds.includes(vault.id))
      throw new ApiNotFoundException('The vault was not found');

    return this.vaultsService.format(vault, account.id, keySetUuid);
  }
}

export default VaultsController;
