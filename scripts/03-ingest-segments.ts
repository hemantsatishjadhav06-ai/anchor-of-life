import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, closeDb } from '../src/lib/db';

const TRANSCRIPTS_DIR = '/Users/hemantjadhav/Desktop/Brajesh KB Transcripts/transcripts_json';

interface Seg { id: number; start: number; end: number; text: string }
interface TJson { video_id: string; duration: number; language?: string; segments: Seg[] }

// Build ~30-second chunks by accumulating segments until duration exceeds CHUNK_SEC,
// with overlap so concept boundaries aren't split.
const CHUNK_SEC = 30;
const CHUNK_OVERLAP_SEC = 6;

function buildChunks(segs: Seg[]): Array<{ start: number; end: number; text: string }> {
  if (!segs.length) return [];
  // Deduplicate overlapping Whisper segments by start time
  const sorted = [...segs].sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number; text: string }> = [];
  let cursor = sorted[0].start;
  while (cursor < sorted[sorted.length - 1].end) {
    const winEnd = cursor + CHUNK_SEC;
    const inWindow = sorted.filter(s => s.start < winEnd && s.end > cursor);
    if (!inWindow.length) break;
    const text = inWindow.map(s => s.text.trim()).join(' ').replace(/\s+/g, ' ').trim();
    if (text.length > 30) {
      out.push({
        start: Math.max(cursor, inWindow[0].start),
        end: Math.min(winEnd, inWindow[inWindow.length - 1].end),
        text,
      });
    }
    cursor += CHUNK_SEC - CHUNK_OVERLAP_SEC;
  }
  return out;
}

async function main() {
  const db = getDb();
  const allVideos = db.prepare('SELECT video_id FROM videos').all() as Array<{ video_id: string }>;
  const videoIds = new Set(allVideos.map(v => v.video_id));

  const insertSeg = db.prepare(`
    INSERT INTO segments (video_id, seg_idx, start_sec, end_sec, text)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertChunk = db.prepare(`
    INSERT INTO chunks (video_id, start_sec, end_sec, text)
    VALUES (?, ?, ?, ?)
  `);
  const clearSegs = db.prepare('DELETE FROM segments WHERE video_id = ?');
  const clearChunks = db.prepare('DELETE FROM chunks WHERE video_id = ?');

  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
  console.log(`found ${files.length} transcript JSONs`);

  let videosDone = 0, segCount = 0, chunkCount = 0, skipped = 0;

  const tx = db.transaction((videoId: string, segs: Seg[], chunks: Array<{ start: number; end: number; text: string }>) => {
    clearSegs.run(videoId);
    clearChunks.run(videoId);
    for (const s of segs) {
      insertSeg.run(videoId, s.id, s.start, s.end, s.text.trim());
    }
    for (const c of chunks) {
      insertChunk.run(videoId, c.start, c.end, c.text);
    }
  });

  for (const f of files) {
    const videoId = path.basename(f, '.json');
    if (!videoIds.has(videoId)) { skipped++; continue; }
    try {
      const data = JSON.parse(fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf-8')) as TJson;
      if (!data.segments?.length) continue;
      const chunks = buildChunks(data.segments);
      tx(videoId, data.segments, chunks);
      segCount += data.segments.length;
      chunkCount += chunks.length;
      videosDone++;
      if (videosDone % 25 === 0) console.log(`  ${videosDone}/${files.length} videos · ${segCount} segs · ${chunkCount} chunks`);
    } catch (e: any) {
      console.error(`  error on ${videoId}: ${e.message}`);
    }
  }

  console.log(`done. videos=${videosDone}, skipped=${skipped}, segments=${segCount}, chunks=${chunkCount}`);
  closeDb();
}

main();
