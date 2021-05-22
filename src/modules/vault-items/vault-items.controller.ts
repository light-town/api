import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import TeamMembersService from '../team-members/team-members.service';
import { CreateVaultItemPayload, VaultItem } from './vault-items.dto';
import VaultItemsService from './vault-items.service';

@ApiTags('/items')
@AuthGuard()
@Controller()
export class VaultItemsController {
  public constructor(
    private readonly vaultItemsService: VaultItemsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly keySetObjectsService: KeySetObjectsService,
    private readonly rolesService: RolesService
  ) {}

  @ApiCreatedResponse({ type: VaultItem })
  @Post('/vaults/:vaultUuid/items')
  public async createVaultItem(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Body() payload: CreateVaultItemPayload
  ): Promise<VaultItem> {
    return this.vaultItemsService.format(
      await this.vaultItemsService.create(account.id, vaultUuid, null, {
        encOverview: payload?.encOverview,
        encDetails: payload?.encDetails,
        categoryId: payload?.categoryUuid,
      })
    );
  }

  @ApiCreatedResponse({ type: VaultItem })
  @Post('/vaults/:vaultUuid/folders/:folderUuid/items')
  public async createVaultItemInFolder(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Body() payload: CreateVaultItemPayload
  ): Promise<VaultItem> {
    return this.vaultItemsService.format(
      await this.vaultItemsService.create(account.id, vaultUuid, folderUuid, {
        encOverview: payload?.encOverview,
        encDetails: payload?.encDetails,
        categoryId: payload?.categoryUuid,
      })
    );
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/vaults/:vaultUuid/folders/:folderUuid/items')
  public async getVaultItemsFromFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Query('only-overview') onlyOverview?: string
  ): Promise<VaultItem[]> {
    return this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        {
          vaultId: vaultUuid,
          folderId: folderUuid,
        },
        onlyOverview === 'true'
      )
    );
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/vaults/:vaultUuid/folders/:folderUuid/items/:vaultItemUuid')
  public async getVaultItemFromFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: string
  ): Promise<VaultItem> {
    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
        vaultId: vaultUuid,
        folderId: folderUuid,
      },
      onlyOverview === 'true'
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/vaults/:vaultUuid/items')
  public async getVaultItems(
    @Param('vaultUuid') vaultUuid: string,
    @Query('folder-uuid') folderUuid?: string,
    @Query('only-overview') onlyOverview?: string
  ): Promise<VaultItem[]> {
    return this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        {
          vaultId: vaultUuid,
          folderId: folderUuid === 'null' ? null : folderUuid,
        },
        onlyOverview === 'true'
      )
    );
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/vaults/:vaultUuid/items/:vaultItemUuid')
  public async getVaultItem(
    @Param('vaultUuid') vaultUuid: string,
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: string
  ): Promise<VaultItem> {
    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
        vaultId: vaultUuid,
      },
      onlyOverview === 'true'
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/teams/:teamUuid/vaults/:vaultUuid/items')
  public async getTeamVaultItems(
    @CurrentTeamMember() teamMember,
    @Param('vaultUuid') vaultUuid: string,
    @Query('folder-uuid') folderUuid?: string,
    @Query('only-overview') onlyOverview?: string
  ): Promise<VaultItem[]> {
    const vaultItems = this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        {
          vaultId: vaultUuid,
          folderId: folderUuid === 'null' ? null : folderUuid,
        },
        onlyOverview === 'true'
      )
    );

    const validatedVaultItems = await Promise.all(
      vaultItems.map(async i => {
        return {
          vaultItem: i,
          validated: await this.rolesService.validateOrFail(
            teamMember.id,
            i.uuid,
            ObjectTypesEnum.ITEM,
            PermissionTypesEnum.READ_ONLY
          ),
        };
      })
    );

    return validatedVaultItems.filter(i => i.validated).map(i => i.vaultItem);
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/teams/:teamUuid/vaults/:vaultUuid/items/:vaultItemUuid')
  public async getTeamVaultItem(
    @CurrentTeamMember() teamMember,
    @Param('vaultUuid') vaultUuid: string,
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: string
  ): Promise<VaultItem> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      vaultItemUuid,
      ObjectTypesEnum.ITEM,
      PermissionTypesEnum.READ_ONLY
    );

    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
        vaultId: vaultUuid,
      },
      onlyOverview === 'true'
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/items')
  public async getItems(
    @CurrentAccount() account,
    @Query('team-uuid') teamUuid?: string,
    @Query('vault-uuid') vaultUuid?: string,
    @Query('folder-uuid') folderUuid?: string,
    @Query('only-overview') onlyOverview?: string
  ): Promise<VaultItem[]> {
    const keySetObjects = await this.keySetObjectsService.getKeySetObjects({
      keySetOwnerAccountId: account.id,
      vaultId: vaultUuid,
      teamId: teamUuid,
    });

    const [accountVaultIds, accountTeamIds] = keySetObjects.reduce<
      [string[], string[]]
    >(
      (prev, val) => {
        if (val.vaultId) {
          return [[...prev[0], val.vaultId], prev[1]];
        } else if (val.teamId) {
          return [prev[0], [...prev[1], val.teamId]];
        }
      },
      [[], []]
    );

    const teamVaultIds: [string, string[]][] = await Promise.all(
      accountTeamIds.map<Promise<[string, string[]]>>(async teamId => {
        const teamKeySetIds = await this.keySetObjectsService.getKeySetIds({
          keySetOwnerTeamId: teamId,
        });

        const vaultIdsByKeySet = await Promise.all(
          teamKeySetIds.map(keySetId =>
            this.keySetObjectsService.getVaultIds(keySetId)
          )
        );

        return [
          teamId,
          vaultIdsByKeySet.reduce((prev, val) => [...prev, ...val], []),
        ];
      })
    );

    const [accountVaultItems, teamVaultItems] = await Promise.all([
      (
        await Promise.all(
          accountVaultIds.map(vaultId =>
            this.getVaultItems(vaultId, folderUuid, onlyOverview)
          )
        )
      ).reduce((prev: VaultItem[], val: VaultItem[]) => [...prev, ...val], []),
      (
        await Promise.all(
          teamVaultIds.map(async ([teamId, vaultIds]) => {
            const teamMember = await this.teamMembersService.getTeamMember({
              accountId: account.id,
              teamId,
            });
            return (
              await Promise.all(
                vaultIds.map(vaultId =>
                  this.getTeamVaultItems(
                    teamMember.id,
                    vaultId,
                    folderUuid,
                    onlyOverview
                  )
                )
              )
            ).reduce(
              (prev: VaultItem[], val: VaultItem[]) => [...prev, ...val],
              []
            );
          })
        )
      ).reduce((prev: VaultItem[], val: VaultItem[]) => [...prev, ...val], []),
    ]);

    return [...accountVaultItems, ...teamVaultItems];
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/items/:vaultItemUuid')
  public async getItem(
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: string
  ): Promise<VaultItem> {
    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
      },
      onlyOverview === 'true'
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }
}

export default VaultItemsController;
