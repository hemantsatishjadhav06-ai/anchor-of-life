'use client';
import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/types';
import type { BirthInput } from '@/lib/astrology/types';
import type { BGPrescription } from '@/lib/agent/prescriptionTypes';
import { PRESCRIPTION_FIELDS } from '@/lib/agent/prescriptionTypes';
import type { Citation } from '@/lib/types';

const FIELD_LABELS: Record<keyof BGPrescription, { en: string; hi: string }> = {
  'Anjaan':                    { en: 'Anjaan (अनजान — donate to strangers)', hi: 'अनजान' },
  'School':                    { en: 'School',                                hi: 'विद्यालय' },
  'Mandir / Gurudwara':        { en: 'Mandir / Gurudwara',                   hi: 'मंदिर / गुरुद्वारा' },
  'R Hand':                    { en: 'Right Hand (gem / colour / metal)',     hi: 'दाहिना हाथ' },
  'L Hand':                    { en: 'Left Hand',                              hi: 'बायाँ हाथ' },
  'Cow':                       { en: 'Cow',                                    hi: 'गाय' },
  'Mass (Non-Veg)':            { en: 'Non-Veg / Mass',                         hi: 'मांस' },
  'R Leg':                     { en: 'Right Leg colour',                       hi: 'दाहिना पैर' },
  'L Leg':                     { en: 'Left Leg colour',                        hi: 'बायाँ पैर' },
  'Rules (Neam)':              { en: 'Rules (Neam)',                           hi: 'नियम' },
  'Blind People':              { en: 'Blind People',                           hi: 'अंधे लोग' },
  'Waist':                     { en: 'Waist',                                  hi: 'कमर' },
  'River':                     { en: 'River',                                  hi: 'नदी' },
  'Tree':                      { en: 'Tree',                                   hi: 'पेड़' },
  'Roots (Jad)':               { en: 'Roots (Jad)',                            hi: 'जड़' },
  'Pitr Gaya':                 { en: 'Pitr Gaya',                              hi: 'पितृ गया' },
  'Pitr Classes':              { en: 'Pitr Classes',                           hi: 'पितृ कक्षा' },
  'Nose Septum (Nak ki Bali)': { en: 'Nose Septum (Nak ki Bali)',              hi: 'नाक की बाली' },
  'Transe (Kinner)':           { en: 'Transe (Kinner)',                        hi: 'किन्नर' },
  'Isht':                      { en: 'Isht (इष्ट देव)',                       hi: 'इष्ट देव' },
  'Pooja':                     { en: 'Pooja',                                  hi: 'पूजा' },
  'Devta':                     { en: 'Devta',                                  hi: 'देवता' },
  'Business':                  { en: 'Business',                               hi: 'व्यवसाय' },
  'ownership':                 { en: 'Ownership',                              hi: 'स्वामित्व' },
  'Shadi':                     { en: 'Shadi (विवाह)',                          hi: 'शादी' },
  'Comments':                  { en: 'Comments',                               hi: 'टिप्पणी' },
  'Recommended Videos':        { en: 'Recommended Videos',                     hi: 'सुझाए गए वीडियो' },
};

interface Props {
  input: BirthInput;
  lang: Lang;
}

interface ApiResp {
  prescription: BGPrescription;
  citations: Citation[];
  composer_model?: string;
}

export default function PrescriptionTable({ input, lang }: Props) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setErr(null);
    const cacheKey = `kundli-prescription:${lang}:${input.date}|${input.time}|${input.lat.toFixed(3)}|${input.lon.toFixed(3)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        return;
      }
    } catch {}

    const ctrl = new AbortController();
    fetch('/api/kundli/prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, language: lang }),
      signal: ctrl.signal,
    })
      .then(async r => {
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          throw new Error(`HTTP ${r.status}${t ? ': ' + t.slice(0, 160) : ''}`);
        }
        const text = await r.text();
        if (!text) throw new Error('empty response');
        return JSON.parse(text);
      })
      .then(d => {
        if (d.error) throw new Error(d.detail || d.error);
        setData(d);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch {}
      })
      .catch(e => { if (e.name !== 'AbortError') setErr(String(e.message ?? e)); });

    return () => ctrl.abort();
  }, [lang, input.date, input.time, input.lat, input.lon]);

  if (err) {
    return <p className="text-vermilion italic text-sm">{lang === 'hi' ? 'त्रुटि' : 'Error'}: {err}</p>;
  }

  if (!data) {
    return (
      <div className="space-y-3 animate-pulse">
        <p className="text-ink-soft text-sm citation-meta">
          {lang === 'hi'
            ? 'ब्रजेश जी की शिक्षाओं से उपाय तैयार हो रहे हैं… (60–90 सेकंड)'
            : "Generating prescription from Brajesh ji's teachings… (60–90 seconds)"}
        </p>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-3 bg-ink-line/40 rounded" style={{ width: `${50 + (i * 7) % 40}%` }}/>
        ))}
      </div>
    );
  }

  const { prescription, citations } = data;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden border border-ink-line/40">
        <table className="w-full text-sm">
          <tbody>
            {PRESCRIPTION_FIELDS.map(key => (
              <tr key={key} className="border-b border-ink-line/20 last:border-0 hover:bg-paper-deep/30">
                <th
                  scope="row"
                  className="py-2.5 px-4 align-top text-left font-medium text-ink-soft w-[42%] bg-paper-deep/40"
                >
                  {FIELD_LABELS[key][lang]}
                </th>
                <td className="py-2.5 px-4 align-top text-ink whitespace-pre-wrap">
                  {prescription[key]
                    ? <span>{prescription[key]}</span>
                    : <span className="text-ink-mute italic">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {citations.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer citation-meta">
            {lang === 'hi' ? `स्रोत (${citations.length})` : `Sources (${citations.length})`}
          </summary>
          <ol className="mt-2 space-y-1 pl-1">
            {citations.map((c, i) => (
              <li key={i} className="text-ink-soft">
                <a
                  href={`https://youtu.be/${c.video_id}?t=${Math.floor(c.start_sec)}`}
                  target="_blank"
                  rel="noopener"
                  className="hover:underline"
                >
                  [{i + 1}] {c.title}
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
