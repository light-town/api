import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  SignInPayload,
  SignUpPayload,
  StartSessionPayload,
} from '~/modules/auth/auth.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  signIn(payload: SignInPayload) {
    return this.handle.post('/auth/sign-in').send(payload);
  }

  signUp(payload: SignUpPayload) {
    return this.handle.post('/auth/sign-up').send(payload);
  }

  startSession(payload: StartSessionPayload) {
    return this.handle.post('/auth/start-session').send(payload);
  }
}

export default Api;
