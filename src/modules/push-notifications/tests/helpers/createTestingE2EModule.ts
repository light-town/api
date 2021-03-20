import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import initApp from '~/utils/init-app';
import PushNotificationsModule from '~/modules/push-notifications/push-notifications.module';

export const createTestingE2EModule = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [TypeOrmModule.forRoot(), PushNotificationsModule],
  }).compile();

  const app = await initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createTestingE2EModule;
