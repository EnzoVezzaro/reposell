# reposell

The CLI for the reposell repository-to-repository listing protocol. Automates repository initialization, release management, cryptographic signing, and listing publication.

## Install

```bash
npm install -g reposell
```

## Quickstart

```bash
cd your-repo
reposell init          # detect repo, generate keys, create reposell.yml
reposell build         # build + sign the artifact
reposell release       # publish version to GitHub
reposell publish       # approve publication after gates pass
```

## Commands

| Command | Description |
|---------|-------------|
| `reposell init` | Initialize repository with zero-config defaults |
| `reposell build [--out dist]` | Generate the `/reposell/*` static surface |
| `reposell release` | Declare a release with pricing and Stripe Payment Link |
| `reposell publish` | Approve publication after gates pass |
| `reposell validate` | Run the full publication gate checklist |
| `reposell health` | Health report for every configured release |
| `reposell verify <manifest\|trust\|pricing> [url]` | CI verification entry points |
| `reposell keys <generate\|show>` | Ed25519 signing identity |
| `reposell license <check\|use\|keep>` | License management |
| `reposell listing <status\|publish>` | Listing management |
| `reposell help` | Show help |

## How It Works

1. **`reposell init`** — Detects your Git repo, generates Ed25519 keys, creates `reposell.yml` and GitHub Actions workflows
2. **`reposell build`** — Reads `storefront.json` (if present) and generates the static `/reposell/*` surface with signed manifests
3. **`reposell release`** — Declares a release version with pricing, Stripe Payment Links, and license offers
4. **`reposell publish`** — Approves publication after validation gates pass
5. **`reposell verify`** — CI entry points for verifying manifests, trust documents, and pricing

## Configuration

All values are auto-derived from Git/GitHub/CI. Optional configuration in `reposell.yml`:

```yaml
licensing:
  policy:
    profile: source-available-commercial
  schemes:
    standard: { name: Standard, billing: one-time, template: rsl-1.0 }

releases:
  definitions:
    v1.0.0:
      status: published
      offers:
        - scheme: standard
          pricing: { amount: 29, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
```

## Documentation

Full documentation: https://reposell.dev/

## Ecosystem

| Product | Description | Link |
|---------|-------------|------|
| **reposell CLI** | Repository initialization, release management, and listing publication | [reposell.dev](https://reposell.dev/) |
| **reposell listing** | Official discovery directory — verified listings, discussion, and discovery payments | [listing.reposell.dev](https://listing.reposell.dev/) |
| **reposell community listing** | Self-hosted federated discovery directory — community-operated | [community.reposell.dev](https://community.reposell.dev/) |
| **reposell storefront studio** | Visual storefront builder for /sell pages | [GitHub](https://github.com/EnzoVezzaro/reposell-storefront-studio) |

## License

Custom reposell license — see [LICENSE](LICENSE) for details.
