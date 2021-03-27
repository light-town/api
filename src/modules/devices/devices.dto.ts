import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from '~/common/validation';

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
    enum: OS,
  })
  @IsEnum(OS)
  os: OS;
}

export class DeviceCreateResponse {
  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}
