export type StripeMode = 'test' | 'live';

export class StripeKeyMissingError extends Error {
  readonly code = 'STRIPE_KEY_MISSING';
  constructor() {
    super(
      'No Stripe API key found. Set STRIPE_SECRET_KEY (sk_test_… recommended) in your environment or .env file.',
    );
    this.name = 'StripeKeyMissingError';
  }
}

export class StripeKeyInvalidError extends Error {
  readonly code = 'STRIPE_KEY_INVALID';
  constructor(prefixHint: string) {
    super(
      `STRIPE_SECRET_KEY does not look like a Stripe secret key. Expected sk_test_… or sk_live_…, got "${prefixHint}…".`,
    );
    this.name = 'StripeKeyInvalidError';
  }
}

export class StripeApiError extends Error {
  readonly code = 'STRIPE_API_ERROR';
  constructor(status: number, message: string) {
    super(`Stripe API error (${status}): ${message}`);
    this.name = 'StripeApiError';
  }
}

export interface PaymentAccountStatus {
  provider: 'stripe';
  mode: StripeMode;
  connected: boolean;
  accountId?: string;
  businessName?: string;
  country?: string;
  defaultCurrency?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export interface StripeBalance {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
  connect_reserved: Array<{ amount: number; currency: string }>;
}

export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  arrival_date: number;
  created: number;
  description?: string;
  failure_code?: string;
  failure_message?: string;
}

export interface BalanceStatus {
  balance: StripeBalance;
  payoutsEnabled: boolean;
  recentPayouts: StripePayout[];
  issues: string[];
}

interface StripeAccountResponse {
  id?: string;
  business_profile?: { name?: string };
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  livemode?: boolean;
  error?: { message?: string };
}

interface HttpResult {
  ok: boolean;
  status: number;
  json(): Promise<StripeAccountResponse>;
}

export interface FetchLike {
  (url: string, init: { headers: Record<string, string> }): Promise<HttpResult>;
}

const DEFAULT_FETCH: FetchLike = (url, init) =>
  // SAFETY: FetchLike headers are structurally identical to RequestInit headers.
  fetch(url, init as RequestInit).then((res: Response) => ({
    ok: res.ok,
    status: res.status,
    json: () => {
      // SAFETY: network JSON is projected onto the documented Stripe account schema
      // and every consumed field passes through strOrUndef/=== guards before use.
      return res.json() as Promise<StripeAccountResponse>;
    },
  }));

function strOrUndef(value: string | undefined): string | undefined {
  return value !== undefined && Object.prototype.toString.call(value) === '[object String]'
    ? value
    : undefined;
}

export function classifySecretKey(key: string): StripeMode {
  return key.includes('_live_') ? 'live' : 'test';
}

function looksLikeSecretKey(key: string): boolean {
  return /^(sk|rk)_(test|live)_/.test(key);
}

export class StripePaymentProvider {
  readonly name = 'stripe';

  private readonly apiKey: string;
  private readonly doFetch: FetchLike;

  constructor(apiKey: string, doFetch: FetchLike = DEFAULT_FETCH) {
    if (!looksLikeSecretKey(apiKey)) {
      throw new StripeKeyInvalidError(apiKey.slice(0, Math.min(6, apiKey.length)));
    }
    this.apiKey = apiKey;
    this.doFetch = doFetch;
  }

  static fromEnv(
    env: Record<string, string | undefined>,
    doFetch?: FetchLike,
  ): StripePaymentProvider {
    const key = env['REPOSELL_STRIPE_SECRET_KEY'] ?? env['STRIPE_SECRET_KEY'];
    if (key === undefined || key.trim().length === 0) throw new StripeKeyMissingError();
    return new StripePaymentProvider(key.trim(), doFetch);
  }

  async verifyAccount(): Promise<PaymentAccountStatus> {
    const res = await this.doFetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new StripeApiError(res.status, body.error?.message ?? `HTTP ${res.status}`);
    }

