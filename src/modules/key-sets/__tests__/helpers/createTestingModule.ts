import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mockEntities';
import AuthModule from '~/modules/auth/auth.module';

export const createTestingModule = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [AuthModule],
    })
  ).compile();

export default createTestingModule;
