import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import TeamEntity from '~/db/entities/team.entity';
import AccountsModule from '../accounts/accounts.module';
import KeySetObjectsModule from '../key-set-objects/key-set-objects.module';
import KeySetsModule from '../key-sets/key-sets.module';
import PermissionsModule from '../permissions/permissions.module';
import RolesModule from '../roles/roles.module';
import TeamMembersModule from '../team-members/team-members.module';
import TeamsController from './teams.controller';
import TeamsService from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamEntity]),
    AccountsModule,
    forwardRef(() => TeamMembersModule),
    forwardRef(() => RolesModule),
    forwardRef(() => KeySetsModule),
    forwardRef(() => KeySetObjectsModule),
    PermissionsModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}

export default TeamsModule;
