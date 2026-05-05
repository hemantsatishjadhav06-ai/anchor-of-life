'use client';
import KundliChart from '@/components/KundliChart';
import AstroWheel from './AstroWheel';
import type { Lang } from '@/lib/types';
import type { FullChart, Chart } from '@/lib/astrology/types';

const CHART_LABELS: Record<string, { en: string; hi: string }> = {
  d1:  { en: 'D-1 Lagna',                 hi: 'D-1 लग्न' },
  d9:  { en: 'D-9 Navamsa (Marriage)',    hi: 'D-9 नवांश (विवाह)' },
  d10: { en: 'D-10 Dasamsa (Career)',     hi: 'D-10 दशमांश (व्यवसाय)' },
  d7:  { en: 'D-7 Saptamsa (Children)',   hi: 'D-7 सप्तमांश (संतान)' },
  d12: { en: 'D-12 Dwadasamsa (Parents)', hi: 'D-12 द्वादशांश (माता-पिता)' },
  d30: { en: 'D-30 Trimsamsa (Hardships)',hi: 'D-30 त्रिंशांश (दुख)' },
};

export default function AllCharts({
  fc, lang, style,
}: {
  fc: FullChart;
  lang: Lang;
  style: 'south' | 'wheel';
}) {
  const charts: Array<{ key: keyof typeof CHART_LABELS; data: Chart }> = [
    { key: 'd1',  data: fc.d1 },
    { key: 'd9',  data: fc.d9 },
    { key: 'd10', data: fc.d10 },
    { key: 'd7',  data: fc.d7 },
    { key: 'd12', data: fc.d12 },
    { key: 'd30', data: fc.d30 },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {charts.map(({ key, data }) => (
        <figure key={key} className="space-y-2">
          <figcaption className="citation-meta text-center">
            {CHART_LABELS[key][lang]}
          </figcaption>
          <div className="flex justify-center">
            {style === 'wheel' ? (
              <AstroWheel chart={data} size={260} />
            ) : (
              <KundliChart chart={data} size={260} lang={lang} />
            )}
          </div>
          <p className="text-xs text-center text-ink-mute">
            {lang === 'hi' ? 'लग्न' : 'Lagna'} {data.ascSign} {data.ascDegreeInSign.toFixed(1)}°
          </p>
        </figure>
      ))}
    </div>
  );
}
