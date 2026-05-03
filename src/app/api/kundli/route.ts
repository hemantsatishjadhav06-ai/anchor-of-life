/**
 * POST /api/kundli — compute kundli + BG 20-field prescription.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeFullChart } from '@/lib/astrology/compute';
import { buildPrescription } from '@/lib/astrology/prescription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().trim().max(80).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),         // YYYY-MM-DD
  time: z.string().regex(/^\d{2}:\d{2}$/),               // HH:MM
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
  const prescription = buildPrescription(chart);

  return NextResponse.json({ chart, prescription });
}
