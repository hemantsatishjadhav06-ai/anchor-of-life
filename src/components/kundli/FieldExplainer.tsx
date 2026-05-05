'use client';
import { useEffect, useState } from 'react';
import type { Lang, AnswerEnvelope, Citation } from '@/lib/types';
import type { BirthInput } from '@/lib/astrology/types';
import type { BGPrescription } from '@/lib/agent/prescriptionTypes';

interface Props {
  field: keyof BGPrescription;
  recommendedValue: string;
  input: BirthInput;
  lang: Lang;
}

interface ApiResp {
  field: string;
  recommendedValue: string;
  chartFeatures: string;
  envelope: AnswerEnvelope;
}

function fmtTs(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function FieldExplainer({ field, recommendedValue, input, lang }: Props) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setErr(null);
    const cacheKey = `kundli-field:${field}:${lang}:${input.date}|${input.time}|${input.lat.toFixed(3)}|${input.lon.toFixed(3)}`;
    try {
      const c = sessionStorage.getItem(cacheKey);
      if (c) { setData(JSON.parse(c)); return; }
    } catch {}

    const ctrl = new AbortController();
    fetch('/api/kundli/field-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, field, recommendedValue, language: lang }),
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
  }, [field, lang, input.date, input.time, input.lat, input.lon, recommendedValue]);

  if (err) {
    return <p className="text-vermilion italic text-sm">{err}</p>;
  }

  if (!data) {
    return (
      <div className="space-y-2 animate-pulse">
        <p className="text-ink-soft text-sm citation-meta">
          {lang === 'hi' ? 'व्याख्या तैयार हो रही है…' : 'Generating explanation…'}
        </p>
        <div className="h-3 bg-ink-line/40 rounded w-5/6"/>
        <div className="h-3 bg-ink-line/40 rounded w-3/4"/>
      </div>
    );
  }

  const env = data.envelope;
  const html = (env.answer_md ?? '').replace(/\{\{cite:(\d+)\}\}/g, (_m, n) => {
    const i = parseInt(n) - 1;
    const cit: Citation | undefined = env.citations[i];
    if (!cit) return '';
    return ` <a href="https://youtu.be/${cit.video_id}?t=${Math.floor(cit.start_sec)}" target="_blank" rel="noopener" class="text-vermilion font-semibold no-underline hover:underline">[${n}]</a>`;
  });
  const paragraphs = html.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <div className="space-y-4 text-sm">
      <div className="text-ink-soft">
        <span className="citation-meta">{lang === 'hi' ? 'चार्ट आधार' : 'Chart drivers'}: </span>
        <span>{data.chartFeatures}</span>
      </div>
      <article className="space-y-3 text-ink leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </article>
      {env.citations.length > 0 && (
        <details>
          <summary className="cursor-pointer citation-meta">
            {lang === 'hi' ? `स्रोत (${env.citations.length})` : `Sources (${env.citations.length})`}
          </summary>
          <ol className="mt-2 space-y-1 pl-1">
            {env.citations.map((c, i) => (
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
    </div>
  );
}
