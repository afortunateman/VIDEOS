import React from 'react';
import {C, DESK, FLOOR_Y, Soft} from './Room';
import {SnowGlobe} from '../props/SnowGlobe';
import {mulberry32} from '../utils/seededRandom';

const {x0, x1, y0, y1, edge} = DESK;

export const LAMP = {baseX: 1418, baseY: 600, shadeX: 1300, shadeY: 400};
export const LAPTOP = {x0: 1035, x1: 1188, y: 612};

export const Chair: React.FC = () => (
  <g>
    {/* gas lift and star base */}
    <rect x={636} y={800} width={16} height={60} fill="#0c0e11" />
    <rect x={632} y={790} width={24} height={20} rx={4} fill="#14171b" />
    <path d={`M 520 ${FLOOR_Y - 26} L 770 ${FLOOR_Y - 26} L 770 ${FLOOR_Y - 16} L 520 ${FLOOR_Y - 16} Z`} fill="#0c0e11" />
    {[530, 640, 760].map((x) => (
      <g key={x}>
        <circle cx={x} cy={FLOOR_Y - 8} r={9} fill="#08090b" />
        <circle cx={x - 2} cy={FLOOR_Y - 10} r={3} fill="#2b3240" />
      </g>
    ))}
    {/* seat */}
    <path d="M 548 760 C 600 748 720 748 780 760 C 790 776 786 792 774 798 L 556 798 C 544 790 542 774 548 760 Z" fill="#16191e" />
    <path d="M 552 762 C 610 752 716 752 776 762" stroke="#3a4352" strokeWidth={3} fill="none" opacity={0.6} />
    {/* backrest: mesh with frame */}
    <path d="M 552 432 C 532 470 528 600 540 742 L 600 746 C 592 620 594 500 612 446 C 596 428 570 424 552 432 Z" fill="#0f1215" />
    <path d="M 552 432 C 532 470 528 600 540 742" stroke="#5a7090" strokeWidth={3} fill="none" opacity={0.45} />
    {Array.from({length: 12}, (_, i) => (
      <path key={i} d={`M ${548 + i * 0.5} ${450 + i * 24} C ${570} ${446 + i * 24} ${590} ${448 + i * 24} ${604 - i * 0.3} ${452 + i * 24}`} stroke="#1f252d" strokeWidth={1.2} fill="none" />
    ))}
    {/* armrest */}
    <path d="M 600 700 L 700 700 C 708 700 710 712 702 714 L 610 714 Z" fill="#14171b" />
    <rect x={612} y={712} width={12} height={50} fill="#101215" />
  </g>
);

