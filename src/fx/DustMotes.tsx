import React from 'react';
import {mulberry32, noise1} from '../utils/seededRandom';

/** Slow dust drifting through a beam of light. Coordinates are world-space (SVG). */
export const DustMotes: React.FC<{
  t: number;
  count?: number;
  seed?: number;
  /** Region the motes live in. */
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  size?: number;
  opacity?: number;
}> = ({t, count = 40, seed = 5, x, y, w, h, color = '#FFE2B0', size = 1.6, opacity = 0.6}) => {
  const rand = mulberry32(seed);
  const motes = Array.from({length: count}, (_, i) => {
    const px = rand();
    const py = rand();
    const s = 0.4 + rand() * 1.0;
    const speed = 0.006 + rand() * 0.01;
    const tw = rand() * 10;
    return {i, px, py, s, speed, tw};
  });
  return (
    <g>
      {motes.map((m) => {
        const mx = x + ((m.px + noise1(t * 0.15 + m.tw, m.i) * 0.05) % 1) * w;
        const my = y + ((((m.py - t * m.speed) % 1) + 1) % 1) * h + noise1(t * 0.2 + m.tw, m.i + 50) * 6;
        const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.7 + m.tw));
        return <circle key={m.i} cx={mx} cy={my} r={size * m.s} fill={color} opacity={opacity * twinkle} />;
      })}
    </g>
  );
};
