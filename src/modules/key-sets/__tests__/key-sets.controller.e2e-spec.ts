import faker from 'faker';
import { Connection } from 'typeorm';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/typeorm';
import KeySetsController from '../key-sets.controller';
import KeySetsService from '../key-sets.service';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import APIHelper from './helpers/api.helper';
import DevicesService from '~/modules/devices/devices.service';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import { OS } from '~/modules/devices/devices.dto';

describe('[Key Set Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: APIHelper;
  let connection: Connection;
  let keySetsService: KeySetsService;
  let usersService: UsersService;
  let accountsService: AccountsService;
  let devicesService: DevicesService;
  let keySetsController: KeySetsController;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new APIHelper(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    usersService = app.get<UsersService>(UsersService);
    accountsService = app.get<AccountsService>(AccountsService);
    devicesService = app.get<DevicesService>(DevicesService);
    keySetsService = app.get<KeySetsService>(KeySetsService);
    keySetsController = app.get<KeySetsController>(KeySetsController);
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE vaults, key_sets CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('Creating key sets', () => {
    let user;
    let account;
    let device;

    beforeAll(async () => {
      user = await usersService.create({ name: faker.internet.userName() });

      const accountKey = core.encryption.common.generateAccountKey(
        'A1',
        core.encryption.common.generateCryptoRandomString(32)
      );
      const verifier = core.srp.client.deriveVerifier(accountKey, '123');

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
    });

    it('should return all key sets', async () => {});
  });
});
