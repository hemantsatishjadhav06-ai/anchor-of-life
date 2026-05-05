'use client';
import type { Lang } from '@/lib/types';
import type { FullChart, YogaResult } from '@/lib/astrology/types';

export default function YogaList({ fc, lang }: { fc: FullChart; lang: Lang }) {
  const items = fc.yogas ?? [];
  if (items.length === 0) {
    return (
      <section className="mb-8">
        <h3 className="font-display text-xl text-ink mb-3 font-medium">
          {lang === 'hi' ? 'योग' : 'Yogas'}
        </h3>
        <p className="text-sm text-ink-soft italic">
          {lang === 'hi'
            ? 'कोई प्रमुख योग नहीं मिला (राज, धन, गजकेसरी, पंच महापुरुष की सरल जाँच)।'
            : 'No major yogas detected (basic Raj/Dhana/Gajakesari/Pancha-Mahapurusha check).'}
        </p>
      </section>
    );
  }
  return (
    <section className="mb-8">
      <h3 className="font-display text-xl text-ink mb-4 font-medium">
        {lang === 'hi' ? 'योग' : 'Yogas'}
      </h3>
      <ul className="space-y-3">
        {items.map((y: YogaResult) => (
          <li key={y.key} className="pl-4 border-l-2 border-vermilion">
            <div className="font-display font-semibold text-ink">{y.name}</div>
            <p className="text-sm text-ink-soft mt-0.5">{y.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
