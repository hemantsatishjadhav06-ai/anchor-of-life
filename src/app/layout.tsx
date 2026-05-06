import type { Metadata } from 'next';
import { Fraunces, Noto_Serif_Devanagari, Mukta } from 'next/font/google';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  // No `weight` — Fraunces is variable, supports any weight 100-900.
  // `axes: ['opsz', 'SOFT']` requires omitting weight per next/font.
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

// Noto Serif Devanagari has weights 100–900 — necessary so weight:500/600
// in our CSS actually renders thicker. Tiro only shipped weight 400.
const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

const sans = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Anchor of Life · Brajesh Gautam',
    template: '%s · Anchor of Life',
  },
  description: 'Thirty years of teachings by Brajesh Gautam — astrologer, vastu expert, spiritual mentor. Ask anything; he has likely already answered. Hindi & English.',
  openGraph: {
    title: 'Anchor of Life · Brajesh Gautam',
    description: 'Thirty years of teachings. Ask anything — he has likely already answered.',
    type: 'website',
  },
  alternates: {
    languages: { 'en-US': '/?lang=en', 'hi-IN': '/?lang=hi' },
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${devanagari.variable} ${sans.variable}`} style={{ colorScheme: 'light only' }}>
      <head>
        {/* Force light theme regardless of OS dark mode preference */}
        <meta name="color-scheme" content="light only" />
        <meta name="theme-color" content="#FAFAF5" />
      </head>
      <body className="bg-paper text-ink antialiased font-sans" style={{ colorScheme: 'light only' }}>
        {children}
      </body>
    </html>
  );
}
