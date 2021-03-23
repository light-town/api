import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from '~/common/validation';

export enum OS {
  WINDOWS = 'WINDOWS',
  LINUX = 'LINUX',
  MACOS = 'MACOS',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export class Device {
  @ApiProperty({
    description: 'The unique uuid of device',
  })
  id: string;

  @ApiProperty({
    description: 'The OS device',
  })
  os: OS;

  @ApiProperty({
    description: 'The network hostname',
  })
  hostname: string;

  @ApiProperty({
    description: 'The user agent',
  })
  userAgent: string;
}

export class DeviceCreatePayload {
  @ApiProperty({
    description: 'The operation system of device',
    required: true,
  })
  @IsString()
  @IsEnum(OS)
  os: OS;

  @ApiProperty({
    description: 'The user agent',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'The hostname',
    required: true,
  })
  @IsString()
  hostname: string;
}

export class DeviceCreateResponse {
  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}
