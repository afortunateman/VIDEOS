import React from 'react';
import {Soft} from './Room';

/**
 * Varun in an anime (Ghibli-like) style with Klaus-like light on top:
 * thin warm-brown line art, flat cel shading with hard shadow edges, then a soft
 * rim glow and haze. Local space: head centre at the origin, head ~310 units tall,
 * three-quarter view facing frame-left.
 */

const LINE = '#3a1d12';
const SKIN = '#d79b70';
const SKIN_SH = '#9a5a3c';
const SKIN_SH2 = '#7a4029';
const HAIR = '#1f1714';
const HAIR_SH = '#0d0908';

const FACE =
  'M -20 -150 C 60 -156 112 -110 116 -40 C 118 10 108 50 92 80 C 70 116 34 146 -6 158 ' +
  'C -24 160 -38 150 -48 136 C -62 114 -74 84 -80 52 C -84 32 -88 20 -92 6 ' +
  'C -98 -24 -96 -72 -84 -104 C -70 -136 -50 -150 -20 -150 Z';
const NECK = 'M -40 120 C -40 160 -44 196 -52 226 L 66 226 C 58 190 56 150 62 100 C 40 130 0 150 -40 120 Z';
const EAR = 'M 108 -22 C 132 -32 146 -6 140 18 C 136 42 120 50 104 42 C 108 22 110 0 108 -22 Z';

const HAIR_BACK =
  'M -108 -40 C -122 -120 -66 -196 14 -200 C 96 -204 152 -150 154 -76 C 156 -36 146 0 132 30 ' +
  'L 124 2 C 120 -40 104 -76 76 -92 L -80 -92 C -96 -76 -104 -60 -108 -40 Z';
// Bangs: sharp clumps falling over the forehead, swept toward frame-left.
const BANGS = [
  'M 88 -120 C 80 -96 70 -76 54 -58 C 58 -80 56 -96 48 -110 Z',
  'M 56 -128 C 50 -98 36 -70 14 -46 C 22 -74 22 -98 14 -118 Z',
  'M 22 -134 C 10 -100 -10 -70 -38 -50 C -24 -78 -18 -104 -22 -126 Z',
  'M -14 -138 C -30 -104 -56 -78 -90 -62 C -70 -88 -60 -112 -60 -132 Z',
  'M -48 -132 C -70 -112 -92 -98 -112 -94 C -96 -112 -84 -128 -76 -146 Z',
];
const SIDE_LOCKS = [
  'M 124 -60 C 138 -30 144 6 138 40 C 132 14 124 -10 112 -30 Z',
  'M 150 -110 C 172 -96 184 -72 186 -44 C 172 -64 158 -76 140 -84 Z',
];

