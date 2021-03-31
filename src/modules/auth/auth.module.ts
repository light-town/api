import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import AccountsModule from '~/modules/accounts/accounts.module';
import UsersModule from '~/modules/users/users.module';
import SessionsModule from '~/modules/sessions/sessions.module';
import DevicesModule from '~/modules/devices/devices.module';
import PushNotificationsModule from '~/modules/push-notifications/push-notifications.module';
import AuthService from './auth.service';
import AuthController from './auth.controller';
import AuthGateway from './auth.gateway';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AccountsModule,
    UsersModule,
    SessionsModule,
    DevicesModule,
    PushNotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '10m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGateway],
  exports: [AuthService, AuthGateway],
})
export class AuthModule {}

export default AuthModule;
