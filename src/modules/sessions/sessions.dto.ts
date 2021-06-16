export const SESSION_EXPIRES_AT = 20 * 60 * 1000; // 20 minutes

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
