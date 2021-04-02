import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MFATypesEnum } from '../auth/auth.dto';

export class CreateAccountDTO {
  key: string;
  userId: string;
  salt: string;
  verifier: string;
  mfaType?: MFATypesEnum;
}

export class GetAccountResponse {
  @ApiProperty({
    description: 'The account uuid',
  })
  accountUuid: string;

  @ApiProperty({
    description: 'The account name',
  })
  accountName: string;

  @ApiProperty({
    description: 'The account avatar url',
  })
  accountAvatarUrl: string;

  @ApiProperty({
    description: 'The user uuid',
  })
  userUuid: string;

  @ApiProperty({
    description: 'The user name',
  })
  userName: string;

  @ApiProperty({
    description: 'The user avatar url',
  })
  userAvatarUrl: string;

  @ApiProperty({
    description: 'The account uuid',
    enum: MFATypesEnum,
  })
  MFAType: string;
}

export class SetMultiFactorAuthPayload {
  @ApiProperty({
    description: 'The unique uuid of device',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;

  @ApiProperty({
    description: 'The type of multi-factor authentication',
    required: true,
    enum: MFATypesEnum,
  })
  @IsEnum(MFATypesEnum)
  type: MFATypesEnum;
}
