import { createE2EModuleHelper } from './helpers/create-e2e-module.helper';
import { Connection, getConnection } from 'typeorm';
import { Api } from './helpers/api.helper';
import { MFATypesEnum, SignUpPayload } from '../auth.dto';
import core from '@light-town/core';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import AccountEntity from '~/db/entities/account.entity';
import { INestApplication } from '@nestjs/common';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesService from '~/modules/devices/devices.service';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import { OS } from '~/modules/devices/devices.dto';

describe('[Auth Module] [Service] ...', () => {
  let connection: Connection;
  let app: INestApplication;
  let devicesService: DevicesService;
  let api: Api;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = getConnection();
    await connection.synchronize(true);

    await initDatabaseHelper();

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
        os: OS.ANDROID,
        hostname: faker.internet.ip(),
      });
      const TEST_USER_NAME = faker.internet.userName();
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
        deviceUuid: TEST_DEVICE.id,
        account: {
          key: TEST_ACCOUNT_KEY,
          username: TEST_USER_NAME,
        },
        srp: {
          verifier: TEST_SRP_VERIFIER.verifier,
          salt: TEST_SRP_VERIFIER.salt,
        },
        primaryKeySet: {
          publicKey: faker.datatype.uuid(),
          encPrivateKey: <any>{
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: <any>{
            key: faker.datatype.uuid(),
          },
        },
        primaryVault: {
          encKey: <any>{
            key: faker.datatype.uuid(),
          },
          encMetadata: {},
        },
      };

      const response = await api.signUp(payload);

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        statusCode: 201,
      });

      const users = connection.getRepository(UserEntity);
      expect(await users.count()).toEqual(1);

      const newUser = await users.findOne({ where: { name: TEST_USER_NAME } });
      expect(newUser).toStrictEqual(
        users.create({
          id: newUser.id,
          name: TEST_USER_NAME,
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
          os: TEST_DEVICE.os,
          userAgent: null,
          model: null,
          hostname: TEST_DEVICE.hostname,
          updatedAt: newDevice.updatedAt,
          createdAt: newDevice.createdAt,
          isDeleted: false,
        })
      );
    });

    it('should throw 404 error when device was not found', async () => {
      const TEST_FAKE_DEVICE_UUID = faker.datatype.uuid();

      const TEST_USER_NAME = faker.internet.userName();
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
        deviceUuid: TEST_FAKE_DEVICE_UUID,
        account: {
          key: TEST_ACCOUNT_KEY,
          username: TEST_USER_NAME,
        },
        srp: {
          verifier: TEST_SRP_VERIFIER.verifier,
          salt: TEST_SRP_VERIFIER.salt,
        },
        primaryKeySet: {
          publicKey: faker.datatype.uuid(),
          encPrivateKey: <any>{
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: <any>{
            key: faker.datatype.uuid(),
          },
        },
        primaryVault: {
          encKey: <any>{
            key: faker.datatype.uuid(),
          },
          encMetadata: {},
        },
      };

      const response = await api.signUp(payload);

      expect(response.status).toEqual(404);
      expect(response.body).toStrictEqual({
        error: {
          type: 'Not Found',
          message: 'The device was not found',
        },
        statusCode: 404,
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
