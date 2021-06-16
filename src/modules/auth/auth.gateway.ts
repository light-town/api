import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import WebSocket from 'ws';
import AbstractGateway from '~/common/abstract-gateway';
import SubscribeEvent from '~/common/subscribe-event';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';
import DevicesService from '../devices/devices.service';
import SessionsService from '../sessions/sessions.service';
import { SessionVerificationStageEnum } from '../sessions/sessions.dto';
import {
  ApiConflictException,
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';

export enum AuthEventsEnum {
  ERROR = 'ERROR',
  SUB_STATUS = 'SUB_STATUS',
  SUB_CHANGE_SESSION_VERIFICATION_STAGE = 'SUB_CHANGE_SESSION_VERIFICATION_STAGE',
  CHANGED_SESSION_VERIFICATION_STAGE = 'CHANGED_SESSION_VERIFICATION_STAGE',
  UNSUB_CHANGE_SESSION_VERIFICATION_STAGE = 'UNSUB_CHANGE_SESSION_VERIFICATION_STAGE',
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
    AuthEventsEnum.SUB_CHANGE_SESSION_VERIFICATION_STAGE
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

    if (!device) throw new ApiNotFoundException('The device was not found');

    const session = await this.sessionsService.findOne({
      select: ['id', 'verificationStage', 'expiresAt'],
      where: {
        id: data.sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });

    if (!session) throw new ApiNotFoundException('The session was not found');

    if (session.expiresAt.getTime() < new Date().getTime())
      throw new ApiForbiddenException('The session is expired');

    if (
      session.verificationStage?.name !== SessionVerificationStageEnum.REQUIRED
    )
      throw new ApiConflictException(
        'The session verify has already completed or not required at all'
      );

    this.connectedDevices.set(client, {
      deviceUuid: device.id,
      sessionUuid: session.id,
    });

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.AUTH,
      event: AuthEventsEnum.SUB_STATUS,
      status: 'ok',
    });
  }

  @SubscribeEvent(
    GatewayNamespacesEnum.AUTH,
    AuthEventsEnum.UNSUB_CHANGE_SESSION_VERIFICATION_STAGE
  )
  public async onUnsubsSessionVerify(
    @ConnectedSocket() client: WebSocket
  ): Promise<void> {
    if (this.connectedDevices.has(client)) this.connectedDevices.delete(client);

    this.sendMessage(client, {
      namespace: GatewayNamespacesEnum.AUTH,
      event: AuthEventsEnum.SUB_STATUS,
      status: 'ok',
    });
  }

  public async updatedSessionVerifyStage(sessionUuid: string) {
    const session = await this.sessionsService.findOne({
      select: ['id', 'deviceId', 'verificationStage'],
      where: {
        id: sessionUuid,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });

    if (!session) throw new ApiNotFoundException(`The session was not found`);

    for (const [client, config] of this.connectedDevices) {
      if (config.sessionUuid === session.id) {
        this.sendMessage(client, {
          namespace: GatewayNamespacesEnum.AUTH,
          event: AuthEventsEnum.CHANGED_SESSION_VERIFICATION_STAGE,
          data: {
            stage: session.verificationStage.name,
          },
        });
      }
    }
  }
}

export default AuthGateway;
