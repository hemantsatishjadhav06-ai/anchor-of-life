// Client-safe types and field constants for the BG prescription.
// Kept separate from prescription.ts so that client components don't pull
// the server-only retrieval/LLM stack into their bundle.

export interface BGPrescription {
  Anjaan: string;
  School: string;
  'Mandir / Gurudwara': string;
  'R Hand': string;
  'L Hand': string;
  Cow: string;
  'Mass (Non-Veg)': string;
  'R Leg': string;
  'L Leg': string;
  'Rules (Neam)': string;
  'Blind People': string;
  Waist: string;
  River: string;
  Tree: string;
  'Roots (Jad)': string;
  'Pitr Gaya': string;
  'Pitr Classes': string;
  'Nose Septum (Nak ki Bali)': string;
  'Transe (Kinner)': string;
  Isht: string;
  Pooja: string;
  Devta: string;
  Business: string;
  ownership: string;
  Shadi: string;
  Comments: string;
  'Recommended Videos': string;
}

export const PRESCRIPTION_FIELDS: (keyof BGPrescription)[] = [
  'Anjaan', 'School', 'Mandir / Gurudwara',
  'R Hand', 'L Hand', 'R Leg', 'L Leg',
  'Cow', 'Mass (Non-Veg)', 'Rules (Neam)',
  'Blind People', 'Waist', 'River', 'Tree', 'Roots (Jad)',
  'Pitr Gaya', 'Pitr Classes',
  'Nose Septum (Nak ki Bali)', 'Transe (Kinner)',
  'Isht', 'Pooja', 'Devta',
  'Business', 'ownership', 'Shadi',
  'Comments', 'Recommended Videos',
];
