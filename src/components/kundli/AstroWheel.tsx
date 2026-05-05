'use client';
import type { Chart } from '@/lib/astrology/types';
import { SIGN_GLYPHS } from '@/lib/astrology/types';

interface Props {
  chart: Chart;
  size?: number;
  cusps?: number[]; // 12 cusp longitudes (sidereal) — overrides whole-sign
}

const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

export default function AstroWheel({ chart, size = 380, cusps }: Props) {
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.46;
  const rInner = size * 0.30;
  const rPlanet = size * 0.20;
  const ascDeg = chart.ascendant;

  // Place Asc on the LEFT of the wheel; CCW from there.
  const toXY = (lon: number, r: number) => {
    const angleDeg = (lon - ascDeg + 360) % 360;
    const angleRad = (180 - angleDeg) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
  };

  const houseCusps = cusps ?? Array.from({ length: 12 }, (_, i) => (
    ((chart.ascSignIndex + i) * 30 + chart.ascDegreeInSign) % 360
  ));

  const houseLines = houseCusps.map((c, i) => {
    const p1 = toXY(c, rInner);
    const p2 = toXY(c, rOuter);
    return (
      <line
        key={i}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="currentColor"
        strokeWidth={i % 3 === 0 ? 1.6 : 0.6}
        opacity={i % 3 === 0 ? 0.9 : 0.4}
      />
    );
  });

  const houseNumbers = houseCusps.map((c, i) => {
    const next = houseCusps[(i + 1) % 12];
    const span = ((next - c) % 360 + 360) % 360;
    const mid = (c + span / 2) % 360;
    const p = toXY(mid, (rInner + rOuter) / 2 - size * 0.02);
    return (
      <text
        key={`hn-${i}`}
        x={p.x} y={p.y}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.022} fill="currentColor" opacity={0.45}
      >
        {i + 1}
      </text>
    );
  });

  const signLabels = Array.from({ length: 12 }, (_, i) => {
    const lon = i * 30 + 15;
    const p = toXY(lon, (rInner + rOuter) / 2 + size * 0.02);
    return (
      <text
        key={`sg-${i}`}
        x={p.x} y={p.y}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.045} fill="currentColor" opacity={0.85}
      >
        {SIGN_GLYPHS[i]}
      </text>
    );
  });

  // Cluster planets near same longitude radially
  const sortedPlanets = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
  const planetGlyphs = sortedPlanets.map((p, i) => {
    const ringOffset = (i % 3) * size * 0.04;
    const r = rPlanet - ringOffset;
    const xy = toXY(p.longitude, r);
    const symbol = PLANET_GLYPH[p.name] ?? p.symbol;
    return (
      <g key={p.name}>
        <text
          x={xy.x} y={xy.y}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.05} fill="currentColor"
        >
          {symbol}
        </text>
        <text
          x={xy.x} y={xy.y + size * 0.038}
          textAnchor="middle"
          fontSize={size * 0.022} fill="currentColor" opacity={0.55}
        >
          {p.degreeInSign.toFixed(0)}°
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="text-ink"
      role="img"
      aria-label="Astro wheel chart"
    >
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="currentColor" strokeWidth={1.4} />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="currentColor" strokeWidth={0.9} opacity={0.7} />
      <circle cx={cx} cy={cy} r={size * 0.08} fill="currentColor" opacity={0.05} />
      {houseLines}
      {houseNumbers}
      {signLabels}
      {planetGlyphs}
      {/* Asc pointer */}
      <text
        x={cx - rOuter - 6} y={cy + 4}
        textAnchor="end"
        fontSize={size * 0.032} fill="var(--vermilion, currentColor)" opacity={0.9}
      >
        Asc
      </text>
      <line
        x1={cx - rOuter - 4} y1={cy}
        x2={cx - rInner} y2={cy}
        stroke="var(--vermilion, currentColor)" strokeWidth={1.5}
      />
    </svg>
  );
}
