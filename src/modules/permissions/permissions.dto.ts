import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ObjectTypesEnum } from '../roles/roles.dto';

export enum PermissionTypesEnum {
  READ_ONLY = 'READ_ONLY',
  READ_AND_WRITE = 'READ_AND_WRITE',
  DETELE = 'DETELE',
  ADMINISTRATOR = 'ADMINISTRATOR',
  CREATOR = 'CREATOR',
}

export class CreatePermissionOptions {
  @ApiProperty({
    description: 'The permission object uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  objectUuid: string;

  @ApiProperty({
    description: 'The name type of the permission object',
    enum: ObjectTypesEnum,
  })
  @IsString()
  @IsEnum(ObjectTypesEnum)
  objectTypeName: ObjectTypesEnum;

  @ApiProperty({
    description: 'The name type of the permission',
    enum: PermissionTypesEnum,
  })
  @IsString()
  @IsEnum(PermissionTypesEnum)
  typeName: PermissionTypesEnum;
}

export class PermissionObjectType {
  @ApiProperty({
    description: 'The unique uuid of permission object type',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The name type of the permission object',
    enum: ObjectTypesEnum,
  })
  @IsString()
  @IsEnum(ObjectTypesEnum)
  name: ObjectTypesEnum;
}

export class PermissionType {
  @ApiProperty({
    description: 'The unique uuid of permission type',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The name type of the permission',
    enum: PermissionTypesEnum,
  })
  @IsString()
  @IsEnum(PermissionTypesEnum)
  name: PermissionTypesEnum;
}

export class Permission {
  @ApiProperty({
    description: 'The unique uuid of permission',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The permission object uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  objectUuid: string;

  @ApiProperty({
    description: 'The permission object type',
    required: true,
  })
  @IsObject()
  @ValidateNested()
  objectType: PermissionObjectType;

  @ApiProperty({
    description: 'The permission  type',
    required: true,
  })
  @IsObject()
  @ValidateNested()
  type: PermissionType;

  @ApiProperty({
    description: 'The role uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  roleUuid: string;

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
