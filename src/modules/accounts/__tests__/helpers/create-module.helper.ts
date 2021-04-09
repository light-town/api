import { Test } from '@nestjs/testing';
import AccountsModule from '~/modules/accounts/accounts.module';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [AccountsModule],
    })
  ).compile();

export default createModuleHelper;
