import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FaceState, VarunFaceProfile, VarunFaceThreeQuarter} from './characters/VarunFace';
import {ForearmOnDesk, HandSideTap} from './characters/Hands';
import {TypingHands} from './characters/TypingHands';
import {HAND_GOD} from './characters/Hands';
import {SnowGlobe} from './props/SnowGlobe';

const STATES: FaceState[] = ['neutral', 'blank', 'smirk', 'angry', 'sad', 'shocked'];
const NONE = {L5: 0, L4: 0, L3: 0, L2: 0, R2: 0, R3: 0, R4: 0, R5: 0, RT: 0};

/** Reference sheet: the shared face in every state, hand poses, and the globe. */
export const TestSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#2B3A4D'}}>
    <svg width={1920} height={1080}>
      {STATES.map((s, i) => (
        <g key={`p${s}`} transform={`translate(${150 + i * 240} 150) scale(0.75)`}>
          <VarunFaceProfile state={s} />
          <text x={-40} y={175} fill="#fff" fontSize={26} fontFamily="Inter">{s}</text>
        </g>
      ))}
      {STATES.map((s, i) => (
        <g key={`q${s}`} transform={`translate(${150 + i * 240} 430) scale(0.75)`}>
          <VarunFaceThreeQuarter state={s} />
        </g>
      ))}
      <rect x={0} y={760} width={1920} height={320} fill="#5B3A24" />
      <g transform="translate(220 760) scale(2.2)">
        <ForearmOnDesk length={60} showSleeve={false} />
        <HandSideTap lift={0} />
      </g>
      <g transform="translate(620 760) scale(2.2)">
        <ForearmOnDesk length={60} showSleeve={false} />
        <HandSideTap lift={1} />
      </g>
      <g transform="translate(1180 860) scale(1.2)">
        <TypingHands presses={{...NONE, L3: 1, R2: 0.5}} palette={HAND_GOD} t={0} gap={130} />
      </g>
      <g transform="translate(1680 560)">
        <SnowGlobe r={90} shine={0.8} t={1} />
      </g>
    </svg>
  </AbsoluteFill>
);
