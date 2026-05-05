// KP (Krishnamurti Paddhati) — V1 lite.
// Provides:
//   - 249-segment sub-lord table (Vimshottari proportions per nakshatra)
//   - Placidus house cusps (10-iter approximation)
//   - Cuspal sub-lord per house, planetary sub-lord (star/sub/sub-sub)
//
// Predictive KP rules are V2.

import * as Astronomy from 'astronomy-engine';
import type { Chart, KPReadout, KPSubLord, PlanetName } from './types';
import { MAHA_LORDS, MAHA_YEARS } from './dasha';

const NAKSHATRA_DEG = 360 / 27;

interface SubLordSegment {
  startLon: number;
  endLon: number;
  star: PlanetName;
  sub: PlanetName;
}

const SEGMENTS: SubLordSegment[] = (() => {
  const out: SubLordSegment[] = [];
  for (let n = 0; n < 27; n++) {
    const star = MAHA_LORDS[n % 9];
    const nakStart = n * NAKSHATRA_DEG;
    let cursor = nakStart;
    const startIdx = MAHA_LORDS.indexOf(star);
    for (let k = 0; k < 9; k++) {
      const sub = MAHA_LORDS[(startIdx + k) % 9];
      const fraction = MAHA_YEARS[sub] / 120;
      const segLen = NAKSHATRA_DEG * fraction;
      out.push({ startLon: cursor, endLon: cursor + segLen, star, sub });
      cursor += segLen;
    }
  }
  return out;
})();

export function subLordOf(longitude: number): KPSubLord {
  const lon = ((longitude % 360) + 360) % 360;
  const seg = SEGMENTS.find(s => lon >= s.startLon && lon < s.endLon) ?? SEGMENTS[SEGMENTS.length - 1];
  const subStartIdx = MAHA_LORDS.indexOf(seg.sub);
  const segLen = seg.endLon - seg.startLon;
  let cursor = seg.startLon;
  for (let k = 0; k < 9; k++) {
    const subSub = MAHA_LORDS[(subStartIdx + k) % 9];
    const fraction = MAHA_YEARS[subSub] / 120;
    const ssLen = segLen * fraction;
    if (lon < cursor + ssLen) {
      return { star: seg.star, sub: seg.sub, subSub };
    }
    cursor += ssLen;
  }
  return { star: seg.star, sub: seg.sub, subSub: seg.sub };
}

// ─── Placidus cusps ────────────────────────────────────────────────────────

function placidusIntermediate(housePos: number, lstDeg: number, epsRad: number, phiRad: number): number {
  // House 11: 1/3 of arc from MC to Asc (semi-arc method, north).
  // House 12: 2/3 of arc from MC to Asc.
  // House 2:  1/3 of arc from Asc to IC.
  // House 3:  2/3 of arc from Asc to IC.
  const fraction = housePos === 11 ? 1 / 3
                 : housePos === 12 ? 2 / 3
                 : housePos === 2  ? 1 / 3
                 : 2 / 3;
  const RA = (housePos === 11 || housePos === 12)
    ? lstDeg + 30 * (housePos - 10)
    : lstDeg + 30 * (housePos + 2);
  let lambda = RA;
  for (let it = 0; it < 12; it++) {
    const lambdaRad = lambda * Math.PI / 180;
    const decl = Math.asin(Math.sin(lambdaRad) * Math.sin(epsRad));
    const f = Math.tan(phiRad) * Math.tan(decl);
    const arg = -f * (1 - 2 * fraction);
    const clamped = Math.max(-0.999, Math.min(0.999, arg));
    const H = Math.acos(clamped);
    lambda = ((RA - H * 180 / Math.PI) % 360 + 360) % 360;
  }
  // Project lambda (RA) → ecliptic longitude.
  const lr = lambda * Math.PI / 180;
  let ec = Math.atan2(Math.sin(lr) * Math.cos(epsRad), Math.cos(lr));
  let ecDeg = ec * 180 / Math.PI;
  if (ecDeg < 0) ecDeg += 360;
  return ecDeg;
}

export function placidusCusps(date: Date, lat: number, lonEast: number, ayanamsa: number): number[] {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lstDeg = ((gst * 15 + lonEast) % 360 + 360) % 360;
  const epsRad = 23.4367 * Math.PI / 180;
  const phiRad = lat * Math.PI / 180;

  // MC tropical
  const ramcRad = lstDeg * Math.PI / 180;
  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  let mcDeg = ((mcRad * 180 / Math.PI) % 360 + 360) % 360;

  // Asc tropical
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(phiRad) * Math.sin(epsRad));
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  const diff = ((asc - lstDeg) % 360 + 360) % 360;
  if (diff > 180) asc = (asc + 180) % 360;

  const cuspsTrop = new Array<number>(12);
  cuspsTrop[0]  = asc;                                 // 1st = Asc
  cuspsTrop[9]  = mcDeg;                               // 10th = MC
  cuspsTrop[6]  = (asc + 180) % 360;                   // 7th = Desc
  cuspsTrop[3]  = (mcDeg + 180) % 360;                 // 4th = IC
  cuspsTrop[10] = placidusIntermediate(11, lstDeg, epsRad, phiRad);
  cuspsTrop[11] = placidusIntermediate(12, lstDeg, epsRad, phiRad);
  cuspsTrop[1]  = placidusIntermediate(2,  lstDeg, epsRad, phiRad);
  cuspsTrop[2]  = placidusIntermediate(3,  lstDeg, epsRad, phiRad);
  cuspsTrop[4]  = (cuspsTrop[10] + 180) % 360;
  cuspsTrop[5]  = (cuspsTrop[11] + 180) % 360;
  cuspsTrop[7]  = (cuspsTrop[1]  + 180) % 360;
  cuspsTrop[8]  = (cuspsTrop[2]  + 180) % 360;

  return cuspsTrop.map(c => ((c - ayanamsa) % 360 + 360) % 360);
}

export function computeKP(
  d1: Chart,
  date: Date,
  lat: number,
  lonEast: number,
  ayanamsa: number,
): KPReadout {
  const cusps = placidusCusps(date, lat, lonEast, ayanamsa);
  const cuspSubLords = cusps.map(c => subLordOf(c).sub);
  const planetSubLords: Partial<Record<PlanetName, KPSubLord>> = {};
  for (const p of d1.planets) {
    planetSubLords[p.name] = subLordOf(p.longitude);
  }
  return { cusps, cuspSubLords, planetSubLords };
}
