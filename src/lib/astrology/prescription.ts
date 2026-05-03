/**
 * BG's 20-field consultation prescription engine.
 *
 * Maps chart features (lagna, planet placements, doshas) to the 20 fields
 * Brajesh Gautam fills out during a personal consultation.
 *
 * V1: rule-based heuristics from classical Vedic principles. The actual
 * BG consultation logic comes from his recorded examples (when supplied
 * via the Drive folder); this engine is the framework his examples can
 * refine.
 *
 * Each rule cites WHY it triggered, so the user can see the reasoning.
 */
import {
  type Chart, type FullChart, type FieldKey, type FieldRecommendation, type Prescription,
  type PlanetName, type PlanetPosition, FIELD_KEYS,
} from './types';
import { lordOfHouse, planetsInHouse, planetByName } from './compute';

// ─── Detect doshas ─────────────────────────────────────────────────────────

function detectMangalDosha(d1: Chart): boolean {
  // Mars in 1, 2, 4, 7, 8, 12 from lagna = Mangal Dosha
  const mars = planetByName(d1, 'Mars');
  return [1, 2, 4, 7, 8, 12].includes(mars.house);
}

function detectPitrDosha(d1: Chart): boolean {
  // Sun + Rahu OR Sun + Ketu in same house = classical Pitr Dosh marker
  const sun = planetByName(d1, 'Sun');
  const rahu = planetByName(d1, 'Rahu');
  const ketu = planetByName(d1, 'Ketu');
  return sun.house === rahu.house || sun.house === ketu.house;
}

function detectKaalSarpaDosha(d1: Chart): boolean {
  // All 7 traditional planets between Rahu and Ketu = Kaal Sarpa
  const rahu = planetByName(d1, 'Rahu');
  const ketu = planetByName(d1, 'Ketu');
  const others = d1.planets.filter(p => !['Rahu', 'Ketu'].includes(p.name));
  // Calculate Rahu-Ketu axis longitudes
  const r = rahu.longitude;
  const k = ketu.longitude;
  const sameSide = (lon: number): boolean => {
    // Walk forward from Rahu around the zodiac; if we hit Ketu first, the planet must be in [r, k] arc
    const forwardArc = ((k - r + 360) % 360);
    const planetArc = ((lon - r + 360) % 360);
    return planetArc < forwardArc;
  };
  const firstSide = sameSide(others[0].longitude);
  return others.every(p => sameSide(p.longitude) === firstSide);
}

function detectShaniSadeSati(d1: Chart): { active: boolean; phase?: 'first' | 'peak' | 'last' } {
  // Sade Sati = Saturn transiting houses 12, 1, 2 from Moon
  // Without transit data, we approximate by Saturn's natal house from Moon
  const moon = planetByName(d1, 'Moon');
  const saturn = planetByName(d1, 'Saturn');
  const houseFromMoon = ((saturn.signIndex - moon.signIndex + 12) % 12) + 1;
  if (houseFromMoon === 12) return { active: true, phase: 'first' };
  if (houseFromMoon === 1) return { active: true, phase: 'peak' };
  if (houseFromMoon === 2) return { active: true, phase: 'last' };
  return { active: false };
}

// ─── Color logic (for hand/leg threads) ────────────────────────────────────

function colorForBenefic(): string { return 'yellow + white'; }
function colorForMalefic(): string { return 'red + black'; }
function colorForLagnaLord(name: PlanetName): string {
  const map: Record<PlanetName, string> = {
    Sun: 'red', Mars: 'red', Jupiter: 'yellow',
    Moon: 'white', Venus: 'pink', Mercury: 'green',
    Saturn: 'blue / black', Rahu: 'grey', Ketu: 'multi-color',
  };
  return map[name] ?? 'red';
}

// ─── Devta (guardian deity) by lagna ───────────────────────────────────────

