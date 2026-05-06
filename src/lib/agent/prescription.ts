// Generates the full Brajesh-Gautam-style 27-field consultation prescription
// in one LLM call, grounded in BG transcript excerpts retrieved by hybrid search.

import { hybridSearch, buildCitationsFromVideos } from '@/lib/search';
import { chat } from '@/lib/openrouter';
import { COMPOSER_MODEL } from '@/lib/env';
import type { Citation, Lang } from '@/lib/types';
import type { FullChart } from '@/lib/astrology/types';
import { chartContextFor } from './chartContext';
import { type BGPrescription, PRESCRIPTION_FIELDS } from './prescriptionTypes';

export type { BGPrescription } from './prescriptionTypes';
export { PRESCRIPTION_FIELDS } from './prescriptionTypes';

const SYSTEM_PROMPT = `You are the editor of "Anchor of Life" preparing a Brajesh Gautam-style 27-field consultation/remedy prescription for the user's kundli, grounded EXCLUSIVELY in the BG transcript excerpts provided.

For EACH of the 27 fields you MUST output a value. Use mixed Devanagari/English exactly as Brajesh ji speaks. Empty string ("") is allowed only when the chart genuinely has no remedy in that field.

EXAMPLES of how each field is filled (these are typical patterns — DO NOT copy verbatim, derive from the chart features and the cited transcripts):

- "Anjaan": "आटा 12 kg" or "आटा 5 kg + दाल" — what to donate to unknown people; quantity scaled to chart strength.
- "School": "मूंग दाल 5 kg + स्टेशनरी" — donation to schools.
- "Mandir / Gurudwara": "काली दाल 9 kg + ईंट" — donation to temple/gurudwara.
- "R Hand": "नीला + NEELAM 5-7 रत्ती चांदी" — gemstone, color, metal for right hand.
- "L Hand": "" — usually only one hand; pick based on the active malefic.
- "Cow": "गेहूं + चारा" — what to feed a cow.
- "Mass (Non-Veg)": "समुद्री बंद" — non-veg restrictions (often seafood ban for water-sign Moon).
- "R Leg": "नीला" — color of cloth/sock for right leg.
- "L Leg": "पीला" — color of cloth/sock for left leg.
- "Rules (Neam)": "1-13" — number-rule range from BG's system; can be a single rule "5" or a range.
- "Blind People": "" — donation to blind, often empty.
- "Waist": "" — waist cloth/belt color, often empty unless Moon is weak.
- "River": "मूंग दाल साबुत 9 kg" — what to flow into river.
- "Tree": "नीम" / "पीपल" / "बरगद" / "आम" — tree to water/worship.
- "Roots (Jad)": "शहद + घी 9 दिन" — root ritual, days.
- "Pitr Gaya": "हाँ" or "नहीं" — yes if Pitra Dosha is present.
- "Pitr Classes": "" — typically empty unless Pitra Dosha is severe.
- "Nose Septum (Nak ki Bali)": "" — for women with specific Mars/Venus configurations.
- "Transe (Kinner)": "" — donation to kinner community, often empty.
- "Isht": "Hanuman" / "Krishna" / "Shiva" / "Devi" / "Ram" / "Surya" — primary deity based on Lagna lord and chart.
- "Pooja": "गया श्राद्ध + त्रिपिंडी" — specific pujas to perform.
- "Devta": "no devta" or specific kuldevta/grah devta name.
- "Business": "No Business" / "Business OK" / "Partnership only" — based on 7th, 10th, 11th house.
- "ownership": "Not Owner" / "Owner OK" — based on 4th house and 10th lord.
- "Shadi": "OK after 28" / "Late marriage" / "Mangal dosh remedy needed" — marriage prospects from D-9 + 7th house.
- "Comments": ONE short sentence summarizing the chart's main caution. Mix Hindi-English: e.g., "Business yog nahi hai. Shaadi mein dikkat aayegi."
- "Recommended Videos": Comma-separated TITLES from the cited Sources (use the EXACT titles given — pick the 2–4 most relevant for this user).

CHART-DEPENDENT RULES (apply these when the chart matches; always validate against transcripts):
- Pitra Dosha present → "Pitr Gaya": "हाँ", "Pooja" includes Gaya Shraadh / Tripindi.
- Mangal Dosh in 7th → "Shadi" needs remedy, "Mass (Non-Veg)" may include restrictions.
- Saturn debilitated or in 6/8/12 → "Tree": "पीपल", colors include नीला / काला.
- Moon in water sign + weak → "Mass (Non-Veg)": "समुद्री बंद".
- Lagna lord = Mars → "Isht": "Hanuman"; Jupiter → "Vishnu/Krishna"; Sun → "Surya/Ram"; Moon → "Krishna/Devi"; Saturn → "Shani/Hanuman".
- Kaal Sarp Dosha → "River": "मूंग दाल साबुत 9 kg" or "नाग पंचमी पूजा".
- Jupiter weak in 5th → "Roots (Jad)": "शहद + घी 9 दिन".

OUTPUT FORMAT (strict JSON, every one of the 27 fields PRESENT, no extra fields, nothing else outside the JSON):
{
  "Anjaan": "...",
  "School": "...",
  "Mandir / Gurudwara": "...",
  "R Hand": "...",
  "L Hand": "...",
  "Cow": "...",
  "Mass (Non-Veg)": "...",
  "R Leg": "...",
  "L Leg": "...",
  "Rules (Neam)": "...",
  "Blind People": "...",
  "Waist": "...",
  "River": "...",
  "Tree": "...",
  "Roots (Jad)": "...",
  "Pitr Gaya": "...",
  "Pitr Classes": "...",
  "Nose Septum (Nak ki Bali)": "...",
  "Transe (Kinner)": "...",
  "Isht": "...",
  "Pooja": "...",
  "Devta": "...",
  "Business": "...",
  "ownership": "...",
  "Shadi": "...",
  "Comments": "...",
  "Recommended Videos": "..."
}`;

