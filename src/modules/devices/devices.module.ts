import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import DeviceEntity from '~/db/entities/device.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import AccountsModule from '../accounts/accounts.module';
import DevicesController from './devices.controller';
import DevicesService from './devices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, VerificationDeviceEntity]),
    forwardRef(() => AccountsModule),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}

export default DevicesModule;
