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
import {
  SessionCreateDTO,
  SessionVerificationStageEnum,
  SESSION_EXPIRES_AT,
} from './sessions.dto';
import SessionVerificationStageEntity from '~/db/entities/session-verification-stage.entity';
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
    @InjectRepository(SessionVerificationStageEntity)
    private readonly sessionVerificationStageRepository: Repository<SessionVerificationStageEntity>,
    private readonly accountsService: AccountsService,
    private readonly devicesService: DevicesService
  ) {}

  public async create(options: SessionCreateDTO) {
    const account = await this.accountsService.findOne({
      select: ['id'],
      where: { id: options.accountId },
    });

    if (!account) throw new ApiNotFoundException(`The account was not found`);

    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: options.deviceId },
    });

    if (!device) throw new ApiNotFoundException(`The device was not found`);

    const sessionVerificationStage = await this.sessionVerificationStageRepository.findOne(
      {
        select: ['id'],
        where: {
          name: SessionVerificationStageEnum.REQUIRED,
          isDeleted: false,
        },
      }
    );

    if (!sessionVerificationStage)
      throw new ApiInternalServerException(
        `The '${SessionVerificationStageEnum.REQUIRED}' verify session stage was not found`
      );

    const verificationDevice = await this.devicesService.findOneVerificationDevice(
      {
        select: ['id'],
        where: { id: options.verificationDeviceId, isDeleted: false },
      }
    );

    return this.sessionsRepository.save(
      this.sessionsRepository.create({
        secret: options.secret,
        accountId: account.id,
        deviceId: device.id,
        expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
        verificationStageId: sessionVerificationStage.id,
        verificationDeviceId: verificationDevice?.id,
      })
    );
  }

  public find(options: FindManyOptions<SessionEntity>) {
    return this.sessionsRepository.find(options);
  }

  public findOne(options: FindOneOptions<SessionEntity>) {
    return this.sessionsRepository.findOne(options);
  }

  public findOneVerificationStage(
    options: FindOneOptions<SessionVerificationStageEntity>
  ) {
    return this.sessionVerificationStageRepository.findOne(options);
  }

  public update(
    criteria: Criteria<SessionEntity>,
    partialEntity: QueryDeepPartialEntity<SessionEntity>
  ) {
    return this.sessionsRepository.update(criteria, partialEntity);
  }

  public getManager(entityManager?: EntityManager) {
    return entityManager || this.sessionsRepository.manager;
  }
}

export default SessionsService;
