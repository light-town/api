import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import DevicesService from '../devices/devices.service';
import { Payload, PushNotificationStageEnum } from './push-notifications.dto';
import PushNotificationsGateway from './push-notifications.gateway';
import Criteria from '~/utils/criteria';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import DeviceEntity from '~/db/entities/device.entity';

@Injectable()
export class PushNotificationsService {
  public constructor(
    @InjectRepository(PushNotificationEntity)
    private readonly pushNotificationsRepository: Repository<PushNotificationEntity>,
    @InjectRepository(PushNotificationStageEntity)
    private readonly pushNotificationStagesRepository: Repository<PushNotificationStageEntity>,
    @Inject(forwardRef(() => PushNotificationsGateway))
    private readonly pushNotificationsGateway: PushNotificationsGateway,
    private readonly devicesService: DevicesService
  ) {}

  public async send(
    deviceId: string,
    payload: Payload
  ): Promise<PushNotificationEntity> {
    if (!(await this.existsRecipient(deviceId)))
      throw new NotFoundException('The recipient device was not found');

    const createdStage = await this.pushNotificationStagesRepository.findOne({
      select: ['id'],
      where: { name: PushNotificationStageEnum.CREATED },
    });

    if (!createdStage)
      throw new InternalServerErrorException(
        `The '${PushNotificationStageEnum.CREATED}' push notification stage was not found`
      );

    const pushNotification = await this.create(
      deviceId,
      payload,
      createdStage.id
    );

    if (!this.pushNotificationsGateway.hasConnectedDevice(deviceId))
      return pushNotification;

    await this.pushNotificationsGateway.send(pushNotification.id);

    return pushNotification;
  }

  public async existsRecipient(deviceId: string): Promise<boolean> {
    const device = await this.devicesService.findOne({
      select: ['id'],
      where: { id: deviceId, isDeleted: false },
    });
    return device instanceof DeviceEntity;
  }

  public create(deviceId: string, payload: Payload, stageId: string) {
    return this.pushNotificationsRepository.save(
      this.pushNotificationsRepository.create({
        payload,
        recipientDeviceId: deviceId,
        stageId,
      })
    );
  }

  public async confirm(pushNotificationId: string) {
    const pushNotification = await this.findOne({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: pushNotificationId,
      },
    });

    if (!pushNotification)
      throw new NotFoundException(`The push notification was not found`);

    const arrivedStage = await this.findOneStage({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.ARRIVED,
      },
    });

    if (!arrivedStage)
      throw new InternalServerErrorException(
        `The '${PushNotificationStageEnum.ARRIVED}' push notification stage was not found`
      );

    await this.update(
      {
        id: pushNotification.id,
      },
      { stageId: arrivedStage.id }
    );
  }

  public update(
    criteria: Criteria<PushNotificationEntity>,
    entity: QueryDeepPartialEntity<PushNotificationEntity>
  ) {
    return this.pushNotificationsRepository.update(criteria, entity);
  }

  public find(options?: FindManyOptions<PushNotificationEntity>) {
    return this.pushNotificationsRepository.find(options);
  }

  public findOne(options?: FindOneOptions<PushNotificationEntity>) {
    return this.pushNotificationsRepository.findOne(options);
  }

  public findStages(options?: FindManyOptions<PushNotificationStageEntity>) {
    return this.pushNotificationStagesRepository.find(options);
  }

  public findOneStage(options?: FindOneOptions<PushNotificationStageEntity>) {
    return this.pushNotificationStagesRepository.findOne(options);
  }
}

export default PushNotificationsService;
