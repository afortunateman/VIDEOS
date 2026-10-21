import React from 'react';
import {Glow} from '../art/LightPass';
import {mulberry32} from '../utils/seededRandom';

/**
 * God Varun's office, seen from the side (medium shot). World coordinates are the
 * 1920x1080 frame at zoom 1. All placement constants live in OFFICE so the scenes
 * (S1, S3, S6) frame the same room.
 */
export const OFFICE = {
  wallTop: '#2B3A4D',
  wallBottom: '#1E2A38',
  lampLight: '#F2B66D',
  screen: '#BFD9FF',
  // Desk (side view): the top surface is a band, far edge at y0, near edge at y1.
  desk: {x0: 770, x1: 1500, y0: 596, y1: 640, edge: 16},
  laptop: {x0: 1062, x1: 1212, y: 614, lidLen: 136, lidAngle: -78},
  globe: {x: 1318, y: 601, r: 30},
  lamp: {baseX: 1425, baseY: 600, shadeX: 1290, shadeY: 405},
  window: {x: 120, y: 175, w: 390, h: 400},
  shelves: {x: 1560, y: 170, w: 330, h: 470},
  hand: {x: 872, y: 609, scale: 1.3},
} as const;

export const BackWall: React.FC<{t: number}> = ({t}) => {
  const {window: w, shelves: sh} = OFFICE;
  const rand = mulberry32(11);
  const cityLights = Array.from({length: 16}, () => ({
    x: w.x + 20 + rand() * (w.w - 40),
    y: w.y + w.h * 0.45 + rand() * w.h * 0.5,
    r: 2 + rand() * 5,
    warm: rand() > 0.55,
    f: rand(),
  }));
  const binders = Array.from({length: 40}, (_, i) => ({
    i,
    w: 16 + rand() * 14,
    h: 0.72 + rand() * 0.24,
    c: ['#4A2626', '#25344B', '#33402F', '#5A4A33', '#3A3A40', '#2F2A3F'][Math.floor(rand() * 6)],
    lean: rand() > 0.9 ? 6 : 0,
  }));
  const rows = [0, 1, 2];
  return (
    <g>
      <defs>
        <linearGradient id="officeWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OFFICE.wallTop} />
          <stop offset="1" stopColor={OFFICE.wallBottom} />
        </linearGradient>
        <radialGradient id="roomFalloff" gradientUnits="userSpaceOnUse" cx={1150} cy={520} r={1} gradientTransform="translate(1150 520) scale(1100 700) translate(-1150 -520)">
          <stop offset="0" stopColor="#05080D" stopOpacity={0} />
          <stop offset="0.55" stopColor="#05080D" stopOpacity={0.25} />
          <stop offset="1" stopColor="#05080D" stopOpacity={0.6} />
        </radialGradient>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070B12" />
          <stop offset="1" stopColor="#111A27" />
        </linearGradient>
      </defs>
      <rect x={-400} y={-200} width={2720} height={1480} fill="url(#officeWall)" />
      {/* faint warm spill from the lamp on the wall */}
      <Glow cx={1300} cy={430} rx={520} ry={330} color={OFFICE.lampLight} opacity={0.13} />
      {/* skirting / wainscot line */}
      <rect x={-400} y={700} width={2720} height={8} fill="#18222E" />
      <rect x={-400} y={708} width={2720} height={600} fill="#19232F" />

      {/* window: dark night outside */}
      <g>
        <rect x={w.x - 14} y={w.y - 14} width={w.w + 28} height={w.h + 28} fill="#1A2533" />
        <rect x={w.x} y={w.y} width={w.w} height={w.h} fill="url(#nightSky)" />
        {/* distant buildings */}
        <path
          d={`M ${w.x} ${w.y + w.h} L ${w.x} ${w.y + w.h * 0.62} L ${w.x + 60} ${w.y + w.h * 0.62} L ${w.x + 60} ${w.y + w.h * 0.5} L ${w.x + 130} ${w.y + w.h * 0.5} L ${w.x + 130} ${w.y + w.h * 0.68} L ${w.x + 210} ${w.y + w.h * 0.68} L ${w.x + 210} ${w.y + w.h * 0.44} L ${w.x + 270} ${w.y + w.h * 0.44} L ${w.x + 270} ${w.y + w.h * 0.6} L ${w.x + w.w} ${w.y + w.h * 0.6} L ${w.x + w.w} ${w.y + w.h} Z`}
          fill="#0B111A"
        />
        {cityLights.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.r * 0.45}
            fill={c.warm ? '#E9B871' : '#9DB6D6'}
            opacity={0.22 + 0.12 * Math.sin(t * 0.4 + c.f * 6)}
          />
        ))}
        {/* mullions */}
        <rect x={w.x + w.w / 2 - 5} y={w.y} width={10} height={w.h} fill="#1A2533" />
        <rect x={w.x} y={w.y + w.h * 0.42 - 5} width={w.w} height={10} fill="#1A2533" />
        {/* cold edge light on the frame */}
        <rect x={w.x - 14} y={w.y - 14} width={w.w + 28} height={4} fill="#3D506A" />
        {/* sill */}
        <rect x={w.x - 30} y={w.y + w.h + 12} width={w.w + 60} height={14} fill="#223042" />
        <rect x={w.x - 30} y={w.y + w.h + 12} width={w.w + 60} height={3} fill="#3D506A" />
        {/* faint reflection of the lamp in the glass */}
        <Glow cx={w.x + w.w * 0.78} cy={w.y + w.h * 0.3} rx={26} ry={20} color={OFFICE.lampLight} opacity={0.12} />
      </g>

      {/* shelves with law folders */}
      <g>
        <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} fill="#1A222D" />
        {rows.map((r) => {
          const y = sh.y + 18 + r * (sh.h / 3);
          const rowH = sh.h / 3 - 26;
          let x = sh.x + 12;
          const items = binders.slice(r * 13, r * 13 + 13);
          return (
            <g key={r}>
              {items.map((b) => {
                const bx = x;
                x += b.w + 2;
                if (bx + b.w > sh.x + sh.w - 12) return null;
                const bh = rowH * b.h;
                return (
                  <g key={b.i} transform={b.lean ? `rotate(${b.lean} ${bx + b.w} ${y + rowH})` : undefined}>
                    <rect x={bx} y={y + rowH - bh} width={b.w} height={bh} fill={b.c} />
                    <rect x={bx + 3} y={y + rowH - bh + bh * 0.18} width={b.w - 6} height={bh * 0.14} fill="#C9C1AE" opacity={0.35} />
                  </g>
                );
              })}
              <rect x={sh.x} y={y + rowH} width={sh.w} height={10} fill="#2C2620" />
              <rect x={sh.x} y={y + rowH} width={sh.w} height={2} fill="#4A4036" />
            </g>
          );
        })}
        <rect x={sh.x - 10} y={sh.y - 12} width={sh.w + 20} height={12} fill="#2C2620" />
        <rect x={sh.x - 10} y={sh.y} width={10} height={sh.h} fill="#241E19" />
        <rect x={sh.x + sh.w} y={sh.y} width={10} height={sh.h} fill="#241E19" />
        {/* the shelves sit in the cold dark, away from the lamp */}
        <rect x={sh.x - 12} y={sh.y - 14} width={sh.w + 24} height={sh.h + 20} fill="#0D131B" opacity={0.55} />
      </g>
      {/* room light falloff: everything far from the lamp sinks into the dark */}
      <rect x={-400} y={-200} width={2720} height={1480} fill="url(#roomFalloff)" />
    </g>
  );
};

