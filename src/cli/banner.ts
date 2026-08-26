/**
 * ASCII identity mark — "r/", the reposell sign. Block-element stem, @-fill
 * slash. Preserved as designed; every line aligns in a monospace terminal.
 */

export const BANNER_FULL = [
  '                             i*@@@@#I',
  '                           ,>@@@@#!',
  '                           <@@@@@_',
  '     .>\u2583\u2583\u2583\u2583\u2583I I\u2592\u2585\u2586\u2586\u2593:    =@@@@@=.',
  '     .*\u2586\u2586\u2586\u2586\u2586_\u2581\u2586\u2586\u2586\u2586\u2586\u2593:   _@@@@@*.',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2586\u2593:  |#@@@@%.',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586\u2585\u2590#=+\\. i%@@@@%;',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586\u2586+       .#@@@@#l',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586*       .%@@@@#\\',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586l      .=@@@@@~',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586l     .~@@@@@+',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586I     /@@@@@=.',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586l    I@@@@@<:',
  '     .*\u2586\u2586\u2586\u2586\u2586\u2586l   ;#@@@@*i',
  '      ~\u2593\u2593\u2593\u2593\u2593\u2593;  ;*@@@@@l',
  '               :<@@@@@!',
].join('\n');

export const BANNER_COMPACT = BANNER_FULL;

export function renderBanner(variant: 'full' | 'compact' = 'compact'): string {
  if (variant === 'full') {
    return BANNER_FULL;
  }
  return [
    BANNER_COMPACT,
    '',
    '  Built by Enzo Vezzaro \u2014 from the Dominican Republic, for the world.',
    '  github.com/EnzoVezzaro/reposell',
    '',
  ].join('\n');
}
