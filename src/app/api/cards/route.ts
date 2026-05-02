import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const cards = db.prepare(`
    SELECT slot, slug, community_ids, label_en, label_hi, description_en, description_hi
    FROM featured_cards
    ORDER BY slot
  `).all() as any[];

  // Attach video count + top concepts for each card
  for (const c of cards) {
    const cids: number[] = JSON.parse(c.community_ids);
    if (!cids.length) { c.video_count = 0; c.top_concepts = []; continue; }
    const ph = cids.map(() => '?').join(',');
    const vc = (db.prepare(`
      SELECT COUNT(DISTINCT v.video_id) AS n
      FROM concept_videos cv
      JOIN concepts c ON c.id = cv.concept_id
      JOIN videos v ON v.video_id = cv.video_id
      WHERE c.community_id IN (${ph})
    `).get(...cids) as { n: number }).n;
    c.video_count = vc;
    const tops = db.prepare(`
      SELECT label FROM concepts
      WHERE community_id IN (${ph})
      ORDER BY degree DESC
      LIMIT 4
    `).all(...cids) as Array<{ label: string }>;
    c.top_concepts = tops.map(t => t.label);
    c.community_ids = cids;
  }

  return NextResponse.json({ cards });
}
