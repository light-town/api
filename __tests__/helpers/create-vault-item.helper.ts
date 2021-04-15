import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultItemsController from '~/modules/vault-items/vault-items.controller';
import VaultItemsService from '~/modules/vault-items/vault-items.service';
import createVaultItemCategoryHelper from './create-vault-item-category.helper';

export interface CreateVaultItemOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  folderId: string;
  overview?: Record<string, any>;
  details?: Record<string, any>;
  categoryId?: string;
}

export const createVaultItemHelper = async (
  app: INestApplication,
  options: CreateVaultItemOptions
) => {
  const vaultItemsController = app.get<VaultItemsController>(
    VaultItemsController
  );
  const vaultItemsService = app.get<VaultItemsService>(VaultItemsService);

  const overview = options.overview ?? {
    title: faker.random.word(),
    decs: faker.random.words(),
    urls: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
    category: {
      uuid: faker.datatype.uuid(),
    },
    tags: [{ uuid: faker.datatype.uuid() }],
  };

  const encOverview = await core.vaults.vaultItem.encryptOverviewByVaultKey(
    overview,
    options.vaultKey
  );

  const details = {
    fields: [
      { name: 'username', type: 'TEXT', value: faker.internet.userName() },
      {
        name: 'password',
        type: 'PASSWORD',
        value: faker.internet.password(),
      },
    ],
  };

  const encDetails = await core.vaults.vaultItem.encryptOverviewByVaultKey(
    details,
    options.vaultKey
  );

  const vaultItem = await vaultItemsController.createVaultItem(
    { id: options.accountId },
    options.vaultId,
    options.folderId,
    {
      encOverview,
      encDetails,
      categoryUuid:
        options.categoryId ??
        (
          await createVaultItemCategoryHelper(app, {
            accountId: options.accountId,
            vaultId: options.vaultId,
            vaultKey: options.vaultKey,
          })
        ).id,
    }
  );

  return vaultItemsService.getVaultItem({ id: vaultItem.uuid });
};

export default createVaultItemHelper;
