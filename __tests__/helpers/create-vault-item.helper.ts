import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import VaultItemsController from '~/modules/vault-items/vault-items.controller';
import VaultItemsService from '~/modules/vault-items/vault-items.service';
import createVaultItemCategoryHelper from './create-vault-item-category.helper';
import {
  VaultItemOverview,
  VaultItemDetails,
} from '@light-town/core/dist/helpers/vault-items/definitions';

export interface CreateVaultItemOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  folderId?: string;
  overview?: VaultItemOverview;
  details?: VaultItemDetails;
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

  const overview: VaultItemOverview = options.overview ?? {
    name: faker.random.word(),
    decs: faker.random.words(),
    urls: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
  };

  const details: VaultItemDetails = options.details ?? {
    fields: [
      {
        position: 1,
        fieldName: 'username',
        name: 'username',
        value: faker.internet.userName(),
      },
      {
        position: 2,
        fieldName: 'password',
        name: 'password',
        value: faker.internet.password(),
      },
    ],
  };

  const encVaultItem = await core.helpers.vaultItems.createVaultItemHelper(
    overview,
    details,
    options.vaultKey
  );

  const vaultItem = options.folderId
    ? await vaultItemsController.createVaultItemInFolder(
        { id: options.accountId },
        options.vaultId,
        options.folderId,
        {
          ...encVaultItem,
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
      )
    : await vaultItemsController.createVaultItem(
        { id: options.accountId },
        options.vaultId,
        {
          ...encVaultItem,
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
