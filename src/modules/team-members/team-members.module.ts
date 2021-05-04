import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import AccountsModule from '../accounts/accounts.module';
import KeySetObjectsModule from '../key-set-objects/key-set-objects.module';
import KeySetsModule from '../key-sets/key-sets.module';
import RolesModule from '../roles/roles.module';
import TeamsModule from '../teams/teams.module';
import TeamMembersController from './team-members.controller';
import TeamMembersService from './team-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamMemberEntity]),
    AccountsModule,
    forwardRef(() => TeamsModule),
    forwardRef(() => RolesModule),
    forwardRef(() => KeySetsModule),
    forwardRef(() => KeySetObjectsModule),
  ],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}

export default TeamMembersModule;
