import './_env';
import { getDb, closeDb } from '../src/lib/db';

function main() {
  const db = getDb();
  const t = (q: string) => (db.prepare(q).get() as any).n as number;

  console.log('--- Anchor of Life DB stats ---');
  console.log('videos:        ', t('SELECT count(*) n FROM videos'));
  console.log('  by series:   ');
  const series = db.prepare('SELECT series, count(*) n FROM videos GROUP BY series ORDER BY n DESC').all() as Array<{ series: string | null; n: number }>;
  for (const s of series) console.log(`    ${s.series ?? '(unknown)'}: ${s.n}`);
  console.log('segments:      ', t('SELECT count(*) n FROM segments'));
  console.log('chunks:        ', t('SELECT count(*) n FROM chunks'));
  console.log('  embedded:    ', t('SELECT count(*) n FROM chunks WHERE embedded = 1'));
  console.log('  pending:     ', t('SELECT count(*) n FROM chunks WHERE embedded = 0'));
  console.log('chunk_vec:     ', t('SELECT count(*) n FROM chunk_vec'));
  console.log('concepts:      ', t('SELECT count(*) n FROM concepts'));
  console.log('concept_edges: ', t('SELECT count(*) n FROM concept_edges'));
  console.log('concept_videos:', t('SELECT count(*) n FROM concept_videos'));
  console.log('topics:        ', t('SELECT count(*) n FROM topics'));
  console.log('featured_cards:', t('SELECT count(*) n FROM featured_cards'));

  // Words covered
  const w = db.prepare('SELECT COALESCE(SUM(word_count), 0) w FROM videos').get() as { w: number };
  const dur = db.prepare('SELECT COALESCE(SUM(duration_sec), 0) s FROM videos').get() as { s: number };
  console.log('total words:   ', w.w.toLocaleString());
  console.log('total runtime: ', `${(dur.s / 3600).toFixed(1)} hours`);

  closeDb();
}

main();
