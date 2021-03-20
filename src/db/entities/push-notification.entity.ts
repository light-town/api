import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import PushNotificationStageEntity from './push-notification-stage.entity';
import DeviceEntity from './device.entity';
import { IEntity } from './entity.interface';
import { Payload } from '~/modules/push-notifications/push-notifications.dto';

@Entity('push_notifications')
export class PushNotificationEntity extends IEntity {
  @Column({ type: 'jsonb' })
  public payload: Payload;

  @Column({ type: 'uuid', name: 'recipient_device_id' })
  public recipientDeviceId: string;

  @Column({ type: 'timestamp', nullable: true })
  public deliveredTime?: Date;

  @ManyToOne(() => DeviceEntity)
  @JoinColumn({
    name: 'recipient_device_id',
    referencedColumnName: 'id',
  })
  public recipientDevice?: DeviceEntity;

  @Column({ type: 'uuid', name: 'stage_id' })
  public stageId?: string;

  @ManyToOne(() => PushNotificationStageEntity)
  @JoinColumn({
    name: 'stage_id',
    referencedColumnName: 'id',
  })
  public stage?: PushNotificationStageEntity;
}

export default PushNotificationEntity;
