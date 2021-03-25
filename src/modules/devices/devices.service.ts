import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DeviceEntity } from '~/db/entities/device.entity';
import Criteria from '~/utils/criteria';
import { DeviceCreatePayload } from './devices.dto';

export class DeviceCreateOptions extends DeviceCreatePayload {
  userAgent: string;
  hostname: string;
}
@Injectable()
export class DevicesService {
  public constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepository: Repository<DeviceEntity>
  ) {}

  public async create(
    options: DeviceCreateOptions,
    entityManager?: EntityManager
  ): Promise<DeviceEntity> {
    const manager = this.getManager(entityManager);
    return await manager.save(
      manager.create(DeviceEntity, {
        os: options.os,
        userAgent: options.userAgent,
        hostname: options.hostname,
      })
    );
  }

  public find(
    options: FindManyOptions<DeviceEntity>,
    entityManager?: EntityManager
  ): Promise<DeviceEntity[]> {
    const manager = this.getManager(entityManager);
    return manager.find(DeviceEntity, options);
  }

  public findOne(
    options: FindOneOptions<DeviceEntity>,
    entityManager?: EntityManager
  ): Promise<DeviceEntity> {
    const manager = this.getManager(entityManager);
    return manager.findOne(DeviceEntity, options);
  }

  public getManager(entityManager?: EntityManager) {
    return entityManager || this.devicesRepository.manager;
  }

  public update(
    criteria: Criteria<DeviceEntity>,
    partialEntity: QueryDeepPartialEntity<DeviceEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.update(DeviceEntity, criteria, partialEntity);
  }
}

export default DevicesService;
