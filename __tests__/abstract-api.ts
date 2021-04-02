import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export default class AbstractApi {
  protected handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }
}
