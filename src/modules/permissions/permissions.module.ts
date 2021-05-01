import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import PermissionObjectTypeEntity from '~/db/entities/permission-object-type.entity';
import PermissionTypeEntity from '~/db/entities/permission-type.entity';
import PermissionEntity from '~/db/entities/permission.entity';
import RolesModule from '../roles/roles.module';
import PermissionObjectTypesService from './permission-object-types.service';
import PermissionTypesService from './permission-types.service';
import PermissionsController from './permissions.controller';
import PermissionsService from './permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PermissionEntity,
      PermissionTypeEntity,
      PermissionObjectTypeEntity,
    ]),
    forwardRef(() => RolesModule),
  ],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PermissionTypesService,
    PermissionObjectTypesService,
  ],
  exports: [
    PermissionsService,
    PermissionTypesService,
    PermissionObjectTypesService,
  ],
})
export class PermissionsModule {}

export default PermissionsModule;
