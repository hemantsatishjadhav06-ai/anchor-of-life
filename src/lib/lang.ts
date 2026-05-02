import type { Lang } from './types';

export function pickLang(raw: string | string[] | undefined, fallback: Lang = 'en'): Lang {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'hi' || v === 'en') return v;
  return fallback;
}
