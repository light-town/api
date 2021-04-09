import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsModule from '../key-sets/key-sets.module';
import VaultsController from './vaults.controller';
import VaultsService from './vaults.service';
import KeySetVaultsModule from '../key-set-vaults/key-set-vaults.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultEntity]),
    forwardRef(() => KeySetsModule),
    forwardRef(() => KeySetVaultsModule),
  ],
  controllers: [VaultsController],
  providers: [VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}

export default VaultsModule;
