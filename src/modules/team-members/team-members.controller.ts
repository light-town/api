import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from './current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from './current-team-member.interceptor';
import { CreateTeamMemberPayload, TeamMember } from './team-members.dto';
import TeamMembersService from './team-members.service';

@AuthGuard()
@ApiTags('/teams/members')
@Controller()
export class TeamMembersController {
  public constructor(
    private readonly teamMembersService: TeamMembersService,
    private readonly rolesService: RolesService
  ) {}

  @ApiCreatedResponse({ type: TeamMember })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Post('/teams/:teamUuid/members')
  public async createTeamMember(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateTeamMemberPayload
  ): Promise<TeamMember> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.teamMembersService.format(
      this.teamMembersService.createMember({
        teamId: teamUuid,
        accountId: payload.accountUuid,
        roleId: payload.roleUuid,
      })
    );
  }

  @ApiCreatedResponse({ type: [TeamMember] })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/members')
  public async getTeamMembers(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<TeamMember[]> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.teamMembersService.formatAll(
      this.teamMembersService.getTeamMembers({
        teamId: teamUuid,
      })
    );
  }

  @ApiCreatedResponse({ type: TeamMember })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/members/:memberUuid')
  public async getTeamMember(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('memberUuid') memberUuid: string
  ): Promise<TeamMember> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.teamMembersService.format(
      this.teamMembersService.getTeamMember({
        id: memberUuid,
        teamId: teamUuid,
      })
    );
  }
}

export default TeamMembersController;
