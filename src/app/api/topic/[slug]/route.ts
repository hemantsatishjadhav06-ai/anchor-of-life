import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const db = getDb();

  // First: is it a featured card slug?
  const card = db.prepare(`
    SELECT slot, slug, community_ids, label_en, label_hi, description_en, description_hi
    FROM featured_cards WHERE slug = ?
  `).get(params.slug) as any;

  let communityIds: number[] = [];
  let label_en = '', label_hi = '', desc_en = '', desc_hi = '';
  if (card) {
    communityIds = JSON.parse(card.community_ids);
    label_en = card.label_en; label_hi = card.label_hi;
    desc_en = card.description_en ?? ''; desc_hi = card.description_hi ?? '';
  } else {
    // Try as a topic slug (one community)
    const topic = db.prepare(`SELECT community_id, label FROM topics WHERE slug = ?`).get(params.slug) as any;
    if (!topic) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    communityIds = [topic.community_id];
    label_en = topic.label;
    label_hi = topic.label;
  }

  if (!communityIds.length) return NextResponse.json({ error: 'empty_topic' }, { status: 404 });

  const ph = communityIds.map(() => '?').join(',');

  // Top concepts in these communities
  const concepts = db.prepare(`
    SELECT id, label, community_id, community_label, degree
    FROM concepts
    WHERE community_id IN (${ph})
    ORDER BY degree DESC
    LIMIT 30
  `).all(...communityIds);

  // Videos that touch any concept in these communities
  const videos = db.prepare(`
    SELECT v.video_id, v.title, v.url, v.duration_sec, v.series, v.thumbnail_url, COUNT(*) AS hits
    FROM concept_videos cv
    JOIN concepts c ON c.id = cv.concept_id
    JOIN videos v ON v.video_id = cv.video_id
    WHERE c.community_id IN (${ph})
    GROUP BY v.video_id
    ORDER BY hits DESC, v.title
    LIMIT 24
  `).all(...communityIds);

  return NextResponse.json({
    slug: params.slug,
    label_en, label_hi,
    description_en: desc_en, description_hi: desc_hi,
    communities: communityIds,
    concepts,
    videos,
  });
}
