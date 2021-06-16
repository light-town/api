import WebSocket from 'ws';
import NamespacesEnum from '~/common/gateway-namespaces';

export class Payload<N = NamespacesEnum, E = string, D = any> {
  namespace: N;
  event: E;
  data: D;
  [key: string]: any;
}

export class AbstractGateway {
  sendMessage<P = Payload>(client: WebSocket, payload: P) {
    client.send(JSON.stringify(payload));
  }
}

export default AbstractGateway;
