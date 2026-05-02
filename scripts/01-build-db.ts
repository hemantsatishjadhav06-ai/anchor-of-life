import './_env';
import { getDb, closeDb } from '../src/lib/db';

const SCHEMA = `
-- Videos: one row per source teaching.
CREATE TABLE IF NOT EXISTS videos (
  video_id      TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  duration_sec  INTEGER,
  language      TEXT,
  word_count    INTEGER,
  published_at  TEXT,
  series        TEXT,
  thumbnail_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_videos_series ON videos(series);

-- Segments: original Whisper output, kept for citation quoting.
CREATE TABLE IF NOT EXISTS segments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id  TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  seg_idx   INTEGER NOT NULL,
  start_sec REAL NOT NULL,
  end_sec   REAL NOT NULL,
  text      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_segments_video ON segments(video_id);
CREATE INDEX IF NOT EXISTS idx_segments_video_start ON segments(video_id, start_sec);

-- Chunks: ~30-second windows of segments, used for semantic search.
CREATE TABLE IF NOT EXISTS chunks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id    TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  start_sec   REAL NOT NULL,
  end_sec     REAL NOT NULL,
  text        TEXT NOT NULL,
  embedded    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chunks_video ON chunks(video_id);
CREATE INDEX IF NOT EXISTS idx_chunks_pending ON chunks(embedded) WHERE embedded = 0;

-- Vector index keyed by chunk id (rowid).
CREATE VIRTUAL TABLE IF NOT EXISTS chunk_vec USING vec0(
  embedding float[1536]
);

-- Concepts (from graphify): a node in the knowledge graph.
CREATE TABLE IF NOT EXISTS concepts (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  community_id    INTEGER,
  community_label TEXT,
  degree          INTEGER DEFAULT 0,
  source_file     TEXT
);

CREATE INDEX IF NOT EXISTS idx_concepts_community ON concepts(community_id);

-- Concept ↔ Video linkage (computed during ingestion).
CREATE TABLE IF NOT EXISTS concept_videos (
  concept_id TEXT NOT NULL,
  video_id   TEXT NOT NULL,
  PRIMARY KEY (concept_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_cv_video ON concept_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_cv_concept ON concept_videos(concept_id);

-- Concept edges (graphify edges).
CREATE TABLE IF NOT EXISTS concept_edges (
  source_id  TEXT NOT NULL,
  target_id  TEXT NOT NULL,
  relation   TEXT,
  confidence TEXT,
  weight     REAL,
  PRIMARY KEY (source_id, target_id, relation)
);

-- Topics (graphify communities), one per cluster.
CREATE TABLE IF NOT EXISTS topics (
  community_id INTEGER PRIMARY KEY,
  label        TEXT NOT NULL,
  size         INTEGER,
  cohesion     REAL,
  slug         TEXT UNIQUE
);

-- Featured homepage cards. A card may merge multiple communities.
CREATE TABLE IF NOT EXISTS featured_cards (
  slot            INTEGER PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  community_ids   TEXT NOT NULL,
  label_en        TEXT NOT NULL,
  label_hi        TEXT NOT NULL,
  description_en  TEXT,
  description_hi  TEXT
);
`;

function main() {
  const db = getDb();
  db.exec(SCHEMA);
  // Confirm vec extension is loaded
  const v = db.prepare('select vec_version() as v').get() as { v: string };
  console.log('schema applied. sqlite-vec', v.v);
  // Quick stats
  const tables = db.prepare("select name from sqlite_master where type in ('table','index') order by name").all();
  console.log('objects:', tables.map((t: any) => t.name).join(', '));
  closeDb();
}

main();
