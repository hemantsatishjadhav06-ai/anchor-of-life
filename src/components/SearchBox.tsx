'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/types';
import { STR } from '@/lib/i18n';

export default function SearchBox({ lang, autoFocus = false, initial = '' }: { lang: Lang; autoFocus?: boolean; initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const [hintIdx, setHintIdx] = useState(0);
  const hints = STR.searchHints[lang];

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Rotate placeholder every 4s while empty/unfocused
  useEffect(() => {
    if (q.length > 0) return;
    const id = setInterval(() => setHintIdx(i => (i + 1) % hints.length), 4200);
    return () => clearInterval(id);
  }, [q, hints.length]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const s = q.trim();
    if (s.length < 2) return;
    router.push(`/ask?q=${encodeURIComponent(s)}&lang=${lang}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={hints[hintIdx]}
          className={`input-rule ${lang === 'hi' ? 'font-devanagari' : ''}`}
          aria-label={STR.askPlaceholder[lang]}
          enterKeyHint="search"
        />
        <span className="absolute right-0 bottom-3 text-ink-mute text-xs uppercase tracking-wider pointer-events-none">↵</span>
      </div>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-[0.8rem] text-ink-mute tracking-[0.12em] uppercase font-bold">
        <span>{lang === 'hi' ? 'या पूछिए' : 'or try'}</span>
        {hints.slice(0, 3).map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setQ(h); setTimeout(() => submit(), 0); }}
            className={`normal-case tracking-normal text-ink hover:text-vermilion underline underline-offset-[5px] decoration-ink decoration-[1.5px] hover:decoration-vermilion hover:decoration-2 transition-colors font-medium ${lang === 'hi' ? 'font-devanagari' : 'font-display'}`}
          >
            “{h}”
          </button>
        ))}
      </div>
    </form>
  );
}
