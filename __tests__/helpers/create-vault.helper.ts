import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import * as faker from 'faker';
import VaultsController from '~/modules/vaults/vaults.controller';

export interface CreateVaultOptions {
  accountId: string;
  publicKey: string;
  metadata?: Record<string, any>;
  vaultKey?: string;
}

export const createVaultHelper = async (
  app: INestApplication,
  options: CreateVaultOptions
) => {
  const vaultsController = app.get<VaultsController>(VaultsController);

  const vaultKey =
    options.vaultKey ?? core.common.generateCryptoRandomString(32);

  const encKey = await core.vaults.vaultKey.encryptByPublicKey(
    vaultKey,
    core.vaults.publicKeyFromString(options.publicKey)
  );

  const metadata = options.metadata ?? {
    title: faker.random.word(),
    desc: faker.random.word(),
  };

  const encMetadata = await core.vaults.vaultMetadata.encryptByVaultKey(
    metadata,
    vaultKey
  );

  return vaultsController.createVault(
    { id: options.accountId },
    {
      encKey,
      encMetadata,
    }
  );
};
export default createVaultHelper;
