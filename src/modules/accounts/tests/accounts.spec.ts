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

describe('[Auth Module] ...', () => {
  let accountsService: AccountsService;
  let usersService: UsersService;
  let acoountsRepository: Repository<AccountEntity>;
  let mfaTypesRepository: Repository<MFATypeEntity>;

  beforeAll(async () => {
    const moduleFixture = await createTestingModule();

    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    acoountsRepository = moduleFixture.get<Repository<AccountEntity>>(
      getRepositoryToken(AccountEntity)
    );
    mfaTypesRepository = moduleFixture.get<Repository<MFATypeEntity>>(
      getRepositoryToken(MFATypeEntity)
    );
    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create user account', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A1',
      secret: core.common.generateCryptoRandomString(32),
    });

    const TEST_USER: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const TEST_ACCOUNT: AccountEntity = {
      id: faker.random.uuid(),
      key: TEST_ACCOUNT_KEY,
      userId: TEST_USER.id,
      salt: faker.random.word(),
      verifier: faker.random.word(),
      mfaTypeId: faker.random.uuid(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(TEST_USER);
    jest
      .spyOn(acoountsRepository.manager, 'save')
      .mockResolvedValueOnce(TEST_ACCOUNT);

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
  });
});