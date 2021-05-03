import _ from 'lodash';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ApiConflictException,
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import PermissionEntity from '~/db/entities/permission.entity';
import RoleEntity from '~/db/entities/role.entity';
import PermissionObjectTypesService from '../permissions/permission-object-types.service';
import PermissionsService from '../permissions/permissions.service';
import TeamMembersService from '../team-members/team-members.service';
import TeamsService from '../teams/teams.service';
import { ObjectTypesEnum, Role } from './roles.dto';
import RouterService from './router.service';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import PermissionTypesService from '../permissions/permission-types.service';

export class FindRolesOptions {
  id?: string;
  name?: string;
  teamId?: string;
  parentRoleId?: string;
}

export class CreateRoleOptions {
  name: string;
  parentRoleId?: string;
  teamId?: string;
}

@Injectable()
export class RolesService {
  public constructor(
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
    @Inject(forwardRef(() => PermissionsService))
    private readonly permissionsService: PermissionsService,
    private readonly permissionObjectTypesService: PermissionObjectTypesService,
    private readonly permissionTypesService: PermissionTypesService,
    private readonly routerService: RouterService
  ) {}

  public async createRole(options: CreateRoleOptions): Promise<RoleEntity> {
    const isTeamExists = this.teamsService.exists({
      id: options.teamId,
    });

    if (!isTeamExists) throw new ApiNotFoundException(`The team was not found`);

    return this.rolesRepository.save(
      this.rolesRepository.create({
        name: options.name,
        parentRoleId: options.parentRoleId,
        teamId: options.teamId,
      })
    );
  }

  public async format(e: RoleEntity | Promise<RoleEntity>): Promise<Role> {
    return this.normalize(<any>(e instanceof Promise ? await e : e));
  }

  public async formatAll(
    e: RoleEntity[] | Promise<RoleEntity[]>
  ): Promise<Role[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map((e: any) => this.normalize(e));
  }

  public normalize(entity: RoleEntity): Role {
    return {
      uuid: entity?.id,
      name: entity?.name,
      teamUuid: entity?.teamId,
      parentRoleUuid: entity?.parentRoleId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindRolesOptions
  ): [string, SelectQueryBuilder<RoleEntity>] {
    const alias = 'roles';
    const query = this.rolesRepository
      .createQueryBuilder(alias)
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.name) query.andWhere(`${alias}.name = :name`, options);
    if (options?.teamId) query.andWhere(`${alias}.teamId = :teamId`, options);
    if (options?.parentRoleId)
      query.andWhere(`${alias}.parentRoleId = :parentRoleId`, options);

    return [alias, query];
  }

  public getRole(options: FindRolesOptions = {}): Promise<RoleEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getOne();
  }

  public getRoles(options: FindRolesOptions = {}): Promise<RoleEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getMany();
  }

  public async exists(options: FindRolesOptions = {}): Promise<boolean> {
    const role = await this.getRole(options);
    return role !== undefined;
  }

  public async validate(
    teamMemberId: string,
    objectId: string,
    objectTypeName: ObjectTypesEnum,
    permissionTypeName: PermissionTypesEnum
  ) {
    const currentTeamMember = await this.teamMembersService.getTeamMember({
      id: teamMemberId,
    });

    if (!currentTeamMember)
      throw new ApiNotFoundException(`The team member was not found`);

    const objectTypes = (
      await this.permissionObjectTypesService.getPermissionObjectTypes()
    ).reduce((prev, val) => ({ ...prev, [val.name]: val }), {});

    const objectRoute = await this.routerService.buildRoute(
      objectId,
      objectTypeName
    );

    const permissions = await Promise.all(
      objectRoute.map(routeObj => {
        return this.computePermission(
          currentTeamMember.roleId,
          routeObj.id,
          objectTypes[routeObj.routeObjectType]?.id
        );
      })
    );

    const permissionType = await this.permissionTypesService.getPermissionType({
      name: permissionTypeName,
    });

    if (!permissionType)
      throw new ApiNotFoundException(`The permission type  was not found`);

    return (
      permissions.filter(
        p => p?.type?.name && p.type.level >= permissionType.level
      ).length > 0
    );
  }

  public async validateOrFail(
    teamMemberId: string,
    objectId: string,
    objectTypeName: ObjectTypesEnum,
    permissionTypeName: PermissionTypesEnum
  ): Promise<boolean | Error> {
    const validated = await this.validate(
      teamMemberId,
      objectId,
      objectTypeName,
      permissionTypeName
    );

    if (!validated)
      throw new ApiForbiddenException(
        `Access denied. The user doesn't have enough permissions`
      );

    return validated;
  }

  private async computePermission(
    currentRoleId: string,
    objectId: string,
    objectTypeId: string
  ) {
    const currentTeamMemberRole = await this.getRole({
      id: currentRoleId,
    });

    if (!currentTeamMemberRole)
      throw new ApiConflictException(`The team member role was not found`);

    const permissions: PermissionEntity[] = [];
    const currentRolePermissions = await this.permissionsService.getPermissions(
      {
        roleId: currentRoleId,
        objectId,
        objectTypeId,
      }
    );

    permissions.push(...currentRolePermissions);

    let currentParentRoleId = currentTeamMemberRole.parentRoleId;
    while (currentParentRoleId) {
      const parentRole = await this.getRole({ id: currentParentRoleId });

      const parentRolePermissions = await this.permissionsService.getPermissions(
        {
          roleId: parentRole.id,
          objectId,
          objectTypeId,
        }
      );

      permissions.push(...parentRolePermissions);

      currentParentRoleId = parentRole.parentRoleId;
    }

    return _.minBy(permissions, p => p.type.level);
  }
}

export default RolesService;
