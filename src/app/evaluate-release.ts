/**
 * Single source of truth for turning a configured release into protocol
 * state: publication gates (§8), optional per-offer deep Stripe
 * verification (§35), and health checks (§11-12). Pure given injected
 * inputs — no filesystem, no network — so CLI, build, and tests share one
 * evaluator.
 */

import type { LicensingScheme, ReleaseDefinition, ReleaseMode, ReleaseStatus } from '../config/index.js';
import {
  buildHealthDoc,
  type HealthChecks,
  type HealthDoc,
} from '../domain/protocol/documents.js';
import { parseVersion } from '../domain/release/version.js';
import { BLOCKED, DRAFT, PUBLISHED, evaluateAvailability, type ReleaseState } from '../domain/release/state.js';
import { runPublicationGates, type GateOutcome } from './validation-service.js';

export type DeepLinkOutcome =
  | { kind: 'not-configured' }
  | { kind: 'verified' }
  | { kind: 'failed'; detail: string }
  | { kind: 'unavailable'; detail: string };

/** Deep verification result for one offer, keyed by scheme id. */
export interface OfferDeepLink {
  scheme: string;
  outcome: DeepLinkOutcome;
}

export interface ReleaseEvaluationInput {
  tag: string;
  definition: ReleaseDefinition;
  releaseMode: ReleaseMode;
  licenseMode: 'ok' | 'missing' | 'unrecognized';
  schemes?: Record<string, LicensingScheme>;
  /** Deep Stripe verification per offer (index-aligned with resolved offers). */
  offerDeepLinks?: OfferDeepLink[];
  /** Result of verifying an existing build's signature.json, when checked. */
  integrity?: 'unsigned' | 'valid' | 'failed';
}

export interface ReleaseEvaluation {
  tag: string;
  definition: ReleaseDefinition;
  persistedStatus: ReleaseStatus | undefined;
  gates: GateOutcome;
  offerDeepLinks: OfferDeepLink[];
  checks: HealthChecks;
  health: 'healthy' | 'unhealthy';
  healthDoc: HealthDoc;
  state: ReleaseState;
  available: boolean;
  warnings: string[];
  repositorySlug: string;
}

export function evaluateRelease(input: ReleaseEvaluationInput): ReleaseEvaluation {
  const gates = runPublicationGates({
    tag: input.tag,
    definition: input.definition,
    licenseMode: input.licenseMode,
    ...(input.schemes !== undefined ? { schemes: input.schemes } : {}),
  });

  const warnings = [...gates.warnings];
  const offerDeepLinks = input.offerDeepLinks ?? [];

  const versionValid = parseVersion(input.tag) !== undefined;

  // Deep price-authority results feed the pricing check (spec §35): any
  // failed offer fails the release; unavailable ones warn only.
  let pricingFailed = false;
  for (const deep of offerDeepLinks) {
    if (deep.outcome.kind === 'failed') {
      pricingFailed = true;
      warnings.push(`Stripe price authority mismatch (${deep.scheme}): ${deep.outcome.detail}`);
    } else if (deep.outcome.kind === 'unavailable') {
      warnings.push(`Stripe deep verification unavailable (${deep.scheme}): ${deep.outcome.detail}`);
    } else if (deep.outcome.kind === 'not-configured') {
      warnings.push(`Stripe deep verification not configured (${deep.scheme}); structural link checks only`);
    }
  }

  const integrityFailed = input.integrity === 'failed';
  if (input.integrity === 'unsigned') {
    warnings.push('build is unsigned (no REPOSELL_SIGNING_KEY); integrity cannot be proven');
  }

  const checks: HealthChecks = {
    manifest: 'valid',
    release: versionValid ? 'valid' : 'failed',
    payment: gates.passed ? 'valid' : 'failed',
    pricing: !pricingFailed && gates.passed ? 'valid' : 'failed',
    license: input.licenseMode === 'missing' ? 'failed' : 'valid',
    integrity: integrityFailed ? 'failed' : 'valid',
  };

  const health = Object.values(checks).every((status) => status === 'valid') ? 'healthy' : 'unhealthy';

  // Automatic mode approves every gated release at CI/build time (§31);
  // manual mode requires explicit `reposell publish` approval (§32).
  const autoApproved = input.releaseMode === 'automatic' && gates.passed;
  const persistedPublished = input.definition.status === 'published';
  const state: ReleaseState =
    gates.passed && (persistedPublished || autoApproved) ? PUBLISHED : gates.passed ? DRAFT : BLOCKED;

  return {
    tag: input.tag,
    definition: input.definition,
    persistedStatus: input.definition.status,
    gates,
    offerDeepLinks,
    checks,
    health,
    healthDoc: buildHealthDoc({
      repositorySlug: '',
      release: input.tag,
      checks,
    }),
    state,
    available: evaluateAvailability(state, health),
    warnings,
    repositorySlug: '',
  };
}
