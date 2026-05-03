// Vedic astrology types — kundli computation + BG 20-field prescription.

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
  longitude: number;       // 0-360 sidereal
  signIndex: number;       // 0-11
  sign: SignName;
  degreeInSign: number;    // 0-30
  house: number;           // 1-12 (whole-sign from lagna)
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
  ascendant: number;       // sidereal longitude 0-360
  ascSignIndex: number;    // 0-11
  ascSign: SignName;
  ascDegreeInSign: number;
  planets: PlanetPosition[];
  // House cusps (whole-sign): house i contains the sign (ascSignIndex + i - 1) % 12
}

export interface FullChart {
  input: BirthInput;
  d1: Chart;        // Lagna (Rasi) chart — Lahiri sidereal
  d9: Chart;        // Navamsa
  // potential: d10 (Dashamsa), d12 (Dwadasamsa), etc.
  ayanamsa: number;
  utcDate: string;  // ISO UTC of birth moment
}

// ─── BG 20-field prescription format ──────────────────────────────────────
export type FieldKey =
  | 'Anjaan'
  | 'School'
  | 'Mandir / Gurudwara'
  | 'R Hand'
  | 'L Hand'
  | 'Cow'
  | 'Mass (Non-Veg)'
  | 'R Leg'
  | 'L Leg'
  | 'Rules (Neam)'
  | 'Blind People'
  | 'Waist'
  | 'River'
  | 'Tree'
  | 'Roots (Jad)'
  | 'Pitr Gaya'
  | 'Pitr Classes'
  | 'Nose Septum (Nak ki Bali)'
  | 'Transe (Kinner)'
  | 'Pooja'
  | 'Devta';

export const FIELD_KEYS: FieldKey[] = [
  'Anjaan','School','Mandir / Gurudwara','R Hand','L Hand','Cow','Mass (Non-Veg)',
  'R Leg','L Leg','Rules (Neam)','Blind People','Waist','River','Tree','Roots (Jad)',
  'Pitr Gaya','Pitr Classes','Nose Septum (Nak ki Bali)','Transe (Kinner)','Pooja','Devta',
];

export interface FieldRecommendation {
  key: FieldKey;
  value: string;            // primary recommendation (e.g., "donate aata 1.25 kg")
  detail: string;           // short rationale citing chart features
  intensity: 'mandatory' | 'recommended' | 'optional' | 'avoid';
}

export interface Prescription {
  fields: Record<FieldKey, FieldRecommendation>;
  summary: string;          // 2-3 sentence chart summary
  doshas: string[];         // detected doshas: 'Mangal Dosha', 'Pitr Dosha', etc.
  highlights: string[];     // notable yogas / placements
}
