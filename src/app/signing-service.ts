/**
 * Signing service (spec §21-22). The private key arrives via environment
 * (REPOSELL_SIGNING_KEY, base64 of the 32-byte seed) and is never written
 * to disk. Public verification keys are safe to distribute.
 */

import * as ed25519 from '@noble/ed25519';
import {
  decodePrivateKey,
  decodePublicKey,
  encodePrivateKey,
  generateKeyPair,
  generateKeyId,
  pemToPublicKey,
  privateKeyToPem,
  publicKeyToPem,
} from '../utils/crypto.js';
import {
  renderSignatureDoc,
  signFileSet,
  verifyFileSet,
  type SignatureDoc,
} from '../domain/signature/envelope.js';

export const SIGNING_KEY_ENV = 'REPOSELL_SIGNING_KEY';

export class SigningKeyMissingError extends Error {
  readonly code = 'SIGNING_KEY_MISSING';
  constructor() {
    super(
      `No signing key configured. Set ${SIGNING_KEY_ENV} (base64 Ed25519 seed) in your environment or CI secrets.`,
    );
    this.name = 'SigningKeyMissingError';
  }
}

export class SigningKeyInvalidError extends Error {
  readonly code = 'SIGNING_KEY_INVALID';
  constructor(detail: string) {
    super(`${SIGNING_KEY_ENV} is not a valid base64 Ed25519 seed: ${detail}`);
    this.name = 'SigningKeyInvalidError';
  }
}

export function resolveSigningKey(env: Record<string, string | undefined>): Uint8Array {
  const raw = env[SIGNING_KEY_ENV];
  if (raw === undefined || raw.trim().length === 0) throw new SigningKeyMissingError();
  try {
    const bytes = decodePrivateKey(raw.trim());
    if (bytes.length !== 32) throw new Error(`expected 32 bytes, got ${bytes.length}`);
    return bytes;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SigningKeyInvalidError(detail);
  }
}

/** Generates a fresh keypair; only the public half may touch the filesystem. */
export async function createIdentity(): Promise<{
  privateBase64: string;
  publicPem: string;
  keyId: string;
}> {
  const { privateKey, publicKey } = await generateKeyPair();
  return {
    privateBase64: encodePrivateKey(privateKey),
    publicPem: publicKeyToPem(publicKey),
    keyId: await generateKeyId(publicKey),
  };
}

export async function signBuild(input: {
  files: Record<string, string>;
  privateKey: Uint8Array;
}): Promise<{ doc: SignatureDoc; rendered: string }> {
  const publicKey = await ed25519.getPublicKeyAsync(input.privateKey);
  const doc = await signFileSet({ files: input.files, privateKey: input.privateKey, publicKey });
  return { doc, rendered: renderSignatureDoc(doc) };
}

export async function verifyBuildSignature(input: {
  files: Record<string, string>;
  envelope: SignatureDoc;
  verificationKeyPem?: string;
  verificationKeyBase64?: string;
}): Promise<{ valid: boolean; failures: string[] }> {
  let publicKey: Uint8Array;
  if (input.verificationKeyPem !== undefined) {
    publicKey = pemToPublicKey(input.verificationKeyPem);
  } else if (input.verificationKeyBase64 !== undefined) {
    publicKey = decodePublicKey(input.verificationKeyBase64);
  } else {
    return { valid: false, failures: ['no verification key provided'] };
  }
  return verifyFileSet({ files: input.files, envelope: input.envelope, publicKey });
}

export { signFileSet, verifyFileSet, privateKeyToPem, publicKeyToPem };
