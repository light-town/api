import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }
}

export default Api;
