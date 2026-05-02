// Bilingual alias table: Latin transliteration ↔ Devanagari ↔ English meaning.
// Used to expand query tokens before lexical search and to compute title-boost matches.
// Kept small and human-auditable. Append-only — when a query slips through, add a row.

interface AliasGroup {
  canonical: string;     // primary English label
  forms: string[];       // all forms (lowercased) — including Devanagari & transliterations
}

export const ALIAS_GROUPS: AliasGroup[] = [
  // Planets (graha)
  { canonical: 'sun',     forms: ['sun', 'surya', 'sūrya', 'सूर्य', 'सुर्य', 'sury'] },
  { canonical: 'moon',    forms: ['moon', 'chandra', 'chandrama', 'chandr', 'चंद्र', 'चंद्रमा', 'चन्द्र', 'सोम', 'som', 'soma'] },
  { canonical: 'mars',    forms: ['mars', 'mangal', 'mangala', 'मंगल', 'मङ्गल', 'भौम', 'kuja'] },
  { canonical: 'mercury', forms: ['mercury', 'budh', 'budha', 'बुध', 'बुद्ध'] },
  { canonical: 'jupiter', forms: ['jupiter', 'guru', 'brihaspati', 'brhaspati', 'बृहस्पति', 'गुरु', 'देवगुरु'] },
  { canonical: 'venus',   forms: ['venus', 'shukra', 'śukra', 'शुक्र', 'शुक्राचार्य'] },
  { canonical: 'saturn',  forms: ['saturn', 'shani', 'shanidev', 'शनि', 'शनिदेव', 'sade sati', 'साढ़े साती', 'साढ़ेसाती'] },
  { canonical: 'rahu',    forms: ['rahu', 'राहु', 'rahu dosha', 'rahu dasha'] },
  { canonical: 'ketu',    forms: ['ketu', 'केतु'] },
  { canonical: 'pluto',   forms: ['pluto', 'yamraj', 'yam', 'यम', 'यमराज', 'धर्मराज'] },
  { canonical: 'neptune', forms: ['neptune', 'varun', 'varuna', 'वरुण', 'वरुणदेव'] },
  { canonical: 'uranus',  forms: ['uranus', 'indra', 'इंद्र', 'इन्द्र'] },

  // Houses
  { canonical: 'lagna',          forms: ['lagna', 'लग्न', 'ascendant', 'first house', 'pratham bhav', 'प्रथम भाव'] },
  { canonical: 'seventh house',  forms: ['7th house', 'seventh house', 'saptam bhav', 'सप्तम भाव', 'marriage house'] },
  { canonical: 'ninth house',    forms: ['9th house', 'ninth house', 'navam bhav', 'नवम भाव', 'bhagya sthan', 'भाग्य स्थान'] },
  { canonical: 'eighth house',   forms: ['8th house', 'eighth house', 'ashtam bhav', 'अष्टम भाव'] },

  // Core concepts
  { canonical: 'karma',          forms: ['karma', 'कर्म', 'karm'] },
  { canonical: 'dharma',         forms: ['dharma', 'धर्म', 'dharm'] },
  { canonical: 'bhagya',         forms: ['bhagya', 'भाग्य', 'fate', 'destiny'] },
  { canonical: 'prarabdh',       forms: ['prarabdh', 'prarabdha', 'प्रारब्ध'] },
  { canonical: 'paap',           forms: ['paap', 'pap', 'sin', 'पाप'] },
  { canonical: 'punya',          forms: ['punya', 'पुण्य', 'merit'] },
  { canonical: 'maya',           forms: ['maya', 'mayaa', 'माया', 'illusion'] },
  { canonical: 'atma',           forms: ['atma', 'aatma', 'soul', 'आत्मा'] },
  { canonical: 'moksha',         forms: ['moksha', 'moksh', 'mukti', 'मोक्ष', 'मुक्ति', 'liberation'] },
  { canonical: 'ahankar',        forms: ['ahankar', 'ahankaar', 'अहंकार', 'ego'] },
  { canonical: 'vairagya',       forms: ['vairagya', 'वैराग्य', 'detachment'] },
  { canonical: 'sakshi bhav',    forms: ['sakshi', 'sakshi bhav', 'साक्षी', 'साक्षी भाव', 'witness'] },

  // Pitrr / ancestors
  { canonical: 'pitr dosh',      forms: ['pitr dosh', 'pitra dosh', 'pitrr dosh', 'pitru dosha', 'पितृ दोष', 'पितर दोष'] },
  { canonical: 'pitr lok',       forms: ['pitr lok', 'pitrr lok', 'astral world', 'पितृ लोक', 'pitru lok'] },
  { canonical: 'shraadh',        forms: ['shraadh', 'shraddh', 'श्राद्ध'] },
  { canonical: 'ancestors',      forms: ['ancestors', 'forefathers', 'pitr', 'pitrr', 'पितर', 'पितृ'] },

  // BG signature concepts
  { canonical: 'munna',          forms: ['munna', 'मुन्ना', 'inner munna', 'inner child'] },
  { canonical: 'tinku',          forms: ['tinku', 'टिंकू', 'tinku se setting', 'inner agreement'] },
  { canonical: 'chamko',         forms: ['chamko', 'चमको', 'inner spark'] },
  { canonical: 'leela',          forms: ['leela', 'lila', 'लीला', 'divine play'] },
  { canonical: 'quota share',    forms: ['quota share', 'quota-share', 'quota', 'share', 'कोटा'] },
  { canonical: 'pump',           forms: ['pump', 'preliving', 'prarabdh unwanted wants manifestation'] },
  { canonical: 'unwanted wants', forms: ['unwanted wants', 'unwanted want', 'desire', 'iccha', 'इच्छा'] },
  { canonical: 'waala',          forms: ['waala', 'wala', 'वाला'] },

  // Practices / remedies
  { canonical: 'mantra',         forms: ['mantra', 'मंत्र', 'jaap', 'japa', 'जप'] },
  { canonical: 'pooja',          forms: ['pooja', 'puja', 'पूजा'] },
  { canonical: 'daan',           forms: ['daan', 'donation', 'दान'] },
  { canonical: 'fasting',        forms: ['fasting', 'upvas', 'vrat', 'व्रत', 'उपवास'] },
  { canonical: 'gemstone',       forms: ['gemstone', 'ratna', 'रत्न', 'pukhraj', 'neelam', 'panna', 'pitambari'] },

  // Emotional states
  { canonical: 'anger',          forms: ['anger', 'krodh', 'gussa', 'क्रोध', 'गुस्सा'] },
  { canonical: 'fear',           forms: ['fear', 'bhay', 'dar', 'भय', 'डर'] },
  { canonical: 'loneliness',     forms: ['loneliness', 'lonely', 'alone', 'feeling alone', 'akelapan', 'akela', 'अकेलापन', 'अकेला', 'तन्हा', 'तन्हाई'] },
  { canonical: 'sadness',        forms: ['sadness', 'sad', 'dukh', 'udaasi', 'दुख', 'उदासी'] },
  { canonical: 'anxiety',        forms: ['anxiety', 'anxious', 'chinta', 'चिंता', 'tension', 'tanaav', 'तनाव'] },
  { canonical: 'guilt',          forms: ['guilt', 'glaani', 'glaan', 'ग्लानि'] },
  { canonical: 'depression',     forms: ['depression', 'depress', 'avsaad', 'अवसाद'] },

  // Relationships
  { canonical: 'marriage',       forms: ['marriage', 'vivah', 'shadi', 'विवाह', 'शादी'] },
  { canonical: 'love',           forms: ['love', 'prem', 'pyaar', 'प्रेम', 'प्यार'] },
  { canonical: 'children',       forms: ['children', 'kids', 'bachche', 'बच्चे', 'santaan', 'संतान', 'sons', 'daughters'] },
  { canonical: 'parents',        forms: ['parents', 'mata pita', 'माता पिता', 'mother', 'father', 'maa baap'] },

  // Health / mind
  { canonical: 'mind',           forms: ['mind', 'man', 'manas', 'मन'] },
  { canonical: 'sleep',          forms: ['sleep', 'nidra', 'nind', 'नींद', 'निद्रा'] },
  { canonical: 'health',         forms: ['health', 'swasthya', 'sehat', 'स्वास्थ्य', 'सेहत'] },
];

