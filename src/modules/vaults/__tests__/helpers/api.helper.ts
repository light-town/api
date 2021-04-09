import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateVaultPayload } from '~/modules/vaults/vaults.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createVault(payload: CreateVaultPayload, accessToken: string) {
    return this.handle
      .post(`/vaults`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
  }

  getVaults(accessToken: string) {
    return this.handle
      .get(`/vaults`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  getVault(vaultUuid: string, accessToken: string) {
    return this.handle
      .get(`/vaults/${vaultUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  deleteVault(vaultUuid: string, accessToken: string) {
    return this.handle
      .delete(`/vaults/${vaultUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }
}

export default Api;
