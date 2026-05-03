/**
 * GET /api/geocode?q=delhi
 *
 * Proxies OpenStreetMap Nominatim with a proper User-Agent and adds
 * timezone resolution via tz-lookup so the client gets everything in
 * one call. We're nice citizens: cache results in-memory + obey the
 * 1 req/sec rate limit per Nominatim's policy.
 */
import { NextRequest, NextResponse } from 'next/server';
import tzLookup from 'tz-lookup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE: Record<string, { at: number; data: any }> = {};
const TTL_MS = 7 * 24 * 60 * 60 * 1000;          // 7 days

let lastNominatimAt = 0;
async function rateLimitedFetch(url: string, init?: RequestInit) {
  const elapsed = Date.now() - lastNominatimAt;
  if (elapsed < 1100) {                          // Nominatim asks for ≥1 sec/req
    await new Promise(r => setTimeout(r, 1100 - elapsed));
  }
  lastNominatimAt = Date.now();
  return fetch(url, init);
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  place_id: number;
  address?: { country?: string; country_code?: string; state?: string; city?: string; town?: string; village?: string };
  importance?: number;
}

interface PlaceResult {
  display: string;
  short: string;
  lat: number;
  lon: number;
  tz: string;
  tz_offset_minutes: number;
  country: string | null;
}

function tzOffsetMinutes(tz: string, sample = new Date()): number {
  // Compute current offset for IANA timezone (e.g., "Asia/Kolkata" → 330)
  // Uses Intl + parsing the offset from the formatted string.
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    });
    const parts = fmt.formatToParts(sample);
    const offset = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    // "GMT+05:30", "GMT-08:00", or "GMT+0"
    const m = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    const h = parseInt(m[2], 10);
    const min = parseInt(m[3] ?? '0', 10);
    return sign * (h * 60 + min);
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '8'), 12);

  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const c = CACHE[cacheKey];
  if (c && Date.now() - c.at < TTL_MS) {
    return NextResponse.json(c.data, { headers: { 'X-Cache': 'HIT' } });
  }

  const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
  nomUrl.searchParams.set('q', q);
  nomUrl.searchParams.set('format', 'json');
  nomUrl.searchParams.set('addressdetails', '1');
  nomUrl.searchParams.set('limit', String(limit));

  let raw: NominatimResult[];
  try {
    const r = await rateLimitedFetch(nomUrl.toString(), {
      headers: {
        'User-Agent': 'AnchorOfLife/1.0 (https://anchor-of-life.onrender.com)',
        'Accept-Language': 'en',
      },
    });
    if (!r.ok) {
      return NextResponse.json({ results: [], error: `nominatim ${r.status}` }, { status: 502 });
    }
    raw = await r.json();
  } catch (e: any) {
    return NextResponse.json({ results: [], error: e.message }, { status: 502 });
  }

  const results: PlaceResult[] = raw.map(n => {
    const lat = parseFloat(n.lat);
    const lon = parseFloat(n.lon);
    let tz = 'UTC';
    try { tz = tzLookup(lat, lon); } catch {}
    const short = n.address?.city ?? n.address?.town ?? n.address?.village ?? n.display_name.split(',')[0];
    return {
      display: n.display_name,
      short: `${short}${n.address?.country ? ', ' + n.address.country : ''}`,
      lat,
      lon,
      tz,
      tz_offset_minutes: tzOffsetMinutes(tz),
      country: n.address?.country ?? null,
    };
  });

  const data = { results };
  CACHE[cacheKey] = { at: Date.now(), data };
  return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } });
}
