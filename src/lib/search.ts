/**
 * Hybrid retrieval for Anchor of Life.
 *
 * Three rankers fused via Reciprocal Rank Fusion (RRF):
 *   A. LEXICAL  — SQLite FTS5 over titles + segment text (with bilingual alias expansion)
 *   B. CONCEPT  — query embedding → match against 1,082 concept labels → joined videos
 *   C. SEMANTIC — sqlite-vec KNN over chunks (the original ranker)
 *
 * Top-K videos by fused rank, then for each video pull the best chunk +
 * its surrounding segments for citation quoting.
 *
 * See ADR-001 for design rationale.
 */
import { getDb } from './db';
import { embed } from './openrouter';
import { vecToBlob } from './vec';
import { expandAliases, buildFtsQuery, tokenize } from './aliases';
import type { Citation } from './types';

export interface SearchHit {
  chunk_id: number;
  video_id: string;
  title: string;
  url: string;
  series: string | null;
  start_sec: number;
  end_sec: number;
  text: string;
  distance: number;     // smaller = closer (vector); for RRF only the rank matters
  source: 'lexical' | 'concept' | 'semantic';
}

export interface SearchResult {
  videos: Array<{
    video_id: string;
    title: string;
    url: string;
    series: string | null;
    rrf_score: number;
    title_match: boolean;
    sources: ('lexical' | 'concept' | 'semantic')[];
    best_chunk: SearchHit;
  }>;
  matched_concepts: string[];
  alias_canonical: string[];
}

const RRF_K = 60;
const TITLE_BOOST = 2.5;
const TITLE_CANONICAL_BONUS = 0.04;  // ~rank-1 RRF score; lifts a clearly-canonical title

// ─── Ranker A: lexical via FTS5 ─────────────────────────────────────────────

interface LexicalHit { video_id: string; rank: number; title_hit: boolean }

function rankerLexical(query: string, k = 24): LexicalHit[] {
  const db = getDb();
  const { forms } = expandAliases(query);
  const ftsQ = buildFtsQuery(forms);
  if (!ftsQ) return [];

  // 1) Title FTS — strong signal: a video whose TITLE contains the term
  //    is canonical on that topic.
  const titleHits = db.prepare(`
    SELECT video_id, bm25(title_fts) AS score
    FROM title_fts
    WHERE title_fts MATCH ?
    ORDER BY bm25(title_fts) ASC
    LIMIT ?
  `).all(ftsQ, k) as Array<{ video_id: string; score: number }>;

  // 2) Segment FTS — softer signal: many videos that mention the term anywhere.
  //    bm25() can't be aggregated; do the ranking in a subquery first, then group.
  const segmentHits = db.prepare(`
    SELECT video_id, MIN(score) AS score, COUNT(*) AS hits
    FROM (
      SELECT video_id, bm25(segment_fts) AS score
      FROM segment_fts
      WHERE segment_fts MATCH ?
      ORDER BY bm25(segment_fts) ASC
      LIMIT ?
    )
    GROUP BY video_id
    ORDER BY score ASC, hits DESC
    LIMIT ?
  `).all(ftsQ, k * 8, k * 2) as Array<{ video_id: string; score: number; hits: number }>;

  // Merge: title hits first (stamped title_hit=true), then segment hits.
  const merged: LexicalHit[] = [];
  const seen = new Set<string>();
  for (const t of titleHits) {
    merged.push({ video_id: t.video_id, rank: merged.length + 1, title_hit: true });
    seen.add(t.video_id);
  }
  for (const s of segmentHits) {
    if (seen.has(s.video_id)) continue;
    merged.push({ video_id: s.video_id, rank: merged.length + 1, title_hit: false });
    seen.add(s.video_id);
    if (merged.length >= k) break;
  }
  return merged;
}

// ─── Ranker B: concept-graph routing ────────────────────────────────────────

interface ConceptHit { concept_id: string; concept_label: string; cosine: number }

