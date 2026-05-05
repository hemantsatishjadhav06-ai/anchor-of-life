'use client';
import type { Lang } from '@/lib/types';
import type { TabKey } from '@/lib/agent/chartContext';

const TAB_LABELS: Record<TabKey, { en: string; hi: string }> = {
  overview:       { en: 'Overview',       hi: 'सारांश' },
  marriage:       { en: 'Marriage',       hi: 'विवाह' },
  career:         { en: 'Career',         hi: 'व्यवसाय' },
  children:       { en: 'Children',       hi: 'संतान' },
  parents:        { en: 'Parents',        hi: 'माता-पिता' },
  hardships:      { en: 'Hardships',      hi: 'दुख-कष्ट' },
  'doshas-yogas': { en: 'Doshas & Yogas', hi: 'दोष व योग' },
  dashas:         { en: 'Dashas',         hi: 'दशाएँ' },
  compare:        { en: 'Compare',        hi: 'तुलना' },
};

const ORDER: TabKey[] = [
  'overview', 'marriage', 'career', 'children', 'parents',
  'hardships', 'doshas-yogas', 'dashas', 'compare',
];

export default function TabBar({
  active, onChange, lang,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  lang: Lang;
}) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink-line/60 mb-6 sticky top-0 bg-paper z-10 py-2 -mx-2 px-2">
      {ORDER.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${
            active === t
              ? 'border-vermilion text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-ink-line/60'
          }`}
        >
          {TAB_LABELS[t][lang]}
        </button>
      ))}
    </nav>
  );
}
