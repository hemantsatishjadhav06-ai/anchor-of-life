'use client';
import type { Lang } from '@/lib/types';
import type { FullChart } from '@/lib/astrology/types';

export default function DashaTimeline({ fc, lang }: { fc: FullChart; lang: Lang }) {
  const dasha = fc.dasha;
  if (!dasha) return null;
  const { mahadashas, activeMaha, activeAntar } = dasha;

  const fmtDate = (iso: string) => iso.slice(0, 10);

  return (
    <section className="mb-8">
      <h3 className="font-display text-xl text-ink mb-4 font-medium">
        {lang === 'hi' ? 'विंशोत्तरी दशा' : 'Vimshottari Dasha'}
      </h3>
      <div className="mb-5 p-4 border border-vermilion/40 bg-paper-deep">
        <p className="citation-meta">{lang === 'hi' ? 'अभी सक्रिय' : 'Active right now'}</p>
        <p className="font-display text-lg text-ink mt-1">
          {activeMaha.lord} {lang === 'hi' ? 'महादशा' : 'mahadasha'}
          {' / '}
          {activeAntar.lord} {lang === 'hi' ? 'अंतर्दशा' : 'antardasha'}
        </p>
        <p className="text-sm text-ink-soft mt-1">
          {fmtDate(activeAntar.start)} → {fmtDate(activeAntar.end)}
        </p>
      </div>

      <ol className="space-y-1 text-sm">
        {mahadashas.map((m, i) => {
          const isActive = m.lord === activeMaha.lord && m.start === activeMaha.start;
          return (
            <li
              key={i}
              className={`flex justify-between gap-3 px-3 py-2 ${
                isActive ? 'bg-paper-deep border-l-2 border-vermilion text-ink' : 'text-ink-soft'
              }`}
            >
              <span className="font-medium">{m.lord}</span>
              <span className="text-ink-mute font-mono">
                {fmtDate(m.start)} → {fmtDate(m.end)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
