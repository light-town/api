import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateVaultItemCategoryOptions {
  @ApiProperty({
    description: 'The encrypted overview of vault item category',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The encrypted details of vault item category',
    required: true,
  })
  @IsObject()
  encDetails?: Record<string, any>;
}

export class VaultItemCategory {
  @ApiProperty({
    description: 'The unique uuid of vault item category',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The encrypred overview of vault item category',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The encrypred overview of vault item category',
    required: false,
  })
  @IsObject()
  encDetails?: Record<string, any>;

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
    description: 'The datetime of last updating vault item category',
    required: true,
  })
  @IsDate()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating vault item category',
    required: true,
  })
  @IsDate()
  createdAt: string;
}
