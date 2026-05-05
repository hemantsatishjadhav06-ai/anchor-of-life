'use client';
import { useEffect, useState } from 'react';
import type { Lang, AnswerEnvelope } from '@/lib/types';
import type { TabKey } from '@/lib/agent/chartContext';
import type { BirthInput } from '@/lib/astrology/types';

function fmtTs(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function Reading({
  tab, input, lang,
}: {
  tab: TabKey;
  input: BirthInput;
  lang: Lang;
}) {
  const [data, setData] = useState<AnswerEnvelope | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setErr(null);
    const cacheKey = `kundli-reading:${tab}:${lang}:${input.date}|${input.time}|${input.lat.toFixed(3)}|${input.lon.toFixed(3)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        return;
      }
    } catch {}

    const ctrl = new AbortController();
    fetch('/api/kundli/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, tab, language: lang }),
      signal: ctrl.signal,
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.detail || d.error);
        setData(d);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch {}
      })
      .catch(e => { if (e.name !== 'AbortError') setErr(String(e.message ?? e)); });

    return () => ctrl.abort();
  }, [tab, lang, input.date, input.time, input.lat, input.lon]);

  if (err) {
    return (
      <p className="text-vermilion italic text-sm">
        {lang === 'hi' ? 'त्रुटि' : 'Error'}: {err}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3 animate-pulse">
        <p className="text-ink-soft text-sm citation-meta">
          {lang === 'hi' ? 'ब्रजेश जी की शिक्षाओं से उत्तर तैयार हो रहा है…' : "Generating reading from Brajesh ji's teachings…"}
        </p>
        <div className="h-3 bg-ink-line/40 rounded w-5/6"/>
        <div className="h-3 bg-ink-line/40 rounded w-4/6"/>
        <div className="h-3 bg-ink-line/40 rounded w-3/4"/>
      </div>
    );
  }

  // Replace {{cite:N}} markers with linked chips.
  const html = (data.answer_md ?? '')
    .replace(/\{\{cite:(\d+)\}\}/g, (_m, n) => {
      const i = parseInt(n) - 1;
      const cit = data.citations[i];
      if (!cit) return '';
      return ` <a href="https://youtu.be/${cit.video_id}?t=${Math.floor(cit.start_sec)}" target="_blank" rel="noopener" class="text-vermilion font-semibold no-underline hover:underline">[${n}]</a>`;
    });

  const paragraphs = html.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <article className="space-y-4 text-ink leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
      ))}

      {data.citations.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer citation-meta">
            {lang === 'hi' ? `स्रोत (${data.citations.length})` : `Sources (${data.citations.length})`}
          </summary>
          <ol className="mt-2 space-y-1 pl-1">
            {data.citations.map((c, i) => (
              <li key={i} className="text-ink-soft">
                <a
                  href={`https://youtu.be/${c.video_id}?t=${Math.floor(c.start_sec)}`}
                  target="_blank"
                  rel="noopener"
                  className="hover:underline"
                >
                  [{i + 1}] {c.title} — {fmtTs(c.start_sec)}
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}
