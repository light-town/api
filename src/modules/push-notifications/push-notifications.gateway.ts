import {
  forwardRef,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { In } from 'typeorm';
import * as WebSocket from 'ws';
import { PushNotificationStageEnum } from './push-notifications.dto';
import PushNotificationsService from './push-notifications.service';

export enum PushNotificationEvents {
  INIT = 'SOCKET_INIT',
  ERROR = 'SOCKET_ERROR',
  ARRIVED = 'SOCKET_ARRIVED',
}

export const UnauthorizedException = (client: WebSocket) => {
  client.send(
    JSON.stringify({
      event: PushNotificationEvents.ERROR,
      data: { message: 'Unauthorized' },
    })
  );
  client.close();
};

@WebSocketGateway()
export class PushNotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  public connectedDevices = new Map<string, WebSocket>();

  public constructor(
    @Inject(forwardRef(() => PushNotificationsService))
    private readonly pushNotificationsService: PushNotificationsService
  ) {}

  async handleConnection(client: WebSocket, req: Request) {
    const queryUrl = req.url.slice(1); // start after '/' symbol

    if (!queryUrl.length) {
      UnauthorizedException(client);
      return;
    }

    const queryParams: { [key: string]: string } = queryUrl
      .replace('?', '')
      .split(';')
      .reduce(
        (prev, val) => ({
          ...prev,
          [val.split('=')[0]]: val.split('=')[1],
        }),
        {}
      );

    if (
      !queryParams.deviceUuid ||
      !(await this.pushNotificationsService.existsRecipient(
        queryParams.deviceUuid
      ))
    ) {
      UnauthorizedException(client);
      return;
    }

    this.connectedDevices.set(queryParams.deviceUuid, client);

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
      throw new InternalServerErrorException(
        `The '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages were not found`
      );

    const idsPushNotifications = await this.pushNotificationsService.find({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        stageId: In(stages.map(s => s.id)),
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
      throw new NotFoundException(`The push notification was not found`);

    const client = this.connectedDevices.get(
      pushNotification.recipientDeviceId
    );

    if (!client)
      throw new NotFoundException(`The client device is not connected`);

    const sentStage = await this.pushNotificationsService.findOneStage({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.SENT,
      },
    });

    if (!sentStage)
      throw new InternalServerErrorException(
        `The '${PushNotificationStageEnum.SENT}' push notification stage was not found`
      );

    await this.pushNotificationsService.update(
      {
        id: pushNotification.id,
      },
      { stageId: sentStage.id }
    );

    client.send(
      JSON.stringify({ ...pushNotification.payload, __id: pushNotificationId })
    );
  }

  hasConnectedDevice(deviceId: string) {
    return this.connectedDevices.has(deviceId);
  }

  findDeviceId(client: WebSocket): string | undefined {
    for (const [deviceId, deviceClient] of this.connectedDevices.entries()) {
      if (deviceClient === client) {
        return deviceId;
      }
    }
  }

  async handleDisconnect(client: WebSocket) {
    for (const [deviceId, deviceClient] of this.connectedDevices.entries()) {
      if (deviceClient === client) {
        this.connectedDevices.delete(deviceId);
        return;
      }
    }
  }
}

export default PushNotificationsGateway;
