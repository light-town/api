import faker from 'faker';
import { PermissionTypesEnum } from '~/modules/permissions/permissions.dto';
import PermissionTypeEntity from '../entities/permission-type.entity';
import Factory from './factory';
import Seeder from './seeder';

export class PermissionTypesFactory implements Factory<PermissionTypeEntity> {
  public create({ name, level }: Partial<PermissionTypeEntity> = {}) {
    const permissionType = new PermissionTypeEntity();
    permissionType.name =
      name ||
      Object.values(PermissionTypesEnum)[
        faker.datatype.number({
          min: 0,
          max: Object.values(PermissionTypesEnum).length - 1,
        })
      ];
    permissionType.level = level ?? 0;
    return permissionType;
  }
}

export class PermissionTypesSeeder extends Seeder<PermissionTypeEntity>(
  PermissionTypeEntity
) {
  public constructor(factory: PermissionTypesFactory) {
    super(factory);
  }
}

export default PermissionTypesSeeder;
