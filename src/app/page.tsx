import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import DailyAnchor from '@/components/DailyAnchor';
import LifeSituationCards from '@/components/LifeSituationCards';
import { getDb } from '@/lib/db';
import { pickLang } from '@/lib/lang';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getStats() {
  const db = getDb();
  const v = (db.prepare('SELECT count(*) AS n FROM videos').get() as { n: number }).n;
  const c = (db.prepare('SELECT count(*) AS n FROM concepts').get() as { n: number }).n;
  const sec = (db.prepare('SELECT COALESCE(SUM(duration_sec), 0) AS s FROM videos').get() as { s: number }).s;
  return { videos: v, concepts: c, hours: Math.round(sec / 3600) };
}

export default function HomePage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = pickLang(searchParams.lang);
  const stats = getStats();
  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 pb-16">
        <Hero lang={lang} stats={stats} />
        <DailyAnchor lang={lang} />
        <LifeSituationCards lang={lang} />

        {/* Library teaser */}
        <section className="border-t border-ink-line/60 pt-10 mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl md:text-4xl text-ink tracking-tighter-display">
              {lang === 'hi' ? <span className="font-devanagari">पुस्तकालय</span> : 'The Library'}
            </h2>
            <Link href={`/library?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'सभी देखें' : 'Browse all'} →</Link>
          </div>
          <p className="mt-3 text-ink-soft max-w-prose">
            {lang === 'hi'
              ? `${stats.videos} वीडियो शिक्षाएँ — हर एक खोजी जा सकती है, हर एक का समय-चिह्नित transcript उपलब्ध है। शृंखलाएँ: Jyotish Vidya, When Ananda Speaks, Anchor of Life।`
              : `${stats.videos} recorded teachings — each fully searchable, each with a timestamped transcript. Series: Jyotish Vidya, When Ananda Speaks, Anchor of Life.`}
          </p>
        </section>

        {/* Quiet about line */}
        <section className="border-t border-ink-line/60 pt-10 mt-12">
          <p className="font-display text-xl md:text-2xl leading-relaxed text-ink-soft max-w-prose italic">
            {lang === 'hi'
              ? 'श्री ब्रजेश गौतम जी, ज्योतिषाचार्य और आध्यात्मिक मार्गदर्शक, तीन दशकों से लोगों को तनाव, अवसाद और मानसिक पीड़ा से बाहर निकालने का कार्य कर रहे हैं।'
              : 'Shri Brajesh Gautam ji, astrologer and spiritual mentor of three decades, has helped thousands across India, the UK, Canada, USA, and Nepal come out of stress, depression, and mental agony.'}
          </p>
          <p className="mt-6">
            <Link href={`/about?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'और पढ़ें' : 'Read more'} →</Link>
          </p>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
