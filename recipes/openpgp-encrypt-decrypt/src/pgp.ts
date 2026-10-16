import * as openpgp from "openpgp";
import type { PrivateKey } from "openpgp";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export type DecryptResult = {
  text: string;
  verified: boolean;
};

export async function generateKeyPair(passphrase: string, name: string, email: string): Promise<KeyPair> {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "ecc",
    curve: "curve25519Legacy",
    userIDs: [{ name, email }],
    passphrase,
    format: "armored",
  });
  return { publicKey, privateKey };
}

export async function unlockPrivateKey(armoredKey: string, passphrase: string): Promise<PrivateKey> {
  const privateKey = await openpgp.readPrivateKey({ armoredKey });
  return openpgp.decryptKey({ privateKey, passphrase });
}

export async function encryptAndSign(text: string, publicKeyArmored: string, signingKey: PrivateKey): Promise<string> {
  const message = await openpgp.createMessage({ text });
  const encryptionKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const armored = await openpgp.encrypt({
    message,
    encryptionKeys: encryptionKey,
    signingKeys: signingKey,
  });
  return armored as string;
}

export async function decryptAndVerify(
  armoredMessage: string,
  decryptionKey: PrivateKey,
  verificationKeyArmored: string,
): Promise<DecryptResult> {
  const message = await openpgp.readMessage({ armoredMessage });
  const verificationKey = await openpgp.readKey({ armoredKey: verificationKeyArmored });
  const { data, signatures } = await openpgp.decrypt({
    message,
    decryptionKeys: decryptionKey,
    verificationKeys: verificationKey,
  });
  const verified = signatures.length > 0 && (await signatures[0].verified);
  return { text: data as string, verified };
}

export async function signDetached(text: string, signingKey: PrivateKey): Promise<string> {
  const message = await openpgp.createMessage({ text });
  const armored = await openpgp.sign({
    message,
    signingKeys: signingKey,
    detached: true,
    format: "armored",
  });
  return armored as string;
}

export async function verifyDetached(
  text: string,
  armoredSignature: string,
  verificationKeyArmored: string,
): Promise<boolean> {
  const message = await openpgp.createMessage({ text });
  const signature = await openpgp.readSignature({ armoredSignature });
  const verificationKey = await openpgp.readKey({ armoredKey: verificationKeyArmored });
  const { signatures } = await openpgp.verify({
    message,
    signature,
    verificationKeys: verificationKey,
  });
  return signatures.length > 0 && (await signatures[0].verified);
}
