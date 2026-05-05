import { describe, test, expect } from 'vitest';
import { divisionalSignOf } from '@/lib/astrology/divisional';

describe('divisionalSignOf', () => {
  test('D-1 of any longitude returns its sign', () => {
    expect(divisionalSignOf(0, 1)).toBe(0);
    expect(divisionalSignOf(45, 1)).toBe(1);
    expect(divisionalSignOf(359, 1)).toBe(11);
  });

  test('D-9 of Aries 0° is Aries (0)', () => {
    expect(divisionalSignOf(0, 9)).toBe(0);
  });

  test('D-9 of Taurus 0° (sign 1) starts at Capricorn (9)', () => {
    expect(divisionalSignOf(30, 9)).toBe(9);
  });

  test('D-10 of Aries 0° = Aries (odd sign starts at same)', () => {
    expect(divisionalSignOf(0, 10)).toBe(0);
  });

  test('D-10 of Taurus 0° (even) starts at Capricorn (sign 9)', () => {
    expect(divisionalSignOf(30, 10)).toBe(9);
  });

  test('D-12 of Aries 5° = Gemini (sign + 2 parts of 2.5°)', () => {
    expect(divisionalSignOf(5, 12)).toBe(2);
  });

  test('D-7 of Aries 4° = Aries', () => {
    expect(divisionalSignOf(4, 7)).toBe(0);
  });

  test('D-30 of Aries 3° (odd, 0–5°) = Aries (Mars-ruled)', () => {
    expect(divisionalSignOf(3, 30)).toBe(0);
  });

  test('D-30 of Taurus 3° (even, 0–5°) = Taurus (Venus-ruled)', () => {
    expect(divisionalSignOf(33, 30)).toBe(1);
  });

  test('handles negative and overflow longitudes', () => {
    expect(divisionalSignOf(-30, 1)).toBe(11);
    expect(divisionalSignOf(720, 1)).toBe(0);
  });
});
