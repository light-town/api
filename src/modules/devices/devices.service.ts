import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { DeviceEntity } from '~/db/entities/device.entity';
import { DeviceCreatePayload } from './devices.dto';

@Injectable()
export class DevicesService {
  public constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepository: Repository<DeviceEntity>
  ) {}

  public async create(
    options: DeviceCreatePayload,
    entityManager?: EntityManager
  ): Promise<DeviceEntity> {
    const manager = this.getManager(entityManager);
    return await manager.save(
      manager.create(DeviceEntity, {
        op: options.op,
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
}

export default DevicesService;
