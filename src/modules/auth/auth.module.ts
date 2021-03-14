import { Module } from '@nestjs/common';
import { AccountsModule } from '~/modules/accounts/accounts.module';
import { UsersModule } from '~/modules/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), AccountsModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

export default AuthModule;
