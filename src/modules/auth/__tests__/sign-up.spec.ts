import { AuthService } from '../auth.service';
import { createModuleHelper } from './helpers/create-module.helper';
import core from '@light-town/core';
import { SignUpPayload } from '../auth.dto';
import * as faker from 'faker';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import DevicesService from '~/modules/devices/devices.service';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultsService from '~/modules/vaults/vaults.service';
import KeySetsService from '~/modules/key-sets/key-sets.service';

dotenv.config();

describe('[Auth Module] [Service] ...', () => {
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let accountsService: AccountsService;
  let devicesService: DevicesService;
  let keySetsService: KeySetsService;
  let vaultsService: VaultsService;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    devicesService = moduleFixture.get<DevicesService>(DevicesService);
    vaultsService = moduleFixture.get<VaultsService>(VaultsService);
    keySetsService = moduleFixture.get<KeySetsService>(KeySetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should sign up', async () => {
    const TEST_USER_UUID = faker.datatype.uuid();
    const TEST_USER_NAME = faker.internet.userName();
    const TEST_ACCOUNT_UUID = faker.datatype.uuid();
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TEST_DEVICE_UUID = faker.datatype.uuid();
    const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      faker.random.word()
    );
    const TEST_VAULT = {
      id: faker.datatype.uuid(),
    };

    const payload: SignUpPayload = {
      deviceUuid: faker.datatype.uuid(),
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
        encCategories: [],
      },
    };

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>{ id: TEST_DEVICE_UUID });

    const userCreateFunc = jest
      .spyOn(usersService, 'create')
      .mockResolvedValueOnce(<any>{ id: TEST_USER_UUID });

    const accountCreateFunc = jest
      .spyOn(accountsService, 'create')
      .mockResolvedValueOnce(<any>{ id: TEST_ACCOUNT_UUID });

    const vaultCreateFn = jest
      .spyOn(vaultsService, 'create')
      .mockResolvedValueOnce(<any>TEST_VAULT);

    jest.spyOn(keySetsService, 'create').mockResolvedValueOnce(<any>{});

    await authService.signUp(payload);

    expect(userCreateFunc).toHaveBeenCalledTimes(1);
    expect(userCreateFunc).toHaveBeenCalledWith({
      name: TEST_USER_NAME,
      avatarURL: undefined,
    });

    expect(accountCreateFunc).toBeCalledTimes(1);
    expect(accountCreateFunc).toBeCalledWith({
      key: TEST_ACCOUNT_KEY,
      userId: TEST_USER_UUID,
      salt: TEST_SRP_VERIFIER.salt,
      verifier: TEST_SRP_VERIFIER.verifier,
    });

    expect(vaultCreateFn).toHaveBeenCalledTimes(1);
    expect(vaultCreateFn).toHaveBeenCalledWith(
      TEST_ACCOUNT_UUID,
      payload.primaryVault
    );

    expect(keySetsService.create).toHaveBeenCalledTimes(1);
    expect(keySetsService.create).toHaveBeenCalledWith(
      TEST_ACCOUNT_UUID,
      TEST_ACCOUNT_UUID,
      payload.primaryKeySet,
      { isAccountOwner: true, isPrimary: true }
    );
  });

  it('should throw an error whene device was not found', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TEST_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      faker.random.word()
    );
    const TEST_USER_NAME = faker.internet.userName();

    const payload: SignUpPayload = {
      deviceUuid: faker.datatype.uuid(),
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
        encCategories: [],
      },
    };

    jest.spyOn(devicesService, 'findOne').mockResolvedValueOnce(undefined);

    try {
      await authService.signUp(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException(`The device was not found`)
      );
    }
  });
});
