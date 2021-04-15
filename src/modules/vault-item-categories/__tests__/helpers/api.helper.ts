import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateVaultItemCategoryOptions } from '../../vault-item-categories.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createVaultItemCategory(
    vaultId: string,
    payload: CreateVaultItemCategoryOptions,
    token: string
  ) {
    return this.handle
      .post(`/vaults/${vaultId}/categories`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getVaultItemCategories(vaultId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/categories`)
      .set('Authorization', `Bearer ${token}`);
  }

  getVaultItemCategory(
    vaultId: string,
    vaultItemCategoryId: string,
    token: string
  ) {
    return this.handle
      .get(`/vaults/${vaultId}/categories/${vaultItemCategoryId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
