import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import VaultsController from '~/modules/vaults/vaults.controller';
import VaultsService from '~/modules/vaults/vaults.service';
import { VaultOverview } from '@light-town/core/dist/helpers/vaults/definitions';

export interface CreateVaultOptions {
  accountId: string;
  publicKey: any;
  privateKey: any;
  overview?: VaultOverview;
}

export const createVaultHelper = async (
  app: INestApplication,
  options: CreateVaultOptions
) => {
  const vaultsController = app.get<VaultsController>(VaultsController);
  const vaultsService = app.get<VaultsService>(VaultsService);

  const overview: VaultOverview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.word(),
  };

  const encVault = await core.helpers.vaults.createVaultHelper(
    overview,
    options.publicKey
  );
  const decryptedVault = await core.helpers.vaults.decryptVaultByPrivateKeyHelper(
    encVault,
    options.privateKey
  );
  const encCategories = await core.helpers.vaultItemCategories.createDefaultVaultItemCategories(
    decryptedVault.key
  );

  const vault = await vaultsController.createVault(
    { id: options.accountId },
    {
      ...encVault,
      encCategories,
    }
  );

  return vaultsService.getVault({ id: vault.uuid });
};
export default createVaultHelper;
