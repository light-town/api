import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePermissionOptions } from './permissions.dto';
import PermissionsService from './permissions.service';

@ApiTags('/teams/roles/permissions')
@Controller()
export class PermissionsController {
  public constructor(private readonly permissionsService: PermissionsService) {}

  @Post('/teams/:teamUuid/roles/:roleUuid/permissions')
  public createPermission(
    @Param('roleUuid') roleUuid: string,
    @Body() payload: CreatePermissionOptions
  ) {
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