// Build reverse index for O(1) lookup
const FORM_TO_CANONICAL = new Map<string, string>();
for (const g of ALIAS_GROUPS) {
  for (const f of g.forms) FORM_TO_CANONICAL.set(f.toLowerCase(), g.canonical);
}

const CANONICAL_TO_FORMS = new Map<string, string[]>();
for (const g of ALIAS_GROUPS) CANONICAL_TO_FORMS.set(g.canonical, g.forms);

// Stop words: common function words across English / Hindi (Devanagari + transliteration)
// that we drop from FTS queries to prevent over-matching on titles.
const STOPWORDS = new Set([
  // English
  'a','an','the','is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'i','me','my','you','your','we','us','our','they','them','their','he','she','it','this','that','these','those',
  'of','to','from','for','in','on','at','by','with','about','as','if','than','then','so','but','and','or','not','no',
  'how','what','why','when','where','who','whom','whose','which','will','would','should','could','can','may','might',
  'effect','effects','affect','make','made','want','need','feel','feels','feeling','please','thanks','tell','say','said','know','knows',
  'remedies','remedy','remedi',
  // Hindi transliteration
  'ka','ki','ke','ko','se','me','main','mein','par','ya','aur','hai','hain','tha','thi','the','ho','hoga','hoti',
  'kya','kyun','kaise','kab','kahan','kaun','kis','kuch','sab','wahan','yahan','wo','vo','ye','yeh','jab','tab',
  'mera','meri','mere','tera','teri','tere','uska','uske','uski','iska','iski','iske',
  // Devanagari particles
  'का','की','के','को','से','में','पर','और','या','है','हैं','था','थी','थे','हो','होगा','होती','होना','होते','हुआ','हुई',
  'क्या','क्यों','कैसे','कब','कहाँ','कहां','कौन','कुछ','सब','मेरा','मेरी','मेरे','तेरा','तेरी','तेरे','उसका','उसकी','यह','वह','यह','वो','वे',
  'मैं','तुम','आप','हम','वे','यह','वह','हम','तुझे','मुझे','उसे','उन्हें',
  'जब','तब','भी','तो','तक','तरह','लिए','लिये','साथ','बाद','पहले','अब',
]);

