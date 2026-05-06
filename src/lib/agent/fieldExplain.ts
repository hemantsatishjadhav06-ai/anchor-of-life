// Per-prescription-field explainer — given a field name and the user's chart,
// returns a short deterministic chart-feature summary plus a transcript-grounded
// LLM explanation of WHY this field's value matches the chart.

import { hybridSearch, buildCitationsFromVideos } from '@/lib/search';
import { chat } from '@/lib/openrouter';
import { COMPOSER_MODEL } from '@/lib/env';
import type { AnswerEnvelope, Citation, Lang } from '@/lib/types';
import type { FullChart, PlanetName } from '@/lib/astrology/types';
import type { BGPrescription } from './prescriptionTypes';
import { chartContextFor } from './chartContext';

type FieldKey = keyof BGPrescription;

// Probe query per field — picks BG transcripts most relevant to this field.
const PROBES: Record<FieldKey, string> = {
  'Anjaan':                    'अनजान दान आटा donation flour stranger gareeb',
  'School':                    'विद्यालय school मूंग दाल बच्चे शिक्षा vidya',
  'Mandir / Gurudwara':        'मंदिर गुरुद्वारा दान काली दाल oil temple',
  'R Hand':                    'रत्न neelam pukhraj माणिक्य gemstone gold silver right hand',
  'L Hand':                    'left hand gemstone secondary planet bracelet',
  'Cow':                       'गाय गौ सेवा cow donation गेहूं चारा',
  'Mass (Non-Veg)':            'मांस non-veg समुद्री मछली seafood ban moon',
  'R Leg':                     'रंग color leg cloth नीला पीला कपड़ा',
  'L Leg':                     'रंग color leg cloth नीला पीला सफेद',
  'Rules (Neam)':              'नियम rule discipline 13 number saturn शनि',
  'Blind People':              'अंधे blind donation eye sun सूर्य',
  'Waist':                     'कमर waist cloth मूंग दाल digestive moon',
  'River':                     'नदी river दान moong dal पानी',
  'Tree':                      'पेड़ नीम पीपल बरगद tree worship',
  'Roots (Jad)':               'जड़ शहद घी root jad jupiter गुरु',
  'Pitr Gaya':                 'पितृ दोष gaya shraadh tripindi pitra ancestor',
  'Pitr Classes':              'पितृ कक्षा pitra ancestor severity',
  'Nose Septum (Nak ki Bali)': 'नाक की बाली nose ring मंगल venus woman',
  'Transe (Kinner)':           'किन्नर kinner transgender mars mercury',
  'Isht':                      'इष्ट देव deity hanuman krishna shiva ram lagna',
  'Pooja':                     'पूजा pooja vrat ritual remedy',
  'Devta':                     'कुलदेवता devta family deity lagna lord',
  'Business':                  'व्यवसाय business 7th 11th house partnership',
  'ownership':                 'मकान owner property 4th house ownership saturn',
  'Shadi':                     'शादी विवाह marriage 7th venus mangal dosh',
  'Comments':                  'overall chart summary main caution',
  'Recommended Videos':        'recommended teaching video upay donation',
};

