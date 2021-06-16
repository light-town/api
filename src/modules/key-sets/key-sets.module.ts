import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import KeySetEntity from '~/db/entities/key-set.entity';
import AccountsModule from '../accounts/accounts.module';
import RolesModule from '../roles/roles.module';
import TeamMembersModule from '../team-members/team-members.module';
import VaultsModule from '../vaults/vaults.module';
import KeySetsController from './key-sets.controller';
import KeySetsService from './key-sets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KeySetEntity]),
    AccountsModule,
    forwardRef(() => VaultsModule),
    RolesModule,
    TeamMembersModule,
  ],
  controllers: [KeySetsController],
  providers: [KeySetsService],
  exports: [KeySetsService],
})
export class KeySetsModule {}

export default KeySetsModule;
