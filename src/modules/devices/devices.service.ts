import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { DeviceEntity } from '~/db/entities/device.entity';
import { DeviceCreateDTO } from './devices.dto';

@Injectable()
export class DevicesService {
  public constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepository: Repository<DeviceEntity>
  ) {}

  public create(options: DeviceCreateDTO) {
    return this.devicesRepository.save(
      this.devicesRepository.create({
        op: options.op,
        userAgent: options.userAgent,
        hostname: options.hostname,
      })
    );
  }

  public find(options: FindManyOptions<DeviceEntity>) {
    return this.devicesRepository.find(options);
  }

  public findOne(options: FindOneOptions<DeviceEntity>) {
    return this.devicesRepository.findOne(options);
  }
}

export default DevicesService;
