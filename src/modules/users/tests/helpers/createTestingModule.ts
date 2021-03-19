import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import UsersService from '~/modules/users/users.module';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [UsersService],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .compile();

export default createTestingModule;
