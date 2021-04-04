import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import VaultsService from './vaults.service';

@Module({
  imports: [TypeOrmModule.forFeature([VaultEntity])],
  providers: [VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}

export default VaultsModule;
