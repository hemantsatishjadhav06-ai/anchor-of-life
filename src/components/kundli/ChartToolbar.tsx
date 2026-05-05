'use client';
import type { Lang } from '@/lib/types';

export type ChartStyle = 'south' | 'wheel';
export type ChartSystem = 'sidereal' | 'sayana' | 'kp';

export default function ChartToolbar({
  style, onStyle, system, onSystem, bhavaChalit, onBhavaChalit, lang, hideSystem = false,
}: {
  style: ChartStyle; onStyle: (s: ChartStyle) => void;
  system: ChartSystem; onSystem: (s: ChartSystem) => void;
  bhavaChalit: boolean; onBhavaChalit: (v: boolean) => void;
  lang: Lang;
  hideSystem?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center text-sm mb-5 text-ink-soft">
      <label className="flex items-center gap-2">
        <span className="citation-meta">{lang === 'hi' ? 'शैली' : 'Style'}:</span>
        <select
          value={style}
          onChange={e => onStyle(e.target.value as ChartStyle)}
          className="bg-transparent border-b border-ink-line py-1 font-medium text-ink"
        >
          <option value="south">{lang === 'hi' ? 'दक्षिण भारतीय' : 'South Indian'}</option>
          <option value="wheel">{lang === 'hi' ? 'चक्र (गोल)' : 'Astro Wheel'}</option>
        </select>
      </label>

      {!hideSystem && (
        <label className="flex items-center gap-2">
          <span className="citation-meta">{lang === 'hi' ? 'पद्धति' : 'System'}:</span>
          <select
            value={system}
            onChange={e => onSystem(e.target.value as ChartSystem)}
            className="bg-transparent border-b border-ink-line py-1 font-medium text-ink"
          >
            <option value="sidereal">{lang === 'hi' ? 'सिडेरियल (लाहिरी)' : 'Sidereal (Lahiri)'}</option>
            <option value="sayana">{lang === 'hi' ? 'सायन (ट्रॉपिकल)' : 'Sayana (Tropical)'}</option>
            <option value="kp">{lang === 'hi' ? 'KP कृष्णमूर्ति' : 'KP (Krishnamurti)'}</option>
          </select>
        </label>
      )}

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={bhavaChalit}
          onChange={e => onBhavaChalit(e.target.checked)}
          className="accent-vermilion"
        />
        <span className="citation-meta">{lang === 'hi' ? 'भाव चलित' : 'Bhava Chalit'}</span>
      </label>
    </div>
  );
}
