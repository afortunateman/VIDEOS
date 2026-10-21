import React from 'react';
import {CameraLayer, cameraAt, handheld} from '../../camera/Camera';
import {Glow, LightPass} from '../../art/LightPass';
import {VarunGodCloseUp} from '../../characters/VarunGod';
import {blinkAt} from '../../characters/VarunFace';
import {OFFICE} from '../../props/Office';
import {S1} from '../../timeline/timeline';
import {easeInOutSine, keyed} from '../../utils/easing';
import {drift, mulberry32} from '../../utils/seededRandom';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
    {children}
  </svg>
);

const HEAD = {x: 1130, y: 500, s: 2.3};

/** Shot D: close-up of his face lit by the laptop. He stares at the cursor, then reaches for the keys. */
export const ShotFace: React.FC<{t: number}> = ({t}) => {
  const cam = cameraAt(
    [
      {t: S1.shotFace, x: 1010, y: 540, zoom: 1.0},
      {t: S1.shotTyping, x: 1030, y: 530, zoom: 1.045, ease: easeInOutSine},
    ],
    t,
  );
  const shake = handheld(t, 1.6, 0.3, 41);
  const rel = t - S1.shotFace;
  const reach = keyed(t, [
    [S1.handsToKeys - 0.15, 0],
    [S1.handsToKeys + 0.55, 1],
  ]);
  const breath = Math.sin(rel * 1.3 + 0.5) * 3;
  const blink = blinkAt(t, [S1.shotFace + 0.85, S1.handsToKeys + 0.62]);
  // Eyes on the cursor; a glance down at the keys as the hands move, then back.
  const lookY = keyed(t, [
    [S1.handsToKeys - 0.1, 0.55],
    [S1.handsToKeys + 0.2, 1.25],
    [S1.handsToKeys + 0.75, 1.25],
    [S1.handsToKeys + 1.05, 0.6],
  ]);
  const lookX = -0.42 + drift(t * 0.8, 6) * 0.04;
  const headTilt = 2 + reach * 2.5 + drift(t * 0.25, 8) * 0.6;
  const rand = mulberry32(5);
  const bokeh = Array.from({length: 14}, () => ({
    x: 120 + rand() * 640,
    y: 260 + rand() * 420,
    r: 14 + rand() * 28,
    warm: rand() > 0.6,
  }));

  const bust = (
    <g transform={`translate(${HEAD.x} ${HEAD.y + reach * 14}) scale(${HEAD.s * (1 + reach * 0.012)})`}>
      <VarunGodCloseUp blink={blink} lookX={lookX} lookY={lookY} breath={breath} headTilt={headTilt} state="neutral" catchlight={0.9} />
    </g>
  );

  return (
    <>
      {/* behind him: the dark office, the window's city lights as soft bokeh */}
      <CameraLayer cam={cam} depth={0.8} shake={shake} style={{filter: 'blur(14px)'}}>
        <Svg>
          <defs>
            <linearGradient id="faceBg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#141D29" />
              <stop offset="1" stopColor="#0C1118" />
            </linearGradient>
          </defs>
          <rect x={-400} y={-200} width={2720} height={1480} fill="url(#faceBg)" />
          <rect x={60} y={200} width={760} height={560} fill="#070A10" />
          <rect x={60} y={200} width={760} height={8} fill="#2A3A50" />
          <rect x={430} y={200} width={14} height={560} fill="#1A2533" />
          {bokeh.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.warm ? '#E9B871' : '#9DB6D6'} opacity={0.18} />
          ))}
          <Glow cx={1780} cy={360} rx={300} ry={260} color={OFFICE.lampLight} opacity={0.22} />
        </Svg>
      </CameraLayer>

      <CameraLayer cam={cam} shake={shake}>
        <Svg>
          {bust}
          {/* the laptop: cold light from in front and below */}
          <LightPass color={OFFICE.screen} opacity={0.58} cx={760} cy={760} rx={760} ry={640} core={0.15} blend="screen">
            {bust}
          </LightPass>
          {/* the lamp: a warm edge on the far side of his face */}
          <LightPass color="#F2A65A" opacity={0.7} cx={1560} cy={360} rx={330} ry={420} blend="screen">
            {bust}
          </LightPass>
        </Svg>
      </CameraLayer>
    </>
  );
};
