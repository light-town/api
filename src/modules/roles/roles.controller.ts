import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import { CreateRolePayload, ObjectTypesEnum, Role } from './roles.dto';
import RolesService from './roles.service';

@AuthGuard()
@ApiTags('/teams/roles')
@Controller()
export class RolesController {
  public constructor(private readonly rolesService: RolesService) {}

  @ApiCreatedResponse({ type: Role })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Post('/teams/:teamUuid/roles')
  public async createRole(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateRolePayload
  ): Promise<Role> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.rolesService.format(
      this.rolesService.createRole({
        name: payload.name,
        teamId: teamUuid,
        parentRoleId: payload.parentRoleUuid,
      })
    );
  }

  @ApiOkResponse({ type: [Role] })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/roles')
  public async getRoles(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<Role[]> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    return this.rolesService.formatAll(this.rolesService.getRoles({}));
  }

  @ApiOkResponse({ type: Role })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/roles/:roleUuid')
  public async getRole(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('roleUuid') roleUuid: string
  ): Promise<Role> {
    await this.rolesService.validateOrFail(
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
