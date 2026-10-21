import React from 'react';
import {CameraLayer, CamKey, cameraAt, handheld} from '../../camera/Camera';
import {Glow, LightPass} from '../../art/LightPass';
import {DocumentScreen, DOC_LAYOUT, SCREEN_H, SCREEN_W} from '../../props/LaptopScreen';
import {TypingHands, fingerPresses} from '../../characters/TypingHands';
import {GOD_HAND_DARK} from '../../characters/VarunGod';
import {OFFICE} from '../../props/Office';
import {S1} from '../../timeline/timeline';
import {cursorOn, visibleCount} from '../../utils/typewriter';
import {easeInCubic, easeInOutSine, easeOutCubic, progress} from '../../utils/easing';
import {drift, mulberry32} from '../../utils/seededRandom';
import {S1_KEY_TIMES} from './typing';

// Laptop placement in this shot's world.
const SCR = {x: 620, y: 150, s: 0.64};
const toWorld = (sx: number, sy: number) => ({x: SCR.x + sx * SCR.s, y: SCR.y + sy * SCR.s});
const TITLE = toWorld(DOC_LAYOUT.pageX + DOC_LAYOUT.pageW / 2, DOC_LAYOUT.titleY);
const LINE = toWorld(DOC_LAYOUT.pageX + DOC_LAYOUT.marginX + 300, DOC_LAYOUT.bodyY);
const CURSOR0 = toWorld(DOC_LAYOUT.pageX + DOC_LAYOUT.marginX, DOC_LAYOUT.bodyY);
const LINE_END = toWorld(DOC_LAYOUT.pageX + DOC_LAYOUT.marginX + 520, DOC_LAYOUT.bodyY);

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
    {children}
  </svg>
);

