// Per-tab kundli reading orchestrator — retrieves BG transcripts then
// composes a transcript-grounded reading via OpenRouter.

import { hybridSearch, buildCitationsFromVideos } from '@/lib/search';
import { chat } from '@/lib/openrouter';
import type { AnswerEnvelope, Lang } from '@/lib/types';
import type { FullChart } from '@/lib/astrology/types';
import { chartContextFor, probeQueryFor, type TabKey } from './chartContext';
import { READING_SYSTEM_PROMPT } from './prompts';

function fmtTs(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export async function generateReading(
  tab: TabKey,
  fc: FullChart,
  language: Lang,
): Promise<AnswerEnvelope> {
  const probe = probeQueryFor(tab, fc);
  const result = await hybridSearch(probe, 4);
  const citations = buildCitationsFromVideos(result);
  const ctx = chartContextFor(tab, fc);

  if (citations.length === 0) {
    return {
      answer_md: language === 'hi'
        ? 'इस विषय पर ब्रजेश जी की रिकॉर्डेड शिक्षाओं में सीधा उल्लेख नहीं मिला। व्यक्तिगत परामर्श के लिए संपर्क करें।'
        : "Brajesh ji has not directly addressed this configuration in the recorded teachings. For personalized guidance, please book a personal consultation.",
      primary_citation_index: 1,
      citations: [],
      lens: { inner: false, jyotish: true, practice: false },
      related_topics: [],
      language,
      total_mentions: 0,
      composer_model: 'no-sources',
    };
  }

  const sources = citations.map(
    (c, i) => `[Source ${i + 1}] "${c.title}" — at ${fmtTs(c.start_sec)}\n${c.quote}`,
  ).join('\n\n---\n\n');

  const userPrompt = `LIFE AREA: ${tab}
LANGUAGE: ${language}

USER'S CHART CONTEXT:
${ctx}

BG TRANSCRIPT SOURCES (ranked by relevance — Source 1 most authoritative):

${sources}

Compose the 3-paragraph reading per the system instructions. Aim for 220–380 words. Cite all 4 sources where they support a claim. Return ONLY the JSON object.

Language for the answer: ${language === 'hi' ? 'Hindi (Devanagari script)' : 'English'}.`;

  const model = process.env.COMPOSER_MODEL ?? 'anthropic/claude-sonnet-4.5';
  const raw = await chat(
    [
      { role: 'system', content: READING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      model,
      temperature: 0.3,
      max_tokens: 1500,
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

  return {
    answer_md: String(parsed.answer_md ?? ''),
    primary_citation_index: Math.max(
      1,
      Math.min(citations.length, parseInt(parsed.primary_citation_index) || 1),
    ),
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
