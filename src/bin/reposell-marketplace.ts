#!/usr/bin/env node
/**
 * reposell-marketplace — terminal client over the public /reposell/* protocol
 * (spec §48-49). Same endpoints as the web marketplace; no separate API.
 */

import {
  RemoteProtocolError,
  fetchHealth,
  fetchManifest,
  fetchReleasePaymentLink,
  fetchReleases,
  pagesUrl,
  searchRegistry,
} from '../app/marketplace-client.js';

const USAGE = [
  'usage: reposell-marketplace <command> [args]',
  '',
  '  search <query>            Search the repository registry (--registry URL or REPOSELL_REGISTRY_URL)',
  '  view <owner/repo>         Show product manifest + health',
  '  releases <owner/repo>     List the release catalog',
  '  buy <owner/repo@tag>      Resolve the verified Stripe Payment Link',
  '  help                      Show this help',
].join('\n');

interface ParsedInvocation {
  command: string | undefined;
  positional: string | undefined;
  flags: Record<string, string>;
}

function parse(argv: string[]): ParsedInvocation {
  const filtered = argv.filter((token) => token !== undefined);
  const command = filtered[0];
  const positional = filtered[1];
  const flags: Record<string, string> = {};
  let index = 2;
  while (index < filtered.length) {
    // SAFETY: index bounded by filtered.length in the loop condition.
    const token = filtered[index];
    if (token !== undefined && token.startsWith('--')) {
      const key = token.slice(2);
      const value = filtered[index + 1];
      if (value !== undefined && !value.startsWith('--')) {
        flags[key] = value;
        index += 2;
        continue;
      }
      flags[key] = 'true';
    }
    index += 1;
  }
  return { command, positional, flags };
}

function parseTarget(raw: string): { owner: string; repo: string; tag?: string; baseUrl?: string } {
  const [repoPart, tag] = raw.split('@');
  const segments = (repoPart ?? raw).split('/');
  if (segments.length !== 2 || segments[0] === '' || segments[1] === '') {
    throw new Error('expected target format: owner/repo[@tag]');
  }
  const owner: string = segments[0] ?? '';
  const repo: string = segments[1] ?? '';
  return {
    owner,
    repo,
    ...(tag !== undefined ? { tag } : {}),
  };
}

function money(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

async function main(): Promise<void> {
  const { command, positional, flags } = parse(process.argv.slice(2));
  try {
    switch (command) {
      case undefined:
      case 'help':
      case '--help': {
        console.log(USAGE);
        break;
      }
      case 'search': {
        const registryUrl = flags['registry'] ?? process.env['REPOSELL_REGISTRY_URL'];
        if (registryUrl === undefined) {
          console.error('✗ No registry configured. Pass --registry <url> or set REPOSELL_REGISTRY_URL.');
          process.exitCode = 1;
          break;
        }
        const results = await searchRegistry({ query: positional ?? '', registryUrl });
        if (results.length === 0) {
          console.log('No matches.');
          break;
        }
        for (const entry of results) {
          console.log(`${entry.repository}${entry.name !== undefined ? ` — ${entry.name}` : ''}`);
          if (entry.description !== undefined) console.log(`    ${entry.description}`);
        }
        break;
      }
      case 'view': {
        if (positional === undefined) throw new Error('usage: reposell-marketplace view <owner/repo>');
        const target = parseTarget(positional);
        const [manifest, health] = await Promise.all([
          fetchManifest(target),
          fetchHealth(target),
        ]);
        console.log(`${manifest.product.name} — ${manifest.repository.owner}/${manifest.repository.name}`);
        console.log(manifest.product.description);
        console.log('');
        console.log(`Health: ${health.status} · protocol v${manifest.protocol.version}`);
        console.log(`Sell: ${manifest.sell.enabled ? manifest.sell.url : 'disabled'} · Marketplace: ${manifest.marketplace.enabled ? manifest.marketplace.url : 'disabled'}`);
        console.log(`Releases: ${pagesUrl(target.owner, target.repo, target.baseUrl)}/reposell/releases/index.json`);
        break;
      }
      case 'releases': {
        if (positional === undefined) throw new Error('usage: reposell-marketplace releases <owner/repo>');
        const target = parseTarget(positional);
        const catalog = await fetchReleases(target);
        for (const entry of catalog.releases) {
          const icon = entry.status === 'available' && entry.health === 'healthy' ? '✓' : '✗';
          console.log(
            `${icon} ${entry.version}  ${money(entry.price, entry.currency)}  ${entry.status}/${entry.health}`,
          );
        }
        break;
      }
      case 'buy': {
        if (positional === undefined) throw new Error('usage: reposell-marketplace buy <owner/repo@tag>');
        const target = parseTarget(positional);
        if (target.tag === undefined) throw new Error('buy requires an explicit tag: owner/repo@v1.4.0');
        const catalog = await fetchReleases(target);
        const entry = catalog.releases.find((item) => item.version === target.tag);
        if (entry === undefined) throw new Error(`Release ${target.tag} not found in catalog`);
        if (entry.status !== 'available') throw new Error(`Release ${target.tag} is ${entry.status}; purchase blocked`);
        const link = await fetchReleasePaymentLink({ target, tag: target.tag });
        console.log(`✓ Verified release ${target.tag} at ${money(entry.price, entry.currency)}`);
        console.log(`Checkout: ${link}`);
        break;
      }
      default: {
        console.error(`unknown command: ${String(command)}`);
        console.log(USAGE);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    if (error instanceof RemoteProtocolError) {
      console.error(`✗ ${error.message}`);
    } else {
      console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exitCode = 1;
  }
}

void main();
