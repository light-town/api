import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Inject,
  forwardRef,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AuthGuard from '~/modules/auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import KeySetsService from '../key-sets/key-sets.service';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
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
    private readonly keySetObjectsService: KeySetObjectsService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService
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

    const newVault = await this.vaultsService.createVault(
      account.id,
      primaryKeySet.id,
      payload
    );

    return this.vaultsService.format({
      ...newVault,
      ownerAccountId: account.id,
      keySetId: primaryKeySet.id,
    });
  }

  @ApiOkResponse({ type: [Vault] })
  @Get('/vaults')
  public async getVaults(@CurrentAccount() account): Promise<Vault[]> {
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetOwnerAccountId: account.id,
      isVault: true,
    });

    const vaultsIds = keySetObjects.map(k => k.vaultId);
    const keySets = keySetObjects.reduce(
      (prev, val) => ({ ...prev, [val.vaultId]: val.keySetId }),
      {}
    );

    const vaults = await this.vaultsService.getVaults({
      ids: vaultsIds,
    });

    return vaults.map(v =>
      this.vaultsService.format({
        ...v,
        ownerAccountId: account.id,
        keySetId: keySets[v.id],
      })
    );
  }

  @ApiOkResponse({ type: Vault })
  @Get('/vaults/:vaultUuid')
  public async getVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<Vault> {
    const keySetObject = await this.keySetObjectsService.getKeySetObject({
      keySetOwnerAccountId: account.id,
      vaultId: vaultUuid,
    });

    if (!keySetObject)
      throw new ApiForbiddenException('The key set object was not found');

    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    return this.vaultsService.format({
      ...vault,
      ownerAccountId: account.id,
      keySetId: keySetObject.keySetId,
    });
  }

  @Delete('/vaults/:vaultUuid')
  public async deleteVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<void> {
    const vault = await this.vaultsService.getVault({ id: vaultUuid });

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetOwnerAccountId: account.id,
      vaultId: vault.id,
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

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @ApiOkResponse({ type: Vault })
  @Post('/teams/:teamUuid/vaults')
  public async createTeamVault(
    @CurrentAccount() account,
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateVaultPayload
  ): Promise<Vault> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    const primaryKeySet = await this.keySetsService.getKeySet({
      ownerTeamId: teamUuid,
      isPrimary: true,
    });

    const newVault = await this.vaultsService.createVault(
      account.id,
      primaryKeySet.id,
      payload
    );

    return this.vaultsService.format({
      ...newVault,
      ownerTeamId: teamUuid,
      keySetId: primaryKeySet.id,
    });
  }

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @ApiOkResponse({ type: [Vault] })
  @Get('/teams/:teamUuid/vaults')
  public async getTeamVaults(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<Vault[]> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetOwnerTeamId: teamUuid,
      isVault: true,
    });

    const vaultsIds = keySetObjects.map(k => k.vaultId);
    const keySets = keySetObjects.reduce(
      (prev, val) => ({ ...prev, [val.vaultId]: val.keySetId }),
      {}
    );

    const vaults = await this.vaultsService.getVaults({
      ids: vaultsIds,
    });

    return vaults.map(v =>
      this.vaultsService.format({
        ...v,
        ownerTeamId: teamUuid,
        keySetId: keySets[v.id],
      })
    );
  }

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @ApiOkResponse({ type: Vault })
  @Get('/teams/:teamUuid/vaults/:vaultUuid')
  public async getTeamVault(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<Vault> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    const keySetObject = await this.keySetObjectsService.getKeySetObject({
      keySetOwnerTeamId: teamUuid,
      vaultId: vaultUuid,
    });

    if (!keySetObject)
      throw new ApiNotFoundException(`The vault was not found`);

    const vault = await this.vaultsService.getVault({
      id: keySetObject.vaultId,
    });

    return this.vaultsService.format({
      ...vault,
      ownerTeamId: teamUuid,
      keySetId: keySetObject.keySetId,
    });
  }

  @ApiOkResponse({ type: [Vault] })
  @Get('/key-sets/:keySetUuid/vaults')
  public async getKeySetVaults(
    @CurrentAccount() account,
    @Param('keySetUuid') keySetUuid: string
  ): Promise<Vault[]> {
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetOwnerAccountId: account.id,
      keySetId: keySetUuid,
      isVault: true,
    });

    const vaultsIds = keySetObjects.map(k => k.vaultId);
    const keySets = keySetObjects.reduce(
      (prev, val) => ({ ...prev, [val.vaultId]: val.keySetId }),
      {}
    );

    const vaults = await this.vaultsService.getVaults({
      ids: vaultsIds,
    });

    return vaults.map(v =>
      this.vaultsService.format({
        ...v,
        ownerAccountId: account.id,
        keySetId: keySets[v.id],
      })
    );
  }

  @ApiOkResponse({ type: Vault })
  @Get('/key-sets/:keySetUuid/vaults/:vaultUuid')
  public async getKeySetVault(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Param('keySetUuid') keySetUuid: string
  ): Promise<Vault> {
    const keySetObject = await this.keySetObjectsService.getKeySetObject({
      keySetOwnerAccountId: account.id,
      keySetId: keySetUuid,
      vaultId: vaultUuid,
    });

    if (!keySetObject)
      throw new ApiNotFoundException('The vault was not found');

    const vault = await this.vaultsService.getVault({
      id: keySetObject.vaultId,
    });

    return this.vaultsService.format({
      ...vault,
      ownerAccountId: account.id,
      keySetId: keySetObject.keySetId,
    });
  }
}

export default VaultsController;
