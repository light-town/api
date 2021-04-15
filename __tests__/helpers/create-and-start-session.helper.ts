import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import AuthController from '~/modules/auth/auth.controller';

export interface CreateAndStartSessionOptions {
  deviceUuid: string;
  accountKey: string;
  password: string;
}

export const createAndStartSessionHelper = async (
  app: INestApplication,
  options: CreateAndStartSessionOptions
) => {
  const authController = app.get<AuthController>(AuthController);

  const {
    sessionUuid,
    serverPublicEphemeral,
    salt,
  } = await authController.signIn({
    accountKey: options.accountKey,
    deviceUuid: options.deviceUuid,
  });

  const srpPrivateKey = core.srp.client.derivePrivateKey(
    options.accountKey,
    options.password,
    salt
  );

  const clientEphemeralKeyPair = core.srp.client.generateEphemeralKeyPair();
  const clientSession = core.srp.client.deriveSession(
    clientEphemeralKeyPair.secret,
    serverPublicEphemeral,
    salt,
    options.accountKey,
    srpPrivateKey
  );

  const { token, serverSessionProof } = await authController.startSession(
    sessionUuid,
    {
      clientPublicEphemeralKey: clientEphemeralKeyPair.public,
      clientSessionProofKey: clientSession.proof,
    }
  );

  core.srp.client.verifySession(
    clientEphemeralKeyPair.public,
    clientSession,
    serverSessionProof
  );

  return { token };
};

export default createAndStartSessionHelper;
