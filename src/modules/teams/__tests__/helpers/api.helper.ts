import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateTeamOptions } from '../../teams.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createTeam(payload: CreateTeamOptions, token: string) {
    return this.handle
      .post(`/teams`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getTeams(token: string) {
    return this.handle.get(`/teams`).set('Authorization', `Bearer ${token}`);
  }

  getTeam(teamId: string, token: string) {
    return this.handle
      .get(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
