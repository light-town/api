import { createE2EModuleHelper } from './helpers/create-e2e-module.helper';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';
import { Api } from './helpers/api.helper';
import { MFATypesEnum, SessionCreatePayload } from '../auth.dto';
import core from '@light-town/core';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import AccountEntity from '~/db/entities/account.entity';
import { INestApplication } from '@nestjs/common';
import DeviceEntity from '~/db/entities/device.entity';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import DevicesService from '~/modules/devices/devices.service';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import { OS } from '~/modules/devices/devices.dto';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';

describe('[Auth Module] [Service]...', () => {
  let connection: Connection;
  let app: INestApplication;
  let accountsService: AccountsService;
  let usersService: UsersService;
  let devicesService: DevicesService;
  let api: Api;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    usersService = app.get<UsersService>(UsersService);
    accountsService = app.get<AccountsService>(AccountsService);
    devicesService = app.get<DevicesService>(DevicesService);
  });

  beforeEach(async () => {
    await connection.query(
      'TRUNCATE users, accounts, devices, sessions CASCADE'
    );
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Create Session] ...', () => {
    it('should create session', async () => {
      const TEST_DEVICE_OP = OS.ANDROID;
      const TEST_DEVICE_HOSTNAME = faker.internet.ip();
      const TEST_DEVICE = await devicesService.create({
        os: TEST_DEVICE_OP,
        hostname: TEST_DEVICE_HOSTNAME,
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

      const user = await usersService.create({ name: TEST_USERNAME });
      await accountsService.create({
        key: TEST_ACCOUNT_KEY,
        userId: user.id,
        salt: TEST_SRP_VERIFIER.salt,
        verifier: TEST_SRP_VERIFIER.verifier,
      });

      const payload: SessionCreatePayload = {
        accountKey: TEST_ACCOUNT_KEY,
        deviceUuid: TEST_DEVICE.id,
      };

      const response = await api.createSession(payload);

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          sessionUuid: response.body.data.sessionUuid,
          salt: TEST_SRP_VERIFIER.salt,
          serverPublicEphemeral: response.body.data.serverPublicEphemeral,
          sessionVerification: {
            MFAType: MFATypesEnum.NONE,
            stage: SessionVerificationStageEnum.NOT_REQUIRED,
          },
        },
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

      const accounts = connection.getRepository(AccountEntity);
      expect(await accounts.count()).toEqual(1);

      const mfaTypes = connection.getRepository(MFATypeEntity);
      const mfaType = await mfaTypes.findOne({
        select: ['id'],
        where: { name: MFATypesEnum.NONE },
      });

      const newAccount = await accounts.findOne({
        where: { key: TEST_ACCOUNT_KEY },
      });
      expect(newAccount).toStrictEqual(
        accounts.create({
          id: newAccount.id,
          key: TEST_ACCOUNT_KEY,
          userId: newUser.id,
          salt: TEST_SRP_VERIFIER.salt,
          mfaTypeId: mfaType.id,
          verifier: TEST_SRP_VERIFIER.verifier,
          updatedAt: newAccount.updatedAt,
          createdAt: newAccount.createdAt,
          isDeleted: false,
        })
      );

      const devices = connection.getRepository(DeviceEntity);
      expect(await devices.count()).toEqual(1);

      const newDevice = await devices.findOne({
        where: { hostname: TEST_DEVICE_HOSTNAME },
      });
      expect(newDevice).toStrictEqual(
        devices.create({
          id: newDevice.id,
          os: TEST_DEVICE_OP,
          hostname: TEST_DEVICE_HOSTNAME,
          userAgent: null,
          model: null,
          updatedAt: newDevice.updatedAt,
          createdAt: newDevice.createdAt,
          isDeleted: false,
        })
      );
    });

    it('should send push notification to verification device when account has MFA type authorization', async () => {
      const TEST_DEVICE_OP = OS.ANDROID;
      const TEST_DEVICE_HOSTNAME = faker.internet.ip();
      const TEST_DEVICE = await devicesService.create({
        os: TEST_DEVICE_OP,
        hostname: TEST_DEVICE_HOSTNAME,
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

      const user = await usersService.create({ name: TEST_USERNAME });
      const account = await accountsService.create({
        key: TEST_ACCOUNT_KEY,
        userId: user.id,
        salt: TEST_SRP_VERIFIER.salt,
        verifier: TEST_SRP_VERIFIER.verifier,
      });

      await accountsService.setMultiFactorAuthType(
        user.id,
        account.id,
        TEST_DEVICE.id,
        MFATypesEnum.FINGERPRINT
      );

      const payload: SessionCreatePayload = {
        accountKey: TEST_ACCOUNT_KEY,
        deviceUuid: TEST_DEVICE.id,
      };

      const response = await api.createSession(payload);

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          sessionUuid: response.body.data.sessionUuid,
          salt: TEST_SRP_VERIFIER.salt,
          serverPublicEphemeral: response.body.data.serverPublicEphemeral,
          sessionVerification: {
            MFAType: MFATypesEnum.FINGERPRINT,
            stage: SessionVerificationStageEnum.REQUIRED,
            verificationDevice: {
              uuid:
                response.body?.data?.sessionVerification?.verificationDevice
                  ?.uuid,
              os: <OS>TEST_DEVICE.os,
              model: TEST_DEVICE.model,
              hostname: TEST_DEVICE.hostname,
            },
          },
        },
        statusCode: 201,
      });

      const mfaTypes = connection.getRepository(MFATypeEntity);
      const mfaType = await mfaTypes.findOne({
        select: ['id'],
        where: { name: MFATypesEnum.FINGERPRINT },
      });

      const accounts = connection.getRepository(AccountEntity);
      const newAccount = await accounts.findOne({
        where: { key: TEST_ACCOUNT_KEY },
      });
      expect(newAccount).toStrictEqual(
        accounts.create({
          id: newAccount.id,
          key: TEST_ACCOUNT_KEY,
          userId: user.id,
          salt: TEST_SRP_VERIFIER.salt,
          mfaTypeId: mfaType.id,
          verifier: TEST_SRP_VERIFIER.verifier,
          updatedAt: newAccount.updatedAt,
          createdAt: newAccount.createdAt,
          isDeleted: false,
        })
      );

      const devices = connection.getRepository(DeviceEntity);
      expect(await devices.count()).toEqual(1);

      const newDevice = await devices.findOne({
        where: { hostname: TEST_DEVICE_HOSTNAME },
      });
      expect(newDevice).toStrictEqual(
        devices.create({
          id: newDevice.id,
          os: TEST_DEVICE_OP,
          hostname: TEST_DEVICE_HOSTNAME,
          userAgent: null,
          model: null,
          updatedAt: newDevice.updatedAt,
          createdAt: newDevice.createdAt,
          isDeleted: false,
        })
      );

      const verificationDevices = connection.getRepository(
        VerificationDeviceEntity
      );
      expect(await verificationDevices.count()).toEqual(1);
      const verificationDevice = await verificationDevices.findOne();
      expect(verificationDevice).toStrictEqual(
        verificationDevices.create({
          id: verificationDevice.id,
          deviceId: TEST_DEVICE.id,
          accountId: account.id,
          updatedAt: verificationDevice.updatedAt,
          createdAt: verificationDevice.createdAt,
          isDeleted: false,
        })
      );
    });
  });
});
