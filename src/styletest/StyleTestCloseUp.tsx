import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BlurDefs, RoomBack, Soft} from './Room';
import {KlausVarunBust} from './KlausVarun';
import {Letterbox} from '../fx/Letterbox';
import {mulberry32} from '../utils/seededRandom';

const W = 1920;
const H = 1080;

/** Style test 2: close-up of Varun at the screen, Klaus-style. */
export const StyleTestCloseUp: React.FC = () => {
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
          <g transform="translate(1180 470) scale(1.45)">
            <KlausVarunBust />
          </g>
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
