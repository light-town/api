import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { UsersModule } from '~/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), UsersModule],
  providers: [AccountsService],
})
export class AccountsModule {}

export default AccountsModule;
