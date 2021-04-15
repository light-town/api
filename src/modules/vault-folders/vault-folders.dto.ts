import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateVaultFolderOptions {
  @ApiProperty({
    description: 'The encrypted overview of vault folder',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The parent folder uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  parentFolderUuid?: string;
}

export class VaultFolder {
  @ApiProperty({
    description: 'The unique uuid of vault folder',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The encrypred overview of vault folder',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The vault uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  vaultUuid: string;

  @ApiProperty({
    description: 'The creator account uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  creatorAccountUuid: string;

  @ApiProperty({
    description: 'The parent folder uuid',
    required: false,
  })
  @IsString()
  @IsUUID()
  parentFolderUuid: string;

  @ApiProperty({
    description: 'The datetime of last updating vault folder',
    required: true,
  })
  @IsDate()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating vault folder',
    required: true,
  })
  @IsDate()
  createdAt: string;
}
