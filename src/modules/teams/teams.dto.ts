import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateKeySetPayload, EncSymmetricKey } from '../key-sets/key-sets.dto';

export class CreateTeamKeySetPayload {
  @ApiProperty({
    description: 'The encrypted symmetric key',
    required: true,
  })
  @ValidateNested()
  encSymmetricKey: EncSymmetricKey;
}

export class CreateTeamOptions {
  @ApiProperty({
    required: true,
  })
  salt: string;

  @ApiProperty({
    required: true,
  })
  encKey: Record<string, any>;

  @ApiProperty({
    description: 'The encrypted overview of team',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The primary key set configuration',
    required: true,
  })
  @ValidateNested()
  primaryKeySet: CreateKeySetPayload;

  @ApiProperty({
    description: 'The primary key set configuration',
    required: true,
  })
  @ValidateNested()
  accountKeySet: CreateTeamKeySetPayload;
}

export class Team {
  @ApiProperty({
    description: 'The unique uuid of team',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The encrypted key of team',
    required: true,
  })
  @IsObject()
  encKey: Record<string, any>;

  @ApiProperty({
    description: 'The encrypted overview of team',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The creator account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  creatorAccountUuid: string;

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

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  salt: string;
}
