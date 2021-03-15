export class SignUpDTO {
  accountKey: string;
  salt: string;
  verifier: string;

  username: string;
  avatarURL?: string;

  deviceId?: string;
  op?: string; // operating system
  userAgent?: string;
  hostname?: string;
}

export class SignInDTO {
  accountKey: string;
}

export class StartSessionDTO {
  accountKey: string;
  clientPubicEphemeral: string;
  clientSessionProof: string;
}
