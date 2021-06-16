import { INestApplication } from '@nestjs/common';
import PermissionsController from '~/modules/permissions/permissions.controller';
import { PermissionTypesEnum } from '~/modules/permissions/permissions.dto';
import PermissionsService from '~/modules/permissions/permissions.service';
import { ObjectTypesEnum } from '~/modules/roles/roles.dto';

export class CreatePermissionOptions {
  accountId: string;
  teamId: string;
  roleId: string;
  objectId: string;
  objectTypeName: ObjectTypesEnum;
  typeName: PermissionTypesEnum;
}

export const createPermissionHelper = async (
  app: INestApplication,
  options: CreatePermissionOptions
) => {
  const permissionsController = app.get<PermissionsController>(
    PermissionsController
  );
  const permissionsService = app.get<PermissionsService>(PermissionsService);

  const response = await permissionsController.createPermission(
    { id: options.accountId },
    options.teamId,
    options.roleId,
    {
      objectUuid: options.objectId,
      objectTypeName: options.objectTypeName,
      typeName: options.typeName,
    }
  );

  return permissionsService.getPermission({ id: response.uuid });
};

export default createPermissionHelper;
