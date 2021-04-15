import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultItemCategoriesController from '~/modules/vault-item-categories/vault-item-categories.controller';
import VaultItemCategoriesService from '~/modules/vault-item-categories/vault-item-categories.service';

export interface CreateVaultItemOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  overview?: Record<string, any>;
}

export const createVaultItemCategoryHelper = async (
  app: INestApplication,
  options: CreateVaultItemOptions
) => {
  const vaultItemCategoriesController = app.get<VaultItemCategoriesController>(
    VaultItemCategoriesController
  );
  const vaultItemCategoriesService = app.get<VaultItemCategoriesService>(
    VaultItemCategoriesService
  );

  const overview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.words(),
  };

  const encOverview = await core.vaults.vaultItem.encryptOverviewByVaultKey(
    overview,
    options.vaultKey
  );

  const vaultItem = await vaultItemCategoriesController.createVaultItemCategories(
    { id: options.accountId },
    options.vaultId,
    {
      encOverview,
    }
  );

  return vaultItemCategoriesService.getVaultItemCategory({
    id: vaultItem.uuid,
  });
};

export default createVaultItemCategoryHelper;
