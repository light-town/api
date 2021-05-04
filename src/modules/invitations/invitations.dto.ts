import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { IsString } from '~/common/validation';
import { CreateKeySetPayload } from '../key-sets/key-sets.dto';

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
    required: true,
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
    required: true,
  })
  @IsString()
  accountUuid: string;

  @ApiProperty({
    description: 'The account invitation verification stage',
    required: true,
  })
  @IsString()
  @ValidateNested()
  accountVerificationStage: InvitationVerificationStage;

  @ApiProperty({
    description: 'The team uuid of where invited new user',
    required: true,
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
    required: true,
  })
  @IsString()
  accountUuid: string;

  @ApiProperty({
    description: 'The provided key sets for getting team key',
    required: true,
  })
  @ValidateNested()
  encKeySet: CreateKeySetPayload;
}

export class CreateInvitationByAccountPayload {
  @ApiProperty({
    description: 'The team uuid of where invited new user',
    required: true,
  })
  @IsString()
  teamUuid: string;
}

export class AcceptInvitationByTeamMemberPayload {
  @ApiProperty({
    description: 'The provided key sets for getting team key',
    required: true,
  })
  @ValidateNested()
  encKeySet: CreateKeySetPayload;
}
