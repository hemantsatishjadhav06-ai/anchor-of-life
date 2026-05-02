import type { Metadata } from 'next';
import { Fraunces, Tiro_Devanagari_Sanskrit, Mukta } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const devanagari = Tiro_Devanagari_Sanskrit({
  subsets: ['devanagari', 'latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
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
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
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
    <html lang="en" className={`${display.variable} ${devanagari.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
