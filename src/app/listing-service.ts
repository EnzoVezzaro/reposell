import { promises as fs } from 'fs';
import path from 'path';
import { detectGitInfo, type GitInfo } from '../utils/git.js';
import { LicenseService, type LicenseCheckResult } from './license-service.js';
import {
  StripePaymentProvider,
  StripeKeyMissingError,
  type PaymentAccountStatus,
  type BalanceStatus,
  type FetchLike,
} from '../domain/payment/stripe.js';
import { loadEnvSource, resolveValue, type EnvSource } from '../utils/env.js';

export interface ListingStatus {
  repository: GitInfo;
  license: LicenseCheckResult;
  reposellYmlPresent: boolean;
  licenseMode: 'rsl-1.0' | 'keep-existing' | undefined;
  payment: PaymentAccountStatus | { provider: 'stripe'; mode: 'unconfigured'; connected: false };
  balance?: BalanceStatus;
  sellEndpointEnabled: boolean;
}

export interface ListingStatusOptions {
  processEnv?: Record<string, string | undefined>;
  readFile?: (path: string) => Promise<string | undefined>;
  fetchImpl?: FetchLike;
}

export async function listingStatus(
  cwd: string,
  options: ListingStatusOptions = {},
): Promise<ListingStatus> {
  const readFile =
    options.readFile ??
    (async (file: string) => {
      try {
        return await fs.readFile(file, 'utf8');
      } catch {
        return undefined;
      }
    });

  const [repository, envSource] = await Promise.all([
    detectGitInfo(cwd, 'github'),
    loadEnvSource(cwd, options.processEnv ?? {}, readFile),
  ]);

  const licenseService = new LicenseService(cwd);
  const license = await licenseService.check();

  const ymlPath = path.join(cwd, 'reposell.yml');
  let ymlRaw: string | undefined;
  try {
    ymlRaw = await fs.readFile(ymlPath, 'utf8');
  } catch {
    ymlRaw = undefined;
  }

  const payment = await resolvePayment(envSource, options.fetchImpl);
  const balance = await resolveBalance(envSource, options.fetchImpl);

  return {
    repository,
    license,
    reposellYmlPresent: ymlRaw !== undefined,
    licenseMode: extractLicenseMode(ymlRaw),
    payment,
    balance,
    sellEndpointEnabled: ymlRaw !== undefined && /sell:\s*\n\s*enabled:\s*true/.test(ymlRaw),
  };
}

async function resolvePayment(
  envSource: EnvSource,
  doFetch?: ListingStatusOptions['fetchImpl'],
): Promise<ListingStatus['payment']> {
  const key = resolveValue(envSource, 'STRIPE_SECRET_KEY');
  if (key === undefined) {
    const override = resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY');
    if (override === undefined) return unconfigured();
  }
  try {
    const provider = StripePaymentProvider.fromEnv(
      {
        STRIPE_SECRET_KEY: key,
        REPOSELL_STRIPE_SECRET_KEY: resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY'),
      },
      doFetch,
    );
    return await provider.verifyAccount();
  } catch (error) {
    if (error instanceof StripeKeyMissingError || error instanceof Error) {
      return unconfigured();
    }
    throw error;
  }
}

async function resolveBalance(
  envSource: EnvSource,
  doFetch?: ListingStatusOptions['fetchImpl'],
): Promise<BalanceStatus | undefined> {
  const key = resolveValue(envSource, 'STRIPE_SECRET_KEY') ?? resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY');
  if (key === undefined || !key.startsWith('sk_')) return undefined;
  try {
    const provider = StripePaymentProvider.fromEnv(
      {
        STRIPE_SECRET_KEY: key,
        REPOSELL_STRIPE_SECRET_KEY: resolveValue(envSource, 'REPOSELL_STRIPE_SECRET_KEY'),
      },
      doFetch,
    );
    return await provider.checkBalanceStatus();
  } catch {
    return undefined;
  }
}

function unconfigured(): ListingStatus['payment'] {
  return { provider: 'stripe', mode: 'unconfigured', connected: false };
}

function extractLicenseMode(yml: string | undefined): ListingStatus['licenseMode'] {
  if (yml === undefined) return undefined;
  const match = /^\s*mode:\s*(rsl-1\.0|keep-existing)\s*$/m.exec(yml);
  if (match?.[1] === 'rsl-1.0') return 'rsl-1.0';
  if (match?.[1] === 'keep-existing') return 'keep-existing';
  return undefined;
}
