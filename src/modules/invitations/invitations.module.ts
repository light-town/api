import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import InvitationVerificationStageEntity from '~/db/entities/invitation-verification-stage.entity';
import InvitationEntity from '~/db/entities/invitation.entity';
import AccountsModule from '../accounts/accounts.module';
import RolesModule from '../roles/roles.module';
import TeamMembersModule from '../team-members/team-members.module';
import TeamsModule from '../teams/teams.module';
import InvitationVerificcationStagesService from './invitation-verification-stages.service';
import InvitationsController from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity,
      InvitationVerificationStageEntity,
    ]),
    AccountsModule,
    TeamsModule,
    TeamMembersModule,
    RolesModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationVerificcationStagesService],
  exports: [InvitationsService, InvitationVerificcationStagesService],
})
export class InvitationsModule {}

export default InvitationsModule;
