/**
 * Release state model (spec §9-10).
 *
 * DRAFT -> VALIDATING -> PUBLISHED | BLOCKED
 * PUBLISHED -> HEALTHY | UNHEALTHY (UNHEALTHY blocks purchase only for that release)
 *
 * Each release is evaluated independently: an unhealthy or blocked release
 * never invalidates another release.
 */

export type ReleaseState = 'draft' | 'validating' | 'published' | 'blocked';
export type HealthState = 'healthy' | 'unhealthy';

export interface ReleaseEvaluation {
  state: ReleaseState;
  health: HealthState;
  /** Purchasable = published && healthy. Blocked releases are never purchasable. */
  available: boolean;
}

export const DRAFT: ReleaseState = 'draft';
export const VALIDATING: ReleaseState = 'validating';
export const PUBLISHED: ReleaseState = 'published';
export const BLOCKED: ReleaseState = 'blocked';

const ALLOWED_TRANSITIONS: Record<ReleaseState, readonly ReleaseState[]> = {
  draft: ['validating'],
  validating: ['published', 'blocked'],
  published: ['validating', 'blocked'],
  blocked: ['validating', 'draft'],
};

export function canTransition(from: ReleaseState, to: ReleaseState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** A release is purchasable only when published and currently healthy. */
export function evaluateAvailability(state: ReleaseState, health: HealthState): boolean {
  return state === PUBLISHED && health === 'healthy';
}
