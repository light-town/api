import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import PermissionObjectTypeEntity from '~/db/entities/permission-object-type.entity';
import { ObjectTypesEnum } from '../roles/roles.dto';

export class PermissionObjectType {
  uuid: string;
  name: ObjectTypesEnum;
  lastUpdatedAt: string;
  createdAt: string;
}

export class FindPermissionObjectTypesOptions {
  id?: string;
  name?: ObjectTypesEnum;
  ids?: string[];
  names?: string[];
}

@Injectable()
export class PermissionObjectTypesService {
  public constructor(
    @InjectRepository(PermissionObjectTypeEntity)
    private readonly permissionObjectTypeRepository: Repository<PermissionObjectTypeEntity>
  ) {}

  public createPermissionObjectType(
    type: ObjectTypesEnum
  ): Promise<PermissionObjectTypeEntity> {
    return this.permissionObjectTypeRepository.save(
      this.permissionObjectTypeRepository.create({
        name: type,
      })
    );
  }

  public async format(
    e: PermissionObjectTypeEntity | Promise<PermissionObjectTypeEntity>
  ): Promise<PermissionObjectType> {
    return this.normalize(e instanceof Promise ? await e : e);
  }

  public async formatAll(
    e: PermissionObjectTypeEntity[] | Promise<PermissionObjectTypeEntity[]>
  ): Promise<PermissionObjectType[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: PermissionObjectTypeEntity): PermissionObjectType {
    if (!entity) return;

    return {
      uuid: entity?.id,
      name: entity?.name,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindPermissionObjectTypesOptions
  ): [string, SelectQueryBuilder<PermissionObjectTypeEntity>] {
    const alias = 'permission_object_types';
    const query = this.permissionObjectTypeRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.name`, 'name')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.name) query.andWhere(`${alias}.name = :name`, options);
    if (options?.ids) query.andWhere(`${alias}.id IN (:...ids)`, options);
    if (options?.names) query.andWhere(`${alias}.name IN (:...names)`, options);

    return [alias, query];
  }

  public getPermissionObjectType(
    options: FindPermissionObjectTypesOptions = {}
  ): Promise<PermissionObjectTypeEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }

  public getPermissionObjectTypes(
    options: FindPermissionObjectTypesOptions = {}
  ): Promise<PermissionObjectTypeEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }
}

export default PermissionObjectTypesService;
