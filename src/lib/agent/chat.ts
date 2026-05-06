// Chart-aware chat orchestrator — multi-turn, transcript-grounded.

import { hybridSearch, buildCitationsFromVideos } from '@/lib/search';
import { chat as openrouterChat } from '@/lib/openrouter';
import { COMPOSER_MODEL } from '@/lib/env';
import type { AnswerEnvelope, Lang } from '@/lib/types';
import type { FullChart } from '@/lib/astrology/types';
import { chartContextFor } from './chartContext';
import { CHAT_SYSTEM_PROMPT } from './prompts';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function fmtTs(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export async function generateChatReply(
  fc: FullChart,
  history: ChatTurn[],
  userMessage: string,
  language: Lang,
): Promise<AnswerEnvelope> {
  // Use the user's question + chart-overview keywords to retrieve.
  const result = await hybridSearch(userMessage, 4);
  const citations = buildCitationsFromVideos(result);
  const ctx = chartContextFor('overview', fc);

  if (citations.length === 0) {
    return {
      answer_md: language === 'hi'
        ? 'आपके प्रश्न के लिए ब्रजेश जी की शिक्षाओं में सीधा उत्तर नहीं मिला। कृपया प्रश्न दोहराएँ या व्यक्तिगत परामर्श बुक करें।'
        : "I couldn't find a direct answer to that question in Brajesh ji's recorded teachings. Please rephrase or book a personal consultation.",
      primary_citation_index: 1,
      citations: [],
      lens: { inner: false, jyotish: false, practice: false },
      related_topics: [],
      language,
      total_mentions: 0,
      composer_model: 'no-sources',
    };
  }

  const sources = citations.map(
    (c, i) => `[Source ${i + 1}] "${c.title}" at ${fmtTs(c.start_sec)}\n${c.quote}`,
  ).join('\n\n---\n\n');

  const messages = [
    { role: 'system' as const, content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-6).map(t => ({
      role: t.role,
      content: t.content,
    })),
    {
      role: 'user' as const,
      content: `USER'S CHART:\n${ctx}\n\nUSER QUESTION (lang ${language}):\n${userMessage}\n\nBG TRANSCRIPT SOURCES:\n${sources}\n\nReturn ONLY the JSON object.`,
    },
  ];

  const model = COMPOSER_MODEL;
  const raw = await openrouterChat(messages, {
    model,
    temperature: 0.4,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  }

  return {
    answer_md: String(parsed.answer_md ?? ''),
    primary_citation_index: Math.max(
      1,
      Math.min(citations.length, parseInt(parsed.primary_citation_index) || 1),
    ),
    citations,
    lens: {
      inner: !!parsed.lens?.inner,
      jyotish: !!parsed.lens?.jyotish,
      practice: !!parsed.lens?.practice,
    },
    related_topics: Array.isArray(parsed.related_topics) ? parsed.related_topics.slice(0, 5) : [],
    language: (parsed.language === 'hi' ? 'hi' : language) as Lang,
    total_mentions: 0,
    composer_model: model,
  };
}
