export function ytTimestampUrl(videoId: string, startSec: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startSec)}s`;
}

export function ytEmbedUrl(videoId: string, startSec = 0, endSec?: number): string {
  const params = new URLSearchParams();
  params.set('start', String(Math.floor(startSec)));
  if (endSec && endSec > startSec) params.set('end', String(Math.ceil(endSec)));
  params.set('rel', '0');
  params.set('modestbranding', '1');
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function ytThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

export function formatTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function detectSeries(title: string): string | null {
  const t = title.toLowerCase();
  if (/jyotish vidya|jyotish-vidya|ep\.?\s*\d/.test(t)) return 'jyotish_vidya';
  if (/when ananda speaks|\bwas\b.*ep|qna series/.test(t)) return 'was';
  if (/anchor of life|life bites/.test(t)) return 'anchor_of_life';
  if (/bams\b|sanatan/.test(t)) return 'sanatan';
  return null;
}
