import { Injectable, forwardRef, Inject } from '@nestjs/common';
import {
  ApiBadRequestException,
  ApiNotFoundException,
} from '~/common/exceptions';
import TeamEntity from '~/db/entities/team.entity';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import TeamsService from '../teams/teams.service';
import VaultFoldersService from '../vault-folders/vault-folders.service';
import VaultItemsService from '../vault-items/vault-items.service';
import VaultsService from '../vaults/vaults.service';
import { ObjectTypesEnum } from './roles.dto';

export type RouteObject = (
  | TeamEntity
  | VaultEntity
  | VaultFolderEntity
  | VaultItemEntity
) & { routeObjectType: ObjectTypesEnum };

@Injectable()
export class RouterService {
  public constructor(
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService,
    @Inject(forwardRef(() => VaultFoldersService))
    private readonly vaultFoldersService: VaultFoldersService,
    @Inject(forwardRef(() => VaultItemsService))
    private readonly vaultItemsService: VaultItemsService
  ) {}

  public async buildRoute(
    objectId: string,
    objectType: ObjectTypesEnum
  ): Promise<RouteObject[]> {
    switch (objectType) {
      case ObjectTypesEnum.TEAM: {
        return this.getTeamRoute(objectId);
      }
      case ObjectTypesEnum.VAULT: {
        return this.getVaultRoute(objectId);
      }
      case ObjectTypesEnum.FOLDER: {
        return this.getFolderRoute(objectId);
      }
      case ObjectTypesEnum.ITEM: {
        return this.getItemRoute(objectId);
      }
      default: {
        throw new ApiBadRequestException(`The object type was not found`);
      }
    }
  }

  private async getTeamRoute(teamId: string) {
    const team = await this.teamsService.getTeam({ id: teamId });

    if (!team) throw new ApiNotFoundException(`The team was not found`);

    return [{ ...team, routeObjectType: ObjectTypesEnum.TEAM }];
  }

  private async getVaultRoute(vaultId: string) {
    const vault = await this.vaultsService.getVault({ id: vaultId });

    if (!vault) throw new ApiNotFoundException(`The vault was not found`);

    const keySet = await this.keySetObjectsService.getKeySet({
      vaultId: vault.id,
    });

    if (!keySet.ownerTeamId)
      return [{ ...vault, routeObjectType: ObjectTypesEnum.VAULT }];

    const teamRoute = await this.getTeamRoute(keySet.ownerTeamId);

    return [{ ...vault, routeObjectType: ObjectTypesEnum.VAULT }, ...teamRoute];
  }

  private async getFolderRoute(fodlerId: string) {
    const vaultFolder = await this.vaultFoldersService.getVaultFolder({
      id: fodlerId,
    });

    if (!vaultFolder)
      throw new ApiNotFoundException(`The vault folder was not found`);

    if (vaultFolder.parentFolderId) {
      const parentFolderRoute = await this.getFolderRoute(
        vaultFolder.parentFolderId
      );

      return [
        { ...vaultFolder, routeObjectType: ObjectTypesEnum.FOLDER },
        ...parentFolderRoute,
      ];
    }

    const vaultRoute = await this.getVaultRoute(vaultFolder.vaultId);

    return [
      { ...vaultFolder, routeObjectType: ObjectTypesEnum.FOLDER },
      ...vaultRoute,
    ];
  }

  private async getItemRoute(itemId: string) {
    const vaultItem = await this.vaultItemsService.getVaultItem({
      id: itemId,
    });

    if (!vaultItem)
      throw new ApiNotFoundException(`The vault item was not found`);

    if (vaultItem.folderId) {
      const folderRoute = await this.getFolderRoute(vaultItem.folderId);

      return [
        { ...vaultItem, routeObjectType: ObjectTypesEnum.ITEM },
        ...folderRoute,
      ];
    }

    const vaultRoute = await this.getVaultRoute(vaultItem.vaultId);

    return [
      { ...vaultItem, routeObjectType: ObjectTypesEnum.ITEM },
      ...vaultRoute,
    ];
  }
}

export default RouterService;
