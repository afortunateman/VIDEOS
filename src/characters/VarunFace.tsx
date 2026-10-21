import React from 'react';

/**
 * The one face both Varuns share. Globe Varun and god Varun pass different
 * palettes (lighting, world) but the geometry here is identical, so they read
 * as the same person.
 *
 * Local space: head roughly 200 units tall, origin near the centre of the skull.
 */

export type FaceState = 'neutral' | 'angry' | 'sad' | 'smirk' | 'shocked' | 'blank';

export type FacePalette = {
  skin: string;
  skinShade: string;
  hair: string;
  hairShine: string;
  lip: string;
  eye: string;
  eyeWhite: string;
  brow: string;
};

export const FACE_GOD: FacePalette = {
  skin: '#8A5A3E',
  skinShade: '#5E3B29',
  hair: '#120E0D',
  hairShine: '#3A3236',
  lip: '#6B3C2E',
  eye: '#0E0A09',
  eyeWhite: '#D9D2CC',
  brow: '#140F0E',
};

export type FaceProps = {
  state?: FaceState;
  /** 0 = open, 1 = shut. */
  blink?: number;
  /** Eye direction, -1..1 each. */
  lookX?: number;
  lookY?: number;
  /** Extra mouth opening 0..1 (speech). */
  talk?: number;
  palette?: FacePalette;
  /** 0..1 strength of the small screen reflection in the eyes (3/4 view). */
  catchlight?: number;
};

type Expr = {brow: number; browTilt: number; lid: number; mouthCurve: number; mouthOpen: number; smirk: number};

const EXPR: Record<FaceState, Expr> = {
  neutral: {brow: 0, browTilt: 0, lid: 0.12, mouthCurve: 0, mouthOpen: 0, smirk: 0},
  blank: {brow: 0.1, browTilt: 0, lid: 0.22, mouthCurve: -0.1, mouthOpen: 0, smirk: 0},
  angry: {brow: -1, browTilt: 1, lid: 0.25, mouthCurve: -0.6, mouthOpen: 0.1, smirk: 0},
  sad: {brow: 0.4, browTilt: -1, lid: 0.3, mouthCurve: -0.7, mouthOpen: 0, smirk: 0},
  smirk: {brow: 0.15, browTilt: 0.3, lid: 0.2, mouthCurve: 0.2, mouthOpen: 0, smirk: 1},
  shocked: {brow: 1, browTilt: -0.3, lid: -0.1, mouthCurve: 0, mouthOpen: 0.7, smirk: 0},
};

// ---------------------------------------------------------------------------
// Profile (facing right)
// ---------------------------------------------------------------------------

export const PROFILE_HEAD_PATH =
  'M -62 -40 C -66 -96 -14 -122 28 -106 C 52 -98 66 -78 68 -52 C 69 -40 66 -33 70 -26 ' +
  'C 72 -21 71 -15 69 -11 C 74 0 82 10 88 19 C 91 23 89 28 84 29 C 80 30 77 29 74 31 ' +
  'C 74 34 77 37 77 40 C 76 42 73 43 71 44 C 74 46 75 49 73 53 C 71 56 66 57 66 60 ' +
  'C 67 66 69 74 64 82 C 60 89 49 92 38 90 C 22 87 8 80 -4 70 C -20 58 -40 50 -52 30 ' +
  'C -62 12 -61 -12 -62 -40 Z';

const PROFILE_NECK = 'M 26 84 C 28 110 34 140 40 172 L -44 172 C -40 140 -40 90 -46 40 C -20 62 2 80 26 84 Z';

