import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DeviceCreatePayload } from '~/modules/devices/devices.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createDevice(payload: DeviceCreatePayload) {
    return this.handle.post('/devices').send(payload);
  }

  getDevice(uuid: string) {
    return this.handle.get(`/devices/${uuid}`);
  }

  getDevices() {
    return this.handle.get(`/devices`);
  }

  removeDevice(uuid: string) {
    return this.handle.delete(`/devices/${uuid}`);
  }
}

export default Api;
