import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SessionEntity } from '~/db/entities/session.entity';
import AccountsService from '../accounts/accounts.service';
import { DevicesService } from '../devices/devices.service';
import { SessionCreateDTO, VerifySessionStageEnum } from './sessions.dto';
import VerifySessionStageEntity from '~/db/entities/verify-session-stage.entity';
import Criteria from '~/common/criteria';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';

@Injectable()
export class SessionsService {
  public constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    @InjectRepository(VerifySessionStageEntity)
    private readonly verifySessionStageRepository: Repository<VerifySessionStageEntity>,
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

    if (!account) throw new ApiNotFoundException(`The account was not found`);

    const device = await this.devicesService.findOne(
      {
        select: ['id'],
        where: { id: options.deviceId },
      },
      manager
    );

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    const verifyStage = await this.verifySessionStageRepository.findOne({
      select: ['id'],
      where: {
        name: VerifySessionStageEnum.REQUIRED,
        isDeleted: false,
      },
    });

    if (!verifyStage)
      throw new ApiInternalServerException(
        `The '${VerifySessionStageEnum.REQUIRED}' verify session stage was not found`
      );

    return manager.save(
      manager.create(SessionEntity, {
        accountId: account.id,
        deviceId: device.id,
        secret: options.secret,
        verifyStageId: verifyStage.id,
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

  public findOneVerifyStage(
    options: FindOneOptions<VerifySessionStageEntity>,
    entityManager?: EntityManager
  ) {
    const manager = entityManager ?? this.verifySessionStageRepository.manager;
    return manager.findOne(VerifySessionStageEntity, options);
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