    return {
      provider: 'stripe',
      mode: body.livemode === true ? 'live' : 'test',
      connected: true,
      accountId: strOrUndef(body.id),
      businessName: strOrUndef(body.business_profile?.name),
      country: strOrUndef(body.country),
      defaultCurrency: strOrUndef(body.default_currency),
      chargesEnabled: body.charges_enabled === true,
      payoutsEnabled: body.payouts_enabled === true,
    };
  }

  async getBalance(): Promise<StripeBalance> {
    const res = await this.doFetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    // SAFETY: Stripe balance API returns documented balance object
    const body = (await res.json()) as {
      available?: Array<{ amount?: number; currency?: string }>;
      pending?: Array<{ amount?: number; currency?: string }>;
      connect_reserved?: Array<{ amount?: number; currency?: string }>;
      error?: { message?: string };
    };
    if (!res.ok || body.error !== undefined) {
      throw new StripeApiError(res.status, body.error?.message ?? `HTTP ${res.status}`);
    }

    return {
      available: (body.available ?? []).map((item) => ({
        amount: item.amount ?? 0,
        currency: item.currency ?? 'usd',
      })),
      pending: (body.pending ?? []).map((item) => ({
        amount: item.amount ?? 0,
        currency: item.currency ?? 'usd',
      })),
      connect_reserved: (body.connect_reserved ?? []).map((item) => ({
        amount: item.amount ?? 0,
        currency: item.currency ?? 'usd',
      })),
    };
  }

  async listPayouts(limit = 10): Promise<StripePayout[]> {
    const res = await this.doFetch(
      `https://api.stripe.com/v1/payouts?limit=${limit}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } },
    );
    // SAFETY: Stripe payouts API returns documented payout list
    const body = (await res.json()) as {
      data?: Array<{
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        arrival_date?: number;
        created?: number;
        description?: string;
        failure_code?: string;
        failure_message?: string;
      }>;
      error?: { message?: string };
    };
    if (!res.ok || body.error !== undefined) {
      throw new StripeApiError(res.status, body.error?.message ?? `HTTP ${res.status}`);
    }

    return (body.data ?? []).map((item) => ({
      id: item.id ?? 'unknown',
      amount: item.amount ?? 0,
      currency: item.currency ?? 'usd',
      status: (item.status as StripePayout['status']) ?? 'pending',
      arrival_date: item.arrival_date ?? 0,
      created: item.created ?? 0,
      description: item.description,
      failure_code: item.failure_code,
      failure_message: item.failure_message,
    }));
  }

  async checkBalanceStatus(): Promise<BalanceStatus> {
    const [balance, account] = await Promise.all([this.getBalance(), this.verifyAccount()]);
    const payouts = await this.listPayouts(5);
    const issues: string[] = [];

    if (!account.payoutsEnabled) {
      issues.push('Payouts are DISABLED on your Stripe account. Enable payouts in Stripe Dashboard → Settings → Payouts.');
    }

    // Check for failed payouts
    const failedPayouts = payouts.filter((p) => p.status === 'failed');
    if (failedPayouts.length > 0) {
      issues.push(`${failedPayouts.length} failed payout(s). Check your bank account details in Stripe Dashboard.`);
    }

    // Check for pending payouts
    const pendingPayouts = payouts.filter((p) => p.status === 'pending' || p.status === 'in_transit');
    if (pendingPayouts.length > 0) {
      issues.push(`${pendingPayouts.length} payout(s) pending/in transit. Funds will arrive at their scheduled time.`);
    }

    // Check for negative available balance
    const usdAvailable = balance.available.find((b) => b.currency === 'usd');
    if (usdAvailable !== undefined && usdAvailable.amount < 0) {
      issues.push(`Available balance is negative ($${(usdAvailable.amount / 100).toFixed(2)}). This may indicate refunds, disputes, or Stripe fees exceeding your balance.`);
    }

    // Check for large pending balance
    const usdPending = balance.pending.find((b) => b.currency === 'usd');
    if (usdPending !== undefined && usdPending.amount > 0) {
      const payoutSchedule = account.payoutsEnabled ? 'automatic' : 'manual';
      issues.push(`$${(usdPending.amount / 100).toFixed(2)} pending settlement. Payouts are ${payoutSchedule}.`);
    }

    return { balance, payoutsEnabled: account.payoutsEnabled, recentPayouts: payouts, issues };
  }
}
