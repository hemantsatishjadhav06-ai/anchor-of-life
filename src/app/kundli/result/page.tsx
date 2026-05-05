'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import KundliChart from '@/components/KundliChart';
import AstroWheel from '@/components/kundli/AstroWheel';
import TabBar from '@/components/kundli/TabBar';
import ChartToolbar, { ChartStyle, ChartSystem } from '@/components/kundli/ChartToolbar';
import Reading from '@/components/kundli/Reading';
import ChartChat from '@/components/kundli/ChartChat';
import DoshaList from '@/components/kundli/DoshaList';
import YogaList from '@/components/kundli/YogaList';
import DashaTimeline from '@/components/kundli/DashaTimeline';
import CompareSystems from '@/components/kundli/CompareSystems';
import type { TabKey } from '@/lib/agent/chartContext';
import type { FullChart, BirthInput, Chart } from '@/lib/astrology/types';

interface StoredInputShape {
  name?: string;
  date: string;
  time: string;
  place: { short: string; lat: number; lon: number; tz: string; tz_offset_minutes: number };
}

const TAB_LABELS: Record<TabKey, { en: string; hi: string }> = {
  overview:       { en: 'Overview',       hi: 'सारांश' },
  marriage:       { en: 'Marriage',       hi: 'विवाह' },
  career:         { en: 'Career',         hi: 'व्यवसाय' },
  children:       { en: 'Children',       hi: 'संतान' },
  parents:        { en: 'Parents',        hi: 'माता-पिता' },
  hardships:      { en: 'Hardships',      hi: 'दुख-कष्ट' },
  'doshas-yogas': { en: 'Doshas & Yogas', hi: 'दोष व योग' },
  dashas:         { en: 'Dashas',         hi: 'दशाएँ' },
  compare:        { en: 'Compare',        hi: 'तुलना' },
};

function chartForTab(
  tab: TabKey,
  fc: FullChart,
  system: ChartSystem,
  bhavaChalit: boolean,
): Chart {
  // System=Sayana applies only to D-1; otherwise Sidereal divisional charts.
  if (tab === 'marriage') return fc.d9;
  if (tab === 'career')   return fc.d10;
  if (tab === 'children') return fc.d7;
  if (tab === 'parents')  return fc.d12;
  if (tab === 'hardships') return fc.d30;
  // Overview / dashas / doshas-yogas / compare → D-1 (with optional Sayana / Bhava Chalit)
  if (system === 'sayana' && fc.sayana?.d1) return fc.sayana.d1;
  if (bhavaChalit && fc.bhavaChalit) return fc.bhavaChalit;
  return fc.d1;
}

function ResultInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = (sp.get('lang') === 'hi' ? 'hi' : 'en') as 'en' | 'hi';

  const [chart, setChart] = useState<FullChart | null>(null);
  const [input, setInput] = useState<BirthInput | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [style, setStyle] = useState<ChartStyle>('south');
  const [system, setSystem] = useState<ChartSystem>('sidereal');
  const [bhavaChalit, setBhavaChalit] = useState(false);

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

  // ALL hooks must run on every render — never call hooks after a conditional return.
  const activeChart = useMemo(
    () => (chart ? chartForTab(tab, chart, system, bhavaChalit) : null),
    [tab, chart, system, bhavaChalit],
  );

  if (!chart || !input || !activeChart) {
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

  const cusps = system === 'kp' && tab !== 'compare' ? chart.kp?.cusps : undefined;
  const showSystem = tab === 'overview' || tab === 'compare';
  const tabTitle = TAB_LABELS[tab][lang];

  let panel: React.ReactNode;
  if (tab === 'compare') {
    panel = <CompareSystems fc={chart} lang={lang} />;
  } else if (tab === 'dashas') {
    panel = (
      <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
        <DashaTimeline fc={chart} lang={lang} />
        <div>
          <h3 className="font-display text-xl text-ink mb-4 font-medium">
            {lang === 'hi' ? 'ब्रजेश जी की शिक्षा' : "What Brajesh ji teaches"}
          </h3>
          <Reading tab={tab} input={input} lang={lang} />
        </div>
      </div>
    );
  } else if (tab === 'doshas-yogas') {
    panel = (
      <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
        <div>
          <DoshaList fc={chart} lang={lang} />
          <YogaList fc={chart} lang={lang} />
        </div>
        <div>
          <h3 className="font-display text-xl text-ink mb-4 font-medium">
            {lang === 'hi' ? 'ब्रजेश जी की शिक्षा' : "What Brajesh ji teaches"}
          </h3>
          <Reading tab={tab} input={input} lang={lang} />
        </div>
      </div>
    );
  } else {
    panel = (
      <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
        <div className="space-y-3">
          {style === 'wheel' ? (
            <AstroWheel chart={activeChart} size={380} cusps={cusps} />
          ) : (
            <KundliChart chart={activeChart} size={360} lang={lang} title={tabTitle} />
          )}
          <p className="citation-meta text-center">
            {tabTitle} · {lang === 'hi' ? 'लग्न' : 'Lagna'} {activeChart.ascSign} {activeChart.ascDegreeInSign.toFixed(1)}°
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl text-ink mb-4 font-medium">
            {tab === 'overview'
              ? (lang === 'hi' ? 'समग्र पठन' : 'Top-line reading')
              : (lang === 'hi' ? 'ब्रजेश जी की शिक्षा' : "What Brajesh ji teaches")}
          </h3>
          <Reading tab={tab} input={input} lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <Link href={`/kundli?lang=${lang}`} className="btn-text">
          ← {lang === 'hi' ? 'नई कुंडली' : 'New kundli'}
        </Link>

        <header className="mt-6 mb-8 max-w-folio">
          <p className="citation-meta">{lang === 'hi' ? 'कुंडली' : 'Kundli'}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl text-ink leading-tight font-bold">
            {input.name || (lang === 'hi' ? 'आपकी कुंडली' : 'Your kundli')}
          </h1>
          <p className="mt-3 text-ink-soft text-sm font-medium">
            {input.date} · {input.time} · {input.placeName}
          </p>
        </header>

        <TabBar active={tab} onChange={setTab} lang={lang} />
        <ChartToolbar
          style={style}
          onStyle={setStyle}
          system={system}
          onSystem={setSystem}
          bhavaChalit={bhavaChalit}
          onBhavaChalit={setBhavaChalit}
          lang={lang}
          hideSystem={!showSystem}
        />

        {panel}

        <hr className="rule my-12" />

        <section className="max-w-folio mx-auto">
          <h2 className="font-display text-2xl text-ink mb-2 font-medium">
            {lang === 'hi' ? 'इस कुंडली के बारे में पूछिए' : 'Ask about your chart'}
          </h2>
          <p className="text-ink-soft mb-6 text-sm">
            {lang === 'hi'
              ? 'उत्तर ब्रजेश जी की रिकॉर्डेड शिक्षाओं से ही आएगा।'
              : "Answers come strictly from Brajesh ji's recorded teachings."}
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
