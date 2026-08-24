/**
 * Ed25519 Cryptographic Operations
 * Using @noble/ed25519 v3 (async-only API; sync API requires external sha512).
 */

import { createHash } from 'crypto';
import * as ed25519 from '@noble/ed25519';

export interface KeyPairBytes {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export async function generateKeyPair(): Promise<KeyPairBytes> {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}

export function encodePublicKey(key: Uint8Array): string {
  return Buffer.from(key).toString('base64');
}

export function decodePublicKey(encoded: string): Uint8Array {
  return new Uint8Array(Buffer.from(encoded, 'base64'));
}

export function encodePrivateKey(key: Uint8Array): string {
  return Buffer.from(key).toString('base64');
}

export function decodePrivateKey(encoded: string): Uint8Array {
  return new Uint8Array(Buffer.from(encoded, 'base64'));
}

export function encodeSignature(sig: Uint8Array): string {
  return Buffer.from(sig).toString('base64url');
}

export function decodeSignature(encoded: string): Uint8Array {
  return new Uint8Array(Buffer.from(encoded, 'base64url'));
}

export async function sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  return ed25519.signAsync(data, privateKey);
}

export async function verify(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
  try {
    return await ed25519.verifyAsync(signature, data, publicKey);
  } catch {
    return false;
  }
}

type CanonicalPrimitive = string | number | boolean | null;
type CanonicalValue = CanonicalPrimitive | CanonicalValue[] | { [key: string]: CanonicalValue };

/**
 * Deterministic JSON serialization: object keys sorted recursively,
 * arrays keep order, no whitespace. Same input always yields same bytes.
 */
export function canonicalJSON(value: CanonicalValue): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJSON(item));
    return '[' + items.join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const pairs: string[] = [];
  for (const key of keys) {
    // SAFETY: index access under noUncheckedIndexedAccess; undefined values are not canonical JSON.
    const item: CanonicalValue | undefined = value[key];
    if (item === undefined) continue;
    pairs.push(JSON.stringify(key) + ':' + canonicalJSON(item));
  }
  return '{' + pairs.join(',') + '}';
}

export function canonicalJSONBuffer(value: CanonicalValue): Uint8Array {
  return new TextEncoder().encode(canonicalJSON(value));
}

export function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export async function generateKeyId(publicKey: Uint8Array): Promise<string> {
  const hash = createHash('sha256').update(publicKey).digest('hex');
  return 'key_' + hash.slice(0, 16);
}

// DER wrappers for the two fixed Ed25519 encodings (RFC 8410).
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

export function publicKeyToPem(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) throw new Error('Ed25519 public key must be exactly 32 bytes');
  const der = Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(publicKey)]);
  const body = der.toString('base64');
  const lines = body.match(/.{1,64}/g) ?? [];
  return ['-----BEGIN PUBLIC KEY-----', ...lines, '-----END PUBLIC KEY-----', ''].join('\n');
}

export function pemToPublicKey(pem: string): Uint8Array {
  const base64 = pem
    .split(/\r?\n/)
    .filter((line) => line.length > 0 && !line.startsWith('-----'))
    .join('');
  const der = Buffer.from(base64, 'base64');
  const prefix = SPKI_ED25519_PREFIX;
  if (der.length !== prefix.length + 32 || !der.subarray(0, prefix.length).equals(prefix)) {
    throw new Error('Not an Ed25519 SubjectPublicKeyInfo PEM');
  }
  return new Uint8Array(der.subarray(prefix.length));
}

export function privateKeyToPem(privateKey: Uint8Array): string {
  if (privateKey.length !== 32) throw new Error('Ed25519 private seed must be exactly 32 bytes');
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(privateKey)]);
  const body = der.toString('base64');
  const lines = body.match(/.{1,64}/g) ?? [];
  return ['-----BEGIN PRIVATE KEY-----', ...lines, '-----END PRIVATE KEY-----', ''].join('\n');
}
