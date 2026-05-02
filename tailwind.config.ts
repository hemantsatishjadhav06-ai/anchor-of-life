import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Maximum-contrast editorial palette. Near-black on near-white.
        paper: {
          DEFAULT: '#FAFAF5',
          deep: '#F0EDE3',
          dark: '#D7D0BD',
        },
        ink: {
          DEFAULT: '#0A0805',  // 19:1 contrast on paper — AAA
          soft: '#1F1A14',     // 16:1 — AAA
          mute: '#4A4337',     // 9:1 — AAA on body, AA on small
          line: '#8C8273',     // 4:1 — visible hairline
        },
        vermilion: {
          DEFAULT: '#962412',
          deep: '#6E180A',
        },
        gerua: {
          DEFAULT: '#B05A18',
          deep: '#7A3E0F',
        },
        indigo: {
          DEFAULT: '#1F2D3D',
        },
        night: {
          paper: '#0A0805',
          ink: '#FAFAF0',
          soft: '#DED7C5',
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
