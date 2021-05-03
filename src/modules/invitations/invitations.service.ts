import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ApiBadRequestException,
  ApiNotFoundException,
} from '~/common/exceptions';
import InvitationEntity from '~/db/entities/invitation.entity';
import AccountsService from '../accounts/accounts.service';
import TeamMembersService from '../team-members/team-members.service';
import TeamsService from '../teams/teams.service';
import InvitationVerificationStagesService from './invitation-verification-stages.service';
import {
  Invitation,
  InvitationVerificationStagesEnum,
} from './invitations.dto';

export class FindInvitationsOptions {
  id?: string;
  accountId?: string;
  teamId?: string;
  expired?: boolean;
}

export class CreateInvitationOptions {
  accountId: string;
  teamId: string;
  accountVerificationStage: InvitationVerificationStagesEnum;
  teamVerificationStage: InvitationVerificationStagesEnum;
}

export class UpdateInvitationOptions {
  id: string;
  accountId?: string;
  teamId?: string;
  /* accountVerificationStage?: InvitationVerificationStagesEnum;
  teamVerificationStage?: InvitationVerificationStagesEnum; */
}

export class InvitationPropsOptions {
  accountId?: string;
  teamId?: string;
  accountVerificationStage?: InvitationVerificationStagesEnum;
  teamVerificationStage?: InvitationVerificationStagesEnum;
}

export const INVITATION_EXPIRES_TIME = 1000 * 60 * 10;

