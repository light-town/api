import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import AuthModule from '~/modules/auth/auth.module';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [AuthModule],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .compile();

export default createTestingModule;
