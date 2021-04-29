import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateTeamOptions {
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
}
