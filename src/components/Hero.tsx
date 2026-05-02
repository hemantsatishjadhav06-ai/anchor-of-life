import Image from 'next/image';
import SearchBox from './SearchBox';
import type { Lang } from '@/lib/types';

export default function Hero({ lang, stats }: { lang: Lang; stats: { videos: number; concepts: number; hours: number } }) {
  return (
    <section className="relative paper-grain border-b border-ink-line/40">
      <div className="max-w-wide mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-14 md:pb-20 grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-center">
        {/* Left: type-led hero */}
        <div className="reveal-up">
          <p className="citation-meta">
            {lang === 'hi' ? 'श्री ब्रजेश गौतम के साथ' : 'with Shri Brajesh Gautam'}
          </p>

          <h1 className="mt-4 font-display text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] lg:text-[4rem] leading-[0.98] tracking-tighter-display text-ink">
            {lang === 'hi' ? (
              <>
                <span className="font-devanagari">जीवन का</span>{' '}
                <span className="font-devanagari italic font-light text-vermilion">मार्गदर्शक</span>
                <br />
                <span className="text-ink-mute font-display normal-case text-[0.5em] tracking-wider uppercase mt-3 block">The Anchor of Life</span>
              </>
            ) : (
              <>
                The <em className="italic font-light text-vermilion">Anchor</em>
                <br />
                of Life.
                <span className="block mt-2 font-devanagari text-[0.5em] text-ink-mute font-normal">जीवन का मार्गदर्शक</span>
              </>
            )}
          </h1>

          <p className={`mt-7 text-ink text-lg md:text-xl leading-relaxed max-w-prose font-semibold ${lang === 'hi' ? 'font-devanagari' : ''}`}>
            {lang === 'hi'
              ? 'तीस वर्षों की शिक्षाएँ। कुछ भी पूछिए — वे शायद उत्तर दे चुके हैं।'
              : 'Thirty years of teachings. Ask anything — he has likely already answered.'}
          </p>

          <div className="mt-10 max-w-2xl">
            <SearchBox lang={lang} autoFocus />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] text-ink-mute uppercase tracking-[0.14em] font-semibold">
            <span>~{stats.hours} {lang === 'hi' ? 'घंटे' : 'hours'}</span>
            <span className="text-ink-line">/</span>
            <span>{stats.videos} {lang === 'hi' ? 'शिक्षाएँ' : 'teachings'}</span>
            <span className="text-ink-line">/</span>
            <span className="font-devanagari normal-case tracking-normal text-ink-soft">हिंदी &amp; English</span>
          </div>
        </div>

        {/* Right: portrait */}
        <div className="relative aspect-[800/1028] max-w-sm mx-auto lg:max-w-none lg:mx-0 reveal-up reveal-delay-1 border-2 border-ink/85">
          <Image
            src="/img/brajesh-portrait.jpg"
            alt="Shri Brajesh Gautam"
            fill
            sizes="(min-width: 1024px) 32vw, 80vw"
            className="object-cover"
            priority
          />
          {/* Caption strip — museum label */}
          <div className="absolute bottom-0 left-0 right-0 bg-paper border-t-2 border-ink/85 px-3 py-2">
            <p className="citation-meta text-[0.68rem] text-ink-soft">
              {lang === 'hi' ? 'ब्रजेश गौतम जी' : 'Brajesh Gautam ji'}
              <span className="mx-2 text-ink-mute">·</span>
              <span className="text-ink-mute">{lang === 'hi' ? 'ज्योतिषाचार्य · आध्यात्मिक मार्गदर्शक' : 'astrologer · spiritual mentor'}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
