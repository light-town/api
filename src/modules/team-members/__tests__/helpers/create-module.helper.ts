import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import TeamMembersModule from '../../team-members.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [TeamMembersModule],
    })
  ).compile();

export default createModuleHelper;
