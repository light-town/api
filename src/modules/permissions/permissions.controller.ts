import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import {
  CreatePermissionOptions,
  Permission,
  PermissionTypesEnum,
} from './permissions.dto';
import PermissionsService from './permissions.service';

@AuthGuard()
@ApiTags('/teams/roles/permissions')
@Controller()
export class PermissionsController {
  public constructor(
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService
  ) {}

  @ApiCreatedResponse({ type: Permission })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Post('/teams/:teamUuid/roles/:roleUuid/permissions')
  public async createPermission(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('roleUuid') roleUuid: string,
    @Body() payload: CreatePermissionOptions
  ): Promise<Permission> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.permissionsService.format(
      this.permissionsService.createPermission({
        roleId: roleUuid,
        objectId: payload.objectUuid,
        objectTypeName: payload.objectTypeName,
        typeName: payload.typeName,
      })
    );
  }
}

export default PermissionsController;
