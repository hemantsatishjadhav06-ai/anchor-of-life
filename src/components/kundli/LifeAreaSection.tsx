'use client';
import KundliChart from '@/components/KundliChart';
import Reading from './Reading';
import type { Lang } from '@/lib/types';
import type { Chart, BirthInput } from '@/lib/astrology/types';
import type { TabKey } from '@/lib/agent/chartContext';

interface Props {
  tab: TabKey;
  divisional: Chart;
  input: BirthInput;
  lang: Lang;
  title: { en: string; hi: string };
  subtitle?: { en: string; hi: string };
  chartLabel: { en: string; hi: string };
}

export default function LifeAreaSection({
  tab, divisional, input, lang, title, subtitle, chartLabel,
}: Props) {
  return (
    <section className="mb-14">
      <h2 className="font-display text-2xl text-ink mb-1 font-medium">
        {title[lang]}
      </h2>
      {subtitle && (
        <p className="text-ink-soft text-sm mb-6">{subtitle[lang]}</p>
      )}
      <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
        <figure className="space-y-2">
          <KundliChart chart={divisional} size={300} lang={lang} title={chartLabel[lang]} />
          <p className="text-xs text-center text-ink-mute">
            {lang === 'hi' ? 'लग्न' : 'Lagna'} {divisional.ascSign} {divisional.ascDegreeInSign.toFixed(1)}°
          </p>
        </figure>
        <Reading tab={tab} input={input} lang={lang} />
      </div>
    </section>
  );
}
