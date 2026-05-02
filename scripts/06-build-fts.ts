import './_env';
import { getDb, closeDb } from '../src/lib/db';

// FTS5 lexical index over titles + segments.
// Bilingual: stores both Devanagari and Latin tokens; trigram tokenizer for partial matches.

function main() {
  const db = getDb();

  // Drop and rebuild — idempotent.
  db.exec(`DROP TABLE IF EXISTS title_fts;`);
  db.exec(`DROP TABLE IF EXISTS segment_fts;`);

  // Titles table: heavily weighted in ranking (each video appears once).
  db.exec(`
    CREATE VIRTUAL TABLE title_fts USING fts5(
      title,
      video_id UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `);

  // Segments: large, weighted lower.
  db.exec(`
    CREATE VIRTUAL TABLE segment_fts USING fts5(
      text,
      video_id UNINDEXED,
      start_sec UNINDEXED,
      end_sec UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `);

  // Populate titles
  const videos = db.prepare('SELECT video_id, title FROM videos').all() as Array<{ video_id: string; title: string }>;
  const insertTitle = db.prepare('INSERT INTO title_fts (title, video_id) VALUES (?, ?)');
  const txT = db.transaction(() => {
    for (const v of videos) insertTitle.run(v.title, v.video_id);
  });
  txT();
  console.log(`title_fts: ${videos.length} rows`);

  // Populate segments — but use the chunk text (cleaner, fewer rows than raw segments)
  const chunks = db.prepare('SELECT video_id, start_sec, end_sec, text FROM chunks').all() as Array<{ video_id: string; start_sec: number; end_sec: number; text: string }>;
  const insertSeg = db.prepare('INSERT INTO segment_fts (text, video_id, start_sec, end_sec) VALUES (?, ?, ?, ?)');
  const txS = db.transaction(() => {
    for (const c of chunks) insertSeg.run(c.text, c.video_id, c.start_sec, c.end_sec);
  });
  txS();
  console.log(`segment_fts: ${chunks.length} rows`);

  // Smoke test
  const test = db.prepare(`SELECT video_id, snippet(title_fts, 0, '<', '>', '…', 6) snip FROM title_fts WHERE title_fts MATCH ? LIMIT 3`).all('mangal OR मंगल');
  console.log('smoke (mangal OR मंगल) titles:', test);

  closeDb();
}

main();
