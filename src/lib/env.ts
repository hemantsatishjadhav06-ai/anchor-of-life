import path from 'node:path';

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}. Check .env.local.`);
  return v;
}

export function OPENROUTER_API_KEY(): string {
  return req('OPENROUTER_API_KEY');
}

export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
export const SITE_NAME = process.env.SITE_NAME ?? 'Anchor of Life';
export const COMPOSER_MODEL = process.env.COMPOSER_MODEL ?? 'anthropic/claude-sonnet-4.5';
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'openai/text-embedding-3-small';
export const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'anchor.db');

export const R2_ACCOUNT_ID: string | undefined = process.env.R2_ACCOUNT_ID;
export const R2_BUCKET = process.env.R2_BUCKET ?? 'anchoroflife';
export const R2_ACCESS_KEY_ID: string | undefined = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY: string | undefined = process.env.R2_SECRET_ACCESS_KEY;
export const DB_DOWNLOAD_URL: string | undefined = process.env.DB_DOWNLOAD_URL;
export const GH_REPO = process.env.GH_REPO ?? 'hemantsatishjadhav06-ai/anchor-of-life';
export const GH_RELEASE = process.env.GH_RELEASE ?? 'v0.1-data';
export const GH_ASSET = process.env.GH_ASSET ?? 'anchor.db.gz';
