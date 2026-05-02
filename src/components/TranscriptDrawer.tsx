'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { formatTime } from '@/lib/youtube';
import type { Lang } from '@/lib/types';

interface Segment {
  seg_idx: number;
  start_sec: number;
  end_sec: number;
  text: string;
}

interface Props {
  videoId: string;
  segments: Segment[];
  lang: Lang;
  initialT?: number;
}

export default function TranscriptDrawer({ videoId, segments, lang, initialT = 0 }: Props) {
  const [activeStart, setActiveStart] = useState<number>(initialT);
  const [filter, setFilter] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Combine consecutive Whisper segments into ~paragraphs (every ~30s)
  const paragraphs = useMemo(() => {
    if (!segments.length) return [];
    const out: Array<{ start: number; end: number; text: string }> = [];
    let cur: { start: number; end: number; text: string } | null = null;
    for (const s of segments) {
      if (!cur) { cur = { start: s.start_sec, end: s.end_sec, text: s.text }; continue; }
      if (s.start_sec - cur.start < 30) {
        cur.text += ' ' + s.text.trim();
        cur.end = s.end_sec;
      } else {
        out.push(cur);
        cur = { start: s.start_sec, end: s.end_sec, text: s.text };
      }
    }
    if (cur) out.push(cur);
    return out;
  }, [segments]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return paragraphs;
    const f = filter.toLowerCase();
    return paragraphs.filter(p => p.text.toLowerCase().includes(f));
  }, [paragraphs, filter]);

  function play(start: number) {
    setActiveStart(start);
    // Reload iframe at new timestamp
    if (iframeRef.current) {
      const params = new URLSearchParams();
      params.set('start', String(Math.floor(start)));
      params.set('rel', '0');
      params.set('modestbranding', '1');
      params.set('autoplay', '1');
      iframeRef.current.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
  }

  useEffect(() => {
    if (initialT > 0) play(initialT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
      {/* Player — sticky on desktop */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="aspect-video w-full bg-paper-deep border border-ink-line/60">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(initialT)}&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            title="video"
          />
        </div>
        <p className="mt-3 citation-meta">
          {lang === 'hi' ? 'वर्तमान चिह्न' : 'Now playing from'} · {formatTime(activeStart)}
        </p>
      </div>

      {/* Transcript */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="citation-meta">{lang === 'hi' ? 'पाठ' : 'Transcript'}</p>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder={lang === 'hi' ? 'पाठ में खोजें…' : 'find in transcript…'}
            className="text-sm bg-transparent border-b border-ink-line focus:border-vermilion outline-none px-1 py-1 font-sans w-44 placeholder:text-ink-mute placeholder:italic"
          />
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3">
          {filtered.map((p, i) => (
            <button
              key={i}
              onClick={() => play(p.start)}
              className={`block text-left w-full pl-3 border-l-2 transition-all hover:border-vermilion ${
                Math.abs(p.start - activeStart) < 30 ? 'border-vermilion bg-paper-deep/50' : 'border-ink-line/40'
              }`}
            >
              <span className="citation-meta block mb-1">{formatTime(p.start)}</span>
              <p className={`text-[0.97rem] leading-relaxed text-ink-soft ${/[ऀ-ॿ]/.test(p.text) ? 'font-devanagari' : 'font-display'}`}>
                {p.text}
              </p>
            </button>
          ))}
          {!filtered.length && filter && (
            <p className="text-ink-mute italic text-sm">{lang === 'hi' ? 'इस पाठ में नहीं मिला' : 'not found in this transcript'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
