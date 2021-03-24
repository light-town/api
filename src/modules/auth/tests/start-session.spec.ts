import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import core from '@light-town/core';
import { MFATypesEnum, StartSessionPayload } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import AccountsService from '~/modules/accounts/accounts.service';
import SessionsService from '~/modules/sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let accountsService: AccountsService;
  let sessionsService: SessionsService;
  let jwtService: JwtService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    authService = moduleFixture.get<AuthService>(AuthService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start session', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TEST_USER_PASSWORD = faker.random.word();
    const TEST_CLIENT_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD
    );
    const TEST_CLIENT_EPHEMERAL = core.srp.client.generateEphemeral();
    const TEST_SERVER_EPHEMERAL = core.srp.server.generateEphemeral(
      TEST_CLIENT_VERIFIER.verifier
    );

    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.NONE,
      },
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: TEST_SERVER_EPHEMERAL.secret,
      accountId: TEST_ACCOUNT.id,
      verifyStage: {
        name: VerifySessionStageEnum.COMPLETED,
      },
    };

    const TEST_CLIENT_SESSION = core.srp.client.deriveSession(
      TEST_ACCOUNT.salt,
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD,
      TEST_CLIENT_EPHEMERAL.secret,
      TEST_SERVER_EPHEMERAL.public
    );

    const payload: StartSessionPayload = {
      sessionUuid: TEST_SESSION.id,
      clientPublicEphemeralKey: TEST_CLIENT_EPHEMERAL.public,
      clientSessionProofKey: TEST_CLIENT_SESSION.proof,
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const sessionUpdateFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const response = await authService.startSession(payload);

    expect(response.serverSessionProof).toBeDefined();
    expect(uuid.validate(response.serverSessionProof)).toBeFalsy();

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(sessionFindOneFunc).toBeCalledWith({
      select: ['id', 'secret', 'accountId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
        expiresAt: (sessionFindOneFunc.mock.calls[0][0].where as any).expiresAt,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
        },
      },
    });

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['id', 'salt', 'key', 'verifier', 'mfaType'],
      where: { id: TEST_ACCOUNT.id, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    expect(sessionUpdateFunc).toBeCalledTimes(1);
    expect(sessionUpdateFunc).toBeCalledWith(
      {
        id: TEST_SESSION.id,
      },
      { expiresAt: sessionUpdateFunc.mock.calls[0][1].expiresAt }
    );
  });

  it('should return invalid session info when session was not found', async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: faker.random.uuid(),
      accountId: faker.random.uuid(),
    };

    const payload: StartSessionPayload = {
      sessionUuid: TEST_SESSION.id,
      clientPublicEphemeralKey: faker.random.uuid(),
      clientSessionProofKey: faker.random.uuid(),
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await authService.startSession(payload);

    expect(response.serverSessionProof).toBeDefined();
    expect(uuid.validate(response.serverSessionProof)).toBeTruthy();
    expect(
      jwtService.verify(response.token, { secret: process.env.JWT_SECRET_KEY })
    ).toBeDefined();

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(sessionFindOneFunc).toBeCalledWith({
      select: ['id', 'secret', 'accountId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
        expiresAt: (sessionFindOneFunc.mock.calls[0][0].where as any).expiresAt,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
        },
      },
    });
  });

  it('should throw 403 error when the session was not verified', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TEST_USER_PASSWORD = faker.random.word();
    const TEST_CLIENT_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD
    );

    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.FINGERPRINT,
      },
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: faker.random.uuid(),
      accountId: faker.random.uuid(),
      verifyStage: VerifySessionStageEnum.REQUIRED,
    };

    const payload: StartSessionPayload = {
      sessionUuid: TEST_SESSION.id,
      clientPublicEphemeralKey: faker.random.uuid(),
      clientSessionProofKey: faker.random.uuid(),
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    try {
      await authService.startSession(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ForbiddenException(`The session was not verified`)
      );
    }

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledTimes(1);
  });

  it('should correct start session when the account has MFA, but the session is not required to verify', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TEST_USER_PASSWORD = faker.random.word();
    const TEST_CLIENT_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD
    );
    const TEST_CLIENT_EPHEMERAL = core.srp.client.generateEphemeral();
    const TEST_SERVER_EPHEMERAL = core.srp.server.generateEphemeral(
      TEST_CLIENT_VERIFIER.verifier
    );

    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.FINGERPRINT,
      },
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: TEST_SERVER_EPHEMERAL.secret,
      accountId: TEST_ACCOUNT.id,
      verifyStage: {
        name: VerifySessionStageEnum.NOT_REQUIRED,
      },
    };

    const TEST_CLIENT_SESSION = core.srp.client.deriveSession(
      TEST_ACCOUNT.salt,
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD,
      TEST_CLIENT_EPHEMERAL.secret,
      TEST_SERVER_EPHEMERAL.public
    );

    const payload: StartSessionPayload = {
      sessionUuid: TEST_SESSION.id,
      clientPublicEphemeralKey: TEST_CLIENT_EPHEMERAL.public,
      clientSessionProofKey: TEST_CLIENT_SESSION.proof,
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    await authService.startSession(payload);

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(updateSessionFunc).toBeCalledTimes(1);
  });

  test.todo('should throw 404 when session is expired');
});
