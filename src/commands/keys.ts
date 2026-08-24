/**
 * `reposell keys` — cryptographic identity management (spec §21-22).
 *
 * generate: fresh Ed25519 identity; the PRIVATE half is printed exactly
 *           once (for CI secrets) and never written to disk. The public
 *           verification key lands at .github/reposell/verification-key.pem.
 * show:     derive the public key from the configured private key.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  createIdentity,
  resolveSigningKey,
  SigningKeyInvalidError,
  SigningKeyMissingError,
} from '../app/signing-service.js';
import { encodePrivateKey, generateKeyId, publicKeyToPem } from '../utils/crypto.js';
import * as ed25519 from '@noble/ed25519';

export interface KeysResult {
  ok: boolean;
  report: string;
}

export async function keysCommand(cwd: string, subcommand: string | undefined): Promise<KeysResult> {
  if (subcommand === 'generate') return generate(cwd);
  if (subcommand === 'show') return show();
  return {
    ok: false,
    report: 'usage: reposell keys <generate|show>',
  };
}

async function generate(cwd: string): Promise<KeysResult> {
  const identity = await createIdentity();
  const keyDir = path.join(cwd, '.github', 'reposell');
  await fs.mkdir(keyDir, { recursive: true });
  const pemPath = path.join(keyDir, 'verification-key.pem');
  await fs.writeFile(pemPath, identity.publicPem);

  return {
    ok: true,
    report: [
    '✓ Generated Ed25519 signing identity',
    `  Key ID: ${identity.keyId}`,
    `  Public verification key written to: ${path.relative(cwd, pemPath)} (safe to commit)`,
    '',
    'PRIVATE KEY — store as a GitHub Actions secret named REPOSELL_SIGNING_KEY.',
    'It is shown once and never saved by reposell:',
    '',
    `  ${identity.privateBase64}`,
    '',
    '  gh secret set REPOSELL_SIGNING_KEY   # then paste the line above',
  ].join('\n'),
  };
}

async function show(): Promise<KeysResult> {
  try {
    const privateKey = resolveSigningKey(process.env);
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);
    return {
      ok: true,
      report: [
      `Private key source: ${'REPOSELL_SIGNING_KEY'} (base64 seed ${encodePrivateKey(privateKey).length} chars)`,
      `Key ID: ${await generateKeyId(publicKey)}`,
      'Public verification key:',
      '',
      publicKeyToPem(publicKey),
      ].join('\n'),
    };
  } catch (error) {
    if (error instanceof SigningKeyMissingError || error instanceof SigningKeyInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
