'use client';
import type { Lang } from '@/lib/types';
import type { FullChart, DoshaResult } from '@/lib/astrology/types';

const LABELS: Record<string, { en: string; hi: string }> = {
  mangal:    { en: 'Mangal Dosh',     hi: 'मंगल दोष' },
  kaalSarp:  { en: 'Kaal Sarp Dosh',  hi: 'काल सर्प दोष' },
  pitra:     { en: 'Pitra Dosh',      hi: 'पितृ दोष' },
  sadeSati:  { en: 'Sade Sati',       hi: 'साढ़े साती' },
};

export default function DoshaList({ fc, lang }: { fc: FullChart; lang: Lang }) {
  const items = fc.doshas ?? [];
  return (
    <section className="mb-8">
      <h3 className="font-display text-xl text-ink mb-4 font-medium">
        {lang === 'hi' ? 'दोष' : 'Doshas'}
      </h3>
      <ul className="space-y-3">
        {items.map((d: DoshaResult) => (
          <li
            key={d.key}
            className={`pl-4 border-l-2 ${d.present ? 'border-vermilion' : 'border-ink-line/40'}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold text-ink">
                {LABELS[d.key]?.[lang] ?? d.key}
              </span>
              <span className={`text-xs uppercase tracking-wider citation-meta ${
                d.present ? 'text-vermilion' : 'text-ink-mute'
              }`}>
                {d.present
                  ? (lang === 'hi' ? 'उपस्थित' : 'Present')
                  : (lang === 'hi' ? 'अनुपस्थित' : 'Not present')}
              </span>
            </div>
            <p className="text-sm text-ink-soft mt-0.5">{d.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
