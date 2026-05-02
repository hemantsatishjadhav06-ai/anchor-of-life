import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoTile from '@/components/VideoTile';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { pickLang } from '@/lib/lang';
import type { Lang } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SERIES = [
  { key: null,            en: 'All teachings', hi: 'सभी शिक्षाएँ' },
  { key: 'jyotish_vidya', en: 'Jyotish Vidya', hi: 'ज्योतिष विद्या' },
  { key: 'was',           en: 'When Ananda Speaks', hi: 'WAS QnA' },
  { key: 'anchor_of_life',en: 'Anchor of Life', hi: 'जीवन का आधार' },
  { key: 'sanatan',       en: 'Sanatan',       hi: 'सनातन' },
];

interface Video {
  video_id: string; title: string; url: string;
  duration_sec: number | null; language: string | null;
  series: string | null; thumbnail_url: string;
}

function getVideos(series: string | null): Video[] {
  const db = getDb();
  if (series) {
    return db.prepare(`
      SELECT video_id, title, url, duration_sec, language, series, thumbnail_url
      FROM videos WHERE series = ? ORDER BY title
    `).all(series) as Video[];
  }
  return db.prepare(`
    SELECT video_id, title, url, duration_sec, language, series, thumbnail_url
    FROM videos
    ORDER BY series IS NULL, series, title
  `).all() as Video[];
}

export default function LibraryPage({ searchParams }: { searchParams: { lang?: string; series?: string } }) {
  const lang: Lang = pickLang(searchParams.lang);
  const series = searchParams.series ?? null;
  const videos = getVideos(series);

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <div className="mb-10">
          <p className="citation-meta">{lang === 'hi' ? 'पुस्तकालय' : 'The Library'}</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink mt-2 tracking-tighter-display">
            {lang === 'hi' ? <span className="font-devanagari">तीस वर्षों की शिक्षाएँ</span> : 'Three decades, recorded.'}
          </h1>
          <p className="mt-4 text-ink-soft max-w-prose">
            {lang === 'hi'
              ? `${videos.length} वीडियो — हर एक का transcript और समय-चिह्न उपलब्ध। हिंदी और अंग्रेज़ी।`
              : `${videos.length} teachings — every one fully transcribed, every word linked to its second. Hindi and English.`}
          </p>
        </div>

        {/* Series filter */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-ink-line/60 py-4 mb-10">
          {SERIES.map(s => {
            const active = (s.key ?? null) === series;
            const href = s.key ? `/library?lang=${lang}&series=${s.key}` : `/library?lang=${lang}`;
            return (
              <Link key={s.key ?? 'all'} href={href} className={`text-[0.92rem] ${active ? 'text-vermilion font-semibold' : 'text-ink-soft hover:text-ink'} transition-colors`}>
                {s[lang]}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {videos.map(v => <VideoTile key={v.video_id} video={v} lang={lang} />)}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
