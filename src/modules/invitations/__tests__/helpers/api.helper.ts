import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  AcceptInvitationByTeamMemberPayload,
  CreateInvitationByAccountPayload,
  CreateInvitationByTeamMemberPayload,
} from '../../invitations.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createInvitationByTeamMember(
    teamId: string,
    payload: CreateInvitationByTeamMemberPayload,
    token: string
  ) {
    return this.handle
      .post(`/teams/${teamId}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  createInvitationByAccount(
    payload: CreateInvitationByAccountPayload,
    token: string
  ) {
    return this.handle
      .post(`/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getTeamInvitations(teamId: string, token: string) {
    return this.handle
      .get(`/teams/${teamId}/invitations`)
      .set('Authorization', `Bearer ${token}`);
  }

  getTeamInvitation(teamId: string, invitationId: string, token: string) {
    return this.handle
      .get(`/teams/${teamId}/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  getAccountInvitations(token: string) {
    return this.handle
      .get(`/invitations`)
      .set('Authorization', `Bearer ${token}`);
  }

  getAccountInvitation(invitationId: string, token: string) {
    return this.handle
      .get(`/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  acceptTeamInvitation(
    teamId: string,
    invitationId: string,
    payload: AcceptInvitationByTeamMemberPayload,
    token: string
  ) {
    return this.handle
      .patch(`/teams/${teamId}/invitations/${invitationId}/accept`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  rejectTeamInvitation(teamId: string, invitationId: string, token: string) {
    return this.handle
      .patch(`/teams/${teamId}/invitations/${invitationId}/reject`)
      .set('Authorization', `Bearer ${token}`);
  }

  acceptAccountInvitation(invitationId: string, token: string) {
    return this.handle
      .patch(`/invitations/${invitationId}/accept`)
      .set('Authorization', `Bearer ${token}`);
  }

  rejectAccountInvitation(invitationId: string, token: string) {
    return this.handle
      .patch(`/invitations/${invitationId}/reject`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
