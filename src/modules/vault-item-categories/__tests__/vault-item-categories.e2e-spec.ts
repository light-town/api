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
import VaultItemCategoriesService from '../vault-item-categories.service';
import createVaultItemCategoryHelper from '~/../__tests__/helpers/create-vault-item-category.helper';

describe('[Vault Item Categories Module] [Service] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let vaultItemCategoriesService: VaultItemCategoriesService;

  let context;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    vaultItemCategoriesService = app.get<VaultItemCategoriesService>(
      VaultItemCategoriesService
    );

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
    await connection.query('TRUNCATE vault_item_categories CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Creating] ...', () => {
    it('create vault item category', async () => {
      const overview: any = {
        name: faker.random.word(),
        decs: faker.random.words(),
      };

      const details: any = {
        name: faker.random.word(),
        decs: faker.random.words(),
      };

      const encVaultItem = await core.helpers.vaultItems.createVaultItemHelper(
        overview,
        details,
        context.primaryVault.key
      );

      const response = await api.createVaultItemCategory(
        context.primaryVault.id,
        {
          ...encVaultItem,
        },
        context.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          ...encVaultItem,
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
    it('return all item categories of the vault', async () => {
      const vaultItemCategories = [];

      for (let i = 0; i < 10; ++i) {
        vaultItemCategories.push(
          vaultItemCategoriesService.format(
            await createVaultItemCategoryHelper(app, {
              accountId: context.account.id,
              vaultId: context.primaryVault.id,
              vaultKey: context.primaryVault.key,
            })
          )
        );
      }

      const response = await api.getVaultItemCategories(
        context.primaryVault.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItemCategories,
        statusCode: 200,
      });
    });

    it('return the item category of the vault', async () => {
      const vaultItemCategory = await createVaultItemCategoryHelper(app, {
        accountId: context.account.id,
        vaultId: context.primaryVault.id,
        vaultKey: context.primaryVault.key,
      });

      const response = await api.getVaultItemCategory(
        context.primaryVault.id,
        vaultItemCategory.id,
        context.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: vaultItemCategoriesService.format(vaultItemCategory),
        statusCode: 200,
      });
    });
  });
});
