import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../__tests__/__mocks__/mockRepository';
import UsersModule from '~/modules/users/users.module';
import JwtStrategy from '~/modules/auth/jwt.strategy';
import * as dotenv from 'dotenv';
import initApp from '~/utils/init-app';

dotenv.config();

export const createTestingModule = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [
      UsersModule,
      JwtModule.register({
        secret: process.env.JWT_SECRET_KEY,
        signOptions: { expiresIn: '10m' },
      }),
      PassportModule,
    ],
    providers: [JwtStrategy],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .compile();

  const app = initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createTestingModule;
