import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '~/db/entities/session.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { DevicesModule } from '../devices/devices.module';
import { SessionsService } from './sessions.service';
import VerifySessionStageEntity from '~/db/entities/verify-session-stage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity, VerifySessionStageEntity]),
    DevicesModule,
    AccountsModule,
  ],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

export default SessionsModule;
