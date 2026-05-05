// POST /api/kundli/chat — multi-turn chart-aware chat, transcript-grounded.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeFullChart } from '@/lib/astrology/compute';
import { generateChatReply, type ChatTurn } from '@/lib/agent/chat';
import type { BirthInput } from '@/lib/astrology/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  input: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    tzOffsetMinutes: z.number().int().gte(-840).lte(840),
    lat: z.number().gte(-90).lte(90),
    lon: z.number().gte(-180).lte(180),
    placeName: z.string().trim().max(160),
    name: z.string().optional(),
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(12),
  userMessage: z.string().trim().min(2).max(500),
  language: z.enum(['en', 'hi']).default('en'),
});

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

const CRISIS_PATTERNS = [
  /\b(suicide|kill myself|end my life|want to die|self[- ]?harm|cutting myself)\b/i,
  /\b(मरना है|आत्महत्या|खुदकुशी|जान देना|खुद को मारना|खुद को नुक्सान)\b/,
];

function isCrisis(q: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(q));
}

function crisisEnvelope(language: 'en' | 'hi') {
  const en = "I'm not going to look for an answer to this — the most important thing right now is that you talk to someone who can really listen.\n\n**India**\n\n• **iCall (free, multilingual):** +91 9152987821\n• **Vandrevala Foundation (24×7):** 1860-2662-345\n• **AASRA (24×7):** +91 98204 66726\n• **KIRAN (Govt. of India helpline):** 1800-599-0019\n\n**Outside India**\n\n• **International Suicide Hotlines:** https://findahelpline.com\n\nIf you're in immediate danger, please call your local emergency number. *Reach out now.*";
  const hi = "इस प्रश्न के लिए मैं शिक्षाओं में नहीं ढूँढूँगा — अभी सबसे ज़रूरी बात यह है कि आप किसी ऐसे व्यक्ति से बात करें जो वास्तव में सुन सके।\n\n**भारत में सहायता**\n\n• **iCall (निःशुल्क, बहुभाषी):** +91 9152987821\n• **वंद्रेवाला फ़ाउंडेशन (24×7):** 1860-2662-345\n• **AASRA (24×7):** +91 98204 66726\n• **KIRAN (भारत सरकार):** 1800-599-0019\n\nयदि आप तत्काल खतरे में हैं, कृपया स्थानीय आपातकालीन नंबर पर कॉल करें। *अभी संपर्क करें।*";
  return {
    answer_md: language === 'hi' ? hi : en,
    primary_citation_index: 1,
    citations: [],
    lens: { inner: true, jyotish: false, practice: true },
    related_topics: [],
    language,
    total_mentions: 0,
    composer_model: 'crisis-handler',
  };
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

  if (isCrisis(body.userMessage)) {
    return NextResponse.json(crisisEnvelope(body.language));
  }

  const fc = computeFullChart(body.input as BirthInput);
  const envelope = await generateChatReply(
    fc,
    body.history as ChatTurn[],
    body.userMessage,
    body.language,
  );
  return NextResponse.json(envelope);
}
