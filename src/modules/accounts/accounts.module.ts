import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AccountEntity from '~/db/entities/account.entity';
import UsersModule from '~/modules/users/users.module';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import AccountsController from './accounts.controller';
import AccountsService from './accounts.service';
import DevicesModule from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, MFATypeEntity]),
    UsersModule,
    forwardRef(() => DevicesModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

export default AccountsModule;
