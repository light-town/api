import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import VaultsModule from '~/modules/vaults/vaults.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [VaultsModule],
    })
  ).compile();

export default createModuleHelper;
