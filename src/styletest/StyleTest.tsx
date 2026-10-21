import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Atmosphere, BlurDefs, RoomBack} from './Room';
import {Chair, DeskBody, DeskProps, Lamp} from './Desk';
import {VarunStyle} from './Varun';
import {Letterbox} from '../fx/Letterbox';

const W = 1920;
const H = 1080;
// Medium shot, a touch tighter than S1's.
const CAM = {x: 1010, y: 545, zoom: 1.08};

/** Style test: one still of the S1 medium shot in the proposed new look. */
export const StyleTest: React.FC = () => (
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
          <VarunStyle lift={0.55} />
          <DeskBody />
          <DeskProps />
          <Lamp />
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
