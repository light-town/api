import { Connection } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/typeorm';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';

describe('[Key Set Module] [Controller] ...', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE vaults, key_sets CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('Creating key sets', () => {
    it('should return all key sets', async () => {});
  });
});
