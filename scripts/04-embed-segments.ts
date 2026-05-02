import './_env';
import { getDb, closeDb } from '../src/lib/db';
import { embed } from '../src/lib/openrouter';
import { vecToBlob } from '../src/lib/vec';

const BATCH = 96;          // chunks per OpenAI embedding call (well under token limit)
const PARALLEL = 3;        // concurrent batches in flight (reduced from 4 for stability)
const RETRIES = 8;         // increased — network blips happen on long runs

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < RETRIES; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      // Exponential with cap, plus jitter
      const wait = Math.min(30_000, 1000 * Math.pow(2, i)) + Math.floor(Math.random() * 500);
      console.warn(`  retry ${label} (#${i + 1}) after ${wait}ms: ${(e.message ?? String(e)).slice(0, 120)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function main() {
  const db = getDb();

  // sqlite-vec table — make sure it's empty for chunks we'll re-embed
  // We track 'embedded' on the chunks table; rebuild vector entries to match.
  const pending = db.prepare(`SELECT id, text FROM chunks WHERE embedded = 0 ORDER BY id`).all() as Array<{ id: number; text: string }>;
  console.log(`pending chunks to embed: ${pending.length}`);
  if (!pending.length) { closeDb(); return; }

  const insertVec = db.prepare(`INSERT OR REPLACE INTO chunk_vec(rowid, embedding) VALUES (?, ?)`);
  const markEmbedded = db.prepare(`UPDATE chunks SET embedded = 1 WHERE id = ?`);

  // Build batches
  const batches: Array<Array<{ id: number; text: string }>> = [];
  for (let i = 0; i < pending.length; i += BATCH) {
    batches.push(pending.slice(i, i + BATCH));
  }

  let done = 0;
  const t0 = Date.now();

  // Run with limited parallelism
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= batches.length) return;
      const batch = batches[idx];
      const vecs = await withRetry(
        () => embed(batch.map(c => c.text)),
        `batch ${idx}`,
      );
      const tx = db.transaction(() => {
        for (let j = 0; j < batch.length; j++) {
          // sqlite-vec strictly requires BigInt for rowid bindings (rejects JS Number).
          insertVec.run(BigInt(batch[j].id), vecToBlob(vecs[j]));
          markEmbedded.run(batch[j].id);
        }
      });
      tx();
      done += batch.length;
      const elapsed = (Date.now() - t0) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((pending.length - done) / rate);
      if (idx % 5 === 0) {
        console.log(`  ${done}/${pending.length} chunks · ${rate.toFixed(1)}/s · ETA ${eta}s`);
      }
    }
  }

  await Promise.all(Array.from({ length: PARALLEL }, () => worker()));

  const n = db.prepare(`SELECT count(*) as n FROM chunk_vec`).get() as { n: number };
  console.log(`done. chunk_vec rows: ${n.n}`);
  closeDb();
}

main().catch(e => { console.error(e); process.exit(1); });
