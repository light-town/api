import { createTestingE2EModule } from './helpers/createTestingE2EModule';
import { Connection, getConnection } from 'typeorm';
import { Api } from './helpers/api';
import { MFATypesEnum, SignUpPayload } from '../auth.dto';
import core from '@light-town/core';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import AccountEntity from '~/db/entities/account.entity';
import { INestApplication } from '@nestjs/common';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesService from '~/modules/devices/devices.service';
import initDB from './helpers/initDatabase';
import MFATypeEntity from '~/db/entities/mfa-type.entity';

describe('[E2E] [Auth Module] ...', () => {
  let connection: Connection;
  let app: INestApplication;
  let devicesService: DevicesService;
  let api: Api;

  beforeAll(async () => {
    app = await createTestingE2EModule();

    api = new Api(app);

    connection = getConnection();
    await connection.synchronize(true);

    await initDB();

    devicesService = app.get<DevicesService>(DevicesService);
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Sign up] ...', () => {
    afterEach(async () => {
      await connection.query(
        'TRUNCATE users, accounts, devices, sessions CASCADE'
      );
    });

    it('should sign up', async () => {
      const TEST_DEVICE = await devicesService.create({
        op: faker.random.word(),
        hostname: faker.internet.ip(),
      });

      const TEST_USERNAME = faker.internet.userName();
      const TEST_USER_PASSWORD = faker.random.word();
      const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      });

      const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
        TEST_ACCOUNT_KEY,
        TEST_USER_PASSWORD
      );

      const payload: SignUpPayload = {
        username: TEST_USERNAME,
        accountKey: TEST_ACCOUNT_KEY,
        salt: TEST_SRP_VERIFIER.salt,
        verifier: TEST_SRP_VERIFIER.verifier,
        deviceUuid: TEST_DEVICE.id,
      };

      const response = await api.signUp(payload);

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        statusCode: 201,
      });

      const users = connection.getRepository(UserEntity);
      expect(await users.count()).toEqual(1);

      const newUser = await users.findOne({ where: { name: TEST_USERNAME } });
      expect(newUser).toStrictEqual(
        users.create({
          id: newUser.id,
          name: TEST_USERNAME,
          avatarUrl: null,
          updatedAt: newUser.updatedAt,
          createdAt: newUser.createdAt,
          isDeleted: false,
        })
      );

      const mfaTypes = connection.getRepository(MFATypeEntity);
      const mfaType = await mfaTypes.findOne({
        select: ['id'],
        where: { name: MFATypesEnum.NONE },
      });

      const accounts = connection.getRepository(AccountEntity);
      expect(await accounts.count()).toEqual(1);

      const newAccount = await accounts.findOne({
        where: { key: TEST_ACCOUNT_KEY },
      });
      expect(newAccount).toStrictEqual(
        accounts.create({
          id: newAccount.id,
          key: TEST_ACCOUNT_KEY,
          userId: newUser.id,
          mfaTypeId: mfaType.id,
          salt: TEST_SRP_VERIFIER.salt,
          verifier: TEST_SRP_VERIFIER.verifier,
          updatedAt: newAccount.updatedAt,
          createdAt: newAccount.createdAt,
          isDeleted: false,
        })
      );

      const devices = connection.getRepository(DeviceEntity);
      expect(await devices.count()).toEqual(1);

      const newDevice = await devices.findOne({
        where: { id: TEST_DEVICE.id },
      });
      expect(newDevice).toStrictEqual(
        devices.create({
          id: newDevice.id,
          op: TEST_DEVICE.op,
          userAgent: null,
          hostname: TEST_DEVICE.hostname,
          updatedAt: newDevice.updatedAt,
          createdAt: newDevice.createdAt,
          isDeleted: false,
        })
      );
    });

    it('should throw 404 error when device was not found', async () => {
      const TEST_FAKE_DEVICE_UUID = faker.random.uuid();

      const TEST_USERNAME = faker.internet.userName();
      const TEST_USER_PASSWORD = faker.random.word();
      const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      });

      const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
        TEST_ACCOUNT_KEY,
        TEST_USER_PASSWORD
      );

      const payload: SignUpPayload = {
        username: TEST_USERNAME,
        accountKey: TEST_ACCOUNT_KEY,
        salt: TEST_SRP_VERIFIER.salt,
        verifier: TEST_SRP_VERIFIER.verifier,
        deviceUuid: TEST_FAKE_DEVICE_UUID,
      };

      const response = await api.signUp(payload);

      expect(response.status).toEqual(404);
      expect(response.body).toStrictEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'The device was not found',
      });

      const users = connection.getRepository(UserEntity);
      expect(await users.count()).toEqual(0);

      const accounts = connection.getRepository(AccountEntity);
      expect(await accounts.count()).toEqual(0);

      const devices = connection.getRepository(DeviceEntity);
      expect(await devices.count()).toEqual(0);
    });
  });
});