const AnimeEye: React.FC<{cx: number; cy: number; w: number; h: number; far?: boolean; lookX: number; lookY: number; id: string}> = ({
  cx,
  cy,
  w,
  h,
  far,
  lookX,
  lookY,
  id,
}) => {
  const top = `M ${cx - w} ${cy + h * 0.1} C ${cx - w * 0.6} ${cy - h * 0.75} ${cx + w * 0.5} ${cy - h * 0.8} ${cx + w} ${cy - h * 0.25}`;
  const white = `${top} C ${cx + w * 0.8} ${cy + h * 0.45} ${cx - w * 0.4} ${cy + h * 0.65} ${cx - w} ${cy + h * 0.1} Z`;
  const ix = cx + lookX * w * 0.35;
  const iy = cy + lookY * h * 0.12;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={white} />
        </clipPath>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c0e09" />
          <stop offset="0.55" stopColor="#4a2617" />
          <stop offset="1" stopColor="#a8693f" />
        </linearGradient>
      </defs>
      <path d={white} fill="#f6efe6" />
      <g clipPath={`url(#${id})`}>
        {/* the upper lid casts a shadow across the white */}
        <path d={`${top} L ${cx + w} ${cy - h} L ${cx - w} ${cy - h} Z`} fill="#c9b3a6" transform={`translate(0 ${h * 0.28})`} />
        <ellipse cx={ix} cy={iy} rx={w * (far ? 0.42 : 0.5)} ry={h * 0.72} fill={`url(#${id}i)`} />
        <ellipse cx={ix} cy={iy - h * 0.05} rx={w * 0.2} ry={h * 0.3} fill="#0b0504" />
        <ellipse cx={ix} cy={iy - h * 0.25} rx={w * (far ? 0.42 : 0.5)} ry={h * 0.3} fill="#0b0504" opacity={0.45} />
        {/* catchlights: the screen, and a small warm one from the lamp */}
        <ellipse cx={ix + w * 0.18} cy={iy - h * 0.28} rx={w * 0.16} ry={h * 0.14} fill="#ffffff" />
        <circle cx={ix - w * 0.2} cy={iy + h * 0.28} r={w * 0.07} fill="#ffe2b8" opacity={0.9} />
      </g>
      {/* thick upper lash line with a flick at the outer corner */}
      <path d={top} stroke="#1a0d08" strokeWidth={far ? 5 : 6.5} fill="none" strokeLinecap="round" />
      <path d={`M ${cx + w * 0.92} ${cy - h * 0.3} L ${cx + w * 1.18} ${cy - h * 0.12}`} stroke="#1a0d08" strokeWidth={far ? 3 : 4} strokeLinecap="round" />
      {/* lower lid: a short light stroke */}
      <path d={`M ${cx - w * 0.2} ${cy + h * 0.6} Q ${cx + w * 0.3} ${cy + h * 0.55} ${cx + w * 0.7} ${cy + h * 0.32}`} stroke={LINE} strokeWidth={1.8} fill="none" opacity={0.7} strokeLinecap="round" />
      {/* double-lid crease */}
      <path d={`M ${cx - w * 0.6} ${cy - h * 0.85} C ${cx - w * 0.2} ${cy - h * 1.15} ${cx + w * 0.5} ${cy - h * 1.1} ${cx + w * 0.85} ${cy - h * 0.6}`} stroke={SKIN_SH2} strokeWidth={1.6} fill="none" opacity={0.7} />
    </g>
  );
};

