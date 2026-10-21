import React from 'react';
import {mulberry32} from '../utils/seededRandom';

/**
 * Style test: god Varun's office at night, painted with layered light.
 * World = 1920x1080 frame. Letterbox band is y 138..942.
 */

export const C = {
  wall: '#1d2c3d',
  wallDeep: '#121c28',
  wallWarm: '#5e4433',
  panel: '#172130',
  panelHi: '#2c3d52',
  floor: '#120e0d',
  lamp: '#ffc879',
  lampCore: '#fff3d6',
  screen: '#a9d4ff',
  wood: '#6b3f22',
  woodLit: '#c27d43',
  woodDark: '#2a170c',
  ink: '#0a0f17',
};

export const FLOOR_Y = 880;
export const DESK = {x0: 805, x1: 1475, y0: 590, y1: 634, edge: 18};

/** Soft-edged blob, used everywhere for painted light and shadow. */
export const Soft: React.FC<{d: string; fill: string; o?: number; blur?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({
  d,
  fill,
  o = 1,
  blur = 10,
  blend,
}) => <path d={d} fill={fill} opacity={o} filter={`url(#stBlur${snapBlur(blur)})`} style={blend ? {mixBlendMode: blend} : undefined} />;

const BLURS = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 30, 40, 55, 70];
/** Blur filters are predefined; snap any requested radius to the nearest one. */
export const snapBlur = (b: number) => BLURS.reduce((a, c) => (Math.abs(c - b) < Math.abs(a - b) ? c : a), BLURS[0]);

export const BlurDefs: React.FC = () => (
  <defs>
    {BLURS.map((b) => (
      <filter key={b} id={`stBlur${b}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={b} />
      </filter>
    ))}
  </defs>
);

// ---------------------------------------------------------------------------
// Window and the city outside
// ---------------------------------------------------------------------------
const WIN = {x: 150, y: 168, w: 420, h: 440};

const City: React.FC = () => {
  const rand = mulberry32(3);
  const layers = [
    {base: WIN.y + 250, n: 9, col: '#16223a', lit: 0.18, h: [60, 170], blur: 4},
    {base: WIN.y + 300, n: 7, col: '#0f182b', lit: 0.3, h: [80, 210], blur: 2},
    {base: WIN.y + 360, n: 5, col: '#0a1120', lit: 0.4, h: [120, 260], blur: 0},
  ];
  return (
    <g>
      <defs>
        <linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070d19" />
          <stop offset="0.55" stopColor="#14223b" />
          <stop offset="0.85" stopColor="#3b3346" />
          <stop offset="1" stopColor="#5b3f3a" />
        </linearGradient>
      </defs>
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="url(#stSky)" />
      {/* low cloud lit from below by the city */}
      <Soft d={`M ${WIN.x} ${WIN.y + 210} C ${WIN.x + 120} ${WIN.y + 180} ${WIN.x + 260} ${WIN.y + 230} ${WIN.x + WIN.w} ${WIN.y + 200} L ${WIN.x + WIN.w} ${WIN.y + 260} L ${WIN.x} ${WIN.y + 260} Z`} fill="#4a3a4c" o={0.5} blur={16} />
      {layers.map((L, li) => {
        let x = WIN.x - 20;
        const blocks: React.ReactNode[] = [];
        while (x < WIN.x + WIN.w + 20) {
          const w = 40 + rand() * 70;
          const h = L.h[0] + rand() * (L.h[1] - L.h[0]);
          const top = L.base - h + 200;
          const bx = x;
          blocks.push(
            <g key={`${li}-${bx}`}>
              <rect x={bx} y={top} width={w} height={WIN.y + WIN.h - top} fill={L.col} />
              {rand() > 0.6 && <rect x={bx + w * 0.4} y={top - 18} width={3} height={18} fill={L.col} />}
              {rand() > 0.7 && <circle cx={bx + w * 0.4 + 1.5} cy={top - 19} r={2} fill="#ff6a5a" opacity={0.8} />}
              {Array.from({length: Math.floor(h / 14)}, (_, r) =>
                Array.from({length: Math.floor(w / 11)}, (_, c) =>
                  rand() < L.lit ? (
                    <rect
                      key={`${r}-${c}`}
                      x={bx + 4 + c * 11}
                      y={top + 8 + r * 14}
                      width={5}
                      height={6}
                      fill={rand() > 0.3 ? '#ffcf86' : '#9fd0ff'}
                      opacity={0.35 + rand() * 0.6}
                    />
                  ) : null,
                ),
              )}
            </g>,
          );
          x += w + rand() * 8;
        }
        return (
          <g key={li} filter={L.blur ? `url(#stBlur${L.blur === 4 ? 2 : 2})` : undefined} opacity={L.blur === 4 ? 0.8 : 1}>
            {blocks}
          </g>
        );
      })}
      {/* sodium haze over the street */}
      <Soft d={`M ${WIN.x} ${WIN.y + WIN.h - 120} L ${WIN.x + WIN.w} ${WIN.y + WIN.h - 140} L ${WIN.x + WIN.w} ${WIN.y + WIN.h} L ${WIN.x} ${WIN.y + WIN.h} Z`} fill="#c7804a" o={0.25} blur={24} blend="screen" />
      {/* rain on the glass */}
      {Array.from({length: 70}, (_, i) => {
        const x = WIN.x + rand() * WIN.w;
        const y = WIN.y + rand() * WIN.h;
        const l = 6 + rand() * 22;
        return <line key={i} x1={x} y1={y} x2={x - 1.5} y2={y + l} stroke="#c9dcf5" strokeWidth={1} opacity={0.12 + rand() * 0.18} strokeLinecap="round" />;
      })}
      {Array.from({length: 40}, (_, i) => (
        <circle key={`d${i}`} cx={WIN.x + rand() * WIN.w} cy={WIN.y + rand() * WIN.h} r={0.8 + rand() * 2} fill="#d8e6f7" opacity={0.15 + rand() * 0.2} />
      ))}
    </g>
  );
};