function devtaForLagna(ascSignIndex: number): { devta: string; pooja: string } {
  // Standard Vedic mapping of lagna → ishta devta
  const map = [
    { devta: 'Hanuman ji', pooja: 'Hanuman Chalisa daily, Tuesday & Saturday'   }, // Aries
    { devta: 'Lakshmi ji', pooja: 'Sri Sukta, Friday Lakshmi puja'                }, // Taurus
    { devta: 'Vishnu ji',  pooja: 'Vishnu Sahasranama, Wednesday & Thursday'     }, // Gemini
    { devta: 'Shiv ji',    pooja: 'Mahamrityunjay mantra, Monday Shiv puja'      }, // Cancer
    { devta: 'Surya Dev',  pooja: 'Aditya Hridayam, Sunday at sunrise'           }, // Leo
    { devta: 'Vishnu ji',  pooja: 'Vishnu Sahasranama, Wednesday'                }, // Virgo
    { devta: 'Lakshmi ji', pooja: 'Friday Lakshmi puja, Mahalakshmi mantra'      }, // Libra
    { devta: 'Hanuman ji', pooja: 'Hanuman Chalisa, Tuesday'                     }, // Scorpio
    { devta: 'Vishnu ji',  pooja: 'Vishnu Sahasranama, Thursday Brihaspati puja' }, // Sagittarius
    { devta: 'Shani Dev',  pooja: 'Saturday Shani puja, Hanuman Chalisa'         }, // Capricorn
    { devta: 'Shani Dev',  pooja: 'Saturday Shani puja'                          }, // Aquarius
    { devta: 'Vishnu ji',  pooja: 'Vishnu Sahasranama, Thursday'                 }, // Pisces
  ];
  return map[ascSignIndex];
}

// ─── Build prescription ────────────────────────────────────────────────────

function rec(value: string, detail: string, intensity: FieldRecommendation['intensity'] = 'recommended'): FieldRecommendation {
  return { key: '' as FieldKey, value, detail, intensity };
}

