import { describe, test, expect } from 'vitest';
import { computeVimshottari, MAHA_LORDS, MAHA_YEARS, nakshatraIndex } from '@/lib/astrology/dasha';

describe('Vimshottari', () => {
  test('120-year cycle sums to 120', () => {
    const total = MAHA_LORDS.reduce((a, l) => a + MAHA_YEARS[l], 0);
    expect(total).toBe(120);
  });

  test('birth at start of Ashwini → Ketu maha for 7 full years', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const r = computeVimshottari(0.0001, birth);
    expect(r.mahadashas[0].lord).toBe('Ketu');
    const startMs = new Date(r.mahadashas[0].start).getTime();
    const endMs = new Date(r.mahadashas[0].end).getTime();
    const years = (endMs - startMs) / (365.25 * 86400 * 1000);
    expect(years).toBeCloseTo(7, 1);
  });

  test('mid-nakshatra → first maha is shortened', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const r = computeVimshottari(6 + 40 / 60, birth);
    expect(r.mahadashas[0].lord).toBe('Ketu');
    const years =
      (new Date(r.mahadashas[0].end).getTime() - new Date(r.mahadashas[0].start).getTime()) /
      (365.25 * 86400 * 1000);
    expect(years).toBeCloseTo(3.5, 1);
  });

  test('nakshatra 9 (Magha) lord = Ketu, lord 10 (Purva Phalguni) = Venus', () => {
    expect(MAHA_LORDS[nakshatraIndex(9 * (360 / 27)) % 9]).toBe('Ketu');
    expect(MAHA_LORDS[nakshatraIndex(10 * (360 / 27)) % 9]).toBe('Venus');
  });

  test('mahadashas array has 9 entries (one per lord)', () => {
    const r = computeVimshottari(45, new Date('2000-01-01T00:00:00Z'));
    expect(r.mahadashas.length).toBe(9);
  });

  test('activeAntar exists and is inside activeMaha', () => {
    const r = computeVimshottari(45, new Date('1990-01-01T00:00:00Z'));
    expect(r.activeAntar).toBeDefined();
    const aStart = new Date(r.activeAntar.start).getTime();
    const aEnd = new Date(r.activeAntar.end).getTime();
    const mStart = new Date(r.activeMaha.start).getTime();
    const mEnd = new Date(r.activeMaha.end).getTime();
    expect(aStart).toBeGreaterThanOrEqual(mStart);
    expect(aEnd).toBeLessThanOrEqual(mEnd);
  });
});
