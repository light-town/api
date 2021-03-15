import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from '~/db/entities/device.entity';
import { DevicesService } from './devices.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity])],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}

export default DevicesModule;
