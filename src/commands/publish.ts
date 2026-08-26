/**
 * `reposell publish [tag]` — manual-mode publication approval (spec §32).
 *
 * Runs the full publication checklist; only a passing release is marked
 * `status: published` in reposell.yml. Committing that change and pushing
 * lets CI build + deploy the purchasable surface (§51: maintain via Git).
 *
 * Without a tag (TTY), the command picks a recorded release for you — or
 * walks through `reposell release` first when nothing is recorded yet.
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import {
  ConfigInvalidError,
  ConfigNotFoundError,
  setReleaseStatus,
  loadConfigFile,
} from '../app/config-service.js';
import { evaluateRepository, type BuildOptions } from '../app/build-service.js';
import { formatEvaluation } from './evaluation-format.js';
import { releaseCommand } from './release.js';
import { listingPublishCommand, ListingPublishError, formatListingPublish } from './listing-publish.js';
import { announceListing } from '../app/listing-announcer.js';

export interface PublishResult {
  ok: boolean;
  report: string;
}

/**
 * Pure ordering for publication candidates: drafts first (they are the ones
 * awaiting approval), everything else after, stable within each group.
 */
export function publishCandidates(tags: string[], isDraft: (tag: string) => boolean): string[] {
  const drafts = tags.filter((tag) => isDraft(tag));
  const rest = tags.filter((tag) => !isDraft(tag));
  return [...drafts, ...rest];
}

async function readRecordedTags(
  cwd: string,
): Promise<{ tags: string[]; statusOf: Map<string, 'draft' | 'published'> } | undefined> {
  try {
    const { config } = await loadConfigFile(cwd);
    const definitions = config.releases?.definitions ?? {};
    const entries = Object.keys(definitions);
    const statusOf = new Map(entries.map((tag) => [tag, definitions[tag]?.status ?? 'draft']));
    return { tags: entries, statusOf };
  } catch {
    return undefined;
  }
}

export async function publishCommand(
  cwd: string,
  tag?: string,
  options: BuildOptions = {},
): Promise<PublishResult> {
  try {
    let target = tag;

    if (target === undefined) {
      if (input.isTTY !== true) {
        return {
          ok: false,
          report: '✗ usage: reposell publish <tag>  (non-interactive runs need an explicit tag)',
        };
      }

      const rl = createInterface({ input, output });
      try {
        let recorded = await readRecordedTags(cwd);

        if (recorded === undefined || recorded.tags.length === 0) {
          console.log("No releases are configured yet — let's declare one first.");
          await releaseCommand(cwd, {});
          recorded = await readRecordedTags(cwd);
          if (recorded === undefined || recorded.tags.length === 0) {
            return { ok: false, report: '✗ Still no releases recorded — run `reposell release <tag>`.' };
          }
        }

        const ordered = publishCandidates(recorded.tags, (t) => recorded.statusOf.get(t) !== 'published');
        if (ordered.length === 1) {
          target = ordered[0];
          console.log(`✓ Publishing the recorded release: ${target}`);
        } else {
          console.log('Recorded releases:');
          ordered.forEach((entry, index) => {
            const status = recorded.statusOf.get(entry) ?? 'draft';
            console.log(`  ${index + 1}. ${entry} (${status})`);
          });
          for (;;) {
            const answer = await rl.question(`Publish which one? 1-${ordered.length} [1]: `);
            const trimmed = answer.trim();
            const index = trimmed.length === 0 ? 1 : Number(trimmed);
            if (Number.isInteger(index) && index >= 1 && index <= ordered.length) {
              target = ordered[index - 1];
              break;
            }
            if (ordered.includes(trimmed)) {
              target = trimmed;
              break;
            }
          }
        }
      } finally {
        rl.close();
      }
    }

    if (target === undefined) {
      return { ok: false, report: '✗ No release selected — nothing published.' };
    }

    const evaluation = await evaluateRepository(cwd, options);
    const mine = evaluation.evaluations.find((item) => item.tag === target);

    if (mine === undefined) {
      return {
        ok: false,
        report: `✗ Release "${target}" is not defined in reposell.yml. Declare it first with \`reposell release ${target}\`.`,
      };
    }

    if (!mine.gates.passed) {
      return {
        ok: false,
        report: [
          `BLOCKED — "${target}" failed the publication checklist (spec §8):`,
          formatEvaluation(mine),
          '',
          'Nothing was published. Fix the failures and re-run.',
        ].join('\n'),
      };
    }

    await setReleaseStatus({ cwd, tag: target, status: 'published' });

    let listingLines: string[] = [];
    // Listing opt-in (init): publication opens the Listing PR automatically —
    // the Git-native registry accepts stores only through pull requests.
    let listingEnabled = false;
    try {
      listingEnabled = (await loadConfigFile(cwd)).config.listing?.enabled === true;
    } catch {
      // No config → not listed.
    }
    if (listingEnabled) {
      try {
        const listingReport = await listingPublishCommand(cwd, { tag: target });
        const announcement = await announceListing(listingReport.payload);
        listingLines = formatListingPublish(listingReport).split('\n');
        listingLines = listingLines.filter((line) => !line.startsWith('! Open the Listing PR'));
        if (announcement.dispatched) {
          listingLines.push(
            `✓ Announced to the registry (${announcement.event}, ${announcement.id}) — applying now.`,
            '  Your store goes live on listing.reposell.dev within a minute.',
          );
        } else if (announcement.prUrl !== undefined) {
          listingLines.push(
            `✓ PR opened to the registry (${announcement.event}, ${announcement.id}):`,
            `  ${announcement.prUrl}`,
            '  Merging the PR lists your tool on listing.reposell.dev.',
          );
        } else {
          listingLines.push(
            `! Could not announce to the registry (${announcement.detail ?? 'unknown'}).`,
            `  Retry with \`reposell listing publish ${target}\` — your release stays published.`,
          );
        }
      } catch (error) {
        const detail =
          error instanceof ListingPublishError
            ? error.issues.join('; ')
            : error instanceof Error
              ? error.message.split('\n')[0]
              : String(error);
        listingLines = [
          '! Listing PR not opened (listing publish failed):',
          `    ${detail}`,
          '  Your release is published; retry with `reposell listing publish ' + target + '`.',
        ];
      }
    }

    return {
      ok: true,
      report: [
      `✓ Published ${target} with ${mine.gates.offers.length} offer(s): ${mine.gates.offers.map((o) => o.scheme).join(', ')}`,
      '  Payment link verified structurally' +
        (mine.offerDeepLinks.some((d) => d.outcome.kind === 'verified') ? ' and against Stripe price authority' : ''),
      ...(listingLines.length > 0 ? ['', ...listingLines] : []),
      '',
      'Next steps:',
      '  git add reposell.yml && git commit -m "reposell: publish ' + target + '" && git push',
      'CI will validate, sign, build /reposell/* and deploy your /sell page.',
    ].join('\n'),
    };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
