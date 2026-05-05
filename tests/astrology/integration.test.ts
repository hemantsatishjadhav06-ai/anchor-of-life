import { describe, test, expect } from 'vitest';
import { computeFullChart } from '@/lib/astrology/compute';

const SAMPLE = {
  date: '1995-08-15',
  time: '11:00',
  tzOffsetMinutes: 330,
  lat: 18.5204,
  lon: 73.8567,
  placeName: 'Pune',
};

describe('computeFullChart bundle', () => {
  const fc = computeFullChart(SAMPLE);

  test('returns all divisional charts', () => {
    expect(fc.d1).toBeDefined();
    expect(fc.d7).toBeDefined();
    expect(fc.d9).toBeDefined();
    expect(fc.d10).toBeDefined();
    expect(fc.d12).toBeDefined();
    expect(fc.d30).toBeDefined();
  });

  test('returns dasha readout', () => {
    expect(fc.dasha).toBeDefined();
    expect(fc.dasha!.mahadashas.length).toBe(9);
    expect(fc.dasha!.activeMaha).toBeDefined();
    expect(fc.dasha!.activeAntar).toBeDefined();
  });

  test('returns dosha array', () => {
    expect(Array.isArray(fc.doshas)).toBe(true);
    expect(fc.doshas!.length).toBe(4);
    expect(fc.doshas!.map(d => d.key).sort()).toEqual(['kaalSarp', 'mangal', 'pitra', 'sadeSati']);
  });

  test('returns yogas array (possibly empty)', () => {
    expect(Array.isArray(fc.yogas)).toBe(true);
  });

  test('returns KP readout with 12 cusps', () => {
    expect(fc.kp).toBeDefined();
    expect(fc.kp!.cusps.length).toBe(12);
    expect(fc.kp!.cuspSubLords.length).toBe(12);
    expect(Object.keys(fc.kp!.planetSubLords).length).toBe(9);
  });

  test('returns Sayana D-1 with all 9 planets', () => {
    expect(fc.sayana?.d1).toBeDefined();
    expect(fc.sayana!.d1.planets.length).toBe(9);
  });

  test('Sayana longitudes differ from sidereal by ~ayanamsa', () => {
    const sunSid = fc.d1.planets.find(p => p.name === 'Sun')!.longitude;
    const sunTrop = fc.sayana!.d1.planets.find(p => p.name === 'Sun')!.longitude;
    const diff = ((sunTrop - sunSid) % 360 + 360) % 360;
    expect(diff).toBeGreaterThan(20);
    expect(diff).toBeLessThan(28);
  });

  test('Bhava Chalit has same planet longitudes but possibly different houses', () => {
    expect(fc.bhavaChalit).toBeDefined();
    fc.bhavaChalit!.planets.forEach(p => {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    });
  });

  test('all D-N planets have valid sign + house', () => {
    for (const c of [fc.d1, fc.d7, fc.d9, fc.d10, fc.d12, fc.d30]) {
      expect(c.planets.length).toBe(9);
      for (const p of c.planets) {
        expect(p.signIndex).toBeGreaterThanOrEqual(0);
        expect(p.signIndex).toBeLessThanOrEqual(11);
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
      }
    }
  });
});
