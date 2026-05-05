// POST /api/kundli/field-explain — explain ONE prescription field for the user's chart.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeFullChart } from '@/lib/astrology/compute';
import { generateFieldExplanation } from '@/lib/agent/fieldExplain';
import type { BirthInput } from '@/lib/astrology/types';
import { PRESCRIPTION_FIELDS } from '@/lib/agent/prescriptionTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  input: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    tzOffsetMinutes: z.number().int().gte(-840).lte(840),
    lat: z.number().gte(-90).lte(90),
    lon: z.number().gte(-180).lte(180),
    placeName: z.string().trim().max(160),
    name: z.string().optional(),
  }),
  field: z.string(),
  recommendedValue: z.string().max(500),
  language: z.enum(['en', 'hi']).default('en'),
});

const CACHE: Record<string, { at: number; data: any }> = {};
const TTL = 24 * 3600 * 1000;

function cacheKey(input: BirthInput, field: string, lang: string): string {
  const s = `${input.date}|${input.time}|${input.lat.toFixed(4)}|${input.lon.toFixed(4)}|${field}|${lang}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid_request', detail: e.message }, { status: 400 });
  }

  if (!PRESCRIPTION_FIELDS.includes(body.field as any)) {
    return NextResponse.json({ error: 'unknown_field', detail: `Unknown field "${body.field}"` }, { status: 400 });
  }

  const ck = cacheKey(body.input as BirthInput, body.field, body.language);
  const cached = CACHE[ck];
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  const fc = computeFullChart(body.input as BirthInput);
  const data = await generateFieldExplanation(
    body.field as any,
    body.recommendedValue,
    fc,
    body.language,
  );
  CACHE[ck] = { at: Date.now(), data };
  return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } });
}
