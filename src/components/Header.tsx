import Link from 'next/link';
import LangToggle from './LangToggle';
import type { Lang } from '@/lib/types';

export default function Header({ lang }: { lang: Lang }) {
  return (
    <header className="border-b border-ink-line/60">
      <div className="max-w-wide mx-auto px-6 md:px-10 py-5 flex items-baseline justify-between">
        <Link href={`/?lang=${lang}`} className="font-display tracking-tighter-display text-[1.35rem] md:text-[1.45rem] text-ink hover:text-ink-soft transition-colors">
          <span className="font-devanagari mr-2">जीवन का आधार</span>
          <span className="text-ink-mute font-sans text-[0.78rem] tracking-wider uppercase ml-1">·  Anchor of Life</span>
        </Link>
        <nav className="flex items-baseline gap-7 text-[0.92rem]">
          <Link href={`/library?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'पुस्तकालय' : 'Library'}</Link>
          <Link href={`/about?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'परिचय' : 'About'}</Link>
          <LangToggle current={lang} />
        </nav>
      </div>
    </header>
  );
}
