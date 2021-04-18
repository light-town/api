import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultsController from '~/modules/vaults/vaults.controller';
import VaultsService from '~/modules/vaults/vaults.service';

export interface CreateVaultOptions {
  accountId: string;
  publicKey: any;
  metadata?: Record<string, any>;
  vaultKey?: string;
}

export const createVaultHelper = async (
  app: INestApplication,
  options: CreateVaultOptions
) => {
  const vaultsController = app.get<VaultsController>(VaultsController);
  const vaultsService = app.get<VaultsService>(VaultsService);

  const vaultKey =
    options.vaultKey ?? core.common.generateCryptoRandomString(32);

  const encKey = await core.vaults.vaultKey.encryptByPublicKey(
    vaultKey,
    options.publicKey
  );

  const metadata = options.metadata ?? {
    title: faker.random.word(),
    desc: faker.random.word(),
  };

  const encMetadata = await core.vaults.vaultMetadata.encryptByVaultKey(
    metadata,
    vaultKey
  );

  const vault = await vaultsController.createVault(
    { id: options.accountId },
    {
      encKey,
      encMetadata,
    }
  );

  return vaultsService.getVault({ id: vault.uuid });
};
export default createVaultHelper;
