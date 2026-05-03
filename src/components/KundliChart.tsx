'use client';

import { useMemo } from 'react';
import type { Chart } from '@/lib/astrology/types';
import { SIGN_GLYPHS, SIGNS, SIGNS_HI } from '@/lib/astrology/types';

/**
 * North Indian style kundli — diamond layout where house 1 (lagna) is at
 * the TOP center, houses count counter-clockwise.
 *
 *      ┌─────────────┐
 *      │ \  12  /    │
 *      │  \   /  1   │  <- lagna sign at center top
 *      │11 \ /       │
 *      │   X    2    │
 *      │  / \        │
 *      │ /   \       │
 *      └─────────────┘
 *
 * The numbers shown are SIGN INDICES (1-12, where Aries=1). The PLANETS
 * are placed inside their respective house compartments.
 */

interface Props {
  chart: Chart;
  size?: number;
  lang?: 'en' | 'hi';
  title?: string;
}

const HOUSE_BOXES: Array<{ x: number; y: number; w: number; h: number; signX: number; signY: number; planetsX: number; planetsY: number }> = [
  // 1 — top-center diamond
  { x: 0.5, y: 0.0, w: 0.5, h: 0.5, signX: 0.50, signY: 0.18, planetsX: 0.50, planetsY: 0.30 },
  // 2 — top-left triangle
  { x: 0.0, y: 0.0, w: 0.5, h: 0.25, signX: 0.25, signY: 0.10, planetsX: 0.25, planetsY: 0.20 },
  // 3 — left-top triangle
  { x: 0.0, y: 0.25, w: 0.25, h: 0.25, signX: 0.10, signY: 0.30, planetsX: 0.16, planetsY: 0.40 },
  // 4 — center-left diamond
  { x: 0.0, y: 0.25, w: 0.5, h: 0.5, signX: 0.18, signY: 0.50, planetsX: 0.30, planetsY: 0.50 },
  // 5 — left-bottom triangle
  { x: 0.0, y: 0.50, w: 0.25, h: 0.25, signX: 0.10, signY: 0.70, planetsX: 0.16, planetsY: 0.62 },
  // 6 — bottom-left triangle
  { x: 0.0, y: 0.75, w: 0.5, h: 0.25, signX: 0.25, signY: 0.90, planetsX: 0.25, planetsY: 0.82 },
  // 7 — bottom-center diamond
  { x: 0.0, y: 0.50, w: 1.0, h: 0.5, signX: 0.50, signY: 0.84, planetsX: 0.50, planetsY: 0.72 },
  // 8 — bottom-right triangle
  { x: 0.5, y: 0.75, w: 0.5, h: 0.25, signX: 0.75, signY: 0.90, planetsX: 0.75, planetsY: 0.82 },
  // 9 — right-bottom triangle
  { x: 0.75, y: 0.50, w: 0.25, h: 0.25, signX: 0.90, signY: 0.70, planetsX: 0.85, planetsY: 0.62 },
  // 10 — center-right diamond
  { x: 0.5, y: 0.25, w: 0.5, h: 0.5, signX: 0.84, signY: 0.50, planetsX: 0.72, planetsY: 0.50 },
  // 11 — right-top triangle
  { x: 0.75, y: 0.25, w: 0.25, h: 0.25, signX: 0.90, signY: 0.30, planetsX: 0.85, planetsY: 0.40 },
  // 12 — top-right triangle
  { x: 0.5, y: 0.0, w: 0.5, h: 0.25, signX: 0.75, signY: 0.10, planetsX: 0.75, planetsY: 0.20 },
];

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
  Jupiter: 'Ju', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

export default function KundliChart({ chart, size = 360, lang = 'en', title }: Props) {
  const houses = useMemo(() => {
    const out: Array<{ house: number; signIndex: number; planets: Array<{ name: string; abbr: string; deg: number; retro: boolean }> }> = [];
    for (let h = 1; h <= 12; h++) {
      const sigIdx = (chart.ascSignIndex + h - 1) % 12;
      const ps = chart.planets.filter(p => p.house === h);
      out.push({
        house: h,
        signIndex: sigIdx,
        planets: ps.map(p => ({
          name: p.name,
          abbr: PLANET_ABBR[p.name] ?? p.name.slice(0, 2),
          deg: p.degreeInSign,
          retro: p.retrograde,
        })),
      });
    }
    return out;
  }, [chart]);

  const stroke = '#0A0805';
  const ink = '#0A0805';
  const accent = '#962412';
  const px = (v: number) => v * size;

  return (
    <div className="inline-block">
      {title && <p className="citation-meta mb-3">{title}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="kundli chart">
        {/* Outer square */}
        <rect x="0" y="0" width={size} height={size} fill="#FAFAF5" stroke={stroke} strokeWidth="2.5" />
        {/* Diagonals */}
        <line x1="0" y1="0" x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
        <line x1={size} y1="0" x2="0" y2={size} stroke={stroke} strokeWidth="1.5" />
        {/* Inner diamond connecting midpoints */}
        <polygon
          points={`${size/2},0 ${size},${size/2} ${size/2},${size} 0,${size/2}`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {/* Sign numbers — small, in upper-left of each house compartment */}
        {houses.map(h => {
          const box = HOUSE_BOXES[h.house - 1];
          return (
            <g key={`sign-${h.house}`}>
              <text
                x={px(box.signX)}
                y={px(box.signY)}
                fontFamily="Mukta, system-ui, sans-serif"
                fontSize={size * 0.045}
                fontWeight="700"
                fill={accent}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {h.signIndex + 1}
              </text>
            </g>
          );
        })}

        {/* Planets */}
        {houses.map(h => {
          const box = HOUSE_BOXES[h.house - 1];
          if (!h.planets.length) return null;
          const isLagna = h.house === 1;
          // Stack planets vertically inside each box
          const lineH = size * 0.05;
          return (
            <g key={`pl-${h.house}`}>
              {h.planets.map((p, i) => (
                <text
                  key={p.name}
                  x={px(box.planetsX)}
                  y={px(box.planetsY) + (i - (h.planets.length - 1) / 2) * lineH}
                  fontFamily="Mukta, system-ui, sans-serif"
                  fontSize={size * 0.046}
                  fontWeight="600"
                  fill={ink}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {p.abbr}{p.retro ? '℞' : ''} <tspan fontSize={size * 0.034} fill="#5A5045">{p.deg.toFixed(0)}°</tspan>
                </text>
              ))}
              {isLagna && (
                <text
                  x={px(box.planetsX)}
                  y={px(box.planetsY) + ((h.planets.length + 1) / 2) * lineH}
                  fontFamily="Mukta, system-ui, sans-serif"
                  fontSize={size * 0.034}
                  fontWeight="700"
                  fill={accent}
                  textAnchor="middle"
                >Asc</text>
              )}
            </g>
          );
        })}

        {/* Lagna marker — small "ASC" in house 1 */}
      </svg>

      {/* Legend below */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[0.78rem] text-ink-soft font-medium max-w-[360px]">
        {chart.planets.map(p => (
          <div key={p.name} className="flex items-baseline gap-2">
            <span className="font-bold text-ink w-6 inline-block">{PLANET_ABBR[p.name]}</span>
            <span className="flex-1">{lang === 'hi' ? signNameHi(p.signIndex) : p.sign} <span className="text-ink-mute">{p.degreeInSign.toFixed(1)}°</span></span>
            <span className="text-ink-mute text-xs">H{p.house}{p.retrograde ? '℞' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function signNameHi(i: number): string { return SIGNS_HI[i]; }
