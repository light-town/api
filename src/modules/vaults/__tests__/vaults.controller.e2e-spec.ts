import * as faker from 'faker';
import { Connection, Repository } from 'typeorm';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import VaultsService from '../vaults.service';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import APIHelper from './helpers/api.helper';
import DevicesService from '~/modules/devices/devices.service';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import { OS } from '~/modules/devices/devices.dto';
import AuthService from '~/modules/auth/auth.service';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetEntity from '~/db/entities/key-sets.entity';

const createVaultHelper = async (
  vaultsService: VaultsService,
  keySetsService: KeySetsService,
  accountId,
  accountKey,
  password
) => {
  const masterUnlockKey = core.common.deriveMasterUnlockKey(
    accountKey,
    password
  );

  const { publicKey, privateKey } = await core.vaults.generateKeyPair();
  const symmetricKey = core.common.generateCryptoRandomString(32);
  const vaultKey = core.common.generateCryptoRandomString(32);

  const encVaultKey = core.vaults.encryptVaultKey(vaultKey, publicKey);
  const encPrivateKey = core.vaults.encryptPrivateKey(privateKey, symmetricKey);
  const encSymmetricKey = core.vaults.encryptSymmetricKey({
    secretKey: masterUnlockKey.key,
    symmetricKey,
    salt: masterUnlockKey.salt,
  });

  const metadata = {
    title: faker.random.word(),
    desc: faker.random.word(),
  };
  const encMetadata = await core.vaults.encryptVaultMetadata(
    vaultKey,
    metadata
  );

  const vault = await vaultsService.create({
    encKey: encVaultKey,
    encMetadata,
  });

  await keySetsService.create(accountId, vault.id, {
    publicKey: core.vaults.publicKeyToString(publicKey),
    encPrivateKey,
    encSymmetricKey,
  });

  return vault;
};

