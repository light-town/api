import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateTeamOptions, Team } from './teams.dto';
import TeamsService from './teams.service';
import TeamMembersService from '../team-members/team-members.service';

@AuthGuard()
@ApiTags('/teams')
@Controller('/teams')
export class TeamsController {
  public constructor(
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService
  ) {}

  @Post()
  public createTeam(
    @CurrentAccount() account,
    @Body() options: CreateTeamOptions
  ): Promise<Team> {
    return this.teamsService.format(
      this.teamsService.createTeam(account.id, options)
    );
  }

  @Get()
  public async getTeams(@CurrentAccount() account): Promise<Team[]> {
    const currentTeamMembers = await this.teamMembersService.getTeamMembers({
      accountId: account.id,
    });

    return this.teamsService.formatAll(
      this.teamsService.getTeams({
        memberIds: currentTeamMembers.map(m => m.id),
      })
    );
  }

  @Get('/:teamUuid')
  public async getTeam(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string
  ): Promise<Team> {
    const team = await this.teamsService.getTeam({ id: teamUuid });

    if (!team) throw new ApiNotFoundException('The team was not found');

    const currentTeamMember = await this.teamMembersService.getTeamMember({
      accountId: account.id,
      teamId: team.id,
    });

    if (!currentTeamMember)
      throw new ApiForbiddenException('The user is not a member of the team');

    return this.teamsService.format(team);
  }
}

export default TeamsController;
