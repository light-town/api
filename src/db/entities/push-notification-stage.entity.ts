import { Column, Entity } from 'typeorm';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';
import { IEntity } from './entity.interface';

@Entity('push-notification-stages')
export class PushNotificationStageEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: PushNotificationStageEnum;
}

export default PushNotificationStageEntity;
