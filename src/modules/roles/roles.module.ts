import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import RoleEntity from '~/db/entities/role.entity';
import KeySetObjectsModule from '../key-set-objects/key-set-objects.module';
import PermissionsModule from '../permissions/permissions.module';
import TeamMembersModule from '../team-members/team-members.module';
import TeamsModule from '../teams/teams.module';
import VaultFoldersModule from '../vault-folders/vault-folders.module';
import VaultItemsModule from '../vault-items/vault-items.module';
import VaultsModule from '../vaults/vaults.module';
import RolesController from './roles.controller';
import RolesService from './roles.service';
import RouterService from './router.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity]),
    forwardRef(() => TeamsModule),
    forwardRef(() => TeamMembersModule),
    forwardRef(() => PermissionsModule),
    forwardRef(() => KeySetObjectsModule),
    forwardRef(() => VaultsModule),
    forwardRef(() => VaultFoldersModule),
    forwardRef(() => VaultItemsModule),
  ],
  controllers: [RolesController],
  providers: [RolesService, RouterService],
  exports: [RolesService, RouterService],
})
export class RolesModule {}

export default RolesModule;
