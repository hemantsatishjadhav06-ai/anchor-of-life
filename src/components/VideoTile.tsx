import Image from 'next/image';
import Link from 'next/link';
import { formatTime } from '@/lib/youtube';
import type { Lang } from '@/lib/types';

interface Props {
  video: {
    video_id: string;
    title: string;
    duration_sec: number | null;
    series: string | null;
    thumbnail_url: string;
  };
  lang: Lang;
  size?: 'sm' | 'md';
}

const SERIES_LABEL: Record<string, { en: string; hi: string }> = {
  jyotish_vidya: { en: 'Jyotish Vidya', hi: 'ज्योतिष विद्या' },
  was: { en: 'When Ananda Speaks', hi: 'When Ananda Speaks' },
  anchor_of_life: { en: 'Anchor of Life', hi: 'जीवन का आधार' },
  sanatan: { en: 'Sanatan', hi: 'सनातन' },
};

export default function VideoTile({ video, lang, size = 'md' }: Props) {
  const series = video.series ? SERIES_LABEL[video.series]?.[lang] ?? video.series : '';
  return (
    <Link href={`/library/${video.video_id}?lang=${lang}`} className="group block">
      <div className="relative aspect-video bg-paper-deep overflow-hidden">
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors" />
        {video.duration_sec ? (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-ink/85 text-paper text-[0.7rem] font-sans uppercase tracking-wider">
            {formatTime(video.duration_sec)}
          </div>
        ) : null}
      </div>
      <div className="mt-3">
        {series && <p className="citation-meta">{series}</p>}
        <p className={`mt-1.5 font-display ${size === 'sm' ? 'text-base' : 'text-lg'} leading-snug text-ink group-hover:text-vermilion transition-colors line-clamp-3`}>
          {video.title.replace(/\s*-\s*Brajesh Gautam.*$/i, '').replace(/\s*\(\d{1,2}\s+\w+\s+\d{4}\s*\)$/, '')}
        </p>
      </div>
    </Link>
  );
}
