import { forwardRef, Inject } from '@nestjs/common';
import {
  MessageBody,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { In } from 'typeorm';
import WebSocket from 'ws';
import SubscribeEvent from '~/common/subscribe-event';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';
import { PushNotificationStageEnum } from './push-notifications.dto';
import PushNotificationsService from './push-notifications.service';
import AbstractGateway from '~/common/abstract-gateway';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';

export enum PushNotificationEventsEnum {
  ERROR = 'ERROR',
  SUBSCRIBE_NOTIFY = 'SUBSCRIBE_NOTIFY',
  SUBSCRIBE_STATUS = 'SUBSCRIBE_STATUS',
  UNSUBSCRIBE_NOTIFY = 'UNSUBSCRIBE_NOTIFY',
  ARRIVED_NOTIFICATION = 'ARRIVED_NOTIFICATION',
  NOTIFICATION_STATUS = 'NOTIFICATION_STATUS',
  CONFIRM_ARRIVED_NOTIFICATION = 'CONFIRM_ARRIVED_NOTIFICATION',
}

@WebSocketGateway()
export class PushNotificationsGateway
  extends AbstractGateway
  implements OnGatewayDisconnect {
  private readonly connectedDevices = new Map<WebSocket, string>();

  public constructor(
    @Inject(forwardRef(() => PushNotificationsService))
    private readonly pushNotificationsService: PushNotificationsService
  ) {
    super();
  }

  async handleDisconnect(client: WebSocket) {
    if (this.connectedDevices.has(client)) this.connectedDevices.delete(client);
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.PUSH_NOTIFICATION,
    PushNotificationEventsEnum.SUBSCRIBE_NOTIFY
  )
  public async onSubNotifyEvent(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data
  ) {
    const deviceUuid = data?.deviceUuid;

    const existsDevice = await this.pushNotificationsService.existsRecipient(
      deviceUuid
    );

    if (!existsDevice) {
      this.sendMessage(client, {
        namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
        event: PushNotificationEventsEnum.ERROR,
        error: { message: 'The device was not found' },
      });
      return;
    }

    this.connectedDevices.set(client, deviceUuid);

    await this.sendRemainingNotifications(deviceUuid);

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.SUBSCRIBE_STATUS,
      status: 'ok',
    });
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.PUSH_NOTIFICATION,
    PushNotificationEventsEnum.UNSUBSCRIBE_NOTIFY
  )
  public async onUnsubNotifyEvent(@ConnectedSocket() client: WebSocket) {
    if (this.connectedDevices.has(client)) this.connectedDevices.delete(client);

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.SUBSCRIBE_STATUS,
      status: 'ok',
    });
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.PUSH_NOTIFICATION,
    PushNotificationEventsEnum.CONFIRM_ARRIVED_NOTIFICATION
  )
  public async onConfirmArrivedNotification(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data
  ) {
    await this.pushNotificationsService.confirm(data?.pushNotificationId);

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.NOTIFICATION_STATUS,
      status: 'ok',
    });
  }

  async sendRemainingNotifications(deviceUuid: string) {
    const stages = await this.pushNotificationsService.findStages({
      select: ['id'],
      where: {
        name: In([
          PushNotificationStageEnum.CREATED,
          PushNotificationStageEnum.SENT,
        ]),
      },
    });

    if (!stages.length)
      throw new ApiInternalServerException(
        `The '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages were not found`
      );

    const idsPushNotifications = await this.pushNotificationsService.find({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        stageId: In(stages.map(s => s.id)),
        recipientDeviceId: deviceUuid,
      },
    });

    idsPushNotifications.forEach(pn => this.send(pn.id));
  }

  async send(pushNotificationId: string): Promise<void> {
    const pushNotification = await this.pushNotificationsService.findOne({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: pushNotificationId,
      },
    });

    if (!pushNotification)
      throw new ApiNotFoundException(`The push notification was not found`);

    const client = this.findClientByDeviceId(
      pushNotification.recipientDeviceId
    );

    if (!client)
      throw new ApiNotFoundException(`The client device is not connected`);

    const sentStage = await this.pushNotificationsService.findOneStage({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.SENT,
      },
    });

    if (!sentStage)
      throw new ApiInternalServerException(
        `The '${PushNotificationStageEnum.SENT}' push notification stage was not found`
      );

    await this.pushNotificationsService.update(
      {
        id: pushNotification.id,
      },
      { stageId: sentStage.id }
    );

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.ARRIVED_NOTIFICATION,
      data: pushNotification.payload,
      metadata: {
        __notificationId: pushNotification.id,
      },
    });
  }

  hasConnectedDevice(deviceId: string) {
    return this.findClientByDeviceId(deviceId) !== undefined;
  }

  findClientByDeviceId(deviceId: string): WebSocket | undefined {
    for (const [client, connectedDeviceId] of this.connectedDevices) {
      if (connectedDeviceId === deviceId) {
        return client;
      }
    }
  }
}

export default PushNotificationsGateway;
