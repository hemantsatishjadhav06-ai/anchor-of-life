import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TranscriptDrawer from '@/components/TranscriptDrawer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { pickLang } from '@/lib/lang';
import { ytTimestampUrl, formatTime } from '@/lib/youtube';
import type { Lang } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Video {
  video_id: string; title: string; url: string;
  duration_sec: number | null; language: string | null;
  series: string | null; thumbnail_url: string; word_count: number | null;
}

interface Concept {
  id: string; label: string; community_label: string | null;
}

function getVideoData(id: string) {
  const db = getDb();
  const video = db.prepare(`
    SELECT video_id, title, url, duration_sec, language, series, thumbnail_url, word_count
    FROM videos WHERE video_id = ?
  `).get(id) as Video | undefined;
  if (!video) return null;
  const segments = db.prepare(`
    SELECT seg_idx, start_sec, end_sec, text
    FROM segments WHERE video_id = ? ORDER BY start_sec
  `).all(id) as Array<{ seg_idx: number; start_sec: number; end_sec: number; text: string }>;
  const concepts = db.prepare(`
    SELECT c.id, c.label, c.community_label
    FROM concept_videos cv
    JOIN concepts c ON c.id = cv.concept_id
    WHERE cv.video_id = ?
    ORDER BY c.degree DESC LIMIT 18
  `).all(id) as Concept[];
  return { video, segments, concepts };
}

export default function VideoPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string; t?: string } }) {
  const data = getVideoData(params.id);
  if (!data) notFound();
  const lang: Lang = pickLang(searchParams.lang);
  const initialT = searchParams.t ? parseInt(searchParams.t) : 0;

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <Link href={`/library?lang=${lang}`} className="btn-text">← {lang === 'hi' ? 'पुस्तकालय' : 'Library'}</Link>

        <header className="mt-6 mb-8 max-w-folio">
          {data.video.series && (
            <p className="citation-meta">{data.video.series.replace(/_/g, ' ')}</p>
          )}
          <h1 className={`mt-2 font-display text-3xl md:text-4xl leading-tight text-ink ${/[ऀ-ॿ]/.test(data.video.title) ? 'font-devanagari' : ''}`}>
            {data.video.title}
          </h1>
          <p className="mt-3 text-sm text-ink-mute">
            {data.video.duration_sec ? `${formatTime(data.video.duration_sec)} · ` : ''}
            {data.segments.length} segments
            {data.video.word_count ? ` · ${data.video.word_count.toLocaleString()} ${lang === 'hi' ? 'शब्द' : 'words'}` : ''}
            {' · '}
            <a href={ytTimestampUrl(data.video.video_id, 0)} target="_blank" rel="noopener" className="hover:underline underline-offset-4">{lang === 'hi' ? 'YouTube पर खोलें' : 'Open on YouTube'} ↗</a>
          </p>
        </header>

        <TranscriptDrawer videoId={data.video.video_id} segments={data.segments} lang={lang} initialT={initialT} />

        {data.concepts.length > 0 && (
          <section className="mt-14 border-t border-ink-line/60 pt-8 max-w-wide">
            <p className="citation-meta mb-4">{lang === 'hi' ? 'इस शिक्षा में आए विचार' : 'Concepts in this teaching'}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 max-w-prose">
              {data.concepts.map(c => (
                <span key={c.id} className={`font-display italic text-ink-soft ${/[ऀ-ॿ]/.test(c.label) ? 'font-devanagari not-italic' : ''}`}>
                  {c.label}
                  {c.community_label && <span className="text-ink-mute text-xs not-italic ml-1">·{c.community_label}·</span>}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
