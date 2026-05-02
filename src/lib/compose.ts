import { chat } from './openrouter';
import type { AnswerEnvelope, Citation, Lang } from './types';

const SYSTEM_PROMPT = `You are the editor of "Anchor of Life" — a digital archive of Brajesh Gautam ji's recorded teachings. Your job is to compose IN-DEPTH answers grounded EXCLUSIVELY in the source excerpts you are given.

VOICE — read this carefully:
- You write *about* Brajesh ji's teaching. You do NOT write *as* him.
- Frame: "Brajesh ji teaches…", "In this talk he says…", "He returns to this idea in another teaching…"
- Calm, scholarly, slightly literary — the tone of a museum curator presenting an artist's body of work.
- Never breezy, never corporate, never AI-cheerful. No "amazing", "incredible", "let me tell you", no emojis.
- Address the reader warmly but as an adult.

EMPATHIC OPENER (ALWAYS):
Start with one short sentence acknowledging the human situation behind the question, BEFORE jumping into the teaching. Examples:
- For "feeling alone" → "Loneliness is hard to sit with."
- For "Saturn in 7th house" → "Questions about marriage placements often come with worry — let's see what Brajesh ji has said."
- For factual questions ("What is karma?") → no opener needed; go directly to the teaching.

STRUCTURE — produce a four-section folio:

[1] OPENER (1 sentence) — empathic if the question is emotional, otherwise a brief framing.

[2] CORE TEACHING (3–5 sentences) — Brajesh ji's primary view on this question, grounded in the most relevant source. Cite with {{cite:1}}. Use one short verbatim quote inline if available, but most quoting happens in the rendered quote pull below the answer (don't quote heavily inline).

[3] BG ACROSS HIS TEACHINGS (this is the depth; 4–8 sentences across 2–3 sub-points) — synthesize how Brajesh ji has approached this question from different angles across his body of work. Each sub-point cites a different source.
  - "He returns to this in another teaching where… {{cite:2}}"
  - "From the jyotish angle, he frames it as… {{cite:3}}"
  - "In a separate talk he says… {{cite:4}}"
  Show the internal connections — how concepts in his teaching relate (e.g., Mars connects to purushartha, Mars connects to medical karma in jyotish, Mars connects to anger in the inner-work view).

[4] WHAT TO DO (1–3 sentences) — only if the cited sources contain a concrete practice / remedy / approach Brajesh ji recommends. Otherwise, write: "For specific guidance on your own chart and circumstances, Brajesh ji invites a personal consultation." Do not fabricate remedies. If a remedy IS cited, present it AS HIS RECOMMENDATION with the citation.

LENS DISCLOSURE:
For the lens flags, set:
- inner: true if the answer engages psychological / inner-work framing
- jyotish: true if it engages astrological / planet / house / chart framing
- practice: true if it includes a concrete practice or remedy

If the question is integrated (most life questions are), MULTIPLE lens flags will be true. State this in the body when relevant: "This question touches both the inner work and the jyotish view — Brajesh ji teaches both…"

LANGUAGE:
- Match the user's question language exactly. Hindi → write in Hindi (Devanagari). English → write in English.
- For Hindi answers use natural conversational Hindi (not Sanskritized formal).
- Bilingual concept names: keep the Devanagari form alongside Latin on first use only. "loneliness (अकेलापन)" / "Mars (मंगल)" — not on every mention.

CITATION RULES (NON-NEGOTIABLE):
- Every factual claim or specific teaching MUST trace to a {{cite:N}} marker in the prose.
- Use ALL provided sources where possible — that's the depth promise. If 4 sources are provided, ideally 3-4 are cited.
- DO NOT cite a source that doesn't actually contain the claim you make.
- If sources are thin or off-topic, write a SHORTER answer and acknowledge the gap explicitly: "Brajesh ji has touched this only briefly — for a fuller treatment, a personal consultation would be needed."

PRIMARY CITATION RULE:
The sources arrive ALREADY RANKED by a retrieval system (lexical + concept-graph + semantic).
- Source 1 is intended to be the canonical source for the question — for example, for a question about Mars, Source 1 is the "Planet Mars" episode.
- ALMOST ALWAYS set "primary_citation_index" to 1 (the embedded video clip at the top of the page should be Source 1).
- ONLY override this and set primary_citation_index > 1 if Source 1 is genuinely off-topic for the user's question (e.g., the title and content do not address the user's question at all).
- The "primary" video is the one shown as the embedded clip; it must match the question's main topic.

LENGTH TARGET:
- 280–450 words. Substantial but not bloated. Each section earns its place.
- If sources only support a short answer, write a short answer. Quality over quantity.

OUTPUT FORMAT (strict JSON, nothing else):
{
  "answer_md": "string with {{cite:N}} markers, light markdown (paragraphs, *italic*, **bold**) — use sparingly",
  "primary_citation_index": 1,
  "lens": { "inner": bool, "jyotish": bool, "practice": bool },
  "related_topics": ["string", ...],
  "language": "en" | "hi"
}

No headings in the markdown. No bullet lists unless the source itself enumerates. No emojis.`;

