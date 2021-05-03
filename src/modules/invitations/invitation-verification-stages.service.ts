import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import InvitationVerificationStageEntity from '~/db/entities/invitation-verification-stage.entity';
import {
  InvitationVerificationStage,
  InvitationVerificationStagesEnum,
} from './invitations.dto';

export class FindInvitationsOptions {
  id?: string;
  name?: string;
}

@Injectable()
export class InvitationVerificationStagesService {
  public constructor(
    @InjectRepository(InvitationVerificationStageEntity)
    private readonly invitationVerificationStagesRepository: Repository<InvitationVerificationStageEntity>
  ) {}

  public async createInvitationVerificationStage(
    stageName: InvitationVerificationStagesEnum
  ): Promise<InvitationVerificationStageEntity> {
    return this.invitationVerificationStagesRepository.save(
      this.invitationVerificationStagesRepository.create({
        name: stageName,
      })
    );
  }

  public async format(
    e:
      | InvitationVerificationStageEntity
      | Promise<InvitationVerificationStageEntity>
  ): Promise<InvitationVerificationStage> {
    return this.normalize(e instanceof Promise ? await e : e);
  }

  public async formatAll(
    e:
      | InvitationVerificationStageEntity[]
      | Promise<InvitationVerificationStageEntity[]>
  ): Promise<InvitationVerificationStage[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(
    entity: InvitationVerificationStageEntity
  ): InvitationVerificationStage {
    return {
      uuid: entity?.id,
      name: entity?.name,
    };
  }

  public prepareQuery(
    options: FindInvitationsOptions
  ): [string, SelectQueryBuilder<InvitationVerificationStageEntity>] {
    const alias = 'invitation_verification_stages';
    const query = this.invitationVerificationStagesRepository
      .createQueryBuilder(alias)
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.name) query.andWhere(`${alias}.name = :name`, options);

    return [alias, query];
  }

  public async getInvitationVerificationStages(
    options: FindInvitationsOptions = {}
  ): Promise<InvitationVerificationStageEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getMany();
  }

  public getInvitationVerificationStage(
    options: FindInvitationsOptions = {}
  ): Promise<InvitationVerificationStageEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getOne();
  }

  public async exists(options: FindInvitationsOptions = {}): Promise<boolean> {
    const stage = await this.getInvitationVerificationStage(options);
    return stage !== undefined;
  }
}

export default InvitationVerificationStagesService;
