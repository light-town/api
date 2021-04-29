import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateTeamOptions, Team } from './teams.dto';
import TeamsService from './teams.service';

@AuthGuard()
@ApiTags('/teams')
@Controller('/teams')
export class TeamsController {
  public constructor(private readonly teamsService: TeamsService) {}

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
  public getTeams(@CurrentAccount() account): Promise<Team[]> {
    return this.teamsService.formatAll(this.teamsService.getTeams());
  }

  @Get('/:teamUuid')
  public async getTeam(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string
  ): Promise<Team> {
    const team = await this.teamsService.getTeam({ id: teamUuid });

    if (!team) throw new ApiNotFoundException('The team was not found');

    return this.teamsService.format(team);
  }
}

export default TeamsController;
