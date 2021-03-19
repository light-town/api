import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { UsersModule } from '~/modules/users/users.module';
import MFATypeEntity from '~/db/entities/mfa-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, MFATypeEntity]),
    UsersModule,
  ],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

export default AccountsModule;
