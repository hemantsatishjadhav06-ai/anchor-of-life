import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const video = db.prepare(`
    SELECT video_id, title, url, duration_sec, language, word_count, published_at, series, thumbnail_url
    FROM videos WHERE video_id = ?
  `).get(params.id);
  if (!video) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const segments = db.prepare(`
    SELECT seg_idx, start_sec, end_sec, text
    FROM segments WHERE video_id = ?
    ORDER BY start_sec
  `).all(params.id);

  const concepts = db.prepare(`
    SELECT c.id, c.label, c.community_label
    FROM concept_videos cv
    JOIN concepts c ON c.id = cv.concept_id
    WHERE cv.video_id = ?
    ORDER BY c.degree DESC
    LIMIT 20
  `).all(params.id);

  return NextResponse.json({ video, segments, concepts });
}
