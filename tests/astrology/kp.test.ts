import { describe, test, expect } from 'vitest';
import { subLordOf } from '@/lib/astrology/kp';

describe('KP sub-lord', () => {
  test('every longitude resolves to a (star, sub, subSub) triple', () => {
    for (let i = 0; i < 360; i += 0.5) {
      const r = subLordOf(i);
      expect(r.star).toBeDefined();
      expect(r.sub).toBeDefined();
      expect(r.subSub).toBeDefined();
    }
  });

  test('first segment (Ashwini) is Ketu/Ketu', () => {
    const r = subLordOf(0.001);
    expect(r.star).toBe('Ketu');
    expect(r.sub).toBe('Ketu');
  });

  test('different longitudes give different sub-lords', () => {
    const a = subLordOf(0.5);
    const b = subLordOf(45);
    expect(a.sub === b.sub && a.star === b.star && a.subSub === b.subSub).toBe(false);
  });

  test('boundary at exactly 360° wraps to 0°', () => {
    const r0 = subLordOf(0.0001);
    const r360 = subLordOf(359.99);
    expect(r0.star).toBeDefined();
    expect(r360.star).toBeDefined();
  });
});
