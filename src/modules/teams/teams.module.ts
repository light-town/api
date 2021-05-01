import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import TeamEntity from '~/db/entities/team.entity';
import AccountsModule from '../accounts/accounts.module';
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
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}

export default TeamsModule;
