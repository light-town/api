import { Module } from '@nestjs/common';
import { AccountsModule } from '~/modules/accounts/accounts.module';
import { UsersModule } from '~/modules/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from '../sessions/sessions.module';
import { DevicesModule } from '../devices/devices.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AccountsModule,
    UsersModule,
    SessionsModule,
    DevicesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '10m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

export default AuthModule;
