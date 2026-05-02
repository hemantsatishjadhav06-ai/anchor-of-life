'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Lang } from '@/lib/types';

export default function LangToggle({ current }: { current: Lang }) {
  const path = usePathname();
  const sp = useSearchParams();
  const next: Lang = current === 'en' ? 'hi' : 'en';
  const params = new URLSearchParams(Array.from(sp.entries()));
  params.set('lang', next);
  return (
    <Link
      href={`${path}?${params.toString()}`}
      className="font-sans text-[0.78rem] tracking-[0.12em] uppercase font-semibold text-ink hover:text-vermilion transition-colors px-2 py-1 border border-ink/30 hover:border-vermilion"
      aria-label={`Switch to ${next === 'hi' ? 'Hindi' : 'English'}`}
    >
      {current === 'en' ? 'हिन्दी' : 'English'}
    </Link>
  );
}
