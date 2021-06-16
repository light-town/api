import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ObjectTypesEnum {
  TEAM = 'TEAM',
  VAULT = 'VAULT',
  FOLDER = 'FOLDER',
  ITEM = 'ITEM',
}

export class CreateRolePayload {
  @ApiProperty({
    description: 'The unique role name',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The parent role uuid',
    required: false,
  })
  @IsString()
  @IsUUID()
  parentRoleUuid: string;
}

export class Role {
  @ApiProperty({
    description: 'The unique uuid of team role',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The unique name of team role',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The unique uuid of team',
    required: true,
  })
  @IsString()
  @IsUUID()
  teamUuid: string;

  @ApiProperty({
    description: 'The unique uuid of parent role',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentRoleUuid: string;

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
