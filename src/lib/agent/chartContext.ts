// Serializes chart facts into compact LLM-readable text per tab,
// and builds tab-specific probe queries for transcript retrieval.

import type { FullChart, Chart } from '@/lib/astrology/types';

export type TabKey =
  | 'overview'
  | 'marriage'
  | 'career'
  | 'children'
  | 'parents'
  | 'hardships'
  | 'doshas-yogas'
  | 'dashas'
  | 'compare';

function fmtChart(c: Chart, label: string): string {
  const head = `${label} — Lagna ${c.ascSign} ${c.ascDegreeInSign.toFixed(1)}°.`;
  const planets = c.planets.map(
    p => `${p.name} ${p.sign} ${p.degreeInSign.toFixed(1)}° (h${p.house}, ${p.nakshatra} pada ${p.pada}${p.retrograde ? ', R' : ''})`,
  ).join('; ');
  return `${head}\n  ${planets}`;
}

export function chartContextFor(tab: TabKey, fc: FullChart): string {
  const lines: string[] = [];
  lines.push(`BIRTH: ${fc.input.placeName} ${fc.utcDate} (UTC). Lahiri ayanamsa ${fc.ayanamsa.toFixed(2)}°.`);
  lines.push(fmtChart(fc.d1, 'D-1 Lagna'));

  switch (tab) {
    case 'marriage':
      lines.push(fmtChart(fc.d9, 'D-9 Navamsa'));
      break;
    case 'career':
      lines.push(fmtChart(fc.d10, 'D-10 Dasamsa'));
      break;
    case 'children':
      lines.push(fmtChart(fc.d7, 'D-7 Saptamsa'));
      break;
    case 'parents':
      lines.push(fmtChart(fc.d12, 'D-12 Dwadasamsa'));
      break;
    case 'hardships':
      lines.push(fmtChart(fc.d30, 'D-30 Trimsamsa'));
      break;
  }

  if (fc.doshas?.length) {
    const present = fc.doshas.filter(d => d.present).map(d => `${d.key}: ${d.detail}`).join('; ');
    if (present) lines.push(`DOSHAS PRESENT: ${present}`);
  }
  if (fc.yogas?.length) {
    lines.push(`YOGAS: ${fc.yogas.map(y => `${y.name} (${y.detail})`).join('; ')}`);
  }
  if (fc.dasha) {
    lines.push(`ACTIVE DASHA: ${fc.dasha.activeMaha.lord} mahadasha / ${fc.dasha.activeAntar.lord} antardasha (until ${fc.dasha.activeAntar.end.slice(0, 10)})`);
  }
  return lines.join('\n');
}

const TAB_PROBES: Record<TabKey, (fc: FullChart) => string> = {
  overview: fc => {
    const moon = fc.d1.planets.find(p => p.name === 'Moon')!;
    return `lagna ${fc.d1.ascSign} ${moon.sign} moon life path overview`;
  },
  marriage: fc => {
    const v = fc.d1.planets.find(p => p.name === 'Venus')!;
    return `marriage spouse navamsa Venus ${v.sign} 7th house mangal dosh विवाह`;
  },
  career: fc => {
    const sun = fc.d1.planets.find(p => p.name === 'Sun')!;
    const sat = fc.d1.planets.find(p => p.name === 'Saturn')!;
    return `career profession dasamsa Sun ${sun.sign} Saturn ${sat.sign} 10th house व्यवसाय`;
  },
  children: fc => {
    const jup = fc.d1.planets.find(p => p.name === 'Jupiter')!;
    return `children santaan saptamsa Jupiter ${jup.sign} 5th house संतान`;
  },
  parents: () => `parents mother father 4th 9th house dwadasamsa माता पिता`,
  hardships: fc => {
    const sat = fc.d1.planets.find(p => p.name === 'Saturn')!;
    return `hardships dukh trimsamsa Saturn ${sat.sign} 6 8 12 dosha शनि`;
  },
  'doshas-yogas': fc => {
    const dlist = (fc.doshas ?? []).filter(d => d.present).map(d => d.key).join(' ');
    const ylist = (fc.yogas ?? []).map(y => y.name).join(' ');
    return `${dlist} ${ylist} dosha yoga remedy upay`.trim() || 'dosha yoga upay';
  },
  dashas: fc => `${fc.dasha?.activeMaha.lord ?? ''} mahadasha ${fc.dasha?.activeAntar.lord ?? ''} antardasha period दशा`,
  compare: () => `sidereal tropical KP comparison ज्योतिष पद्धति`,
};

export function probeQueryFor(tab: TabKey, fc: FullChart): string {
  return TAB_PROBES[tab](fc);
}
