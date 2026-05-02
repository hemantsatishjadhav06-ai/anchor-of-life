import Link from 'next/link';
import LangToggle from './LangToggle';
import type { Lang } from '@/lib/types';

export default function Header({ lang }: { lang: Lang }) {
  return (
    <header className="border-b-2 border-ink/90 bg-paper/95 backdrop-blur-[2px] sticky top-0 z-30">
      <div className="max-w-wide mx-auto px-6 md:px-10 py-4 flex items-baseline justify-between gap-6">
        <Link href={`/?lang=${lang}`} className="group">
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="font-devanagari text-[1.3rem] md:text-[1.5rem] text-ink leading-none group-hover:text-vermilion transition-colors">जीवन का आधार</span>
            <span className="hidden sm:inline text-ink-mute font-sans text-[0.7rem] tracking-[0.18em] uppercase font-semibold">·  Anchor of Life</span>
          </div>
        </Link>
        <nav className="flex items-baseline gap-5 md:gap-7 text-[0.92rem]">
          <Link href={`/library?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'पुस्तकालय' : 'Library'}</Link>
          <Link href={`/about?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'परिचय' : 'About'}</Link>
          <LangToggle current={lang} />
        </nav>
      </div>
    </header>
  );
}
