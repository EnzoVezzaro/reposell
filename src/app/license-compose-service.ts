/**
 * License composition service: composes a policy from config/flags and
 * writes the .reposell/* machine artifacts plus the LICENSE policy section.
 * Deterministic; refuses to clobber a hand-written LICENSE (append-only).
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  composePolicy,
  parsePolicy,
  policyHash,
  PROFILES,
  type LicensePolicy,
  type LicenseProfile,
} from '../domain/licensing/policy.js';
import { generateArtifacts } from '../domain/licensing/generate.js';
import { compatibility } from '../domain/licensing/compatibility.js';

export class LicenseComposeError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'LicenseComposeError';
    this.issues = issues;
  }
}

export interface ComposeOptions {
  profile?: string;
  spdx?: string;
  spdxExceptions?: string;
  jurisdiction?: string;
  overrides?: Record<string, string>;
}

async function readPolicyFile(cwd: string): Promise<LicensePolicy | undefined> {
  try {
    const raw = await fs.readFile(path.join(cwd, '.reposell', 'license.json'), 'utf8');
    const parsed = parsePolicy(JSON.parse(raw));
    return parsed.policy;
  } catch {
    return undefined;
  }
}

/** Loads the active policy: composed on the fly from config when absent. */
export async function activePolicy(
  cwd: string,
  config: { licensing?: { policy?: ComposeOptions } },
): Promise<LicensePolicy | undefined> {
  const existing = await readPolicyFile(cwd);
  if (existing !== undefined) return existing;
  const configured = config.licensing?.policy;
  if (configured === undefined) return undefined;
  const result = composePolicy({
    // SAFETY: shape guarded by the validation immediately above before this cast.
    profile: (configured.profile ?? 'open-permissive') as LicenseProfile,
    spdx: configured.spdx,
    spdxExceptions: configured.spdxExceptions,
    jurisdiction: configured.jurisdiction,
    overrides: configured.overrides,
  });
  return result.policy;
}

export interface ComposeReport {
  profile: string;
  spdx: string;
  hash: string;
  written: string[];
  licenseAppended: boolean;
}

export async function composeLicense(cwd: string, options: ComposeOptions): Promise<ComposeReport> {
  const profile = options.profile ?? 'open-permissive';
  // SAFETY: shape guarded by the validation immediately above before this cast.
  if (!(PROFILES as readonly string[]).includes(profile)) {
    throw new LicenseComposeError([`unknown profile "${profile}" (known: ${PROFILES.join(', ')})`]);
  }
  const result = composePolicy({
    // SAFETY: shape guarded by the validation immediately above before this cast.
    profile: profile as LicenseProfile,
    spdx: options.spdx,
    spdxExceptions: options.spdxExceptions,
    jurisdiction: options.jurisdiction,
    overrides: options.overrides,
  });
  if (!result.ok || result.policy === undefined) {
    throw new LicenseComposeError(result.issues);
  }
  const policy = result.policy;
  const artifacts = generateArtifacts(policy);

  const reposellDir = path.join(cwd, '.reposell');
  await fs.mkdir(reposellDir, { recursive: true });
  const writes: Array<[string, string]> = [
    ['license.json', artifacts.licenseJson],
    ['ai-policy.json', artifacts.aiPolicyJson],
    ['commercial-policy.json', artifacts.commercialPolicyJson],
    ['authorization.json', artifacts.authorizationJson],
  ];
  for (const [name, content] of writes) {
    await fs.writeFile(path.join(reposellDir, name), content);
  }

  let licenseAppended = false;
  const licensePath = path.join(cwd, 'LICENSE');
  let existingLicense = '';
  try {
    existingLicense = await fs.readFile(licensePath, 'utf8');
  } catch {
    /* no LICENSE yet */
  }
  if (!existingLicense.includes('reposell:license-policy:v1')) {
    const separator = existingLicense.trim().length === 0 ? '' : '\n\n---\n\n';
    await fs.writeFile(licensePath, existingLicense + separator + artifacts.licenseSection);
    licenseAppended = true;
  }

  return {
    profile: policy.profile,
    spdx: policy.spdx,
    hash: policyHash(policy),
    written: writes.map(([name]) => `.reposell/${name}`),
    licenseAppended,
  };
}

