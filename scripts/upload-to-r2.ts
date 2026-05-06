/**
 * Upload anchor.db + transcripts archive to Cloudflare R2 for deployment.
 *
 * Setup (one-time):
 *   1. Create a Cloudflare R2 bucket (free tier: 10 GB storage, no egress fees)
 *   2. Generate an API token with R2 read+write
 *   3. Add to .env.local:
 *        R2_ACCOUNT_ID=...
 *        R2_BUCKET=anchoroflife
 *        R2_ACCESS_KEY_ID=...
 *        R2_SECRET_ACCESS_KEY=...
 *
 * Run:
 *   npm run data:upload
 *
 * Why R2 instead of S3: zero egress fees. Fly.io will pull anchor.db on every
 * cold boot — even one cold boot per day on S3 would cost more than R2's flat
 * storage fee.
 */
import './_env';
import { R2_ACCOUNT_ID as ACC, R2_BUCKET as BKT, R2_ACCESS_KEY_ID as KEY, R2_SECRET_ACCESS_KEY as SEC } from '../src/lib/env';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

if (!ACC || !KEY || !SEC) {
  console.error('Missing R2 env vars. See scripts/upload-to-r2.ts header for setup.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACC}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY, secretAccessKey: SEC },
});

async function uploadFile(localPath: string, remoteKey: string) {
  if (!fs.existsSync(localPath)) {
    console.warn(`skip ${localPath} (not found)`);
    return;
  }
  const stat = fs.statSync(localPath);
  console.log(`→ ${remoteKey}  (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  const body = fs.createReadStream(localPath);
  const sha = createHash('sha256');
  fs.createReadStream(localPath).on('data', d => sha.update(d));
  await new Promise(r => sha.on('end', r));

  await s3.send(new PutObjectCommand({
    Bucket: BKT,
    Key: remoteKey,
    Body: body,
    ContentType: remoteKey.endsWith('.db') ? 'application/octet-stream' : 'application/zip',
    Metadata: { sha256: sha.digest('hex'), uploaded: new Date().toISOString() },
  }));
  console.log(`  ✓ ${remoteKey}`);
}

async function main() {
  const root = path.join(process.cwd());
  const dbPath = path.join(root, 'data', 'anchor.db');
  const transcriptsDir = '/Users/hemantjadhav/Desktop/Brajesh KB Transcripts/transcripts_json';
  const tarPath = path.join(root, 'data', 'transcripts.tar.gz');

  // 1. Database (single file)
  await uploadFile(dbPath, 'anchor.db');

  // 2. Transcripts (archived for portability)
  if (fs.existsSync(transcriptsDir) && !fs.existsSync(tarPath)) {
    console.log(`packing transcripts → ${tarPath}`);
    const r = spawnSync('tar', ['-czf', tarPath, '-C', path.dirname(transcriptsDir), path.basename(transcriptsDir)], { stdio: 'inherit' });
    if (r.status !== 0) { console.error('tar failed'); process.exit(1); }
  }
  if (fs.existsSync(tarPath)) {
    await uploadFile(tarPath, 'transcripts.tar.gz');
  }

  // 3. Graph
  const graphPath = path.join(root, '..', 'graphify-out', 'graph.json');
  await uploadFile(graphPath, 'graph.json');

  console.log();
  console.log('Done. To use in production, set on Fly:');
  console.log(`  fly secrets set R2_ACCOUNT_ID=${ACC} R2_BUCKET=${BKT} R2_ACCESS_KEY_ID=*** R2_SECRET_ACCESS_KEY=***`);
}

main().catch(e => { console.error(e); process.exit(1); });
