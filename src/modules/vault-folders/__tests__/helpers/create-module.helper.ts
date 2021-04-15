import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import VaultFoldersModule from '../../vault-folders.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [VaultFoldersModule],
    })
  ).compile();

export default createModuleHelper;