/** Tokenize a query into lowercase words (Devanagari- and Latin-aware), with stop-word filtering. */
export function tokenize(s: string, dropStopwords = true): string[] {
  return s
    .toLowerCase()
    .normalize('NFC')
    .split(/[^ऀ-ॿa-z0-9]+/i)
    .filter(t => {
      if (t.length < 2) return false;
      if (dropStopwords && STOPWORDS.has(t)) return false;
      return true;
    });
}

/** Given a query, return all alias forms that match any token (across scripts). */
export function expandAliases(query: string): { canonical: string[]; forms: string[] } {
  const tokens = tokenize(query);
  const canonical = new Set<string>();
  const forms = new Set<string>();
  for (const t of tokens) {
    const c = FORM_TO_CANONICAL.get(t);
    if (c) {
      canonical.add(c);
      const all = CANONICAL_TO_FORMS.get(c) ?? [];
      for (const f of all) forms.add(f);
    } else {
      // Also check 2-token n-grams (e.g., "sade sati", "pitr lok")
    }
    forms.add(t);  // include the original token
  }
  // n-gram pass for multi-word aliases
  for (let i = 0; i < tokens.length - 1; i++) {
    const bi = `${tokens[i]} ${tokens[i + 1]}`;
    const c = FORM_TO_CANONICAL.get(bi);
    if (c) {
      canonical.add(c);
      const all = CANONICAL_TO_FORMS.get(c) ?? [];
      for (const f of all) forms.add(f);
    }
  }
  return { canonical: Array.from(canonical), forms: Array.from(forms) };
}

/** Build an FTS5 MATCH expression from expanded forms. Quoted to handle multi-word phrases. */
export function buildFtsQuery(forms: string[]): string {
  if (!forms.length) return '';
  const quoted = forms
    .filter(f => f.length >= 2)
    .map(f => `"${f.replace(/"/g, '')}"`)
    .slice(0, 32);    // FTS5 OR clause cap
  return quoted.join(' OR ');
}
