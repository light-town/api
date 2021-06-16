import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from '~/common/validation';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateVaultItemCategoryOptions } from '../vault-item-categories/vault-item-categories.dto';

export class EncVaultKey {
  @ApiProperty({
    description: 'The type of encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  kty: string;

  @ApiProperty({
    description: 'The encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  alg: string;

  @ApiProperty({
    description: 'The encrypted key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class Vault {
  @ApiProperty({
    description: 'The unique uuid of vault',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The encrypted vault key',
    required: true,
  })
  @ValidateNested()
  encKey: EncVaultKey;

  @ApiProperty({
    description: 'The encrypted overview of vault',
    required: true,
  })
  @ValidateNested()
  encOverview: any;

  @ApiProperty({
    description: 'The unique uuid of key set',
    required: true,
  })
  @IsString()
  @IsUUID()
  keySetUuid: string;

  @ApiProperty({
    description: 'The unique uuid of account',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  ownerAccountUuid: string;

  @ApiProperty({
    description: 'The unique uuid of account',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  ownerTeamUuid: string;

  @ApiProperty({
    description: 'The vault folders count',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  foldersCount: number;

  @ApiProperty({
    description: 'The vault items count',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  itemsCount: number;

  @ApiProperty({
    description: 'The datetime of last updating the vault',
    required: true,
  })
  @IsDate()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating the vault',
    required: true,
  })
  @IsDate()
  createdAt: string;
}

export class CreateVaultPayload {
  @ApiProperty({
    description: 'The encrypted vault key',
    required: true,
  })
  @ValidateNested()
  encKey: EncVaultKey;

  @ApiProperty({
    description: 'The encrypted overview of the vault',
    required: true,
  })
  @ValidateNested()
  encOverview: any;

  @ApiProperty({
    description: 'The encrypted categories of the vault',
    required: true,
  })
  @ValidateNested()
  encCategories: CreateVaultItemCategoryOptions[];
}
