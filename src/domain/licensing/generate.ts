/**
 * License artifact generation (spec §30): one composed policy renders into
 * a human-readable LICENSE policy section plus four machine-readable files
 * under .reposell/. All output is deterministic given the same policy.
 */

import type { LicensePolicy } from './policy.js';
import { canonicalPolicyJson } from './policy.js';

export interface LicenseArtifacts {
  /** Human-readable policy section (appended to LICENSE by the caller). */
  licenseSection: string;
  licenseJson: string;
  aiPolicyJson: string;
  commercialPolicyJson: string;
  authorizationJson: string;
}

const AI_FIELDS = [
  'ai_training',
  'ai_inference',
  'ai_agents',
  'ai_modification',
  'ai_derivatives',
  'ai_policy',
  'human_vs_ai',
] as const;

const COMMERCIAL_FIELDS = [
  'use_commercial',
  'use_saas',
  'commercial_redistribution',
  'resale',
  'saas_monetization',
  'marketplace_redistribution',
  'per_release_commercial',
  'payment',
] as const;

const AUTHORIZATION_FIELDS = ['authorization', 'identity_placeholder'] as const;

function subset(policy: LicensePolicy, fields: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const value = (policy as unknown as Record<string, string>)[field];
    if (value !== undefined) out[field] = value;
  }
  return out;
}

function humanSummary(policy: LicensePolicy): string {
  const lines: string[] = [];
  const record = policy as unknown as Record<string, string>;
  const groups: Array<[string, readonly string[]]> = [
    ['Access', ['source_access', 'source_license']],
    ['Use', ['use_personal', 'use_internal', 'use_commercial', 'use_saas', 'use_government', 'use_education']],
    ['Distribution', ['redistribution', 'redistribution_binary', 'redistribution_source', 'redistribution_modified', 'sublicensing', 'fork_license']],
    ['Commercial', COMMERCIAL_FIELDS.slice(0, 7)],
    ['Modification', ['modification', 'derivative_rights']],
    ['Attribution', ['attribution']],
    ['Patents & Trademark', ['patent', 'trademark']],
    ['Docs / Data / Binary / API / Models', ['documentation', 'data', 'binary', 'api', 'model_weights']],
    ['AI Rights', AI_FIELDS],
    ['Authorization', ['authorization']],
    ['Payment', ['payment']],
    ['Releases', ['release_licensing']],
    ['Contributions', ['contribution']],
    ['Dependencies', ['dependencies']],
    ['Export', ['export']],
    ['Warranty & Termination', ['warranty', 'termination']],
  ];
  for (const [title, fields] of groups) {
    lines.push(`## ${title}`);
    for (const field of fields) {
      const value = record[field];
      if (value !== undefined) lines.push(`- ${field.replace(/_/g, ' ')}: **${value}**`);
    }
    lines.push('');
  }
  const jurisdiction = record['jurisdiction'];
  if (jurisdiction !== undefined) lines.push(`Jurisdiction: ${jurisdiction}`);
  return lines.join('\n');
}

export function generateArtifacts(policy: LicensePolicy): LicenseArtifacts {
  const canonical = canonicalPolicyJson(policy);
  const ai = { schema: 'reposell/ai-policy/v1', ...subset(policy, AI_FIELDS) };
  const commercial = { schema: 'reposell/commercial-policy/v1', ...subset(policy, COMMERCIAL_FIELDS) };
  const authorization = {
    schema: 'reposell/authorization/v1',
    ...subset(policy, AUTHORIZATION_FIELDS.slice(0, 1)),
  };

  const licenseSection = `<!-- reposell:license-policy:v1 (generated; do not edit by hand) -->
# License Policy

- Profile: \`${policy.profile}\`
- SPDX expression: \`${policy.spdx}\`
${policy.spdx_exceptions !== undefined ? `- SPDX exception: \`${policy.spdx_exceptions}\`\n` : ''}
${humanSummary(policy)}
<!-- reposell:canonical -->
${canonical}<!-- /reposell:canonical -->
`;

  return {
    licenseSection,
    licenseJson: canonical,
    aiPolicyJson: JSON.stringify(ai, null, 2) + '\n',
    commercialPolicyJson: JSON.stringify(commercial, null, 2) + '\n',
    authorizationJson: JSON.stringify(authorization, null, 2) + '\n',
  };
}
