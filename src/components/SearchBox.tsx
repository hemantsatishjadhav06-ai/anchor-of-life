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
      <div className="mt-3 text-xs text-ink-mute uppercase tracking-wider">
        {lang === 'hi' ? 'या पूछिए' : 'or try'}:
        <span className="ml-2 normal-case tracking-normal text-ink-soft">
          {hints.slice(0, 3).map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setQ(h); setTimeout(() => submit(), 0); }}
              className={`mr-3 hover:text-ink underline-offset-4 hover:underline ${lang === 'hi' ? 'font-devanagari' : 'italic'}`}
            >
              "{h}"
            </button>
          ))}
        </span>
      </div>
    </form>
  );
}
