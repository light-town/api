import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreateVaultFolderOptions } from '../../vault-folders.dto';

export class Api {
  private handle: request.SuperTest<request.Test>;

  constructor(app: INestApplication) {
    this.handle = request(app.getHttpServer());
  }

  createVaultFolder(
    vaultId: string,
    payload: CreateVaultFolderOptions,
    token: string
  ) {
    return this.handle
      .post(`/vaults/${vaultId}/folders`)

      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  getVaultFolders(vaultId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/folders`)
      .set('Authorization', `Bearer ${token}`);
  }

  getVaultFolder(vaultId: string, vaultFolderId: string, token: string) {
    return this.handle
      .get(`/vaults/${vaultId}/folders/${vaultFolderId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}

export default Api;
