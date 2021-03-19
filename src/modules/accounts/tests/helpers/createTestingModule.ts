import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import UsersService from '~/modules/users/users.service';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import { mockUsersService } from '../__mocks__/mockUsersService';
import AccountsModule from '~/modules/accounts/accounts.module';
import AccountEntity from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [AccountsModule],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(AccountEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(MFATypeEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(UsersService)
    .useFactory({ factory: mockUsersService })
    .compile();

export default createTestingModule;
