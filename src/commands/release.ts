/**
 * `reposell release <tag>` — declare a release (spec §30).
 *
 * Collects price, currency and Stripe Payment Link (flags first, interactive
 * prompts as fallback), writes the definition into reposell.yml as a draft,
 * and immediately reports which publication gates still fail.
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'node:path';
import {
  configExists,
  renderDefaultYml,
  updateReleaseDefinition,
  writeConfig,
  ConfigInvalidError,
  loadConfigFile,
} from '../app/config-service.js';
import { evaluateRepository } from '../app/build-service.js';
import { formatEvaluation } from './evaluation-format.js';
import { detectGitInfo } from '../utils/git.js';
import { loadEnvSource, resolveValue } from '../utils/env.js';
import { fetchPaymentLinkDetailsByUrl } from '../domain/payment/link-details.js';
import type { ReleaseDefinition } from '../config/index.js';

export interface ReleaseArgs {
  /** Optional — omitted triggers the interactive GitHub-release picker. */
  tag?: string;
  price?: number;
  currency?: string;
  link?: string;
  linkId?: string;
}

export class ReleaseCommandError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReleaseCommandError';
    this.code = code;
  }
}

/** Pure arg -> definition mapping; prompts happen only when values missing. */
export function definitionFromValues(values: {
  price?: number;
  currency?: string;
  link?: string;
  linkId?: string;
}): ReleaseDefinition {
  return {
    status: 'draft',
    offers: [
      {
        scheme: 'standard',
        pricing: {
          ...(values.price !== undefined ? { amount: values.price } : {}),
          ...(values.currency !== undefined ? { currency: values.currency.toUpperCase() } : {}),
        },
        payment: {
          provider: 'stripe',
          ...(values.link !== undefined ? { payment_link: values.link } : {}),
          ...(values.linkId !== undefined ? { payment_link_id: values.linkId } : {}),
        },
      },
    ],
  };
}

