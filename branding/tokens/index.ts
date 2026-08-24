export * from './brand.json' with { type: 'json' }
export * from './global.css' with { type: 'css' }
export * from './utils.ts'

export const brandTokens = {
  colors: {
    signal: 'oklch(0.62 0.22 45)',
    verified: 'oklch(0.52 0.18 142)',
    pending: 'oklch(0.75 0.16 85)',
    invalid: 'oklch(0.55 0.22 25)',
  },
  neutral: {
    50: 'oklch(0.985 0.003 45)',
    100: 'oklch(0.97 0.005 45)',
    200: 'oklch(0.93 0.008 45)',
    300: 'oklch(0.87 0.012 45)',
    400: 'oklch(0.72 0.015 45)',
    500: 'oklch(0.58 0.018 45)',
    600: 'oklch(0.45 0.020 45)',
    700: 'oklch(0.35 0.022 45)',
    800: 'oklch(0.25 0.024 45)',
    900: 'oklch(0.18 0.025 45)',
    950: 'oklch(0.12 0.025 45)',
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  borderRadius: {
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  fontFamily: {
    sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    display: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    logo: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  },
} as const

export type BrandTokens = typeof brandTokens