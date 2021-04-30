import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import VaultFoldersController from '~/modules/vault-folders/vault-folders.controller';
import VaultFoldersService from '~/modules/vault-folders/vault-folders.service';
import { VaultFolderOverview } from '@light-town/core/dist/helpers/vault-folders/definitions';

export interface CreateVaultFolderOptions {
  accountId: string;
  vaultId: string;
  vaultKey: string;
  overview?: VaultFolderOverview;
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

  const overview: VaultFolderOverview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.words(),
  };

  const encVaultFolder = await core.helpers.vaultFolders.createVaultFolderHelper(
    overview,
    options.vaultKey
  );

  const vaultFolder = await vaultFoldersController.createVaultFolder(
    { id: options.accountId },
    options.vaultId,
    {
      ...encVaultFolder,
      parentFolderUuid: options.parentFolderId,
    }
  );

  return {
    ...(await vaultFoldersService.getVaultFolder({ id: vaultFolder.uuid })),
    ...(await core.helpers.vaultFolders.decryptVaultFolderHelper(
      encVaultFolder,
      options.vaultKey
    )),
  };
};

export default createVaultFolderHelper;