function parsePrice(raw: string): number | undefined {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** `0.1.0` → `v0.1.0` — repo tags and reposell records share one form. */
export function normalizeTag(tag: string): string {
  return /^v/i.test(tag) ? tag : `v${tag}`;
}

function hasGhCli(): boolean {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

interface RepoRelease {
  tagName: string;
  isDraft: boolean;
}

function listRepoReleases(git: { owner: string; repo: string }): RepoRelease[] | undefined {
  if (!hasGhCli()) return undefined;
  try {
    const raw = execFileSync(
      'gh',
      ['release', 'list', '--repo', `${git.owner}/${git.repo}`, '--limit', '30', '--json', 'tagName,isDraft'],
      { encoding: 'utf-8' },
    );
    // SAFETY: gh emits the requested JSON array; entries are narrowed below.
    const parsed = JSON.parse(raw) as Array<{ tagName?: unknown; isDraft?: unknown }>;
    return parsed.flatMap((entry) =>
      typeof entry.tagName === 'string'
        ? [{ tagName: entry.tagName, isDraft: entry.isDraft === true }]
        : [],
    );
  } catch {
    return undefined;
  }
}

/**
 * Interactive picker over the repository's own GitHub releases. Creates a
 * release on demand when none exists. Returns a normalized tag, or
 * undefined when the user aborts.
 */
async function selectReleaseFromRepo(
  git: { owner: string; repo: string },
  rl: ReturnType<typeof createInterface>,
): Promise<string | undefined> {
  if (!hasGhCli()) {
    const answer = await rl.question('gh CLI not found — enter the GitHub release tag to attach (e.g. v0.1.0): ');
    return answer.trim().length > 0 ? normalizeTag(answer.trim()) : undefined;
  }

  const releases = listRepoReleases(git);
  if (releases === undefined) {
    const answer = await rl.question(`Enter the GitHub release tag to attach (${git.owner}/${git.repo}): `);
    return answer.trim().length > 0 ? normalizeTag(answer.trim()) : undefined;
  }

  if (releases.length === 0) {
    const create = await rl.question(
      `No GitHub releases found on ${git.owner}/${git.repo}. Create one now? [Y/n]: `,
    );
    if (/^n/i.test(create.trim())) return undefined;
    const tag = await rl.question('New release tag (e.g. v0.1.0): ');
    if (tag.trim().length === 0) return undefined;
    const normalized = normalizeTag(tag.trim());
    execFileSync('gh', ['release', 'create', normalized, '--generate-notes', '--repo', `${git.owner}/${git.repo}`], {
      stdio: 'inherit',
    });
    return normalized;
  }

  console.log(`Releases on ${git.owner}/${git.repo}:`);
  releases.forEach((release, index) => {
    console.log(`  ${index + 1}. ${release.tagName}${release.isDraft ? ' (draft)' : ''}`);
  });
  for (;;) {
    const answer = await rl.question(`Choose 1-${releases.length} [1]: `);
    const trimmed = answer.trim();
    if (trimmed.length === 0) return normalizeTag(releases[0]?.tagName ?? 'v0.1.0');
    const index = Number(trimmed);
    if (Number.isInteger(index) && index >= 1 && index <= releases.length) {
      return normalizeTag(releases[index - 1]?.tagName ?? 'v0.1.0');
    }
    // Also accept a raw tag typed directly.
    if (trimmed.startsWith('v') || /^\d/.test(trimmed)) return normalizeTag(trimmed);
  }
}

async function promptForMissing(args: ReleaseArgs): Promise<ReleaseArgs> {
  const needsPrompt = args.price === undefined || args.currency === undefined || args.link === undefined;
  if (!needsPrompt || input.isTTY !== true) return args;

  const rl = createInterface({ input, output });
  try {
    if (args.price === undefined) {
      const answer = await rl.question(`Release ${args.tag}\nPrice (USD): `);
      const parsed = parsePrice(answer.trim());
      if (parsed !== undefined) args.price = parsed;
    }
    if (args.currency === undefined) {
      const answer = await rl.question('Currency [USD]: ');
      const trimmed = answer.trim();
      if (trimmed.length > 0) args.currency = trimmed.toUpperCase();
      else args.currency = 'USD';
    }
    if (args.link === undefined) {
      const answer = await rl.question('Stripe Payment Link: ');
      const trimmed = answer.trim();
      if (trimmed.length > 0) args.link = trimmed;
    }
  } finally {
    rl.close();
  }
  return args;
}

export async function releaseCommand(cwd: string, args: ReleaseArgs): Promise<string> {
  // A tag already recorded (e.g. by the init wizard) carries its pricing —
  // reuse it instead of asking again. Flags still override.
  const filled = { ...args };
  let reused = false;
  let config: Awaited<ReturnType<typeof loadConfigFile>>['config'] | undefined;
  try {
    const loaded = await loadConfigFile(cwd);
    config = loaded.config;
    const existing = filled.tag !== undefined
      ? loaded.config.releases?.definitions?.[normalizeTag(filled.tag)]
      : undefined;
    const offer = existing?.offers?.[0];
    if (offer !== undefined) {
      if (filled.price === undefined && offer.pricing?.amount !== undefined) {
        filled.price = offer.pricing.amount;
        reused = true;
      }
      if (filled.currency === undefined && offer.pricing?.currency !== undefined) {
        filled.currency = offer.pricing.currency;
        reused = true;
      }
      if (filled.link === undefined && offer.payment?.payment_link !== undefined) {
        filled.link = offer.payment.payment_link;
        reused = true;
      }
    }
  } catch {
    // No config yet — first declaration proceeds through the prompts.
  }

  // Interactive tag selection over the repository's own GitHub releases —
  // `reposell release` attaches to a release that exists on the repo.
  if (filled.tag === undefined) {
    if (input.isTTY !== true) {
      throw new ReleaseCommandError('TAG_REQUIRED', 'usage: reposell release <tag> [--price N] [--link URL]');
    }
    const git = await detectGitInfo(cwd, 'github');
    const rl = createInterface({ input, output });
    let selected: string | undefined;
    try {
      selected = await selectReleaseFromRepo(git, rl);
    } finally {
      rl.close();
    }
    if (selected === undefined) {
      return 'Release cancelled — nothing recorded. Run `reposell release <tag>` when ready.';
    }
    filled.tag = selected;

    // The chosen repo release may already be recorded under its normalized
    // tag — re-run the reuse pass against it before prompting.
    try {
      const loaded = config ?? (await loadConfigFile(cwd)).config;
      const offer = loaded.releases?.definitions?.[selected]?.offers?.[0];
      if (offer !== undefined) {
        if (filled.price === undefined && offer.pricing?.amount !== undefined) {
          filled.price = offer.pricing.amount;
          reused = true;
        }
        if (filled.currency === undefined && offer.pricing?.currency !== undefined) {
          filled.currency = offer.pricing.currency;
          reused = true;
        }
        if (filled.link === undefined && offer.payment?.payment_link !== undefined) {
          filled.link = offer.payment.payment_link;
          reused = true;
        }
      }
    } catch {
      // ignore — prompts/detection handle the rest
    }
  }
  filled.tag = normalizeTag(filled.tag);

  const envSource = await loadEnvSource(cwd, process.env, async (filePath) => {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return undefined;
    }
  });

  // Never re-ask what init already collected: with a Stripe key present
  // (env or .env), read price/currency straight from the recorded link.
  if (
    (filled.price === undefined || filled.currency === undefined || filled.link === undefined) &&
    config !== undefined
  ) {
    const priorLink =
      filled.link ??
      Object.values(config.releases?.definitions ?? {})
        .flatMap((definition) => definition.offers ?? [])
        .map((offer) => offer.payment?.payment_link)
        .find((link): link is string => typeof link === 'string' && link.length > 0) ??
      // Fallback: payment link saved by `reposell sell init --link`.
      await (async () => {
        try {
          const content = await fs.readFile(path.join(cwd, '.reposell', 'payment-link'), 'utf8');
          return content.trim() || undefined;
        } catch {
          return undefined;
        }
      })();
    if (priorLink !== undefined) {
      // Always carry the link forward, even if Stripe key is unavailable.
      if (filled.link === undefined) filled.link = priorLink;
      try {
        const apiKey =
          resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(envSource, 'STRIPE_SECRET_KEY');
        if (apiKey !== undefined && apiKey.startsWith('sk_')) {
          const details = await fetchPaymentLinkDetailsByUrl({ apiKey, linkUrl: priorLink });
          if (details !== undefined) {
            if (filled.price === undefined) filled.price = details.amount;
            if (filled.currency === undefined) filled.currency = details.currency;
            console.log(`✓ Read ${details.amount} ${details.currency} from your Payment Link.`);
          }
        }
      } catch {
        // Detection is best-effort; prompts remain as the fallback.
      }
    }
  }

  await promptForMissing(filled);
  if (reused && input.isTTY === true) {
    console.log(`✓ Reusing recorded pricing for ${filled.tag} — no prompts needed.`);
  }

  if (!(await configExists(cwd))) {
    await writeConfig(cwd, renderDefaultYml({ productName: cwd.split('/').pop() ?? 'product' }));
  }

  const definition = definitionFromValues({
    price: filled.price,
    currency: filled.currency ?? 'USD',
    link: filled.link,
    linkId: filled.linkId,
  });

  await updateReleaseDefinition({ cwd, tag: filled.tag, definition });

  // Re-evaluate to tell the developer exactly what still blocks publication.
  // The merged environment (process + .env) lets local runs see keys saved
  // by init — e.g. REPOSELL_SIGNING_KEY — so gates report truthfully.
  let gateReport: string;
  try {
    const evaluation = await evaluateRepository(cwd, { ...envSource.envFileValues, ...process.env });
    const mine = evaluation.evaluations.find((item) => item.tag === filled.tag);
    gateReport = mine === undefined ? '' : `\n${formatEvaluation(mine)}`;
  } catch (error) {
    if (error instanceof ConfigInvalidError) gateReport = `\n✗ ${error.message}`;
    else throw error;
  }

  return [
    `✓ Recorded release ${filled.tag} in reposell.yml (status: draft)`,
    `  Offer standard: ${definition.offers?.[0]?.pricing?.amount ?? '?'} ${definition.offers?.[0]?.pricing?.currency ?? '?'}`,
    `  Payment link: ${definition.offers?.[0]?.payment?.payment_link ?? '— missing —'}`,
    gateReport,
    '',
    'Next: `reposell publish ' + filled.tag + '` once the gates pass.',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Loads an existing definition (used by publish). */
export async function loadReleaseDefinition(cwd: string, tag: string): Promise<ReleaseDefinition | undefined> {
  const { config } = await loadConfigFile(cwd);
  return config.releases?.definitions?.[tag];
}
