// OpenRouter client — embeddings + chat completions.
// Single key, multiple model providers.

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME ?? 'Anchor of Life';

function headers() {
  if (!KEY) throw new Error('OPENROUTER_API_KEY is not set');
  return {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': SITE_URL,
    'X-Title': SITE_NAME,
  };
}

export async function embed(texts: string[], model = process.env.EMBEDDING_MODEL ?? 'openai/text-embedding-3-small'): Promise<number[][]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60_000);
  try {
    const r = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ model, input: texts }),
      signal: ctl.signal,
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Embedding failed (${r.status}): ${t.slice(0, 400)}`);
    }
    const d = await r.json() as { data: Array<{ embedding: number[] }> };
    return d.data.map(x => x.embedding);
  } finally {
    clearTimeout(timer);
  }
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chat(messages: ChatMessage[], opts: {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
} = {}): Promise<string> {
  const model = opts.model ?? process.env.COMPOSER_MODEL ?? 'anthropic/claude-sonnet-4.5';
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.max_tokens ?? 1500,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Chat failed (${r.status}): ${t.slice(0, 500)}`);
  }
  const d = await r.json() as { choices: Array<{ message: { content: string } }> };
  return d.choices[0]?.message?.content ?? '';
}
