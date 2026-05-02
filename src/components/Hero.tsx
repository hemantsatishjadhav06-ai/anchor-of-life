import SearchBox from './SearchBox';
import type { Lang } from '@/lib/types';

export default function Hero({ lang, stats }: { lang: Lang; stats: { videos: number; concepts: number; hours: number } }) {
  return (
    <section className="paper-grain">
      <div className="max-w-folio mx-auto px-6 md:px-0 pt-16 md:pt-24 pb-12">
        <p className="citation-meta">{lang === 'hi' ? 'ब्रजेश गौतम जी के साथ' : 'with Brajesh Gautam'}</p>
        <h1 className="mt-3 font-display text-[2.6rem] md:text-[3.6rem] leading-[1.05] tracking-tighter-display text-ink">
          {lang === 'hi' ? (
            <>
              <span className="font-devanagari">जीवन का</span>{' '}
              <span className="font-devanagari italic font-light">मार्गदर्शक</span>
              <br />
              <span className="text-ink-mute text-[0.55em] font-sans tracking-wider uppercase">The Anchor of Life</span>
            </>
          ) : (
            <>
              <span className="font-devanagari text-[0.85em]">जीवन का मार्गदर्शक</span>
              <br />
              <span>The <em className="italic font-light">Anchor</em> of Life.</span>
            </>
          )}
        </h1>
        <p className="mt-6 text-ink-soft text-lg leading-relaxed max-w-prose">
          {lang === 'hi'
            ? 'तीस वर्षों की शिक्षाएँ। कुछ भी पूछिए — वे शायद उत्तर दे चुके हैं।'
            : 'Thirty years of teachings. Ask anything — he has likely already answered.'}
        </p>
        <div className="mt-10">
          <SearchBox lang={lang} autoFocus />
        </div>
        <div className="mt-12 flex items-center gap-8 text-xs text-ink-mute uppercase tracking-wider">
          <span>{stats.videos} {lang === 'hi' ? 'शिक्षाएँ' : 'teachings'}</span>
          <span className="text-ink-line">·</span>
          <span>{stats.concepts.toLocaleString()} {lang === 'hi' ? 'अवधारणाएँ' : 'concepts'}</span>
          <span className="text-ink-line">·</span>
          <span>~{stats.hours} {lang === 'hi' ? 'घंटे' : 'hours'}</span>
          <span className="text-ink-line">·</span>
          <span className="font-devanagari normal-case tracking-normal">हिंदी &amp; English</span>
        </div>
      </div>
    </section>
  );
}
