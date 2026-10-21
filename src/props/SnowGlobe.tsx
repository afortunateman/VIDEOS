import React, {useId} from 'react';
import {mulberry32} from '../utils/seededRandom';

/**
 * The snow globe. The base is carved as an open palm cupping the glass — the same
 * hand shape as the town's portrait. Inside: a tiny square with a stone platform.
 *
 * Local space: centre of the glass sphere at the origin, radius `r`. The base sits
 * below, its bottom at y = r * 1.62.
 */
export const SnowGlobe: React.FC<{
  r?: number;
  /** 0..1, how much the glass catches light. Keep low when it must be forgettable. */
  shine?: number;
  /** Time in seconds, drives the drifting flakes inside. */
  t?: number;
  /** Warm light coming from the right (lamp side). */
  lampSide?: number;
}> = ({r = 34, shine = 0.4, t = 0, lampSide = 0.6}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rand = mulberry32(42);
  const flakes = Array.from({length: 26}, () => ({x: rand() * 2 - 1, y: rand(), s: 0.5 + rand(), sp: 0.02 + rand() * 0.03}));
  const s = r / 100; // design units: sphere radius 100
  return (
    <g>
      <defs>
        <radialGradient id={`glass${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#DCE6EE" stopOpacity={0.12} />
          <stop offset="0.7" stopColor="#A9BAC9" stopOpacity={0.1} />
          <stop offset="1" stopColor="#DCE6EE" stopOpacity={0.35} />
        </radialGradient>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8997A6" />
          <stop offset="1" stopColor="#A9BAC9" />
        </linearGradient>
        <linearGradient id={`base${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3B2616" />
          <stop offset={0.5} stopColor="#6B4A2E" />
          <stop offset="1" stopColor={lampSide > 0.3 ? '#A2703F' : '#5A3D25'} />
        </linearGradient>
        <clipPath id={`in${id}`}>
          <circle cx={0} cy={0} r={r * 0.97} />
        </clipPath>
      </defs>

      {/* contact shadow */}
      <ellipse cx={0} cy={r * 1.62} rx={r * 1.15} ry={r * 0.12} fill="#000" opacity={0.35} />

      {/* the tiny town inside */}
      <g clipPath={`url(#in${id})`}>
        <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={`url(#sky${id})`} opacity={0.85} />
        {/* buildings around the square */}
        <g transform={`scale(${s})`} fill="#6F7F90">
          <rect x={-92} y={10} width={30} height={40} />
          <path d="M -92 10 L -77 -8 L -62 10 Z" />
          <rect x={-60} y={0} width={26} height={50} />
          <rect x={30} y={4} width={28} height={46} />
          <path d="M 30 4 L 44 -14 L 58 4 Z" />
          <rect x={60} y={14} width={34} height={36} />
          <rect x={-8} y={-22} width={14} height={72} />
          <path d="M -8 -22 L -1 -40 L 6 -22 Z" />
        </g>
        {/* ground of the square */}
        <ellipse cx={0} cy={r * 0.62} rx={r * 1.05} ry={r * 0.32} fill="#DCE6EE" />
        {/* stone platform */}
        <g transform={`scale(${s})`}>
          <path d="M -26 50 L 26 50 L 22 62 L -22 62 Z" fill="#A9BAC9" />
          <rect x={-26} y={46} width={52} height={5} fill="#C7D3DD" />
        </g>
        {/* drifting flakes */}
        {flakes.map((f, i) => {
          const y = ((f.y + t * f.sp) % 1) * 2 - 1;
          return <circle key={i} cx={f.x * r * 0.85} cy={y * r * 0.9} r={0.9 * f.s * s * 3} fill="#fff" opacity={0.7} />;
        })}
      </g>

      {/* glass */}
      <circle cx={0} cy={0} r={r} fill={`url(#glass${id})`} stroke="#DCE6EE" strokeOpacity={0.25 + shine * 0.3} strokeWidth={Math.max(0.6, r * 0.025)} />
      <path
        d={`M ${-r * 0.62} ${-r * 0.5} A ${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.05} ${-r * 0.82}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.15 + shine * 0.55}
        strokeWidth={r * 0.07}
        strokeLinecap="round"
      />
      <circle cx={r * 0.55} cy={-r * 0.42} r={r * 0.06} fill="#FFE2B0" opacity={shine * lampSide} />

      {/* palm-shaped base: fingers cup the glass from below */}
      <g transform={`scale(${s})`}>
        {/* wrist / plinth */}
        <path d="M -70 118 C -66 104 -56 96 -40 92 L 40 92 C 56 96 66 104 70 118 L 72 160 L -72 160 Z" fill={`url(#base${id})`} />
        <rect x={-80} y={156} width={160} height={6} rx={2} fill="#2A1A0F" />
        {/* palm bowl */}
        <path d="M -78 62 C -74 92 -40 106 0 106 C 40 106 74 92 78 62 C 60 80 30 88 0 88 C -30 88 -60 80 -78 62 Z" fill={`url(#base${id})`} />
        {/* four fingers curling up around the glass */}
        {[-78, -56, 56, 76].map((x, i) => (
          <path
            key={i}
            d={`M ${x - 7} 70 C ${x * 1.08 - 6} 40 ${x * 1.12 - 4} 20 ${x * 1.04} 4 C ${x * 1.04 + 7} 2 ${x * 1.06 + 9} 10 ${x * 1.1 + 8} 22 C ${x * 1.06 + 10} 40 ${x + 9} 58 ${x + 9} 76 Z`}
            fill={`url(#base${id})`}
            opacity={0.95}
          />
        ))}
        {/* thumb */}
        <path d="M 66 86 C 92 80 104 64 102 46 C 108 46 112 54 110 64 C 106 84 90 96 70 100 Z" fill={`url(#base${id})`} />
        {/* carved lines */}
        <path d="M -40 96 C -20 100 20 100 40 96" fill="none" stroke="#2A1A0F" strokeOpacity={0.5} strokeWidth={2} />
      </g>
    </g>
  );
};
