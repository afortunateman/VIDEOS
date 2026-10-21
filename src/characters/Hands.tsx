import React, {useId} from 'react';

/**
 * Hands are the film's whole symbol: drawn larger and cleaner than anything else.
 * Local space: wrist at the origin, fingers point to +x, the desk surface is y = 0.
 */

export type HandPalette = {
  skin: string;
  shade: string;
  deep: string;
  nail: string;
  crease: string;
};

export const HAND_GOD: HandPalette = {
  skin: '#8C5B3E',
  shade: '#6A4029',
  deep: '#4A2B1B',
  nail: '#C7A08A',
  crease: '#5A3423',
};

type Seg = {len: number; w: number};

/** Forward kinematics for a finger chain. Angles in degrees, relative to the previous segment. */
const chain = (x: number, y: number, base: number, segs: Seg[], rel: number[]) => {
  const pts: {x: number; y: number; a: number}[] = [{x, y, a: base}];
  let a = base;
  let cx = x;
  let cy = y;
  segs.forEach((s, i) => {
    a += rel[i];
    const r = (a * Math.PI) / 180;
    cx += Math.cos(r) * s.len;
    cy += Math.sin(r) * s.len;
    pts.push({x: cx, y: cy, a});
  });
  return pts;
};

/** Catmull-Rom sample through joint points, then build a smooth tapered outline. */
export const fingerPath = (pts: {x: number; y: number}[], widths: number[], samples = 18) => {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const W = [widths[0], ...widths, widths[widths.length - 1]];
  const out: {x: number; y: number; w: number}[] = [];
  const n = pts.length - 1;
  for (let k = 0; k <= samples; k++) {
    const u = (k / samples) * n;
    const i = Math.min(n - 1, Math.floor(u));
    const t = u - i;
    const p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3];
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    out.push({x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y), w: W[i + 1] + (W[i + 2] - W[i + 1]) * t});
  }
  const left: string[] = [];
  const right: string[] = [];
  for (let k = 0; k < out.length; k++) {
    const a = out[Math.max(0, k - 1)];
    const b = out[Math.min(out.length - 1, k + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const h = out[k].w / 2;
    left.push(`${(out[k].x + dy * h).toFixed(2)} ${(out[k].y - dx * h).toFixed(2)}`);
    right.push(`${(out[k].x - dy * h).toFixed(2)} ${(out[k].y + dx * h).toFixed(2)}`);
  }
  const tip = out[out.length - 1];
  const prev = out[out.length - 2];
  const ta = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const r = tip.w / 2;
  const base = out[0];
  return {
    d:
      `M ${left[0]} L ${left.join(' L ')} ` +
      `A ${r} ${r} 0 0 1 ${right[right.length - 1]} ` +
      `L ${right.slice().reverse().join(' L ')} ` +
      `A ${base.w / 2} ${base.w / 2} 0 0 1 ${left[0]} Z`,
    tip: {x: tip.x, y: tip.y, a: (ta * 180) / Math.PI, r},
  };
};

const Finger: React.FC<{
  pts: {x: number; y: number; a: number}[];
  widths: number[];
  color: string;
  nail?: string;
  crease?: string;
}> = ({pts, widths, color, nail, crease}) => {
  const {d, tip} = fingerPath(pts, widths);
  return (
    <g>
      <path d={d} fill={color} />
      {nail && (
        <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.a})`}>
          <path
            d={`M ${-tip.r * 2.1} ${-tip.r * 0.78} Q ${-tip.r * 0.6} ${-tip.r * 1.08} ${tip.r * 0.55} ${-tip.r * 0.62} Q ${-tip.r * 0.5} ${-tip.r * 0.48} ${-tip.r * 2.0} ${-tip.r * 0.42} Z`}
            fill={nail}
            opacity={0.85}
          />
        </g>
      )}
      {crease &&
        pts.slice(1, -1).map((p, i) => {
          const r = (p.a * Math.PI) / 180;
          const nx = Math.sin(r);
          const ny = -Math.cos(r);
          const w = widths[i + 1] * 0.5;
          const ox = p.x + nx * w * 0.92;
          const oy = p.y + ny * w * 0.92;
          return (
            <path
              key={i}
              d={`M ${ox - Math.cos(r) * 2.2} ${oy - Math.sin(r) * 2.2} Q ${ox - nx * 2} ${oy - ny * 2} ${ox + Math.cos(r) * 2.2 - nx * 3.2} ${oy + Math.sin(r) * 2.2 - ny * 3.2}`}
              stroke={crease}
              strokeWidth={1}
              fill="none"
              strokeLinecap="round"
              opacity={0.55}
            />
          );
        })}
    </g>
  );
};

/**
 * Right hand seen from the thumb side, resting palm-down on a desk, index finger
 * free to tap. `lift` 0 = resting on the wood, 1 = raised for a tap.
 */
export const HandSideTap: React.FC<{
  lift?: number;
  /** Subtle idle curl of the back fingers, -1..1. */
  curl?: number;
  palette?: HandPalette;
}> = ({lift = 0, curl = 0, palette = HAND_GOD}) => {
  const sid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const idx = chain(55, -27, 12 - lift * 36, [{len: 24, w: 0}, {len: 15, w: 0}, {len: 12, w: 0}], [0, 20 - lift * 7, 22 - lift * 9]);
  const mid = chain(55, -32, 9, [{len: 27, w: 0}, {len: 17, w: 0}, {len: 13, w: 0}], [0, 22 + curl * 3, 24 + curl * 3]);
  const ring = chain(53, -33, 12, [{len: 24, w: 0}, {len: 15, w: 0}, {len: 11, w: 0}], [0, 24 + curl * 4, 26]);
  const thumb = chain(24, -12, 12, [{len: 21, w: 0}, {len: 17, w: 0}], [0, 2]);

  return (
    <g>
      {/* contact shadow on the desk */}
      <defs>
        <filter id={`hs${sid}`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
      </defs>
      <g filter={`url(#hs${sid})`}>
        <ellipse cx={46} cy={1.2} rx={60} ry={3.6} fill="#000" opacity={0.32} />
        <ellipse cx={idx[3].x} cy={0.8} rx={5 + lift * 8} ry={1.6} fill="#000" opacity={0.45 * (1 - lift * 0.8)} />
      </g>

      {/* back fingers peek out beyond the index */}
      <Finger pts={ring} widths={[12.5, 11.5, 10.5, 9.5]} color={palette.deep} />
      <Finger pts={mid} widths={[13.5, 12.5, 11.5, 10.5]} color={palette.shade} />

      {/* hand body: dome of the back of the hand, thenar bulge, palm heel on the desk */}
      <path
        d="M -4 -28 C 10 -31 30 -37 48 -38 C 58 -38 64 -34 64 -27 C 64 -21 60 -18 56 -17
           C 50 -15 46 -12 40 -9 C 32 -5 22 -1 10 0 C 4 0 -2 0 -4 -1 Z"
        fill={palette.skin}
      />
      {/* knuckle ridge highlight and tendon hints */}
      <path d="M 6 -30 C 22 -34 38 -37 54 -37" fill="none" stroke="#fff" strokeOpacity={0.13} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 10 -26 C 24 -28 38 -31 52 -32" fill="none" stroke={palette.crease} strokeOpacity={0.3} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M 8 -19 C 20 -21 32 -23 44 -26" fill="none" stroke={palette.crease} strokeOpacity={0.2} strokeWidth={1.1} strokeLinecap="round" />
      {/* palm heel in shade */}
      <path d="M -4 -1 C 8 0 20 -2 30 -5 C 20 -9 8 -10 -4 -9 Z" fill={palette.shade} opacity={0.55} />

      {/* index finger: the one that taps */}
      <Finger pts={idx} widths={[15, 13, 11.5, 10.5]} color={palette.skin} nail={palette.nail} crease={palette.crease} />
      {/* knuckle bump */}
      <ellipse cx={56} cy={-29} rx={7.5} ry={7} fill={palette.skin} />
      <path d="M 51 -34 C 55 -36 59 -35 62 -32" fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={1.8} strokeLinecap="round" />

      {/* thumb lies along the desk, nearest to camera */}
      <Finger pts={thumb} widths={[17, 14, 12]} color={palette.skin} nail={palette.nail} crease={palette.crease} />
      <path d="M 22 -20 C 30 -14 38 -11 46 -11" fill="none" stroke={palette.shade} strokeOpacity={0.45} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
};

/**
 * Forearm + rolled shirt sleeve, wrist at the origin, elbow toward -x.
 * Lies flat on the desk (y = 0).
 */
export const ForearmOnDesk: React.FC<{
  length?: number;
  palette?: HandPalette;
  sleeve?: string;
  sleeveShade?: string;
  /** Draw the rolled cuff at the elbow end (off when the body rig draws it). */
  showSleeve?: boolean;
}> = ({length = 190, palette = HAND_GOD, sleeve = '#C9C4BA', sleeveShade = '#8E8C88', showSleeve = true}) => (
  <g>
    <ellipse cx={-length / 2} cy={1.5} rx={length / 2 + 10} ry={4} fill="#000" opacity={0.25} />
    <path
      d={`M 4 -30 C -30 -32 ${-length * 0.6} -40 ${-length} -42 L ${-length} -2 C ${-length * 0.6} -1 -30 0 2 -1 Z`}
      fill={palette.skin}
    />
    {/* underside of forearm in shade */}
    <path d={`M 2 -1 C -30 0 ${-length * 0.6} -1 ${-length} -2 L ${-length} -14 C ${-length * 0.6} -12 -30 -10 2 -9 Z`} fill={palette.shade} opacity={0.6} />
    {/* rolled sleeve: a soft roll of fabric with folds */}
    {showSleeve && <g transform={`translate(${-length + 26} 0)`}>
      <path d="M -60 -54 C -40 -56 -14 -55 0 -50 C 8 -36 9 -14 4 2 C -14 4 -40 4 -62 3 Z" fill={sleeveShade} />
      <path d="M -26 -55 C -12 -56 -2 -53 3 -49 C 10 -34 10 -14 5 1 C -4 3 -14 3 -24 3 C -20 -16 -20 -38 -26 -55 Z" fill={sleeve} />
      <path d="M -24 -54 C -19 -36 -19 -16 -23 3" stroke={sleeveShade} strokeWidth={2.2} fill="none" />
      <path d="M -12 -52 C -8 -36 -8 -18 -11 2" stroke={sleeveShade} strokeWidth={1.2} fill="none" opacity={0.6} />
      <path d="M -50 -54 C -48 -40 -44 -30 -40 -26" stroke="#000" strokeOpacity={0.18} strokeWidth={2} fill="none" />
      <path d="M -56 -20 C -46 -16 -36 -16 -28 -20" stroke="#000" strokeOpacity={0.15} strokeWidth={2} fill="none" />
      <path d="M 3 -49 C 9 -34 9 -14 5 1" stroke="#000" strokeOpacity={0.3} strokeWidth={2.5} fill="none" />
    </g>}
  </g>
);
