import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultFoldersController from '~/modules/vault-folders/vault-folders.controller';
import VaultFoldersService from '~/modules/vault-folders/vault-folders.service';

export interface CreateVaultFolderOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  overview?: Record<string, any>;
  parentFolderId?: string;
}

export const createVaultFolderHelper = async (
  app: INestApplication,
  options: CreateVaultFolderOptions
) => {
  const vaultFoldersController = app.get<VaultFoldersController>(
    VaultFoldersController
  );
  const vaultFoldersService = app.get<VaultFoldersService>(VaultFoldersService);

  const overview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.words(),
  };

  const encOverview = await core.vaults.vaultItem.encryptOverviewByVaultKey(
    overview,
    options.vaultKey
  );

  const vaultFolder = await vaultFoldersController.createVaultFolder(
    { id: options.accountId },
    options.vaultId,
    {
      encOverview,
      parentFolderUuid: options.parentFolderId,
    }
  );

  return vaultFoldersService.getVaultFolder({ id: vaultFolder.uuid });
};

export default createVaultFolderHelper;
