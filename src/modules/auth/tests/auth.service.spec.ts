import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import { srp, common } from '@light-town/core';
import { SignInDTO, SignUpDTO, StartSessionDTO } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import core from '@light-town/core';
import SessionsService from '~/modules/sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';

dotenv.config();

describe('[Auth Module] ...', () => {
  let connection: Connection;
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let accountsService: AccountsService;
  let sessionsService: SessionsService;
  let jwtService: JwtService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should sign up', async () => {
    const ACCOUNT_KEY = common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
    });
    const VERIFIER = srp.client.deriveVerifier(
      ACCOUNT_KEY,
      faker.random.word()
    );
    const USERNAME = faker.internet.userName();

    const payload: SignUpDTO = {
      accountKey: ACCOUNT_KEY,
      salt: VERIFIER.salt,
      verifier: VERIFIER.verifier,
      username: USERNAME,
    };

    jest
      .spyOn(connection, 'transaction')
      .mockImplementation(async (func: any) => {
        return await func();
      });

    const USER_ID = faker.random.uuid();
    const userCreateFunc = jest
      .spyOn(usersService, 'create')
      .mockResolvedValueOnce({ id: USER_ID });

    const ACCOUNT_ID = faker.random.uuid();
    const accountCreateFunc = jest
      .spyOn(accountsService, 'create')
      .mockResolvedValueOnce({ id: ACCOUNT_ID });

    await authService.signUp(payload);

    expect(userCreateFunc).toBeCalledTimes(1);
    expect(userCreateFunc).toBeCalledWith(USERNAME, { avatarURL: undefined });

    expect(accountCreateFunc).toBeCalledTimes(1);
    expect(accountCreateFunc).toBeCalledWith({
      key: ACCOUNT_KEY,
      userId: USER_ID,
      salt: VERIFIER.salt,
      verifier: VERIFIER.verifier,
    });
  });

  it('should sign in', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: common.genAccountKey({
        versionCode: 'A3',
        userId: faker.random.uuid(),
      }),
      salt: core.common.genSalt(),
      verifier: core.common.genSalt(),
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
    };

    const TEST_DEVICE_ID = faker.random.uuid();

    const payload: SignInDTO = {
      accountKey: TEST_ACCOUNT.key,
      deviceId: TEST_DEVICE_ID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT)
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const sessionCreateFunc = jest
      .spyOn(sessionsService, 'create')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['salt', 'verifier'],
      where: { key: TEST_ACCOUNT.key },
    });

    expect(sessionCreateFunc).toBeCalledTimes(1);
    expect(sessionCreateFunc).toBeCalledWith({
      accountId: TEST_ACCOUNT.id,
      deviceId: TEST_DEVICE_ID,
      secret: sessionCreateFunc.mock.calls[0][0].secret,
    });

    expect(response.salt).toStrictEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionId)).toEqual(4);
    expect(uuid.validate(response.sessionId)).toBeTruthy();
  });

  it('should return random salt when account is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: common.genAccountKey({
        versionCode: 'A3',
        userId: faker.random.uuid(),
      }),
      salt: core.common.genSalt(),
      verifier: core.common.genSalt(),
    };
    const TEST_DEVICE_ID = faker.random.uuid();

    const payload: SignInDTO = {
      accountKey: TEST_ACCOUNT.key,
      deviceId: TEST_DEVICE_ID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['salt', 'verifier'],
      where: { key: TEST_ACCOUNT.key },
    });

    expect(response.salt).not.toEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionId)).toEqual(4);
    expect(uuid.validate(response.sessionId)).toBeTruthy();
  });

  it('should start session', async () => {
    const TEST_ACCOUNT_KEY = common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
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
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: TEST_SERVER_EPHEMERAL.secret,
      accountId: TEST_ACCOUNT.id,
    };

    const TEST_CLIENT_SESSION = core.srp.client.deriveSession(
      TEST_ACCOUNT.salt,
      TEST_ACCOUNT_KEY,
      TEST_USER_PASSWORD,
      TEST_CLIENT_EPHEMERAL.secret,
      TEST_SERVER_EPHEMERAL.public
    );

    const payload: StartSessionDTO = {
      sessionId: TEST_SESSION.id,
      clientPubicEphemeralKey: TEST_CLIENT_EPHEMERAL.public,
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
      select: ['id', 'secret', 'accountId'],
      where: {
        id: TEST_SESSION.id,
      },
    });

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['salt', 'key', 'verifier'],
      where: { id: TEST_ACCOUNT.id },
    });

    expect(sessionUpdateFunc).toBeCalledTimes(1);
    expect(sessionUpdateFunc).toBeCalledWith(
      {
        id: TEST_SESSION.id,
      },
      { expiresAt: sessionUpdateFunc.mock.calls[0][1].expiresAt }
    );
  });

  it('should start session', async () => {
    const TEST_SESSION = {
      id: faker.random.uuid(),
      secret: faker.random.uuid(),
      accountId: faker.random.uuid(),
    };

    const payload: StartSessionDTO = {
      sessionId: TEST_SESSION.id,
      clientPubicEphemeralKey: faker.random.uuid(),
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
      select: ['id', 'secret', 'accountId'],
      where: {
        id: TEST_SESSION.id,
      },
    });
  });
});
