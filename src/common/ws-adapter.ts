import * as WebSocket from 'ws';
import { INestApplicationContext, Logger } from '@nestjs/common';
import {
  MessageMappingProperties,
  AbstractWsAdapter,
} from '@nestjs/websockets';
import {
  CLOSE_EVENT,
  CONNECTION_EVENT,
  ERROR_EVENT,
} from '@nestjs/websockets/constants';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export default class WsAdapter extends AbstractWsAdapter {
  private readonly logger: Logger;

  constructor(private readonly appOrHttpServer: INestApplicationContext) {
    super(appOrHttpServer);
    this.logger = new Logger(WsAdapter.name);
  }

  create(port: number, options: any = {}): any {
    const { server } = options;

    if (options === null || options === void 0 ? void 0 : options.namespace) {
      const error = new Error(
        '"WsAdapter" does not support namespaces. If you need namespaces in your project, consider using the "@nestjs/platform-socket.io" package instead.'
      );
      this.logger.error(error);
      throw error;
    }

    if (port === 0 && this.httpServer) {
      return new WebSocket.Server(
        Object.assign({ server: this.httpServer }, options)
      );
    }

    return server
      ? server
      : new WebSocket.Server(Object.assign({ port }, options));
  }

  bindClientConnect(server, callback) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result)
      )
      .subscribe(response => {
        client.send(JSON.stringify(response));
      });
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>
  ): Observable<any> {
    try {
      const message = JSON.parse(buffer.data);
      const messageHandler = handlers.find(
        handler =>
          handler.message.namespace === message.namespace &&
          handler.message.event === message.event
      );
      return process(messageHandler.callback(message.data));
    } catch (e) {
      return EMPTY;
    }
  }

  bindErrorHandler(server) {
    server.on(CONNECTION_EVENT, ws =>
      ws.on(ERROR_EVENT, err => this.logger.error(err))
    );
    server.on(ERROR_EVENT, err => this.logger.error(err));
    return server;
  }

  bindClientDisconnect(server, callback) {
    server.on(CLOSE_EVENT, callback);
  }

  close(server) {
    server.close();
  }
}
