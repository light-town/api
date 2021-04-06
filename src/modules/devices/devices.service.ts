import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DeviceEntity } from '~/db/entities/device.entity';
import Criteria from '~/common/criteria';
import { DeviceCreatePayload } from './devices.dto';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import AccountsService from '../accounts/accounts.service';
import { ApiNotFoundException } from '~/common/exceptions';

export class DeviceCreateOptions extends DeviceCreatePayload {
  userAgent?: string;
  hostname: string;
}
@Injectable()
export class DevicesService {
  public constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepository: Repository<DeviceEntity>,
    @InjectRepository(VerificationDeviceEntity)
    private readonly verificationDeviceRepository: Repository<VerificationDeviceEntity>,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountsService: AccountsService
  ) {}

  public async create(options: DeviceCreateOptions): Promise<DeviceEntity> {
    return await this.devicesRepository.save(
      this.devicesRepository.create({
        os: options.os,
        userAgent: options.userAgent,
        hostname: options.hostname,
        model: options.model,
      })
    );
  }

  public findOneVerificationDevice(
    options: FindOneOptions<VerificationDeviceEntity>
  ): Promise<VerificationDeviceEntity> {
    return this.verificationDeviceRepository.findOne(options);
  }

  public find(options: FindManyOptions<DeviceEntity>): Promise<DeviceEntity[]> {
    return this.devicesRepository.find(options);
  }

  public findOne(options: FindOneOptions<DeviceEntity>): Promise<DeviceEntity> {
    return this.devicesRepository.findOne(options);
  }

  public update(
    criteria: Criteria<DeviceEntity>,
    partialEntity: QueryDeepPartialEntity<DeviceEntity>
  ) {
    return this.devicesRepository.update(criteria, partialEntity);
  }

  public async createVerificationDevice(
    deviceId,
    accountId
  ): Promise<VerificationDeviceEntity> {
    const accountExists = await this.accountsService.exists(accountId);

    if (!accountExists)
      throw new ApiNotFoundException('The account was not found');

    const deviceExists = await this.exists(deviceId);

    if (!deviceExists)
      throw new ApiNotFoundException('The device was not found');

    return this.verificationDeviceRepository.save(
      this.verificationDeviceRepository.create({
        deviceId,
        accountId,
      })
    );
  }

  public async exists(id: string): Promise<boolean> {
    const device = await this.devicesRepository.findOne({
      select: ['id'],
      where: { id, isDeleted: false },
    });

    return device !== undefined;
  }
}

export default DevicesService;