export const OfficeChair: React.FC = () => (
  <g>
    {/* backrest */}
    <path d="M 548 470 C 540 520 538 640 552 760 L 600 762 C 592 650 594 540 604 478 C 590 466 562 464 548 470 Z" fill="#14171C" />
    <path d="M 556 482 C 550 540 548 640 558 750" fill="none" stroke="#2A2F38" strokeWidth={3} />
    {/* seat */}
    <path d="M 552 772 C 600 764 700 764 772 772 C 778 788 776 800 768 806 L 556 806 C 548 798 546 786 552 772 Z" fill="#191C22" />
    {/* post */}
    <rect x={640} y={806} width={18} height={160} fill="#101215" />
  </g>
);

/** Desk seen from the side: top surface (band) with wood grain, front edge, apron. */
export const DeskSide: React.FC<{lampPool?: number}> = ({lampPool = 1}) => {
  const {x0, x1, y0, y1, edge} = OFFICE.desk;
  const rand = mulberry32(77);
  const grains = Array.from({length: 46}, () => {
    const y = y0 + 2 + rand() * (y1 - y0 - 4);
    const amp = 0.4 + rand() * 1.4;
    const ph = rand() * 10;
    const sx = x0 + rand() * 120;
    const ex = x1 - rand() * 120;
    const pts: string[] = [];
    for (let x = sx; x <= ex; x += 14) {
      pts.push(`${x.toFixed(1)},${(y + Math.sin(x * 0.011 + ph) * amp + Math.sin(x * 0.047 + ph * 2) * amp * 0.3).toFixed(2)}`);
    }
    return {pts: pts.join(' '), dark: rand() > 0.35, w: 0.35 + rand() * 0.9, o: 0.2 + rand() * 0.45};
  });
  return (
    <g>
      <defs>
        <linearGradient id="deskTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4F321F" />
          <stop offset="1" stopColor="#6A432A" />
        </linearGradient>
        <radialGradient id="lampPool" gradientUnits="userSpaceOnUse" cx={1110} cy={618} r={1} gradientTransform="translate(1110 618) scale(380 60) translate(-1110 -618)">
          <stop offset="0" stopColor="#FFC47A" stopOpacity={0.75} />
          <stop offset="0.45" stopColor="#E89B55" stopOpacity={0.35} />
          <stop offset="1" stopColor="#E89B55" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* apron + legs in deep shadow */}
      <rect x={x0 + 10} y={y1 + edge} width={x1 - x0 - 20} height={46} fill="#1C130D" />
      <rect x={x0 + 14} y={y1 + edge} width={30} height={400} fill="#1A110B" />
      <rect x={x1 - 44} y={y1 + edge} width={30} height={400} fill="#1A110B" />
      {/* top surface */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#deskTop)" />
      {grains.map((g, i) => (
        <polyline key={i} points={g.pts} fill="none" stroke={g.dark ? '#2E1B0F' : '#8A5B38'} strokeWidth={g.w} opacity={g.o} />
      ))}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#lampPool)" opacity={lampPool} style={{mixBlendMode: 'screen'}} />
      {/* far edge line */}
      <rect x={x0} y={y0 - 1} width={x1 - x0} height={1.5} fill="#24160D" />
      {/* near edge (front face of the top) */}
      <rect x={x0} y={y1} width={x1 - x0} height={edge} fill="#3A2416" />
      <rect x={x0} y={y1} width={x1 - x0} height={1.6} fill="#A06A3F" opacity={0.75} />
      <rect x={x0} y={y1 + edge - 2} width={x1 - x0} height={2} fill="#140C07" />
      {/* end grain of the desk (left end, facing camera side) */}
      <path d={`M ${x0} ${y0} L ${x0 - 6} ${y0 + 6} L ${x0 - 6} ${y1 + edge} L ${x0} ${y1 + edge} Z`} fill="#2A1A10" />
    </g>
  );
};

