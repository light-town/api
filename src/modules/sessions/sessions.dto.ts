export enum VerifySessionStageEnum {
  REQUIRED = 'REQUIRED',
  NOT_REQUIRED = 'NOT_REQUIRED',
  COMPLETED = 'COMPLETED',
}

export class SessionCreateDTO {
  deviceId: string;
  accountId: string;
  secret: string;
}
