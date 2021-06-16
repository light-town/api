import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  isUUID,
  IsUUID,
} from 'class-validator';
import { TeamRolesEnum } from '../teams/teams.service';

export class TeamMember {
  @ApiProperty({
    description: 'The unique uuid of team member',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  accountUuid: string;

  @ApiProperty({
    description: 'The account name',
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({
    description: 'The account avatar url',
  })
  @IsString()
  @IsNotEmpty()
  accountAvatarUrl: string;

  @ApiProperty({
    description: 'The user uuid',
  })
  @IsString()
  @IsUUID()
  userUuid: string;

  @ApiProperty({
    description: 'The user name',
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'The user avatar url',
  })
  @IsString()
  @IsNotEmpty()
  userAvatarUrl: string;

  @ApiProperty({
    description: 'The role uuid',
  })
  @IsString()
  @IsUUID()
  roleUuid: string;

  @ApiProperty({
    description: 'The role name',
    enum: TeamRolesEnum,
  })
  @IsEnum(TeamRolesEnum)
  roleName: TeamRolesEnum;

  @ApiProperty({
    description: 'The account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  teamUuid: string;

  @ApiProperty({
    description: 'The datetime of last updating team',
    required: true,
  })
  @IsDateString()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating team',
    required: true,
  })
  @IsDateString()
  createdAt: string;
}

export class CreateTeamMemberPayload {
  @ApiProperty({
    description: 'The account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  accountUuid: string;

  @ApiProperty({
    description: 'The role uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  roleUuid: string;
}
