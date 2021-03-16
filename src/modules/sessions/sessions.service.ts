import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
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

  public async create(
    options: SessionCreateDTO,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);

    const account = await this.accountsService.findOne(
      {
        select: ['id'],
        where: { id: options.accountId },
      },
      manager
    );

    if (!account) throw new NotFoundException(`The account was not found`);

    const device = await this.devicesService.findOne(
      {
        select: ['id'],
        where: { id: options.deviceId },
      },
      manager
    );

    if (!device) throw new NotFoundException(`The device was not found`);

    return manager.save(
      manager.create(SessionEntity, {
        accountId: account.id,
        deviceId: device.id,
        secret: options.secret,
      })
    );
  }

  public find(
    options: FindManyOptions<SessionEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.find(SessionEntity, options);
  }

  public findOne(
    options: FindOneOptions<SessionEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.findOne(SessionEntity, options);
  }

  public update(
    criteria: Criteria<SessionEntity>,
    partialEntity: QueryDeepPartialEntity<SessionEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.update(SessionEntity, criteria, partialEntity);
  }

  public getManager(entityManager?: EntityManager) {
    return entityManager || this.sessionsRepository.manager;
  }
}

export default SessionsService;
