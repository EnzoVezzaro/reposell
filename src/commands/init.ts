/**
 * `reposell init` — guided setup wizard.
 *
 * Interactive (TTY, or --wizard): walks through product name → license →
 * payment link → first release → signing secret, leaving the repo healthy.
 * Non-interactive (piped stdout, CI, or --yes): same file scaffolding with
 * zero-config defaults and no prompts.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { detectGitInfo } from '../utils/git.js';
import { loadEnvSource, resolveValue } from '../utils/env.js';
import { upsertEnvValue, ensureGitignored } from '../utils/project-env.js';
import {
  fetchPaymentLinkDetailsByUrl,
  type PaymentLinkDetails,
} from '../domain/payment/link-details.js';
import { LicenseService, type LicenseCheckResult } from '../app/license-service.js';
import { formatCheckResult, licenseCommand } from './license.js';
import { renderBanner } from '../cli/banner.js';
import { generateWorkflows } from '../workflows/ci.js';
import { generateSellSite } from '../workflows/sell.js';
import { launchStudio, STUDIO_URL } from '../workflows/studio.js';
import { createIdentity } from '../app/signing-service.js';
import { Prompter } from '../cli/prompts.js';
import { releaseCommand } from './release.js';
import { renderDefaultYml, writeConfig } from '../app/config-service.js';
import { stdin as input, stdout as output } from 'process';

export interface InitResult {
  banner: string;
  gitInfo: Awaited<ReturnType<typeof detectGitInfo>>;
  license: LicenseCheckResult | undefined;
  configCreated: boolean;
  workflowWritten: boolean;
  verificationKeyPath: string | undefined;
  signingKeySecret: string | undefined;
  /** Pre-rendered wizard transcript; overrides the default summary when set. */
  report?: string;
}

export interface InitOptions {
  /** Force non-interactive mode (--yes / CI). Defaults to TTY detection. */
  yes?: boolean;
  /** Force the wizard even without a TTY (piped input, scripted demos). */
  wizard?: boolean;
}

interface LicenseChoice {
  id: string;
  label: string;
  hint: string;
  argv: string[] | null;
  needsHolder: boolean;
}

const LICENSE_CHOICES: LicenseChoice[] = [
  {
    id: 'rsl',
    label: 'RepoSell License (RSL-1.0)',
    hint: 'recommended — buyers get clear terms, AI scraping stays controlled',
    argv: ['use', 'rsl'],
    needsHolder: true,
  },
  {
    id: 'permissive',
    label: 'Open permissive policy',
    hint: 'MIT-style: anyone can do almost anything',
    argv: ['compose', '--profile', 'open-permissive'],
    needsHolder: false,
  },
  {
    id: 'copyleft',
    label: 'Open copyleft policy',
    hint: 'GPL-style: derivatives must stay open',
    argv: ['compose', '--profile', 'open-copyleft'],
    needsHolder: false,
  },
  {
    id: 'commercial',
    label: 'Source-available commercial',
    hint: 'paid use only, no redistribution',
    argv: ['compose', '--profile', 'source-available-commercial'],
    needsHolder: false,
  },
  {
    id: 'skip',
    label: 'Skip for now',
    hint: 'releases will stay blocked until a license is configured',
    argv: null,
    needsHolder: false,
  },
];

async function configExists(configPath: string): Promise<boolean> {
  try {
    await fs.access(configPath);
    return true;
  } catch {
    return false;
  }
}

function gitUserName(): string | undefined {
  try {
    const name = execFileSync('git', ['config', '--get', 'user.name'], { encoding: 'utf-8' }).trim();
    return name.length > 0 ? name : undefined;
  } catch {
    return undefined;
  }
}

