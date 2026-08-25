export interface LicenseCommandArgs {
  action: 'check' | 'use' | 'keep';
  holder?: string;
  repository?: string | 'auto';
  year?: string;
  jurisdiction?: string;
  force: boolean;
  noPolicy: boolean;
}

export class LicenseArgsError extends Error {}

export function parseLicenseArgs(argv: string[]): LicenseCommandArgs {
  const [action, kind, ...rest] = argv;
  if (action !== 'check' && action !== 'use' && action !== 'keep') {
    throw new LicenseArgsError('usage: reposell license <check|use|keep> [flags]');
  }
  // `license use rsl` — the license flavor positional is accepted for rsl
  // only (the generated license is always RSL-1.0).
  if (kind !== undefined && !kind.startsWith('--')) {
    if (action !== 'use' || kind.toLowerCase() !== 'rsl') {
      throw new LicenseArgsError(`unknown argument: ${kind}`);
    }
  } else if (kind !== undefined) {
    rest.unshift(kind);
  }

  const args: LicenseCommandArgs = { action, force: false, noPolicy: false };

  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    switch (flag) {
      case '--holder': {
        const value = rest[i + 1];
        if (value === undefined || value.startsWith('--')) throw new LicenseArgsError('--holder requires a value');
        args.holder = value;
        i += 1;
        break;
      }
      case '--repo-url': {
        const value = rest[i + 1];
        if (value === undefined || value.startsWith('--')) throw new LicenseArgsError('--repo-url requires a value');
        args.repository = value === 'auto' ? 'auto' : value;
        i += 1;
        break;
      }
      case '--year': {
        const value = rest[i + 1];
        if (value === undefined || value.startsWith('--')) throw new LicenseArgsError('--year requires a value');
        args.year = value;
        i += 1;
        break;
      }
      case '--jurisdiction': {
        const value = rest[i + 1];
        if (value === undefined || value.startsWith('--')) {
          throw new LicenseArgsError('--jurisdiction requires a value');
        }
        args.jurisdiction = value;
        i += 1;
        break;
      }
      case '--force':
        args.force = true;
        break;
      case '--no-policy':
        args.noPolicy = true;
        break;
      default:
        throw new LicenseArgsError(`unknown flag: ${flag}`);
    }
  }

  return args;
}
