/**
 * Bootstrap script — runs at container start on Render / Fly / any host.
 *
 * If /data/anchor.db is missing or empty, downloads it via priority:
 *   1. DB_DOWNLOAD_URL (a direct HTTP URL to anchor.db or anchor.db.gz)
 *   2. Cloudflare R2 (R2_ACCOUNT_ID + key/secret)
 *   3. GitHub Release asset (default: hemantsatishjadhav06-ai/anchor-of-life · v0.1-data · anchor.db.gz)
 *
 * Self-healing: if all sources fail, exits non-zero.
 */
import './_env';
import {
  DB_PATH,
  DB_DOWNLOAD_URL as DOWNLOAD_URL,
  R2_ACCOUNT_ID as ACC,
  R2_BUCKET as BKT,
  R2_ACCESS_KEY_ID as KEY,
  R2_SECRET_ACCESS_KEY as SEC,
  GH_REPO,
  GH_RELEASE,
  GH_ASSET,
} from '../src/lib/env';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';

async function downloadHttp(url: string, localPath: string, gunzip = false) {
  console.log(`fetching ${url}…`);
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  const fileStream = fs.createWriteStream(localPath);
  const source = Readable.fromWeb(r.body as any);
  if (gunzip) {
    await pipeline(source, createGunzip(), fileStream);
  } else {
    await pipeline(source, fileStream);
  }
  const stat = fs.statSync(localPath);
  console.log(`✓ ${localPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function downloadFromR2(remoteKey: string, localPath: string) {
  if (!ACC || !KEY || !SEC) throw new Error('R2 credentials missing');
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
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
  console.log(`✓ R2 ${remoteKey} → ${localPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function downloadFromGitHubRelease(localPath: string) {
  // Public release asset — no auth required.
  const url = `https://github.com/${GH_REPO}/releases/download/${GH_RELEASE}/${GH_ASSET}`;
  const gunzip = GH_ASSET.endsWith('.gz');
  await downloadHttp(url, localPath, gunzip);
}

async function main() {
  if (fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 100 * 1024 * 1024) {
    console.log(`✓ ${DB_PATH} exists (${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1)} MB) — skipping bootstrap`);
    return;
  }
  console.log(`Bootstrapping ${DB_PATH}…`);

  const attempts: Array<{ name: string; fn: () => Promise<void> }> = [];

  if (DOWNLOAD_URL) {
    attempts.push({ name: 'DB_DOWNLOAD_URL', fn: () => downloadHttp(DOWNLOAD_URL, DB_PATH, DOWNLOAD_URL.endsWith('.gz')) });
  }
  if (ACC && KEY && SEC) {
    attempts.push({ name: 'Cloudflare R2', fn: () => downloadFromR2('anchor.db', DB_PATH) });
  }
  attempts.push({ name: 'GitHub Release', fn: () => downloadFromGitHubRelease(DB_PATH) });

  let lastErr: any;
  for (const { name, fn } of attempts) {
    try {
      console.log(`Attempt: ${name}`);
      await fn();
      console.log('Bootstrap complete.');
      return;
    } catch (e: any) {
      console.error(`  ${name} failed: ${e.message}`);
      lastErr = e;
    }
  }
  console.error('All bootstrap sources failed. Last error:', lastErr?.message);
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