@Injectable()
export class InvitationsService {
  public constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationsRepository: Repository<InvitationEntity>,
    private readonly invitationVerificationStagesService: InvitationVerificationStagesService,
    private readonly accountsService: AccountsService,
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService
  ) {}

  public async createInvitation(
    options: CreateInvitationOptions
  ): Promise<InvitationEntity> {
    const [
      isTeamExists,
      teamVerificationStage,
      isAccountExists,
      accountVerificationStage,
      isAlreadyTeamMemberExists,
      existsInvitation,
    ] = await Promise.all([
      this.teamsService.exists({ id: options.teamId }),
      this.invitationVerificationStagesService.getInvitationVerificationStage({
        name: options.teamVerificationStage,
      }),
      this.accountsService.exists({ id: options.accountId }),
      this.invitationVerificationStagesService.getInvitationVerificationStage({
        name: options.accountVerificationStage,
      }),
      this.teamMembersService.exists({
        accountId: options.accountId,
        teamId: options.teamId,
      }),
      this.getInvitation({
        accountId: options.accountId,
        teamId: options.teamId,
      }),
    ]);

    if (!isAccountExists)
      throw new ApiNotFoundException(`The account was not found`);

    if (!isTeamExists) throw new ApiNotFoundException(`The team was not found`);

    if (!teamVerificationStage)
      throw new ApiNotFoundException(
        `The team verification stage was not found`
      );

    if (!accountVerificationStage)
      throw new ApiNotFoundException(
        `The account verification stage was not found`
      );

    if (isAlreadyTeamMemberExists)
      throw new ApiBadRequestException(`The user is already team member`);

    if (existsInvitation)
      throw new ApiBadRequestException(
        `The invitation already exists and it expire time is not passed yet`
      );

    const newInvitation = await this.invitationsRepository.save(
      this.invitationsRepository.create({
        teamId: options.teamId,
        teamVerificationStageId: teamVerificationStage.id,
        accountId: options.accountId,
        accountVerificationStageId: accountVerificationStage.id,
        expiresAt: new Date(Date.now() + INVITATION_EXPIRES_TIME),
      })
    );

    return this.getInvitation({ id: newInvitation.id });
  }

  public async updateInvitation(
    options: UpdateInvitationOptions,
    props: InvitationPropsOptions
  ): Promise<void> {
    const [
      isInvitationExists,
      isTeamExists,
      isAccountExists,
      teamVerificationStage,
      accountVerificationStage,
    ] = await Promise.all([
      this.exists({ id: options.id }),
      this.teamsService.exists({ id: props.teamId }),
      this.accountsService.exists({ id: props.accountId }),
      this.invitationVerificationStagesService.getInvitationVerificationStage({
        name: props.teamVerificationStage,
      }),
      this.invitationVerificationStagesService.getInvitationVerificationStage({
        name: props.accountVerificationStage,
      }),
    ]);

    if (!isInvitationExists)
      throw new ApiBadRequestException(`The invitation was not found`);

    if (props.accountId && !isAccountExists)
      throw new ApiNotFoundException(`The account was not found`);

    if (props.teamId && !isTeamExists)
      throw new ApiNotFoundException(`The team was not found`);

    if (props.teamVerificationStage && !teamVerificationStage)
      throw new ApiNotFoundException(
        `The team verification stage was not found`
      );

    if (props.accountVerificationStage && !accountVerificationStage)
      throw new ApiNotFoundException(
        `The account verification stage was not found`
      );

    const q: Record<string, any> = {};

    if (props.accountId) q.accountId = props.accountId;
    if (props.teamId) q.teamId = props.teamId;
    if (props.accountVerificationStage)
      q.accountVerificationStageId = accountVerificationStage.id;
    if (props.teamVerificationStage)
      q.teamVerificationStageId = teamVerificationStage.id;

    const query = this.invitationsRepository
      .createQueryBuilder()
      .update(InvitationEntity)
      .set(q);

    if (options.id) query.andWhere('id = :id', options);
    if (options.accountId) query.andWhere('accountId = :accountId', options);
    if (options.teamId) query.andWhere('teamId = :teamId', options);

    await query.execute();
  }

  public async format(
    e: InvitationEntity | Promise<InvitationEntity>
  ): Promise<Invitation> {
    return this.normalize(e instanceof Promise ? await e : e);
  }

  public async formatAll(
    e: InvitationEntity[] | Promise<InvitationEntity[]>
  ): Promise<Invitation[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: InvitationEntity): Invitation {
    if (!entity) return;

    return {
      uuid: entity?.id,
      accountUuid: entity?.accountId,
      teamUuid: entity?.teamId,
      accountVerificationStage: {
        uuid: entity?.accountVerificationStage.id,
        name: entity?.accountVerificationStage.name,
      },
      teamVerificationStage: {
        uuid: entity?.teamVerificationStage.id,
        name: entity?.teamVerificationStage.name,
      },
      expiresAt: entity?.expiresAt.toISOString(),
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public async prepareQuery(
    options: FindInvitationsOptions
  ): Promise<[string, SelectQueryBuilder<InvitationEntity>]> {
    const alias = 'invitations';
    const awatingStage = await this.invitationVerificationStagesService.getInvitationVerificationStage(
      {
        name: InvitationVerificationStagesEnum.AWAITING_ANSWER,
      }
    );
    const query = this.invitationsRepository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(
        `${alias}.accountVerificationStage`,
        'accountVerificationStage'
      )
      .leftJoinAndSelect(
        `${alias}.teamVerificationStage`,
        'teamVerificationStage'
      )
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false })
      .andWhere(
        `(${alias}.accountVerificationStageId = :stageId OR ${alias}.teamVerificationStageId = :stageId)`,
        { stageId: awatingStage.id }
      );

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);

    if (options?.teamId) query.andWhere(`${alias}.teamId = :teamId`, options);

    if (options?.accountId)
      query.andWhere(`${alias}.accountId = :accountId`, options);

    if (options?.expired)
      query.andWhere(`${alias}.expiresAt < :expiresAt`, {
        expiresAt: new Date(),
      });
    else
      query.andWhere(`${alias}.expiresAt > :expiresAt`, {
        expiresAt: new Date(),
      });

    return [alias, query];
  }

  public async getInvitations(
    options: FindInvitationsOptions = {}
  ): Promise<InvitationEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = await this.prepareQuery(options);
    return query.getMany();
  }

  public async getInvitation(
    options: FindInvitationsOptions = {}
  ): Promise<InvitationEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = await this.prepareQuery(options);
    return query.getOne();
  }

  public async exists(options: FindInvitationsOptions = {}): Promise<boolean> {
    const invitation = await this.getInvitation(options);
    return invitation !== undefined;
  }
}

export default InvitationsService;
