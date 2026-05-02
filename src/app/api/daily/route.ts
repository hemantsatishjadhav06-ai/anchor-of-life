import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

// Pick a deterministic "today's anchor" — a curated, well-known teaching.
// Algorithm: rank videos by (a) being a known signature title, (b) having distinctive concepts,
// then rotate by day-of-year so the same day always gets the same anchor.
interface PoolRow { video_id: string; title: string; series: string | null; thumbnail_url: string; url: string; duration_sec: number | null }

function pickToday<T>(rows: T[]): T | null {
  if (!rows.length) return null;
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return rows[day % rows.length];
}

export async function GET() {
  const db = getDb();
  // Prefer Anchor of Life signature videos; fall back to other curated.
  // (REGEXP requires a runtime function in SQLite; we omit it and let the LIKE-only
  //  fallback below populate the pool.)
  const candidates: PoolRow[] = [];

  // Fallback (REGEXP isn't available natively in better-sqlite3) — try LIKE-only fallback.
  let pool: PoolRow[] = candidates as PoolRow[];
  if (!pool.length) {
    const keywords = ['Chamko', 'Krishn', 'Leela', 'Munna', 'Paap', 'Quota', 'Pitrr', 'Tinku', 'Waala', 'PUMP', 'Preliving', 'Burden', 'Maya', 'Heart', 'Tan Man'];
    const wheres = keywords.map(() => 'title LIKE ?').join(' OR ');
    const args = keywords.map(k => `%${k}%`);
    pool = db.prepare(`
      SELECT video_id, title, series, thumbnail_url, url, duration_sec
      FROM videos
      WHERE ${wheres}
      ORDER BY video_id
    `).all(...args) as PoolRow[];
  }
  if (!pool.length) {
    // Total fallback: most recent
    pool = db.prepare(`SELECT video_id, title, series, thumbnail_url, url, duration_sec FROM videos ORDER BY video_id DESC LIMIT 30`).all() as PoolRow[];
  }

  const pick = pickToday(pool);
  if (!pick) return NextResponse.json({ error: 'no_videos' }, { status: 404 });

  // Find a memorable opening segment (>= 60s in, length-bounded)
  const seg = db.prepare(`
    SELECT start_sec, end_sec, text
    FROM segments
    WHERE video_id = ? AND start_sec > 30
    ORDER BY start_sec
    LIMIT 1
  `).get(pick.video_id) as any;

  return NextResponse.json({
    video_id: pick.video_id,
    title: pick.title,
    series: pick.series,
    thumbnail_url: pick.thumbnail_url,
    url: pick.url,
    duration_sec: pick.duration_sec,
    excerpt_text: seg?.text ?? '',
    excerpt_start: seg?.start_sec ?? 0,
  });
}
