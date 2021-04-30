import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import AccountsModule from '../accounts/accounts.module';
import TeamsModule from '../teams/teams.module';
import TeamMembersController from './team-members.controller';
import TeamMembersService from './team-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamMemberEntity]),
    AccountsModule,
    forwardRef(() => TeamsModule),
  ],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}

export default TeamMembersModule;