/** Laptop from the side: base slab + open lid, screen facing left (toward Varun). */
export const LaptopSide: React.FC<{glow?: number; glowColor?: string}> = ({glow = 1, glowColor = OFFICE.screen}) => {
  const {x0, x1, y, lidLen, lidAngle} = OFFICE.laptop;
  const a = (lidAngle * Math.PI) / 180;
  // Lid tilts back a little past vertical.
  const ty = y + Math.sin(a) * lidLen;
  return (
    <g>
      {/* soft spill of the screen onto the desk in front of it */}
      <Glow cx={x0 + 10} cy={y + 2} rx={150} ry={14} color={glowColor} opacity={0.35 * glow} />
      <ellipse cx={(x0 + x1) / 2} cy={y + 1} rx={(x1 - x0) / 2 + 6} ry={3} fill="#000" opacity={0.45} />
      {/* base */}
      <path d={`M ${x0} ${y - 8} L ${x1} ${y - 9} L ${x1 + 2} ${y} L ${x0 + 4} ${y} Q ${x0} ${y} ${x0} ${y - 4} Z`} fill="#2B2F37" />
      <rect x={x0 + 2} y={y - 9} width={x1 - x0 - 2} height={1.5} fill="#6C7482" />
      {/* lid */}
      <g transform={`translate(${x1} ${y - 8}) rotate(${lidAngle})`}>
        <rect x={0} y={-6} width={lidLen} height={7} rx={2} fill="#2B2F37" />
        {/* screen face, glowing (faces Varun) */}
        <rect x={4} y={1} width={lidLen - 8} height={2.2} fill={glowColor} opacity={0.95 * glow} />
      </g>
      {/* soft spill of the screen into the air in front of it */}
      <Glow cx={x1 - 40} cy={ty + 60} rx={110} ry={80} color={glowColor} opacity={0.16 * glow} />
    </g>
  );
};

