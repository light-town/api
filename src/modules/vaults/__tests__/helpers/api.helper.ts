import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateKeySetPayload } from '~/modules/key-sets/key-sets.dto';
import { CreateVaultPayload } from '~/modules/vaults/vaults.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createVault(
    accountUuid: string,
    payload: { keySet: CreateKeySetPayload; vault: CreateVaultPayload },
    accessToken: string
  ) {
    return this.handle
      .post(`/accounts/${accountUuid}/vaults`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
  }

  getVaults(accountUuid: string, accessToken: string) {
    return this.handle
      .get(`/accounts/${accountUuid}/vaults`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  getVault(accountUuid: string, vaultUuid: string, accessToken: string) {
    return this.handle
      .get(`/accounts/${accountUuid}/vaults/${vaultUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  deleteVault(accountUuid: string, vaultUuid: string, accessToken: string) {
    return this.handle
      .delete(`/accounts/${accountUuid}/vaults/${vaultUuid}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }
}

export default Api;
