'use client';
import type { Lang } from '@/lib/types';
import type { FullChart } from '@/lib/astrology/types';
import { SIGNS_HI } from '@/lib/astrology/types';

export default function CompareSystems({ fc, lang }: { fc: FullChart; lang: Lang }) {
  const sid = fc.d1;
  const trop = fc.sayana?.d1;
  const kp = fc.kp;

  function signLabel(idx: number) {
    return lang === 'hi' ? SIGNS_HI[idx] : sid.planets[0]?.sign && idx >= 0 ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][idx] : '';
  }

  return (
    <section className="space-y-8">
      <header>
        <h3 className="font-display text-xl text-ink font-medium mb-1">
          {lang === 'hi' ? 'पद्धति तुलना' : 'Comparing chart systems'}
        </h3>
        <p className="text-sm text-ink-soft">
          {lang === 'hi'
            ? 'ब्रजेश जी सिडेरियल लाहिरी पद्धति में पढ़ाते हैं — अन्य पद्धतियाँ संदर्भ के लिए।'
            : 'Brajesh ji teaches in the Sidereal/Lahiri system. The others are shown for reference only.'}
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="border border-ink-line/40 p-4">
          <p className="citation-meta">{lang === 'hi' ? 'सिडेरियल (लाहिरी)' : 'Sidereal (Lahiri)'}</p>
          <p className="font-display font-semibold mt-1 text-ink">
            {lang === 'hi' ? 'लग्न' : 'Lagna'}: {sid.ascSign} {sid.ascDegreeInSign.toFixed(1)}°
          </p>
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            {sid.planets.map(p => (
              <li key={p.name} className="flex justify-between">
                <span>{p.name}</span>
                <span className="font-mono">{p.sign} {p.degreeInSign.toFixed(1)}°</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-ink-line/40 p-4">
          <p className="citation-meta">{lang === 'hi' ? 'सायन (ट्रॉपिकल)' : 'Sayana (Tropical)'}</p>
          {trop ? (
            <>
              <p className="font-display font-semibold mt-1 text-ink">
                {lang === 'hi' ? 'लग्न' : 'Lagna'}: {trop.ascSign} {trop.ascDegreeInSign.toFixed(1)}°
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {trop.planets.map(p => (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-mono">{p.sign} {p.degreeInSign.toFixed(1)}°</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-soft italic">not available</p>
          )}
        </div>

        <div className="border border-ink-line/40 p-4">
          <p className="citation-meta">{lang === 'hi' ? 'KP कुष्पीय उपस्वामी' : 'KP cusp sub-lords'}</p>
          {kp ? (
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {kp.cusps.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>House {i + 1}</span>
                  <span className="font-mono">
                    {c.toFixed(1)}° · {kp.cuspSubLords[i]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft italic">not available</p>
          )}
        </div>
      </div>
    </section>
  );
}
