'use client';
import { useState, useRef, useEffect } from 'react';
import type { Lang, AnswerEnvelope } from '@/lib/types';
import type { BirthInput } from '@/lib/astrology/types';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  envelope?: AnswerEnvelope;
}

function renderMarkdown(text: string, citations: AnswerEnvelope['citations']): string {
  return text.replace(/\{\{cite:(\d+)\}\}/g, (_m, n) => {
    const i = parseInt(n) - 1;
    const c = citations[i];
    if (!c) return '';
    return ` <a href="https://youtu.be/${c.video_id}?t=${Math.floor(c.start_sec)}" target="_blank" rel="noopener" class="text-vermilion font-semibold no-underline hover:underline">[${n}]</a>`;
  });
}

export default function ChartChat({
  input, lang,
}: {
  input: BirthInput;
  lang: Lang;
}) {
  const [history, setHistory] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  async function send() {
    const msg = text.trim();
    if (!msg || pending) return;
    setText('');
    setErr(null);
    setPending(true);
    const next: Turn[] = [...history, { role: 'user', content: msg }];
    setHistory(next);
    try {
      const r = await fetch('/api/kundli/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          history: next.slice(0, -1).map(t => ({ role: t.role, content: t.content })),
          userMessage: msg,
          language: lang,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.error || 'request failed');
      setHistory(h => [...h, { role: 'assistant', content: d.answer_md, envelope: d }]);
    } catch (e: any) {
      setErr(String(e.message ?? e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        ref={scrollRef}
        className="space-y-5 max-h-[60vh] overflow-y-auto pr-1"
      >
        {history.length === 0 && (
          <p className="text-ink-soft italic text-sm">
            {lang === 'hi'
              ? 'अपनी कुंडली से कुछ भी पूछिए — उत्तर ब्रजेश जी की रिकॉर्डेड शिक्षाओं से आएगा।'
              : "Ask anything about your chart — answers come from Brajesh ji's recorded teachings."}
          </p>
        )}
        {history.map((t, i) => (
          t.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] bg-paper-deep border border-ink-line/40 px-4 py-3 text-ink">
                {t.content}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-3">
              <div
                className="text-ink leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (t.envelope?.answer_md ?? t.content)
                    .split(/\n\n+/)
                    .map(p => `<p class="mb-3">${renderMarkdown(p.trim(), t.envelope?.citations ?? [])}</p>`)
                    .join(''),
                }}
              />
              {t.envelope && t.envelope.citations.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer citation-meta">
                    {lang === 'hi' ? `स्रोत (${t.envelope.citations.length})` : `Sources (${t.envelope.citations.length})`}
                  </summary>
                  <ol className="mt-1 space-y-1 pl-1">
                    {t.envelope.citations.map((c, j) => (
                      <li key={j} className="text-ink-soft">
                        <a
                          href={`https://youtu.be/${c.video_id}?t=${Math.floor(c.start_sec)}`}
                          target="_blank"
                          rel="noopener"
                          className="hover:underline"
                        >
                          [{j + 1}] {c.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )
        ))}
        {pending && (
          <p className="text-ink-soft text-sm citation-meta animate-pulse">
            {lang === 'hi' ? 'खोज रहे हैं…' : 'Searching teachings…'}
          </p>
        )}
        {err && (
          <p className="text-vermilion italic text-sm">{err}</p>
        )}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); send(); }}
        className="flex gap-2 pt-3 border-t border-ink-line/40"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={lang === 'hi' ? 'अपनी कुंडली के बारे में पूछें…' : 'Ask about your chart…'}
          className="input-rule flex-1"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="btn-ink disabled:opacity-50"
        >
          {lang === 'hi' ? 'भेजें' : 'Send'}
        </button>
      </form>
    </div>
  );
}
