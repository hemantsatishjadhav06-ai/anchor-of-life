import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Editorial paper-and-ink palette — high contrast, warm.
        // Body 14.5:1, mute 7.5:1, line 3:1. AAA on body, AA+ everywhere else.
        paper: {
          DEFAULT: '#FBF6EB', // slightly cleaner parchment than before
          deep: '#F0E9D8',
          dark: '#DCD0B7',    // border / divider — visible
        },
        ink: {
          DEFAULT: '#14110D', // very dark warm — body type lives here
          soft: '#2A2520',    // headings, prose. 14:1 contrast.
          mute: '#5A5045',    // captions, meta. 7.5:1 — readable.
          line: '#A89A7E',    // hairline rules — actually visible.
        },
        vermilion: {
          DEFAULT: '#A82817', // ritual accent — slightly darker red, more readable on cream
          deep: '#7C1B0F',
        },
        gerua: {
          DEFAULT: '#C56A1F', // saffron warmth — daily-anchor mark
          deep: '#8E4912',
        },
        indigo: {
          DEFAULT: '#1F2D3D',
        },
        // Inverse (night) — ink-on-deep-paper, never glow-on-void
        night: {
          paper: '#14100B',
          ink: '#F2EAD8',
          soft: '#D6CCB8',
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
