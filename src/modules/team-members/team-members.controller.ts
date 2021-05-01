import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiForbiddenException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateTeamMemberPayload, TeamMember } from './team-members.dto';
import TeamMembersService from './team-members.service';

@AuthGuard()
@ApiTags('/teams/members')
@Controller()
export class TeamMembersController {
  public constructor(private readonly teamMembersService: TeamMembersService) {}

  @Post('/teams/:teamUuid/members')
  public createTeamMember(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateTeamMemberPayload
  ): Promise<TeamMember> {
    return this.teamMembersService.format(
      this.teamMembersService.createMember(account.id, {
        teamId: teamUuid,
        accountId: payload.accountUuid,
        roleId: payload.roleUuid,
      })
    );
  }

  @Get('/teams/:teamUuid/members')
  public async getTeamMembers(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string
  ): Promise<TeamMember[]> {
    if (!(await this.teamMembersService.isMember(account.id, teamUuid)))
      throw new ApiForbiddenException('The user is not a member of the team');

    return this.teamMembersService.formatAll(
      this.teamMembersService.getTeamMembers({
        teamId: teamUuid,
      })
    );
  }

  @Get('/teams/:teamUuid/members/:memberUuid')
  public getTeamMember(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string,
    @Param('memberUuid') memberUuid: string
  ): Promise<TeamMember> {
    return this.teamMembersService.format(
      this.teamMembersService.getTeamMember({
        id: memberUuid,
        teamId: teamUuid,
      })
    );
  }
}

export default TeamMembersController;
