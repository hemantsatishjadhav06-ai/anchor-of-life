// Vimshottari Mahadasha + Antardasha computation.
// Total cycle = 120 years across 9 lords. The lord at birth is determined
// by the Moon's nakshatra; the portion of the first dasha already elapsed
// at birth = (deg-into-nakshatra / 13°20') × that lord's full years.

import type { PlanetName, DashaResult, DashaReadout } from './types';

export const MAHA_LORDS: PlanetName[] = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
];

export const MAHA_YEARS: Record<PlanetName, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18,
  Jupiter: 16, Saturn: 19, Mercury: 17,
} as Record<PlanetName, number>;

const YEAR_MS = 365.25 * 86400 * 1000;
const NAKSHATRA_DEG = 360 / 27;

export function nakshatraIndex(moonLon: number): number {
  const lon = ((moonLon % 360) + 360) % 360;
  return Math.floor(lon / NAKSHATRA_DEG);
}

function lordOfNakshatra(nakIdx: number): PlanetName {
  return MAHA_LORDS[nakIdx % 9];
}

function addYears(t: number, years: number): number {
  return t + years * YEAR_MS;
}

export function computeVimshottari(moonLon: number, birth: Date, now: Date = new Date()): DashaReadout {
  const nakIdx = nakshatraIndex(moonLon);
  const lord0 = lordOfNakshatra(nakIdx);
  const intoNak = ((moonLon % NAKSHATRA_DEG) + NAKSHATRA_DEG) % NAKSHATRA_DEG;
  const fractionElapsed = intoNak / NAKSHATRA_DEG;
  const firstMahaRemainingYears = MAHA_YEARS[lord0] * (1 - fractionElapsed);

  const mahadashas: DashaResult[] = [];
  let cursorMs = birth.getTime();
  const lordIdx = MAHA_LORDS.indexOf(lord0);

  // First (partial) maha
  const firstEnd = addYears(cursorMs, firstMahaRemainingYears);
  mahadashas.push({
    lord: lord0,
    start: new Date(cursorMs).toISOString(),
    end: new Date(firstEnd).toISOString(),
  });
  cursorMs = firstEnd;

  // Next 8 full mahas — completes the 120-year cycle from this nakshatra.
  for (let k = 1; k < 9; k++) {
    const lord = MAHA_LORDS[(lordIdx + k) % 9];
    const end = addYears(cursorMs, MAHA_YEARS[lord]);
    mahadashas.push({
      lord,
      start: new Date(cursorMs).toISOString(),
      end: new Date(end).toISOString(),
    });
    cursorMs = end;
  }

  const nowMs = now.getTime();
  const activeMaha =
    mahadashas.find(m => nowMs >= new Date(m.start).getTime() && nowMs < new Date(m.end).getTime())
    ?? mahadashas[0];

  // Antardashas: 9 sub-periods within active maha. Length per sub-lord =
  // (sub_lord_full_years × maha_total_years) / 120.
  const mahaStart = new Date(activeMaha.start).getTime();
  const mahaTotalYears = MAHA_YEARS[activeMaha.lord];
  const antardashas: DashaResult[] = [];
  let antarCursor = mahaStart;
  const startIdx = MAHA_LORDS.indexOf(activeMaha.lord);
  for (let k = 0; k < 9; k++) {
    const sub = MAHA_LORDS[(startIdx + k) % 9];
    const yrs = (MAHA_YEARS[sub] * mahaTotalYears) / 120;
    const end = addYears(antarCursor, yrs);
    antardashas.push({
      lord: sub,
      start: new Date(antarCursor).toISOString(),
      end: new Date(end).toISOString(),
    });
    antarCursor = end;
  }
  const activeAntar =
    antardashas.find(a => nowMs >= new Date(a.start).getTime() && nowMs < new Date(a.end).getTime())
    ?? antardashas[0];

  return {
    mahadashas,
    activeMaha,
    activeAntar,
    birthMoonNakshatraIndex: nakIdx,
  };
}