/** Anglepoise desk lamp with a warm cone of light. */
export const DeskLamp: React.FC<{on?: number}> = ({on = 1}) => {
  const {baseX, baseY, shadeX, shadeY} = OFFICE.lamp;
  const elbowX = baseX + 10;
  const elbowY = baseY - 150;
  return (
    <g>
      <defs>
        <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD79A" stopOpacity={0.4} />
          <stop offset="1" stopColor="#FFD79A" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* volumetric cone */}
      <path
        d={`M ${shadeX - 34} ${shadeY + 28} L ${shadeX + 24} ${shadeY + 40} L ${shadeX + 120} ${baseY + 10} L ${shadeX - 360} ${baseY + 10} Z`}
        fill="url(#lampCone)"
        opacity={0.55 * on}
        style={{mixBlendMode: 'screen'}}
      />
      {/* base */}
      <ellipse cx={baseX} cy={baseY + 2} rx={44} ry={5} fill="#000" opacity={0.4} />
      <path d={`M ${baseX - 36} ${baseY} Q ${baseX - 34} ${baseY - 12} ${baseX} ${baseY - 13} Q ${baseX + 34} ${baseY - 12} ${baseX + 36} ${baseY} Z`} fill="#171B20" />
      <path d={`M ${baseX - 30} ${baseY - 6} Q ${baseX} ${baseY - 14} ${baseX + 20} ${baseY - 9}`} fill="none" stroke="#C88E52" strokeWidth={1.4} opacity={0.5 * on} />
      {/* arms */}
      <line x1={baseX} y1={baseY - 12} x2={elbowX} y2={elbowY} stroke="#171B20" strokeWidth={7} strokeLinecap="round" />
      <line x1={baseX + 8} y1={baseY - 12} x2={elbowX + 8} y2={elbowY} stroke="#171B20" strokeWidth={2.5} />
      <line x1={elbowX} y1={elbowY} x2={shadeX + 26} y2={shadeY - 6} stroke="#171B20" strokeWidth={6} strokeLinecap="round" />
      <circle cx={elbowX} cy={elbowY} r={7} fill="#1E2329" />
      {/* spring */}
      <line x1={baseX - 6} y1={baseY - 40} x2={elbowX - 8} y2={elbowY + 30} stroke="#3A3F46" strokeWidth={1.6} strokeDasharray="2 2" />
      {/* shade: cone pointing down-left */}
      <g transform={`translate(${shadeX} ${shadeY}) rotate(28)`}>
        <path d="M -12 -22 L 22 -22 L 46 26 L -38 26 Z" fill="#1A1E23" />
        <path d="M -12 -22 L 22 -22 L 24 -17 L -13 -17 Z" fill="#2E343B" />
        <ellipse cx={4} cy={26} rx={42} ry={7} fill="#FFE1A8" opacity={on} />
        <ellipse cx={4} cy={24} rx={18} ry={5} fill="#FFF4DD" opacity={on} />
      </g>
      <Glow cx={shadeX + 2} cy={shadeY + 36} rx={90} ry={60} color="#FFC67E" opacity={0.55 * on} />
    </g>
  );
};
