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
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';

@AuthGuard()
@ApiTags('/teams')
@Controller('/teams')
export class TeamsController {
  public constructor(
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService,
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService
  ) {}

  @ApiCreatedResponse({ type: Team })
  @Post()
  public async createTeam(
    @CurrentAccount() account,
    @Body() options: CreateTeamOptions
  ): Promise<Team> {
    const newTeam = await this.teamsService.createTeam(account.id, options);
    const keySet = await this.keySetObjectsService.getKeySet({
      teamId: newTeam.id,
      keySetOwnerAccountId: account.id,
    });

    return this.teamsService.format({
      ...newTeam,
      keySetUuid: keySet.id,
      membersCount: 1,
      vaultsCount: 0,
    });
  }

  @ApiCreatedResponse({ type: [Team] })
  @Get()
  public async getTeams(@CurrentAccount() account): Promise<Team[]> {
    const accountTeamMembers = await this.teamMembersService.getTeamMembers({
      accountId: account.id,
    });

    if (!accountTeamMembers.length) return [];

    const foundTeams = await this.teamsService.getTeams({
      memberIds: accountTeamMembers.map(m => m.id),
    });

    return Promise.all(
      foundTeams.map(async team => {
        const [accountKeySet, membersCount, teamKeySetIds] = await Promise.all([
          this.keySetObjectsService.getKeySet({
            teamId: team.id,
            keySetOwnerAccountId: account.id,
          }),
          this.teamMembersService.getTeamMembersCount({
            teamId: team.id,
          }),
          this.keySetObjectsService.getKeySetIds({
            keySetOwnerTeamId: team.id,
          }),
        ]);

        return this.teamsService.format({
          ...team,
          keySetUuid: accountKeySet.id,
          membersCount,
          vaultsCount: teamKeySetIds.length,
        });
      })
    );
  }

  @ApiCreatedResponse({ type: Team })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/:teamUuid')
  public async getTeam(
    @CurrentAccount() account,
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<Team> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    const team = await this.teamsService.getTeam({ id: teamUuid });
    const accountKeySet = await this.keySetObjectsService.getKeySet({
      teamId: team.id,
      keySetOwnerAccountId: account.id,
    });
    const membersCount = await this.teamMembersService.getTeamMembersCount({
      teamId: team.id,
    });

    const teamKeySetIds = await this.keySetObjectsService.getKeySetIds({
      keySetOwnerTeamId: team.id,
    });

    return this.teamsService.format({
      ...team,
      keySetUuid: accountKeySet.id,
      membersCount,
      vaultsCount: teamKeySetIds.length,
    });
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
