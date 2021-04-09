import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeySetVaultEntity } from '~/db/entities/key-set-vaults.entity';
import KeySetsModule from '../key-sets/key-sets.module';
import VaultsModule from '../vaults/vaults.module';
import KeySetVaultsService from './key-set-vaults.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeySetVaultEntity]),
    forwardRef(() => KeySetsModule),
    forwardRef(() => VaultsModule),
  ],
  providers: [KeySetVaultsService],
  exports: [KeySetVaultsService],
})
export class KeySetVaultsModule {}

export default KeySetVaultsModule;
