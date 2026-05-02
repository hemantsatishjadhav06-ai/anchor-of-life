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
      className="btn-text uppercase tracking-wider text-[0.78rem]"
      aria-label={`Switch to ${next === 'hi' ? 'Hindi' : 'English'}`}
    >
      {current === 'en' ? 'हिन्दी' : 'English'}
    </Link>
  );
}
