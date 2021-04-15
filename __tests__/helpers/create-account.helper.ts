import { INestApplication } from '@nestjs/common';
import AuthController from '~/modules/auth/auth.controller';
import { OS } from '~/modules/devices/devices.dto';
import createDeviceHelper from './create-device.helper';
import core from '@light-town/core';
import * as faker from 'faker';
import AccountsService from '~/modules/accounts/accounts.service';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import KeySetVaultsService from '~/modules/key-set-vaults/key-set-vaults.service';

export interface createAccountOptions {
  device: {
    os: OS;
    model?: string;
  };
}

export const createAccountHelper = async (
  app: INestApplication,
  options: createAccountOptions
) => {
  const accountsService = app.get<AccountsService>(AccountsService);
  const authController = app.get<AuthController>(AuthController);
  const keySetsService = app.get<KeySetsService>(KeySetsService);
  const keySetVaultsService = app.get<KeySetVaultsService>(KeySetVaultsService);

  const device = await createDeviceHelper(app, {
    os: options.device.os ?? OS.WINDOWS,
    model: options.device.model,
  });

  const accountKey = core.common.generateAccountKey({
    versionCode: 'A1',
    secret: core.common.generateCryptoRandomString(32),
  });

  const password = core.common.generateCryptoRandomString(8);
  const verifier = core.srp.client.deriveVerifier(accountKey, password);

  const masterUnlockKey = core.common.deriveMasterUnlockKey(
    accountKey,
    password
  );

  const { publicKey, privateKey } = await core.vaults.generateKeyPair();
  const symmetricKey = core.common.generateCryptoRandomString(32);
  const vaultKey = core.common.generateCryptoRandomString(32);

  const encVaultKey = await core.vaults.vaultKey.encryptByPublicKey(
    vaultKey,
    publicKey
  );
  const encPrivateKey = await core.vaults.privateKey.encryptBySymmetricKey(
    privateKey,
    symmetricKey
  );
  const encSymmetricKey = await core.vaults.symmetricKey.encryptBySecretKey(
    symmetricKey,
    masterUnlockKey.key,
    masterUnlockKey.salt
  );
  const encMetadata = await core.vaults.vaultMetadata.encryptByVaultKey(
    {
      title: faker.random.word(),
      desc: faker.random.word(),
    },
    vaultKey
  );

  await authController.signUp({
    deviceUuid: device.id,
    srp: {
      verifier: verifier.verifier,
      salt: verifier.salt,
    },
    account: {
      key: accountKey,
      username: faker.internet.userName(),
    },
    primaryKeySet: {
      publicKey: core.vaults.publicKeyToString(publicKey),
      encPrivateKey,
      encSymmetricKey,
    },
    primaryVault: {
      encKey: encVaultKey,
      encMetadata,
    },
  });

  const account = await accountsService.getAccount({ key: accountKey });
  const primaryKeySet = await keySetsService.getKeySet({
    creatorAccountId: account.id,
    ownerAccountId: account.id,
  });
  const primaryVault = await keySetVaultsService.getVault(primaryKeySet.id);

  return {
    account,
    device,
    password,
    masterUnlockKey,
    primaryKeySet: {
      ...primaryKeySet,
      publicKey,
      privateKey,
      symmetricKey,
    },
    primaryVault: {
      ...primaryVault,
      key: vaultKey,
    },
  };
};

export default createAccountHelper;
