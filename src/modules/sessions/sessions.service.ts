import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  ObjectID,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SessionEntity } from '~/db/entities/session.entity';
import AccountsService from '../accounts/accounts.service';
import { DevicesService } from '../devices/devices.service';
import { SessionCreateDTO } from './sessions.dto';

export type Criteria<T> =
  | string
  | string[]
  | number
  | number[]
  | Date
  | Date[]
  | ObjectID
  | ObjectID[]
  | FindConditions<T>;

@Injectable()
export class SessionsService {
  public constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly accountsService: AccountsService,
    private readonly devicesService: DevicesService
  ) {}

  public async create(options: SessionCreateDTO) {
    const account = await this.accountsService.findOne({
      select: ['id'],
      where: { id: options.accountId },
    });

    if (!account) throw new NotFoundException(`The account was not found`);

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: options.deviceId },
    });

    if (!device) throw new NotFoundException(`The device was not found`);

    return this.sessionsRepository.save(
      this.sessionsRepository.create({
        accountId: account.id,
        deviceId: device.id,
      })
    );
  }

  public find(options: FindManyOptions<SessionEntity>) {
    return this.sessionsRepository.find(options);
  }

  public findOne(options: FindOneOptions<SessionEntity>) {
    return this.sessionsRepository.findOne(options);
  }

  public update(
    criteria: Criteria<SessionEntity>,
    partialEntity: QueryDeepPartialEntity<SessionEntity>
  ) {
    return this.sessionsRepository.update(criteria, partialEntity);
  }
}

export default SessionsService;
