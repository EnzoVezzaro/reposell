/**
 * `reposell validate` — pre-flight publication gate check (spec §8, §25).
 * Exit code 1 when any gating release is BLOCKED; drafts in manual mode are
 * reported but do not fail CI.
 */

import { ConfigInvalidError, ConfigNotFoundError } from '../app/config-service.js';
import { evaluateRepository, type BuildOptions } from '../app/build-service.js';
import { formatEvaluations, gatingReleases } from './evaluation-format.js';

export interface ValidateResult {
  ok: boolean;
  report: string;
}

export async function validateCommand(cwd: string, options: BuildOptions = {}): Promise<ValidateResult> {
  try {
    const evaluation = await evaluateRepository(cwd, options);
    const gating = gatingReleases(evaluation.evaluations, evaluation.releaseMode);
    const blocked = gating.filter((item) => item.state === 'blocked');
    const report = [
      `RepoSell validate — ${evaluation.repositorySlug} (mode: ${evaluation.releaseMode})`,
      '',
      formatEvaluations(evaluation.evaluations),
      '',
      blocked.length === 0
        ? 'STATUS: READY — all gating releases pass the publication checklist'
        : 'STATUS: BLOCKED — ' +
          blocked.map((item) => item.tag).join(', ') +
          ' failed the publication checklist',
    ].join('\n');
    return { ok: blocked.length === 0, report };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