async function rankerConcept(query: string, k = 24): Promise<{ videos: Array<{ video_id: string; rank: number }>; concepts: ConceptHit[] }> {
  const db = getDb();

  // Cheap path: alias-table direct match on canonical names.
  const { canonical } = expandAliases(query);
  const conceptHitsByAlias = canonical.length
    ? db.prepare(`
        SELECT id, label
        FROM concepts
        WHERE LOWER(label) LIKE ?
           ${canonical.slice(1).map(() => 'OR LOWER(label) LIKE ?').join(' ')}
        ORDER BY degree DESC
        LIMIT 12
      `).all(...canonical.map(c => `%${c}%`)) as Array<{ id: string; label: string }>
    : [];

  // Use these without an embedding call if we have strong alias hits.
  let conceptHits: ConceptHit[] = conceptHitsByAlias.map(c => ({ concept_id: c.id, concept_label: c.label, cosine: 1.0 }));

  // If no alias-based concept hits, fall back to embedding the query and
  // matching it against concept labels (uses chunk_vec? No — concepts are not in vec table).
  // For now we accept the alias-only fallback; an embedding-based concept ranker
  // can be added if alias miss rate is high in evals.

  if (!conceptHits.length) {
    return { videos: [], concepts: [] };
  }

  // Find videos linked to these concepts via concept_videos, ranked by hit count.
  const cids = conceptHits.map(h => h.concept_id);
  const ph = cids.map(() => '?').join(',');
  const videoRows = db.prepare(`
    SELECT cv.video_id, COUNT(*) AS hits
    FROM concept_videos cv
    WHERE cv.concept_id IN (${ph})
    GROUP BY cv.video_id
    ORDER BY hits DESC
    LIMIT ?
  `).all(...cids, k) as Array<{ video_id: string; hits: number }>;

  return {
    videos: videoRows.map((v, i) => ({ video_id: v.video_id, rank: i + 1 })),
    concepts: conceptHits,
  };
}

// ─── Ranker C: vector KNN (existing) ────────────────────────────────────────

interface VectorHit { video_id: string; chunk_id: number; rank: number; distance: number }

async function rankerSemantic(query: string, k = 32): Promise<VectorHit[]> {
  const db = getDb();
  const [qvec] = await embed([query]);
  const blob = vecToBlob(qvec);

  const rows = (db.prepare(`
    SELECT v.rowid AS chunk_id, v.distance AS distance
    FROM chunk_vec v
    WHERE v.embedding MATCH ? AND k = ?
    ORDER BY v.distance
  `).all(blob, k) as Array<{ chunk_id: bigint | number; distance: number }>)
    .map(r => ({ chunk_id: typeof r.chunk_id === 'bigint' ? Number(r.chunk_id) : r.chunk_id, distance: r.distance }));

  if (!rows.length) return [];

  const ids = rows.map(r => r.chunk_id);
  const chunkMeta = db.prepare(`
    SELECT id AS chunk_id, video_id FROM chunks WHERE id IN (${ids.map(() => '?').join(',')})
  `).all(...ids) as Array<{ chunk_id: number; video_id: string }>;
  const byChunk = new Map(chunkMeta.map(m => [m.chunk_id, m.video_id]));

  // Group: best (lowest-distance) chunk per video.
  const bestPerVideo = new Map<string, VectorHit>();
  let i = 0;
  for (const r of rows) {
    const vid = byChunk.get(r.chunk_id);
    if (!vid) continue;
    if (!bestPerVideo.has(vid)) {
      bestPerVideo.set(vid, { video_id: vid, chunk_id: r.chunk_id, rank: bestPerVideo.size + 1, distance: r.distance });
    }
    i++;
  }
  return Array.from(bestPerVideo.values());
}

// ─── Title boost: does the query name a video by title? ─────────────────────

