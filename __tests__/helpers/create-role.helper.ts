import { INestApplication } from '@nestjs/common';
import RolesController from '~/modules/roles/roles.controller';
import RolesService from '~/modules/roles/roles.service';

export class CreateRoleOptions {
  accountId: string;
  teamId: string;
  name: string;
  parentRoleId: string;
}

export const createRoleHelper = async (
  app: INestApplication,
  options: CreateRoleOptions
) => {
  const rolesController = app.get<RolesController>(RolesController);
  const rolesService = app.get<RolesService>(RolesService);

  const response = await rolesController.createRole(
    { id: options.accountId },
    options.teamId,
    {
      name: options.name,
      parentRoleUuid: options.parentRoleId,
    }
  );

  return rolesService.getRole({ id: response.uuid });
};

export default createRoleHelper;
