import Link from 'next/link';
import { getDb } from '@/lib/db';
import type { Lang } from '@/lib/types';

interface Card {
  slot: number;
  slug: string;
  community_ids: number[];
  label_en: string;
  label_hi: string;
  description_en: string;
  description_hi: string;
  video_count: number;
  top_concepts: string[];
}

function getCards(): Card[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT slot, slug, community_ids, label_en, label_hi, description_en, description_hi
    FROM featured_cards ORDER BY slot
  `).all() as Array<Omit<Card, 'community_ids' | 'video_count' | 'top_concepts'> & { community_ids: string }>;

  return rows.map(r => {
    const cids = JSON.parse(r.community_ids) as number[];
    const ph = cids.length ? cids.map(() => '?').join(',') : '0';
    const vc = cids.length ? (db.prepare(`
      SELECT COUNT(DISTINCT v.video_id) AS n
      FROM concept_videos cv
      JOIN concepts c ON c.id = cv.concept_id
      JOIN videos v ON v.video_id = cv.video_id
      WHERE c.community_id IN (${ph})
    `).get(...cids) as { n: number }).n : 0;
    const tops = cids.length ? db.prepare(`
      SELECT label FROM concepts WHERE community_id IN (${ph}) ORDER BY degree DESC LIMIT 4
    `).all(...cids) as Array<{ label: string }> : [];
    return {
      ...r,
      community_ids: cids,
      video_count: vc,
      top_concepts: tops.map(t => t.label),
    };
  });
}

export default function LifeSituationCards({ lang }: { lang: Lang }) {
  const cards = getCards();
  return (
    <section id="topics" className="border-t border-ink-line/60 pt-10 mt-12 reveal-up">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display text-3xl md:text-4xl text-ink tracking-tighter-display">
          {lang === 'hi' ? <span className="font-devanagari">मन में क्या है?</span> : 'What are you carrying?'}
        </h2>
        <p className="text-sm text-ink-mute hidden md:block">
          {lang === 'hi' ? 'जीवन के आठ प्रसंग, उनकी शिक्षाओं से सजे' : 'Eight life situations, drawn from his teachings'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2">
        {cards.map(c => (
          <Link key={c.slug} href={`/topic/${c.slug}?lang=${lang}`} className="card-quiet group">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-[1.55rem] leading-tight text-ink group-hover:text-vermilion transition-colors">
                {lang === 'hi' ? c.label_hi : c.label_en}
              </p>
              <span className="citation-meta whitespace-nowrap ml-3 mt-1">
                {c.video_count} {lang === 'hi' ? 'शिक्षाएँ' : 'teachings'}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-mute leading-relaxed">
              {lang === 'hi' ? c.description_hi : c.description_en}
            </p>
            {c.top_concepts.length > 0 && (
              <p className="mt-3 text-[0.78rem] text-ink-mute italic line-clamp-1">
                {c.top_concepts.slice(0, 3).join(' · ')}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
