import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import PermissionTypeEntity from '~/db/entities/permission-type.entity';
import { PermissionTypesEnum } from './permissions.dto';

export class PermissionType {
  uuid: string;
  name: PermissionTypesEnum;
  lastUpdatedAt: string;
  createdAt: string;
}

export class FindPermissionTypesOptions {
  id?: string;
  name?: PermissionTypesEnum;
}

@Injectable()
export class PermissionTypesService {
  public constructor(
    @InjectRepository(PermissionTypeEntity)
    private readonly permissionTypesRepository: Repository<PermissionTypeEntity>
  ) {}

  public createPermissionType(
    type: PermissionTypesEnum
  ): Promise<PermissionTypeEntity> {
    return this.permissionTypesRepository.save(
      this.permissionTypesRepository.create({
        name: type,
      })
    );
  }

  public async format(
    e: PermissionTypeEntity | Promise<PermissionTypeEntity>
  ): Promise<PermissionType> {
    return this.normalize(e instanceof Promise ? await e : e);
  }

  public async formatAll(
    e: PermissionTypeEntity[] | Promise<PermissionTypeEntity[]>
  ): Promise<PermissionType[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: PermissionTypeEntity): PermissionType {
    return {
      uuid: entity?.id,
      name: entity?.name,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindPermissionTypesOptions
  ): [string, SelectQueryBuilder<PermissionTypeEntity>] {
    const alias = 'permission_object_types';
    const query = this.permissionTypesRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.name`, 'name')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.name) query.andWhere(`${alias}.name = :name`, options);

    return [alias, query];
  }

  public getPermissionType(
    options: FindPermissionTypesOptions = {}
  ): Promise<PermissionTypeEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }
}

export default PermissionTypesService;
