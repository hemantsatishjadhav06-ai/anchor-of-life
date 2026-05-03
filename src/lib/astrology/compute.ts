/**
 * Vedic kundli computation — ports the verified math from astro-explorer.
 *
 * Uses astronomy-engine (pure JS, MIT) for ephemeris.
 * Lahiri ayanamsa for sidereal conversion.
 * Whole-sign house system (standard Vedic).
 */
import * as Astronomy from 'astronomy-engine';
import {
  SIGNS, SIGN_LORDS, PLANETS,
  type Chart, type FullChart, type BirthInput, type PlanetName, type PlanetPosition,
} from './types';

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
] as const;

const VIMSHOTTARI_LORDS: PlanetName[] = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];

// ─── Core: convert birth input → UTC Date ──────────────────────────────────

export function birthToUtc(input: BirthInput): Date {
  const [y, m, d] = input.date.split('-').map(Number);
  const [hh, mm] = input.time.split(':').map(Number);
  // Local time at birth → UTC
  const localMs = Date.UTC(y, m - 1, d, hh, mm);
  return new Date(localMs - input.tzOffsetMinutes * 60_000);
}

// ─── Ephemeris ─────────────────────────────────────────────────────────────

function getEclipticLongitude(body: PlanetName, date: Date): number {
  if (body === 'Rahu' || body === 'Ketu') {
    return getMeanLunarNode(date, body === 'Ketu');
  }
  const time = Astronomy.MakeTime(date);
  let vec;
  if (body === 'Moon') {
    vec = Astronomy.GeoMoon(time);
  } else {
    // map our names to astronomy-engine Body enum strings
    vec = Astronomy.GeoVector(body as any, time, true);
  }
  const ecl = Astronomy.Ecliptic(vec);
  return ((ecl.elon % 360) + 360) % 360;
}

function getMeanLunarNode(date: Date, ketu: boolean): number {
  const J2000ms = Date.UTC(2000, 0, 1, 12, 0, 0);
  const T = (date.getTime() - J2000ms) / (36525 * 86400 * 1000);
  let lon = 125.04452 - 1934.13626 * T;
  lon = ((lon % 360) + 360) % 360;
  if (ketu) lon = (lon + 180) % 360;
  return lon;
}

// Lahiri ayanamsa
export function getAyanamsa(date: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const yearsSince = (date.getTime() - J2000) / (365.25 * 24 * 3600 * 1000);
  return 23.85 + 0.013979 * yearsSince;
}

function applyZodiac(longitude: number, date: Date, mode: 'sidereal' | 'tropical' = 'sidereal'): number {
  if (mode === 'sidereal') {
    return ((longitude - getAyanamsa(date)) % 360 + 360) % 360;
  }
  return longitude;
}

// Retrograde detection: planet is retrograde if its ecliptic longitude is decreasing
function isRetrograde(body: PlanetName, date: Date): boolean {
  if (body === 'Sun' || body === 'Moon') return false;          // luminaries never retrograde
  if (body === 'Rahu' || body === 'Ketu') return true;          // nodes always retrograde
  const dt = 60 * 60 * 1000;                                     // 1 hour delta
  const l1 = getEclipticLongitude(body, new Date(date.getTime() - dt));
  const l2 = getEclipticLongitude(body, new Date(date.getTime() + dt));
  // wrap
  let diff = l2 - l1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

// Ascendant from local sidereal time
function getAscendant(date: Date, lat: number, lonEast: number): number {
  const time = Astronomy.MakeTime(date);
  const gstHours = Astronomy.SiderealTime(time);
  const lstDeg = ((gstHours * 15 + lonEast) % 360 + 360) % 360;
  const epsRad = 23.4367 * Math.PI / 180;
  const phiRad = lat * Math.PI / 180;
  const ramcRad = lstDeg * Math.PI / 180;
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(phiRad) * Math.sin(epsRad));
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  const diff = ((asc - lstDeg) % 360 + 360) % 360;
  if (diff > 180) asc = (asc + 180) % 360;
  return asc;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function longitudeToSign(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30);
}

function houseFromAsc(planetLon: number, ascLon: number): number {
  const ascSign = longitudeToSign(ascLon);
  const planetSign = longitudeToSign(planetLon);
  return ((planetSign - ascSign + 12) % 12) + 1;
}

