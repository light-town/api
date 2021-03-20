import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AuthModule from './modules/auth/auth.module';
import AccountsModule from './modules/accounts/accounts.module';
import UsersModule from './modules/users/users.module';
import DevicesModule from './modules/devices/devices.module';
import SessionsModule from './modules/sessions/sessions.module';
import PushNotificationsModule from './modules/push-notifications/push-notifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AuthModule,
    AccountsModule,
    UsersModule,
    DevicesModule,
    SessionsModule,
    PushNotificationsModule,
  ],
})
export class AppModule {}