export interface PrescriptionResult {
  prescription: BGPrescription;
  citations: Citation[];
  composer_model: string;
}

export async function generatePrescription(fc: FullChart, language: Lang): Promise<PrescriptionResult> {
  const saturn = fc.d1.planets.find(p => p.name === 'Saturn')!;
  const moon = fc.d1.planets.find(p => p.name === 'Moon')!;
  const presentDoshas = (fc.doshas ?? []).filter(d => d.present).map(d => d.key).join(' ');
  const probe = `upay remedy upaya donation दान ${fc.d1.ascSign} lagna ${moon.sign} moon ${saturn.sign} saturn ${presentDoshas} pooja vrat`.trim();

  const result = await hybridSearch(probe, 6);
  const citations = buildCitationsFromVideos(result);
  const ctx = chartContextFor('overview', fc);

  const sources = citations.map((c, i) => {
    const m = Math.floor(c.start_sec / 60);
    const s = Math.floor(c.start_sec % 60);
    return `[Source ${i + 1}] "${c.title}" — at ${m}:${String(s).padStart(2, '0')}\n${c.quote}`;
  }).join('\n\n---\n\n');

  const userPrompt = `LANGUAGE: ${language}

USER'S CHART:
${ctx}

BG TRANSCRIPT SOURCES (ranked by relevance — use ONLY these):

${sources}

Fill the entire 27-field prescription JSON per the system instructions. Return ONLY the JSON object — no markdown, no preamble, nothing outside the braces.`;

  const model = COMPOSER_MODEL;
  const raw = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      model,
      temperature: 0.25,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    },
  );

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  }

  const prescription = PRESCRIPTION_FIELDS.reduce((acc, k) => {
    acc[k] = String(parsed[k] ?? '');
    return acc;
  }, {} as BGPrescription);

  return { prescription, citations, composer_model: model };
}
