/**
 * License policy model (spec §28-30): a complete, machine-readable record
 * of every right a product grants, composed from a profile preset plus
 * explicit overrides, bound to an SPDX expression.
 *
 * Compose is total: every profile expands to a full policy (no gaps), so
 * consumers never need fallback logic. Output is canonical (sorted keys)
 * and hashed (sha256) for binding into signed release manifests.
 */

import { createHash } from 'crypto';
import { rightNames, isRightValue, type RightName } from './rights.js';

export const LICENSE_SCHEMA = 'reposell/license/v1';

export const PROFILES = [
  'open-permissive',
  'open-permissive-no-ai',
  'open-permissive-ai-authorized',
  'open-copyleft',
  'open-copyleft-no-ai',
  'open-copyleft-ai-authorized',
  'source-available',
  'source-available-commercial',
  'source-available-no-ai',
  'source-available-ai-authorized',
  'research-only',
  'non-commercial',
  'commercial-only',
  'proprietary',
  'custom',
] as const;

export type LicenseProfile = (typeof PROFILES)[number];

/** A complete policy: every right has exactly one value. */
export type LicensePolicy = Record<RightName, string> & {
  schema: typeof LICENSE_SCHEMA;
  profile: LicenseProfile;
  spdx: string;
  spdx_exceptions?: string;
  jurisdiction?: string;
};

type PolicyDelta = Partial<Record<RightName, string>> & {
  spdx?: string;
  spdx_exceptions?: string;
  jurisdiction?: string;
};

/** Baseline every profile starts from — the permissive open-source default. */
const BASE: PolicyDelta = {
  source_access: 'public-source',
  use_personal: 'granted',
  use_internal: 'granted',
  use_commercial: 'granted',
  use_saas: 'granted',
  use_government: 'granted',
  use_education: 'granted',
  redistribution: 'granted',
  sublicensing: 'granted',
  redistribution_binary: 'granted',
  redistribution_source: 'granted',
  redistribution_modified: 'granted',
  fork_license: 'any',
  commercial_redistribution: 'granted',
  resale: 'granted',
  saas_monetization: 'granted',
  marketplace_redistribution: 'granted',
  per_release_commercial: 'no',
  modification: 'free',
  derivative_rights: 'granted',
  attribution: 'copyright-notice',
  patent: 'grant',
  trademark: 'no-endorsement',
  documentation: 'same-as-source',
  data: 'same-as-source',
  binary: 'same-as-source',
  api: 'unrestricted',
  model_weights: 'not-applicable',
  ai_training: 'allowed',
  ai_inference: 'granted',
  ai_agents: 'granted',
  ai_modification: 'granted',
  ai_derivatives: 'allowed',
  ai_policy: 'embedded',
  human_vs_ai: 'equal',
  authorization: 'anonymous',
  payment: 'free',
  release_licensing: 'repository-wide',
  contribution: 'dco',
  dependencies: 'spdx-inventory',
  export: 'unrestricted',
  warranty: 'as-is',
  termination: 'on-breach',
  compatibility: 'spdx-expression',
  spdx: 'MIT',
};

const NO_AI: PolicyDelta = {
  ai_training: 'denied',
  ai_inference: 'denied',
  ai_agents: 'denied',
  ai_modification: 'denied',
  ai_derivatives: 'denied',
  human_vs_ai: 'human-only',
};

const AI_AUTHORIZED: PolicyDelta = {
  ai_training: 'allowed-with-authorization',
  ai_inference: 'granted-with-authorization',
  ai_agents: 'granted-with-authorization',
  ai_modification: 'granted-with-authorization',
  ai_policy: 'separate',
  human_vs_ai: 'human-allowed-ai-authorized',
};

const SOURCE_VISIBLE: PolicyDelta = {
  source_access: 'source-visible-restricted',
  redistribution: 'granted-with-authorization',
  sublicensing: 'denied',
  redistribution_binary: 'denied',
  redistribution_source: 'denied',
  redistribution_modified: 'denied',
  fork_license: 'authorization-required',
  commercial_redistribution: 'denied',
  resale: 'denied',
  marketplace_redistribution: 'denied',
  modification: 'authorization-required',
  payment: 'pay-per-release',
  release_licensing: 'immutable-per-release',
};

const COPYLEFT: PolicyDelta = {
  modification: 'same-license',
  fork_license: 'same-license',
  redistribution_modified: 'granted',
  attribution: 'license-notice',
  patent: 'retaliation',
  dependencies: 'copyleft-detection',
};

