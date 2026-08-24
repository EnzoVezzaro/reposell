/**
 * Rights catalog — the complete reposell licensing vocabulary.
 *
 * Every right is a named field with a closed set of allowed values
 * (§1-§27 of the licensing specification). Configuration is declarative:
 * pick a profile, override any right, compose. Nothing is free-text
 * except the SPDX expression and jurisdiction.
 */

export const GRANT = [
  'granted',
  'granted-with-attribution',
  'granted-with-authorization',
  'denied',
] as const;

/** Every right the policy model understands, with its allowed values. */
export const RIGHTS = {
  // §1-2 source & access
  source_license: 'spdx-expression',
  source_access: ['public-source', 'source-visible-restricted', 'private'],

  // §4 right to use
  use_personal: GRANT,
  use_internal: GRANT,
  use_commercial: GRANT,
  use_saas: GRANT,
  use_government: GRANT,
  use_education: GRANT,

  // §5-6 distribution & commercial
  redistribution: GRANT,
  sublicensing: GRANT,
  redistribution_binary: GRANT,
  redistribution_source: GRANT,
  redistribution_modified: GRANT,
  fork_license: ['any', 'same-license', 'attribution', 'notice', 'authorization-required'],
  commercial_redistribution: GRANT,
  resale: GRANT,
  saas_monetization: GRANT,
  marketplace_redistribution: GRANT,
  per_release_commercial: ['yes', 'no'],

  // §7-8 modification & attribution
  modification: ['free', 'attribution', 'source-disclosure', 'same-license', 'internal-only', 'authorization-required', 'denied'],
  derivative_rights: GRANT,
  attribution: [
    'none',
    'copyright-notice',
    'license-notice',
    'attribution',
    'notice-file',
    'modified-files-marked',
    'author-identification',
  ],

  // §9-10 patent & trademark
  patent: ['none', 'grant', 'retaliation', 'termination-on-claim', 'separate'],
  trademark: ['included', 'excluded', 'name-allowed', 'name-restricted', 'logo-restricted', 'no-endorsement'],

  // §11-15 docs, data, binary, api, model
  documentation: ['same-as-source', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'proprietary', 'separate'],
  data: ['same-as-source', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'ODbL-1.0', 'custom', 'separate-policy'],
  binary: [
    'same-as-source',
    'binary-only-commercial',
    'redistribution-allowed',
    'redistribution-restricted',
    'per-release',
    'release-specific-terms',
  ],
  api: [
    'unrestricted',
    'with-attribution',
    'commercial-allowed',
    'commercial-restricted',
    'redistribution-prohibited',
    'mirroring-prohibited',
    'rate-restricted',
  ],
  model_weights: [
    'not-applicable',
    'open',
    'commercial',
    'non-commercial',
    'modification-allowed',
    'redistribution-allowed',
    'training-allowed',
    'training-prohibited',
    'derivatives-restricted',
    'authorization-required',
  ],

  // §3, §16 AI rights
  ai_training: [
    'allowed',
    'allowed-with-attribution',
    'allowed-non-commercial-ai',
    'allowed-with-authorization',
    'denied',
  ],
  ai_inference: GRANT,
  ai_agents: GRANT,
  ai_modification: GRANT,
  ai_derivatives: ['allowed', 'denied'],
  ai_policy: ['embedded', 'separate'],
  human_vs_ai: [
    'equal',
    'human-only',
    'human-allowed-ai-authorized',
    'training-separate-from-inference',
    'agents-separate-from-inference',
  ],

  // §17 identity / authorization
  authorization: [
    'anonymous',
    'account',
    'organization',
    'developer',
    'machine-agent',
    'cryptographic',
    'per-user',
    'per-release',
    'per-action',
  ],

  // §18 payment / commercial authorization
  payment: [
    'free',
    'pay-per-release',
    'subscription',
    'usage-based',
    'organization-license',
    'license-key',
    'stripe-backed',
    'offline-license',
    'online-verification',
  ],

  // §19 release-level licensing
  release_licensing: [
    'repository-wide',
    'per-release',
    'per-artifact',
    'per-binary',
    'changes-between-releases',
    'immutable-per-release',
    'release-specific-pricing',
  ],

  // §20 contributions
  contribution: ['none', 'dco', 'individual-cla', 'corporate-cla', 'copyright-assignment', 'license-grant', 'patent-grant'],

  // §21 dependencies
  dependencies: [
    'spdx-inventory',
    'compatibility-check',
    'copyleft-detection',
    'obligation-generation',
    'notice-generation',
    'sbom',
    'third-party-bundle',
    'incompatible-blocking',
  ],

  // §22 export / regulatory
  export: [
    'unrestricted',
    'export-control-metadata',
    'jurisdiction-restrictions',
    'cryptography-disclosure',
    'sanctions-restrictions',
    'sector-restrictions',
  ],

  // §23-24 warranty & termination
  warranty: ['as-is', 'no-warranty', 'no-liability', 'indemnification', 'commercial-warranty', 'support-separate'],
  termination: ['none', 'on-breach', 'automatic-reinstatement', 'permanent', 'patent-triggered', 'revocable-commercial'],

  // §25 compatibility
  compatibility: ['spdx-expression', 'and-or-with', 'matrix', 'dependency-validation'],
} as const;

export type RightName = keyof typeof RIGHTS;

export type RightValue = string;

/** Free-text fields that are not part of the closed vocabulary. */
export const FREE_FIELDS = ['source_license', 'jurisdiction', 'spdx_exceptions'] as const;

/** Validates a single right value against the catalog. */
export function isRightValue(name: RightName, value: string): boolean {
  // SAFETY: shape guarded by the validation immediately above before this cast.
  if ((FREE_FIELDS as readonly string[]).includes(name)) return true;
  const allowed = RIGHTS[name];
  if (allowed === 'spdx-expression') return true;
  // SAFETY: shape guarded by the validation immediately above before this cast.
  return (allowed as readonly string[]).includes(value);
}

export function rightNames(): RightName[] {
  // SAFETY: shape guarded by the validation immediately above before this cast.
  return Object.keys(RIGHTS) as RightName[];
}
