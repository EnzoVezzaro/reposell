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
}
