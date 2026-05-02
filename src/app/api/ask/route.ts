import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectLang } from '@/lib/vec';
import { hybridSearch, buildCitationsFromVideos, relatedTopicsForVideos, countMentionsHybrid } from '@/lib/search';
import { composeFolio } from '@/lib/compose';
import { getDb } from '@/lib/db';
import { expandAliases } from '@/lib/aliases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  question: z.string().trim().min(2).max(500),
  language: z.enum(['en', 'hi']).optional(),
});

// In-memory rate limit: 30 req / hour / IP. Resets on server restart.
const RATE: Record<string, { count: number; resetAt: number }> = {};
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const r = RATE[ip];
  if (!r || now > r.resetAt) {
    RATE[ip] = { count: 1, resetAt: now + 60 * 60 * 1000 };
    return true;
  }
  if (r.count >= 30) return false;
  r.count++;
  return true;
}

// In-memory cache: hash(question + lang) → envelope, 24h TTL
const CACHE: Record<string, { at: number; data: any }> = {};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
function cacheKey(question: string, lang: string): string {
  // simple-strong hash adequate for in-memory cache
  let h = 0;
  const s = `${lang}::${question}`.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return String(h);
}

// Crisis detection: surface human help INSTEAD of running RAG.
const CRISIS_PATTERNS = [
  /\b(suicide|kill myself|end my life|want to die|self[- ]?harm|cutting myself)\b/i,
  /\b(मरना है|आत्महत्या|खुदकुशी|जान देना|खुद को मारना|खुद को नुक्सान)\b/,
];
function isCrisis(q: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(q));
}

function crisisResponse(language: 'en' | 'hi') {
  const en = {
    answer_md: "I'm not going to search the teachings for this — the most important thing right now is that you talk to someone who can really listen.\n\n**India**\n\n• **iCall (Mumbai-based, free, multilingual):** +91 9152987821\n• **Vandrevala Foundation (24×7):** 1860-2662-345\n• **AASRA (24×7):** +91 98204 66726\n• **KIRAN (Govt. of India helpline):** 1800-599-0019\n\n**Outside India**\n\n• **International Suicide Hotlines:** https://findahelpline.com\n\nIf you're in immediate danger, please call your local emergency number. The conversation with Brajesh ji can wait — you cannot. *Reach out now.*",
    citations: [],
    lens: { inner: true, jyotish: false, practice: true },
    related_topics: [],
    language: 'en',
    total_mentions: 0,
    primary_citation_index: 1,
    composer_model: 'crisis-handler',
  };
  const hi = {
    answer_md: "इस प्रश्न के लिए मैं शिक्षाओं में नहीं ढूँढूँगा — अभी सबसे ज़रूरी बात यह है कि आप किसी ऐसे व्यक्ति से बात करें जो वास्तव में सुन सके।\n\n**भारत में सहायता**\n\n• **iCall (मुंबई, निःशुल्क, बहुभाषी):** +91 9152987821\n• **वंद्रेवाला फ़ाउंडेशन (24×7):** 1860-2662-345\n• **AASRA (24×7):** +91 98204 66726\n• **KIRAN (भारत सरकार):** 1800-599-0019\n\nयदि आप तत्काल खतरे में हैं, कृपया स्थानीय आपातकालीन नंबर पर कॉल करें। ब्रजेश जी की शिक्षाएँ प्रतीक्षा कर सकती हैं — आप नहीं। *अभी संपर्क करें।*",
    citations: [],
    lens: { inner: true, jyotish: false, practice: true },
    related_topics: [],
    language: 'hi',
    total_mentions: 0,
    primary_citation_index: 1,
    composer_model: 'crisis-handler',
  };
  return language === 'hi' ? hi : en;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid_request', detail: e.message }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limited', message: 'Please pause for a moment before asking again.' }, { status: 429 });
  }

  const language = body.language ?? detectLang(body.question);

  // Crisis path takes precedence over everything.
  if (isCrisis(body.question)) {
    return NextResponse.json(crisisResponse(language));
  }

  // Cache hit?
  const ckey = cacheKey(body.question, language);
  const c = CACHE[ckey];
  if (c && Date.now() - c.at < CACHE_TTL_MS) {
    return NextResponse.json(c.data, { headers: { 'X-Cache': 'HIT' } });
  }

  // Index readiness check
  const db = getDb();
  const have = (db.prepare('SELECT count(*) AS n FROM chunk_vec').get() as { n: number }).n;
  if (have === 0) {
    return NextResponse.json({
      error: 'index_not_ready',
      message: 'The embeddings are still being built. Please try again in a few minutes.',
    }, { status: 503 });
  }

  // Hybrid retrieval
  const result = await hybridSearch(body.question, 4);
  if (!result.videos.length) {
    const empty = {
      answer_md: '',
      primary_citation_index: 1,
      citations: [],
      lens: { inner: false, jyotish: false, practice: false },
      related_topics: [],
      language,
      total_mentions: 0,
      composer_model: 'none',
    };
    return NextResponse.json(empty);
  }

  const citations = buildCitationsFromVideos(result);
  const total_mentions = await countMentionsHybrid(body.question);
  const related_topics = relatedTopicsForVideos(result, 4);

  // Compose
  const envelope = await composeFolio({
    question: body.question,
    language,
    citations,
    related_topics,
    total_mentions,
    matched_concepts: result.matched_concepts,
  });

  // Server-side safety override: if the user's question contains a strong
  // canonical concept (e.g., "mars", "saturn", "pitr dosh") AND Source 1's
  // title contains a form of that concept, force Source 1 as primary.
  // This protects against composer drift — the embedded clip should be the
  // most authoritative video on the topic, which is what the retrieval ranker
  // already selected as Source 1.
  const aliases = expandAliases(body.question);
  if (aliases.canonical.length && citations.length) {
    const titleHay = (citations[0].title || '').toLowerCase();
    const hit = aliases.forms.some(f => f.length >= 3 && titleHay.includes(f.toLowerCase()));
    if (hit && envelope.primary_citation_index !== 1) {
      envelope.primary_citation_index = 1;
    }
  }

  CACHE[ckey] = { at: Date.now(), data: envelope };
  return NextResponse.json(envelope, { headers: { 'X-Cache': 'MISS' } });
}
