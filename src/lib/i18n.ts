import type { Lang } from './types';

export const STR = {
  siteName: { en: 'Anchor of Life', hi: 'जीवन का आधार' },
  taglineLine1: { en: 'जीवन का मार्गदर्शक', hi: 'जीवन का मार्गदर्शक' },
  taglineLine2: { en: 'The Anchor of Life with Brajesh Gautam', hi: 'ब्रजेश गौतम जी के साथ' },
  introLine: {
    en: 'Thirty years of teachings. Ask anything — he has likely already answered.',
    hi: 'तीस वर्षों की शिक्षाएँ। कुछ भी पूछिए — वे शायद उत्तर दे चुके हैं।',
  },
  askPlaceholder: { en: 'Ask Brajesh ji…', hi: 'ब्रजेश जी से पूछिए…' },
  ask: { en: 'Ask', hi: 'पूछिए' },
  todaysAnchor: { en: "Today's Anchor", hi: 'आज का आधार' },
  whatAreYouCarrying: { en: 'What are you carrying?', hi: 'मन में क्या है?' },
  theLibrary: { en: 'The Library', hi: 'पुस्तकालय' },
  libraryStat: {
    en: '288 videos · 1,082 concepts · Hindi & English',
    hi: '288 वीडियो · 1,082 अवधारणाएँ · हिंदी और अंग्रेज़ी',
  },
  browseBySeries: { en: 'Browse by series', hi: 'शृंखलाओं में देखें' },
  about: { en: 'About Brajesh ji', hi: 'ब्रजेश जी के बारे में' },
  aboutSnow: { en: 'About SNOW', hi: 'SNOW के बारे में' },
  bookConsultation: { en: 'Book a real consultation', hi: 'व्यक्तिगत परामर्श बुक करें' },
  youAsked: { en: 'You asked', hi: 'आपने पूछा' },
  brajeshJiSays: { en: "In Brajesh ji's words", hi: 'ब्रजेश जी के शब्दों में' },
  spokenAbout: { en: 'Brajesh ji has spoken about this', hi: 'ब्रजेश जी ने इस विषय पर' },
  times: { en: 'times', hi: 'बार बात की है' },
  source: { en: 'Source', hi: 'स्रोत' },
  at: { en: 'at', hi: 'पर' },
  in: { en: 'in', hi: 'में' },
  watchOnYoutube: { en: 'Watch on YouTube', hi: 'YouTube पर देखें' },
  alsoExplore: { en: 'You may also explore', hi: 'और भी देखें' },
  loading: { en: 'Searching the teachings…', hi: 'शिक्षाओं में खोज रहे हैं…' },
  noResults: {
    en: 'I could not find this in the teachings. Try a different angle, or book a real consultation.',
    hi: 'यह विषय शिक्षाओं में नहीं मिला। दूसरे शब्दों में पूछें, या व्यक्तिगत परामर्श बुक करें।',
  },
  disclaimer: {
    en: 'Answers are drawn from Brajesh ji’s recorded teachings. For personal guidance on remedies or your specific chart, please book a consultation.',
    hi: 'उत्तर ब्रजेश जी की रिकॉर्डेड शिक्षाओं से लिए गए हैं। व्यक्तिगत परामर्श के लिए कृपया अपॉइंटमेंट बुक करें।',
  },
  searchHints: {
    en: ['Why am I anxious before sleep?', 'What is karma vs bhagya?', 'मैं अकेला महसूस कर रहा हूँ', 'How should I handle my children?', 'What does Saturn do in the 7th house?'],
    hi: ['मैं अकेला महसूस कर रहा हूँ', 'कर्म और भाग्य में अंतर क्या है?', 'सोने से पहले बेचैनी क्यों होती है?', 'बच्चों को कैसे संभालें?', 'सप्तम भाव में शनि का प्रभाव क्या है?'],
  },
} as const;

export function t(key: keyof typeof STR, lang: Lang): string | readonly string[] {
  const v = STR[key];
  return (v as Record<Lang, string | readonly string[]>)[lang];
}

export function ts(key: keyof typeof STR, lang: Lang): string {
  const v = t(key, lang);
  return Array.isArray(v) ? v[0] : (v as string);
}
