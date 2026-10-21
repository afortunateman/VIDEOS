import React from 'react';
import {Soft} from './Room';

/**
 * Varun redesigned in a Klaus-like style: big bean-shaped head, bulb nose, big
 * white eyes with small pupils, thin high brows, small mouth, big ears, a small
 * body. Lit volumetrically: warm lamp key from the right, cold screen fill from
 * the front-left, a red-orange band where light turns to shadow.
 *
 * Local space: head centre at the origin, head ~340 units tall. Faces frame-left.
 */

const FACE =
  'M -10 -150 C 70 -152 118 -110 122 -40 C 126 20 110 80 80 118 C 56 146 20 160 -14 158 ' +
  'C -46 156 -70 136 -84 104 C -96 76 -100 40 -98 10 C -104 -20 -102 -60 -92 -96 C -76 -136 -44 -150 -10 -150 Z';
const NECK = 'M -40 130 C -38 170 -42 210 -50 250 L 76 250 C 66 210 62 170 64 110 C 40 140 0 150 -40 130 Z';
const NOSE =
  'M -30 -6 C -44 8 -74 20 -88 38 C -98 54 -88 74 -66 72 C -56 72 -50 68 -44 64 C -36 66 -26 62 -24 54 C -22 44 -28 34 -30 24 Z';
const EAR = 'M 114 -26 C 144 -40 162 -6 156 24 C 150 54 130 62 112 50 C 118 30 120 0 114 -26 Z';
const HAIR =
  'M -106 -66 C -114 -132 -62 -196 12 -198 C 84 -200 146 -154 150 -84 C 154 -40 144 -8 132 12 L 118 -18 ' +
  'C 112 -50 98 -76 72 -88 C 42 -98 12 -92 -14 -82 C -42 -98 -72 -98 -92 -78 Z';
const LOCKS = [
  // a soft, swept-back volume on top
  'M -60 -186 C -20 -222 60 -226 120 -196 C 80 -202 30 -200 -10 -186 Z',
  'M 100 -176 C 140 -170 166 -144 172 -110 C 154 -132 132 -146 110 -152 Z',
  // fringe falling over the forehead toward the far side
  'M -6 -92 C -40 -88 -72 -70 -92 -44 C -84 -74 -56 -98 -20 -106 Z',
  'M 30 -96 C 10 -82 -10 -72 -32 -66 C -14 -86 6 -100 26 -108 Z',
];

const SKIN_BASE = '#b8744a';

const Eye: React.FC<{cx: number; cy: number; rx: number; ry: number; lookX: number; lookY: number; lid: number; id: string}> = ({
  cx,
  cy,
  rx,
  ry,
  lookX,
  lookY,
  lid,
  id,
}) => {
  const lidY = cy - ry + ry * 2 * lid;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <radialGradient id={`${id}g`} cx="0.6" cy="0.65" r="0.75">
          <stop offset="0" stopColor="#fbf6ee" />
          <stop offset="0.7" stopColor="#e6ddd2" />
          <stop offset="1" stopColor="#b9a99c" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx + lookX * rx * 0.45} cy={cy + lookY * ry * 0.4} r={rx * 0.34} fill="#120c0a" />
        <circle cx={cx + lookX * rx * 0.45 + rx * 0.12} cy={cy + lookY * ry * 0.4 - rx * 0.12} r={rx * 0.1} fill="#fff" />
        <circle cx={cx + lookX * rx * 0.45 - rx * 0.14} cy={cy + lookY * ry * 0.4 + rx * 0.12} r={rx * 0.05} fill="#cfe2ff" opacity={0.8} />
        {/* shadow of the lid on the eyeball */}
        <Soft d={`M ${cx - rx * 1.2} ${lidY - 2} L ${cx + rx * 1.2} ${lidY - 2} L ${cx + rx * 1.2} ${lidY + ry * 0.5} L ${cx - rx * 1.2} ${lidY + ry * 0.5} Z`} fill="#6a4a3a" o={0.45} blur={4} />
        {/* the lid itself: skin covering the top of the eye */}
        <rect x={cx - rx * 1.2} y={cy - ry * 1.3} width={rx * 2.4} height={lidY - (cy - ry * 1.3)} fill="#9a5a36" />
        <Soft d={`M ${cx - rx * 1.2} ${cy - ry * 1.3} L ${cx + rx * 1.2} ${cy - ry * 1.3} L ${cx + rx * 1.2} ${lidY} L ${cx - rx * 1.2} ${lidY} Z`} fill="#7a4026" o={0.35} blur={4} />
      </g>
      {/* lash line along the lid edge */}
      <path
        d={`M ${cx - rx * 1.02} ${Math.max(cy - ry * 0.2, lidY + 1)} Q ${cx} ${lidY - 2} ${cx + rx * 1.02} ${Math.max(cy - ry * 0.2, lidY + 1)}`}
        stroke="#1a0f0b"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#5a2f1c" strokeWidth={1.4} opacity={0.5} />
    </g>
  );
};

