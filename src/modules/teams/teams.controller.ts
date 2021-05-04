import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Inject,
  forwardRef,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { CreateTeamOptions, Team } from './teams.dto';
import TeamsService from './teams.service';
import TeamMembersService from '../team-members/team-members.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import RolesService from '../roles/roles.service';
import { ObjectTypesEnum } from '../roles/roles.dto';
import { PermissionTypesEnum } from '../permissions/permissions.dto';

@AuthGuard()
@ApiTags('/teams')
@Controller('/teams')
export class TeamsController {
  public constructor(
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService
  ) {}

  @ApiCreatedResponse({ type: Team })
  @Post()
  public createTeam(
    @CurrentAccount() account,
    @Body() options: CreateTeamOptions
  ): Promise<Team> {
    return this.teamsService.format(
      this.teamsService.createTeam(account.id, options)
    );
  }

  @ApiCreatedResponse({ type: [Team] })
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

  @ApiCreatedResponse({ type: Team })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/:teamUuid')
  public async getTeam(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<Team> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.teamsService.format(
      this.teamsService.getTeam({ id: teamUuid })
    );
  }

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Delete('/:teamUuid/leave')
  public async leaveTeam(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<void> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    this.teamMembersService.deleteTeamMember(teamUuid);
  }
}

export default TeamsController;
