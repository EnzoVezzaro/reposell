/**
 * `reposell verify <target>` — CI-facing verification entry points (§23, §25).
 *
 *   manifest  config parses and every gating release passes publication gates
 *   trust     dist/reposell/** matches its signature.json under the
 *             distributed verification key (.github/reposell/verification-key.pem)
 *   pricing   official marketplace pricing endpoint verifies against the
 *             pinned RepoSell public key (REPOSELL_OFFICIAL_VERIFY_KEY)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ConfigInvalidError, ConfigNotFoundError } from '../app/config-service.js';
import { evaluateRepository, type BuildOptions } from '../app/build-service.js';
import { gatingReleases } from './evaluation-format.js';
import { pemToPublicKey } from '../utils/crypto.js';
import { verifyFileSet, type SignatureDoc } from '../domain/signature/envelope.js';
import { verifyPricingEndpoint } from '../domain/pricing/endpoint.js';

export interface VerifyResult {
  ok: boolean;
  report: string;
}

export async function verifyCommand(
  cwd: string,
  target: string | undefined,
  argument?: string,
  options: BuildOptions = {},
): Promise<VerifyResult> {
  if (target === 'manifest') return verifyManifest(cwd, options);
  if (target === 'trust') return verifyTrust(cwd);
  if (target === 'pricing' && argument !== undefined) return verifyPricing(argument);
  return {
    ok: false,
    report: 'usage: reposell verify <manifest|trust|pricing <endpoint-url>>',
  };
}

async function verifyManifest(cwd: string, options: BuildOptions): Promise<VerifyResult> {
  try {
    const evaluation = await evaluateRepository(cwd, options);
    const gating = gatingReleases(evaluation.evaluations, evaluation.releaseMode);
    const blocked = gating.filter((item) => item.state === 'blocked');
    return {
      ok: blocked.length === 0,
      report:
        blocked.length === 0
          ? `✓ Manifest valid · ${gating.length} gating release(s) pass all gates`
          : `✗ BLOCKED: ${blocked.map((item) => item.tag).join(', ')}`,
    };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}

async function verifyTrust(cwd: string): Promise<VerifyResult> {
  try {
    const outRoot = path.join(cwd, 'dist', 'reposell');
    // SAFETY: JSON.parse result validated field-by-field via envelope checks.
    const envelope = JSON.parse(await fs.readFile(path.join(outRoot, 'signature.json'), 'utf8')) as SignatureDoc;
    const keyPem = await fs.readFile(path.join(cwd, '.github', 'reposell', 'verification-key.pem'), 'utf8');
    const files: Record<string, string> = {};
    for (const relPath of Object.keys(envelope.files)) {
      // SAFETY: relPath comes from Object.keys of the parsed envelope record.
      files[relPath] = await fs.readFile(path.join(outRoot, relPath), 'utf8');
    }
    const result = await verifyFileSet({ files, envelope, publicKey: pemToPublicKey(keyPem) });
    return {
      ok: result.valid,
      report: result.valid
        ? `✓ Trust chain valid — ${Object.keys(files).length} signed files verified`
        : `✗ INVALID SIGNATURE → BLOCKED\n${result.failures.map((failure) => `  - ${failure}`).join('\n')}`,
    };
  } catch {
    return {
      ok: false,
      report: '✗ No verifiable build found. Run `reposell build` with REPOSELL_SIGNING_KEY set.',
    };
  }
}

async function verifyPricing(endpointUrl: string): Promise<VerifyResult> {
  const publicKey = process.env['REPOSELL_OFFICIAL_VERIFY_KEY'];
  if (publicKey === undefined || publicKey.trim().length === 0) {
    return { ok: false, report: '✗ REPOSELL_OFFICIAL_VERIFY_KEY not configured; refusing to trust unsigned pricing.' };
  }
  const result = await verifyPricingEndpoint({
    envelopeUrl: endpointUrl,
    officialPublicKeyBase64: publicKey.trim(),
  });
  if (!result.accepted) {
    return {
      ok: false,
      report: `✗ INVALID pricing configuration (${result.failure.stage}) → BLOCKED\n  ${result.failure.detail}`,
    };
  }
  const config = result.config;
  return {
    ok: true,
    report: [
    '✓ Pricing configuration accepted',
    `  Fee floor: $${config.default_marketplace_fee} ${config.currency}`,
    `  Main marketplace share: ${config.main_marketplace_percentage}%`,
    `  Public marketplace share: ${config.public_marketplace_percentage}%`,
    ...(config.valid_until !== undefined ? [`  Valid until: ${config.valid_until}`] : []),
  ].join('\n'),
  };
}
