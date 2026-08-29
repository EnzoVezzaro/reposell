/**
 * `reposell balance` — Shows Stripe account balance and payout status.
 * Helps diagnose why payments aren't settling (negative balance, pending payouts, etc.)
 */

import {
  StripePaymentProvider,
  StripeKeyMissingError,
  type BalanceStatus,
  type StripePayout,
} from '../domain/payment/stripe.js';
import { loadEnvSource, resolveValue, type EnvSource } from '../utils/env.js';

export interface BalanceResult {
  ok: boolean;
  report: string;
  status?: BalanceStatus;
}

function formatCurrency(amount: number, currency: string): string {
  const formatted = (amount / 100).toFixed(2);
  return `${currency.toUpperCase()} ${formatted}`;
}

function formatPayout(payout: StripePayout): string {
  const date = new Date(payout.arrival_date * 1000).toLocaleDateString();
  const statusIcon = {
    paid: '✓',
    pending: '⏳',
    in_transit: '🔄',
    canceled: '✗',
    failed: '✗',
  }[payout.status];

  return `  ${statusIcon} ${formatCurrency(payout.amount, payout.currency)} — ${payout.status} (arrives ${date})${payout.failure_message !== undefined ? ` — ${payout.failure_message}` : ''}`;
}

export async function balanceCommand(cwd: string): Promise<BalanceResult> {
  const env = await loadEnvSource(cwd, process.env, async (filePath) => {
    try {
      const { readFile } = await import('node:fs/promises');
      return await readFile(filePath, 'utf8');
    } catch {
      return undefined;
    }
  });

  const key = resolveValue(env, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(env, 'STRIPE_SECRET_KEY');
  if (key === undefined || !key.startsWith('sk_')) {
    return {
      ok: false,
      report: 'Stripe secret key not found. Set REPOSELL_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in .env or environment.',
    };
  }

  try {
    const provider = new StripePaymentProvider(key);
    const status = await provider.checkBalanceStatus();

    const lines: string[] = [];
    lines.push('┌─ Stripe Balance & Payout Status ─────────────────────────');

    // Show available balance
    const usdAvailable = status.balance.available.find((b) => b.currency === 'usd');
    const usdPending = status.balance.pending.find((b) => b.currency === 'usd');
    const usdReserved = status.balance.connect_reserved.find((b) => b.currency === 'usd');

    lines.push(`│ Available: ${usdAvailable !== undefined ? formatCurrency(usdAvailable.amount, 'usd') : 'N/A'}`);
    lines.push(`│ Pending:   ${usdPending !== undefined ? formatCurrency(usdPending.amount, 'usd') : 'N/A'}`);
    if (usdReserved !== undefined && usdReserved.amount > 0) {
      lines.push(`│ Reserved:  ${formatCurrency(usdReserved.amount, 'usd')}`);
    }
    lines.push(`│ Payouts:   ${status.payoutsEnabled ? '✓ enabled' : '✗ DISABLED'}`);

    // Show recent payouts
    if (status.recentPayouts.length > 0) {
      lines.push('│');
      lines.push('│ Recent Payouts:');
      for (const payout of status.recentPayouts.slice(0, 5)) {
        lines.push(formatPayout(payout));
      }
    }

    // Show issues
    if (status.issues.length > 0) {
      lines.push('│');
      lines.push('│ ⚠ Issues:');
      for (const issue of status.issues) {
        lines.push(`│   ${issue}`);
      }
    }

    lines.push('└──────────────────────────────────────────────────────────');

    // Add guidance if there are issues
    if (status.issues.length > 0) {
      lines.push('');
      lines.push('To fix settlement issues:');
      lines.push('1. Enable payouts: Stripe Dashboard → Settings → Payouts → Enable');
      lines.push('2. Connect bank account: Stripe Dashboard → Settings → Bank accounts');
      lines.push('3. Check payout schedule: Stripe Dashboard → Settings → Payouts → Schedule');
      lines.push('');
      lines.push('For new Stripe accounts, payouts may be delayed 7-14 days for verification.');
    }

    return {
      ok: status.issues.length === 0,
      report: lines.join('\n'),
      status,
    };
  } catch (error) {
    if (error instanceof StripeKeyMissingError) {
      return { ok: false, report: error.message };
    }
    return {
      ok: false,
      report: `Error checking balance: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
