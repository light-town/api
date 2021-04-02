import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { UserEntity } from '~/db/entities/user.entity';
import { AccountsService } from '../accounts.service';
import { Repository } from 'typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { createTestingModule } from './helpers/createTestingModule';
import { UsersService } from '~/modules/users/users.service';
import core from '@light-town/core';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import { INestApplication } from '@nestjs/common';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import DevicesService from '~/modules/devices/devices.service';

describe('[Account Module] [Service]...', () => {
  let app: INestApplication;
  let accountsService: AccountsService;
  let usersService: UsersService;
  let devicesService: DevicesService;
  let acoountsRepository: Repository<AccountEntity>;
  let mfaTypesRepository: Repository<MFATypeEntity>;

  beforeAll(async () => {
    app = await createTestingModule();

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
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A1',
      secret: core.common.generateCryptoRandomString(32),
    });

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
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A1',
      secret: core.common.generateCryptoRandomString(32),
    });

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
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A1',
      secret: core.common.generateCryptoRandomString(32),
    });

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
      const TEST_USER = {
        id: faker.datatype.uuid(),
      };
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
        userId: TEST_USER.id,
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
        TEST_USER.id,
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
      const TEST_USER = {
        id: faker.datatype.uuid(),
      };
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
        userId: TEST_USER.id,
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
          TEST_USER.id,
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

    it('should throw error when user is not owner account', async () => {
      const TEST_USER = {
        id: faker.datatype.uuid(),
      };
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
        userId: faker.datatype.uuid(),
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

      try {
        await accountsService.setMultiFactorAuthType(
          TEST_USER.id,
          TEST_ACCOUNT.id,
          TEST_DEVICE.id,
          TEST_MFA_TYPE.name
        );
      } catch (e) {
        expect(e).toStrictEqual(new ApiForbiddenException('Аccess denied'));
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
