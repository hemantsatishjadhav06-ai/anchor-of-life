'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import KundliChart from '@/components/KundliChart';
import PrescriptionTable from '@/components/PrescriptionTable';
import Link from 'next/link';
import type { FullChart, Prescription } from '@/lib/astrology/types';

interface StoredInput {
  name?: string;
  date: string;
  time: string;
  place: { short: string; tz: string; lat: number; lon: number };
}

function ResultInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = (sp.get('lang') === 'hi' ? 'hi' : 'en') as 'en' | 'hi';
  const [data, setData] = useState<{ chart: FullChart; prescription: Prescription } | null>(null);
  const [input, setInput] = useState<StoredInput | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('kundli:last');
    const inRaw = sessionStorage.getItem('kundli:input');
    if (!raw) { router.replace(`/kundli?lang=${lang}`); return; }
    setData(JSON.parse(raw));
    if (inRaw) setInput(JSON.parse(inRaw));
  }, [router, lang]);

  if (!data) {
    return (
      <>
        <Header lang={lang} />
        <main className="max-w-folio mx-auto px-6 py-20">
          <p className="text-ink-soft">Loading…</p>
        </main>
        <Footer lang={lang} />
      </>
    );
  }

  const { chart, prescription } = data;

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <Link href={`/kundli?lang=${lang}`} className="btn-text">← {lang === 'hi' ? 'नई कुंडली' : 'New kundli'}</Link>

        <header className="mt-6 mb-10 max-w-folio">
          <p className="citation-meta">{lang === 'hi' ? 'कुंडली' : 'Kundli'}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl text-ink leading-tight font-bold">
            {input?.name || (lang === 'hi' ? 'आपकी कुंडली' : 'Your kundli')}
          </h1>
          {input && (
            <p className="mt-3 text-ink-soft text-sm font-medium">
              {input.date} · {input.time} · {input.place.short} ({input.place.tz})
            </p>
          )}
        </header>

        <div className="grid lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 items-start mb-12">
          {/* Chart */}
          <div className="space-y-8">
            <KundliChart
              chart={chart.d1}
              size={360}
              lang={lang}
              title={lang === 'hi' ? 'जन्म कुंडली (D-1)' : 'Birth Chart (D-1 Lagna)'}
            />
            <KundliChart
              chart={chart.d9}
              size={360}
              lang={lang}
              title={lang === 'hi' ? 'नवांश (D-9)' : 'Navamsa (D-9)'}
            />
          </div>

          {/* Prescription */}
          <div>
            <PrescriptionTable prescription={prescription} lang={lang} />
          </div>
        </div>

        {/* Bottom: ask BG about your chart */}
        <hr className="rule" />
        <section className="max-w-folio mx-auto py-10 text-center">
          <p className="font-display text-2xl text-ink mb-4 font-medium">
            {lang === 'hi'
              ? 'इस कुंडली के बारे में ब्रजेश जी से पूछिए'
              : 'Ask Brajesh ji about your chart'}
          </p>
          <p className="text-ink-soft mb-5">
            {lang === 'hi'
              ? 'किसी भी ग्रह, भाव, या उपाय के बारे में सीधे पूछें — उत्तर उनकी रिकॉर्डेड शिक्षाओं से आएगा।'
              : 'Ask about any planet, house, or remedy — the answer comes from his recorded teachings.'}
          </p>
          <a
            href="https://www.brajeshgautam.com/Contact-us"
            target="_blank"
            rel="noopener"
            className="btn-ink inline-block mr-3"
          >
            {lang === 'hi' ? 'व्यक्तिगत परामर्श' : 'Book personal consultation'}
          </a>
          <Link href={`/?lang=${lang}`} className="btn-text">
            {lang === 'hi' ? 'और प्रश्न पूछें' : 'Ask more questions'} →
          </Link>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}

export default function KundliResultPage() {
  return (
    <Suspense fallback={
      <main className="max-w-folio mx-auto px-6 py-20">
        <p className="text-ink-soft">Loading…</p>
      </main>
    }>
      <ResultInner />
    </Suspense>
  );
}
