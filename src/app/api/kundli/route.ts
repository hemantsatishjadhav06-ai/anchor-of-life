/**
 * POST /api/kundli — compute the full chart bundle (D-1/7/9/10/12/30,
 * Vimshottari dasha, doshas, yogas, KP, Sayana, Bhava Chalit).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeFullChart } from '@/lib/astrology/compute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().trim().max(80).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  tzOffsetMinutes: z.number().int().gte(-840).lte(840),
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
  placeName: z.string().trim().max(160),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid_request', detail: e.message }, { status: 400 });
  }
  const chart = computeFullChart(body);
  return NextResponse.json({ chart });
}
