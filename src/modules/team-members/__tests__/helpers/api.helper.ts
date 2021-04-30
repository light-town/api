import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateTeamMemberPayload } from '../../team-members.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createTeamMember(
    teamId: string,
    payload: CreateTeamMemberPayload,
    token: string
  ) {
    return this.handle
      .post(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getTeamMembers(teamId: string, token: string) {
    return this.handle
      .get(`/teams/${teamId}/members`)
      .set('Authorization', `Bearer ${token}`);
  }

  getTeamMember(teamId: string, teamMemberId: string, token: string) {
    return this.handle
      .get(`/teams/${teamId}/members/${teamMemberId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
