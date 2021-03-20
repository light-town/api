import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import DevicesModule from '../devices/devices.module';
import PushNotificationsGateway from './push-notifications.gateway';
import PushNotificationsService from './push-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushNotificationEntity,
      PushNotificationStageEntity,
    ]),
    DevicesModule,
  ],
  providers: [PushNotificationsService, PushNotificationsGateway],
  exports: [PushNotificationsService, PushNotificationsGateway],
})
export class PushNotificationsModule {}

export default PushNotificationsModule;