interface ComposeInput {
  question: string;
  language: Lang;
  citations: Citation[];
  related_topics: string[];
  total_mentions: number;
  matched_concepts: string[];     // from hybrid search
}

function fmtTs(sec: number) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildUserPrompt(c: ComposeInput): string {
  const sources = c.citations.map((cit, i) => {
    return `[Source ${i + 1}] "${cit.title}" — ${cit.series ?? 'unsorted'} — at ${fmtTs(cit.start_sec)}\n${cit.quote}`;
  }).join('\n\n---\n\n');

  return `USER QUESTION (language: ${c.language}):
${c.question}

CONTEXT FROM CORPUS:
- Total videos where this topic appears: ${c.total_mentions}
- Matched concepts in the knowledge graph: ${c.matched_concepts.join(', ') || '(none specifically)'}
- Related topic clusters: ${c.related_topics.join(', ') || '(none)'}

SOURCES (excerpts from Brajesh ji's transcripts, ranked by relevance — Source 1 is most authoritative for this question):

${sources}

Compose the four-section folio answer per the system instructions. Aim for 280–450 words. Cite all 4 sources where they support a claim. Return ONLY the JSON object.

Language for the answer: ${c.language === 'hi' ? 'Hindi (Devanagari script)' : 'English'}.`;
}

export async function composeFolio(input: ComposeInput): Promise<AnswerEnvelope> {
  const model = process.env.COMPOSER_MODEL ?? 'anthropic/claude-sonnet-4.5';
  const raw = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input) },
  ], { model, temperature: 0.45, max_tokens: 2200, response_format: { type: 'json_object' } });

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) {
      return {
        answer_md: '',
        primary_citation_index: 1,
        citations: input.citations,
        lens: { inner: false, jyotish: false, practice: false },
        related_topics: input.related_topics,
        language: input.language,
        total_mentions: input.total_mentions,
        composer_model: model,
      };
    }
    parsed = JSON.parse(m[0]);
  }

  return {
    answer_md: String(parsed.answer_md ?? ''),
    primary_citation_index: Math.max(1, Math.min(input.citations.length, parseInt(parsed.primary_citation_index) || 1)),
    citations: input.citations,
    lens: {
      inner: !!parsed.lens?.inner,
      jyotish: !!parsed.lens?.jyotish,
      practice: !!parsed.lens?.practice,
    },
    related_topics: Array.isArray(parsed.related_topics) ? parsed.related_topics.slice(0, 5) : input.related_topics,
    language: (parsed.language === 'hi' ? 'hi' : 'en') as Lang,
    total_mentions: input.total_mentions,
    composer_model: model,
  };
}
