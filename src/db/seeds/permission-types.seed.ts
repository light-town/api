import faker from 'faker';
import { ObjectTypesEnum } from '~/modules/roles/roles.dto';
import PermissionObjectTypeEntity from '../entities/permission-object-type.entity';
import Factory from './factory';
import Seeder from './seeder';

export class PermissionObjectTypesFactory
  implements Factory<PermissionObjectTypeEntity> {
  public create({ name }: Partial<PermissionObjectTypeEntity> = {}) {
    const permissionObjectType = new PermissionObjectTypeEntity();
    permissionObjectType.name =
      name ||
      Object.values(ObjectTypesEnum)[
        faker.datatype.number({
          min: 0,
          max: Object.values(ObjectTypesEnum).length - 1,
        })
      ];
    return permissionObjectType;
  }
}

export class PermissionObjectTypesSeeder extends Seeder<PermissionObjectTypeEntity>(
  PermissionObjectTypeEntity
) {
  public constructor(factory: PermissionObjectTypesFactory) {
    super(factory);
  }
}

export default PermissionObjectTypesSeeder;
