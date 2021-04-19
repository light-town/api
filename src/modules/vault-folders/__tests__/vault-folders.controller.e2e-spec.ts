import { getConnectionToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { Connection } from 'typeorm';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import createAccountHelper from '~/../__tests__/helpers/create-account.helper';
import { OS } from '~/modules/devices/devices.dto';
import createAndStartSessionHelper from '~/../__tests__/helpers/create-and-start-session.helper';
import Api from './helpers/api.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import VaultFoldersService from '../vault-folders.service';
import createVaultFolderHelper from '~/../__tests__/helpers/create-vault-folder.helper';

describe('[Vault Folders Module] [Service] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let vaultFoldersService: VaultFoldersService;

  let context;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    vaultFoldersService = app.get<VaultFoldersService>(VaultFoldersService);

    const {
      account,
      device,
      password,
      primaryKeySet,
      primaryVault,
    } = await createAccountHelper(app, {
      device: { os: OS.WINDOWS },
    });

    const { token } = await createAndStartSessionHelper(app, {
      accountKey: account.key,
      deviceUuid: device.id,
      password,
    });

    context = {
      token,
      account,
      device,
      password,
      primaryKeySet,
      primaryVault,
    };
  });

  afterEach(async () => {
    await connection.query('TRUNCATE vault_folders CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Creating] ...', () => {
    it('create vault folder', async () => {
      const overview = {
        name: faker.random.word(),
        decs: faker.random.words(),
      };

      const encVaultFolder = await core.helpers.vaultFolders.createVaultFolderHelper(
        overview,
        context.primaryVault.key
      );

      const response = await api.createVaultFolder(
        context.primaryVault.id,
        {
          ...encVaultFolder,
        },
        context.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          ...encVaultFolder,
          parentFolderUuid: null,
          vaultUuid: context.primaryVault.id,
          creatorAccountUuid: context.account.id,
          lastUpdatedAt: response.body?.data?.lastUpdatedAt,
          createdAt: response.body?.data?.createdAt,
        },
        statusCode: 201,
      });
    });
  });

  describe('[Getting] ...', () => {
    it('return all folders of the vault', async () => {
      const vaultFolders = [];

      for (let i = 0; i < 10; ++i) {
        vaultFolders.push(
          vaultFoldersService.format(
            await createVaultFolderHelper(app, {
              accountId: context.account.id,
              vaultId: context.primaryVault.id,
              vaultKey: context.primaryVault.key,
            })
          )
        );
      }

      const response = await api.getVaultFolders(
        context.primaryVault.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultFolders,
        statusCode: 200,
      });
    });

    it('return the folder of the vault', async () => {
      const vaultItem = await createVaultFolderHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
      });

      const response = await api.getVaultFolder(
        context.primaryVault.id,
        vaultItem.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultFoldersService.format(vaultItem),
        statusCode: 200,
      });
    });
  });
});
