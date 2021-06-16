import { Test } from '@nestjs/testing';
import mockEntities from '~/../__tests__/__mocks__/mock-entities';
import TeamsModule from '~/modules/teams/teams.module';
import InvitationsModule from '../../invitations.module';

export const createModuleHelper = () =>
  mockEntities(
    Test.createTestingModule({
      imports: [InvitationsModule, TeamsModule],
    })
  ).compile();

export default createModuleHelper;
