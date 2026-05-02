'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ytEmbedUrl, formatTime } from '@/lib/youtube';
import type { AnswerEnvelope, Citation, Lang } from '@/lib/types';
import { STR } from '@/lib/i18n';

function renderAnswerWithCites(answer: string, citations: Citation[], onCiteClick: (i: number) => void) {
  const parts: Array<{ text: string; cite?: number }> = [];
  const re = /\{\{cite:(\d+)\}\}/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    if (m.index > last) parts.push({ text: answer.slice(last, m.index) });
    parts.push({ text: '', cite: parseInt(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < answer.length) parts.push({ text: answer.slice(last) });

  const blocks: JSX.Element[] = [];
  let buf: Array<JSX.Element | string> = [];
  let key = 0;
  function flushPara() {
    if (!buf.length) return;
    blocks.push(<p key={`p-${key++}`}>{buf}</p>);
    buf = [];
  }
  for (const p of parts) {
    if (p.cite !== undefined) {
      buf.push(
        <sup key={`c-${key++}`}>
          <button
            type="button"
            onClick={() => onCiteClick(p.cite! - 1)}
            className="cite-marker ml-0.5 font-sans text-[0.72em] focus:outline-none"
            aria-label={`Source ${p.cite}`}
          >[{p.cite}]</button>
        </sup>
      );
      continue;
    }
    const subs = p.text.split(/\n\n+/);
    subs.forEach((sub, i) => {
      if (i > 0) flushPara();
      const tokens = sub.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      for (const tk of tokens) {
        if (!tk) continue;
        if (tk.startsWith('**') && tk.endsWith('**')) buf.push(<strong key={`s-${key++}`}>{tk.slice(2, -2)}</strong>);
        else if (tk.startsWith('*') && tk.endsWith('*')) buf.push(<em key={`e-${key++}`}>{tk.slice(1, -1)}</em>);
        else buf.push(tk);
      }
    });
  }
  flushPara();
  return blocks;
}

interface Props { question: string; lang: Lang; }

export default function FolioAnswer({ question, lang }: Props) {
  const [data, setData] = useState<AnswerEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCite, setActiveCite] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null); setError(null);
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language: lang }),
    })
      .then(async r => {
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.message ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(d => { if (!cancelled) setData(d as AnswerEnvelope); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [question, lang]);

  if (error) {
    return (
      <div className="max-w-folio mx-auto py-16 reveal-up">
        <p className="text-ink-soft">{lang === 'hi' ? 'क्षमा करें — एक त्रुटि हुई।' : 'Sorry — something went wrong.'}</p>
        <p className="text-ink-mute text-sm mt-2 italic">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-folio mx-auto py-16">
        <div className="flex items-center gap-3 text-ink-mute">
          <span className="inline-block w-2 h-2 rounded-full bg-gerua daily-breath" />
          <span className="text-sm uppercase tracking-wider">{STR.loading[lang]}</span>
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-3 bg-paper-deep rounded w-1/3" />
          <div className="h-3 bg-paper-deep rounded w-full" />
          <div className="h-3 bg-paper-deep rounded w-5/6" />
          <div className="h-3 bg-paper-deep rounded w-3/4" />
          <div className="h-3 bg-paper-deep rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!data.answer_md || !data.citations.length) {
    return (
      <div className="max-w-folio mx-auto py-12 reveal-up">
        <p className="citation-meta mb-3">{STR.youAsked[lang]}</p>
        <p className={`pull ${lang === 'hi' ? 'lang-hi' : ''}`}>{question}</p>
        <hr className="rule" />
        <p className="text-ink-soft text-lg leading-relaxed">{STR.noResults[lang]}</p>
        <p className="mt-6">
          <a href="https://www.brajeshgautam.com/Contact-us" target="_blank" rel="noopener" className="btn-ink">
            {STR.bookConsultation[lang]}
          </a>
        </p>
      </div>
    );
  }

  const primary = data.citations[Math.max(0, data.primary_citation_index - 1)] ?? data.citations[0];
  const cite = data.citations[activeCite] ?? primary;
  const lensLabels: string[] = [];
  if (data.lens.inner) lensLabels.push(lang === 'hi' ? 'अंतर्मन' : 'inner work');
  if (data.lens.jyotish) lensLabels.push(lang === 'hi' ? 'ज्योतिष' : 'jyotish');
  if (data.lens.practice) lensLabels.push(lang === 'hi' ? 'अभ्यास' : 'practice');

  return (
    <article className="folio-grid pb-20 max-w-wide mx-auto">
      {/* Left rail: question + meta (sticky on desktop) */}
      <aside className="lg:sticky lg:top-8 lg:self-start reveal-up">
        <p className="citation-meta mb-3">{STR.youAsked[lang]}</p>
        <p className={`pull ${lang === 'hi' ? 'lang-hi' : ''}`}>{question}</p>
        <div className="mt-6 space-y-2 text-xs text-ink-mute uppercase tracking-wider">
          {data.total_mentions > 0 && (
            <p className="leading-relaxed">
              {lang === 'hi'
                ? `ब्रजेश जी ने इस विषय पर ${data.total_mentions} शिक्षाओं में चर्चा की है।`
                : `Brajesh ji has spoken about this in ${data.total_mentions} teachings.`}
            </p>
          )}
          {lensLabels.length > 0 && (
            <p>{lang === 'hi' ? 'दृष्टिकोण: ' : 'Lens: '}{lensLabels.join(' + ')}</p>
          )}
        </div>
      </aside>

      {/* Center: answer body + clip + quote */}
      <main>
        <div className={`folio-prose ${lang === 'hi' ? 'lang-hi' : ''}`}>
          {renderAnswerWithCites(data.answer_md, data.citations, setActiveCite)}
        </div>

        {/* Embedded primary clip — break the grid by being full-width inside the center column */}
        <section className="mt-10 reveal-up reveal-delay-3">
          <div className="aspect-video w-full bg-paper-deep border border-ink-line/60 overflow-hidden">
            <iframe
              src={ytEmbedUrl(cite.video_id, cite.start_sec, cite.end_sec)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              title={cite.title}
            />
          </div>
          <p className="mt-3 citation-meta">
            {STR.source[lang]} [{activeCite + 1}] · <span className="font-display normal-case tracking-normal text-ink-soft italic">{cite.title}</span> · {formatTime(cite.start_sec)}
          </p>
        </section>

        {/* In Brajesh ji's words */}
        <section className="mt-12 pl-6 border-l-2 border-vermilion reveal-up reveal-delay-3">
          <p className="citation-meta mb-3">{STR.brajeshJiSays[lang]}</p>
          <blockquote className={`font-display text-xl leading-relaxed text-ink ${lang === 'hi' || /[ऀ-ॿ]/.test(cite.quote) ? 'font-devanagari' : 'italic'}`}>
            <span className="text-vermilion mr-1">❝</span>{cite.quote}<span className="text-vermilion ml-1">❞</span>
          </blockquote>
          <p className="mt-3 text-sm text-ink-mute">
            — {STR.at[lang]} {formatTime(cite.start_sec)} {STR.in[lang]} <Link href={`/library/${cite.video_id}?lang=${lang}&t=${cite.start_sec}`} className="italic underline-offset-4 hover:underline">{cite.title}</Link>
          </p>
        </section>

        {/* Disclaimer */}
        <hr className="rule mt-14" />
        <p className="text-xs text-ink-mute leading-relaxed max-w-prose">
          {STR.disclaimer[lang]}
        </p>
      </main>

      {/* Right rail: source list + related topics */}
      <aside className="lg:sticky lg:top-8 lg:self-start space-y-10 reveal-up reveal-delay-2">
        {data.citations.length > 1 && (
          <div>
            <p className="citation-meta mb-4">{lang === 'hi' ? 'अन्य संदर्भ' : 'Sources'}</p>
            <ul className="space-y-3">
              {data.citations.map((c, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveCite(i)}
                    className={`text-left w-full ${i === activeCite ? 'text-vermilion' : 'text-ink-soft hover:text-ink'} transition-colors`}
                  >
                    <span className="citation-meta block mb-1">[{i + 1}] {formatTime(c.start_sec)}</span>
                    <span className="font-display italic text-sm leading-snug block">{c.title.replace(/\s*-\s*Brajesh Gautam.*$/i, '').replace(/\s*\(\d{1,2}\s+\w+\s+\d{4}\s*\)$/, '')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.related_topics.length > 0 && (
          <div>
            <p className="citation-meta mb-3">{STR.alsoExplore[lang]}</p>
            <ul className="space-y-2">
              {data.related_topics.map(t => (
                <li key={t} className="font-display italic text-ink-soft text-sm">{t}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </article>
  );
}
