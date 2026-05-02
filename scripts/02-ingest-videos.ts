import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { getDb, closeDb } from '../src/lib/db';
import { detectSeries, ytThumbnail } from '../src/lib/youtube';

const MANIFEST = '/Users/hemantjadhav/Desktop/Brajesh KB Transcripts/manifest.csv';

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error('manifest not found:', MANIFEST);
    process.exit(1);
  }
  const csv = fs.readFileSync(MANIFEST, 'utf-8');
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;

  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO videos
      (video_id, title, url, duration_sec, language, word_count, published_at, series, thumbnail_url)
    VALUES (@video_id, @title, @url, @duration_sec, @language, @word_count, @published_at, @series, @thumbnail_url)
  `);

  const tx = db.transaction((items: any[]) => {
    for (const it of items) insert.run(it);
  });

  const items = rows.map(r => ({
    video_id: r.video_id,
    title: r.title,
    url: r.url || `https://www.youtube.com/watch?v=${r.video_id}`,
    duration_sec: r.duration_sec ? parseInt(r.duration_sec) : null,
    language: r.language || null,
    word_count: r.word_count ? parseInt(r.word_count) : null,
    published_at: r.published_at || null,
    series: detectSeries(r.title),
    thumbnail_url: ytThumbnail(r.video_id),
  }));

  tx(items);
  const n = db.prepare('select count(*) as n from videos').get() as { n: number };
  console.log(`ingested ${items.length} rows from manifest. videos table now: ${n.n}`);
  closeDb();
}

main();
