import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultItemCategoriesController from '~/modules/vault-item-categories/vault-item-categories.controller';
import VaultItemCategoriesService from '~/modules/vault-item-categories/vault-item-categories.service';
import {
  VaultCategoryOverview,
  VaultCategoryDetails,
} from '@light-town/core/dist/helpers/vault-item-categories/definitions';

export interface CreateVaultItemOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  overview?: VaultCategoryOverview;
  details?: VaultCategoryDetails;
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
  const details = options.details ?? {
    schema: {
      fields: [],
    },
  };

  const encVaultItemCategory = await core.helpers.vaultItemCategories.createVaultItemCategoryHelper(
    overview,
    details,
    options.vaultKey
  );

  const vaultItem = await vaultItemCategoriesController.createVaultItemCategories(
    { id: options.accountId },
    options.vaultId,
    encVaultItemCategory
  );

  return {
    ...(await vaultItemCategoriesService.getVaultItemCategory({
      id: vaultItem.uuid,
    })),
    ...(await core.helpers.vaultItemCategories.decryptVaultItemCategoryHelper(
      encVaultItemCategory,
      options.vaultKey
    )),
  };
};

export default createVaultItemCategoryHelper;
