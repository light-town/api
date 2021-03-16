import { createTestingE2EModule } from './helpers/createTestingE2EModule';
import { Connection, getConnection } from 'typeorm';
import { Api } from './helpers/api';
import { SignUpPayload } from '../auth.dto';
import core from '@light-town/core';
import * as faker from 'faker';
import { INestApplication } from '@nestjs/common';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesService from '~/modules/devices/devices.service';
import SessionsService from '~/modules/sessions/sessions.service';
import SessionEntity from '~/db/entities/session.entity';

describe('[E2E] [Auth Module] ...', () => {
  let connection: Connection;
  let app: INestApplication;
  let devicesService: DevicesService;
  let sessionsService: SessionsService;
  let api: Api;

  beforeAll(async () => {
    app = await createTestingE2EModule();

    api = new Api(app);

    connection = getConnection();
    await connection.synchronize(true);

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
    const TEST_USERNAME = faker.internet.userName();
    const TEST_USER_PASSWORD = faker.random.word();
    const TEST_ACCOUNT_KEY = core.common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
    });
    const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD
    );

    beforeEach(async () => {
      TEST_DEVICE = await devicesService.create({
        op: faker.random.word(),
        hostname: faker.internet.ip(),
      });

      const payload: SignUpPayload = {
        username: TEST_USERNAME,
        accountKey: TEST_ACCOUNT_KEY,
        salt: TEST_SRP_VERIFIER.salt,
        verifier: TEST_SRP_VERIFIER.verifier,
        deviceUuid: TEST_DEVICE.id,
      };

      await api.signUp(payload);
    });

    it('should start session', async () => {
      const signInResponse = await api.signIn({
        accountKey: TEST_ACCOUNT_KEY,
        deviceUuid: TEST_DEVICE.id,
      });

      const {
        body: {
          data: { salt, sessionUuid, serverPublicEphemeral },
        },
      } = signInResponse;

      const initSession = await sessionsService.findOne({
        where: { id: sessionUuid },
      });

      const ephemeralPairKeys = core.srp.client.generateEphemeral();

      const session = core.srp.client.deriveSession(
        salt,
        TEST_ACCOUNT_KEY,
        TEST_USER_PASSWORD,
        ephemeralPairKeys.secret,
        serverPublicEphemeral
      );

      const startSessionResponse = await api.startSession({
        sessionUuid,
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
          updatedAt: updateSession.updatedAt,
          expiresAt: updateSession.expiresAt,
        })
      );
    });
  });
});
