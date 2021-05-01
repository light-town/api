import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import PermissionEntity from '~/db/entities/permission.entity';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import PermissionObjectTypesService from './permission-object-types.service';
import PermissionTypesService from './permission-types.service';
import { Permission, PermissionTypesEnum } from './permissions.dto';

export class FindPermissionsOptions {
  id?: string;
  objectId?: string;
  roleId?: string;
  objectTypeId?: string;
  typeId?: string;
}

export class CreatePermissionOptions {
  roleId: string;
  objectId: string;
  objectTypeName: ObjectTypesEnum;
  typeName: PermissionTypesEnum;
}

@Injectable()
export class PermissionsService {
  public constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    private readonly permissionObjectTypesService: PermissionObjectTypesService,
    private readonly permissionTypesService: PermissionTypesService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService
  ) {}

  public async createPermission(
    options: CreatePermissionOptions
  ): Promise<PermissionEntity> {
    const [objectType, type, role] = await Promise.all([
      this.permissionObjectTypesService.getPermissionObjectType({
        name: options.objectTypeName,
      }),
      this.permissionTypesService.getPermissionType({
        name: options.typeName,
      }),
      this.rolesService.getRole({ id: options.roleId }),
    ]);

    if (!objectType)
      throw new ApiNotFoundException(
        `The permission object type was not found`
      );

    if (!type)
      throw new ApiNotFoundException(`The permission type was not found`);

    if (!role) throw new ApiNotFoundException(`The role was not found`);

    return this.permissionsRepository.save(
      this.permissionsRepository.create({
        objectId: options.objectId,
        objectTypeId: objectType.id,
        typeId: type.id,
        roleId: role.id,
      })
    );
  }

  public async format(
    e: PermissionEntity | Promise<PermissionEntity>
  ): Promise<Permission> {
    return this.normalize(<any>(e instanceof Promise ? await e : e));
  }

  public async formatAll(
    e: PermissionEntity[] | Promise<PermissionEntity[]>
  ): Promise<Permission[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map((e: any) => this.normalize(e));
  }

  public normalize(entity: PermissionEntity): Permission {
    return {
      uuid: entity?.id,
      objectUuid: entity?.objectId,
      objectType: {
        uuid: entity.objectType.id,
        name: <ObjectTypesEnum>entity.objectType.name,
      },
      type: {
        uuid: entity.type.id,
        name: <PermissionTypesEnum>entity.type.name,
      },
      roleUuid: entity?.roleId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindPermissionsOptions
  ): [string, SelectQueryBuilder<PermissionEntity>] {
    const alias = 'permission_object_types';
    const query = this.permissionsRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.name`, 'name')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .innerJoinAndSelect(`${alias}.type`, 'type')
      .innerJoinAndSelect(`${alias}.objectType`, 'objectType')
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.objectId)
      query.andWhere(`${alias}.objectId = :objectId`, options);
    if (options?.roleId) query.andWhere(`${alias}.roleId = :roleId`, options);
    if (options?.objectTypeId)
      query.andWhere(`${alias}.objectTypeId = :objectTypeId`, options);
    if (options?.typeId) query.andWhere(`${alias}.typeId = :typeId`, options);

    return [alias, query];
  }

  public getPermission(
    options: FindPermissionsOptions = {}
  ): Promise<PermissionEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }

  public getPermissions(
    options: FindPermissionsOptions = {}
  ): Promise<PermissionEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }
}

export default PermissionsService;
