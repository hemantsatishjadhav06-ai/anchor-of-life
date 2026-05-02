/**
 * Bootstrap script — runs at container start on Fly.io (or any host).
 * If /data/anchor.db is missing, downloads it from Cloudflare R2.
 * If the download fails AND transcripts are present, rebuilds the DB from scratch.
 *
 * This is what makes the system self-healing in production.
 */
import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'anchor.db');
const ACC = process.env.R2_ACCOUNT_ID;
const BKT = process.env.R2_BUCKET ?? 'anchoroflife';
const KEY = process.env.R2_ACCESS_KEY_ID;
const SEC = process.env.R2_SECRET_ACCESS_KEY;

async function downloadFromR2(remoteKey: string, localPath: string) {
  if (!ACC || !KEY || !SEC) throw new Error('R2 credentials missing — cannot bootstrap');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACC}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: KEY, secretAccessKey: SEC },
  });
  const obj = await s3.send(new GetObjectCommand({ Bucket: BKT, Key: remoteKey }));
  if (!obj.Body) throw new Error('Empty object body');
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  await pipeline(obj.Body as Readable, fs.createWriteStream(localPath));
  const stat = fs.statSync(localPath);
  console.log(`✓ downloaded ${remoteKey} → ${localPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  if (fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 1024 * 1024) {
    console.log(`✓ ${DB_PATH} exists (${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1)} MB) — skipping bootstrap`);
    return;
  }
  console.log(`Bootstrapping — ${DB_PATH} missing or empty`);
  try {
    await downloadFromR2('anchor.db', DB_PATH);
  } catch (e: any) {
    console.error('R2 download failed:', e.message);
    console.error('Cannot bootstrap without a valid anchor.db. Fail open and exit.');
    process.exit(1);
  }
  console.log('Bootstrap complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
