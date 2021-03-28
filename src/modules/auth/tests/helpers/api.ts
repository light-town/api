import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  SessionCreatePayload,
  SessionStartPayload,
  SignUpPayload,
} from '~/modules/auth/auth.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  signUp(payload: SignUpPayload) {
    return this.handle.post('/auth/sign-up').send(payload);
  }

  createSession(payload: SessionCreatePayload) {
    return this.handle.post('/auth/sessions').send(payload);
  }

  startSession(sessionUuid: string, payload: SessionStartPayload) {
    return this.handle
      .post(`/auth/sessions/${sessionUuid}/start`)
      .send(payload);
  }
}

export default Api;
