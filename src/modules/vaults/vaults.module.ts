import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsModule from '../key-sets/key-sets.module';
import VaultsController from './vaults.controller';
import VaultsService from './vaults.service';
import KeySetObjectsModule from '../key-set-objects/key-set-objects.module';
import VaultItemCategoriesModule from '../vault-item-categories/vault-item-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultEntity]),
    forwardRef(() => KeySetsModule),
    forwardRef(() => KeySetObjectsModule),
    forwardRef(() => VaultItemCategoriesModule),
  ],
  controllers: [VaultsController],
  providers: [VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}

export default VaultsModule;
