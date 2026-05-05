'use client';
import { useEffect, useRef, useState } from 'react';
import type { Lang, AnswerEnvelope } from '@/lib/types';
import type { TabKey } from '@/lib/agent/chartContext';
import type { BirthInput } from '@/lib/astrology/types';

function fmtTs(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface Props {
  tab: TabKey;
  input: BirthInput;
  lang: Lang;
  eager?: boolean;          // if true, fetch immediately on mount
}

export default function Reading({ tab, input, lang, eager = false }: Props) {
  const [data, setData] = useState<AnswerEnvelope | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(eager);
  const [retry, setRetry] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy fetch — only start once the reading scrolls into view
  // (or close to it). Avoids overwhelming the server with 6+ parallel
  // LLM calls on initial page load.
  useEffect(() => {
    if (eager || shouldFetch) return;
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShouldFetch(true);
          obs.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [eager, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch) return;
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
      .then(async r => {
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          throw new Error(`HTTP ${r.status}${t ? ': ' + t.slice(0, 160) : ''}`);
        }
        const text = await r.text();
        if (!text) throw new Error('empty response');
        return JSON.parse(text);
      })
      .then(d => {
        if (d.error) throw new Error(d.detail || d.error);
        setData(d);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch {}
      })
      .catch(e => { if (e.name !== 'AbortError') setErr(String(e.message ?? e)); });

    return () => ctrl.abort();
  }, [shouldFetch, tab, lang, input.date, input.time, input.lat, input.lon, retry]);

  if (err) {
    return (
      <div ref={containerRef} className="space-y-2">
        <p className="text-vermilion italic text-sm">
          {lang === 'hi' ? 'पठन तैयार करने में त्रुटि' : 'Could not generate reading'}: {err}
        </p>
        <button
          type="button"
          onClick={() => setRetry(r => r + 1)}
          className="text-sm text-ink-soft hover:text-vermilion underline"
        >
          {lang === 'hi' ? 'पुनः प्रयास' : 'Try again'}
        </button>
      </div>
    );
  }

  if (!shouldFetch) {
    return (
      <div ref={containerRef} className="text-ink-mute text-sm italic">
        {lang === 'hi' ? 'स्क्रॉल करने पर पठन तैयार होगा…' : 'Reading will load when this section scrolls into view…'}
      </div>
    );
  }

  if (!data) {
    return (
      <div ref={containerRef} className="space-y-3 animate-pulse">
        <p className="text-ink-soft text-sm citation-meta">
          {lang === 'hi' ? "ब्रजेश जी की शिक्षाओं से उत्तर तैयार हो रहा है…" : "Generating reading from Brajesh ji's teachings…"}
        </p>
        <div className="h-3 bg-ink-line/40 rounded w-5/6"/>
        <div className="h-3 bg-ink-line/40 rounded w-4/6"/>
        <div className="h-3 bg-ink-line/40 rounded w-3/4"/>
      </div>
    );
  }

  const html = (data.answer_md ?? '').replace(/\{\{cite:(\d+)\}\}/g, (_m, n) => {
    const i = parseInt(n) - 1;
    const cit = data.citations[i];
    if (!cit) return '';
    return ` <a href="https://youtu.be/${cit.video_id}?t=${Math.floor(cit.start_sec)}" target="_blank" rel="noopener" class="text-vermilion font-semibold no-underline hover:underline">[${n}]</a>`;
  });

  const paragraphs = html.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <article ref={containerRef} className="space-y-4 text-ink leading-relaxed">
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
