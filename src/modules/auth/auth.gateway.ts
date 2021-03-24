import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import AbstractGateway from '~/common/abstract-gateway';
import * as WebSocket from 'ws';
import SubscribeEvent from '~/common/subscribe-event';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';
import DevicesService from '../devices/devices.service';
import SessionsService from '../sessions/sessions.service';
import { VerifySessionStageEnum } from '../sessions/sessions.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export enum AuthEventsEnum {
  ERROR = 'ERROR',
  SUBSCRIBE_SESSION_VERIFY = 'SUBSCRIBE_SESSION_VERIFY',
  UPDATED_SESSION_VERIFY_STAGE = 'UPDATED_SESSION_VERIFY_STAGE',
  UNSUBSCRIBE_SESSION_VERIFY = 'UNSUBSCRIBE_SESSION_VERIFY',
}

@WebSocketGateway()
export class AuthGateway
  extends AbstractGateway
  implements OnGatewayDisconnect {
  private readonly connectedDevices = new Map<
    WebSocket,
    { deviceUuid: string; sessionUuid: string }
  >();

  public constructor(
    private readonly devicesService: DevicesService,
    private readonly sessionsService: SessionsService
  ) {
    super();
  }

  handleDisconnect(client: WebSocket): void {
    if (this.connectedDevices.has(client)) this.connectedDevices.delete(client);
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.AUTH,
    AuthEventsEnum.SUBSCRIBE_SESSION_VERIFY
  )
  public async onSubsSessionVerify(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { deviceUuid: string; sessionUuid: string }
  ): Promise<void> {
    const device = await this.devicesService.findOne({
      select: ['id'],
      where: {
        id: data.deviceUuid,
        isDeleted: false,
      },
    });

    if (!device) throw new NotFoundException('The device was not found');

    const session = await this.sessionsService.findOne({
      select: ['id', 'verifyStage'],
      where: {
        id: data.sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
        },
      },
    });

    if (!session) throw new NotFoundException('The session was not found');

    if (session.verifyStage?.name !== VerifySessionStageEnum.REQUIRED)
      throw new BadRequestException(
        'The session verify is already completed or not require at all'
      );

    this.connectedDevices.set(client, {
      deviceUuid: device.id,
      sessionUuid: session.id,
    });
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.AUTH,
    AuthEventsEnum.UNSUBSCRIBE_SESSION_VERIFY
  )
  public async onUnsubsSessionVerify(
    @ConnectedSocket() client: WebSocket
  ): Promise<void> {
    if (this.connectedDevices.has(client)) this.connectedDevices.delete(client);
  }

  public async updatedSessionVerifyStage(sessionUuid: string) {
    const session = await this.sessionsService.findOne({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
        },
      },
    });

    if (!session) throw new NotFoundException(`The session was not found`);

    for (const [client, config] of this.connectedDevices) {
      if (config.sessionUuid === session.id) {
        this.sendMessage(client, {
          namespace: GatewayNamespacesEnum.AUTH,
          event: AuthEventsEnum.UPDATED_SESSION_VERIFY_STAGE,
          data: {
            stage: session.verifyStage.name,
          },
        });
      }
    }
  }
}

export default AuthGateway;
