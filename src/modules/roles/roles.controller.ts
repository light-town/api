import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import TeamMembersService from '../team-members/team-members.service';
import { CreateRolePayload, ObjectTypesEnum, Role } from './roles.dto';
import RolesService from './roles.service';

@AuthGuard()
@ApiTags('/teams/roles')
@Controller()
export class RolesController {
  public constructor(
    private readonly rolesService: RolesService,
    private readonly teamMembersService: TeamMembersService
  ) {}

  @Post('/teams/:teamUuid/roles')
  public async createRole(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateRolePayload
  ): Promise<Role> {
    const teamMember = await this.teamMembersService.getTeamMember({
      accountId: account,
      teamId: teamUuid,
    });

    this.rolesService.validate(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.rolesService.format(
      this.rolesService.createRole(account.id, {
        name: payload.name,
        teamId: teamUuid,
        parentRoleId: payload.parentRoleUuid,
      })
    );
  }

  @Get('/teams/:teamUuid/roles')
  public async getRoles(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string
  ): Promise<Role[]> {
    const teamMember = await this.teamMembersService.getTeamMember({
      accountId: account,
      teamId: teamUuid,
    });

    this.rolesService.validate(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.rolesService.formatAll(this.rolesService.getRoles({}));
  }

  @Get('/teams/:teamUuid/roles/:roleUuid')
  public async getRole(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string,
    @Param('roleUuid') roleUuid: string
  ): Promise<Role> {
    const teamMember = await this.teamMembersService.getTeamMember({
      accountId: account,
      teamId: teamUuid,
    });

    this.rolesService.validate(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.rolesService.format(
      this.rolesService.getRole({
        id: roleUuid,
      })
    );
  }
}

export default RolesController;
