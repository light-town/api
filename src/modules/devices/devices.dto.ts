import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from '~/common/validation';

export enum OS {
  WINDOWS = 'Windows',
  LINUX = 'Linux',
  MACOS = 'Macintosh',
  ANDROID = 'Android',
  IOS = 'IOS',
}

export class Device {
  @ApiProperty({
    description: 'The unique uuid of device',
    required: true,
  })
  uuid: string;

  @ApiProperty({
    description: 'The OS device',
    required: true,
  })
  os: OS;

  @ApiProperty({
    description: 'The network hostname',
    required: true,
  })
  hostname: string;

  @ApiProperty({
    description: 'The user agent',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'The model of device (Mobile)',
    required: false,
  })
  model?: string;
}

export class DeviceCreatePayload {
  @ApiProperty({
    description: 'The operation system of device',
    required: true,
    enum: OS,
  })
  @IsEnum(OS)
  os: OS;

  @ApiProperty({
    description: 'The model of device (Mobile)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  model?: string;
}

export class DeviceCreateResponse {
  @ApiProperty({
    description: 'The unique uuid of device',
    required: true,
  })
  deviceUuid: string;
}