/** §29 — the fifteen reposell license profiles. */
export const PROFILE_DELTAS: Record<LicenseProfile, PolicyDelta> = {
  'open-permissive': {},
  'open-permissive-no-ai': { ...NO_AI },
  'open-permissive-ai-authorized': { ...AI_AUTHORIZED },
  'open-copyleft': { ...COPYLEFT, spdx: 'GPL-3.0' },
  'open-copyleft-no-ai': { ...COPYLEFT, ...NO_AI, spdx: 'GPL-3.0' },
  'open-copyleft-ai-authorized': { ...COPYLEFT, ...AI_AUTHORIZED, spdx: 'GPL-3.0' },
  'source-available': { ...SOURCE_VISIBLE, spdx: 'LicenseRef-reposell-RSL-1.0' },
  'source-available-commercial': {
    ...SOURCE_VISIBLE,
    use_commercial: 'granted',
    commercial_redistribution: 'granted-with-authorization',
    saas_monetization: 'granted',
    payment: 'stripe-backed',
    spdx: 'LicenseRef-reposell-RSL-1.0',
  },
  'source-available-no-ai': { ...SOURCE_VISIBLE, ...NO_AI, spdx: 'LicenseRef-reposell-RSL-1.0' },
  'source-available-ai-authorized': {
    ...SOURCE_VISIBLE,
    ...AI_AUTHORIZED,
    spdx: 'LicenseRef-reposell-RSL-1.0',
  },
  'research-only': {
    ...SOURCE_VISIBLE,
    use_personal: 'granted',
    use_internal: 'granted',
    use_education: 'granted',
    use_commercial: 'denied',
    use_saas: 'denied',
    use_government: 'denied',
    payment: 'free',
    spdx: 'LicenseRef-reposell-Research-Only',
  },
  'non-commercial': {
    use_commercial: 'denied',
    use_saas: 'denied',
    commercial_redistribution: 'denied',
    resale: 'denied',
    saas_monetization: 'denied',
    marketplace_redistribution: 'denied',
    payment: 'free',
    spdx: 'CC-BY-NC-4.0',
  },
  'commercial-only': {
    ...SOURCE_VISIBLE,
    source_access: 'private',
    use_personal: 'granted-with-authorization',
    use_internal: 'granted-with-authorization',
    payment: 'license-key',
    authorization: 'cryptographic',
    warranty: 'commercial-warranty',
    spdx: 'LicenseRef-reposell-Commercial',
  },
  proprietary: {
    ...SOURCE_VISIBLE,
    source_access: 'private',
    use_personal: 'granted-with-authorization',
    use_internal: 'granted-with-authorization',
    modification: 'denied',
    derivative_rights: 'denied',
    payment: 'organization-license',
    authorization: 'cryptographic',
    termination: 'revocable-commercial',
    spdx: 'LicenseRef-reposell-Proprietary',
  },
  custom: { spdx: 'LicenseRef-reposell-Custom' },
};

export interface ComposeResult {
  ok: boolean;
  policy?: LicensePolicy;
  issues: string[];
}

/**
 * Composes a complete policy from a profile plus overrides. Every override
 * value is checked against the rights catalog; unknown rights and unknown
 * values are rejected with precise issues.
 */
export function composePolicy(input: {
  profile: LicenseProfile;
  spdx?: string;
  spdxExceptions?: string;
  jurisdiction?: string;
  overrides?: Record<string, string>;
}): ComposeResult {
  const issues: string[] = [];
  const delta = PROFILE_DELTAS[input.profile];
  if (delta === undefined) {
    return { ok: false, issues: [`unknown profile "${input.profile}" (known: ${PROFILES.join(', ')})`] };
  }

  const merged: Record<string, string> = {};
  for (const name of rightNames()) {
    const baseValue = BASE[name];
    const profileValue = delta[name];
    const value = profileValue ?? baseValue;
    if (value !== undefined) merged[name] = value;
  }

  const spdx = input.spdx ?? delta.spdx ?? BASE.spdx ?? 'MIT';
  merged['source_license'] = spdx;
  merged['spdx'] = spdx;

  for (const [key, value] of Object.entries(input.overrides ?? {})) {
    if (!(key in merged) && !(key === 'jurisdiction' || key === 'spdx_exceptions')) {
      issues.push(`unknown right "${key}"`);
      continue;
    }
    if (!isRightValue(key as RightName, value)) {
      issues.push(`invalid value "${value}" for right "${key}"`);
      continue;
    }
    merged[key] = value;
  }
  if (input.spdxExceptions !== undefined) merged['spdx_exceptions'] = input.spdxExceptions;
  if (input.jurisdiction !== undefined) merged['jurisdiction'] = input.jurisdiction;

  // A policy with overrides that leave the preset shape is still labelled
  // with its profile; 'custom' is the explicit escape hatch.
  if (input.profile !== 'custom' && Object.keys(input.overrides ?? {}).length > 0) {
    merged['profile'] = 'custom';
  } else {
    merged['profile'] = input.profile;
  }

  if (issues.length > 0) return { ok: false, issues };

  const policy = { schema: LICENSE_SCHEMA, ...merged } as unknown as LicensePolicy;
  return { ok: true, policy, issues };
}

/** Deterministic JSON (sorted keys) — the canonical serialization. */
export function canonicalPolicyJson(policy: LicensePolicy): string {
  return JSON.stringify(policy, Object.keys(policy).sort(), 2) + '\n';
}

/** sha256 over the canonical serialization — bound into signed manifests. */
export function policyHash(policy: LicensePolicy): string {
  return createHash('sha256').update(canonicalPolicyJson(policy)).digest('hex');
}

/** Parses and fully validates an untrusted policy document. */
export function parsePolicy(input: unknown): { ok: boolean; policy?: LicensePolicy; issues: string[] } {
  const issues: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, issues: ['policy: expected JSON object'] };
  }
  // SAFETY: shape checked above.
  const raw = input as Record<string, unknown>;
  if (raw['schema'] !== LICENSE_SCHEMA) issues.push(`schema: expected "${LICENSE_SCHEMA}"`);

  const profile = raw['profile'];
  if (typeof profile !== 'string' || !(PROFILES as readonly string[]).includes(profile)) {
    issues.push(`profile: unknown "${String(profile)}"`);
  }

  for (const name of rightNames()) {
    const value = raw[name];
    if (value === undefined) {
      issues.push(`${name}: missing (policies must be complete)`);
      continue;
    }
    if (typeof value !== 'string') {
      issues.push(`${name}: expected string`);
      continue;
    }
    if (!isRightValue(name, value)) issues.push(`${name}: invalid value "${value}"`);
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, policy: input as LicensePolicy, issues };
}
