# security.md — Security Standard

The rules. The **procedure** for a security-sensitive change lives in
`.acc/config/workflows/security.md`; this file states what must be true when it finishes.

## The trust model

reposell distributes repositories and takes money for them. Three parties are involved and each
boundary between them is a place an attacker can act:

1. **A seller's repository** — third-party content the CLI reads (manifests, `reposell.yml`,
   `package.json`, source headers, SPDX text, tags). Every field in it is untrusted input.
2. **Stripe** — money and identity. The CLI can hold a real secret key.
3. **The buyer / a fork** — a downstream consumer of a signed manifest.

The CLI runs on a contributor's machine with their own credentials. That is the asset being
protected, and it is why the rules below are mostly about *failing closed* and *not leaking*.

## Secrets

- **Private keys, tokens, and API keys never reach Git, npm, CI artifacts, logs, error messages,
  prompts, or generated files.** The private signing key exists in memory only for the duration of
  a sign operation, is read from `REPOSELL_SIGNING_KEY`, and is never written to disk
  (`src/app/signing-service.ts`).
- Keys live in the environment or the gitignored `.env`. `.env.example`-style files contain
  placeholders only. `docs/.env.production` holds two `VITE_APP_*` display strings and is safe
  because it contains no credential — that distinction is the reason it is committed.
- A credential-shaped value is never interpolated into a message. Errors report the **shape**
  (`sk_test_…`, a 4-character prefix) because that is all a human needs to diagnose the problem.
- Prompts must never echo a value read from a secret-bearing variable.
- `functions/github-auth/worker.js` holds a public OAuth `client_id` and reads
  `GITHUB_CLIENT_SECRET` from the environment. A public client id is not a secret; the secret is,
  and it stays in the worker environment.
- **A finding of a leaked credential is a BLOCK with no exception.** Rotate first, then remove it,
  then write the incident to `.acc-memory.md`. Rewriting history without rotating leaves the key
  live.

## Signing and verification

- **Ed25519** (`@noble/ed25519`) is the only signature algorithm. 32-byte seed, base64 in
  `REPOSELL_SIGNING_KEY`; public keys are safe to distribute.
- **A signature that cannot be verified is never assumed valid.** There is no "skip verification"
  flag, no unverified fallback path, and no default trust value. An absent or malformed key is
  an error (`SigningKeyMissingError` / `SigningKeyInvalidError`), not a bypass.
- Documents are canonicalised with `canonicalJSON` before signing — see `standards/protocol.md`.
  A verifier that re-serialises differently must reject, not normalise.
- Key rotation is a new key with a signed trust document that names the successor. It is never a
  silent replacement of a published key.

## Money

- **Amounts are integer minor units.** No float ever holds a monetary value. Tests assert the
  unit so a 50 → $0.50 bug cannot pass.
- **Fulfillment is pull-based.** `reposell sell sync` polls the **seller's own** Stripe account
  with the seller's own key (`REPOSELL_STRIPE_SECRET_KEY` / `STRIPE_SECRET_KEY`). There is no
  server, no webhook, and no inbound callback in this codebase — `src/domain/selling/sync.ts`
  states this invariant. A design that reintroduces a webhook receiver must verify the
  provider's signature on the raw body before parsing it; that rule is prospective, not
  descriptive.
- **Payment confirmation is never taken from the client.** A purchase is recorded from the
  provider's own API response.
- **The Listing and the seller `/sell` are financially separate.** Listing charges for discovery
  only; a Listing never creates, modifies, or proxies a seller's payment, and never sees the
  seller's key. Discovery identifiers are derived deterministically from repository + release and
  are immutable once created (`discoveryIdempotencyKey`).
- Any operation that creates money movement carries an idempotency key, and a repeated call is
  distinguishable from a new one. `src/commands/init.ts` and
  `src/domain/listing/discovery.ts` are the reference call sites.

## Input handling

- Everything from a file, an env var, an API response, or a git remote is `unknown` until
  validated at the edge (`standards/coding.md`).
- **Path traversal is prevented.** A value that becomes a filesystem path or a URL is checked to
  stay inside its namespace before use. Generated output is confined to `<out>/reposell/**`,
  `.reposell/**`, and the two `reposell*.yml` workflow files (`standards/architecture.md`).
- **Never overwrite a user's file without confirmation.** Generators check for existence and ask.
- An invalid configuration or manifest fails closed with an actionable message. It never falls
  back to a default that would let a workflow continue.

## Supply chain

- The runtime dependency surface is three packages (`@noble/ed25519`, `@reposell/sell`, `yaml`)
  and is meant to stay that small. **Adding a dependency is a human decision** — it is not a
  refactoring convenience.
- Vendored code is never edited in place: `tools/oxlint/anti-slop/**`,
  `branding/canvasui/**`, `docs/.vitepress/dist|cache/**`.
- `npm audit` is reviewed on dependency changes, not just at release.
- CI uses `actions/checkout@v4` and `actions/setup-node@v4`; a workflow needs the narrowest
  `permissions:` block that works (`contents: read` unless a job genuinely needs more).

## Reporting

Suspected vulnerabilities go through the process in `SECURITY.md`. This standard describes the
defences; it is not the disclosure policy.

## Related

- `workflows/security.md` — the check sequence for a security-sensitive change
- `workflows/verify.md` — verifying published trust artifacts
- `standards/protocol.md` — canonicalisation and the signature envelope
- `standards/review.md` — the trust checklist and severities
- `SECURITY.md` — disclosure policy
