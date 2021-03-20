export enum PushNotificationStageEnum {
  CREATED = 'CREATED',
  SENT = 'SENT',
  ARRIVED = 'ARRIVED',
}

export interface Payload {
  [key: string]: string | number | boolean | Payload;
}
