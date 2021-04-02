import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import core from '@light-town/core';
import { MFATypesEnum, SessionStartPayload } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import AccountsService from '~/modules/accounts/accounts.service';
import SessionsService from '~/modules/sessions/sessions.service';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let accountsService: AccountsService;
  let sessionsService: SessionsService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    authService = moduleFixture.get<AuthService>(AuthService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
    const TEST_CLIENT_EPHEMERAL = core.srp.client.generateEphemeralKeyPair();
    const TEST_SERVER_EPHEMERAL = core.srp.server.generateEphemeralKeyPair(
      TEST_CLIENT_VERIFIER.verifier
    );

    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.NONE,
      },
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: TEST_SERVER_EPHEMERAL.secret,
      accountId: TEST_ACCOUNT.id,
      verificationStage: {
        name: SessionVerificationStageEnum.COMPLETED,
      },
    };

    const TEST_CLIENT_SESSION = core.srp.client.deriveSession(
      TEST_CLIENT_EPHEMERAL.secret,
      TEST_SERVER_EPHEMERAL.public,
      TEST_ACCOUNT.salt,
      TEST_ACCOUNT_KEY,
      TEST_CLIENT_VERIFIER.privateKey
    );

    const payload: SessionStartPayload = {
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

    const response = await authService.startSession(TEST_SESSION.id, payload);

    expect(response.serverSessionProof).toBeDefined();
    expect(uuid.validate(response.serverSessionProof)).toBeFalsy();

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(sessionFindOneFunc).toBeCalledWith({
      select: ['id', 'secret', 'accountId', 'verificationStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['id', 'salt', 'key', 'verifier', 'mfaType', 'userId'],
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

  it('should throw error when session was not found', async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.datatype.uuid(),
      accountId: faker.datatype.uuid(),
    };

    const payload: SessionStartPayload = {
      clientPublicEphemeralKey: faker.datatype.uuid(),
      clientSessionProofKey: faker.datatype.uuid(),
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    try {
      await authService.startSession(TEST_SESSION.id, payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The session was not found')
      );
    }

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(sessionFindOneFunc).toBeCalledWith({
      select: ['id', 'secret', 'accountId', 'verificationStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });
  });

  it('should throw error when the session was not verified', async () => {
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
      id: faker.datatype.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.FINGERPRINT,
      },
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.datatype.uuid(),
      accountId: faker.datatype.uuid(),
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const payload: SessionStartPayload = {
      clientPublicEphemeralKey: faker.datatype.uuid(),
      clientSessionProofKey: faker.datatype.uuid(),
    };

    const sessionFindOneFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    try {
      await authService.startSession(TEST_SESSION.id, payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiForbiddenException(`The session was not verified`)
      );
    }

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledTimes(0);
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
    const TEST_CLIENT_EPHEMERAL = core.srp.client.generateEphemeralKeyPair();
    const TEST_SERVER_EPHEMERAL = core.srp.server.generateEphemeralKeyPair(
      TEST_CLIENT_VERIFIER.verifier
    );

    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
      key: TEST_ACCOUNT_KEY,
      salt: TEST_CLIENT_VERIFIER.salt,
      verifier: TEST_CLIENT_VERIFIER.verifier,
      mfaType: {
        name: MFATypesEnum.FINGERPRINT,
      },
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: TEST_SERVER_EPHEMERAL.secret,
      accountId: TEST_ACCOUNT.id,
      verificationStage: {
        name: SessionVerificationStageEnum.NOT_REQUIRED,
      },
    };

    const TEST_CLIENT_SESSION = core.srp.client.deriveSession(
      TEST_CLIENT_EPHEMERAL.secret,
      TEST_SERVER_EPHEMERAL.public,
      TEST_ACCOUNT.salt,
      TEST_ACCOUNT_KEY,
      TEST_CLIENT_VERIFIER.privateKey
    );

    const payload: SessionStartPayload = {
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

    await authService.startSession(TEST_SESSION.id, payload);

    expect(sessionFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(sessionUpdateFunc).toBeCalledTimes(1);
  });
});
