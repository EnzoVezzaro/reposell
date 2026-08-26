/**
 * reposell.yml file IO: load, validate, create defaults, mutate single fields
 * while preserving user comments (via the yaml Document model).
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Document, parse, stringify } from 'yaml';
import {
  CONFIG_VERSION,
  sortedTags,
  validateConfig,
  type ReleaseDefinition,
  type ReposellYml,
} from '../config/index.js';

export class ConfigNotFoundError extends Error {
  readonly code = 'CONFIG_NOT_FOUND';
  constructor() {
    super('reposell.yml not found. Run `reposell init` first.');
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigInvalidError extends Error {
  readonly code = 'CONFIG_INVALID';
  readonly issues: string[];
  constructor(issues: string[]) {
    super('reposell.yml is invalid:\n' + issues.map((issue) => `  - ${issue}`).join('\n'));
    this.name = 'ConfigInvalidError';
    this.issues = issues;
  }
}

export interface LoadedConfig {
  config: ReposellYml;
  raw: string;
}

export async function loadConfigFile(cwd: string): Promise<LoadedConfig> {
  const ymlPath = path.join(cwd, 'reposell.yml');
  let raw: string;
  try {
    raw = await fs.readFile(ymlPath, 'utf8');
  } catch {
    throw new ConfigNotFoundError();
  }
  const { config, issues } = parseConfigText(raw);
  if (issues.length > 0) throw new ConfigInvalidError(issues);
  return { config, raw };
}

export function parseConfigText(raw: string): { config: ReposellYml; issues: string[] } {
  let value: unknown;
  try {
    value = raw.trim().length === 0 ? {} : parse(raw);
  } catch (error) {
    return { config: {}, issues: [`YAML syntax error: ${error instanceof Error ? error.message : String(error)}`] };
  }
  return validateConfig(value);
}

export async function configExists(cwd: string): Promise<boolean> {
  try {
    await fs.access(path.join(cwd, 'reposell.yml'));
    return true;
  } catch {
    return false;
  }
}

export function renderDefaultYml(input: { productName: string; description?: string }): string {
  const body: ReposellYml = {
    version: CONFIG_VERSION,
    product: {
      name: input.productName,
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    licensing: {
      schemes: { standard: { name: 'Standard', billing: 'one-time', template: 'rsl-1.0' } },
    },
    releases: { mode: 'manual', definitions: {} },
    sell: { enabled: true },
    marketplace: { enabled: false },
  };
  return stringify(body, { sortMapEntries: false });
}

export async function writeConfig(cwd: string, content: string): Promise<void> {
  await fs.writeFile(path.join(cwd, 'reposell.yml'), content);
}

async function loadDocument(cwd: string): Promise<{ ymlPath: string; doc: Document }> {
  const ymlPath = path.join(cwd, 'reposell.yml');
  const raw = await fs.readFile(ymlPath, 'utf8');
  return { ymlPath, doc: parseDocumentPreserving(raw) };
}

function parseDocumentPreserving(raw: string): Document {
  // SAFETY: parseDocument never throws for malformed YAML; errors land on
  // doc.errors and setIn below would fail loudly on such docs.
  return new Document(parse(raw));
}

/**
 * Sets one field inside releases.definitions.<tag> and writes the file back.
 * Comments in untouched parts of the document survive round-tripping.
 */
export async function updateReleaseDefinition(input: {
  cwd: string;
  tag: string;
  definition: ReleaseDefinition;
}): Promise<void> {
  const { ymlPath, doc } = await loadDocument(input.cwd);
  doc.setIn(['releases', 'definitions', input.tag], orderedDefinition(input.definition));
  await fs.writeFile(ymlPath, doc.toString());
}

/**
 * Persists the discovery-listing opt-in from the init wizard. Comments in
 * untouched parts of the document survive round-tripping.
 */
export async function updateListingOptIn(input: {
  cwd: string;
  enabled: boolean;
  contribution?: { amount: number; currency: string };
}): Promise<void> {
  const { ymlPath, doc } = await loadDocument(input.cwd);
  doc.setIn(['listing', 'enabled'], input.enabled);
  if (input.contribution !== undefined) {
    doc.setIn(['listing', 'contribution', 'amount'], input.contribution.amount);
    doc.setIn(['listing', 'contribution', 'currency'], input.contribution.currency);
  }
  await fs.writeFile(ymlPath, doc.toString());
}

/** Marks a release published/draft without touching its commercial fields. */
export async function setReleaseStatus(input: {
  cwd: string;
  tag: string;
  status: 'draft' | 'published';
}): Promise<void> {
  const { ymlPath, doc } = await loadDocument(input.cwd);
  doc.setIn(['releases', 'definitions', input.tag, 'status'], input.status);
  await fs.writeFile(ymlPath, doc.toString());
}

export function orderedDefinition(definition: ReleaseDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (definition.status !== undefined) out['status'] = definition.status;
  if (definition.offers !== undefined && definition.offers.length > 0) {
    out['offers'] = definition.offers.map((offer) => ({
      ...(offer.scheme !== undefined ? { scheme: offer.scheme } : {}),
      ...(offer.pricing !== undefined
        ? {
            pricing: {
              ...(offer.pricing.amount !== undefined ? { amount: offer.pricing.amount } : {}),
              ...(offer.pricing.currency !== undefined ? { currency: offer.pricing.currency } : {}),
            },
          }
        : {}),
      ...(offer.payment !== undefined
        ? {
            payment: {
              ...(offer.payment.provider !== undefined ? { provider: offer.payment.provider } : {}),
              ...(offer.payment.payment_link !== undefined
                ? { payment_link: offer.payment.payment_link }
                : {}),
              ...(offer.payment.payment_link_id !== undefined
                ? { payment_link_id: offer.payment.payment_link_id }
                : {}),
            },
          }
        : {}),
    }));
  }
  return out;
}

export { sortedTags };
