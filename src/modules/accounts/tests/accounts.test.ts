import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { UserEntity } from '~/db/entities/user.entity';
import { AccountsService } from '../accounts.service';
import { Repository } from 'typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { createTestingModule } from './helpers/createTestModule.helper';
import { UsersService } from '~/modules/users/users.service';

describe('[Auth Module] ...', () => {
  let accountsService: AccountsService;
  let usersService: UsersService;
  let acoountsRepository: Repository<AccountEntity>;

  beforeAll(async () => {
    const moduleFixture = await createTestingModule();

    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    acoountsRepository = moduleFixture.get<Repository<AccountEntity>>(
      getRepositoryToken(AccountEntity)
    );
    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  it('should create user account', async () => {
    const TEST_USER: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarURL: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const TEST_ACCOUNT: AccountEntity = {
      id: faker.random.uuid(),
      userId: TEST_USER.id,
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(TEST_USER);
    jest.spyOn(acoountsRepository, 'save').mockResolvedValueOnce(TEST_ACCOUNT);

    const account: AccountEntity = await accountsService.create(TEST_USER.id);

    expect(account).toStrictEqual(TEST_ACCOUNT);
  });
});
