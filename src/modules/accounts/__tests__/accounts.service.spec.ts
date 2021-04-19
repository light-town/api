import * as faker from 'faker';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import core from '@light-town/core';
import { UserEntity } from '~/db/entities/user.entity';
import { AccountEntity } from '~/db/entities/account.entity';
import { UsersService } from '~/modules/users/users.service';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import { ApiNotFoundException } from '~/common/exceptions';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import DevicesService from '~/modules/devices/devices.service';
import { createModuleHelper } from './helpers/create-module.helper';
import { AccountsService } from '../accounts.service';

describe('[Account Module] [Service]...', () => {
  let app: TestingModule;
  let accountsService: AccountsService;
  let usersService: UsersService;
  let devicesService: DevicesService;
  let acoountsRepository: Repository<AccountEntity>;
  let mfaTypesRepository: Repository<MFATypeEntity>;

  beforeAll(async () => {
    app = await createModuleHelper();

    accountsService = app.get<AccountsService>(AccountsService);
    acoountsRepository = app.get<Repository<AccountEntity>>(
      getRepositoryToken(AccountEntity)
    );
    mfaTypesRepository = app.get<Repository<MFATypeEntity>>(
      getRepositoryToken(MFATypeEntity)
    );
    usersService = app.get<UsersService>(UsersService);
    devicesService = app.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user account', async () => {
    const TEST_ACCOUNT_KEY = core.encryption.common.generateAccountKey(
      'A1',
      core.encryption.common.generateCryptoRandomString(32)
    );

    const TEST_USER: UserEntity = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const TEST_ACCOUNT: AccountEntity = {
      id: faker.datatype.uuid(),
      key: TEST_ACCOUNT_KEY,
      userId: TEST_USER.id,
      salt: faker.random.word(),
      verifier: faker.random.word(),
      mfaTypeId: faker.datatype.uuid(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(TEST_USER);
    jest.spyOn(acoountsRepository, 'create').mockReturnValueOnce(TEST_ACCOUNT);
    jest.spyOn(acoountsRepository, 'save').mockResolvedValueOnce(TEST_ACCOUNT);
    jest
      .spyOn(mfaTypesRepository, 'findOne')
      .mockResolvedValueOnce(<any>{ id: TEST_ACCOUNT.mfaTypeId });

    const account: AccountEntity = await accountsService.create({
      key: TEST_ACCOUNT_KEY,
      userId: TEST_USER.id,
      salt: TEST_ACCOUNT.salt,
      verifier: TEST_ACCOUNT.verifier,
    });

    expect(account).toStrictEqual(TEST_ACCOUNT);

    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledWith({
      select: ['id'],
      where: { id: TEST_USER.id, isDeleted: false },
    });

    expect(jest.spyOn(acoountsRepository, 'create')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(acoountsRepository, 'create')).toHaveBeenCalledWith({
      key: TEST_ACCOUNT.key,
      userId: TEST_USER.id,
      salt: TEST_ACCOUNT.salt,
      verifier: TEST_ACCOUNT.verifier,
      mfaTypeId: TEST_ACCOUNT.mfaTypeId,
    });

    expect(jest.spyOn(acoountsRepository, 'save')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(acoountsRepository, 'save')).toHaveBeenCalledWith(
      TEST_ACCOUNT
    );

    expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledWith({
      select: ['id'],
      where: { name: MFATypesEnum.NONE },
    });
  });

  it('should throw error when user was not found', async () => {
    const TEST_USER_ID = faker.datatype.uuid();
    const TEST_ACCOUNT_KEY = core.encryption.common.generateAccountKey(
      'A1',
      core.encryption.common.generateCryptoRandomString(32)
    );

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);

    try {
      await accountsService.create({
        key: TEST_ACCOUNT_KEY,
        userId: TEST_USER_ID,
        salt: '',
        verifier: '',
      });
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The user was not found')
      );
    }

    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledWith({
      select: ['id'],
      where: { id: TEST_USER_ID, isDeleted: false },
    });
  });

  it('should throw error when MFA type was not found', async () => {
    const TEST_ACCOUNT_KEY = core.encryption.common.generateAccountKey(
      'A1',
      core.encryption.common.generateCryptoRandomString(32)
    );

    const TEST_USER: UserEntity = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const TEST_ACCOUNT: AccountEntity = {
      id: faker.datatype.uuid(),
      key: TEST_ACCOUNT_KEY,
      userId: TEST_USER.id,
      salt: faker.random.word(),
      verifier: faker.random.word(),
      mfaTypeId: faker.datatype.uuid(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(TEST_USER);
    jest.spyOn(acoountsRepository, 'create').mockReturnValueOnce(TEST_ACCOUNT);
    jest.spyOn(acoountsRepository, 'save').mockResolvedValueOnce(TEST_ACCOUNT);
    jest.spyOn(mfaTypesRepository, 'findOne').mockResolvedValueOnce(undefined);

    try {
      await accountsService.create({
        key: TEST_ACCOUNT_KEY,
        userId: TEST_USER.id,
        salt: TEST_ACCOUNT.salt,
        verifier: TEST_ACCOUNT.verifier,
      });
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The MFA type was not found')
      );
    }

    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(usersService, 'findOne')).toHaveBeenCalledWith({
      select: ['id'],
      where: { id: TEST_USER.id, isDeleted: false },
    });

    expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledWith({
      select: ['id'],
      where: { name: MFATypesEnum.NONE },
    });

    expect(jest.spyOn(acoountsRepository, 'create')).toHaveBeenCalledTimes(0);
    expect(jest.spyOn(acoountsRepository, 'save')).toHaveBeenCalledTimes(0);
  });

  describe('[Settings] ...', () => {
    it('should set MFA type to user acoount', async () => {
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_DEVICE = {
        id: faker.datatype.uuid(),
      };
      const TEST_MFA_TYPE = {
        id: faker.datatype.uuid(),
        name: MFATypesEnum.FINGERPRINT,
      };

      jest
        .spyOn(accountsService, 'findOne')
        .mockResolvedValueOnce(<any>TEST_ACCOUNT);
      jest
        .spyOn(mfaTypesRepository, 'findOne')
        .mockResolvedValueOnce(<any>TEST_MFA_TYPE);
      jest
        .spyOn(devicesService, 'createVerificationDevice')
        .mockImplementationOnce((): any => {});

      await accountsService.setMultiFactorAuthType(
        TEST_ACCOUNT.id,
        TEST_DEVICE.id,
        TEST_MFA_TYPE.name
      );

      expect(jest.spyOn(accountsService, 'findOne')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(accountsService, 'findOne')).toHaveBeenCalledWith({
        select: ['id', 'userId'],
        where: {
          id: TEST_ACCOUNT.id,
          isDeleted: false,
        },
      });

      expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledTimes(
        1
      );

      expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledWith({
        select: ['id'],
        where: {
          name: TEST_MFA_TYPE.name,
          isDeleted: false,
        },
      });

      expect(
        jest.spyOn(devicesService, 'createVerificationDevice')
      ).toHaveBeenCalledTimes(1);

      expect(
        jest.spyOn(devicesService, 'createVerificationDevice')
      ).toHaveBeenCalledWith(TEST_DEVICE.id, TEST_ACCOUNT.id);

      expect(jest.spyOn(acoountsRepository, 'update')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(acoountsRepository, 'update')).toHaveBeenCalledWith(
        { id: TEST_ACCOUNT.id },
        { mfaTypeId: TEST_MFA_TYPE.id }
      );
    });

    it('should throw error when account was not found', async () => {
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_DEVICE = {
        id: faker.datatype.uuid(),
      };
      const TEST_MFA_TYPE = {
        id: faker.datatype.uuid(),
        name: MFATypesEnum.FINGERPRINT,
      };

      jest.spyOn(accountsService, 'findOne').mockResolvedValueOnce(undefined);

      try {
        await accountsService.setMultiFactorAuthType(
          TEST_ACCOUNT.id,
          TEST_DEVICE.id,
          TEST_MFA_TYPE.name
        );
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiNotFoundException('The account was not found')
        );
      }

      expect(jest.spyOn(accountsService, 'findOne')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(accountsService, 'findOne')).toHaveBeenCalledWith({
        select: ['id', 'userId'],
        where: {
          id: TEST_ACCOUNT.id,
          isDeleted: false,
        },
      });

      expect(jest.spyOn(mfaTypesRepository, 'findOne')).toHaveBeenCalledTimes(
        0
      );
      expect(
        jest.spyOn(devicesService, 'createVerificationDevice')
      ).toHaveBeenCalledTimes(0);

      expect(jest.spyOn(acoountsRepository, 'update')).toHaveBeenCalledTimes(0);
    });
  });
});
