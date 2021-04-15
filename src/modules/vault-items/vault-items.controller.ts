import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateVaultItemPayload, VaultItem } from './vault-items.dto';
import VaultItemsService from './vault-items.service';

@ApiTags('/vaults/items')
@AuthGuard()
@Controller()
export class VaultItemsController {
  public constructor(private readonly vaultItemsService: VaultItemsService) {}

  @ApiCreatedResponse({ type: VaultItem })
  @Post('/vaults/:vaultUuid/folders/:folderUuid/items')
  public async createVaultItem(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Body() payload: CreateVaultItemPayload
  ): Promise<VaultItem> {
    return this.vaultItemsService.format(
      await this.vaultItemsService.create(
        account.id,
        vaultUuid,
        folderUuid,
        payload
      )
    );
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/vaults/:vaultUuid/folders/:folderUuid/items')
  public async getVaultItemsFromFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Query('only-overview') onlyOverview?: boolean
  ): Promise<VaultItem[]> {
    return this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        {
          vaultId: vaultUuid,
          folderId: folderUuid,
        },
        onlyOverview
      )
    );
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/vaults/:vaultUuid/folders/:folderUuid/items/:vaultItemUuid')
  public async getVaultItemFromFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string,
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: boolean
  ): Promise<VaultItem> {
    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
        vaultId: vaultUuid,
        folderId: folderUuid,
      },
      onlyOverview
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }

  @ApiOkResponse({ type: [VaultItem] })
  @Get('/vaults/:vaultUuid/items')
  public async getVaultItems(
    @Param('vaultUuid') vaultUuid: string,
    @Query('only-overview') onlyOverview?: boolean
  ): Promise<VaultItem[]> {
    return this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        {
          vaultId: vaultUuid,
        },
        onlyOverview
      )
    );
  }

  @ApiOkResponse({ type: VaultItem })
  @Get('/vaults/:vaultUuid/items/:vaultItemUuid')
  public async getVaultItem(
    @Param('vaultUuid') vaultUuid: string,
    @Param('vaultItemUuid') vaultItemUuid: string,
    @Query('only-overview') onlyOverview: boolean
  ): Promise<VaultItem> {
    const vaultItem = await this.vaultItemsService.getVaultItem(
      {
        id: vaultItemUuid,
        vaultId: vaultUuid,
      },
      onlyOverview
    );

    if (!vaultItem)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemsService.format(vaultItem);
  }
}

export default VaultItemsController;
