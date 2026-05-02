import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const series = url.searchParams.get('series');
  const lang = url.searchParams.get('lang');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '60'), 300);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const db = getDb();
  const wheres: string[] = [];
  const args: any[] = [];
  if (series) { wheres.push('series = ?'); args.push(series); }
  if (lang)   { wheres.push('language = ?'); args.push(lang); }
  const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT video_id, title, url, duration_sec, language, word_count, series, thumbnail_url
    FROM videos
    ${where}
    ORDER BY series IS NULL, series, title
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);

  const total = (db.prepare(`SELECT count(*) AS n FROM videos ${where}`).get(...args) as { n: number }).n;

  return NextResponse.json({ total, limit, offset, items: rows });
}
