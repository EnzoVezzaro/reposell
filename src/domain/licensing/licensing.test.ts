import { describe, expect, it } from 'vitest';

import {
  canonicalPolicyJson,
  composePolicy,
  parsePolicy,
  policyHash,
  PROFILE_DELTAS,
  PROFILES,
} from './policy.js';
import { rightNames } from './rights.js';
import { compatibility, parseSpdxExpression } from './compatibility.js';
import { generateArtifacts } from './generate.js';

describe('profiles', () => {
  it('exposes exactly the fifteen specified profiles', () => {
    expect(PROFILES).toHaveLength(15);
    expect(Object.keys(PROFILE_DELTAS)).toHaveLength(15);
  });

  it('every profile composes to a COMPLETE policy (no gaps)', () => {
    for (const profile of PROFILES) {
      const result = composePolicy({ profile });
      expect(result.ok, `${profile} failed: ${result.issues.join('; ')}`).toBe(true);
      const policy = result.policy;
      if (policy === undefined) throw new Error(`${profile} produced no policy`);
      for (const name of rightNames()) {
        expect(policy[name], `${profile} missing right "${name}"`).toBeDefined();
        expect(typeof policy[name]).toBe('string');
      }
    }
  });

  it('no-ai profiles deny every ai right; ai-authorized profiles gate them', () => {
    const denied = composePolicy({ profile: 'open-permissive-no-ai' }).policy;
    expect(denied?.ai_training).toBe('denied');
    expect(denied?.ai_agents).toBe('denied');
    expect(denied?.human_vs_ai).toBe('human-only');

    const gated = composePolicy({ profile: 'source-available-ai-authorized' }).policy;
    expect(gated?.ai_training).toBe('allowed-with-authorization');
    expect(gated?.ai_policy).toBe('separate');
    expect(gated?.source_access).toBe('source-visible-restricted');
  });

  it('research-only denies commercial use but keeps payment free', () => {
    const policy = composePolicy({ profile: 'research-only' }).policy;
    expect(policy?.use_commercial).toBe('denied');
    expect(policy?.use_education).toBe('granted');
    expect(policy?.payment).toBe('free');
  });
});

describe('composePolicy', () => {
  it('applies spdx and overrides; flags policy as custom when overridden', () => {
    const result = composePolicy({
      profile: 'open-permissive',
      spdx: 'MIT OR Apache-2.0',
      overrides: { ai_training: 'allowed-with-attribution', use_saas: 'denied' },
    });
    expect(result.ok).toBe(true);
    expect(result.policy?.spdx).toBe('MIT OR Apache-2.0');
    expect(result.policy?.ai_training).toBe('allowed-with-attribution');
    expect(result.policy?.use_saas).toBe('denied');
    expect(result.policy?.profile).toBe('custom');
    // untouched rights keep the preset values
    expect(result.policy?.use_personal).toBe('granted');
  });

  it('rejects unknown rights and invalid values with precise issues', () => {
    const bad = composePolicy({
      profile: 'open-permissive',
      overrides: { teleportation: 'granted', ai_training: 'sometimes' },
    });
    expect(bad.ok).toBe(false);
    expect(bad.issues).toContain('unknown right "teleportation"');
    expect(bad.issues).toContain('invalid value "sometimes" for right "ai_training"');
  });

  it('is deterministic: same inputs, byte-identical canonical json and hash', () => {
    const a = composePolicy({ profile: 'source-available-no-ai' }).policy;
    const b = composePolicy({ profile: 'source-available-no-ai' }).policy;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(canonicalPolicyJson(a as never)).toBe(canonicalPolicyJson(b as never));
    expect(policyHash(a as never)).toBe(policyHash(b as never));
    expect(policyHash(a as never)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('round-trips through parsePolicy', () => {
    const composed = composePolicy({ profile: 'open-copyleft' }).policy;
    expect(composed).toBeDefined();
    const parsed = parsePolicy(JSON.parse(canonicalPolicyJson(composed as never)));
    expect(parsed.ok).toBe(true);
    expect(parsed.policy?.profile).toBe('open-copyleft');
  });

  it('parsePolicy rejects incomplete or invalid documents', () => {
    expect(parsePolicy({ schema: 'wrong' }).ok).toBe(false);
    const composed = composePolicy({ profile: 'open-permissive' }).policy;
    const broken = JSON.parse(canonicalPolicyJson(composed as never));
    delete broken.ai_training;
    broken.use_personal = 'teleport';
    const result = parsePolicy(broken);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.includes('ai_training'))).toBe(true);
    expect(result.issues.some((issue) => issue.includes('use_personal'))).toBe(true);
  });
});

describe('spdx compatibility', () => {
  it('parses AND/OR/WITH expressions with parentheses', () => {
    expect(parseSpdxExpression('MIT OR Apache-2.0').ok).toBe(true);
    expect(parseSpdxExpression('(MIT AND CC-BY-4.0) WITH Classpath-exception-2.0').ok).toBe(true);
    expect(parseSpdxExpression('MIT AND').ok).toBe(false);
    expect(parseSpdxExpression('(MIT').ok).toBe(false);
    expect(parseSpdxExpression('').ok).toBe(false);
  });

  it('permissive dependencies fit anywhere copyleft or stronger', () => {
    expect(compatibility('MIT', 'GPL-3.0-only')).toBe('compatible');
    expect(compatibility('Apache-2.0', 'MIT')).toBe('compatible');
  });

  it('strong copyleft never fits permissive projects', () => {
    expect(compatibility('GPL-3.0-only', 'MIT')).toBe('incompatible');
    expect(compatibility('AGPL-3.0-or-later', 'Apache-2.0')).toBe('incompatible');
  });

  it('unknown licenses stay unknown — never guessed', () => {
    expect(compatibility('LicenseRef-mystery', 'MIT')).toBe('unknown');
  });
});

describe('generateArtifacts', () => {
  it('renders all four machine files plus a human section, deterministically', () => {
    const policy = composePolicy({
      profile: 'source-available-commercial',
      jurisdiction: 'EU',
    }).policy;
    expect(policy).toBeDefined();
    const a = generateArtifacts(policy as never);
    const b = generateArtifacts(policy as never);
    expect(a).toEqual(b);

    const ai = JSON.parse(a.aiPolicyJson) as Record<string, string>;
    expect(ai['schema']).toBe('reposell/ai-policy/v1');
    expect(ai['ai_training']).toBe('allowed'); // plain source-available is AI-neutral

    const commercial = JSON.parse(a.commercialPolicyJson) as Record<string, string>;
    expect(commercial['schema']).toBe('reposell/commercial-policy/v1');
    expect(commercial['payment']).toBe('stripe-backed');

    const authorization = JSON.parse(a.authorizationJson) as Record<string, string>;
    expect(authorization['schema']).toBe('reposell/authorization/v1');

    expect(a.licenseSection).toContain('reposell:license-policy:v1');
    expect(a.licenseSection).toContain('source-available-commercial');
    expect(a.licenseSection).toContain('Jurisdiction: EU');
  });
});
