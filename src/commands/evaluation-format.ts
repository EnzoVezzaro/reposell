/**
 * Shared terminal rendering for release evaluations (validate / health /
 * publish output). Deterministic text; explains every failure (spec §52).
 */

import type { ReleaseEvaluation } from '../app/evaluate-release.js';

export function formatEvaluation(evaluation: ReleaseEvaluation): string {
  const lines: string[] = [];
  const icon =
    evaluation.state === 'published' && evaluation.health === 'healthy'
      ? '✓'
      : evaluation.state === 'draft'
        ? '•'
        : '✗';
  const stateLabel = `${evaluation.state}${evaluation.health === 'unhealthy' ? ' · unhealthy' : ''}`;
  lines.push(`${icon} ${evaluation.tag} — ${stateLabel}`);
  for (const failure of evaluation.gates.failures) {
    lines.push(`    ✗ ${failure}`);
  }
  for (const warning of evaluation.warnings) {
    lines.push(`    ⚠ ${warning}`);
  }
  return lines.join('\n');
}

export function formatEvaluations(evaluations: ReleaseEvaluation[]): string {
  if (evaluations.length === 0) return 'No releases configured. Add one with `reposell release <tag>`.';
  return evaluations.map(formatEvaluation).join('\n');
}

/** Releases whose publication state matters for CI validation. */
export function gatingReleases(
  evaluations: ReleaseEvaluation[],
  releaseMode: 'manual' | 'automatic',
): ReleaseEvaluation[] {
  return evaluations.filter((evaluation) =>
    releaseMode === 'automatic' ? true : evaluation.persistedStatus === 'published',
  );
}
