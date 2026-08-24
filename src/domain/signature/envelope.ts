/**
 * Signature envelope for generated file sets (spec §21-22).
 *
 * The envelope hashes every signed file (SHA-256) and signs the canonical
 * digest document with Ed25519. Private keys stay out of Git/CI artifacts;
 * only the public verification key is distributed.
 */

import {
  canonicalJSONBuffer,
  decodeSignature,
  encodeSignature,
  generateKeyId,
  sha256Hex,
  sign,
  verify,
} from '../../utils/crypto.js';
import { SCHEMA_SIGNATURE } from '../protocol/documents.js';

export interface SignatureDoc {
  schema: typeof SCHEMA_SIGNATURE;
  algorithm: 'Ed25519';
  key_id: string;
  files: Record<string, string>;
  signature: string;
}

export interface SignedFileSet {
  files: Record<string, string>;
}

function digestDocument(files: Record<string, string>): Uint8Array {
  return canonicalJSONBuffer({
    algorithm: 'Ed25519',
    files,
    schema: SCHEMA_SIGNATURE,
  });
}

/** Signs a set of relative-path -> content mappings. Deterministic per input + key. */
export async function signFileSet(input: {
  files: Record<string, string>;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}): Promise<SignatureDoc> {
  const paths = Object.keys(input.files).sort();
  const digests: Record<string, string> = {};
  for (const relPath of paths) {
    // SAFETY: relPath comes from Object.keys of the caller-provided record.
    digests[relPath] = sha256Hex(new TextEncoder().encode(input.files[relPath]));
  }
  const keyId = await generateKeyId(input.publicKey);
  const signatureBytes = await sign(digestDocument(digests), input.privateKey);
  return {
    schema: SCHEMA_SIGNATURE,
    algorithm: 'Ed25519',
    key_id: keyId,
    files: digests,
    signature: encodeSignature(signatureBytes),
  };
}

/**
 * Verifies a signature envelope against the current file contents and the
 * public verification key. Returns false (with reasons) on any mismatch —
 * never silently recovers (spec §52).
 */
export async function verifyFileSet(input: {
  files: Record<string, string>;
  envelope: SignatureDoc;
  publicKey: Uint8Array;
}): Promise<{ valid: boolean; failures: string[] }> {
  const failures: string[] = [];
  if (input.envelope.algorithm !== 'Ed25519') {
    failures.push(`unsupported algorithm "${input.envelope.algorithm}"`);
  }
  if (input.envelope.schema !== SCHEMA_SIGNATURE) {
    failures.push(`unknown envelope schema "${input.envelope.schema}"`);
  }

  const expectedPaths = Object.keys(input.envelope.files).sort();
  const actualPaths = Object.keys(input.files).sort();
  if (expectedPaths.join('\n') !== actualPaths.join('\n')) {
    failures.push('signed file set does not match built file set');
  }

  const recomputed: Record<string, string> = {};
  for (const relPath of actualPaths) {
    // SAFETY: relPath comes from Object.keys of the caller-provided record.
    recomputed[relPath] = sha256Hex(new TextEncoder().encode(input.files[relPath]));
  }
  for (const relPath of expectedPaths) {
    // SAFETY: relPath comes from Object.keys of the caller-provided record.
    const actual = recomputed[relPath];
    const declared = input.envelope.files[relPath];
    if (actual === undefined) continue;
    if (declared !== actual) failures.push(`content hash mismatch for ${relPath}`);
  }

  if (!Object.prototype.hasOwnProperty.call(input.envelope, 'signature') || input.envelope.signature.length === 0) {
    failures.push('missing signature bytes');
  } else {
    const digestOnly: Record<string, string> = {};
    for (const relPath of expectedPaths) {
      // SAFETY: relPath comes from Object.keys of the caller-provided record.
      const declared = input.envelope.files[relPath];
      if (declared !== undefined) digestOnly[relPath] = declared;
    }
    let ok = false;
    try {
      ok = await verify(
        digestDocument(digestOnly),
        decodeSignature(input.envelope.signature),
        input.publicKey,
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    if (!ok) failures.push('Ed25519 verification failed');
  }

  return { valid: failures.length === 0, failures };
}

/** Stable JSON rendering used by the build to emit signature.json. */
export function renderSignatureDoc(doc: SignatureDoc): string {
  return JSON.stringify({ ...doc, files: sortedRecord(doc.files) }, null, 2) + '\n';
}

function sortedRecord(record: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(record).sort()) {
    const value: string | undefined = record[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}
