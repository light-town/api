import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '~/modules/auth/auth.module';
import initApp from '~/utils/init-app';

export const createE2EModuleHelper = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [TypeOrmModule.forRoot(), AuthModule],
  }).compile();

  const app = await initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createE2EModuleHelper;
