import { listingStatus, type ListingStatus } from '../app/listing-service.js';
import { StripeKeyMissingError, type PaymentAccountStatus } from '../domain/payment/stripe.js';

export function formatPaymentStatus(payment: ListingStatus['payment']): string {
  if (payment.mode === 'unconfigured') {
    return [
      '💳 Payments: not configured',
      '    Set STRIPE_SECRET_KEY=sk_test_… in your environment or a local .env file.',
      '    Local tooling only — CI and checkout never need it; never commit the key.',
    ].join('\n');
  }
  // SAFETY: narrowing above guarantees only the two union shapes reach here.
  const account = payment as PaymentAccountStatus;
  return [
    `💳 Payments: Stripe (${account.mode} mode)`,
    `    Account: ${account.businessName ?? account.accountId ?? 'connected'}${account.country ? ' · ' + account.country : ''}`,
    `    Charges: ${account.chargesEnabled ? '✓ enabled' : '✗ disabled'} · Payouts: ${account.payoutsEnabled ? '✓ enabled' : '✗ disabled'}`,
    account.mode === 'live' ? '    ⚠ Live mode — real money. Double-check your pricing policy.' : '',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

export function formatListingStatus(status: ListingStatus): string {
  const licenseLine =
    status.license.status === 'ok'
      ? `✓ License: ${status.license.spdx}`
      : status.license.status === 'rsl'
        ? `✓ License: ${status.license.spdx} (RepoSell)`
        : `⚠ License: ${status.license.status}`;
  return [
    '┌─ reposell dashboard ─────────────────────',
    `│ Repository: ${status.repository.owner}/${status.repository.repo} (${status.repository.provider})`,
    `│ ${licenseLine}`,
    `│ reposell.yml: ${status.reposellYmlPresent ? '✓ present' : '— missing (run reposell init)'}${status.licenseMode !== undefined ? ` · license mode: ${status.licenseMode}` : ''}`,
    `│ /sell endpoint: ${status.sellEndpointEnabled ? '✓ enabled' : '— not enabled'}`,
    formatPaymentStatus(status.payment),
    '└──────────────────────────────────────────',
  ].join('\n');
}

export async function listingCommand(cwd: string, argv: string[]): Promise<string> {
  const [subcommand] = argv;
  if (subcommand !== 'status') {
    return 'usage: reposell listing <status> [--with-account]';
  }
  try {
    const status = await listingStatus(cwd, { processEnv: process.env });
    return formatListingStatus(status);
  } catch (error) {
    if (error instanceof StripeKeyMissingError) return error.message;
    throw error;
  }
}