function hasGhCli(): boolean {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Workflow + signing identity scaffolding shared by both modes. */
async function scaffold(
  cwd: string,
): Promise<{ workflowWritten: boolean; verificationKeyPath?: string; signingKeySecret?: string }> {
  const workflow = await generateWorkflows(cwd);
  let verificationKeyPath: string | undefined;
  let signingKeySecret: string | undefined;
  try {
    const identity = await createIdentity();
    const keyDir = path.join(cwd, '.github', 'reposell');
    await fs.mkdir(keyDir, { recursive: true });
    verificationKeyPath = path.join(keyDir, 'verification-key.pem');
    await fs.writeFile(verificationKeyPath, identity.publicPem);
    signingKeySecret = identity.privateBase64;
  } catch {
    // Identity generation is best-effort at init time; `reposell keys generate` retries.
  }
  return { workflowWritten: workflow.written.length > 0, verificationKeyPath, signingKeySecret };
}

export async function initCommand(cwd: string, options: InitOptions = {}): Promise<InitResult> {
  const interactive =
    options.yes !== true && (options.wizard === true || (input.isTTY === true && output.isTTY === true));
  return interactive ? initWizard(cwd) : initPlain(cwd);
}

/* ------------------------------------------------------------------------ */
/* Non-interactive path                                                     */
/* ------------------------------------------------------------------------ */

async function initPlain(cwd: string): Promise<InitResult> {
  const gitInfo = await detectGitInfo(cwd, 'github');
  const configPath = path.join(cwd, 'reposell.yml');

  let configCreated = false;
  if (!(await configExists(configPath))) {
    await writeConfig(cwd, renderDefaultYml({ productName: gitInfo.repo }));
    configCreated = true;
  }

  const license = await new LicenseService(cwd).check();
  const { workflowWritten, verificationKeyPath, signingKeySecret } = await scaffold(cwd);

  return {
    banner: renderBanner('full'),
    gitInfo,
    license,
    configCreated,
    workflowWritten,
    verificationKeyPath,
    signingKeySecret,
  };
}

/* ------------------------------------------------------------------------ */
/* Wizard path                                                              */
/* ------------------------------------------------------------------------ */

async function initWizard(cwd: string): Promise<InitResult> {
  const banner = renderBanner('full');
  const gitInfo = await detectGitInfo(cwd, 'github');

  let productName = gitInfo.repo;
  let configCreated = false;
  let licenseProfileChosen: string | undefined;
  let paymentLink: string | undefined;
  let releaseTag: string | undefined;
  let secretStoredViaGh: boolean | undefined;
  const transcript: string[] = [];

  // One readline interface for the entire wizard: closing and reopening over
  // the same stdin discards buffered lines and strands later prompts on EOF.
  const prompter = new Prompter();
  let interrupted = false;
  let scaffolded = false;
  let workflowWritten = false;
  let verificationKeyPath: string | undefined;
  let signingKeySecret: string | undefined;
  let sellSiteFiles: string[] = [];
  let sellSiteLinked = false;

  try {
    output.write(`${banner}\n\n`);
    output.write('This wizard sets up everything needed to sell this repository.\n');
    output.write('Accept the defaults with Enter at any step.\n\n');

    // 0. product name + config
    productName = await prompter.ask('Product name', gitInfo.repo);
    const configPath = path.join(cwd, 'reposell.yml');
    if (!(await configExists(configPath))) {
      await writeConfig(cwd, renderDefaultYml({ productName }));
      configCreated = true;
    }
    transcript.push(
      configCreated ? '✓ Created reposell.yml' : '• reposell.yml already exists (left untouched)',
    );

    // 1. license — releases cannot resolve offers without one
    const licenseBefore = await new LicenseService(cwd).check();
    const needsLicense = licenseBefore.status === 'missing' || licenseBefore.status === 'unrecognized';
    if (!needsLicense) {
      transcript.push(formatCheckResult(licenseBefore));
    } else {
      const choice = await prompter.choose(
        '\nBuyers need license terms. Which policy fits this project?',
        LICENSE_CHOICES.map((c) => ({ label: c.label, hint: c.hint, value: c.id })),
      );
      const chosen = LICENSE_CHOICES.find((c) => c.id === choice)!;
      if (chosen.argv !== null) {
        licenseProfileChosen = chosen.id;
        let argv = [...chosen.argv];
        if (chosen.needsHolder) {
          const holder = await prompter.ask('License holder (your name/org)', gitUserName() ?? gitInfo.owner);
          argv = [...argv, '--holder', holder];
        }
        transcript.push(await licenseCommand(cwd, argv));
      }
    }

    // 2. payment link — price/currency are read from the link. Detection
    //    needs a Stripe secret key: use the configured one, or offer to save
    //    it now (persisted to .env, gitignored). Never asked when already
    //    configured or when no link is provided.
    const linkAnswer = await prompter.ask(
      '\nStripe Payment Link (create at dashboard.stripe.com/payment-links, leave blank to add later)',
    );
    let detected: PaymentLinkDetails | undefined;
    if (linkAnswer.length > 0) {
      if (!/^https:\/\/(buy|checkout)\.stripe\.com\//.test(linkAnswer)) {
        transcript.push(`! "${linkAnswer}" does not look like a Stripe Payment Link URL — skipped.`);
      } else {
        paymentLink = linkAnswer;
        transcript.push(`✓ Payment link recorded: ${paymentLink}`);

        const envSource = await loadEnvSource(cwd, process.env, async (filePath) => {
          try {
            return await fs.readFile(filePath, 'utf8');
          } catch {
            return undefined;
          }
        });
        let apiKey =
          resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(envSource, 'STRIPE_SECRET_KEY');

        if (apiKey === undefined || apiKey.startsWith('sk_') !== true) {
          const keyAnswer = await prompter.ask(
            '\nStripe secret key (sk_test_…) so the wizard can read your price from this link — saved locally to .env and never committed. Leave blank to type the price manually instead:',
          );
          const trimmed = keyAnswer.trim();
          if (trimmed.length > 0) {
            if (/^sk_(test|live)_/.test(trimmed)) {
              await upsertEnvValue(cwd, 'STRIPE_SECRET_KEY', trimmed);
              await ensureGitignored(cwd);
              apiKey = trimmed;
              transcript.push('✓ Saved STRIPE_SECRET_KEY to .env (gitignored — never committed)');
            } else {
              transcript.push(
                `! That does not look like a Stripe secret key (expected sk_test_…/sk_live_…) — continuing without it.`,
              );
            }
          }
        }

        if (apiKey !== undefined && apiKey.startsWith('sk_')) {
          transcript.push('  Reading price and currency from your Payment Link…');
          detected = await fetchPaymentLinkDetailsByUrl({ apiKey, linkUrl: paymentLink });
          if (detected !== undefined) {
            transcript.push(
              `✓ Detected ${detected.amount} ${detected.currency}${detected.recurring !== undefined ? ` (${detected.recurring.interval}ly)` : ''} from your Payment Link`,
            );
          } else {
            transcript.push(
              '! Could not read this Payment Link with that key (different account or mode?) — enter the price manually.',
            );
          }
        }
      }
    }

    // 3. first release
    if (paymentLink !== undefined && (await prompter.confirm('\nCreate first draft release v0.1.0?', true))) {
      releaseTag = await prompter.ask('Release tag', 'v0.1.0');
      let price = 10;
      let currency = 'USD';
      if (detected !== undefined) {
        price = detected.amount;
        currency = detected.currency;
        transcript.push(`✓ Using ${price} ${currency} from your Payment Link.`);
      } else {
        const priceAnswer = await prompter.ask('Price (USD)', '10');
        const parsed = Number(priceAnswer);
        if (Number.isFinite(parsed) && parsed > 0) price = parsed;
      }
      transcript.push(
        await releaseCommand(cwd, {
          tag: releaseTag,
          price,
          currency,
          link: paymentLink,
        }),
      );
    }

    // 4. CI workflow + signing identity
    const files = await scaffold(cwd);
    scaffolded = true;
    workflowWritten = files.workflowWritten;
    verificationKeyPath = files.verificationKeyPath;
    signingKeySecret = files.signingKeySecret;
    transcript.push(
      workflowWritten
        ? '✓ Generated .github/workflows/reposell.yml (validate → build → GitHub Pages)'
        : '• Workflow unchanged',
    );
    if (verificationKeyPath !== undefined) {
      transcript.push(`✓ Public verification key: ${path.relative(cwd, verificationKeyPath)} (safe to commit)`);
    }

    // 5. private key handling
    if (signingKeySecret !== undefined) {
      transcript.push('');
      transcript.push('PRIVATE KEY — shown once, never stored locally:');
      transcript.push(`  ${signingKeySecret}`);
      transcript.push('');
      if (hasGhCli()) {
        const store = await prompter.confirm(
          `Store it as GitHub secret REPOSELL_SIGNING_KEY on ${gitInfo.owner}/${gitInfo.repo} via gh now?`,
          true,
        );
        if (store) {
          try {
            execFileSync(
              'gh',
              ['secret', 'set', 'REPOSELL_SIGNING_KEY', '--repo', `${gitInfo.owner}/${gitInfo.repo}`],
              { input: signingKeySecret, stdio: ['pipe', 'ignore', 'pipe'] },
            );
            secretStoredViaGh = true;
            transcript.push('✓ Secret REPOSELL_SIGNING_KEY stored on GitHub.');
          } catch (error) {
            secretStoredViaGh = false;
            const message = error instanceof Error ? error.message : String(error);
            transcript.push(`! Could not store the secret automatically (${message.split('\n')[0]}).`);
            transcript.push('  Add it manually: repo Settings → Secrets and variables → Actions.');
          }
        }
      } else {
        transcript.push('Add it as the repository secret REPOSELL_SIGNING_KEY:');
        transcript.push('  gh secret set REPOSELL_SIGNING_KEY --body "<key above>"');
      }
    }

    // 6. /sell builder — scaffold an editable storefront wired to the link
    const sellSite = await generateSellSite(cwd, paymentLink === undefined ? { productName } : { productName, paymentLink });
    sellSiteFiles = sellSite.written;
    sellSiteLinked = sellSite.paymentLinkWired;
    if (sellSiteFiles.length > 0) {
      transcript.push(
        `✓ Built your /sell site${sellSiteLinked ? ' with your Stripe Payment Link' : ' (buy button disabled — no Stripe link yet)'}:`,
        ...sellSiteFiles.map((file) => `    ${file}`),
      );

      // 7. open the /sell builder so the user can start building immediately
      if (await prompter.confirm('\nOpen the /sell builder now?', true)) {
        transcript.push('  Starting the visual builder (first run downloads it)…');
        const studio = await launchStudio(cwd);
        if (studio.ready) {
          transcript.push(
            `✓ Builder running at ${STUDIO_URL} — opening in your browser.`,
            '  It keeps running in the background; close it with Ctrl+C in its terminal or:',
            `    kill $(lsof -ti :5199)`,
          );
        } else {
          transcript.push(
            `! Could not start the builder (${studio.detail ?? 'unknown error'}).`,
            '  Start it any time with: npx @reposell/storefront-studio',
          );
        }
      }
    }
  } catch (wizardError) {
    // stdin ended early or a step failed — finish scaffolding, tell the user.
    interrupted = true;
    const message = wizardError instanceof Error ? wizardError.message : String(wizardError);
    transcript.push(`! Wizard interrupted (${message.split('\n')[0]}) — finishing with defaults.`);
    const configPath = path.join(cwd, 'reposell.yml');
    if (!(await configExists(configPath))) {
      await writeConfig(cwd, renderDefaultYml({ productName }));
      configCreated = true;
    }
  } finally {
    prompter.close();
  }

  // If the wizard died before scaffolding, still leave the repo complete.
  if (!scaffolded) {
    const files = await scaffold(cwd);
    workflowWritten = files.workflowWritten;
    verificationKeyPath = files.verificationKeyPath;
    signingKeySecret = files.signingKeySecret;
    const sellSite = await generateSellSite(cwd, { productName });
    sellSiteFiles = sellSite.written;
    sellSiteLinked = sellSite.paymentLinkWired;
  }

  const licenseAfter = await new LicenseService(cwd).check();

  const result: InitResult = {
    banner,
    gitInfo,
    license: licenseAfter,
    configCreated,
    workflowWritten,
    verificationKeyPath,
    signingKeySecret,
  };

  result.report = [
    '',
    ...transcript,
    summarizeNextSteps(result, {
      paymentLink,
      releaseTag,
      secretStoredViaGh,
      sellSiteFiles,
      sellSiteLinked,
    }),
  ].join('\n');

  return result;
}

/* ------------------------------------------------------------------------ */
/* Output formatting                                                        */
/* ------------------------------------------------------------------------ */

interface WizardState {
  paymentLink?: string;
  releaseTag?: string;
  secretStoredViaGh?: boolean;
  sellSiteFiles?: string[];
  sellSiteLinked?: boolean;
}

/** Only list what is actually still missing. */
function summarizeNextSteps(result: InitResult, state: WizardState): string {
  const licensed = result.license !== undefined && result.license.status !== 'missing';
  const status = [
    state.releaseTag !== undefined ? `✓ First release ${state.releaseTag} recorded (draft)` : '○ No release yet',
    state.paymentLink !== undefined
      ? '✓ Stripe Payment Link configured'
      : '○ Stripe Payment Link missing — create one at dashboard.stripe.com/payment-links',
    state.sellSiteFiles !== undefined && state.sellSiteFiles.length > 0
      ? state.sellSiteLinked === true
        ? '✓ /sell site built with your Payment Link (sell/)'
        : '○ /sell site scaffolded (sell/) — buy button disabled until a link is wired'
      : null,
    licensed ? '✓ License terms configured' : '○ License missing',
    state.secretStoredViaGh === true
      ? '✓ Signing key stored as GitHub secret'
      : '○ Signing key not stored yet — see PRIVATE KEY above',
  ].filter((entry): entry is string => entry !== null);

  const pending: string[] = [];
  if (!licensed) pending.push('reposell license compose');
  if (!state.sellSiteLinked) {
    pending.push(
      'Create a Stripe Payment Link, then wire it in: reposell sell init --link https://buy.stripe.com/…',
    );
  }
  if (state.releaseTag === undefined) {
    pending.push(
      state.paymentLink !== undefined
        ? `reposell release v0.1.0 --price 10 --link ${state.paymentLink}`
        : 'reposell release v0.1.0 --price 10 --link https://buy.stripe.com/…',
    );
  }
  if (state.secretStoredViaGh !== true) pending.push('Store REPOSELL_SIGNING_KEY (see key above)');
  pending.push('reposell publish <tag>', 'git push — CI validates, signs, builds and deploys /reposell/*');

  return ['', 'Status:', ...status.map((entry) => `  ${entry}`), '', 'Next:', ...pending.map((step, index) => `${index + 1}. ${step}`)].join('\n');
}

export function formatInitResult(result: InitResult): string {
  if (result.report !== undefined) {
    return result.report;
  }
  const lines = [
    result.banner,
    `✓ Detected ${result.gitInfo.provider} repository: ${result.gitInfo.owner}/${result.gitInfo.repo}`,
    result.configCreated ? '✓ Created reposell.yml (zero-config defaults)' : '• reposell.yml already exists',
    result.workflowWritten ? '✓ Generated .github/workflows/reposell.yml (validate → build → GitHub Pages)' : '• Workflow unchanged',
  ];
  if (result.verificationKeyPath !== undefined && result.signingKeySecret !== undefined) {
    lines.push(
      `✓ Wrote public verification key to ${path.relative(process.cwd(), result.verificationKeyPath)} (safe to commit)`,
      '',
      'PRIVATE KEY — add as secret REPOSELL_SIGNING_KEY (shown once, never stored):',
      `  ${result.signingKeySecret}`,
      '',
      'Next:',
      '1. reposell license compose   ← buyers need license terms before releases pass gates',
      '2. Create a Stripe Payment Link for your release',
      '3. reposell release v0.1.0 --price 10 --link https://buy.stripe.com/…',
      '4. reposell publish v0.1.0',
      '5. git push — CI validates, signs, builds and deploys /reposell/*',
    );
  }
  if (result.license !== undefined) {
    lines.push(formatCheckResult(result.license));
  }
  return lines.join('\n');
}
