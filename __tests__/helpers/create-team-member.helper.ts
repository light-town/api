import { INestApplication } from '@nestjs/common';
import TeamMembersController from '~/modules/team-members/team-members.controller';
import TeamMembersService from '~/modules/team-members/team-members.service';

export interface CreateTeamMemberOptions {
  creaorAccountId: string;
  accountId: string;
  teamId: string;
  roleId: string;
}

export const createTeamMemberHelper = async (
  app: INestApplication,
  options: CreateTeamMemberOptions
) => {
  const teamMembersController = app.get<TeamMembersController>(
    TeamMembersController
  );
  const teamMembersService = app.get<TeamMembersService>(TeamMembersService);

  const teamMember = await teamMembersController.createTeamMember(
    { id: options.creaorAccountId },
    options.teamId,
    {
      accountUuid: options.accountId,
      roleUuid: options.roleId,
    }
  );

  return teamMembersService.getTeamMember({ id: teamMember.uuid });
};

export default createTeamMemberHelper;