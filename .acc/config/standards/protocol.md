# protocol.md — Protocol Standard

The wire contract reposell publishes. This is the product's core promise: a buyer or a fork can
fetch a repository's `/reposell/**` surface and trust what it says. Everything here is
load-bearing and versioned.

## Surface

A repository publishes, under its own Pages site:

| Path | Schema id | Built by |
|------|-----------|----------|
| `/reposell/index.json` | — | `buildProtocolIndex()` |
| `/reposell/manifest.json` | `reposell/manifest/v1` | `buildRepoManifest()` |
| `/reposell/releases/index.json` | `reposell/releases/v1` | `buildReleasesIndex()` |
| `/reposell/releases/<version>.json` | `reposell/release/v1` | `buildReleaseManifest()` |
| `/reposell/health.json` | `reposell/health/v1` | `buildHealthDoc()` |
| `/reposell/marketplace.json` | `reposell/marketplace/v1` | `buildMarketplaceDoc()` |
| `/reposell/pricing.json` | `reposell/pricing/v1` | `src/domain/pricing/endpoint.ts` |
| `/reposell/signature.json` | `reposell/signature/v1` | `renderSignatureDoc()` |
| `/reposell/sell/` | — | `src/workflows/sell.ts` (HTML storefront) |

`src/domain/protocol/documents.ts` is the single definition site for every schema id, the document
types, and the builders. A document shape is not duplicated in a service, a command, or the docs
site; a service that needs one calls the builder.

## Determinism

**Same input, byte-identical output.** Not "equivalent JSON" — the same bytes, because the bytes
are what gets signed and what a buyer caches.

- Every builder is a pure function. No clock, no randomness, no `process.env`, no network. Data
  arrives as arguments.
- `canonicalJSON` from `src/utils/crypto.ts` is the **only** serializer for a protocol document.
  It sorts keys, so `JSON.stringify` would make key order part of the signature and break
  verification of an otherwise identical document. Using `JSON.stringify` on a protocol document
  is a defect, not a shortcut.
- No `Date.now()` in a document. A timestamp is a parameter or it does not exist.
- Byte-stability is asserted in tests — see `standards/testing.md`.

## Versioning

- Every document carries a `schema` id of the form `reposell/<name>/v<n>` and a `protocol`
  version. `PROTOCOL_VERSION` in `documents.ts` is the single source for the version string.
- **A published document is immutable.** A release manifest describes one release; changing a
  price or a payment link after publication is a new release, not an edit. Discovery identifiers
  (`discoveryIdempotencyKey`) derive from repository + release and stay stable for that pair.
- Adding an **optional** field is a minor version. Removing or retyping a field is a major
  version and requires a new schema id. Never edit a `v1` document's meaning in place.
- A verifier that meets a version it does not understand must refuse rather than guess.

## Invariants

These are the rules the protocol exists to enforce. Each is encoded in code and covered by a
negative test.

1. **Listing and seller `/sell` are separate.** Listing charges for discovery only. It never
   creates, modifies, or proxies a seller's payment, and never holds the seller's credentials.
   `src/domain/listing/pr.ts` and `src/domain/selling/sync.ts`.
2. **Fulfillment is pull-based.** `sell sync` polls the seller's own Stripe account with the
   seller's own key. No server, no webhook, no inbound callback.
3. **Payment links are verified against declared pricing.** A link whose deep price does not match
   the manifest blocks the release (`src/domain/payment/stripe-links.ts`,
   `src/domain/pricing/endpoint.ts`). No fallback percentage, ever.
4. **Money is integer minor units**, declared per release. There is no global product price.
5. **Fail closed.** A document that cannot be validated is blocked, not assumed. A missing key, a
   changed seller link, a malformed manifest — all block.
6. **Releases are evaluated independently.** One bad release does not invalidate the others
   (`build-service.ts`, spec §10).
7. **Signatures are verified before trust.** A document whose signature cannot be checked is
   never treated as valid; see `standards/security.md`.

## Generators own their namespace

`src/app/build-service.ts` writes **only** `<out>/reposell/**` and never touches a developer's
working tree. `.reposell/**` holds repository-local working state. `src/workflows/ci.ts` writes
only `reposell*.yml` under `.github/workflows/`, and only after confirmation. A generator that
would write outside its namespace is a BLOCK finding.

## Adding to the protocol

1. Define the schema id, the type, and the pure builder in `src/domain/protocol/documents.ts`.
2. Decide the version: a `v2` id if anything is removed or retyped; otherwise extend `v1` with
   optional fields.
3. Build the document in `build-service.ts` through the builder — never hand-construct the object
   in a service.
4. Add it to the table above and to `docs/protocol/`.
5. Test: determinism (build twice, compare bytes), the schema id, and the negative path a
   verifier must refuse.
6. Run `workflows/verify.md` if the change touches trust or pricing.

## Known inconsistencies

Real defects, recorded rather than papered over. Each is a decision for the human.

- **Two version strings for one protocol.** `PROTOCOL_VERSION` is `'1.0'` and is what
  `buildRepoManifest()` emits, while `buildProtocolIndex()` hardcodes `version: '1'`. A consumer
  reading the index and a consumer reading the manifest see different protocol versions. The index
  should use `PROTOCOL_VERSION`.
- **`ReleasePayment` is declared twice** in `documents.ts` (consecutive identical `interface`
  blocks). TypeScript merges them, so behaviour is correct, but the duplicate is an editing
  accident and one of the two should go.

## Related

- `standards/security.md` — signing, money, fail-closed rules
- `standards/architecture.md` — who may build these documents
- `workflows/verify.md` — verifying published trust artifacts
- `src/domain/protocol/documents.ts` — the definition site
- `IMPLEMENTATION.md` — the specification these invariants come from
