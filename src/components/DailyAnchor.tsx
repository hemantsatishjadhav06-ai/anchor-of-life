import Image from 'next/image';
import Link from 'next/link';
import { ytTimestampUrl, formatTime } from '@/lib/youtube';
import { getDb } from '@/lib/db';
import type { Lang } from '@/lib/types';

function pickToday<T>(rows: T[]): T | null {
  if (!rows.length) return null;
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return rows[day % rows.length];
}

interface DailyPick {
  video_id: string;
  title: string;
  series: string | null;
  thumbnail_url: string;
  duration_sec: number | null;
  excerpt_text: string;
  excerpt_start: number;
}

function getDaily(): DailyPick | null {
  const db = getDb();
  const keywords = ['Chamko', 'Krishn', 'Leela', 'Munna', 'Paap', 'Quota', 'Pitrr', 'Tinku', 'Waala', 'PUMP', 'Preliving', 'Burden', 'Maya', 'Heart', 'Tan Man', 'Anchor', 'Bites'];
  const wheres = keywords.map(() => 'title LIKE ?').join(' OR ');
  const args = keywords.map(k => `%${k}%`);
  let pool = db.prepare(`
    SELECT video_id, title, series, thumbnail_url, duration_sec
    FROM videos WHERE ${wheres} ORDER BY video_id
  `).all(...args) as Array<{ video_id: string; title: string; series: string | null; thumbnail_url: string; duration_sec: number | null }>;
  if (!pool.length) {
    pool = db.prepare(`SELECT video_id, title, series, thumbnail_url, duration_sec FROM videos ORDER BY video_id LIMIT 50`).all() as any;
  }
  const pick = pickToday(pool);
  if (!pick) return null;

  const seg = db.prepare(`
    SELECT start_sec, text FROM segments WHERE video_id = ? AND start_sec > 30 ORDER BY start_sec LIMIT 1
  `).get(pick.video_id) as { start_sec: number; text: string } | undefined;

  return {
    ...pick,
    excerpt_text: seg?.text ?? '',
    excerpt_start: seg?.start_sec ?? 0,
  };
}

export default function DailyAnchor({ lang }: { lang: Lang }) {
  const pick = getDaily();
  if (!pick) return null;
  const url = ytTimestampUrl(pick.video_id, pick.excerpt_start);

  return (
    <section className="border-t border-ink-line/60 pt-10 mt-12 reveal-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gerua daily-breath" />
        <p className="citation-meta">{lang === 'hi' ? 'आज का आधार' : "Today's Anchor"}</p>
      </div>
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
        <Link href={`/library/${pick.video_id}?lang=${lang}&t=${pick.excerpt_start}`} className="block group">
          <div className="relative aspect-video bg-paper-deep overflow-hidden">
            <Image
              src={pick.thumbnail_url}
              alt={pick.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              unoptimized
            />
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors" />
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-ink/85 text-paper text-xs font-sans uppercase tracking-wider">
              ▶ {pick.duration_sec ? formatTime(pick.duration_sec) : ''}
            </div>
          </div>
        </Link>
        <div>
          <p className="font-display text-2xl md:text-3xl leading-tight text-ink mb-3">
            {pick.title}
          </p>
          {pick.excerpt_text && (
            <p className={`pull ${lang === 'hi' ? 'lang-hi' : ''}`}>
              {pick.excerpt_text.slice(0, 240)}{pick.excerpt_text.length > 240 ? '…' : ''}
            </p>
          )}
          <div className="mt-5 flex items-center gap-6">
            <Link href={`/library/${pick.video_id}?lang=${lang}&t=${pick.excerpt_start}`} className="btn-text">
              {lang === 'hi' ? 'पूरी शिक्षा पढ़ें' : 'Read this teaching'}
            </Link>
            <a href={url} target="_blank" rel="noopener" className="btn-text">
              {lang === 'hi' ? 'YouTube पर देखें' : 'Watch on YouTube'} ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
