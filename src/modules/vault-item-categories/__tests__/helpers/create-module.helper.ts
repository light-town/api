import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import VaultItemCategoriesModule from '../../vault-item-categories.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [VaultItemCategoriesModule],
    })
  ).compile();

export default createModuleHelper;