export const DeskBody: React.FC = () => {
  const rand = mulberry32(77);
  const grains = Array.from({length: 60}, () => {
    const y = y0 + 2 + rand() * (y1 - y0 - 4);
    const amp = 0.4 + rand() * 1.2;
    const ph = rand() * 10;
    const sx = x0 + rand() * 200;
    const ex = x1 - rand() * 200;
    const pts: string[] = [];
    for (let x = sx; x <= ex; x += 12) pts.push(`${x.toFixed(1)},${(y + Math.sin(x * 0.012 + ph) * amp).toFixed(2)}`);
    return {pts: pts.join(' '), dark: rand() > 0.4, w: 0.4 + rand() * 0.9, o: 0.15 + rand() * 0.35};
  });
  return (
    <g>
      <defs>
        <linearGradient id="stDeskTop" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2a16" />
          <stop offset="0.35" stopColor="#8c5329" />
          <stop offset="0.6" stopColor={C.woodLit} />
          <stop offset="0.85" stopColor="#8c5329" />
          <stop offset="1" stopColor="#4a2a16" />
        </linearGradient>
        <linearGradient id="stDeskEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a170c" />
          <stop offset="0.55" stopColor="#5c351b" />
          <stop offset="1" stopColor="#2a170c" />
        </linearGradient>
      </defs>
      {/* pedestal of drawers at the far end */}
      <rect x={1270} y={y1 + edge} width={190} height={FLOOR_Y - y1 - edge} fill="#24140a" />
      <rect x={1282} y={y1 + edge + 14} width={166} height={FLOOR_Y - y1 - edge - 30} fill="#1c0f07" />
      <rect x={1282} y={y1 + edge + 14} width={166} height={2} fill="#000" opacity={0.6} />
      <Soft d={`M 1270 ${y1 + edge} L 1460 ${y1 + edge} L 1460 ${y1 + edge + 90} L 1270 ${y1 + edge + 90} Z`} fill="#000" o={0.6} blur={16} />
      {/* near leg + modesty panel */}
      <rect x={x0 + 14} y={y1 + edge} width={34} height={FLOOR_Y - y1 - edge} fill="#22130a" />
      <rect x={x0 + 14} y={y1 + edge} width={4} height={FLOOR_Y - y1 - edge} fill="#5c351b" opacity={0.6} />
      <rect x={x0 + 48} y={y1 + edge} width={1270 - x0 - 48} height={70} fill="#1a0e07" />
      <Soft d={`M ${x0 + 40} ${y1 + edge} L 1270 ${y1 + edge} L 1270 ${y1 + edge + 60} L ${x0 + 40} ${y1 + edge + 60} Z`} fill="#000" o={0.5} blur={10} />
      {/* top surface */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#stDeskTop)" />
      {grains.map((g, i) => (
        <polyline key={i} points={g.pts} fill="none" stroke={g.dark ? '#2e170a' : '#e2a061'} strokeWidth={g.w} opacity={g.o} />
      ))}
      {/* lamp pool, brightest under the shade */}
      <Soft d={`M 950 ${y0 + 4} L 1420 ${y0 + 4} L 1440 ${y1} L 920 ${y1} Z`} fill="#ffcf8a" o={0.45} blur={16} blend="screen" />
      {/* screen spill on the wood in front of the laptop */}
      <Soft d={`M ${LAPTOP.x0 - 140} ${y0 + 10} L ${LAPTOP.x0} ${y0 + 10} L ${LAPTOP.x0} ${y1 - 6} L ${LAPTOP.x0 - 160} ${y1 - 6} Z`} fill={C.screen} o={0.22} blur={10} blend="screen" />
      {/* front edge */}
      <rect x={x0} y={y1} width={x1 - x0} height={edge} fill="url(#stDeskEdge)" />
      <rect x={x0} y={y1} width={x1 - x0} height={2} fill="#f0b070" opacity={0.6} />
      <rect x={x0} y={y1 + edge - 3} width={x1 - x0} height={3} fill="#0d0603" />
      <path d={`M ${x0} ${y0} L ${x0 - 8} ${y0 + 8} L ${x0 - 8} ${y1 + edge} L ${x0} ${y1 + edge} Z`} fill="#1d1008" />
    </g>
  );
};

const Folders: React.FC = () => (
  <g transform="translate(1188 600)">
    <Soft d="M -6 0 L 120 0 L 124 6 L -10 6 Z" fill="#000" o={0.5} blur={4} />
    {[
      ['#7a2f2a', 0, 10],
      ['#c8b48a', 3, 6],
      ['#33465e', -2, 11],
      ['#e8e0cc', 6, 4],
      ['#5a6b45', 1, 10],
      ['#e8e0cc', -1, 4],
      ['#8a3b2c', 2, 9],
    ].map(([c, dx, h], i, arr) => {
      const y = -arr.slice(0, i + 1).reduce((s, a) => s + (a[2] as number), 0);
      return (
        <g key={i}>
          <rect x={(dx as number) + 0} y={y} width={112} height={h as number} fill={c as string} />
          <rect x={(dx as number) + 0} y={y} width={112} height={1.2} fill="#fff" opacity={0.18} />
        </g>
      );
    })}
    {/* a paper sticking out with a tab */}
    <rect x={20} y={-30} width={104} height={3} fill="#f2ead8" />
    <rect x={96} y={-46} width={14} height={8} fill="#e3c45a" />
    <Soft d="M -10 -70 L 140 -70 L 140 4 L -10 4 Z" fill={C.lamp} o={0.28} blur={10} blend="screen" />
  </g>
);

const Mug: React.FC = () => (
  <g transform="translate(1216 626)">
    <Soft d="M -26 0 L 26 0 L 30 6 L -30 6 Z" fill="#000" o={0.6} blur={4} />
    <path d="M -20 0 L 20 0 L 22 -48 L -22 -48 Z" fill="#2c4258" />
    <path d="M 22 -40 C 40 -40 40 -14 20 -12" stroke="#2c4258" strokeWidth={7} fill="none" />
    <path d="M -22 -48 L 22 -48" stroke="#5a7a9a" strokeWidth={3} />
    <Soft d="M 4 -46 L 22 -46 L 20 0 L 8 0 Z" fill={C.lamp} o={0.55} blur={4} blend="screen" />
    <rect x={-6} y={-36} width={14} height={14} rx={2} fill="#e8dcc0" opacity={0.6} />
    {/* steam */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M ${-6 + i * 8} -52 C ${-14 + i * 8} -72 ${4 + i * 8} -86 ${-4 + i * 6} -112`}
        stroke="#ffe7c2"
        strokeWidth={4}
        fill="none"
        opacity={0.13}
        strokeLinecap="round"
        filter="url(#stBlur4)"
      />
    ))}
  </g>
);

const Phone: React.FC = () => (
  <g transform="translate(978 628)">
    <Soft d="M -40 0 L 40 0 L 42 4 L -42 4 Z" fill="#000" o={0.6} blur={3} />
    <rect x={-38} y={-6} width={76} height={6} rx={3} fill="#0d0f13" />
    <rect x={-36} y={-6} width={72} height={1.2} fill="#7da0d0" opacity={0.5} />
  </g>
);

const PenCup: React.FC = () => (
  <g transform="translate(1352 598)">
    <path d="M -14 0 L 14 0 L 12 -38 L -12 -38 Z" fill="#191c22" />
    <line x1={-4} y1={-38} x2={-12} y2={-80} stroke="#c23b2a" strokeWidth={4} strokeLinecap="round" />
    <line x1={2} y1={-38} x2={6} y2={-86} stroke="#e0c050" strokeWidth={4} strokeLinecap="round" />
    <line x1={6} y1={-38} x2={16} y2={-74} stroke="#20252c" strokeWidth={5} strokeLinecap="round" />
    <Soft d="M 2 -38 L 14 -38 L 14 0 L 4 0 Z" fill={C.lamp} o={0.5} blur={3} blend="screen" />
  </g>
);

export const Laptop: React.FC = () => {
  const {x0: a, x1: b, y} = LAPTOP;
  const lidLen = 140;
  const ang = -79;
  const rad = (ang * Math.PI) / 180;
  const topX = b + Math.cos(rad) * lidLen;
  const topY = y - 9 + Math.sin(rad) * lidLen;
  return (
    <g>
      <Soft d={`M ${a - 6} ${y} L ${b + 8} ${y} L ${b + 10} ${y + 5} L ${a - 10} ${y + 5} Z`} fill="#000" o={0.7} blur={3} />
      {/* base */}
      <path d={`M ${a} ${y - 9} L ${b} ${y - 10} L ${b + 3} ${y} L ${a + 5} ${y} Q ${a} ${y} ${a} ${y - 4} Z`} fill="#2a2f38" />
      <rect x={a + 2} y={y - 10} width={b - a - 2} height={1.6} fill="#9fb4d4" opacity={0.7} />
      <rect x={a + 4} y={y - 3} width={b - a - 6} height={1} fill="#000" opacity={0.6} />
      {/* lid */}
      <g transform={`translate(${b} ${y - 9}) rotate(${ang})`}>
        <rect x={0} y={-7} width={lidLen} height={8} rx={2.5} fill="#2a2f38" />
        <rect x={0} y={-7} width={lidLen} height={1.5} fill="#ffcf8a" opacity={0.5} />
        <rect x={6} y={1} width={lidLen - 12} height={2.4} fill={C.screen} />
      </g>
      {/* the screen's glow pushing into the dark air toward his face */}
      <Soft d={`M ${b - 4} ${y - 12} L ${topX - 2} ${topY} L ${b - 380} ${topY - 150} L ${b - 420} ${y + 30} Z`} fill={C.screen} o={0.1} blur={40} blend="screen" />
    </g>
  );
};

export const Lamp: React.FC = () => {
  const {baseX, baseY, shadeX, shadeY} = LAMP;
  const ex = baseX + 16;
  const ey = baseY - 160;
  return (
    <g>
      {/* volumetric cone with dust */}
      <Soft d={`M ${shadeX - 40} ${shadeY + 26} L ${shadeX + 18} ${shadeY + 46} L ${shadeX + 110} ${baseY + 6} L ${shadeX - 380} ${baseY + 6} Z`} fill="#ffd391" o={0.22} blur={16} blend="screen" />
      <Soft d={`M ${shadeX - 20} ${shadeY + 34} L ${shadeX + 4} ${shadeY + 40} L ${shadeX - 40} ${baseY} L ${shadeX - 190} ${baseY} Z`} fill="#ffe3b0" o={0.14} blur={10} blend="screen" />
      {(() => {
        const r = mulberry32(9);
        return Array.from({length: 60}, (_, i) => {
          const t = r();
          const yy = shadeY + 40 + t * (baseY - shadeY - 50);
          const spread = (yy - shadeY) / (baseY - shadeY);
          const xx = shadeX - 10 - spread * 200 + r() * spread * 290;
          return <circle key={i} cx={xx} cy={yy} r={0.6 + r() * 1.4} fill="#fff1d6" opacity={0.25 + r() * 0.5} />;
        });
      })()}
      {/* base */}
      <Soft d={`M ${baseX - 52} ${baseY} L ${baseX + 52} ${baseY} L ${baseX + 56} ${baseY + 6} L ${baseX - 56} ${baseY + 6} Z`} fill="#000" o={0.6} blur={4} />
      <path d={`M ${baseX - 42} ${baseY} Q ${baseX - 40} ${baseY - 14} ${baseX} ${baseY - 15} Q ${baseX + 40} ${baseY - 14} ${baseX + 42} ${baseY} Z`} fill="#14181d" />
      <path d={`M ${baseX - 36} ${baseY - 6} Q ${baseX - 10} ${baseY - 16} ${baseX + 14} ${baseY - 12}`} stroke="#d99b5a" strokeWidth={2} fill="none" opacity={0.6} />
      {/* arms with springs */}
      <line x1={baseX} y1={baseY - 14} x2={ex} y2={ey} stroke="#14181d" strokeWidth={8} strokeLinecap="round" />
      <line x1={baseX + 10} y1={baseY - 14} x2={ex + 10} y2={ey + 4} stroke="#14181d" strokeWidth={3} />
      <line x1={baseX - 1} y1={baseY - 14} x2={ex - 1} y2={ey} stroke="#d99b5a" strokeWidth={1.4} opacity={0.5} />
      <path d={`M ${baseX - 8} ${baseY - 40} L ${ex - 8} ${ey + 40}`} stroke="#5a5f66" strokeWidth={3} strokeDasharray="2 1.5" />
      <line x1={ex} y1={ey} x2={shadeX + 30} y2={shadeY - 8} stroke="#14181d" strokeWidth={7} strokeLinecap="round" />
      <line x1={ex} y1={ey - 1} x2={shadeX + 30} y2={shadeY - 9} stroke="#d99b5a" strokeWidth={1.4} opacity={0.4} />
      <path d={`M ${ex - 4} ${ey - 10} L ${shadeX + 40} ${shadeY + 4}`} stroke="#5a5f66" strokeWidth={3} strokeDasharray="2 1.5" />
      <circle cx={ex} cy={ey} r={8} fill="#1c2026" />
      <circle cx={ex} cy={ey} r={3} fill="#5a5f66" />
      {/* shade */}
      <g transform={`translate(${shadeX} ${shadeY}) rotate(30)`}>
        <path d="M -12 -26 L 24 -26 L 50 28 L -42 28 Z" fill="#171b20" />
        <path d="M -12 -26 L 24 -26 L 26 -20 L -14 -20 Z" fill="#3a4048" />
        <path d="M 24 -26 L 50 28 L 44 28 L 20 -24 Z" fill="#000" opacity={0.4} />
        <path d="M -12 -26 L -42 28 L -36 28 Z" fill="#c98a4c" opacity={0.5} />
        <ellipse cx={4} cy={28} rx={46} ry={8} fill="#ffdca0" />
        <ellipse cx={4} cy={26} rx={20} ry={5} fill="#fffaf0" />
      </g>
      <Soft d={`M ${shadeX - 80} ${shadeY - 20} a 90 70 0 1 0 180 0 a 90 70 0 1 0 -180 0`} fill="#ffc06e" o={0.5} blur={24} blend="screen" />
    </g>
  );
};

export const DeskProps: React.FC = () => (
  <g>
    <Folders />
    <PenCup />
    {/* the snow globe: present, dim, out of focus, forgettable */}
    <g transform="translate(1302 566)" filter="url(#stBlur4)" opacity={0.7}>
      <g style={{filter: 'brightness(0.45) saturate(0.6)'}}>
        <SnowGlobe r={24} shine={0.15} lampSide={0.7} />
      </g>
    </g>
    <Laptop />
    <Mug />
    <Phone />
    {/* papers fanned near his elbow */}
    <g transform="translate(860 618)">
      <path d="M 0 0 L 120 -4 L 124 2 L 2 6 Z" fill="#d9d2c0" opacity={0.85} />
      <path d="M 10 -3 L 128 -2 L 130 3 L 10 3 Z" fill="#ece5d2" opacity={0.85} />
      <Soft d="M 0 -6 L 140 -6 L 140 8 L 0 8 Z" fill={C.lamp} o={0.3} blur={6} blend="screen" />
    </g>
  </g>
);
