// Vedic astrology types — kundli computation + AI agent.

export type ZodiacMode = 'sidereal' | 'tropical';

export const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
] as const;
export type SignName = typeof SIGNS[number];

export const SIGNS_HI = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'] as const;
export const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'] as const;

// Sign rulers (classical Vedic)
export const SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'] as const;

export type PlanetName = 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'|'Rahu'|'Ketu';

export const PLANETS: Array<{ name: PlanetName; symbol: string; hi: string }> = [
  { name: 'Sun',     symbol: '☉', hi: 'सूर्य' },
  { name: 'Moon',    symbol: '☽', hi: 'चन्द्र' },
  { name: 'Mercury', symbol: '☿', hi: 'बुध' },
  { name: 'Venus',   symbol: '♀', hi: 'शुक्र' },
  { name: 'Mars',    symbol: '♂', hi: 'मंगल' },
  { name: 'Jupiter', symbol: '♃', hi: 'गुरु' },
  { name: 'Saturn',  symbol: '♄', hi: 'शनि' },
  { name: 'Rahu',    symbol: '☊', hi: 'राहु' },
  { name: 'Ketu',    symbol: '☋', hi: 'केतु' },
];

export interface PlanetPosition {
  name: PlanetName;
  symbol: string;
  longitude: number;       // 0-360
  signIndex: number;       // 0-11
  sign: SignName;
  degreeInSign: number;    // 0-30
  house: number;           // 1-12
  retrograde: boolean;
  nakshatra: string;
  nakshatraLord: PlanetName;
  pada: number;            // 1-4
}

export interface BirthInput {
  date: string;            // YYYY-MM-DD
  time: string;            // HH:MM (24h)
  tzOffsetMinutes: number; // signed minutes east of UTC (e.g. +330 for IST)
  lat: number;             // degrees, north positive
  lon: number;             // degrees, east positive
  placeName: string;
  name?: string;
}

export interface Chart {
  ascendant: number;       // longitude 0-360 (sidereal unless flagged otherwise)
  ascSignIndex: number;    // 0-11
  ascSign: SignName;
  ascDegreeInSign: number;
  planets: PlanetPosition[];
  // House cusps (whole-sign): house i contains the sign (ascSignIndex + i - 1) % 12
}

// ─── Vimshottari Dasha types ───────────────────────────────────────────────

export interface DashaResult {
  lord: PlanetName;
  start: string;           // ISO UTC
  end: string;             // ISO UTC
}

export interface DashaReadout {
  mahadashas: DashaResult[];        // 9 mahas covering ~120 years from birth
  activeMaha: DashaResult;          // Maha containing 'now'
  activeAntar: DashaResult;         // Antar within activeMaha containing 'now'
  birthMoonNakshatraIndex: number;
}

// ─── Doshas / Yogas ────────────────────────────────────────────────────────

export type DoshaKey = 'mangal' | 'kaalSarp' | 'pitra' | 'sadeSati';

export interface DoshaResult {
  key: DoshaKey;
  present: boolean;
  detail: string;
}

export interface YogaResult {
  key: string;
  name: string;
  planets: PlanetName[];
  detail: string;
}

// ─── KP (Krishnamurti) ─────────────────────────────────────────────────────

export interface KPSubLord {
  star: PlanetName;
  sub: PlanetName;
  subSub: PlanetName;
}

export interface KPReadout {
  cusps: number[];                              // 12 sidereal cusp longitudes (Placidus)
  cuspSubLords: PlanetName[];                   // 12 sub-lords, one per cusp
  planetSubLords: Partial<Record<PlanetName, KPSubLord>>;
}

// ─── FullChart bundle ──────────────────────────────────────────────────────

export interface FullChart {
  input: BirthInput;
  d1: Chart;
  d7: Chart;
  d9: Chart;
  d10: Chart;
  d12: Chart;
  d30: Chart;
  ayanamsa: number;
  utcDate: string;          // ISO UTC of birth moment
  bhavaChalit?: Chart;
  dasha?: DashaReadout;
  doshas?: DoshaResult[];
  yogas?: YogaResult[];
  kp?: KPReadout;
  sayana?: { d1: Chart };
}