export const VarunFaceProfile: React.FC<FaceProps> = ({
  state = 'neutral',
  blink = 0,
  lookX = 0.6,
  lookY = 0,
  talk = 0,
  palette = FACE_GOD,
}) => {
  const e = EXPR[state];
  const lid = Math.min(1, Math.max(e.lid, blink));
  const browY = -31 - e.brow * 5;
  const eyeCx = 56;
  const eyeCy = -14;
  const open = (1 - lid) * 6.5;
  const mouthOpen = Math.max(e.mouthOpen, talk) * 7;
  return (
    <g>
      {/* neck */}
      <path d={PROFILE_NECK} fill={palette.skinShade} />
      {/* head */}
      <path d={PROFILE_HEAD_PATH} fill={palette.skin} />
      {/* cheek / jaw shading */}
      <path d="M -4 70 C 8 80 22 87 38 90 C 49 92 60 89 64 82 C 56 86 44 86 34 83 C 20 79 8 74 -4 70 Z" fill={palette.skinShade} opacity={0.45} />
      <path d="M 20 10 C 30 4 44 6 52 14 C 44 12 32 12 20 18 Z" fill={palette.skinShade} opacity={0.18} />
      {/* ear */}
      <path d="M -6 -22 C 8 -26 14 -10 12 6 C 10 20 2 26 -6 22 C -14 18 -18 -18 -6 -22 Z" fill={palette.skin} />
      <path d="M -2 -14 C 6 -14 8 -2 6 8 C 4 14 0 14 -2 10" fill="none" stroke={palette.skinShade} strokeWidth={2.4} strokeLinecap="round" />
      {/* eye */}
      <g>
        <path
          d={`M ${eyeCx - 8} ${eyeCy - 1} Q ${eyeCx} ${eyeCy - open - 1.5} ${eyeCx + 8} ${eyeCy + 1} Q ${eyeCx + 1} ${eyeCy + open * 0.55 + 1} ${eyeCx - 8} ${eyeCy - 1} Z`}
          fill={palette.eyeWhite}
          opacity={open > 0.6 ? 0.8 : 0}
        />
        {open > 0.6 && (
          <ellipse
            cx={eyeCx + 3.5 + lookX * 2}
            cy={eyeCy + lookY * 1.5}
            rx={3.4}
            ry={Math.min(4, open * 0.75)}
            fill={palette.eye}
          />
        )}
        {/* upper lid line */}
        <path
          d={`M ${eyeCx - 9} ${eyeCy - 1.5} Q ${eyeCx} ${eyeCy - open - 2.5} ${eyeCx + 9} ${eyeCy + 0.5}`}
          fill="none"
          stroke={palette.eye}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        {/* lid crease */}
        <path d={`M ${eyeCx - 7} ${eyeCy - 7 + lid * 3} Q ${eyeCx + 1} ${eyeCy - 10 + lid * 3} ${eyeCx + 7} ${eyeCy - 5}`} fill="none" stroke={palette.skinShade} strokeWidth={1.4} opacity={0.6} />
      </g>
      {/* brow */}
      <path
        d={`M ${40} ${browY + 2 - e.browTilt * 2} Q ${54} ${browY - 3} ${68} ${browY + 2 + e.browTilt * 3}`}
        fill="none"
        stroke={palette.brow}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* nostril */}
      <path d="M 74 22 C 77 25 80 25 82 24" fill="none" stroke={palette.skinShade} strokeWidth={2} strokeLinecap="round" />
      {/* mouth */}
      <path
        d={`M 72 ${43 + mouthOpen * 0.3} Q 66 ${44 - e.mouthCurve * 3 + mouthOpen * 0.5} ${61 + e.smirk * 1} ${43 - e.mouthCurve * 3 - e.smirk * 2.5}`}
        fill="none"
        stroke={palette.lip}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {mouthOpen > 0.5 && <path d={`M 72 43 Q 68 ${44 + mouthOpen} 63 44 Z`} fill="#2A1512" />}
      {/* hair */}
      <path
        d="M 66 -66 C 70 -84 58 -104 34 -116 C 0 -132 -52 -118 -72 -84 C -88 -56 -84 -10 -66 26 C -60 36 -52 40 -46 40
           C -46 22 -40 4 -30 -6 C -26 -18 -18 -28 -8 -30 C 0 -32 6 -30 8 -26 L 9 -8 L 15 -10 L 16 -32
           C 24 -46 38 -56 52 -60 C 58 -62 63 -60 66 -66 Z"
        fill={palette.hair}
      />
      {/* fringe strands */}
      <path d="M 66 -66 C 72 -60 70 -52 64 -48 C 66 -54 64 -60 58 -62 Z" fill={palette.hair} />
      <path d="M 40 -110 C 10 -116 -30 -110 -54 -88" fill="none" stroke={palette.hairShine} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      <path d="M 52 -96 C 30 -104 6 -102 -14 -94" fill="none" stroke={palette.hairShine} strokeWidth={2.5} strokeLinecap="round" opacity={0.35} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Three-quarter (facing camera, turned toward frame-left)
// ---------------------------------------------------------------------------

export const TQ_HEAD_PATH =
  'M -56 -62 C -54 -100 -16 -118 14 -116 C 48 -114 70 -92 72 -56 C 74 -36 74 -14 70 6 ' +
  'C 68 30 60 52 44 70 C 30 86 12 96 -6 96 C -20 96 -32 88 -40 76 ' +
  'C -48 64 -54 50 -56 36 C -60 24 -62 12 -60 0 C -64 -8 -64 -18 -60 -26 C -60 -40 -58 -50 -56 -62 Z';

const TQ_NECK = 'M -34 70 C -34 100 -36 130 -40 160 L 62 160 C 56 130 52 100 54 60 C 40 80 0 92 -34 70 Z';

export const VarunFaceThreeQuarter: React.FC<FaceProps> = ({
  state = 'neutral',
  blink = 0,
  lookX = 0,
  lookY = 0,
  talk = 0,
  palette = FACE_GOD,
  catchlight = 0.8,
}) => {
  const e = EXPR[state];
  const lid = Math.min(1, Math.max(e.lid, blink));
  const browLift = e.brow * 5;
  const mouthOpen = Math.max(e.mouthOpen, talk) * 9;

  const eye = (cx: number, cy: number, w: number, h: number, key: string, far: boolean) => {
    const open = h * (1 - lid);
    const top = cy - open;
    const bot = cy + h * 0.55 * (1 - lid * 0.7);
    const irisX = cx + lookX * w * 0.28 - (far ? 1 : 0);
    const irisY = cy - open * 0.15 + lookY * 2;
    const clipId = `eyeclip-${key}`;
    return (
      <g key={key}>
        <defs>
          <clipPath id={clipId}>
            <path d={`M ${cx - w} ${cy} Q ${cx - w * 0.2} ${top - 2} ${cx + w} ${cy - 1} Q ${cx + w * 0.1} ${bot + 1} ${cx - w} ${cy} Z`} />
          </clipPath>
        </defs>
        {open > 0.8 && (
          <>
            <path d={`M ${cx - w} ${cy} Q ${cx - w * 0.2} ${top - 2} ${cx + w} ${cy - 1} Q ${cx + w * 0.1} ${bot + 1} ${cx - w} ${cy} Z`} fill={palette.eyeWhite} opacity={0.85} />
            <g clipPath={`url(#${clipId})`}>
              <circle cx={irisX} cy={irisY} r={w * 0.5} fill="#2A1B14" />
              <circle cx={irisX} cy={irisY} r={w * 0.26} fill={palette.eye} />
              <rect x={irisX + w * 0.08} y={irisY - w * 0.32} width={w * 0.22} height={w * 0.16} fill="#E8F1FF" opacity={catchlight} />
            </g>
          </>
        )}
        {/* upper lid */}
        <path
          d={`M ${cx - w - 1.5} ${cy + 0.5} Q ${cx - w * 0.2} ${top - 3} ${cx + w + 1.5} ${cy - 1.5}`}
          fill="none"
          stroke={palette.eye}
          strokeWidth={far ? 2.6 : 3.2}
          strokeLinecap="round"
        />
        {/* crease */}
        <path
          d={`M ${cx - w * 0.8} ${top - 5 + lid * 4} Q ${cx} ${top - 9 + lid * 4} ${cx + w * 0.9} ${cy - h * 0.9 - 2}`}
          fill="none"
          stroke={palette.skinShade}
          strokeWidth={1.6}
          opacity={0.55}
        />
        {/* lower lid hint */}
        <path d={`M ${cx - w * 0.6} ${bot + 2} Q ${cx} ${bot + 4} ${cx + w * 0.7} ${bot}`} fill="none" stroke={palette.skinShade} strokeWidth={1.3} opacity={0.4} />
      </g>
    );
  };

  return (
    <g>
      <path d={TQ_NECK} fill={palette.skinShade} />
      {/* near ear */}
      <path d="M 66 -20 C 82 -26 88 -8 84 8 C 80 24 72 30 64 24 Z" fill={palette.skin} />
      <path d="M 70 -12 C 78 -12 80 0 76 10" fill="none" stroke={palette.skinShade} strokeWidth={2.2} strokeLinecap="round" />
      <path d={TQ_HEAD_PATH} fill={palette.skin} />
      {/* planes of the face: near cheek shadow, under-jaw, temple */}
      <path d="M 70 6 C 68 30 60 52 44 70 C 40 56 42 36 50 20 C 56 10 64 4 70 6 Z" fill={palette.skinShade} opacity={0.16} />
      <path d="M -56 36 C -50 50 -44 62 -40 76 C -36 66 -40 50 -46 40 Z" fill={palette.skinShade} opacity={0.3} />
      {/* cheekbone under the near eye, temple */}
      <path d="M -58 -40 C -54 -30 -52 -20 -54 -10 C -58 -18 -60 -30 -58 -40 Z" fill={palette.skinShade} opacity={0.3} />
      {/* eye sockets */}
      <ellipse cx={-30} cy={-12} rx={16} ry={9} fill={palette.skinShade} opacity={0.22} />
      <ellipse cx={22} cy={-12} rx={20} ry={10} fill={palette.skinShade} opacity={0.22} />
      {eye(-30, -10, 12, 6.5, 'far', true)}
      {eye(22, -10, 15.5, 7, 'near', false)}
      {/* brows */}
      <path
        d={`M ${-46} ${-26 - browLift + e.browTilt * 2} Q ${-34} ${-34 - browLift} ${-18} ${-29 - browLift + e.browTilt * 3}`}
        fill="none"
        stroke={palette.brow}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d={`M ${6} ${-30 - browLift + e.browTilt * 3} Q ${24} ${-38 - browLift} ${42} ${-30 - browLift - e.browTilt * 1}`}
        fill="none"
        stroke={palette.brow}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* nose: bridge shadow on the near side, tip, nostrils */}
      <path d="M -6 -16 C -6 0 -10 14 -16 26 C -10 30 -2 30 4 27 C 2 22 -2 18 -2 14 C 0 2 -2 -8 -6 -16 Z" fill={palette.skinShade} opacity={0.32} />
      <path d="M -24 30 C -18 36 -8 36 0 32" fill="none" stroke={palette.skinShade} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M -20 31 C -18 33 -15 33 -13 32" fill="none" stroke={palette.eye} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <path d="M -2 30 C 1 31 3 30 4 28" fill="none" stroke={palette.eye} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
      {/* philtrum shadow */}
      <path d="M -12 38 L -10 46" stroke={palette.skinShade} strokeWidth={2} opacity={0.35} strokeLinecap="round" />
      {/* lips */}
      <path d="M -28 52 C -20 47 -14 47 -10 49 C -6 47 2 47 14 51 C 2 52 -14 53 -28 52 Z" fill={palette.lip} opacity={0.5} />
      <path d="M -24 54 C -14 60 4 60 12 53 C 0 55 -12 56 -24 54 Z" fill={palette.lip} opacity={0.28} />
      {/* mouth */}
      <path
        d={`M ${-30} ${53 - e.mouthCurve * 3} Q ${-10} ${53 + e.mouthCurve * 4 + mouthOpen * 0.2} ${16 + e.smirk * 2} ${51 - e.mouthCurve * 3 - e.smirk * 6}`}
        fill="none"
        stroke={palette.lip}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {mouthOpen > 0.5 && (
        <path d={`M -26 52 Q -10 ${54 + mouthOpen * 1.4} 12 51 Q -8 53 -26 52 Z`} fill="#2A1512" />
      )}
      {/* lower lip shading + chin */}
      <path d="M -20 64 Q -8 67 4 64" fill="none" stroke={palette.skinShade} strokeWidth={3} opacity={0.3} strokeLinecap="round" />
      {/* hair */}
      <path
        d="M -60 -24 C -72 -62 -60 -106 -20 -124 C 14 -140 62 -128 78 -96 C 86 -78 84 -54 76 -32
           C 74 -44 70 -54 64 -60 C 56 -66 46 -66 36 -64 C 24 -62 14 -68 4 -66 C -8 -64 -18 -70 -28 -66
           C -40 -62 -48 -54 -52 -44 C -55 -38 -57 -32 -60 -24 Z"
        fill={palette.hair}
      />
      {/* sideburn on the near side */}
      <path d="M 76 -32 C 76 -24 74 -16 71 -10 C 69 -18 67 -26 66 -34 C 70 -36 74 -36 76 -32 Z" fill={palette.hair} />
      {/* a few loose strands on the forehead */}
      <path d="M -6 -66 C -16 -60 -24 -52 -28 -44" fill="none" stroke={palette.hair} strokeWidth={3} strokeLinecap="round" />
      <path d="M 10 -66 C 4 -60 0 -54 -2 -48" fill="none" stroke={palette.hair} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M -24 -118 C 4 -127 36 -122 56 -104" fill="none" stroke={palette.hairShine} strokeWidth={5} strokeLinecap="round" opacity={0.22} />
      <path d="M -40 -100 C -14 -112 18 -112 40 -100" fill="none" stroke={palette.hairShine} strokeWidth={3} strokeLinecap="round" opacity={0.15} />
    </g>
  );
};

/** Natural blink curve: returns 0..1 lid closure at time t for blinks starting at `times`. */
export const blinkAt = (t: number, times: number[], dur = 0.22) => {
  for (const b of times) {
    const d = t - b;
    if (d >= 0 && d < dur) {
      const p = d / dur;
      return p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6;
    }
  }
  return 0;
};