/** Shot C (blank page) and shot E (typing, push into the words). */
export const ShotScreen: React.FC<{t: number; phase: 'blank' | 'typing'}> = ({t, phase}) => {
  const keys: CamKey[] =
    phase === 'blank'
      ? [
          {t: S1.shotOts, x: 1000, y: 500, zoom: 1.0},
          {t: S1.shotFace, x: (TITLE.x + CURSOR0.x) / 2 + 40, y: (TITLE.y + CURSOR0.y) / 2 + 30, zoom: 1.2, ease: easeInOutSine},
        ]
      : [
          {t: S1.shotTyping, x: 1010, y: 560, zoom: 1.04},
          {t: S1.lineComplete, x: LINE.x, y: LINE.y + 40, zoom: 1.7, ease: easeInOutSine},
          {t: S1.warmStart + 0.5, x: LINE.x + 20, y: LINE.y + 10, zoom: 2.15, ease: easeInOutSine},
          {t: 24, x: LINE_END.x - 120, y: LINE_END.y, zoom: 5.2, ease: easeInCubic},
        ];
  const cam = cameraAt(keys, t);
  const shake = handheld(t, 1.4, 0.32, 21);

  const n = phase === 'typing' ? visibleCount(S1_KEY_TIMES, t) : 0;
  const typed = S1.typedLine.slice(0, n);
  const lastKey = n > 0 ? S1_KEY_TIMES[n - 1] : null;
  const cursorVisible = cursorOn(t, S1.cursorBlink, phase === 'typing' ? lastKey : null);
  const presses = fingerPresses(S1.typedLine, S1_KEY_TIMES, t);

  const warm = phase === 'typing' ? progress(t, S1.warmStart, S1.dissolveStart + 0.5, easeInOutSine) : 0;
  const haze = phase === 'typing' ? progress(t, S1.warmStart + 1.3, 24, easeInOutSine) : 0;
  const textBlur = phase === 'typing' ? progress(t, S1.dissolveStart - 1.0, 24, easeInCubic) * 12 : 0;
  // Candle flicker creeps in as the screen turns to flame-light.
  const flicker = 1 + (drift(t * 6, 13) * 0.06 + drift(t * 13, 14) * 0.03) * haze;
  const bokehIn = phase === 'typing' ? progress(t, S1.dissolveStart - 1.2, 24, easeInOutSine) : 0;

  // Hands arrive on the keys slightly before typing and settle.
  const handsIn = progress(t, S1.shotTyping - 0.2, S1.typeStart, easeOutCubic);

  const glowColor = warm > 0 ? mix(OFFICE.screen, '#FFC27A', warm) : OFFICE.screen;
  const z = cam.zoom;

  return (
    <>
      {/* wall behind the laptop, soft */}
      <CameraLayer cam={cam} depth={0.85} shake={shake} style={{filter: `blur(${7 / Math.pow(z, 0.85)}px)`}}>
        <Svg>
          <defs>
            <linearGradient id="otsWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1C2736" />
              <stop offset="1" stopColor="#121A25" />
            </linearGradient>
          </defs>
          <rect x={-600} y={-300} width={3100} height={1700} fill="url(#otsWall)" />
          {/* shelves far right */}
          <rect x={1640} y={150} width={420} height={520} fill="#141B24" />
          {[0, 1, 2].map((r) =>
            Array.from({length: 9}, (_, i) => (
              <rect key={`${r}-${i}`} x={1652 + i * 30} y={175 + r * 170} width={22} height={120 + (i % 3) * 14} fill={['#3A2224', '#1F2B3D', '#2B3528'][(i + r) % 3]} opacity={0.6} />
            )),
          )}
          {/* lamp, out of focus, top right */}
          <Glow cx={1640} cy={300} rx={240} ry={220} color="#F2B66D" opacity={0.35} />
          <Glow cx={1640} cy={300} rx={60} ry={50} color="#FFE2B0" opacity={0.7} />
          {/* desk surface beyond the laptop */}
          <rect x={-600} y={690} width={3100} height={700} fill="#3E2716" />
          <Glow cx={1500} cy={760} rx={700} ry={160} color="#F2B66D" opacity={0.35} />
        </Svg>
      </CameraLayer>

      {/* laptop: lid, glowing screen, keyboard deck */}
      <CameraLayer cam={cam} shake={shake} style={{filter: textBlur > 0.05 ? `blur(${textBlur / z}px)` : undefined}}>
        <Svg>
          <Glow cx={SCR.x + (SCREEN_W * SCR.s) / 2} cy={SCR.y + (SCREEN_H * SCR.s) / 2} rx={760} ry={520} color={glowColor} opacity={0.22 + warm * 0.15} />
          {/* lid back edge + bezel */}
          <rect x={SCR.x - 26} y={SCR.y - 26} width={SCREEN_W * SCR.s + 52} height={SCREEN_H * SCR.s + 44} rx={14} fill="#2A2E36" />
          <rect x={SCR.x - 20} y={SCR.y - 20} width={SCREEN_W * SCR.s + 40} height={SCREEN_H * SCR.s + 34} rx={10} fill="#0C0E12" />
          {/* keyboard deck in perspective */}
          <path d={`M ${SCR.x - 40} ${SCR.y + SCREEN_H * SCR.s + 18} L ${SCR.x + SCREEN_W * SCR.s + 40} ${SCR.y + SCREEN_H * SCR.s + 18} L 1760 1000 L 280 1000 Z`} fill="#2C3038" />
          <path d={`M ${SCR.x - 40} ${SCR.y + SCREEN_H * SCR.s + 18} L ${SCR.x + SCREEN_W * SCR.s + 40} ${SCR.y + SCREEN_H * SCR.s + 18} L ${SCR.x + SCREEN_W * SCR.s + 44} ${SCR.y + SCREEN_H * SCR.s + 24} L ${SCR.x - 44} ${SCR.y + SCREEN_H * SCR.s + 24} Z`} fill="#565D69" />
          {Array.from({length: 5}, (_, row) => {
            const y0 = 700 + row * 46 + row * row * 3;
            const shrink = 1 - (4 - row) * 0.045;
            const w = 1000 * shrink;
            const keysN = 13;
            const kw = w / keysN;
            return Array.from({length: keysN}, (_, k) => (
              <rect key={`${row}-${k}`} x={960 - w / 2 + k * kw + 3} y={y0} width={kw - 6} height={34 + row * 3} rx={5} fill="#16191E" />
            ));
          })}
          {/* the screen's light on the keys */}
          <Glow cx={1000} cy={700} rx={560} ry={80} color={glowColor} opacity={0.18} />
        </Svg>
        <div
          style={{
            position: 'absolute',
            left: SCR.x,
            top: SCR.y,
            width: SCREEN_W,
            height: SCREEN_H,
            transform: `scale(${SCR.s})`,
            transformOrigin: '0 0',
          }}
        >
          <DocumentScreen title={S1.documentTitle} typed={typed} cursorVisible={cursorVisible} warm={warm} />
        </div>
        {/* screen bloom */}
        <div
          style={{
            position: 'absolute',
            left: SCR.x,
            top: SCR.y,
            width: SCREEN_W * SCR.s,
            height: SCREEN_H * SCR.s,
            background: glowColor,
            opacity: 0.1 + haze * 0.25,
            filter: 'blur(24px)',
            mixBlendMode: 'screen',
          }}
        />
        {phase === 'typing' && handsIn > 0 && (
          <Svg>
            {(() => {
              const hands = (
                <g transform={`translate(968 ${840 + (1 - handsIn) * 220}) scale(1.65)`}>
                  <TypingHands presses={presses} palette={GOD_HAND_DARK} t={t} gap={150} />
                </g>
              );
              return (
                <>
                  {hands}
                  <LightPass color={glowColor} opacity={0.5} cx={968} cy={700} rx={600} ry={260} blend="screen">
                    {hands}
                  </LightPass>
                  <LightPass color="#F0A35A" opacity={0.35} cx={1500} cy={850} rx={500} ry={300} blend="screen">
                    {hands}
                  </LightPass>
                </>
              );
            })()}
          </Svg>
        )}
      </CameraLayer>

      {/* his head and shoulder, out of focus in the foreground */}
      <CameraLayer cam={cam} depth={1.25} shake={shake} style={{filter: `blur(${12 / Math.pow(z, 1.25)}px)`}}>
        <Svg>
          {(() => {
            const sil = (
              <g>
                <path d="M -160 1100 C -140 850 -60 720 110 668 C 190 646 300 648 380 672 C 500 720 580 840 610 1100 Z" fill="#0B0E13" />
                <path d="M 190 560 C 196 610 200 650 196 690 L 330 690 C 324 650 326 610 334 560 Z" fill="#0A0C10" />
                {/* back of the head, hair */}
                <path d="M 100 420 C 96 300 170 236 262 236 C 352 236 414 300 410 410 C 408 500 370 570 300 592 C 250 606 200 600 160 570 C 120 540 102 480 100 420 Z" fill="#07080B" />
                <path d="M 110 360 C 140 290 200 250 270 246 C 230 270 200 300 186 340 Z" fill="#14161C" opacity={0.6} />
                {/* ear catching the screen */}
                <path d="M 400 400 C 420 392 430 420 426 446 C 422 470 410 478 400 470 Z" fill="#1A1210" />
              </g>
            );
            return (
              <>
                {sil}
                <LightPass color={glowColor} opacity={0.6} cx={640} cy={430} rx={300} ry={460} blend="screen">
                  {sil}
                </LightPass>
              </>
            );
          })()}
        </Svg>
      </CameraLayer>

      {/* golden haze as the screen turns into candlelight */}
      {haze > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 55% 48%, rgba(255,214,150,1) 0%, rgba(232,160,72,0.8) 40%, rgba(120,62,22,0.75) 100%)',
            mixBlendMode: 'multiply',
            opacity: Math.min(1, haze * 1.1),
          }}
        />
      )}
      {haze > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 55% 50% at 55% 48%, rgba(255,200,120,0.9) 0%, rgba(255,170,80,0.25) 55%, rgba(0,0,0,0) 100%)',
            mixBlendMode: 'screen',
            opacity: haze * 0.55 * flicker,
          }}
        />
      )}
      {bokehIn > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', filter: 'blur(6px)'}}>
          {(() => {
            const rand = mulberry32(99);
            return Array.from({length: 11}, (_, i) => {
              const x = 200 + rand() * 1520;
              const y = 220 + rand() * 640;
              const r = 30 + rand() * 70;
              const ph = rand() * 6;
              const a = bokehIn * (0.25 + 0.2 * Math.sin(t * 2.2 + ph)) * flicker;
              return <circle key={i} cx={x + Math.sin(t * 0.4 + ph) * 12} cy={y - bokehIn * 30} r={r} fill="#FFC272" opacity={a} />;
            });
          })()}
        </svg>
      )}
    </>
  );
};

function mix(a: string, b: string, p: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (v: number, s: number) => (v >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * p);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')}`;
}
