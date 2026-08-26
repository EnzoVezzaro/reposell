#!/usr/bin/env node
import { createRequire } from 'module';
import path from 'node:path';
import fs from 'node:fs/promises';
import { detectGitInfo } from '../utils/git.js';
import { generateSellSite } from '../workflows/sell.js';
import { initCommand, formatInitResult } from '../commands/init.js';
import { licenseCommand } from '../commands/license.js';
import { auditCommand } from '../commands/audit.js';
import { listingPublishCommand, formatListingPublish, ListingPublishError } from '../commands/listing-publish.js';
import { sellSyncCommand } from '../commands/sell-sync.js';
import { reciprocityCommand } from '../commands/reciprocity.js';
import { listingCommand } from '../commands/listing.js';
import { validateCommand } from '../commands/validate.js';
import { buildCommand } from '../commands/build.js';
import { healthCommand } from '../commands/health.js';
import { releaseCommand, type ReleaseArgs } from '../commands/release.js';
import { publishCommand } from '../commands/publish.js';
import { loadConfigFile } from '../app/config-service.js';
import { verifyCommand } from '../commands/verify.js';
import { keysCommand } from '../commands/keys.js';
import { createPaymentLink } from '../commands/sell-create-link.js';
import { renderBanner } from '../cli/banner.js';

// SAFETY: dist/bin/reposell.js sits two levels below the package root.
const require = createRequire(import.meta.url);
// SAFETY: shape guarded by the validation immediately above before this cast.
const { version } = require('../../package.json') as { version: string };

