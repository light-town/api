import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {} from '~/modules/key-sets/key-sets.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }
}

export default Api;
