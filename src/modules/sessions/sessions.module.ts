import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '~/db/entities/session.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { DevicesModule } from '../devices/devices.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    DevicesModule,
    AccountsModule,
  ],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

export default SessionsModule;
