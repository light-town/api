import { createE2EModuleHelper } from './helpers/create-e2e-module.helper';
import { Connection, getConnection } from 'typeorm';
import { Api } from './helpers/api.helper';
import { SignUpPayload } from '../auth.dto';
import core from '@light-town/core';
import * as faker from 'faker';
import { INestApplication } from '@nestjs/common';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesService from '~/modules/devices/devices.service';
import SessionsService from '~/modules/sessions/sessions.service';
import SessionEntity from '~/db/entities/session.entity';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import { OS } from '~/modules/devices/devices.dto';

describe('[Auth Module] [Controller]...', () => {
  let connection: Connection;
  let app: INestApplication;
  let devicesService: DevicesService;
  let sessionsService: SessionsService;
  let api: Api;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = getConnection();
    await connection.synchronize(true);

    await initDatabaseHelper();

    devicesService = app.get<DevicesService>(DevicesService);
    sessionsService = app.get<SessionsService>(SessionsService);
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

  describe('[Start session] ...', () => {
    let TEST_DEVICE: DeviceEntity;
    const TEST_USER_NAME = faker.internet.userName();
    const TEST_USER_PASSWORD = faker.random.word();
    const TEST_ACCOUNT_KEY = core.encryption.common.generateAccountKey(
      'A3',
      core.encryption.common.generateCryptoRandomString(32)
    );
    const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD
    );

    beforeEach(async () => {
      TEST_DEVICE = await devicesService.create({
        os: OS.ANDROID,
        hostname: faker.internet.ip(),
      });

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
          encOverview: {},
          encCategories: [],
        },
      };

      await api.signUp(payload);
    });

    it('should start session', async () => {
      const createSessionResponse = await api.createSession({
        accountKey: TEST_ACCOUNT_KEY,
        deviceUuid: TEST_DEVICE.id,
      });

      const {
        body: {
          data: { salt, sessionUuid, serverPublicEphemeral },
        },
      } = createSessionResponse;

      const initSession = await sessionsService.findOne({
        where: { id: sessionUuid },
      });

      const ephemeralPairKeys = core.srp.client.generateEphemeralKeyPair();

      const session = core.srp.client.deriveSession(
        ephemeralPairKeys.secret,
        serverPublicEphemeral,
        salt,
        TEST_ACCOUNT_KEY,
        TEST_SRP_VERIFIER.privateKey
      );

      const verifyStage = await sessionsService.findOneVerificationStage({
        select: ['id'],
        where: {
          name: SessionVerificationStageEnum.COMPLETED,
        },
      });

      await sessionsService.update(
        { id: sessionUuid },
        { verificationStageId: verifyStage.id }
      );

      const startSessionResponse = await api.startSession(sessionUuid, {
        clientPublicEphemeralKey: ephemeralPairKeys.public,
        clientSessionProofKey: session.proof,
      });

      expect(startSessionResponse.status).toEqual(201);
      expect(startSessionResponse.body).toStrictEqual({
        statusCode: 201,
        data: {
          token: startSessionResponse.body.data.token,
          serverSessionProof: startSessionResponse.body.data.serverSessionProof,
        },
      });

      core.srp.client.verifySession(
        ephemeralPairKeys.public,
        session,
        startSessionResponse.body.data.serverSessionProof
      );

      const sessions = connection.getRepository(SessionEntity);
      const updateSession = await sessions.findOne({
        where: { id: sessionUuid },
      });

      expect(await sessions.count()).toEqual(1);
      expect(updateSession).toStrictEqual(
        sessions.create({
          ...initSession,
          verificationStageId: updateSession.verificationStageId,
          updatedAt: updateSession.updatedAt,
          expiresAt: updateSession.expiresAt,
        })
      );
    });
  });
});
