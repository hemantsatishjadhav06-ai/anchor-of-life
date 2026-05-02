import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Editorial paper-and-ink palette. No neon. No gradients.
        paper: {
          DEFAULT: '#F8F4EC', // warm parchment
          deep: '#EFE8DA',    // slightly aged
          dark: '#E5DCC8',    // border / divider
        },
        ink: {
          DEFAULT: '#1F1B16', // warm near-black, never pure
          soft: '#463E33',    // body
          mute: '#6B6053',    // captions, meta
          line: '#C9BFA9',    // hairline rules
        },
        vermilion: {
          DEFAULT: '#B83227', // ritual / sacred accent — used sparingly
          deep: '#8E1F17',
        },
        gerua: {
          DEFAULT: '#D77A2C', // saffron warmth — daily-anchor mark, loading dot
          deep: '#A8591D',
        },
        indigo: {
          DEFAULT: '#2C3E50', // alternate accent
        },
        // Inverse (night) — ink-on-deep-paper, never glow-on-void
        night: {
          paper: '#1A1612',
          ink: '#E8E0CF',
          soft: '#B8AE9A',
        },
      },
      fontFamily: {
        // Latin editorial serif
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        // Devanagari serif (warm, traditional)
        devanagari: ['var(--font-devanagari)', '"Tiro Devanagari Sanskrit"', 'serif'],
        // UI / sans (handles both scripts; subtle)
        sans: ['var(--font-sans)', 'Mukta', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial scale — wider than default, more breathing room
        'epigraph': ['1.125rem', { lineHeight: '1.7', letterSpacing: '0.01em' }],
        'folio-q': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.005em' }],
        'folio-a': ['1.125rem', { lineHeight: '1.75' }],
        'pull': ['1.625rem', { lineHeight: '1.5' }],
      },
      maxWidth: {
        prose: '38rem',
        folio: '44rem',
        wide: '78rem',
      },
      letterSpacing: {
        'tighter-display': '-0.018em',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
