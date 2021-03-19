export enum VerifySessionStageEnum {
  REQUIRED = 'REQUIRED',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_REQUIRED = 'NOT_REQUIRED',
  COMPLETED = 'COMPLETED',
}

export class SessionCreateDTO {
  deviceId: string;
  accountId: string;
  secret: string;
}
