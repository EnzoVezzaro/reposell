/**
 * `reposell release <tag>` — declare a release (spec §30).
 *
 * Collects price, currency and Stripe Payment Link (flags first, interactive
 * prompts as fallback), writes the definition into reposell.yml as a draft,
 * and immediately reports which publication gates still fail.
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
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
import type { ReleaseDefinition } from '../config/index.js';

export interface ReleaseArgs {
  tag: string;
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
  const filled = await promptForMissing({ ...args });

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
  let gateReport: string;
  try {
    const evaluation = await evaluateRepository(cwd, {});
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
