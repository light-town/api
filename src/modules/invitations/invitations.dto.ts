import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { IsString } from '~/common/validation';

export enum InvitationVerificationStagesEnum {
  AWAITING_ANSWER = 'AWAITING_ANSWER',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class InvitationVerificationStage {
  @ApiProperty({
    description: 'The invitation verification stage uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The name type of the verification stage',
    enum: InvitationVerificationStagesEnum,
  })
  @IsString()
  @IsEnum(InvitationVerificationStagesEnum)
  name: InvitationVerificationStagesEnum;
}

export class Invitation {
  @ApiProperty({
    description: 'The invitation uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The account uuid of invited user',
  })
  @IsString()
  accountUuid: string;

  @ApiProperty({
    description: 'The account invitation verification stage',
  })
  @IsString()
  @ValidateNested()
  accountVerificationStage: InvitationVerificationStage;

  @ApiProperty({
    description: 'The team uuid of where invited new user',
  })
  @IsString()
  teamUuid: string;

  @ApiProperty({
    description: 'The team invitation verification stage',
  })
  @IsString()
  @ValidateNested()
  teamVerificationStage: InvitationVerificationStage;

  @ApiProperty({
    description: 'The datetime of last updating invitation',
    required: true,
  })
  @IsDateString()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating invitation',
    required: true,
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'The datetime of expires invitation',
    required: true,
  })
  @IsDateString()
  expiresAt: string;
}

export class CreateInvitationByTeamMemberPayload {
  @ApiProperty({
    description: 'The account uuid of invited user',
  })
  @IsString()
  accountUuid: string;
}

export class CreateInvitationByAccountPayload {
  @ApiProperty({
    description: 'The team uuid of where invited new user',
  })
  @IsString()
  teamUuid: string;
}
