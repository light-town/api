import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import CurrentAccount from '../auth/current-account';
import { CreateTeamPayload, TeamMember } from './team-members.dto';
import TeamMembersService from './team-members.service';

@ApiTags('/teams/members')
@Controller()
export class TeamMemberController {
  public constructor(private readonly teamMembersService: TeamMembersService) {}

  @Post('/teams/:teamUuid/members')
  public createTeamMembers(
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateTeamPayload
  ): Promise<TeamMember> {
    return this.teamMembersService.format(
      this.teamMembersService.createMember(teamUuid, payload.accountUuid)
    );
  }

  @Get('/teams/:teamUuid/members')
  public getTeamMembers(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string
  ): Promise<TeamMember[]> {
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

export default TeamMemberController;
