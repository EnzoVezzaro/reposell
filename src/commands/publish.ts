/**
 * `reposell publish <tag>` — manual-mode publication approval (spec §32).
 *
 * Runs the full publication checklist; only a passing release is marked
 * `status: published` in reposell.yml. Committing that change and pushing
 * lets CI build + deploy the purchasable surface (§51: maintain via Git).
 */

import { ConfigInvalidError, ConfigNotFoundError, setReleaseStatus } from '../app/config-service.js';
import { evaluateRepository, type BuildOptions } from '../app/build-service.js';
import { formatEvaluation } from './evaluation-format.js';

export interface PublishResult {
  ok: boolean;
  report: string;
}

export async function publishCommand(cwd: string, tag: string, options: BuildOptions = {}): Promise<PublishResult> {
  try {
    const evaluation = await evaluateRepository(cwd, options);
    const mine = evaluation.evaluations.find((item) => item.tag === tag);

    if (mine === undefined) {
      return {
        ok: false,
        report: `✗ Release "${tag}" is not defined in reposell.yml. Declare it first with \`reposell release ${tag}\`.`,
      };
    }

    if (!mine.gates.passed) {
      return {
        ok: false,
        report: [
          `BLOCKED — "${tag}" failed the publication checklist (spec §8):`,
          formatEvaluation(mine),
          '',
          'Nothing was published. Fix the failures and re-run.',
        ].join('\n'),
      };
    }

    await setReleaseStatus({ cwd, tag, status: 'published' });

    return {
      ok: true,
      report: [
      `✓ Published ${tag} with ${mine.gates.offers.length} offer(s): ${mine.gates.offers.map((o) => o.scheme).join(', ')}`,
      '  Payment link verified structurally' +
        (mine.offerDeepLinks.some((d) => d.outcome.kind === 'verified') ? ' and against Stripe price authority' : ''),
      '',
      'Next steps:',
      '  git add reposell.yml && git commit -m "reposell: publish ' + tag + '" && git push',
      'CI will validate, sign, build /reposell/* and deploy GitHub Pages.',
    ].join('\n'),
    };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
