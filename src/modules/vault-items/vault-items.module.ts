import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import AccountsModule from '../accounts/accounts.module';
import KeySetObjectsModule from '../key-set-objects/key-set-objects.module';
import RolesModule from '../roles/roles.module';
import TeamMembersModule from '../team-members/team-members.module';
import VaultFoldersModule from '../vault-folders/vault-folders.module';
import VaultItemCategoriesModule from '../vault-item-categories/vault-item-categories.module';
import VaultsModule from '../vaults/vaults.module';
import VaultItemsController from './vault-items.controller';
import VaultItemsService from './vault-items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultItemEntity]),
    forwardRef(() => VaultsModule),
    AccountsModule,
    forwardRef(() => VaultFoldersModule),
    forwardRef(() => VaultItemCategoriesModule),
    forwardRef(() => KeySetObjectsModule),
    TeamMembersModule,
    forwardRef(() => RolesModule),
  ],
  controllers: [VaultItemsController],
  providers: [VaultItemsService],
  exports: [VaultItemsService],
})
export class VaultItemsModule {}

export default VaultItemsModule;
