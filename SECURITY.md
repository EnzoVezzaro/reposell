# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Instead, report them via:

1. **Email**: security@reposell.dev
2. **GitHub Security Advisories**: Use the "Report a vulnerability" tab on GitHub

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Requirements

The reposell CLI implements the following security measures:

### Cryptographic Security
- Ed25519 for all signing operations
- Private keys NEVER committed to Git, npm, CI artifacts, or logs
- Key rotation via signed trust documents
- Signature verification for all manifests and pricing policies

### Payment Security
- Stripe webhook signature verification (mandatory)
- Never trust payment confirmation from browser
- Authoritative payment state from payment provider only
- Idempotent webhook processing

### Git Provider Security
- Minimal GitHub OAuth scopes
- Webhook signature verification
- Token storage via secure OS keychain

### CLI Security
- Input validation on all user-provided data
- Output validation on generated manifests
- No secret logging
- Secure default file permissions

### Dependency Security
- `bun audit` in CI
- Pinned dependency versions
- Regular dependency updates

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment and initial assessment
3. **Day 3-7**: Detailed analysis and fix development
4. **Day 7-14**: Fix testing and validation
5. **Day 14**: Security advisory published, patch released

## Scope

This policy covers:
- The reposell CLI (`reposell` package)
- Generated code and workflows
- Protocol implementations (`/sell`, `/marketplace`)

Out of scope:
- Third-party dependencies (report to their maintainers)
- User configuration files
- Infrastructure not managed by this project

## Recognition

We acknowledge security researchers who responsibly disclose vulnerabilities in our [Security Hall of Fame](https://github.com/EnzoVezzaro/reposell/security/advisories).

## Contact

Security team: security@reposell.dev
PGP key: Available on request