/**
 * Marketplace Pricing Endpoint verification chain (spec §20, §23):
 * fetch configuration -> fetch signature -> verify signature -> validate
 * schema -> validate expiration/version -> accept. Any failure BLOCKs —
 * community marketplaces can never silently alter economic rules.
 */

import { canonicalJSONBuffer, decodeSignature } from '../../utils/crypto.js';
import { verify } from '../../utils/crypto.js';
import { SCHEMA_PRICING, type PricingConfigDoc } from '../protocol/documents.js';

export interface FetchJsonLike {
  (url: string): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

export const DEFAULT_PRICING_FETCH: FetchJsonLike = (url) =>
  fetch(url).then((res) => ({ ok: res.ok, status: res.status, json: () => res.json() }));

export interface PricingVerificationFailure {
  stage: 'fetch' | 'schema' | 'signature' | 'expiration';
  detail: string;
}

export type PricingVerificationResult =
  | { accepted: true; config: PricingConfigDoc }
  | { accepted: false; failure: PricingVerificationFailure };

interface RawPricingEnvelope {
  config?: unknown;
  signature?: unknown;
  key_id?: unknown;
  algorithm?: unknown;
}

function parsePricingConfig(value: unknown): PricingConfigDoc | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  // SAFETY: shape checked above; fields validated individually below.
  const raw = value as Record<string, unknown>;
  if (raw['schema'] !== SCHEMA_PRICING) return undefined;
  const fee = raw['default_marketplace_fee'];
  const publicShare = raw['public_marketplace_percentage'];
  const mainShare = raw['main_marketplace_percentage'];
  const currency = raw['currency'];
  if (
    typeof fee !== 'number' ||
    typeof publicShare !== 'number' ||
    typeof mainShare !== 'number' ||
    typeof currency !== 'string'
  ) {
    return undefined;
  }
  if (publicShare + mainShare !== 100) return undefined;
  return {
    schema: SCHEMA_PRICING,
    default_marketplace_fee: fee,
    public_marketplace_percentage: publicShare,
    main_marketplace_percentage: mainShare,
    currency,
    ...(typeof raw['valid_until'] === 'string' ? { valid_until: raw['valid_until'] } : {}),
  };
}

async function fetchEnvelope(
  endpointUrl: string,
  doFetch: FetchJsonLike,
): Promise<{ envelope?: RawPricingEnvelope; failure?: PricingVerificationFailure }> {
  try {
    const res = await doFetch(endpointUrl);
    if (!res.ok) return { failure: { stage: 'fetch', detail: `HTTP ${res.status}` } };
    // SAFETY: network JSON projected onto documented envelope shape.
    const body = (await res.json()) as RawPricingEnvelope;
    return { envelope: body };
  } catch (error) {
    return { failure: { stage: 'fetch', detail: error instanceof Error ? error.message : String(error) } };
  }
}

/**
 * Verifies a signed pricing envelope against the pinned official RepoSell
 * verification key. `now` bounds `valid_until` checking; injectable for tests.
 */
export async function verifyPricingEndpoint(input: {
  envelopeUrl: string;
  officialPublicKeyBase64: string;
  now?: Date;
  fetchImpl?: FetchJsonLike;
}): Promise<PricingVerificationResult> {
  const doFetch = input.fetchImpl ?? DEFAULT_PRICING_FETCH;
  const fetched = await fetchEnvelope(input.envelopeUrl, doFetch);
  if (fetched.failure !== undefined || fetched.envelope === undefined) {
    return {
      accepted: false,
      failure: fetched.failure ?? { stage: 'fetch', detail: 'empty response' },
    };
  }
  const envelope = fetched.envelope;

  const config = parsePricingConfig(envelope.config);
  if (config === undefined) {
    return { accepted: false, failure: { stage: 'schema', detail: 'pricing document failed schema validation' } };
  }

  if (
    typeof envelope.signature !== 'string' ||
    typeof envelope.key_id !== 'string' ||
    envelope.algorithm !== 'Ed25519'
  ) {
    return { accepted: false, failure: { stage: 'signature', detail: 'envelope missing signature fields' } };
  }

  let signatureValid = false;
  try {
    const canonicalConfig = {
      schema: config.schema,
      default_marketplace_fee: config.default_marketplace_fee,
      public_marketplace_percentage: config.public_marketplace_percentage,
      main_marketplace_percentage: config.main_marketplace_percentage,
      currency: config.currency,
      ...(config.valid_until !== undefined ? { valid_until: config.valid_until } : {}),
    };
    signatureValid = await verify(
      canonicalJSONBuffer(canonicalConfig),
      decodeSignature(envelope.signature),
      decodePublicKeyFromBase64(input.officialPublicKeyBase64),
    );
  } catch (error) {
    return {
      accepted: false,
      failure: { stage: 'signature', detail: error instanceof Error ? error.message : String(error) },
    };
  }
  if (!signatureValid) {
    return { accepted: false, failure: { stage: 'signature', detail: 'Ed25519 verification failed' } };
  }

  if (config.valid_until !== undefined) {
    const until = Date.parse(config.valid_until);
    const now = input.now ?? new Date();
    if (Number.isNaN(until) || until < now.getTime()) {
      return { accepted: false, failure: { stage: 'expiration', detail: `config expired at ${config.valid_until}` } };
    }
  }

  return { accepted: true, config };
}

function decodePublicKeyFromBase64(encoded: string): Uint8Array {
  return new Uint8Array(Buffer.from(encoded, 'base64'));
}

/** Splits a fee pool per the accepted pricing configuration (§47). */
export function splitMarketplaceFee(input: {
  price: number;
  config: PricingConfigDoc;
}): { seller: number; mainMarketplace: number; publicMarketplace: number } {
  // Canonical RepoSell economics: fee = max(fee floor, 10% of price).
  const fee = Math.max(input.config.default_marketplace_fee, input.price * 0.1);
  const seller = input.price - fee;
  const publicShare = input.config.public_marketplace_percentage / 100;
  return {
    seller: round2(seller),
    mainMarketplace: round2(fee * (1 - publicShare)),
    publicMarketplace: round2(fee * publicShare),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
