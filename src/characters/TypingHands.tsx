import React from 'react';
import {HandPalette} from './Hands';


/**
 * Both hands on a laptop keyboard, seen from behind (over the shoulder).
 * Each finger dips when its key is struck. Local space: origin between the hands
 * on the home row; fingers point up (-y), wrists run down (+y).
 */

type FingerId = 'L5' | 'L4' | 'L3' | 'L2' | 'R2' | 'R3' | 'R4' | 'R5' | 'RT';

const KEYMAP: Record<string, FingerId> = {};
const assign = (keys: string, f: FingerId) => keys.split('').forEach((k) => (KEYMAP[k] = f));
assign('qaz1', 'L5');
assign('wsx2', 'L4');
assign('edc3', 'L3');
assign('rfvtgb45', 'L2');
assign('yhnujm67', 'R2');
assign('ik,8', 'R3');
assign('ol.9', 'R4');
assign("p;'0-?", 'R5');
assign(' ', 'RT');

export const fingerForChar = (ch: string): FingerId => KEYMAP[ch.toLowerCase()] ?? 'R2';

const press = (dt: number) => {
  if (dt < 0 || dt > 0.17) return 0;
  return dt < 0.06 ? dt / 0.06 : 1 - (dt - 0.06) / 0.11;
};

/** How far each finger is pressed (0..1) at time t, given per-character key times. */
export const fingerPresses = (text: string, times: number[], t: number) => {
  const out: Record<FingerId, number> = {L5: 0, L4: 0, L3: 0, L2: 0, R2: 0, R3: 0, R4: 0, R5: 0, RT: 0};
  for (let i = 0; i < times.length; i++) {
    const dt = t - times[i];
    if (dt < -0.1 || dt > 0.3) continue;
    const f = fingerForChar(text[i]);
    out[f] = Math.max(out[f], press(dt));
  }
  return out;
};

const FingerStub: React.FC<{x: number; y: number; len: number; w: number; angle: number; p: number; color: string; shade: string}> = ({
  x,
  y,
  len,
  w,
  angle,
  p,
  color,
  shade,
}) => {
  // Seen from behind, the finger arcs away and down onto its key. Pressing bends it
  // further, so it reads shorter and drops a little.
  const L = len * (1 - p * 0.35);
  return (
    <g transform={`translate(${x} ${y + p * 4}) rotate(${angle})`}>
      <path
        d={`M ${-w / 2} 6 L ${-w / 2} ${-L + w * 0.42} Q ${-w / 2} ${-L} 0 ${-L} Q ${w / 2} ${-L} ${w / 2} ${-L + w * 0.42} L ${w / 2} 6 Z`}
        fill={color}
      />
      {/* the far knuckle bends away: darker band near the top */}
      <path d={`M ${-w / 2} ${-L * 0.55} Q 0 ${-L * 0.7} ${w / 2} ${-L * 0.55} L ${w / 2} ${-L + w * 0.42} Q ${w / 2} ${-L} 0 ${-L} Q ${-w / 2} ${-L} ${-w / 2} ${-L + w * 0.42} Z`} fill={shade} opacity={0.55} />
      <path d={`M ${-w / 2 + 2} ${-L * 0.18} Q 0 ${-L * 0.26} ${w / 2 - 2} ${-L * 0.18}`} stroke={shade} strokeWidth={1.1} fill="none" opacity={0.6} />
    </g>
  );
};

const OneHand: React.FC<{
  side: 'L' | 'R';
  presses: Record<FingerId, number>;
  palette: HandPalette;
  bob: number;
}> = ({side, presses, palette, bob}) => {
  const m = side === 'L' ? 1 : -1; // mirror so the thumb is always on the inside
  const f = (n: 2 | 3 | 4 | 5) => presses[`${side}${n}` as FingerId];
  const handPress = Math.max(f(2), f(3), f(4), f(5)) * 0.25;
  return (
    <g transform={`translate(0 ${bob + handPress * 2}) scale(${m} 1) rotate(14)`}>
      {/* forearm running down and out toward the elbow */}
      <path d="M -44 20 C -54 80 -70 150 -84 240 L 44 240 C 40 150 38 80 36 20 Z" fill={palette.deep} />
      {/* fingers: pinky (outer, -x) to index (inner, +x), drawn behind the knuckles */}
      <FingerStub x={-40} y={-30} len={20} w={15} angle={-14} p={f(5)} color={palette.skin} shade={palette.deep} />
      <FingerStub x={-20} y={-38} len={25} w={17} angle={-6} p={f(4)} color={palette.skin} shade={palette.deep} />
      <FingerStub x={2} y={-40} len={27} w={18} angle={2} p={f(3)} color={palette.skin} shade={palette.deep} />
      <FingerStub x={24} y={-36} len={24} w={18} angle={10} p={f(2)} color={palette.skin} shade={palette.deep} />
      {/* thumb tucked under the inside edge, toward the space bar */}
      <g transform={`translate(40 26) rotate(${-24 + (side === 'R' ? presses.RT * 6 : 0)})`}>
        <path d="M -9 10 L -9 -18 Q -9 -30 0 -30 Q 9 -30 9 -18 L 9 10 Z" fill={palette.shade} />
      </g>
      {/* back of the hand: a low dome */}
      <path d="M -56 34 C -62 4 -56 -24 -42 -36 C -22 -50 20 -50 38 -40 C 52 -30 56 -4 50 34 Z" fill={palette.skin} />
      {/* knuckles */}
      {[-40, -20, 2, 24].map((x, i) => (
        <ellipse key={i} cx={x} cy={-34 + Math.abs(x + 8) * 0.06} rx={8} ry={4.5} fill="#fff" opacity={0.08} />
      ))}
      {/* tendons fanning to the knuckles */}
      {[-36, -18, 2, 22].map((x, i) => (
        <path key={i} d={`M ${x * 0.35} 30 Q ${x * 0.7} 0 ${x} -28`} stroke={palette.crease} strokeWidth={1.3} fill="none" opacity={0.3} />
      ))}
    </g>
  );
};

export const TypingHands: React.FC<{
  presses: Record<FingerId, number>;
  palette: HandPalette;
  t: number;
  gap?: number;
}> = ({presses, palette, t, gap = 120}) => (
  <g>
    <g transform={`translate(${-gap} 0)`}>
      <OneHand side="L" presses={presses} palette={palette} bob={Math.sin(t * 2.1) * 0.8} />
    </g>
    <g transform={`translate(${gap} 0)`}>
      <OneHand side="R" presses={presses} palette={palette} bob={Math.sin(t * 2.1 + 1.3) * 0.8} />
    </g>
  </g>
);