export function buildPrescription(full: FullChart): Prescription {
  const { d1 } = full;
  const lagna = d1.ascSign;
  const lagnaLord = lordOfHouse(d1, 1);
  const sun = planetByName(d1, 'Sun');
  const moon = planetByName(d1, 'Moon');
  const mars = planetByName(d1, 'Mars');
  const mercury = planetByName(d1, 'Mercury');
  const jupiter = planetByName(d1, 'Jupiter');
  const venus = planetByName(d1, 'Venus');
  const saturn = planetByName(d1, 'Saturn');
  const rahu = planetByName(d1, 'Rahu');
  const ketu = planetByName(d1, 'Ketu');

  const mangalDosha = detectMangalDosha(d1);
  const pitrDosha = detectPitrDosha(d1);
  const kaalSarpa = detectKaalSarpaDosha(d1);
  const sadeSati = detectShaniSadeSati(d1);

  const doshas: string[] = [];
  if (mangalDosha) doshas.push('Mangal Dosha');
  if (pitrDosha) doshas.push('Pitr Dosha');
  if (kaalSarpa) doshas.push('Kaal Sarpa Dosha');
  if (sadeSati.active) doshas.push(`Shani Sade Sati (${sadeSati.phase})`);

  const highlights: string[] = [];
  // Common yogas / placements worth flagging
  if (jupiter.house === 1 || jupiter.house === 5 || jupiter.house === 9 || jupiter.house === 10) {
    highlights.push(`Strong Jupiter in ${jupiter.house}th — favors wisdom, dharma`);
  }
  if (venus.house === 7 && !mangalDosha) highlights.push('Venus in 7th — favorable for marriage');
  if (saturn.house === 1) highlights.push('Saturn in lagna — life of discipline & long karmic work');
  if (sun.house === 10) highlights.push('Sun in 10th — natural authority, public role');
  if (rahu.house === 10 || rahu.house === 7) highlights.push(`Rahu in ${rahu.house}th — strong worldly ambition`);

  const fields: Partial<Record<FieldKey, FieldRecommendation>> = {};

  // 1. Anjaan — donate to unknown people
  // Triggered by: Rahu strong, Saturn afflicted, generally everyone gets some Anjaan
  if (rahu.house === 1 || rahu.house === 5 || rahu.house === 9 || saturn.house === 6 || saturn.house === 8 || saturn.house === 12) {
    fields['Anjaan'] = rec(
      'aata 1.25 kg + chini 250g + ghee small to a stranger',
      `Rahu in ${rahu.house}th and/or Saturn placement suggests karmic offerings to unknown people`,
      'recommended');
  } else {
    fields['Anjaan'] = rec(
      'aata 250g once a week to an unknown person',
      'baseline anjaan offering — clears latent karma',
      'optional');
  }

  // 2. School — Mercury / 5th house signal
  if (mercury.house === 5 || mercury.house === 6 || mercury.house === 8 || mercury.house === 12 ||
      lordOfHouse(d1, 5) === mercury.name) {
    fields['School'] = rec(
      'stationery / books / fees to a needy school child',
      `Mercury in ${mercury.house}th — supports children's education karma`,
      'recommended');
  } else {
    fields['School'] = rec(
      'pencils + notebooks once a year to a school',
      'baseline school offering for Mercury balance',
      'optional');
  }

  // 3. Mandir / Gurudwara — Sun-related
  if (sun.house === 6 || sun.house === 8 || sun.house === 12 || sun.retrograde) {
    fields['Mandir / Gurudwara'] = rec(
      'visit mandir every Sunday + offer ghee diya',
      `Sun in ${sun.house}th house — needs strengthening`,
      'mandatory');
  } else {
    fields['Mandir / Gurudwara'] = rec(
      'mandir visit on Sundays, gurudwara prasad on Tuesdays',
      'maintenance practice',
      'recommended');
  }

  // 4-5. R Hand / L Hand thread — colors based on lagna lord & Mars/Saturn
  const lagnaColor = colorForLagnaLord(lagnaLord);
  fields['R Hand'] = rec(
    `${lagnaColor} thread, tied Sunday`,
    `Right-hand thread keyed to lagna lord ${lagnaLord} (${lagna} ascendant)`,
    'recommended');
  fields['L Hand'] = rec(
    moon.house === 6 || moon.house === 8 || moon.house === 12
      ? 'white + grey thread, tied Monday morning'
      : 'white thread, tied Monday morning',
    `Left-hand thread keyed to Moon — Moon in ${moon.house}th${moon.house === 6 || moon.house === 8 || moon.house === 12 ? ' (afflicted)' : ''}`,
    'recommended');

  // 6. Cow — Jupiter / Venus / financial
  if (jupiter.house === 6 || jupiter.house === 8 || jupiter.house === 12 || pitrDosha) {
    fields['Cow'] = rec(
      'feed cow daily roti + jaggery; godan once at major life events',
      pitrDosha ? 'Pitr Dosha — cow service is the central remedy' : `Jupiter in ${jupiter.house}th — cow service strengthens dharma`,
      'mandatory');
  } else {
    fields['Cow'] = rec(
      'cow roti every Thursday',
      'baseline Jupiter remedy',
      'recommended');
  }

  // 7. Mass (Non-Veg) — Saturn afflicted, Pitr Dosh, Mangal Dosh → avoid
  if (pitrDosha || saturn.house === 6 || saturn.house === 8 || saturn.house === 12 || mangalDosha) {
    fields['Mass (Non-Veg)'] = rec(
      'AVOID non-veg, eggs, alcohol entirely',
      pitrDosha ? 'Pitr Dosha — meat consumption blocks ancestral grace' : 'Saturn-affliction or Mangal Dosha — purity required',
      'avoid');
  } else {
    fields['Mass (Non-Veg)'] = rec(
      'avoid non-veg on Tuesdays, Thursdays, Saturdays',
      'baseline purity practice',
      'recommended');
  }

  // 8-9. R Leg / L Leg thread
  fields['R Leg'] = rec(
    saturn.house === 6 || saturn.house === 8 || saturn.house === 12
      ? 'black thread, tied Saturday morning'
      : 'red thread, tied Tuesday morning',
    saturn.house === 6 || saturn.house === 8 || saturn.house === 12
      ? `Saturn in ${saturn.house}th — black thread balances karmic load`
      : 'Mars-keyed (right side / drive)',
    'recommended');
  fields['L Leg'] = rec(
    'blue thread, tied Saturday',
    'left leg keyed to Saturn — discipline & restraint',
    'recommended');

  // 10. Rules (Neam) — for everyone
  fields['Rules (Neam)'] = rec(
    'wake before sunrise · 1 fixed eating schedule · no anger after 9 PM',
    'foundational discipline — supports all other remedies',
    'mandatory');

  // 11. Blind People — Saturn / Rahu afflicted
  if (saturn.house === 6 || saturn.house === 8 || saturn.house === 12 || rahu.house === 1) {
    fields['Blind People'] = rec(
      'feed 10 blind/disabled people every 3 months',
      'Saturn affliction — service to the visually impaired clears karma',
      'mandatory');
  } else {
    fields['Blind People'] = rec(
      'feed blind/disabled person on birthday & Saturdays',
      'baseline Saturn remedy',
      'recommended');
  }

  // 12. Waist thread — Mars / digestion
  fields['Waist'] = rec(
    mangalDosha ? 'red waist thread, tied Tuesday after sunrise' : 'optional — only during Mars dasha',
    mangalDosha ? 'Mangal Dosha — waist thread balances Mars heat' : `Mars in ${mars.house}th — non-critical here`,
    mangalDosha ? 'mandatory' : 'optional');

  // 13. River — Moon, ancestor offerings
  if (moon.house === 6 || moon.house === 8 || moon.house === 12 || pitrDosha) {
    fields['River'] = rec(
      'flow water + flowers + 1.25 kg rice into a river on Mondays',
      pitrDosha ? 'Pitr Dosha — water offerings to ancestors are central' : `Moon in ${moon.house}th — needs water remedy`,
      'mandatory');
  } else {
    fields['River'] = rec(
      'river offering on full moon + amavasya',
      'maintenance practice',
      'recommended');
  }

  // 14. Tree — Mercury / Saturn / lungs
  if (saturn.house === 6 || saturn.house === 8 || saturn.house === 12 || mercury.retrograde) {
    fields['Tree'] = rec(
      'plant peepal / banyan; water it daily for 41 days',
      'Saturn / Mercury affliction — tree is core remedy',
      'mandatory');
  } else {
    fields['Tree'] = rec(
      'plant a tree once a year + water peepal on Saturdays',
      'baseline Saturn remedy',
      'recommended');
  }

  // 15. Roots (Jad) — ancestors
  if (pitrDosha || ketu.house === 1 || ketu.house === 5 || ketu.house === 9) {
    fields['Roots (Jad)'] = rec(
      'offer haldi + til + ghee at peepal roots every amavasya',
      pitrDosha ? 'Pitr Dosha — roots offering is essential' : `Ketu in ${ketu.house}th — ancestor karma signal`,
      'mandatory');
  } else {
    fields['Roots (Jad)'] = rec(
      'water peepal roots monthly',
      'baseline ancestor remedy',
      'optional');
  }

  // 16. Pitr Gaya
  if (pitrDosha || kaalSarpa || ketu.house === 1 || ketu.house === 5 || ketu.house === 9 || ketu.house === 12) {
    fields['Pitr Gaya'] = rec(
      'pilgrimage to Gaya for pind daan once in lifetime',
      pitrDosha || kaalSarpa ? 'Pitr Dosha or Kaal Sarpa — Gaya pind daan resolves it' : 'Ketu placement suggests pitr work',
      'mandatory');
  } else {
    fields['Pitr Gaya'] = rec(
      'optional Gaya visit — strongly auspicious',
      'no specific affliction; Gaya remains a great act',
      'optional');
  }

  // 17. Pitr Classes
  if (pitrDosha || ketu.house !== 12) {
    fields['Pitr Classes'] = rec(
      'attend Pitr classes during Pitru Paksha (16 days, Sept-Oct)',
      'pitr classes = formal teaching during ancestor fortnight',
      pitrDosha ? 'mandatory' : 'recommended');
  } else {
    fields['Pitr Classes'] = rec(
      'attend at least once in lifetime',
      'baseline',
      'optional');
  }

  // 18. Nose Septum — for women, Venus-related
  if (venus.house === 6 || venus.house === 8 || venus.house === 12) {
    fields['Nose Septum (Nak ki Bali)'] = rec(
      'silver / gold septum stud — left side',
      `Venus in ${venus.house}th — septum stud balances Shukra`,
      'recommended');
  } else {
    fields['Nose Septum (Nak ki Bali)'] = rec(
      'optional — only if culturally appropriate',
      'no specific Venus signal',
      'optional');
  }

  // 19. Transe (Kinner) — Rahu / 8th house
  if (rahu.house === 1 || rahu.house === 5 || rahu.house === 8 || rahu.house === 12) {
    fields['Transe (Kinner)'] = rec(
      'donate to kinnar community 4× a year — clothes, food, or money',
      `Rahu in ${rahu.house}th — kinnar offerings clear Rahu karma`,
      'mandatory');
  } else {
    fields['Transe (Kinner)'] = rec(
      'donate at major life moments (birth, marriage, housewarming)',
      'auspicious tradition',
      'recommended');
  }

  // 20. Pooja
  const { pooja, devta } = devtaForLagna(d1.ascSignIndex);
  fields['Pooja'] = rec(pooja, `Pooja keyed to ${lagna} ascendant (lord: ${lagnaLord})`, 'mandatory');

  // 21. Devta
  fields['Devta'] = rec(devta, `Ishta Devta for ${lagna} lagna`, 'mandatory');

  // ── Build summary ──
  const summary = `${lagna} ascendant. Lagna lord ${lagnaLord} sits in the ${planetByName(d1, lagnaLord).house}th house. ` +
    `Moon in ${moon.sign} (${moon.nakshatra}). Sun in ${sun.sign}. ` +
    (doshas.length ? `Detected: ${doshas.join(', ')}. ` : 'No major doshas detected. ') +
    `${highlights.length ? highlights[0] + '.' : ''}`;

  // Force keys onto recs
  const finalFields: Record<FieldKey, FieldRecommendation> = {} as any;
  for (const k of FIELD_KEYS) {
    finalFields[k] = { ...fields[k]!, key: k };
  }

  return {
    fields: finalFields,
    summary,
    doshas,
    highlights,
  };
}
