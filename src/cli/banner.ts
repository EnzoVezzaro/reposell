/**
 * ASCII identity mark — a rasterized "R" whose leg kicks out like a
 * lightning stroke. Drawn on a strict grid so every line aligns in any
 * monospace terminal (deterministic output).
 */

export const BANNER_FULL = [
  '-%%@@@@@%@@@@@%.',
  '=@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@@@@@#+++',
  '=@@@@@@@@@@@@@@@@#@@@+:',
  '=@@@@@@@@@@@@@@@@+:',
  '=@@@@@@@@@@@@@@.  ****:',
  '=@@@@@@@@@@@@@@.   ****:',
  '=@@@@@@@@@@@@@@.     ****:',
  '=@@@@@@@@@@@@@@.      ****:',
  '=@@@@@@@@@@@@@@.       ****:',
  '=@@@@@@@@@@@@@@.         ****:',
  '=@@@@@@@@@@@@@@.          ****:',
  '=@@@@@@@@@@@@@@.           ****:',
  '=@@@@@@@@@@@@@@.            ****:',
  '=@@@@@@@@@@@@@@.              +****+',
  '.==============.',
].join('\n');

export const BANNER_COMPACT = [
  '-%%@@@@@@%@@%.',
  '=@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@@@%:',
  '=@@@@@@@@@@@@@@@+:',
  '=@@@@@@@@@@@. **+:',
  '=@@@@@@@@@@@.   **+:',
  '.============.   **+:',
  '                   +****+',
].join('\n');

export function renderBanner(variant: 'full' | 'compact' = 'compact'): string {
  if (variant === 'full') {
    return BANNER_FULL;
  }
  return [
    BANNER_COMPACT,
    '',
    '  Made with \u2615 by Enzo Vezzaro \u2014 solo developer, Dominican Republic.',
    '  Help me grow into a team \u2192 github.com/EnzoVezzaro/reposell/issues',
    '',
  ].join('\n');
}
