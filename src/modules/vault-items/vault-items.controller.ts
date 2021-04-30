import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateVaultItemPayload, VaultItem } from './vault-items.dto';
import VaultItemsService from './vault-items.service';

@ApiTags('/items')
@AuthGuard()
@Controller()
export class VaultItemsController {
  public constructor(private readonly vaultItemsService: VaultItemsService) {}

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
  @Get('/items')
  public async getItems(
    @Query('folder-uuid') folderUuid?: string,
    @Query('only-overview') onlyOverview?: string
  ): Promise<VaultItem[]> {
    const options: { folderId? } = {};

    if (folderUuid)
      options.folderId = folderUuid === 'null' ? null : folderUuid;

    return this.vaultItemsService.formatAll(
      await this.vaultItemsService.getVaultItems(
        options,
        onlyOverview === 'true'
      )
    );
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
