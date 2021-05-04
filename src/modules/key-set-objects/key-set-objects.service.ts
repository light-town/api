import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ApiBadRequestException,
  ApiNotFoundException,
} from '~/common/exceptions';
import KeySetObjectEntity from '~/db/entities/key-set-object.entity';
import KeySetEntity from '~/db/entities/key-set.entity';
import TeamEntity from '~/db/entities/team.entity';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsService from '../key-sets/key-sets.service';
import TeamsService from '../teams/teams.service';
import VaultsService from '../vaults/vaults.service';

export class CreateKeySetOptions {
  vaultId?: string;
  teamId?: string;
}

export class FindKeySetObjectsOptions {
  id?: string;
  keySetId?: string;
  vaultId?: string;
  teamId?: string;
  ownerAccountId?: string;
  ownerTeamId?: string;
  creatorAccountId?: string;
  isVault?: boolean;
  isTeam?: boolean;
}

@Injectable()
export class KeySetObjectsService {
  public constructor(
    @InjectRepository(KeySetObjectEntity)
    private readonly keySetObjectsRepository: Repository<KeySetObjectEntity>,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService
  ) {}

  public async createKeySetObject(
    keySetId: string,
    options: CreateKeySetOptions
  ): Promise<KeySetObjectEntity> {
    const [isKeySetExists, vault, team] = await Promise.all([
      this.keySetsService.exists({ id: keySetId }),
      this.vaultsService.getVault({ id: options.vaultId }),
      this.teamsService.getTeam({ id: options.teamId }),
    ]);

    if (!isKeySetExists)
      throw new ApiNotFoundException('The key set was not found');

    const newKeySetObject = new KeySetObjectEntity();
    newKeySetObject.keySetId = keySetId;

    if (vault) {
      newKeySetObject.vaultId = vault.id;
    } else if (team) {
      newKeySetObject.teamId = team.id;
    } else {
      throw new ApiBadRequestException(`The vault and team was not found`);
    }

    return this.keySetObjectsRepository.save(
      this.keySetObjectsRepository.create(newKeySetObject)
    );
  }

  public async exists(options: FindKeySetObjectsOptions): Promise<boolean> {
    const keySetObject = await this.getKeySetObject(options);
    return keySetObject !== undefined;
  }

  public async getVaultIds(keySetId: string): Promise<string[]> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isVault: true,
    });

    const keySetObjects = await query
      .select(`${alias}.vaultId`, 'vaultId')
      .leftJoinAndSelect(`${alias}.keySet`, 'keySet')
      .getRawMany();

    return keySetObjects.map(k => k.vaultId);
  }

  public async getTeamIds(keySetId: string): Promise<string[]> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isTeam: true,
    });

    const keySetObjects = await query
      .select(`${alias}.teamId`, 'teamId')
      .leftJoinAndSelect(`${alias}.keySet`, 'keySet')
      .getRawMany();

    return keySetObjects.map(k => k.teamId);
  }

  public async getKeySetIds(
    vaultId: string = null,
    teamId: string = null
  ): Promise<string[]> {
    const [query, alias] = this.prepareQuery({
      vaultId,
      teamId,
    });

    const keySetObjects = await query
      .select(`${alias}.keySetId`, 'keySetId')
      .leftJoinAndSelect(`${alias}.keySet`, 'keySet')
      .getRawMany();

    return keySetObjects.map(k => k.keySetId);
  }

  public async getKeySet(
    vaultId: string = null,
    teamId: string = null
  ): Promise<KeySetEntity> {
    const [query, alias] = this.prepareQuery({
      vaultId,
      teamId,
    });

    const keySetObject = await query
      .leftJoinAndSelect(`${alias}.keySet`, 'keySet')
      .getOne();

    return keySetObject?.keySet;
  }

  public async getKeySets(
    vaultId: string = null,
    teamId: string = null
  ): Promise<KeySetEntity[]> {
    const [query, alias] = this.prepareQuery({
      vaultId,
      teamId,
    });

    const keySetObjects = await query
      .leftJoinAndSelect(`${alias}.keySet`, 'keySet')
      .getMany();

    return keySetObjects.map(e => e.keySet);
  }

  public async getVault(keySetId: string): Promise<VaultEntity> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isVault: true,
    });

    const keySetObject = await query
      .leftJoinAndSelect(`${alias}.vault`, 'vault')
      .getOne();

    return keySetObject?.vault;
  }

  public async getVaults(keySetId: string): Promise<VaultEntity[]> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isVault: true,
    });

    const keySetObjects = await query
      .leftJoinAndSelect(`${alias}.vault`, 'vault')
      .getMany();

    return keySetObjects.map(e => e.vault);
  }

  public async getTeam(keySetId: string): Promise<TeamEntity> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isTeam: true,
    });

    const keySetObject = await query
      .leftJoinAndSelect(`${alias}.team`, 'team')
      .getOne();

    return keySetObject?.team;
  }

  public async getTeams(keySetId: string): Promise<TeamEntity[]> {
    const [query, alias] = this.prepareQuery({
      keySetId,
      isTeam: true,
    });

    const keySetObjects = await query
      .leftJoinAndSelect(`${alias}.team`, 'team')
      .getMany();

    return keySetObjects.map(e => e.team);
  }

  public getKeySetObject(options: FindKeySetObjectsOptions) {
    const [query] = this.prepareQuery(options);
    return query.getOne();
  }

  public getKeySetObjects(options: FindKeySetObjectsOptions = {}) {
    const [query] = this.prepareQuery(options);
    return query.getMany();
  }

  public prepareQuery(
    options: FindKeySetObjectsOptions = {}
  ): [SelectQueryBuilder<KeySetObjectEntity>, string] {
    const alias = 'key_set_objects';
    const query = this.keySetObjectsRepository
      .createQueryBuilder(alias)
      .leftJoin(`${alias}.keySet`, 'keySet')
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);

    if (options.vaultId) query.andWhere(`${alias}.vaultId = :vaultId`, options);

    if (options.teamId) query.andWhere(`${alias}.teamId = :teamId`, options);

    if (options.keySetId)
      query.andWhere(`${alias}.keySetId = :keySetId`, options);

    if (options.ownerAccountId)
      query.andWhere(`keySet.ownerAccountId = :ownerAccountId`, options);

    if (options.ownerTeamId)
      query.andWhere(`keySet.ownerTeamId = :ownerTeamId`, options);

    if (options.creatorAccountId)
      query.andWhere(`keySet.creatorAccountId = :creatorAccountId`, options);

    if (options.isVault) query.andWhere(`${alias}.vaultId IS NOT NULL`);

    if (options.isTeam) query.andWhere(`${alias}.teamId IS NOT NULL`);

    return [query, alias];
  }
}

export default KeySetObjectsService;