// Short deterministic feature description per field — what chart facts drove the value.
export function chartFeaturesForField(field: FieldKey, fc: FullChart): string {
  const planets: Record<PlanetName, any> = {} as any;
  for (const p of fc.d1.planets) planets[p.name] = p;
  const lagnaSign = fc.d1.ascSign;
  const presentDoshas = (fc.doshas ?? []).filter(d => d.present);
  const doshaList = presentDoshas.map(d => d.detail).join('; ') || 'none detected';

  switch (field) {
    case 'Anjaan':
      return `Lagna ${lagnaSign}; total malefic burden + Sun ${planets.Sun.sign} h${planets.Sun.house}. Donation scaled to chart-wide stress.`;
    case 'School':
      return `5th house (education); Mercury ${planets.Mercury.sign} h${planets.Mercury.house}; Jupiter ${planets.Jupiter.sign} h${planets.Jupiter.house}.`;
    case 'Mandir / Gurudwara':
      return `9th house (dharma); Jupiter ${planets.Jupiter.sign} h${planets.Jupiter.house}.`;
    case 'R Hand':
      return `Right-hand gem strengthens the strongest benefic. Jupiter ${planets.Jupiter.sign} h${planets.Jupiter.house}; Venus ${planets.Venus.sign} h${planets.Venus.house}.`;
    case 'L Hand':
      return `Left-hand gem (secondary). Mercury ${planets.Mercury.sign} h${planets.Mercury.house}.`;
    case 'Cow':
      return `Moon (mother) ${planets.Moon.sign} h${planets.Moon.house}; 4th house support.`;
    case 'Mass (Non-Veg)':
      return `Moon ${planets.Moon.sign} (${['fire','earth','air','water'][planets.Moon.signIndex % 4]} element). Water-Moon → seafood restriction common.`;
    case 'R Leg':
      return `Right-leg colour targets Sun/Mars. Sun ${planets.Sun.sign} h${planets.Sun.house}; Mars ${planets.Mars.sign} h${planets.Mars.house}.`;
    case 'L Leg':
      return `Left-leg colour targets Moon/Venus. Moon ${planets.Moon.sign} h${planets.Moon.house}; Venus ${planets.Venus.sign} h${planets.Venus.house}.`;
    case 'Rules (Neam)':
      return `Saturn ${planets.Saturn.sign} h${planets.Saturn.house}. Number-rule range scales with Saturn strength.`;
    case 'Blind People':
      return `Triggered if Sun is afflicted. Sun ${planets.Sun.sign} h${planets.Sun.house}.`;
    case 'Waist':
      return `Triggered if Moon weak. Moon ${planets.Moon.sign} h${planets.Moon.house}.`;
    case 'River':
      return `Moon strength + water afflictions. ${presentDoshas.find(d => d.key === 'kaalSarp') ? 'Kaal Sarp Dosha present.' : ''}`;
    case 'Tree':
      return `Tree maps to the planet to placate. Saturn ${planets.Saturn.sign} h${planets.Saturn.house} (Peepal); Mars ${planets.Mars.sign} (Neem).`;
    case 'Roots (Jad)':
      return `Jupiter ${planets.Jupiter.sign} h${planets.Jupiter.house}; 5th house support. Honey-ghee ritual when Jupiter is weak.`;
    case 'Pitr Gaya':
      return `Pitra Dosha: ${presentDoshas.find(d => d.key === 'pitra') ? 'PRESENT — ' + presentDoshas.find(d => d.key === 'pitra')!.detail : 'not detected'}.`;
    case 'Pitr Classes':
      return `Severity of Pitra Dosha + Saturn ${planets.Saturn.sign} h${planets.Saturn.house}.`;
    case 'Nose Septum (Nak ki Bali)':
      return `For women: Mars ${planets.Mars.sign} h${planets.Mars.house}, Venus ${planets.Venus.sign} h${planets.Venus.house}.`;
    case 'Transe (Kinner)':
      return `Mars ${planets.Mars.sign}, Mercury ${planets.Mercury.sign}. Kinner-related yogas are rare.`;
    case 'Isht':
      return `Lagna ${lagnaSign}; Lagna lord placement; main planet to worship.`;
    case 'Pooja':
      return `Detected: ${doshaList}.`;
    case 'Devta':
      return `Kuldevta is family-specific. Grah Devta = Lagna lord placement.`;
    case 'Business':
      return `7th lord, 10th lord, 11th lord interplay. Saturn ${planets.Saturn.sign} h${planets.Saturn.house}.`;
    case 'ownership':
      return `4th house (property) + 10th lord. Saturn ${planets.Saturn.sign} h${planets.Saturn.house}.`;
    case 'Shadi':
      return `7th house + Venus ${planets.Venus.sign} h${planets.Venus.house}; Mangal Dosh ${presentDoshas.find(d => d.key === 'mangal') ? 'PRESENT' : 'absent'}.`;
    case 'Comments':
      return `Active dasha: ${fc.dasha?.activeMaha.lord ?? '—'} / ${fc.dasha?.activeAntar.lord ?? '—'}. Doshas: ${doshaList}.`;
    case 'Recommended Videos':
      return `Top BG videos covering the dominant chart themes.`;
  }
  return '';
}

