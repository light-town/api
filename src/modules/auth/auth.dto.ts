export class SignUpDTO {
  accountKey: string;
  salt: string;
  verifier: string;

  username: string;
  avatarUrl?: string;

  deviceId?: string;
  op?: string; // operating system
  userAgent?: string;
  hostname?: string;
}

export class SignInDTO {
  accountKey: string;
  deviceId: string;
}

export class StartSessionDTO {
  sessionId: string;
  clientPubicEphemeralKey: string;
  clientSessionProofKey: string;
}
