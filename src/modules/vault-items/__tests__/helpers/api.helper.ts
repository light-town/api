import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateVaultItemPayload } from '../../vault-items.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createVaultItem(
    vaultId: string,
    vaultFolderId: string,
    payload: CreateVaultItemPayload,
    token: string
  ) {
    return this.handle
      .post(`/vaults/${vaultId}/folders/${vaultFolderId}/items`)

      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getVaultItems(vaultId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/items`)
      .set('Authorization', `Bearer ${token}`);
  }

  getVaultItem(vaultId: string, vaultItemId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/items/${vaultItemId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  getVaultItemsFromFolder(vaultId: string, folderId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/folders/${folderId}/items`)
      .set('Authorization', `Bearer ${token}`);
  }

  getVaultItemFromFolder(
    vaultId: string,
    folderId: string,
    vaultItemId: string,
    token: string
  ) {
    return this.handle
      .get(`/vaults/${vaultId}/folders/${folderId}/items/${vaultItemId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
