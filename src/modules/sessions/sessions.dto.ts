export enum SessionVerificationStageEnum {
  REQUIRED = 'REQUIRED',
  NOT_REQUIRED = 'NOT_REQUIRED',
  COMPLETED = 'COMPLETED',
}

export class SessionCreateDTO {
  secret: string;
  deviceId: string;
  accountId: string;
  verificationDeviceId?: string;
}