describe('[Vaults Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: APIHelper;
  let connection: Connection;
  let usersService: UsersService;
  let accountsService: AccountsService;
  let devicesService: DevicesService;
  let keySetsService: KeySetsService;
  let vaultsService: VaultsService;
  let authService: AuthService;
  let vaultsRepository: Repository<VaultEntity>;
  let keySetsRepository: Repository<KeySetEntity>;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new APIHelper(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    usersService = app.get<UsersService>(UsersService);
    accountsService = app.get<AccountsService>(AccountsService);
    devicesService = app.get<DevicesService>(DevicesService);
    authService = app.get<AuthService>(AuthService);
    keySetsService = app.get<KeySetsService>(KeySetsService);
    vaultsService = app.get<VaultsService>(VaultsService);
    vaultsRepository = app.get<Repository<VaultEntity>>(
      getRepositoryToken(VaultEntity)
    );
    keySetsRepository = app.get<Repository<KeySetEntity>>(
      getRepositoryToken(KeySetEntity)
    );
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE vaults, key_sets CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('', () => {
    const password = '123';
    let user;
    let account;
    let accountKey;
    let device;
    let token;

    beforeAll(async () => {
      user = await usersService.create({ name: faker.internet.userName() });

      accountKey = core.common.generateAccountKey({
        versionCode: 'A1',
        secret: core.common.generateCryptoRandomString(32),
      });
      const verifier = core.srp.client.deriveVerifier(accountKey, password);

      account = await accountsService.create({
        key: accountKey,
        userId: user.id,
        salt: verifier.salt,
        verifier: verifier.verifier,
      });

      device = await devicesService.create({
        os: OS.ANDROID,
        hostname: faker.internet.ip(),
      });

      const {
        sessionUuid,
        serverPublicEphemeral,
        salt,
      } = await authService.createSession({
        accountKey,
        deviceUuid: device.id,
      });

      const privateKey = core.srp.client.derivePrivateKey(
        accountKey,
        password,
        salt
      );

      const clientEphemeralKeyPair = core.srp.client.generateEphemeralKeyPair();
      const clientSession = core.srp.client.deriveSession(
        clientEphemeralKeyPair.secret,
        serverPublicEphemeral,
        salt,
        accountKey,
        privateKey
      );

      const {
        token: accessToken,
        serverSessionProof,
      } = await authService.startSession(sessionUuid, {
        clientPublicEphemeralKey: clientEphemeralKeyPair.public,
        clientSessionProofKey: clientSession.proof,
      });

      core.srp.client.verifySession(
        clientEphemeralKeyPair.public,
        clientSession,
        serverSessionProof
      );

      token = accessToken;
    });

    describe('[Creating] ...', () => {
      it('should create a vault', async () => {
        const masterUnlockKey = core.common.deriveMasterUnlockKey(
          accountKey,
          password
        );

        const { publicKey, privateKey } = await core.vaults.generateKeyPair();
        const symmetricKey = core.common.generateCryptoRandomString(32);
        const vaultKey = core.common.generateCryptoRandomString(32);

        const encVaultKey = core.vaults.encryptVaultKey(vaultKey, publicKey);
        const encPrivateKey = core.vaults.encryptPrivateKey(
          privateKey,
          symmetricKey
        );
        const encSymmetricKey = core.vaults.encryptSymmetricKey({
          secretKey: masterUnlockKey.key,
          symmetricKey,
          salt: masterUnlockKey.salt,
        });

        const metadata = {
          title: faker.random.word(),
          desc: faker.random.word(),
        };
        const encMetadata = await core.vaults.encryptVaultMetadata(
          vaultKey,
          metadata
        );

        const response = await api.createVault(
          account.id,
          {
            keySet: {
              publicKey: core.vaults.publicKeyToString(publicKey),
              encPrivateKey,
              encSymmetricKey,
            },
            vault: {
              encKey: encVaultKey,
              encMetadata,
            },
          },
          token
        );

        expect(response.status).toEqual(201);
        expect(response.body).toStrictEqual({
          data: {
            uuid: response.body?.data?.uuid,
            encKey: encVaultKey,
            encMetadata,
          },
          statusCode: 201,
        });

        expect(await vaultsRepository.count()).toStrictEqual(1);

        const vault = await vaultsRepository.findOne();
        expect(vault).toStrictEqual(
          vaultsRepository.create({
            id: vault.id,
            encKey: encVaultKey,
            encMetadata: encMetadata,
            createdAt: vault.createdAt,
            updatedAt: vault.updatedAt,
            isDeleted: false,
          })
        );

        expect(await keySetsRepository.count()).toStrictEqual(1);

        const keySet = await keySetsRepository.findOne();
        expect(keySet).toStrictEqual(
          keySetsRepository.create({
            id: keySet.id,
            publicKey: core.vaults.publicKeyToString(publicKey),
            encPrivateKey,
            encSymmetricKey,
            accountId: account.id,
            vaultId: vault.id,
            createdAt: keySet.createdAt,
            updatedAt: keySet.updatedAt,
            isDeleted: false,
            isPrimary: false,
          })
        );
      });
    });

    describe('[Getting] ...', () => {
      it('should get all vaults', async () => {
        const vaults = [];
        for (let i = 0; i < 10; i++)
          vaults.push(
            await createVaultHelper(
              vaultsService,
              keySetsService,
              account.id,
              accountKey,
              password
            )
          );

        const response = await api.getVaults(account.id, token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: vaults.map(v => ({
            uuid: v.id,
            encKey: v.encKey,
            encMetadata: v.encMetadata,
          })),
          statusCode: 200,
        });
      });

      it('should get one vault', async () => {
        const vault = await createVaultHelper(
          vaultsService,
          keySetsService,
          account.id,
          accountKey,
          password
        );

        const response = await api.getVault(account.id, vault.id, token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: {
            uuid: vault.id,
            encKey: vault.encKey,
            encMetadata: vault.encMetadata,
          },
          statusCode: 200,
        });
      });
    });

    describe('[Deleting] ...', () => {
      it('should delete a vaults', async () => {
        const vault = await createVaultHelper(
          vaultsService,
          keySetsService,
          account.id,
          accountKey,
          password
        );

        const response = await api.deleteVault(account.id, vault.id, token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          statusCode: 200,
        });

        expect(await vaultsRepository.count()).toStrictEqual(1);

        const updatedVault = await vaultsRepository.findOne();
        expect(updatedVault).toStrictEqual(
          vaultsRepository.create({
            ...updatedVault,
            isDeleted: true,
          })
        );

        expect(await keySetsRepository.count()).toStrictEqual(1);

        const keySet = await keySetsRepository.findOne();
        expect(keySet).toStrictEqual(
          keySetsRepository.create({
            ...keySet,
            isDeleted: true,
          })
        );
      });
    });
  });
});