export const KlausVarunBust: React.FC<{lookX?: number; lookY?: number; lid?: number}> = ({lookX = -0.7, lookY = 0.75, lid = 0.22}) => (
  <g>
    <defs>
      <clipPath id="kvFace">
        <path d={FACE} />
      </clipPath>
      <clipPath id="kvNeck">
        <path d={NECK} />
      </clipPath>
      <clipPath id="kvNose">
        <path d={NOSE} />
      </clipPath>
      <clipPath id="kvHair">
        <path d={HAIR} />
        {LOCKS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </clipPath>
      <clipPath id="kvShirt">
        <path d="M -220 400 C -206 270 -150 196 -56 176 L 96 172 C 196 190 252 266 268 400 Z" />
      </clipPath>
      <radialGradient id="kvHairG" cx="0.75" cy="0.2" r="0.9">
        <stop offset="0" stopColor="#2a1810" />
        <stop offset="0.45" stopColor="#120c0a" />
        <stop offset="1" stopColor="#0c0807" />
      </radialGradient>
      <radialGradient id="kvSkin" cx="0.68" cy="0.42" r="0.75">
        <stop offset="0" stopColor="#e09a64" />
        <stop offset="0.5" stopColor={SKIN_BASE} />
        <stop offset="1" stopColor="#6e3a24" />
      </radialGradient>
    </defs>

    {/* ---- shirt: small shoulders, soft folds ---- */}
    <path d="M -220 400 C -206 270 -150 196 -56 176 L 96 172 C 196 190 252 266 268 400 Z" fill="#8e98ac" />
    <g clipPath="url(#kvShirt)">
      <Soft d="M -280 200 L -40 200 C -60 280 -40 360 -20 440 L -280 440 Z" fill="#2a3448" o={0.75} blur={24} />
      <Soft d="M 120 210 C 220 230 300 300 320 440 L 200 440 C 190 340 160 270 100 230 Z" fill="#ffd6a0" o={0.55} blur={20} blend="screen" />
      <path d="M -150 300 C -120 340 -110 390 -112 440" stroke="#2a3448" strokeWidth={10} fill="none" opacity={0.45} filter="url(#stBlur4)" />
      <path d="M 170 290 C 150 330 146 380 152 440" stroke="#5a4a4a" strokeWidth={8} fill="none" opacity={0.35} filter="url(#stBlur4)" />
      <path d="M -220 400 C -206 270 -150 196 -56 176" stroke="#8fb0e0" strokeWidth={8} fill="none" opacity={0.5} filter="url(#stBlur4)" />
    </g>

    {/* ---- neck ---- */}
    <path d={NECK} fill="#8a4c2c" />
    <g clipPath="url(#kvNeck)">
      <Soft d="M -60 100 L 80 100 C 60 150 40 170 -60 190 Z" fill="#3a1e12" o={0.75} blur={12} />
      <Soft d="M 40 160 L 80 160 L 80 260 L 50 260 Z" fill="#ffb878" o={0.5} blur={10} blend="screen" />
    </g>
    {/* open collar */}
    <Soft d="M -70 200 L 120 200 L 40 300 L -20 300 Z" fill="#000" o={0.45} blur={8} />
    <path d="M -64 160 C -82 182 -96 210 -92 236 L -14 276 L 0 196 Z" fill="#9aa6bc" />
    <path d="M -64 160 C -70 176 -74 190 -72 200 L -6 236 L 0 196 Z" fill="#c9d4e8" opacity={0.7} />
    <path d="M 86 156 C 112 180 124 208 120 232 L 34 276 L 26 196 Z" fill="#cdb79e" />
    <path d="M 86 156 C 104 172 114 190 116 206 L 40 236 L 26 196 Z" fill="#f0d7b6" opacity={0.7} />
    <path d="M -64 160 C -82 182 -96 210 -92 236" stroke="#8fb0e0" strokeWidth={3} fill="none" opacity={0.6} />
    <path d="M 0 196 L -14 276 M 26 196 L 34 276" stroke="#4a4a58" strokeWidth={2.5} opacity={0.6} />

    {/* ---- ear (near side, catching the lamp) ---- */}
    <path d={EAR} fill="#c47a4a" />
    <path d="M 122 -12 C 142 -18 148 4 142 24 C 138 38 128 40 122 34" stroke="#7a3a20" strokeWidth={5} fill="none" strokeLinecap="round" />
    <Soft d="M 130 -30 C 160 -30 166 10 156 40 L 146 40 C 150 10 146 -14 130 -22 Z" fill="#ffb070" o={0.7} blur={4} blend="screen" />
    <Soft d="M 116 -20 C 136 -10 140 20 130 46 C 120 30 118 0 116 -20 Z" fill="#e24a2a" o={0.35} blur={4} />

    {/* ---- face ---- */}
    <path d={FACE} fill="url(#kvSkin)" />
    <g clipPath="url(#kvFace)">
      {/* far side turns away from the lamp: cool shadow, lifted by the screen */}
      <Soft d="M -140 -200 L -20 -200 C -40 -100 -46 0 -30 80 C -20 120 10 160 30 200 L -140 200 Z" fill="#2c2238" o={0.62} blur={22} />
      <Soft d="M -130 -60 C -110 -20 -100 40 -80 120 L -120 120 Z" fill="#7f9cd0" o={0.45} blur={14} blend="screen" />
      {/* terminator: the warm red band where light becomes shadow */}
      <path d="M -6 -150 C -34 -80 -40 0 -24 70 C -14 110 10 150 26 170" stroke="#d8452a" strokeWidth={26} fill="none" opacity={0.28} filter="url(#stBlur10)" />
      {/* key light on the near cheek and forehead */}
      <Soft d="M 40 -130 C 100 -120 126 -60 120 0 C 114 60 90 100 60 110 C 40 60 30 -40 40 -130 Z" fill="#ffc890" o={0.5} blur={20} blend="screen" />
      <Soft d="M 20 -140 C 60 -146 90 -130 100 -110 C 70 -110 40 -112 20 -120 Z" fill="#ffe2b8" o={0.5} blur={10} blend="screen" />
      {/* the hair casts a soft shadow across the forehead */}
      <Soft d="M -110 -96 C -60 -110 20 -100 80 -88 C 100 -84 120 -60 130 -40 L 130 -70 C 110 -96 60 -110 0 -112 C -50 -114 -90 -110 -110 -110 Z" fill="#3a1e14" o={0.65} blur={8} />
      {/* eye sockets, cheek blush, chin shadow */}
      <Soft d="M -84 -30 C -70 -40 -44 -40 -32 -26 C -40 -6 -72 -4 -84 -16 Z" fill="#4a2618" o={0.35} blur={6} />
      <Soft d="M -24 -36 C -8 -46 24 -46 36 -30 C 30 -8 -12 -6 -24 -20 Z" fill="#5a2c1a" o={0.3} blur={6} />
      <Soft d="M 10 40 C 30 30 70 34 84 52 C 70 76 30 76 10 60 Z" fill="#e2603e" o={0.32} blur={12} />
      <Soft d="M -60 128 C -30 146 20 150 50 136 L 50 170 L -60 170 Z" fill="#3a1e12" o={0.45} blur={10} />
      {/* rim: lamp light wrapping the near edge */}
      <path d="M -10 -150 C 70 -152 118 -110 122 -40 C 126 20 110 80 80 118 C 56 146 20 160 -14 158" stroke="#ffd59a" strokeWidth={10} fill="none" opacity={0.75} filter="url(#stBlur4)" />
      {/* rim: screen light on the far edge */}
      <path d="M -84 104 C -96 76 -100 40 -98 10 C -104 -20 -102 -60 -92 -96" stroke="#b9d2ff" strokeWidth={8} fill="none" opacity={0.6} filter="url(#stBlur4)" />
    </g>

    {/* ---- eyes, brows ---- */}
    <Eye id="kvEyeFar" cx={-60} cy={-8} rx={15} ry={22} lookX={lookX} lookY={lookY} lid={lid} />
    <Eye id="kvEyeNear" cx={2} cy={-10} rx={22} ry={27} lookX={lookX} lookY={lookY} lid={lid} />
    <path d="M -80 -52 Q -64 -64 -44 -56" stroke="#1a100c" strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M -22 -62 Q 4 -74 30 -60" stroke="#1a100c" strokeWidth={4.5} fill="none" strokeLinecap="round" />

    {/* ---- nose: the big bulb, sitting proud of the face ---- */}
    <Soft d="M -30 50 C -10 66 10 70 20 62 C 0 80 -26 80 -40 66 Z" fill="#3a1e12" o={0.5} blur={6} />
    <path d={NOSE} fill="#c27a50" />
    <g clipPath="url(#kvNose)">
      <Soft d="M -120 0 L -60 0 C -64 30 -70 60 -60 90 L -120 90 Z" fill="#2c2238" o={0.5} blur={10} />
      <Soft d="M -76 36 C -66 30 -54 34 -50 44 C -58 52 -70 50 -76 36 Z" fill="#ffd7b0" o={0.7} blur={4} blend="screen" />
      <Soft d="M -94 40 C -84 30 -70 34 -66 50 C -70 66 -88 66 -94 40 Z" fill="#e8604a" o={0.35} blur={6} />
      <path d="M -88 38 C -98 54 -88 74 -66 72" stroke="#b9d2ff" strokeWidth={4} fill="none" opacity={0.6} filter="url(#stBlur2)" />
    </g>
    <path d="M -62 66 C -56 70 -50 68 -46 64" stroke="#3a160c" strokeWidth={3} fill="none" strokeLinecap="round" />

    {/* ---- mouth: small, closed, unimpressed ---- */}
    <path d="M -58 104 C -48 101 -36 101 -26 104" stroke="#3a160c" strokeWidth={3.4} fill="none" strokeLinecap="round" />
    <Soft d="M -54 110 C -46 116 -36 116 -28 110 C -36 114 -46 114 -54 110 Z" fill="#7a3a24" o={0.6} blur={2} />

    {/* ---- hair: a dark mass with chunky locks ---- */}
    <path d={HAIR} fill="url(#kvHairG)" />
    {LOCKS.map((d, i) => (
      <path key={i} d={d} fill="url(#kvHairG)" />
    ))}
    <g clipPath="url(#kvHair)">
      <Soft d="M 60 -230 C 140 -220 200 -150 200 -60 L 150 -60 C 150 -130 110 -180 50 -200 Z" fill="#a8653a" o={0.55} blur={14} blend="screen" />
      <Soft d="M -130 -100 C -110 -170 -60 -210 0 -214 L 0 -190 C -50 -180 -96 -140 -110 -80 Z" fill="#4b6496" o={0.5} blur={12} blend="screen" />
      {/* lock separations and sheen bands that follow the hair's flow */}
      {[
        'M -90 -100 C -60 -160 0 -190 70 -186',
        'M -60 -80 C -30 -140 30 -170 100 -160',
        'M -20 -84 C 10 -130 60 -150 130 -130',
        'M 30 -90 C 60 -120 110 -126 146 -100',
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#050303" strokeWidth={7} fill="none" opacity={0.55} filter="url(#stBlur4)" />
          <path d={d} stroke={i > 1 ? '#c27a44' : '#5a74a6'} strokeWidth={4} fill="none" opacity={0.35} transform="translate(0 -7)" filter="url(#stBlur4)" />
        </g>
      ))}
      {/* warm rim where the lamp grazes the back of the hair */}
      <path d="M 12 -198 C 84 -200 146 -154 150 -84 C 154 -40 144 -8 132 12" stroke="#ffbe7a" strokeWidth={10} fill="none" opacity={0.6} filter="url(#stBlur6)" />
    </g>
  </g>
);
