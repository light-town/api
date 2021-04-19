import { getConnectionToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { Connection } from 'typeorm';
import VaultItemsService from '../vault-items.service';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import createAccountHelper from '~/../__tests__/helpers/create-account.helper';
import { OS } from '~/modules/devices/devices.dto';
import createAndStartSessionHelper from '~/../__tests__/helpers/create-and-start-session.helper';
import Api from './helpers/api.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import createVaultItemHelper from '~/../__tests__/helpers/create-vault-item.helper';
import createVaultFolderHelper from '~/../__tests__/helpers/create-vault-folder.helper';
import createVaultItemCategoryHelper from '~/../__tests__/helpers/create-vault-item-category.helper';

describe('[Vault Items Module] [Service] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let vaultItemsService: VaultItemsService;

  let context;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    vaultItemsService = app.get<VaultItemsService>(VaultItemsService);

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
    await connection.query('TRUNCATE vault_folders, vault_items CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Creating] ...', () => {
    it('create vault item', async () => {
      const category = await createVaultItemCategoryHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
      });

      const folder = await createVaultFolderHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
        overview: {
          name: 'TEST_VAULT_FOLDER',
          desc: 'TEST_DESC',
        },
      });

      const overview = {
        name: faker.random.word(),
        decs: faker.random.words(),
        urls: [
          faker.internet.url(),
          faker.internet.url(),
          faker.internet.url(),
        ],
        category: {
          uuid: faker.datatype.uuid(),
        },
        tags: [{ uuid: faker.datatype.uuid() }],
      };
      const details = {
        fields: [
          { fieldName: 'username', value: faker.internet.userName() },
          {
            fieldName: 'password',
            value: faker.internet.password(),
          },
        ],
      };

      const encVaultItem = await core.helpers.vaultItems.createVaultItemHelper(
        overview,
        details,
        context.primaryVault.key
      );

      const response = await api.createVaultItem(
        context.primaryVault.id,
        folder.id,
        {
          ...encVaultItem,
          categoryUuid: category.id,
        },
        context.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          ...encVaultItem,
          vaultUuid: context.primaryVault.id,
          folderUuid: folder.id,
          categoryUuid: category.id,
          creatorAccountUuid: context.account.id,
          lastUpdatedAt: response.body?.data?.lastUpdatedAt,
          createdAt: response.body?.data?.createdAt,
        },
        statusCode: 201,
      });
    });
  });

  describe('[Getting] ...', () => {
    it('return all items of the vault', async () => {
      const folder = await createVaultFolderHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
        overview: {
          name: 'TEST_VAULT_FOLDER',
          desc: 'TEST_DESC',
        },
      });

      const vaultItems = [];

      for (let i = 0; i < 10; ++i) {
        vaultItems.push(
          vaultItemsService.format(
            await createVaultItemHelper(app, {
              accountId: context.account.id,
              vaultId: context.primaryVault.id,
              vaultKey: context.primaryVault.key,
              folderId: folder.id,
            })
          )
        );
      }

      const response = await api.getVaultItems(
        context.primaryVault.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItems,
        statusCode: 200,
      });
    });

    it('return the item of the vault', async () => {
      const folder = await createVaultFolderHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
        overview: {
          name: 'TEST_VAULT_FOLDER',
          desc: 'TEST_DESC',
        },
      });

      const vaultItem = await createVaultItemHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
        folderId: folder.id,
      });

      const response = await api.getVaultItem(
        context.primaryVault.id,
        vaultItem.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItemsService.format(vaultItem),
        statusCode: 200,
      });
    });

    it('return all items of the vault folder', async () => {
      const folders = await Promise.all([
        createVaultFolderHelper(app, {
          accountId: context.account.id,
          vaultId: context.primaryVault.id,
          vaultKey: context.primaryVault.key,
          overview: {
            name: 'TEST_VAULT_FOLDER',
            desc: 'TEST_DESC',
          },
        }),
        createVaultFolderHelper(app, {
          accountId: context.account.id,
          vaultId: context.primaryVault.id,
          vaultKey: context.primaryVault.key,
          overview: {
            name: 'TEST_VAULT_FOLDER_2',
            desc: 'TEST_DESC',
          },
        }),
      ]);

      const vaultItems = [];

      for (let i = 0; i < 10; ++i) {
        vaultItems.push(
          vaultItemsService.format(
            await createVaultItemHelper(app, {
              accountId: context.account.id,
              vaultId: context.primaryVault.id,
              vaultKey: context.primaryVault.key,
              folderId: folders[0].id,
            })
          )
        );
        vaultItems.push(
          vaultItemsService.format(
            await createVaultItemHelper(app, {
              accountId: context.account.id,
              vaultId: context.primaryVault.id,
              vaultKey: context.primaryVault.key,
              folderId: folders[1].id,
            })
          )
        );
      }

      const response = await api.getVaultItemsFromFolder(
        context.primaryVault.id,
        folders[0].id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItems.filter(i => i.folderUuid === folders[0].id),
        statusCode: 200,
      });
    });

    it('return the item of the vault folder', async () => {
      const folders = await Promise.all([
        createVaultFolderHelper(app, {
          accountId: context.account.id,
          vaultId: context.primaryVault.id,
          vaultKey: context.primaryVault.key,
          overview: {
            name: 'TEST_VAULT_FOLDER',
            desc: 'TEST_DESC',
          },
        }),
        createVaultFolderHelper(app, {
          accountId: context.account.id,
          vaultId: context.primaryVault.id,
          vaultKey: context.primaryVault.key,
          overview: {
            name: 'TEST_VAULT_FOLDER_2',
            desc: 'TEST_DESC',
          },
        }),
      ]);

      const vaultItem = await createVaultItemHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
        folderId: folders[1].id,
      });

      const response = await api.getVaultItemFromFolder(
        context.primaryVault.id,
        folders[1].id,
        vaultItem.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItemsService.format(vaultItem),
        statusCode: 200,
      });
    });
  });
});