function titleMatchSet(query: string): Set<string> {
  const db = getDb();
  const { forms } = expandAliases(query);
  const ftsQ = buildFtsQuery(forms);
  if (!ftsQ) return new Set();
  const rows = db.prepare(`
    SELECT video_id FROM title_fts WHERE title_fts MATCH ? LIMIT 50
  `).all(ftsQ) as Array<{ video_id: string }>;
  return new Set(rows.map(r => r.video_id));
}

/** A *canonical* title match is one where the video's title contains a strong concept
 *  alias (e.g., "Mars", "मंगल", "Saturn", "Karma"). This is the surest signal that the
 *  video is *about* the queried concept, not just mentioning it. We over-weight these. */
function canonicalTitleMatchSet(query: string): Set<string> {
  const db = getDb();
  const { forms } = expandAliases(query);
  // Use ONLY the strong concept-alias forms (length >= 3, not generic English words)
  const strongForms = forms.filter(f => f.length >= 3);
  if (!strongForms.length) return new Set();
  const ftsQ = buildFtsQuery(strongForms);
  if (!ftsQ) return new Set();
  const rows = db.prepare(`
    SELECT video_id FROM title_fts WHERE title_fts MATCH ? LIMIT 50
  `).all(ftsQ) as Array<{ video_id: string }>;
  return new Set(rows.map(r => r.video_id));
}

// ─── Reciprocal Rank Fusion ─────────────────────────────────────────────────

interface FusedRow {
  video_id: string;
  rrf_score: number;
  title_match: boolean;
  sources: Set<'lexical' | 'concept' | 'semantic'>;
  best_chunk_id: number | null;   // from semantic ranker if available
}