function getNakshatra(longitude: number): { name: string; lord: PlanetName; pada: number; index: number } {
  const lon = ((longitude % 360) + 360) % 360;
  const idx = Math.floor(lon * 27 / 360);
  const totalArcmin = lon * 60;
  const intoNakshatraArcmin = totalArcmin - idx * 800;
  const pada = Math.floor(intoNakshatraArcmin / 200) + 1;
  return {
    name: NAKSHATRAS[idx],
    index: idx,
    lord: VIMSHOTTARI_LORDS[idx % 9],
    pada,
  };
}

// Navamsa (D9) sign of a longitude
function navamsaSignOf(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  const signIdx = Math.floor(lon / 30);
  const degInSign = lon - signIdx * 30;
  const navIdx = Math.floor(degInSign * 3 / 10);
  let startSign;
  if (signIdx % 3 === 0) startSign = signIdx;
  else if (signIdx % 3 === 1) startSign = (signIdx + 8) % 12;
  else startSign = (signIdx + 4) % 12;
  return (startSign + navIdx) % 12;
}

// ─── Compute charts ────────────────────────────────────────────────────────

export function computeD1(date: Date, lat: number, lon: number): Chart {
  const ascRaw = getAscendant(date, lat, lon);
  const asc = applyZodiac(ascRaw, date, 'sidereal');
  const ascSignIndex = longitudeToSign(asc);

  const planets: PlanetPosition[] = PLANETS.map(p => {
    const rawLon = getEclipticLongitude(p.name, date);
    const sidLon = applyZodiac(rawLon, date, 'sidereal');
    const sigIdx = longitudeToSign(sidLon);
    const nak = getNakshatra(sidLon);
    return {
      name: p.name,
      symbol: p.symbol,
      longitude: sidLon,
      signIndex: sigIdx,
      sign: SIGNS[sigIdx],
      degreeInSign: sidLon - sigIdx * 30,
      house: houseFromAsc(sidLon, asc),
      retrograde: isRetrograde(p.name, date),
      nakshatra: nak.name,
      nakshatraLord: nak.lord,
      pada: nak.pada,
    };
  });

  return {
    ascendant: asc,
    ascSignIndex,
    ascSign: SIGNS[ascSignIndex],
    ascDegreeInSign: asc - ascSignIndex * 30,
    planets,
  };
}

export function computeD9(d1: Chart): Chart {
  const navAscSign = navamsaSignOf(d1.ascendant);
  const navAsc = navAscSign * 30 + (d1.ascendant % 30);

  const planets: PlanetPosition[] = d1.planets.map(p => {
    const navSign = navamsaSignOf(p.longitude);
    const newLon = navSign * 30 + p.degreeInSign;
    return {
      ...p,
      longitude: newLon,
      signIndex: navSign,
      sign: SIGNS[navSign],
      degreeInSign: p.degreeInSign,
      house: ((navSign - navAscSign + 12) % 12) + 1,
    };
  });

  return {
    ascendant: navAsc,
    ascSignIndex: navAscSign,
    ascSign: SIGNS[navAscSign],
    ascDegreeInSign: d1.ascendant % 30,
    planets,
  };
}

export function computeFullChart(input: BirthInput): FullChart {
  const utc = birthToUtc(input);
  const d1 = computeD1(utc, input.lat, input.lon);
  const d9 = computeD9(d1);
  return {
    input,
    d1,
    d9,
    ayanamsa: getAyanamsa(utc),
    utcDate: utc.toISOString(),
  };
}

// ─── Sign-lord helper ──────────────────────────────────────────────────────

export function lordOfSignIndex(signIndex: number): PlanetName {
  return SIGN_LORDS[signIndex] as PlanetName;
}

export function lordOfHouse(chart: Chart, house: number): PlanetName {
  // Whole-sign: house N's sign = (ascSign + N - 1) mod 12
  const sigIdx = (chart.ascSignIndex + house - 1) % 12;
  return SIGN_LORDS[sigIdx] as PlanetName;
}

export function planetsInHouse(chart: Chart, house: number): PlanetPosition[] {
  return chart.planets.filter(p => p.house === house);
}

export function planetByName(chart: Chart, name: PlanetName): PlanetPosition {
  return chart.planets.find(p => p.name === name)!;
}