const SYSTEM_PROMPT = `You are the editor of "Anchor of Life" explaining a SINGLE field of a Brajesh Gautam-style consultation prescription, grounded EXCLUSIVELY in the provided BG transcript excerpts.

The user wants to understand:
1. WHAT this field means in BG's framework.
2. WHY their chart yields this specific value (cite chart features given to you).
3. WHICH transcript moment supports the recommendation.

GOLDEN RULES:
1. Use ONLY the provided transcripts. If transcripts don't cover this field for this configuration, say so honestly.
2. Connect chart facts → BG's teaching → the recommendation. Make it concrete.
3. Cite each claim with {{cite:N}} markers.
4. Keep it to 2 short paragraphs (120–220 words total).
5. Match user's language (en/hi). Hindi answers in Devanagari.

OUTPUT FORMAT (strict JSON, nothing else):
{
  "answer_md": "explanation with {{cite:N}} markers",
  "primary_citation_index": 1,
  "lens": { "inner": bool, "jyotish": true, "practice": bool },
  "related_topics": [],
  "language": "en" | "hi"
}`;

export interface FieldExplainResult {
  field: FieldKey;
  recommendedValue: string;
  chartFeatures: string;
  envelope: AnswerEnvelope;
}

export async function generateFieldExplanation(
  field: FieldKey,
  recommendedValue: string,
  fc: FullChart,
  language: Lang,
): Promise<FieldExplainResult> {
  const chartFeatures = chartFeaturesForField(field, fc);
  const probe = PROBES[field];
  const result = await hybridSearch(probe, 4);
  const citations: Citation[] = buildCitationsFromVideos(result);
  const ctx = chartContextFor('overview', fc);

  const sources = citations.map((c, i) => {
    const m = Math.floor(c.start_sec / 60);
    const s = Math.floor(c.start_sec % 60);
    return `[Source ${i + 1}] "${c.title}" — at ${m}:${String(s).padStart(2, '0')}\n${c.quote}`;
  }).join('\n\n---\n\n');

  const userPrompt = `LANGUAGE: ${language}
FIELD: "${field}"
RECOMMENDED VALUE FOR THIS USER: "${recommendedValue || '(empty — explain why empty for this chart)'}"

CHART FEATURES THAT DRIVE THIS FIELD:
${chartFeatures}

USER'S FULL CHART:
${ctx}

BG TRANSCRIPT SOURCES (ranked by relevance to "${field}"):

${sources}

Compose a 2-paragraph explanation per the system instructions. Lead with what the field means and why this user's chart yields this specific value. Cite the transcripts.

Return ONLY the JSON object.`;

  const model = COMPOSER_MODEL;
  let envelope: AnswerEnvelope;

  if (citations.length === 0) {
    envelope = {
      answer_md: language === 'hi'
        ? `इस क्षेत्र पर ब्रजेश जी की रिकॉर्डेड शिक्षाओं में सीधी चर्चा नहीं मिली। **चार्ट पैरामीटर**: ${chartFeatures}\n\nव्यक्तिगत मार्गदर्शन के लिए कृपया परामर्श बुक करें।`
        : `Brajesh ji has not directly addressed this field in the recorded teachings for this configuration. **Chart drivers**: ${chartFeatures}\n\nFor personalized guidance, please book a consultation.`,
      primary_citation_index: 1,
      citations: [],
      lens: { inner: false, jyotish: true, practice: false },
      related_topics: [],
      language,
      total_mentions: 0,
      composer_model: 'no-sources',
    };
  } else {
    const raw = await chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        model,
        temperature: 0.3,
        max_tokens: 1000,
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
    envelope = {
      answer_md: String(parsed.answer_md ?? ''),
      primary_citation_index: Math.max(1, Math.min(citations.length, parseInt(parsed.primary_citation_index) || 1)),
      citations,
      lens: {
        inner: !!parsed.lens?.inner,
        jyotish: parsed.lens?.jyotish !== false,
        practice: !!parsed.lens?.practice,
      },
      related_topics: Array.isArray(parsed.related_topics) ? parsed.related_topics.slice(0, 5) : [],
      language: (parsed.language === 'hi' ? 'hi' : language) as Lang,
      total_mentions: 0,
      composer_model: model,
    };
  }

  return { field, recommendedValue, chartFeatures, envelope };
}
