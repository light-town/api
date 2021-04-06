import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import AuthModule from '~/modules/auth/auth.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [AuthModule],
    })
  ).compile();

export default createModuleHelper;
