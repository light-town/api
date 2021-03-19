import { MFATypesEnum } from '../auth/auth.dto';

export class CreateAccountDTO {
  key: string;
  userId: string;
  salt: string;
  verifier: string;
  mfaType?: MFATypesEnum;
}