export interface ExplainReport {
  found: boolean;
  path?: string;
  profile?: string;
  spdx?: string;
  hash?: string;
  human?: string;
  compatibilityNote?: string;
}

/** `reposell license explain` — the current policy in plain language. */
export async function explainLicense(
  cwd: string,
  config: { licensing?: { policy?: ComposeOptions } },
): Promise<ExplainReport> {
  const policy = await activePolicy(cwd, config);
  if (policy === undefined) return { found: false };
  const artifacts = generateArtifacts(policy);
  const note = compatibility(policy.spdx.split(' OR ')[0] ?? policy.spdx, policy.spdx);
  return {
    found: true,
    path: '.reposell/license.json',
    profile: policy.profile,
    spdx: policy.spdx,
    hash: policyHash(policy),
    human: artifacts.licenseSection,
    compatibilityNote: note,
  };
}

export interface ValidationIssue {
  file: string;
  issue: string;
}

/** `reposell license validate` — schema, completeness, cross-file coherence. */
export async function validateLicenseArtifacts(cwd: string): Promise<{ ok: boolean; issues: ValidationIssue[] }> {
  const issues: ValidationIssue[] = [];
  const read = async (file: string): Promise<Record<string, unknown> | undefined> => {
    try {
      // SAFETY: shape guarded by the validation immediately above before this cast.
      return JSON.parse(await fs.readFile(path.join(cwd, '.reposell', file), 'utf8')) as Record<string, unknown>;
    } catch {
      issues.push({ file: `.reposell/${file}`, issue: 'missing or unparseable' });
      return undefined;
    }
  };

  const licenseRaw = await read('license.json');
  if (licenseRaw !== undefined) {
    const parsed = parsePolicy(licenseRaw);
    for (const issue of parsed.issues) issues.push({ file: '.reposell/license.json', issue });
  }

  const aiRaw = await read('ai-policy.json');
  const commercialRaw = await read('commercial-policy.json');
  const authorizationRaw = await read('authorization.json');

  if (licenseRaw !== undefined && aiRaw !== undefined) {
    for (const key of Object.keys(aiRaw)) {
      if (key === 'schema') continue;
      if (!(key in licenseRaw)) {
        issues.push({ file: '.reposell/ai-policy.json', issue: `field "${key}" not present in license.json` });
      }
    }
  }
  if (licenseRaw !== undefined && commercialRaw !== undefined) {
    for (const key of Object.keys(commercialRaw)) {
      if (key === 'schema') continue;
      if (!(key in licenseRaw)) {
        issues.push({ file: '.reposell/commercial-policy.json', issue: `field "${key}" not present in license.json` });
      }
    }
  }
  if (licenseRaw !== undefined && authorizationRaw !== undefined) {
    for (const key of Object.keys(authorizationRaw)) {
      if (key === 'schema') continue;
      if (!(key in licenseRaw)) {
        issues.push({ file: '.reposell/authorization.json', issue: `field "${key}" not present in license.json` });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** `reposell license compatibility <dependencySpdx> [projectSpdx]`. */
export async function compatibilityCheck(
  dependencySpdx: string,
  projectSpdx?: string,
  config?: { licensing?: { policy?: ComposeOptions } },
): Promise<{ dependency: string; project: string; verdict: string }> {
  let project = projectSpdx;
  if (project === undefined) {
    const policy = await activePolicy(process.cwd(), config ?? {});
    project = policy?.spdx ?? 'UNKNOWN';
  }
  return {
    dependency: dependencySpdx,
    project,
    verdict: compatibility(dependencySpdx, project),
  };
}
