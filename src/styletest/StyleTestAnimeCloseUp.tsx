import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BlurDefs, RoomBack, Soft} from './Room';
import {AnimeVarunBust} from './AnimeVarun';
import {Letterbox} from '../fx/Letterbox';
import {mulberry32} from '../utils/seededRandom';

const W = 1920;
const H = 1080;

/** Style test 3: anime character, Klaus light, close-up. */
export const StyleTestAnimeCloseUp: React.FC = () => {
  const rand = mulberry32(8);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={W} height={H}>
        <defs>
          <filter id="ctPaint" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="ctPaper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="3" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <radialGradient id="ctVig" cx="0.58" cy="0.5" r="0.75">
            <stop offset="0.4" stopColor="#02040a" stopOpacity={0} />
            <stop offset="1" stopColor="#02040a" stopOpacity={0.85} />
          </radialGradient>
        </defs>
        <BlurDefs />

        {/* the office behind him, far out of focus */}
        <g filter="url(#stBlur16)">
          <g transform="translate(-260 -420) scale(1.9)">
            <RoomBack />
          </g>
          <rect width={W} height={H} fill="#0a1220" opacity={0.35} />
        </g>
        {/* window bokeh */}
        <g style={{mixBlendMode: 'screen'}}>
          {Array.from({length: 26}, (_, i) => {
            const x = 40 + rand() * 820;
            const y = 180 + rand() * 600;
            const r = 12 + rand() * 34;
            return <circle key={i} cx={x} cy={y} r={r} fill={rand() > 0.4 ? '#ffc679' : '#8fb8ef'} opacity={0.08 + rand() * 0.14} filter="url(#stBlur2)" />;
          })}
        </g>
        {/* lamp glow behind his shoulder */}
        <Soft d="M 1480 120 a 260 220 0 1 0 1 0 Z" fill="#ffb366" o={0.45} blur={70} blend="screen" />

        <g filter="url(#ctPaint)">
          <g transform="translate(1190 470) scale(1.4)">
            <AnimeVarunBust />
          </g>
        </g>

        {/* a desk plant in the foreground, slightly soft */}
        <g filter="url(#stBlur4)">
          {[
            [140, 980, -30, 1.2],
            [220, 1000, -10, 1.0],
            [60, 940, -55, 1.1],
            [300, 1010, 15, 0.9],
            [10, 1000, -75, 1.3],
            [380, 1020, 35, 0.8],
          ].map(([x, y, a, sc], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${a}) scale(${sc})`}>
              <path d="M 0 0 C -40 -60 -36 -170 0 -230 C 36 -170 40 -60 0 0 Z" fill={i % 2 ? '#2f5a33' : '#3d6e3a'} stroke="#13240f" strokeWidth={2} />
              <path d="M 0 0 C 10 -60 12 -150 0 -230 C 30 -170 36 -60 0 0 Z" fill="#1f3c22" />
              <path d="M 0 -10 L 0 -220" stroke="#5e8f4a" strokeWidth={2} />
              <path d="M -6 -180 C -16 -140 -18 -90 -12 -40" stroke="#ffcf8a" strokeWidth={3} fill="none" opacity={0.25} />
            </g>
          ))}
        </g>
        {/* a hanging plant at the top of frame, catching the lamp */}
        <g filter="url(#stBlur6)">
          <line x1={1720} y1={130} x2={1720} y2={210} stroke="#2a1d14" strokeWidth={3} />
          <path d="M 1680 210 L 1760 210 L 1748 250 L 1692 250 Z" fill="#7a4a2c" stroke="#2a1d14" strokeWidth={2} />
          {Array.from({length: 9}, (_, i) => {
            const x = 1670 + i * 12;
            const len = 60 + ((i * 37) % 70);
            return (
              <g key={i}>
                <path d={`M ${x + 6} 220 C ${x - 6} ${240 + len * 0.4} ${x + 14} ${240 + len * 0.7} ${x + 2} ${240 + len}`} stroke="#2f5a33" strokeWidth={3} fill="none" />
                {[0.3, 0.6, 0.9].map((t, k) => (
                  <ellipse key={k} cx={x + 2 + (k % 2 ? 8 : -6)} cy={240 + len * t} rx={9} ry={5} transform={`rotate(${k % 2 ? 30 : -30} ${x + 2} ${240 + len * t})`} fill="#4f8a44" />
                ))}
              </g>
            );
          })}
        </g>

        {/* screen light washing in from frame-left */}
        <Soft d="M -100 300 L 700 360 L 900 1000 L -100 1000 Z" fill="#7fa6e0" o={0.12} blur={70} blend="screen" />
        {/* haze in the lamp light */}
        <Soft d="M 1300 100 L 1950 100 L 1950 900 L 1500 900 Z" fill="#ffb366" o={0.12} blur={70} blend="screen" />

        <rect width={W} height={H} fill="#10263a" opacity={0.15} style={{mixBlendMode: 'soft-light'}} />
        <rect width={W} height={H} filter="url(#ctPaper)" opacity={0.12} style={{mixBlendMode: 'overlay'}} />
        <rect width={W} height={H} fill="url(#ctVig)" />
      </svg>
      <Letterbox />
    </AbsoluteFill>
  );
};