const USAGE = [
  'usage: reposell <command> [args]',
  '',
  '  init [--yes] [--wizard]     Guided setup wizard (license, payment, release,\n                              signing key); --yes skips prompts (CI)',
  '  license check               Detect and explain the repository license',
  '  license use rsl             Generate RSL-1.0 LICENSE + ai-policy with your info',
  '  license keep                Keep your existing license',
  '  license compose             Compose a rights policy: --profile --spdx --set right=value',
  '  license explain             Plain-language summary of the active policy',
  '  license validate            Validate .reposell/* license artifacts',
  '  license compatibility       SPDX dependency compatibility: <dep> [project]',
  '  audit                       Full licensing/compliance audit (PASS/WARN/BLOCKED)',
  '  listing status              Dashboard: repo, license, /sell endpoint, payments',
  '  listing publish <tag>       Build + verify a Listing publication PR payload',
  '  sell init [--link URL] [--name NAME]\n' +
  '                              Scaffold the /sell storefront (HTML template wired\n' +
  '                              to your Stripe Payment Link)\n' +
  '  sell create-link --price N [--currency USD]\n' +
  '                              Create a Stripe Payment Link with correct redirect\n' +
  '                              (returns buyers to /sell with session ID for forking)\n' +
  '  sell sync [payment_link_id] Pull-based fulfillment: purchases, refunds, fork artifacts',
  '  reciprocity [--revenue N]   Show/validate/simulate the Reciprocity Program',
  '  release [tag] [--price N] [--currency USD] [--link URL]\n' +
  '                              Attach to a GitHub release (interactive picker when\n' +
  '                              omitted); flags override recorded pricing',
  '                              Declare a release (interactive when flags omitted)',
  '  publish [tag]               Approve publication after gates pass (picks a\n' +
  '                              recorded release when omitted)',
  '  validate                    Run the full publication gate checklist',
  '  build [--out dist]          Generate the /reposell/* static surface',
  '  health                      Health report for every configured release',
  '  verify <manifest|trust|pricing URL>',
  '                              CI verification entry points',
  '  keys <generate|show>        Ed25519 signing identity management',
  '  help                        Show this help',
].join('\n');

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string> = {};
  let index = 0;
  while (index < argv.length) {
    const token = argv[index];
    if (token !== undefined && token.startsWith('--')) {
      const key = token.slice(2);
      const value = argv[index + 1];
      if (value !== undefined && !value.startsWith('--')) {
        flags[key] = value;
        index += 2;
      } else {
        flags[key] = 'true';
        index += 1;
      }
    } else if (token !== undefined) {
      positionals.push(token);
      index += 1;
    } else {
      index += 1;
    }
  }
  return { positionals, flags };
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const cwd = process.cwd();
  const { positionals, flags } = parseArgs(rest);

  try {
    switch (command) {
      case undefined:
      case 'help':
      case '--help':
      case '-h': {
        console.log(renderBanner('full'));
        console.log(USAGE);
        break;
      }
      case '--version':
      case '-v':
      case 'version': {
        console.log(version);
        break;
      }
      case 'init': {
        console.log(
          formatInitResult(
            await initCommand(cwd, { yes: flags['yes'] === 'true', wizard: flags['wizard'] === 'true' }),
          ),
        );
        break;
      }
      case 'license': {
        console.log(await licenseCommand(cwd, rest));
        break;
      }
      case 'audit': {
        console.log(await auditCommand(cwd, rest));
        break;
      }
      case 'reciprocity': {
        console.log(await reciprocityCommand(cwd, rest));
        break;
      }
      case 'sell': {
        if (rest[0] === 'sync') {
          const report = await sellSyncCommand(cwd, {
            paymentLinkId: rest[1] !== undefined && !rest[1].startsWith('--') ? rest[1] : undefined,
          });
          console.log([
            `✓ sell sync complete — ${report.purchased} purchase(s), ${report.refunded} refund(s), ${report.alreadyEntitled} already entitled`,
            ...report.written.map((file) => `  ${file}`),
          ].join('\n'));
          break;
        }
        if (rest[0] === 'init') {
          const name = flags['name'];
          const link = flags['link'];
          let productName = name;
          if (productName === undefined || productName.length === 0) {
            try {
              productName = (await detectGitInfo(cwd, 'github')).repo;
            } catch {
              productName = 'My Project';
            }
          }
          const report = await generateSellSite(cwd, {
            productName,
            ...(link !== undefined ? { paymentLink: link } : {}),
          });

          // Persist the payment link so `reposell release` can pick it up
          // without the user re-typing it.
          if (link !== undefined && link.length > 0) {
            const linkFile = path.join(cwd, '.reposell', 'payment-link');
            await fs.mkdir(path.dirname(linkFile), { recursive: true });
            await fs.writeFile(linkFile, `${link}\n`);
          }

          console.log([
            report.written.length > 0
              ? `✓ /sell site ready${report.paymentLinkWired ? ' — Stripe Payment Link wired into every buy CTA' : ''}`
              : '• sell/ and .reposell/storefront.json already exist (left untouched)',
            ...report.written.map((file) => `  ${file}`),
            '',
            'Open sell/index.html to customize, or edit .reposell/storefront.json in the Studio.',
          ].join('\n'));
          break;
        }
        if (rest[0] === 'create-link') {
          const price = Number(flags['price'] ?? flags['amount']);
          if (!Number.isFinite(price) || price <= 0) {
            console.error('Usage: reposell sell create-link --price <amount> [--currency USD] [--name "Product Name"] [--success-url URL]');
            process.exitCode = 1;
            break;
          }
          const result = await createPaymentLink(cwd, {
            productName: flags['name'],
            price,
            currency: flags['currency'],
            successUrl: flags['success-url'],
          });
          console.log([
            '✓ Payment Link created successfully!',
            '',
            `  Link URL:   ${result.url}`,
            `  Link ID:    ${result.id}`,
            `  Active:     ${result.active}`,
            `  Redirect:   ${result.successUrl}`,
            '',
            'Next steps:',
            '1. Copy the Link URL into your reposell.yml:',
            `     payment_link: ${result.url}`,
            '2. Or wire it into your /sell page:',
            `     reposell sell init --link ${result.url}`,
            '3. Or record it for a release:',
            `     reposell release v0.1.0 --price ${price} --link ${result.url}`,
            '',
            'The link automatically redirects buyers back to your /sell page',
            'with their session ID so they can fork after payment.',
          ].join('\n'));
          break;
        }
        console.log('usage: reposell sell <init|sync|create-link> [--link URL] [--price N] [payment_link_id]');
        break;
      }
      case 'listing': {
        if (rest[0] === 'publish') {
          try {
            const publishFlags = rest.slice(1);
            const getFlag = (name: string): string | undefined => {
              const index = publishFlags.indexOf(name);
              return index === -1 ? undefined : publishFlags[index + 1];
            };
            const report = await listingPublishCommand(cwd, {
              tag: publishFlags[0] ?? '',
              sellUrl: getFlag('--sell-url'),
              discoveryAmount: getFlag('--discovery-amount') === undefined ? undefined : Number(getFlag('--discovery-amount')),
              discoveryCurrency: getFlag('--discovery-currency'),
              skipVerify: publishFlags.includes('--skip-verify'),
            });
            console.log(formatListingPublish(report));
          } catch (error) {
            if (error instanceof ListingPublishError) {
              console.log(['✗ Listing publication blocked:', ...error.issues.map((issue) => `  - ${issue}`)].join('\n'));
            } else throw error;
          }
          break;
        }
        console.log(await listingCommand(cwd, rest));
        break;
      }
      case 'validate': {
        const result = await validateCommand(cwd, { env: process.env });
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      case 'build': {
        const out = flags['out'];
        const result = await buildCommand(cwd, { env: process.env, ...(out !== undefined ? { outDir: out } : {}) });
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      case 'health': {
        const result = await healthCommand(cwd, { env: process.env });
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      case 'release': {
        const tag = positionals[0];
        // No tag → interactive picker over the repository's GitHub releases.
        const releaseArgs: ReleaseArgs = {
          ...(tag !== undefined ? { tag } : {}),
          ...(flags['price'] !== undefined ? { price: Number(flags['price']) } : {}),
          ...(flags['currency'] !== undefined ? { currency: flags['currency'] } : {}),
          ...(flags['link'] !== undefined ? { link: flags['link'] } : {}),
          ...(flags['link-id'] !== undefined ? { linkId: flags['link-id'] } : {}),
        };
        console.log(await releaseCommand(cwd, releaseArgs));
        break;
      }
      case 'publish': {
        const tag = positionals[0];
        // No tag → interactive selection over recorded releases (or a
        // guided `reposell release` walkthrough when none exist).
        const result = await publishCommand(cwd, tag, { env: process.env });
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      case 'verify': {
        const [target, argument] = positionals;
        const result = await verifyCommand(cwd, target, argument, { env: process.env });
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      case 'keys': {
        const result = await keysCommand(cwd, positionals[0]);
        console.log(result.report);
        if (!result.ok) process.exitCode = 1;
        break;
      }
      default: {
        console.error(`unknown command: ${String(command)}`);
        console.log(USAGE);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
