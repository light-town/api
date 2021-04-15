import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import {
  CreateVaultItemCategoryOptions,
  VaultItemCategory,
} from './vault-item-categories.dto';
import VaultItemCategoriesService from './vault-item-categories.service';

@AuthGuard()
@Controller()
export class VaultItemCategoriesController {
  public constructor(
    private readonly vaultItemCategoriesService: VaultItemCategoriesService
  ) {}

  @Post('/vaults/:vaultUuid/categories')
  public async createVaultItemCategories(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
    @Body() payload: CreateVaultItemCategoryOptions
  ): Promise<VaultItemCategory> {
    return this.vaultItemCategoriesService.format(
      await this.vaultItemCategoriesService.createVaultItemCategory(
        account.id,
        vaultUuid,
        payload
      )
    );
  }

  @Get('/vaults/:vaultUuid/categories')
  public async getVaultItemCategories(
    @Param('vaultUuid') vaultUuid: string
  ): Promise<VaultItemCategory[]> {
    return this.vaultItemCategoriesService.formatAll(
      await this.vaultItemCategoriesService.getVaultItemCategories({
        vaultId: vaultUuid,
      })
    );
  }

  @Get('/vaults/:vaultUuid/categories/:categoryUuid')
  public async getVaultItemCategory(
    @Param('categoryUuid') categoryUuid: string,
    @Param('vaultUuid') vaultUuid: string
  ): Promise<VaultItemCategory> {
    const vaultItemCategory = await this.vaultItemCategoriesService.getVaultItemCategory(
      {
        id: categoryUuid,
        vaultId: vaultUuid,
      }
    );

    if (!vaultItemCategory)
      throw new ApiNotFoundException('The vault item was not found');

    return this.vaultItemCategoriesService.format(vaultItemCategory);
  }
}

export default VaultItemCategoriesController;