export const AnimeVarunBust: React.FC<{lookX?: number; lookY?: number}> = ({lookX = -0.8, lookY = 0.6}) => (
  <g strokeLinejoin="round">
    <defs>
      <clipPath id="avFace">
        <path d={FACE} />
      </clipPath>
      <clipPath id="avNeck">
        <path d={NECK} />
      </clipPath>
      <clipPath id="avShirt">
        <path d="M -230 400 C -214 262 -150 196 -52 178 L -40 176 L -18 260 L 0 290 L 30 270 L 64 172 L 92 174 C 196 192 256 262 272 400 Z" />
      </clipPath>
      <clipPath id="avHair">
        <path d={HAIR_BACK} />
        {[...BANGS, ...SIDE_LOCKS].map((d, i) => (
          <path key={i} d={d} />
        ))}
      </clipPath>
    </defs>

    {/* ---------- neck ---------- */}
    <path d={NECK} fill={SKIN} />
    <g clipPath="url(#avNeck)">
      <path d="M -60 90 L 80 90 L 80 150 C 40 170 -10 176 -60 180 Z" fill={SKIN_SH} />
      <path d="M -60 120 L -20 120 L -26 240 L -60 240 Z" fill={SKIN_SH} />
    </g>
    <path d={NECK} fill="none" stroke={LINE} strokeWidth={2.4} />

    {/* skin in the open collar */}
    <path d="M -40 170 L 64 166 L 30 270 L 0 290 L -18 260 Z" fill={SKIN_SH} />
    {/* ---------- shirt ---------- */}
    <path d="M -230 400 C -214 262 -150 196 -52 178 L -40 176 L -18 260 L 0 290 L 30 270 L 64 172 L 92 174 C 196 192 256 262 272 400 Z" fill="#dfe3ea" />
    <g clipPath="url(#avShirt)">
      {/* cel shadow: the side away from the lamp */}
      <path d="M -260 160 L 10 160 C -10 220 -20 300 -6 420 L -260 420 Z" fill="#8f9ab3" />
      <path d="M -150 280 C -130 320 -126 370 -130 420 L -160 420 C -152 370 -150 320 -170 290 Z" fill="#6f7a96" />
      <path d="M 150 250 C 170 300 176 350 172 420 L 150 420 C 156 350 150 300 130 262 Z" fill="#b9b1aa" />
      <Soft d="M 120 190 C 220 210 270 270 290 420 L 190 420 C 186 320 160 250 100 214 Z" fill="#ffcf98" o={0.5} blur={20} blend="screen" />
    </g>
    <path d="M -230 400 C -214 262 -150 196 -52 178 M 92 174 C 196 192 256 262 272 400" stroke={LINE} strokeWidth={3} fill="none" />
    {/* collar */}
    <path d="M -62 164 C -80 186 -94 214 -90 240 L -12 282 L 2 200 Z" fill="#eef0f4" stroke={LINE} strokeWidth={2.6} />
    <path d="M -62 164 C -70 182 -76 196 -76 208 L -8 250 L 2 200 Z" fill="#9ca7bf" />
    <path d="M 84 160 C 108 184 120 212 116 236 L 34 282 L 26 200 Z" fill="#f4ede4" stroke={LINE} strokeWidth={2.6} />
    <path d="M 2 200 L -12 282 M 26 200 L 34 282" stroke={LINE} strokeWidth={2} />

    {/* ---------- ear ---------- */}
    <path d={EAR} fill={SKIN} stroke={LINE} strokeWidth={2.6} />
    <path d="M 116 -10 C 130 -14 134 6 128 22 C 124 30 118 32 114 28" stroke={SKIN_SH2} strokeWidth={3} fill="none" strokeLinecap="round" />
    <Soft d="M 122 -24 C 146 -26 150 10 140 36 L 134 36 C 140 10 136 -12 122 -18 Z" fill="#ffc37f" o={0.6} blur={4} blend="screen" />

    {/* ---------- face: flat base, hard cel shadow, soft light on top ---------- */}
    <path d={FACE} fill={SKIN} />
    <g clipPath="url(#avFace)">
      {/* cel shadow on the far side, hard-edged */}
      <path d="M -140 -200 L -40 -200 C -46 -120 -60 -40 -52 20 C -46 70 -30 110 -6 160 L -140 200 Z" fill={SKIN_SH} />
      {/* shadow cast by the bangs onto the forehead */}
      <path d="M -120 -110 C -90 -84 -66 -58 -40 -44 C -26 -66 -8 -60 14 -40 C 26 -60 40 -66 54 -52 C 70 -72 84 -86 100 -100 L 100 -200 L -120 -200 Z" fill={SKIN_SH} />
      {/* under the chin and jaw */}
      <path d="M -60 130 C -20 150 30 140 70 104 L 120 200 L -60 200 Z" fill={SKIN_SH2} opacity={0.6} />
      {/* blush on the near cheek, a hatched anime blush */}
      <Soft d="M 20 46 C 40 36 74 40 86 56 C 72 76 36 76 20 62 Z" fill="#e9705a" o={0.35} blur={8} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={36 + i * 12} y1={60} x2={44 + i * 12} y2={48} stroke="#c9503e" strokeWidth={1.6} opacity={0.5} strokeLinecap="round" />
      ))}
      {/* Klaus-style: soft warm key wrapping the near cheek, cool screen lift on the far side */}
      <Soft d="M 40 -120 C 100 -110 124 -40 118 20 C 112 70 88 100 60 110 C 50 50 30 -40 40 -120 Z" fill="#ffd2a0" o={0.35} blur={20} blend="screen" />
      <Soft d="M -120 -40 C -100 0 -90 60 -70 130 L -130 130 Z" fill="#7fa0dc" o={0.4} blur={14} blend="screen" />
      <path d="M -20 -150 C 60 -156 112 -110 116 -40 C 118 10 108 50 92 80" stroke="#ffd59a" strokeWidth={9} fill="none" opacity={0.6} filter="url(#stBlur4)" />
    </g>
    <path d={FACE} fill="none" stroke={LINE} strokeWidth={2.8} />

    {/* ---------- features ---------- */}
    <AnimeEye id="avEyeFar" cx={-62} cy={-6} w={17} h={22} far lookX={lookX} lookY={lookY} />
    <AnimeEye id="avEyeNear" cx={18} cy={-6} w={27} h={26} lookX={lookX} lookY={lookY} />
    <path d="M -84 -46 Q -70 -54 -52 -50" stroke="#2a1610" strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M -14 -56 Q 14 -66 44 -54" stroke="#2a1610" strokeWidth={4.5} fill="none" strokeLinecap="round" />
    {/* nose: a small hooked line and a hard little shadow */}
    <path d="M -34 34 C -40 44 -46 52 -40 56" stroke={LINE} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    <path d="M -38 56 L -26 58 L -32 50 Z" fill={SKIN_SH} />
    {/* mouth */}
    <path d="M -46 97 C -36 98 -24 98 -12 97" stroke={LINE} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    <path d="M -38 106 C -32 108 -26 108 -22 106" stroke={SKIN_SH2} strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.7} />

    {/* ---------- hair: clumps, cel shadow, a sharp shine band ---------- */}
    <path d={HAIR_BACK} fill={HAIR} />
    {SIDE_LOCKS.map((d, i) => (
      <path key={`s${i}`} d={d} fill={HAIR} />
    ))}
    {BANGS.map((d, i) => (
      <path key={`b${i}`} d={d} fill={HAIR} />
    ))}
    <g clipPath="url(#avHair)">
      {/* cel shadow on the far side and under the bangs */}
      <path d="M -140 -220 L -20 -220 C -40 -170 -60 -140 -70 -100 L -140 -40 Z" fill={HAIR_SH} />
      <path d="M -120 -100 C -60 -110 20 -110 100 -100 L 100 -40 L -120 -40 Z" fill={HAIR_SH} opacity={0.6} />
      {/* the anime shine: a crisp arc broken by the clumps */}
      {[
        'M -64 -150 C -54 -160 -40 -166 -26 -168 L -30 -158 C -42 -156 -54 -152 -64 -150 Z',
        'M -14 -170 C 4 -174 22 -174 40 -170 L 34 -160 C 18 -163 2 -163 -12 -160 Z',
        'M 54 -166 C 68 -162 80 -156 90 -148 L 80 -142 C 72 -148 62 -152 50 -156 Z',
      ].map((d, i) => (
        <path key={i} d={d} fill="#5b4c58" />
      ))}
      {/* warm lamp rim on the back of the hair, soft (the Klaus part) */}
      <path d="M 14 -200 C 96 -204 152 -150 154 -76 C 156 -36 146 0 132 30" stroke="#ffb873" strokeWidth={12} fill="none" opacity={0.55} filter="url(#stBlur6)" />
      <Soft d="M -140 -120 C -120 -180 -60 -210 0 -214 L -10 -190 C -60 -180 -100 -150 -116 -100 Z" fill="#5a78b0" o={0.45} blur={10} blend="screen" />
    </g>
    {/* line art around the hair mass */}
    <path d={HAIR_BACK} fill="none" stroke="#0a0605" strokeWidth={2.6} />
    {[...BANGS, ...SIDE_LOCKS].map((d, i) => (
      <path key={`l${i}`} d={d} fill="none" stroke="#0a0605" strokeWidth={2.2} />
    ))}
  </g>
);