const Window: React.FC = () => (
  <g>
    {/* deep reveal (wall thickness) */}
    <rect x={WIN.x - 26} y={WIN.y - 26} width={WIN.w + 52} height={WIN.h + 52} fill="#101925" />
    <City />
    {/* sash frames */}
    <g fill="#26364a">
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={12} />
      <rect x={WIN.x} y={WIN.y + WIN.h - 12} width={WIN.w} height={12} />
      <rect x={WIN.x} y={WIN.y} width={12} height={WIN.h} />
      <rect x={WIN.x + WIN.w - 12} y={WIN.y} width={12} height={WIN.h} />
      <rect x={WIN.x + WIN.w / 2 - 7} y={WIN.y} width={14} height={WIN.h} />
      <rect x={WIN.x} y={WIN.y + WIN.h * 0.46 - 8} width={WIN.w} height={16} />
      <rect x={WIN.x + WIN.w / 4 - 3} y={WIN.y} width={6} height={WIN.h} />
      <rect x={WIN.x + (3 * WIN.w) / 4 - 3} y={WIN.y} width={6} height={WIN.h} />
    </g>
    {/* cool city light catching the inner edges of the frame */}
    <g fill="#6f8db3" opacity={0.55}>
      <rect x={WIN.x + 12} y={WIN.y + 12} width={2} height={WIN.h - 24} />
      <rect x={WIN.x + WIN.w / 2 + 7} y={WIN.y + 12} width={2} height={WIN.h - 24} />
      <rect x={WIN.x + 12} y={WIN.y + WIN.h * 0.46 + 8} width={WIN.w - 24} height={2} />
    </g>
    {/* faint reflection of the lamp in the glass */}
    <Soft d={`M ${WIN.x + 300} ${WIN.y + 120} a 20 14 0 1 0 1 0 Z`} fill={C.lamp} o={0.35} blur={6} blend="screen" />
    <Soft d={`M ${WIN.x + 230} ${WIN.y + 60} L ${WIN.x + 330} ${WIN.y + 60} L ${WIN.x + 260} ${WIN.y + 300} L ${WIN.x + 200} ${WIN.y + 300} Z`} fill="#ffffff" o={0.04} blur={10} />
    {/* sill */}
    <path d={`M ${WIN.x - 44} ${WIN.y + WIN.h + 20} L ${WIN.x + WIN.w + 44} ${WIN.y + WIN.h + 20} L ${WIN.x + WIN.w + 52} ${WIN.y + WIN.h + 38} L ${WIN.x - 52} ${WIN.y + WIN.h + 38} Z`} fill="#22324a" />
    <rect x={WIN.x - 52} y={WIN.y + WIN.h + 38} width={WIN.w + 104} height={10} fill="#141f2d" />
    <rect x={WIN.x - 44} y={WIN.y + WIN.h + 20} width={WIN.w + 88} height={2} fill="#5f7ea6" opacity={0.6} />
    {/* things on the sill: a small cactus and a stack of old books */}
    <g transform={`translate(${WIN.x + 40} ${WIN.y + WIN.h + 22})`}>
      <path d="M -16 0 L 16 0 L 12 -26 L -12 -26 Z" fill="#6a3b2a" />
      <rect x={-14} y={-30} width={28} height={6} rx={2} fill="#7d4733" />
      <path d="M -4 -30 C -8 -50 -6 -66 2 -68 C 10 -66 10 -50 6 -30 Z" fill="#2f4a3a" />
      <path d="M 6 -44 C 14 -46 16 -54 14 -60 C 10 -58 8 -52 6 -48 Z" fill="#2f4a3a" />
      <path d="M -1 -66 L -1 -34" stroke="#466a52" strokeWidth={1.5} opacity={0.6} />
    </g>
    <g transform={`translate(${WIN.x + WIN.w - 120} ${WIN.y + WIN.h + 22})`}>
      <rect x={0} y={-14} width={86} height={14} fill="#3b2a3a" />
      <rect x={6} y={-26} width={74} height={12} fill="#2b3a4a" />
      <rect x={-2} y={-36} width={80} height={10} fill="#4a3426" />
      <rect x={0} y={-12} width={86} height={2} fill="#c9b48a" opacity={0.3} />
      <rect x={6} y={-24} width={74} height={2} fill="#c9b48a" opacity={0.25} />
    </g>
    {/* curtain, gathered to the left */}
    <g>
      <rect x={WIN.x - 90} y={WIN.y - 52} width={WIN.w + 160} height={8} rx={4} fill="#0d141e" />
      <circle cx={WIN.x - 92} cy={WIN.y - 48} r={8} fill="#0d141e" />
      <path
        d={`M ${WIN.x - 80} ${WIN.y - 44} C ${WIN.x - 40} ${WIN.y - 44} ${WIN.x + 10} ${WIN.y - 44} ${WIN.x + 40} ${WIN.y - 44}
           C ${WIN.x + 30} ${WIN.y + 120} ${WIN.x - 10} ${WIN.y + 260} ${WIN.x - 4} ${WIN.y + 420}
           C ${WIN.x - 2} ${WIN.y + 560} ${WIN.x + 10} ${FLOOR_Y - 60} ${WIN.x + 4} ${FLOOR_Y - 4}
           L ${WIN.x - 96} ${FLOOR_Y - 4} C ${WIN.x - 92} ${WIN.y + 500} ${WIN.x - 90} ${WIN.y + 200} ${WIN.x - 80} ${WIN.y - 44} Z`}
        fill="#2a2333"
      />
      {/* folds */}
      {[-66, -46, -24, -4, 18].map((dx, i) => (
        <path
          key={i}
          d={`M ${WIN.x + dx} ${WIN.y - 40} C ${WIN.x + dx - 6} ${WIN.y + 200} ${WIN.x + dx - 12} ${WIN.y + 420} ${WIN.x + dx - 8} ${FLOOR_Y - 6}`}
          stroke={i % 2 ? '#3a3146' : '#17121d'}
          strokeWidth={i % 2 ? 5 : 9}
          fill="none"
          opacity={0.8}
          filter="url(#stBlur2)"
        />
      ))}
      {/* city light grazing the curtain edge */}
      <path d={`M ${WIN.x + 40} ${WIN.y - 44} C ${WIN.x + 30} ${WIN.y + 120} ${WIN.x - 10} ${WIN.y + 260} ${WIN.x - 4} ${WIN.y + 420}`} stroke="#6f8db3" strokeWidth={3} fill="none" opacity={0.45} filter="url(#stBlur2)" />
    </g>
    {/* radiator under the window */}
    <g transform={`translate(${WIN.x + 40} ${WIN.y + WIN.h + 70})`}>
      {Array.from({length: 14}, (_, i) => (
        <g key={i}>
          <rect x={i * 24} y={0} width={18} height={150} rx={8} fill="#1c2635" />
          <rect x={i * 24 + 3} y={6} width={3} height={138} rx={1.5} fill="#3e5272" opacity={0.6} />
        </g>
      ))}
      <rect x={-6} y={-6} width={14 * 24 + 6} height={10} rx={4} fill="#202c3d" />
      <rect x={-6} y={146} width={14 * 24 + 6} height={10} rx={4} fill="#151d29" />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// Bookcase
// ---------------------------------------------------------------------------
const Bookcase: React.FC = () => {
  const X = 1505;
  const Y = 140;
  const W = 400;
  const H = FLOOR_Y - Y;
  const rows = 4;
  const rowH = (H - 40) / rows;
  const rand = mulberry32(17);
  const palette = ['#5a2a2c', '#22344f', '#33452f', '#6b5634', '#3f3a46', '#2f2a40', '#6a3b24', '#24403f', '#7a6a4a'];
  return (
    <g>
      <rect x={X} y={Y} width={W} height={H} fill="#100c0b" />
      {Array.from({length: rows}, (_, r) => {
        const sy = Y + 20 + r * rowH;
        const items: React.ReactNode[] = [];
        let x = X + 16;
        let k = 0;
        while (x < X + W - 30) {
          const kind = rand();
          if (kind < 0.08 && r !== 1) {
            // a lying stack
            const n = 2 + Math.floor(rand() * 3);
            for (let j = 0; j < n; j++) {
              const w = 70 + rand() * 20;
              items.push(<rect key={`s${k++}`} x={x} y={sy + rowH - 14 - (j + 1) * 13} width={w} height={12} fill={palette[Math.floor(rand() * palette.length)]} />);
              items.push(<rect key={`s${k++}`} x={x} y={sy + rowH - 14 - (j + 1) * 13 + 5} width={w} height={2} fill="#d6b77a" opacity={0.25} />);
            }
            x += 96;
            continue;
          }
          if (kind < 0.12) {
            x += 22 + rand() * 30;
            continue;
          }
          const w = 13 + rand() * 18;
          const h = rowH * (0.62 + rand() * 0.3);
          const col = palette[Math.floor(rand() * palette.length)];
          const lean = rand() > 0.93 ? 8 : 0;
          const binder = r === 1 && rand() > 0.3;
          items.push(
            <g key={`b${k++}`} transform={lean ? `rotate(${lean} ${x + w} ${sy + rowH - 14})` : undefined}>
              <rect x={x} y={sy + rowH - 14 - h} width={w} height={h} fill={col} />
              {binder ? (
                <>
                  <rect x={x + 3} y={sy + rowH - 14 - h + h * 0.12} width={w - 6} height={h * 0.2} fill="#d9d1bd" opacity={0.55} />
                  <circle cx={x + w / 2} cy={sy + rowH - 14 - h * 0.25} r={3} fill="#0a0a0a" opacity={0.6} />
                </>
              ) : (
                <>
                  <rect x={x} y={sy + rowH - 14 - h + 10} width={w} height={2} fill="#d6b77a" opacity={0.35} />
                  <rect x={x} y={sy + rowH - 14 - h + 16} width={w} height={1} fill="#d6b77a" opacity={0.25} />
                  <rect x={x} y={sy + rowH - 14 - 16} width={w} height={2} fill="#d6b77a" opacity={0.25} />
                  <rect x={x + w * 0.3} y={sy + rowH - 14 - h * 0.6} width={w * 0.4} height={h * 0.25} fill="#000" opacity={0.2} />
                </>
              )}
              {/* spine roundness */}
              <rect x={x} y={sy + rowH - 14 - h} width={2} height={h} fill="#fff" opacity={0.08} />
              <rect x={x + w - 3} y={sy + rowH - 14 - h} width={3} height={h} fill="#000" opacity={0.3} />
            </g>,
          );
          x += w + 1;
        }
        return (
          <g key={r}>
            <rect x={X} y={sy} width={W} height={rowH} fill="#0c0908" />
            {items}
            {/* shadow under the shelf above */}
            <Soft d={`M ${X} ${sy} L ${X + W} ${sy} L ${X + W} ${sy + 40} L ${X} ${sy + 40} Z`} fill="#000" o={0.55} blur={10} />
            <rect x={X - 6} y={sy + rowH - 14} width={W + 12} height={16} fill="#3a2416" />
            <rect x={X - 6} y={sy + rowH - 14} width={W + 12} height={2} fill="#7a5134" />
          </g>
        );
      })}
      {/* small things on the top */}
      <rect x={X - 12} y={Y - 16} width={W + 24} height={18} fill="#3a2416" />
      <g transform={`translate(${X + 80} ${Y - 16})`}>
        <rect x={-30} y={-40} width={60} height={40} fill="#2b2226" />
        <rect x={-30} y={-40} width={60} height={6} fill="#3d3236" />
      </g>
      <g transform={`translate(${X + 250} ${Y - 16})`}>
        <path d="M -14 0 L 14 0 L 10 -22 L -10 -22 Z" fill="#433028" />
        {[-30, -10, 10, 30, 50].map((a, i) => (
          <path key={i} d={`M 0 -22 Q ${a * 0.6} -50 ${a} -${60 + (i % 2) * 14}`} stroke="#2c4a33" strokeWidth={5} fill="none" strokeLinecap="round" />
        ))}
      </g>
      {/* side panels */}
      <rect x={X - 12} y={Y - 16} width={14} height={H + 16} fill="#2c1b11" />
      <rect x={X + W - 2} y={Y - 16} width={14} height={H + 16} fill="#1f130c" />
      {/* lamp light grazing the near side of the case */}
      <Soft d={`M ${X - 12} ${Y + 120} L ${X + 120} ${Y + 200} L ${X + 120} ${Y + 560} L ${X - 12} ${Y + 600} Z`} fill={C.lamp} o={0.16} blur={40} blend="screen" />
      {/* the far side sinks into darkness */}
      <Soft d={`M ${X + 200} ${Y - 40} L ${X + W + 60} ${Y - 40} L ${X + W + 60} ${FLOOR_Y + 20} L ${X + 200} ${FLOOR_Y + 20} Z`} fill="#05070b" o={0.55} blur={70} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Walls, floor, clock, coat
// ---------------------------------------------------------------------------
const WallClock: React.FC = () => {
  const cx = 1050;
  const cy = 236;
  const r = 44;
  // 11:47
  const hourA = ((11 + 47 / 60) / 12) * 360;
  const minA = (47 / 60) * 360;
  return (
    <g>
      <Soft d={`M ${cx + 6} ${cy + 10} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`} fill="#000" o={0.45} blur={6} />
      <circle cx={cx} cy={cy} r={r + 6} fill="#2a1b12" />
      <circle cx={cx} cy={cy} r={r} fill="#cfc6b2" />
      <circle cx={cx} cy={cy} r={r} fill="#1d2c3d" opacity={0.45} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * r * 0.8}
            y1={cy - Math.cos(a) * r * 0.8}
            x2={cx + Math.sin(a) * r * (i % 3 ? 0.88 : 0.92)}
            y2={cy - Math.cos(a) * r * (i % 3 ? 0.88 : 0.92)}
            stroke="#1a1410"
            strokeWidth={i % 3 ? 1.5 : 3}
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + Math.sin((hourA * Math.PI) / 180) * r * 0.5} y2={cy - Math.cos((hourA * Math.PI) / 180) * r * 0.5} stroke="#141010" strokeWidth={4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin((minA * Math.PI) / 180) * r * 0.75} y2={cy - Math.cos((minA * Math.PI) / 180) * r * 0.75} stroke="#141010" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill="#8a2b22" />
      {/* glass sheen catching the lamp */}
      <path d={`M ${cx + r * 0.2} ${cy - r * 0.85} A ${r * 0.9} ${r * 0.9} 0 0 1 ${cx + r * 0.85} ${cy - r * 0.15}`} stroke="#ffd9a0" strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round" />
    </g>
  );
};

export const RoomBack: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="stWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#152131" />
        <stop offset="0.6" stopColor={C.wall} />
        <stop offset="1" stopColor="#18232f" />
      </linearGradient>
      <linearGradient id="stFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b1412" />
        <stop offset="1" stopColor="#0b0807" />
      </linearGradient>
      <filter id="stPlaster" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="4" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.7  0 0 0 0 0.85  0 0 0 0.9 -0.35" />
      </filter>
    </defs>
    <rect x={-300} y={-200} width={2520} height={1480} fill="url(#stWall)" />
    {/* plaster texture */}
    <rect x={-300} y={-200} width={2520} height={1000} filter="url(#stPlaster)" opacity={0.18} style={{mixBlendMode: 'overlay'}} />

    {/* warm lamp light thrown up the wall behind the desk */}
    <Soft d="M 1020 140 C 1180 120 1420 160 1500 260 L 1500 640 L 960 640 C 930 460 960 220 1020 140 Z" fill={C.wallWarm} o={0.8} blur={70} blend="screen" />
    <Soft d="M 1200 420 C 1300 400 1400 430 1450 500 L 1450 640 L 1150 640 C 1130 560 1150 460 1200 420 Z" fill="#a8703e" o={0.45} blur={40} blend="screen" />

    <WallClock />

    {/* wainscot panelling */}
    <rect x={-300} y={640} width={2520} height={FLOOR_Y - 640} fill={C.panel} />
    <rect x={-300} y={636} width={2520} height={10} fill="#22324a" />
    <rect x={-300} y={636} width={2520} height={2} fill="#4b6487" opacity={0.6} />
    {Array.from({length: 16}, (_, i) => {
      const x = -200 + i * 150;
      return (
        <g key={i}>
          <rect x={x} y={668} width={124} height={FLOOR_Y - 700} fill="#131b27" />
          <rect x={x} y={668} width={124} height={2} fill="#000" opacity={0.5} />
          <rect x={x} y={FLOOR_Y - 34} width={124} height={2} fill="#3d5170" opacity={0.5} />
          <rect x={x + 122} y={668} width={2} height={FLOOR_Y - 700} fill="#3d5170" opacity={0.4} />
        </g>
      );
    })}
    <Soft d="M 900 640 L 1500 640 L 1500 880 L 900 880 Z" fill={C.lamp} o={0.12} blur={40} blend="screen" />
    {/* skirting */}
    <rect x={-300} y={FLOOR_Y - 18} width={2520} height={18} fill="#0f151f" />

    {/* floor: dark boards, a rug, lamp glow pooled under the desk */}
    <rect x={-300} y={FLOOR_Y} width={2520} height={400} fill="url(#stFloor)" />
    {Array.from({length: 7}, (_, i) => (
      <line key={i} x1={-300} y1={FLOOR_Y + 8 + i * i * 6} x2={2220} y2={FLOOR_Y + 8 + i * i * 6} stroke="#000" strokeWidth={1.5} opacity={0.5} />
    ))}
    <path d={`M 420 ${FLOOR_Y + 30} L 1700 ${FLOOR_Y + 30} L 1820 1080 L 300 1080 Z`} fill="#3a1d1a" />
    <path d={`M 440 ${FLOOR_Y + 36} L 1680 ${FLOOR_Y + 36}`} stroke="#8a5a3a" strokeWidth={3} opacity={0.5} strokeDasharray="10 6" />
    <Soft d={`M 900 ${FLOOR_Y + 20} L 1450 ${FLOOR_Y + 20} L 1500 1000 L 860 1000 Z`} fill={C.lamp} o={0.18} blur={40} blend="screen" />
    {/* city light falling through the window onto the floor */}
    <Soft d={`M 160 ${FLOOR_Y + 4} L 560 ${FLOOR_Y + 4} L 700 1060 L 260 1060 Z`} fill="#5f7fb0" o={0.22} blur={24} blend="screen" />

    <Window />
    <Bookcase />
  </g>
);

/** Cool shafts of city light and warm air near the lamp. Drawn over everything. */
export const Atmosphere: React.FC = () => (
  <g style={{mixBlendMode: 'screen'}}>
    <Soft d="M 170 200 L 560 200 L 980 900 L 520 940 Z" fill="#6b8cc0" o={0.08} blur={40} />
    <Soft d="M 330 220 L 420 220 L 760 880 L 620 900 Z" fill="#8fb0e0" o={0.06} blur={16} />
  </g>
);
