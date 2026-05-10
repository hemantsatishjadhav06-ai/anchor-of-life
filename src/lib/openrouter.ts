// OpenRouter client — embeddings + chat completions.
// Single key, multiple model providers.

import { OPENROUTER_API_KEY, OPENROUTER_BASE_URL, SITE_URL, SITE_NAME, COMPOSER_MODEL, EMBEDDING_MODEL } from './env';

const BASE_URL = OPENROUTER_BASE_URL;

function headers() {
  return {
    'Authorization': `Bearer ${OPENROUTER_API_KEY()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': SITE_URL,
    'X-Title': SITE_NAME,
  };
}

export async function embed(texts: string[], model = EMBEDDING_MODEL): Promise<number[][]> {
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
  const model = opts.model ?? COMPOSER_MODEL;
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
