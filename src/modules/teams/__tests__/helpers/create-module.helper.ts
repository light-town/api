import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import TeamsModule from '../../teams.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [TeamsModule],
    })
  ).compile();

export default createModuleHelper;
