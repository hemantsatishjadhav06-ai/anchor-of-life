// Bhava Chalit chart (Sripati cusps).
// Same planet longitudes as D-1, but houses are recomputed from
// real angular cusps (Asc, MC, IC, Desc) with intermediate cusps
// equally interpolated between angular cusps.
import * as Astronomy from 'astronomy-engine';
import type { Chart, PlanetPosition } from './types';

function mcTropical(date: Date, lonEast: number): number {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lstDeg = ((gst * 15 + lonEast) % 360 + 360) % 360;
  const epsRad = 23.4367 * Math.PI / 180;
  const ramcRad = lstDeg * Math.PI / 180;
  // MC = ecliptic longitude where the meridian (RA = LST) crosses the ecliptic.
  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  let mcDeg = mcRad * 180 / Math.PI;
  if (mcDeg < 0) mcDeg += 360;
  return mcDeg;
}

function span(a: number, b: number) {
  return ((b - a) % 360 + 360) % 360;
}

export function computeBhavaChalit(
  d1: Chart,
  date: Date,
  lonEast: number,
  ayanamsa: number,
): Chart {
  const asc = d1.ascendant;                                          // sidereal
  const mcSidereal = ((mcTropical(date, lonEast) - ayanamsa) % 360 + 360) % 360;
  const ic = (mcSidereal + 180) % 360;
  const desc = (asc + 180) % 360;

  const cusps = new Array<number>(12);
  cusps[0] = asc;
  cusps[3] = ic;
  cusps[6] = desc;
  cusps[9] = mcSidereal;

  function interpThird(start: number, end: number) {
    const s = span(start, end);
    return [(start + s / 3) % 360, (start + 2 * s / 3) % 360];
  }
  [cusps[1],  cusps[2]]  = interpThird(asc,         ic);
  [cusps[4],  cusps[5]]  = interpThird(ic,          desc);
  [cusps[7],  cusps[8]]  = interpThird(desc,        mcSidereal);
  [cusps[10], cusps[11]] = interpThird(mcSidereal,  asc);

  function houseOf(lon: number): number {
    for (let h = 0; h < 12; h++) {
      const a = cusps[h];
      const b = cusps[(h + 1) % 12];
      const offset = span(a, lon);
      const range = span(a, b);
      if (offset < range) return h + 1;
    }
    return 1;
  }

  const planets: PlanetPosition[] = d1.planets.map(p => ({
    ...p,
    house: houseOf(p.longitude),
  }));

  return {
    ascendant: d1.ascendant,
    ascSignIndex: d1.ascSignIndex,
    ascSign: d1.ascSign,
    ascDegreeInSign: d1.ascDegreeInSign,
    planets,
  };
}
