import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultItemCategoriesEntity from '~/db/entities/vault-item-category.entity';
import AccountsModule from '../accounts/accounts.module';
import VaultsModule from '../vaults/vaults.module';
import VaultItemCategoriesController from './vault-item-categories.controller';
import VaultItemCategoriesService from './vault-item-categories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultItemCategoriesEntity]),
    forwardRef(() => VaultsModule),
    AccountsModule,
  ],
  controllers: [VaultItemCategoriesController],
  providers: [VaultItemCategoriesService],
  exports: [VaultItemCategoriesService],
})
export class VaultItemCategoriesModule {}

export default VaultItemCategoriesModule;