function fuse(
  lex: LexicalHit[],
  con: Array<{ video_id: string; rank: number }>,
  vec: VectorHit[],
  titleMatches: Set<string>,
  canonicalTitleMatches: Set<string>,
): FusedRow[] {
  const acc = new Map<string, FusedRow>();
  const get = (vid: string): FusedRow => {
    let r = acc.get(vid);
    if (!r) {
      r = { video_id: vid, rrf_score: 0, title_match: titleMatches.has(vid), sources: new Set(), best_chunk_id: null };
      acc.set(vid, r);
    }
    return r;
  };
  for (const l of lex) {
    const r = get(l.video_id);
    r.rrf_score += 1 / (RRF_K + l.rank);
    r.sources.add('lexical');
  }
  for (const c of con) {
    const r = get(c.video_id);
    r.rrf_score += 1 / (RRF_K + c.rank);
    r.sources.add('concept');
  }
  for (const v of vec) {
    const r = get(v.video_id);
    r.rrf_score += 1 / (RRF_K + v.rank);
    r.sources.add('semantic');
    if (r.best_chunk_id === null) r.best_chunk_id = v.chunk_id;
  }
  // Apply title boost — multiplicative, then a fixed canonical bonus on top.
  for (const r of acc.values()) {
    if (r.title_match) r.rrf_score *= TITLE_BOOST;
    if (canonicalTitleMatches.has(r.video_id)) r.rrf_score += TITLE_CANONICAL_BONUS;
  }
  return Array.from(acc.values()).sort((a, b) => b.rrf_score - a.rrf_score);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Hybrid retrieval — returns top-N videos with their best chunk for citation. */
export async function hybridSearch(query: string, n = 4): Promise<SearchResult> {
  const db = getDb();

  // Run lexical synchronously, concept synchronously (alias-table only — no embed),
  // semantic asynchronously (one embed call). All three are then fused.
  const lexical = rankerLexical(query, 24);
  const conceptR = await rankerConcept(query, 24);
  const semantic = await rankerSemantic(query, 32);
  const titleMatches = titleMatchSet(query);
  const canonicalMatches = canonicalTitleMatchSet(query);

  const fused = fuse(lexical, conceptR.videos, semantic, titleMatches, canonicalMatches);
  if (!fused.length) return { videos: [], matched_concepts: conceptR.concepts.map(c => c.concept_label), alias_canonical: expandAliases(query).canonical };

  // For each top video, get its metadata + best chunk.
  // If the video came from semantic, we already have a chunk_id; otherwise pick the
  // chunk with highest BM25 over the segment_fts for the query.
  const top = fused.slice(0, n);
  const placeholders = top.map(() => '?').join(',');
  const meta = db.prepare(`
    SELECT video_id, title, url, series FROM videos WHERE video_id IN (${placeholders})
  `).all(...top.map(t => t.video_id)) as Array<{ video_id: string; title: string; url: string; series: string | null }>;
  const metaMap = new Map(meta.map(m => [m.video_id, m]));

  const { forms } = expandAliases(query);
  const ftsQ = buildFtsQuery(forms);

  const out: SearchResult['videos'] = [];
  for (const r of top) {
    const m = metaMap.get(r.video_id);
    if (!m) continue;

    let chunk: { id: number; start_sec: number; end_sec: number; text: string } | undefined;
    if (r.best_chunk_id != null) {
      chunk = db.prepare(`SELECT id, start_sec, end_sec, text FROM chunks WHERE id = ?`).get(r.best_chunk_id) as any;
    }
    if (!chunk && ftsQ) {
      // Find the best lexical chunk inside this video.
      const seg = db.prepare(`
        SELECT start_sec, end_sec, text
        FROM segment_fts
        WHERE segment_fts MATCH ? AND video_id = ?
        ORDER BY bm25(segment_fts) ASC
        LIMIT 1
      `).get(ftsQ, r.video_id) as any;
      if (seg) {
        const c = db.prepare(`SELECT id FROM chunks WHERE video_id = ? AND start_sec = ? AND end_sec = ? LIMIT 1`).get(r.video_id, seg.start_sec, seg.end_sec) as any;
        chunk = { id: c?.id ?? 0, start_sec: seg.start_sec, end_sec: seg.end_sec, text: seg.text };
      }
    }
    if (!chunk) {
      // Last resort: take the first chunk of the video.
      chunk = db.prepare(`SELECT id, start_sec, end_sec, text FROM chunks WHERE video_id = ? ORDER BY start_sec LIMIT 1`).get(r.video_id) as any;
    }
    if (!chunk) continue;

    out.push({
      video_id: m.video_id,
      title: m.title,
      url: m.url,
      series: m.series,
      rrf_score: r.rrf_score,
      title_match: r.title_match,
      sources: Array.from(r.sources),
      best_chunk: {
        chunk_id: chunk.id,
        video_id: m.video_id,
        title: m.title,
        url: m.url,
        series: m.series,
        start_sec: chunk.start_sec,
        end_sec: chunk.end_sec,
        text: chunk.text,
        distance: 0,
        source: r.sources.has('semantic') ? 'semantic' : (r.sources.has('lexical') ? 'lexical' : 'concept'),
      },
    });
  }

  return {
    videos: out,
    matched_concepts: conceptR.concepts.map(c => c.concept_label),
    alias_canonical: expandAliases(query).canonical,
  };
}

// ─── Citation helpers ──────────────────────────────────────────────────────

export function surroundingQuote(videoId: string, startSec: number, endSec: number, maxChars = 360): { quote: string; quote_start: number; quote_end: number } {
  const db = getDb();
  const rows = db.prepare(`
    SELECT start_sec, end_sec, text
    FROM segments
    WHERE video_id = ? AND end_sec >= ? AND start_sec <= ?
    ORDER BY start_sec
  `).all(videoId, startSec, endSec) as Array<{ start_sec: number; end_sec: number; text: string }>;
  if (!rows.length) return { quote: '', quote_start: startSec, quote_end: endSec };

  let acc = '';
  let qStart = rows[0].start_sec;
  let qEnd = rows[0].end_sec;
  for (const r of rows) {
    const next = acc ? acc + ' ' + r.text.trim() : r.text.trim();
    if (next.length > maxChars && acc.length > 80) break;
    acc = next;
    qEnd = r.end_sec;
  }
  return { quote: acc.trim(), quote_start: qStart, quote_end: qEnd };
}

export function buildCitationsFromVideos(result: SearchResult): Citation[] {
  return result.videos.map(v => {
    const { quote, quote_start, quote_end } = surroundingQuote(v.video_id, v.best_chunk.start_sec, v.best_chunk.end_sec);
    return {
      video_id: v.video_id,
      title: v.title,
      url: `https://www.youtube.com/watch?v=${v.video_id}&t=${Math.floor(quote_start)}s`,
      start_sec: Math.floor(quote_start),
      end_sec: Math.ceil(quote_end),
      quote: quote || v.best_chunk.text,
      series: v.series,
    };
  });
}

export function relatedTopicsForVideos(result: SearchResult, limit = 4): string[] {
  if (!result.videos.length) return [];
  const db = getDb();
  const videoIds = result.videos.map(v => v.video_id);
  const placeholders = videoIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT t.label, COUNT(*) AS hits
    FROM concept_videos cv
    JOIN concepts c ON c.id = cv.concept_id
    JOIN topics t ON t.community_id = c.community_id
    WHERE cv.video_id IN (${placeholders})
    GROUP BY t.community_id
    ORDER BY hits DESC
    LIMIT ?
  `).all(...videoIds, limit) as Array<{ label: string; hits: number }>;
  return rows.map(r => r.label);
}

/** Count distinct videos in a broader semantic+lexical pass — for "spoken N times". */
export async function countMentionsHybrid(query: string): Promise<number> {
  const db = getDb();
  const { forms } = expandAliases(query);
  const ftsQ = buildFtsQuery(forms);
  let lexicalCount = 0;
  if (ftsQ) {
    lexicalCount = (db.prepare(`
      SELECT COUNT(DISTINCT video_id) AS n FROM segment_fts WHERE segment_fts MATCH ?
    `).get(ftsQ) as { n: number }).n;
  }
  // Also include semantic top-30 unique videos
  const sem = await rankerSemantic(query, 30);
  const semVideos = new Set(sem.map(h => h.video_id));
  // Union with lexical mention count: take max of the two as an honest lower bound.
  return Math.max(lexicalCount, semVideos.size);
}

// ─── Backward-compat helpers (used elsewhere; keep API stable) ──────────────

/** Legacy: pure semantic search returning chunk-level hits.
 *  Retained for /api/daily and any other callers; new endpoints use hybridSearch. */
export async function vectorSearch(query: string, k = 12): Promise<SearchHit[]> {
  const db = getDb();
  const [qvec] = await embed([query]);
  const blob = vecToBlob(qvec);
  const rows = (db.prepare(`
    SELECT v.rowid AS chunk_id, v.distance AS distance
    FROM chunk_vec v
    WHERE v.embedding MATCH ? AND k = ?
    ORDER BY v.distance
  `).all(blob, k) as Array<{ chunk_id: bigint | number; distance: number }>)
    .map(r => ({ chunk_id: typeof r.chunk_id === 'bigint' ? Number(r.chunk_id) : r.chunk_id, distance: r.distance }));
  if (!rows.length) return [];

  const ids = rows.map(r => r.chunk_id);
  const meta = db.prepare(`
    SELECT c.id AS chunk_id, c.video_id, c.start_sec, c.end_sec, c.text,
           v.title, v.url, v.series
    FROM chunks c JOIN videos v ON v.video_id = c.video_id
    WHERE c.id IN (${ids.map(() => '?').join(',')})
  `).all(...ids) as Array<any>;

  const byId = new Map(meta.map(m => [m.chunk_id, m]));
  return rows.map(r => {
    const m = byId.get(r.chunk_id);
    if (!m) return null;
    return { ...m, distance: r.distance, source: 'semantic' as const };
  }).filter((x): x is SearchHit => x !== null);
}
