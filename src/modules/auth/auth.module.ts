import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import AccountsModule from '~/modules/accounts/accounts.module';
import UsersModule from '~/modules/users/users.module';
import SessionsModule from '~/modules/sessions/sessions.module';
import DevicesModule from '~/modules/devices/devices.module';
import PushNotificationsModule from '~/modules/push-notifications/push-notifications.module';
import AuthService from './auth.service';
import AuthController from './auth.controller';
import AuthGateway from './auth.gateway';
import JwtStrategy from './jwt.strategy';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '10m' },
    }),
    AccountsModule,
    UsersModule,
    SessionsModule,
    DevicesModule,
    PushNotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGateway, JwtStrategy],
  exports: [AuthService, AuthGateway, JwtStrategy],
})
export class AuthModule {}

export default AuthModule;
