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

  const accountKey = core.encryption.common.generateAccountKey(
    'A1',
    core.encryption.common.generateCryptoRandomString(32)
  );

  const password = core.encryption.common.generateCryptoRandomString(8);
  const verifier = core.srp.client.deriveVerifier(accountKey, password);

  const masterUnlockKey = core.helpers.masterUnlockKey.deriveMasterUnlockKeyHelper(
    accountKey,
    password
  );

  const encPrimaryKeySet = await core.helpers.keySets.createPrimaryKeySetHelper(
    masterUnlockKey
  );
  const decryptedPrimaryKeySet = await core.helpers.keySets.decryptPrimaryKeySetHelper(
    encPrimaryKeySet,
    masterUnlockKey
  );
  const encVault = await core.helpers.vaults.createVaultHelper(
    {
      name: faker.random.word(),
      desc: faker.random.word(),
    },
    decryptedPrimaryKeySet.publicKey
  );
  const decryptedVault = await core.helpers.vaults.decryptVaultByPrivateKeyHelper(
    encVault,
    decryptedPrimaryKeySet.privateKey
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
    primaryKeySet: encPrimaryKeySet,
    primaryVault: { ...encVault, encCategories: [] },
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
      ...decryptedPrimaryKeySet,
    },
    primaryVault: {
      ...primaryVault,
      ...decryptedVault,
    },
  };
};

export default createAccountHelper;
