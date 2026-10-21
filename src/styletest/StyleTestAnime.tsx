import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Atmosphere, BlurDefs, RoomBack} from './Room';
import {Chair, DeskBody, DeskProps, Lamp} from './Desk';
import {AnimeSeated} from './AnimeSeated';
import {Letterbox} from '../fx/Letterbox';
import {mulberry32} from '../utils/seededRandom';

/** Ghibli-style greenery: a hanging pothos by the window, a monstera on the floor. */
const Plants: React.FC = () => {
  const r = mulberry32(21);
  const leaf = (x: number, y: number, a: number, s: number, c: string, k: string) => (
    <g key={k} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d="M 0 0 C -9 -6 -10 -18 0 -26 C 10 -18 9 -6 0 0 Z" fill={c} />
      <path d="M 0 -2 L 0 -22" stroke="#1d3a1f" strokeWidth={1} opacity={0.6} />
    </g>
  );
  return (
    <g style={{filter: 'brightness(0.5) saturate(0.75)'}}>
      {/* hanging pothos */}
      <line x1={600} y1={120} x2={600} y2={190} stroke="#1a120c" strokeWidth={2.5} />
      <path d="M 568 190 L 632 190 L 622 226 L 578 226 Z" fill="#8a5232" />
      <path d="M 568 190 L 632 190 L 630 197 L 570 197 Z" fill="#a8693f" />
      {Array.from({length: 7}, (_, v) => {
        const x0 = 574 + v * 9;
        const len = 80 + r() * 160;
        const pts = Array.from({length: 9}, (_, i) => {
          const t = i / 8;
          return {x: x0 + Math.sin(t * 3 + v) * 10 + (v - 3) * t * 10, y: 214 + t * len};
        });
        return (
          <g key={v}>
            <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#24402a" strokeWidth={1.6} />
            {pts.slice(1).map((p, i) => leaf(p.x, p.y, (i % 2 ? 1 : -1) * (50 + r() * 40), 0.9 + r() * 0.4, r() > 0.5 ? '#3f6f3c' : '#5a8a4a', `${v}-${i}`))}
          </g>
        );
      })}
      {/* monstera in a pot on the floor beside the bookcase */}
      <g transform="translate(1480 880)">
        <path d="M -40 0 L 40 0 L 34 -70 L -34 -70 Z" fill="#6b3d26" />
        <path d="M -38 -70 L 38 -70 L 36 -60 L -36 -60 Z" fill="#8a5232" />
        {[
          [-60, -210, -40, 1.2],
          [10, -250, 5, 1.3],
          [60, -190, 40, 1.1],
          [-20, -160, -15, 1.0],
          [40, -140, 25, 0.9],
        ].map(([x, y, a, sc], i) => (
          <g key={i}>
            <path d={`M 0 -66 Q ${x * 0.4} ${(y - 66) * 0.5} ${x} ${y + 40}`} stroke="#2a4a2c" strokeWidth={4} fill="none" />
            <g transform={`translate(${x} ${y}) rotate(${a}) scale(${sc})`}>
              <path d="M 0 50 C -60 40 -70 -30 0 -50 C 70 -30 60 40 0 50 Z" fill={i % 2 ? '#2f5a33' : '#3d6e3a'} />
              {[-26, -6, 14].map((yy, k) => (
                <g key={k} fill="#151a1e">
                  <path d={`M -58 ${yy} L -30 ${yy + 3} L -58 ${yy + 7} Z`} />
                  <path d={`M 58 ${yy} L 30 ${yy + 3} L 58 ${yy + 7} Z`} />
                </g>
              ))}
              <path d="M 0 48 L 0 -46" stroke="#5e8f4a" strokeWidth={2} />
              <path d="M 10 -40 C 40 -30 52 0 44 24" stroke="#ffcf8a" strokeWidth={3} fill="none" opacity={0.35} />
            </g>
          </g>
        ))}
      </g>
    </g>
  );
};

const W = 1920;
const H = 1080;
// Medium shot, a touch tighter than S1's.
const CAM = {x: 1010, y: 545, zoom: 1.08};

/** Style test: S1 medium shot, anime character + painted room + Klaus light. */
export const StyleTestAnime: React.FC = () => (
  <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <filter id="stPaint" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="stPaper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="2" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id="stMottle" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="12" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id="stGradeWarm" cx="0.62" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffb870" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffb870" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="stVig" cx="0.55" cy="0.52" r="0.75">
          <stop offset="0.45" stopColor="#02040a" stopOpacity={0} />
          <stop offset="1" stopColor="#02040a" stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <BlurDefs />

      <g transform={`translate(${W / 2} ${H / 2}) scale(${CAM.zoom}) translate(${-CAM.x} ${-CAM.y})`}>
        <g filter="url(#stPaint)">
          <RoomBack />
          <Chair />
          <AnimeSeated lift={0.55} />
          <DeskBody />
          <DeskProps />
          <Lamp />
          <Plants />
          <Atmosphere />
        </g>
      </g>

      {/* foreground: a blurred plant at the edge of frame, for depth */}
      <g filter="url(#stBlur16)" opacity={0.95}>
        {[
          'M 1960 980 C 1880 860 1820 760 1760 700 C 1800 760 1850 860 1900 1000 Z',
          'M 1960 980 C 1900 900 1840 860 1780 860 C 1840 880 1890 930 1930 1000 Z',
          'M 1980 900 C 1940 800 1900 700 1890 600 C 1920 700 1950 780 1990 880 Z',
          'M 1990 1000 C 1960 940 1900 920 1830 930 C 1890 950 1940 980 1970 1020 Z',
        ].map((d, i) => (
          <path key={i} d={d} fill={i % 2 ? '#0b1410' : '#08100c'} />
        ))}
      </g>

      {/* grade: warm where the lamp is, deep teal falloff, paper and paint texture */}
      <rect width={W} height={H} fill="url(#stGradeWarm)" style={{mixBlendMode: 'screen'}} />
      <rect width={W} height={H} fill="#0e2233" opacity={0.18} style={{mixBlendMode: 'soft-light'}} />
      <rect width={W} height={H} filter="url(#stMottle)" opacity={0.22} style={{mixBlendMode: 'soft-light'}} />
      <rect width={W} height={H} filter="url(#stPaper)" opacity={0.14} style={{mixBlendMode: 'overlay'}} />
      <rect width={W} height={H} fill="url(#stVig)" />
    </svg>
    <Letterbox />
  </AbsoluteFill>
);
