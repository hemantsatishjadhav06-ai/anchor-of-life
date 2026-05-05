'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AllCharts from '@/components/kundli/AllCharts';
import PrescriptionTable from '@/components/kundli/PrescriptionTable';
import DoshaList from '@/components/kundli/DoshaList';
import YogaList from '@/components/kundli/YogaList';
import DashaTimeline from '@/components/kundli/DashaTimeline';
import ChartChat from '@/components/kundli/ChartChat';
import Reading from '@/components/kundli/Reading';
import LifeAreaSection from '@/components/kundli/LifeAreaSection';
import type { FullChart, BirthInput } from '@/lib/astrology/types';

interface StoredInputShape {
  name?: string;
  date: string;
  time: string;
  place: { short: string; lat: number; lon: number; tz: string; tz_offset_minutes: number };
}

function ResultInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = (sp.get('lang') === 'hi' ? 'hi' : 'en') as 'en' | 'hi';

  const [chart, setChart] = useState<FullChart | null>(null);
  const [input, setInput] = useState<BirthInput | null>(null);

  useEffect(() => {
    const last = sessionStorage.getItem('kundli:last');
    const inRaw = sessionStorage.getItem('kundli:input');
    if (!last || !inRaw) {
      router.replace(`/kundli?lang=${lang}`);
      return;
    }
    try {
      const data = JSON.parse(last);
      const stored = JSON.parse(inRaw) as StoredInputShape;
      setChart(data.chart as FullChart);
      setInput({
        name: stored.name,
        date: stored.date,
        time: stored.time,
        tzOffsetMinutes: stored.place.tz_offset_minutes,
        lat: stored.place.lat,
        lon: stored.place.lon,
        placeName: stored.place.short,
      });
    } catch {
      router.replace(`/kundli?lang=${lang}`);
    }
  }, [router, lang]);

  if (!chart || !input) {
    return (
      <>
        <Header lang={lang} />
        <main className="max-w-folio mx-auto px-6 py-20">
          <p className="text-ink-soft">{lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p>
        </main>
        <Footer lang={lang} />
      </>
    );
  }

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <Link href={`/kundli?lang=${lang}`} className="btn-text">
          ← {lang === 'hi' ? 'नई कुंडली' : 'New kundli'}
        </Link>

        <header className="mt-6 mb-10 max-w-folio">
          <p className="citation-meta">{lang === 'hi' ? 'कुंडली' : 'Kundli'}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl text-ink leading-tight font-bold">
            {input.name || (lang === 'hi' ? 'आपकी कुंडली' : 'Your kundli')}
          </h1>
          <p className="mt-3 text-ink-soft text-sm font-medium">
            {input.date} · {input.time} · {input.placeName}
          </p>
        </header>

        {/* All charts grid */}
        <section className="mb-14">
          <h2 className="font-display text-2xl text-ink mb-1 font-medium">
            {lang === 'hi' ? 'सभी कुंडलियाँ' : 'All charts'}
          </h2>
          <p className="text-ink-soft text-sm mb-6">
            {lang === 'hi'
              ? 'जन्मकुंडली + पाँच विभाजन कुंडलियाँ — एक स्थान पर।'
              : 'Birth chart + five divisional charts — all in one place.'}
          </p>
          <AllCharts fc={chart} lang={lang} />
        </section>

        {/* Doshas + Yogas + Dashas */}
        <section className="grid lg:grid-cols-3 gap-10 mb-14">
          <DoshaList fc={chart} lang={lang} />
          <YogaList fc={chart} lang={lang} />
          <DashaTimeline fc={chart} lang={lang} />
        </section>

        {/* Top-line transcript-grounded reading */}
        <section className="mb-14 max-w-folio">
          <h2 className="font-display text-2xl text-ink mb-1 font-medium">
            {lang === 'hi' ? 'समग्र पठन' : 'Top-line reading'}
          </h2>
          <p className="text-ink-soft text-sm mb-6">
            {lang === 'hi' ? "ब्रजेश जी की रिकॉर्डेड शिक्षाओं से।" : "Drawn from Brajesh ji's recorded teachings."}
          </p>
          <Reading tab="overview" input={input} lang={lang} eager />
        </section>

        <hr className="rule my-12" />

        {/* Per-life-area inline sections */}
        <LifeAreaSection
          tab="marriage"
          divisional={chart.d9}
          input={input}
          lang={lang}
          title={{ en: 'Marriage', hi: 'विवाह' }}
          subtitle={{
            en: 'D-9 Navamsa · Venus, 7th house, Navamsa lord',
            hi: 'D-9 नवांश · शुक्र, 7वाँ भाव, नवांश स्वामी',
          }}
          chartLabel={{ en: 'D-9 Navamsa', hi: 'D-9 नवांश' }}
        />

        <LifeAreaSection
          tab="career"
          divisional={chart.d10}
          input={input}
          lang={lang}
          title={{ en: 'Career', hi: 'व्यवसाय' }}
          subtitle={{
            en: 'D-10 Dasamsa · Sun, Saturn, 10th house, Dasamsa lord',
            hi: 'D-10 दशमांश · सूर्य, शनि, 10वाँ भाव',
          }}
          chartLabel={{ en: 'D-10 Dasamsa', hi: 'D-10 दशमांश' }}
        />

        <LifeAreaSection
          tab="children"
          divisional={chart.d7}
          input={input}
          lang={lang}
          title={{ en: 'Children', hi: 'संतान' }}
          subtitle={{
            en: 'D-7 Saptamsa · Jupiter, 5th house',
            hi: 'D-7 सप्तमांश · गुरु, 5वाँ भाव',
          }}
          chartLabel={{ en: 'D-7 Saptamsa', hi: 'D-7 सप्तमांश' }}
        />

        <LifeAreaSection
          tab="parents"
          divisional={chart.d12}
          input={input}
          lang={lang}
          title={{ en: 'Parents', hi: 'माता-पिता' }}
          subtitle={{
            en: 'D-12 Dwadasamsa · Sun (father), Moon (mother), 4th & 9th houses',
            hi: 'D-12 द्वादशांश · सूर्य (पिता), चंद्र (माता), 4वाँ व 9वाँ भाव',
          }}
          chartLabel={{ en: 'D-12 Dwadasamsa', hi: 'D-12 द्वादशांश' }}
        />

        <LifeAreaSection
          tab="hardships"
          divisional={chart.d30}
          input={input}
          lang={lang}
          title={{ en: 'Hardships', hi: 'दुख-कष्ट' }}
          subtitle={{
            en: 'D-30 Trimsamsa · Saturn, Rahu, 6/8/12 houses',
            hi: 'D-30 त्रिंशांश · शनि, राहु, 6/8/12वाँ भाव',
          }}
          chartLabel={{ en: 'D-30 Trimsamsa', hi: 'D-30 त्रिंशांश' }}
        />

        <hr className="rule my-12" />

        {/* Full BG-style 27-field prescription */}
        <section className="mb-14">
          <h2 className="font-display text-2xl text-ink mb-1 font-medium">
            {lang === 'hi'
              ? 'ब्रजेश जी का परामर्श प्रारूप — 27 क्षेत्र'
              : 'BG Consultation — 27-field Prescription'}
          </h2>
          <p className="text-ink-soft text-sm mb-6">
            {lang === 'hi'
              ? 'सभी 27 क्षेत्र — दान, रत्न, पूजा, उपाय, इष्ट, व्यवसाय, विवाह — ब्रजेश जी की शिक्षाओं पर आधारित।'
              : "All 27 fields — donations, gemstones, pujas, remedies, isht, business, marriage — derived from Brajesh ji's teachings."}
          </p>
          <PrescriptionTable input={input} lang={lang} />
        </section>

        <hr className="rule my-12" />

        <section className="max-w-folio mx-auto">
          <h2 className="font-display text-2xl text-ink mb-2 font-medium">
            {lang === 'hi' ? 'इस कुंडली के बारे में पूछिए' : 'Ask about your chart'}
          </h2>
          <p className="text-ink-soft mb-6 text-sm">
            {lang === 'hi'
              ? 'उत्तर ब्रजेश जी की रिकॉर्डेड शिक्षाओं से।'
              : "Answers come from Brajesh ji's recorded teachings."}
          </p>
          <ChartChat input={input} lang={lang} />
        </section>

        <hr className="rule my-12" />
        <section className="max-w-folio mx-auto py-4 text-center">
          <a
            href="https://www.brajeshgautam.com/Contact-us"
            target="_blank"
            rel="noopener"
            className="btn-ink inline-block"
          >
            {lang === 'hi' ? 'व्यक्तिगत परामर्श बुक करें' : 'Book personal consultation'}
          </a>
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
