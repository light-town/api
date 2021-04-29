import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

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

export class CreateTeamPayload {
  @ApiProperty({
    description: 'The account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  accountUuid: string;
}
