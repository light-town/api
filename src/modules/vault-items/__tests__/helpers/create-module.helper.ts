import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import VaultItemsModule from '../../vault-items.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [VaultItemsModule],
    })
  ).compile();

export default createModuleHelper;
