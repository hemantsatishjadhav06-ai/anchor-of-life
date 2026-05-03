'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlaceResult {
  display: string;
  short: string;
  lat: number;
  lon: number;
  tz: string;
  tz_offset_minutes: number;
  country: string | null;
}

export default function KundliForm({ lang = 'en' as 'en' | 'hi' }: { lang?: 'en' | 'hi' }) {
  const router = useRouter();
  const [name, setName]     = useState('');
  const [date, setDate]     = useState('');
  const [time, setTime]     = useState('');
  const [placeQ, setPlaceQ] = useState('');
  const [place, setPlace]   = useState<PlaceResult | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [computing, setComputing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced place search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (place && placeQ === place.short) { setResults([]); return; }
    if (placeQ.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingPlaces(true);
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(placeQ.trim())}&limit=8`);
        const d = await r.json();
        setResults(d.results ?? []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoadingPlaces(false);
      }
    }, 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [placeQ, place]);

  function pickPlace(p: PlaceResult) {
    setPlace(p);
    setPlaceQ(p.short);
    setResults([]);
    setShowResults(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !place) return;
    setComputing(true);
    try {
      const r = await fetch('/api/kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          date,
          time,
          tzOffsetMinutes: place.tz_offset_minutes,
          lat: place.lat,
          lon: place.lon,
          placeName: place.short,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert('Sorry — ' + (e.detail ?? 'computation failed'));
        return;
      }
      const data = await r.json();
      // Stash result in sessionStorage and navigate to result page
      sessionStorage.setItem('kundli:last', JSON.stringify(data));
      sessionStorage.setItem('kundli:input', JSON.stringify({ name, date, time, place }));
      router.push(`/kundli/result?lang=${lang}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setComputing(false);
    }
  }

  const tzLabel = place ? `${place.tz} (${formatOffset(place.tz_offset_minutes)})` : '';

  return (
    <form onSubmit={submit} className="max-w-folio mx-auto space-y-7">
      {/* Name (optional) */}
      <label className="block">
        <span className="citation-meta block mb-2">{lang === 'hi' ? 'नाम (वैकल्पिक)' : 'Name (optional)'}</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={lang === 'hi' ? 'आपका नाम' : 'your name'}
          className="input-rule"
          autoComplete="off"
        />
      </label>

      {/* Date + time */}
      <div className="grid sm:grid-cols-2 gap-7">
        <label className="block">
          <span className="citation-meta block mb-2">{lang === 'hi' ? 'जन्म दिनांक' : 'Date of birth'}</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="input-rule"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <label className="block">
          <span className="citation-meta block mb-2">{lang === 'hi' ? 'जन्म समय' : 'Time of birth'}</span>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
            className="input-rule"
          />
        </label>
      </div>

      {/* Place with autocomplete */}
      <label className="block relative">
        <span className="citation-meta block mb-2">{lang === 'hi' ? 'जन्म स्थान' : 'Place of birth'}</span>
        <input
          type="text"
          value={placeQ}
          onChange={e => { setPlaceQ(e.target.value); setPlace(null); }}
          placeholder={lang === 'hi' ? 'शहर खोजें… (कोई भी देश)' : 'search any city in the world…'}
          required
          className="input-rule"
          autoComplete="off"
          onFocus={() => setShowResults(results.length > 0)}
        />
        {place && (
          <span className="absolute right-0 top-9 text-[0.78rem] text-ink-mute font-semibold">
            {tzLabel}
          </span>
        )}
        {/* Autocomplete dropdown */}
        {showResults && results.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-paper border-2 border-ink shadow-[4px_4px_0_var(--ink)] divide-y divide-ink-line/40">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickPlace(r)}
                  className="w-full text-left px-4 py-3 hover:bg-paper-deep transition-colors"
                >
                  <span className="font-display font-semibold text-ink block">{r.short}</span>
                  <span className="text-xs text-ink-mute font-normal block mt-0.5">
                    {r.display.length > 90 ? r.display.slice(0, 90) + '…' : r.display}
                  </span>
                  <span className="text-[0.7rem] text-ink-mute font-semibold uppercase tracking-wider mt-1 inline-block">
                    {r.tz} ({formatOffset(r.tz_offset_minutes)}) · {r.lat.toFixed(2)}°, {r.lon.toFixed(2)}°
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {loadingPlaces && (
          <span className="absolute right-2 bottom-3 text-xs text-ink-mute italic">searching…</span>
        )}
      </label>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={computing || !date || !time || !place}
          className="btn-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {computing
            ? (lang === 'hi' ? 'गणना हो रही है…' : 'Computing your chart…')
            : (lang === 'hi' ? 'कुंडली बनाएँ' : 'Generate Kundli')}
        </button>
        <p className="mt-4 text-xs text-ink-mute leading-relaxed">
          {lang === 'hi'
            ? 'गणना ब्राउज़र में होती है — आपकी जानकारी कहीं संग्रहीत नहीं की जाती।'
            : 'Calculation runs and stays in your browser. No data stored, no account needed.'}
        </p>
      </div>
    </form>
  );
}

function formatOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-';
  const m = Math.abs(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
