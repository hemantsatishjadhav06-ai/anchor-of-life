import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoTile from '@/components/VideoTile';
import SearchBox from '@/components/SearchBox';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { pickLang } from '@/lib/lang';
import type { Lang } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface FeaturedCard {
  slot: number; slug: string; community_ids: string;
  label_en: string; label_hi: string;
  description_en: string | null; description_hi: string | null;
}

interface TopicRow { community_id: number; label: string }

function getTopicData(slug: string) {
  const db = getDb();
  const card = db.prepare(`
    SELECT slot, slug, community_ids, label_en, label_hi, description_en, description_hi
    FROM featured_cards WHERE slug = ?
  `).get(slug) as FeaturedCard | undefined;

  let cids: number[] = [];
  let labelEn = '', labelHi = '', descEn = '', descHi = '';
  if (card) {
    cids = JSON.parse(card.community_ids);
    labelEn = card.label_en; labelHi = card.label_hi;
    descEn = card.description_en ?? ''; descHi = card.description_hi ?? '';
  } else {
    const t = db.prepare(`SELECT community_id, label FROM topics WHERE slug = ?`).get(slug) as TopicRow | undefined;
    if (!t) return null;
    cids = [t.community_id];
    labelEn = t.label; labelHi = t.label;
  }

  if (!cids.length) return null;
  const ph = cids.map(() => '?').join(',');

  const concepts = db.prepare(`
    SELECT id, label, degree
    FROM concepts
    WHERE community_id IN (${ph})
    ORDER BY degree DESC
    LIMIT 24
  `).all(...cids) as Array<{ id: string; label: string; degree: number }>;

  const videos = db.prepare(`
    SELECT v.video_id, v.title, v.url, v.duration_sec, v.series, v.thumbnail_url, COUNT(*) AS hits
    FROM concept_videos cv
    JOIN concepts c ON c.id = cv.concept_id
    JOIN videos v ON v.video_id = cv.video_id
    WHERE c.community_id IN (${ph})
    GROUP BY v.video_id
    ORDER BY hits DESC, v.title
    LIMIT 24
  `).all(...cids) as Array<{ video_id: string; title: string; duration_sec: number | null; series: string | null; thumbnail_url: string; hits: number }>;

  return { labelEn, labelHi, descEn, descHi, concepts, videos };
}

export default function TopicPage({ params, searchParams }: { params: { slug: string }; searchParams: { lang?: string } }) {
  const data = getTopicData(params.slug);
  if (!data) notFound();
  const lang: Lang = pickLang(searchParams.lang);

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        <Link href={`/?lang=${lang}#topics`} className="btn-text">← {lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</Link>

        <header className="mt-6 mb-10 max-w-folio">
          <p className="citation-meta">{lang === 'hi' ? 'जीवन प्रसंग' : 'Life situation'}</p>
          <h1 className={`mt-2 font-display text-4xl md:text-5xl leading-[1.05] tracking-tighter-display text-ink ${lang === 'hi' ? 'font-devanagari' : ''}`}>
            {lang === 'hi' ? data.labelHi : data.labelEn}
          </h1>
          {(lang === 'hi' ? data.descHi : data.descEn) && (
            <p className="mt-4 text-ink-soft max-w-prose">{lang === 'hi' ? data.descHi : data.descEn}</p>
          )}
        </header>

        {/* Ask within this topic */}
        <section className="max-w-folio mb-12">
          <p className="citation-meta mb-3">{lang === 'hi' ? 'इस विषय पर पूछिए' : 'Ask about this'}</p>
          <SearchBox lang={lang} />
        </section>

        {/* Concepts */}
        {data.concepts.length > 0 && (
          <section className="border-t border-ink-line/60 pt-8 mb-14">
            <p className="citation-meta mb-4">{lang === 'hi' ? 'मुख्य अवधारणाएँ' : 'Core concepts'}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 max-w-wide">
              {data.concepts.map(c => (
                <span key={c.id} className={`font-display ${/[ऀ-ॿ]/.test(c.label) ? 'font-devanagari' : 'italic'} text-ink-soft text-lg`}>
                  {c.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        <section className="border-t border-ink-line/60 pt-8">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl text-ink">
              {lang === 'hi' ? 'इस विषय पर शिक्षाएँ' : 'Teachings on this'}
            </h2>
            <p className="text-sm text-ink-mute">{data.videos.length} {lang === 'hi' ? 'शिक्षाएँ' : 'teachings'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {data.videos.map(v => <VideoTile key={v.video_id} video={v} lang={lang} />)}
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
