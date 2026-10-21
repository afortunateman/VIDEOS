import React from 'react';
import {CameraLayer, cameraAt, handheld} from '../../camera/Camera';
import {LightPass} from '../../art/LightPass';
import {BackWall, DeskLamp, DeskSide, LaptopSide, OFFICE, OfficeChair} from '../../props/Office';
import {SnowGlobe} from '../../props/SnowGlobe';
import {VarunGodDeskHand, VarunGodFarUpperArm, VarunGodSeatedProfile} from '../../characters/VarunGod';
import {blinkAt} from '../../characters/VarunFace';
import {DustMotes} from '../../fx/DustMotes';
import {S1} from '../../timeline/timeline';
import {easeInOutSine, easeInCubic, easeOutCubic, progress} from '../../utils/easing';
import {drift} from '../../utils/seededRandom';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
    {children}
  </svg>
);

/** Index-finger lift for the TAP. TAP. TAP. Rises, hangs, strikes down on the beat. */
export const tapLift = (t: number, taps: readonly number[]) => {
  let lift = 0;
  for (const T of taps) {
    const rise0 = T - 0.3;
    const rise1 = T - 0.12;
    if (t >= rise0 && t < rise1) lift = Math.max(lift, 0.62 * easeOutCubic((t - rise0) / (rise1 - rise0)));
    else if (t >= rise1 && t < T) lift = Math.max(lift, 0.62 * (1 - easeInCubic((t - rise1) / (T - rise1))));
    else if (t >= T && t < T + 0.12) lift = Math.max(lift, 0.06 * Math.sin(((t - T) / 0.12) * Math.PI));
  }
  return lift;
};

// ECU frames the hand; the pull-out lands on the medium shot of the whole desk.
const ECU = {x: 948, y: 584, zoom: 5.2};
const MEDIUM = {x: 1010, y: 548, zoom: 1.1};

export const ShotDesk: React.FC<{t: number}> = ({t}) => {
  const cam = cameraAt(
    [
      {t: 0, ...ECU},
      {t: S1.pullOutStart, x: ECU.x + 4, y: ECU.y + 1, zoom: ECU.zoom * 1.07, ease: easeInOutSine},
      {t: S1.pullOutEnd, ...MEDIUM, ease: (p) => easeInOutSine(Math.pow(p, 0.85))},
      {t: S1.pullOutEnd + 2, x: MEDIUM.x - 6, y: MEDIUM.y, zoom: MEDIUM.zoom * 1.01, ease: easeInOutSine},
    ],
    t,
  );
  const shake = handheld(t, 1.2 / Math.sqrt(cam.zoom) + 0.3, 0.3, 9);
  // Rack focus: hand sharp first, room resolves as we pull back.
  const focus = progress(t, S1.pullOutStart + 0.4, S1.pullOutEnd - 0.2, easeInOutSine);
  const bgBlur = (1 - focus) * 18 + 1.2;
  const bodyBlur = (1 - focus) * 12;
  const propBlur = (1 - focus) * 9;
  const globeBlur = 3.2 + (1 - focus) * 8;

  const lift = tapLift(t, S1.taps);
  const curl = drift(t * 0.3, 4) * 0.6;
  const breath = Math.sin(t * 1.25) * 0.9;
  const blink = blinkAt(t, [4.7]);
  const headTilt = 8 + drift(t * 0.2, 2) * 1.2;

  const z = cam.zoom;
  return (
    <>
      <CameraLayer cam={cam} depth={0.9} shake={shake} style={{filter: `blur(${bgBlur / Math.pow(z, 0.9)}px)`}}>
        <Svg>
          <BackWall t={t} />
        </Svg>
      </CameraLayer>

      <CameraLayer cam={cam} shake={shake} style={{filter: bodyBlur > 0.05 ? `blur(${bodyBlur / z}px)` : undefined}}>
        <Svg>
          <OfficeChair />
          {(() => {
            const body = (
              <>
                <VarunGodFarUpperArm />
                <VarunGodSeatedProfile headTilt={headTilt} breath={breath} blink={blink} lookX={0.9} lookY={0.8} state="blank" />
              </>
            );
            return (
              <>
                {body}
                {/* laptop glow on the face and chest */}
                <LightPass color={OFFICE.screen} opacity={0.42} cx={1150} cy={500} rx={520} ry={330} blend="screen">
                  {body}
                </LightPass>
                {/* cool rim from the window behind */}
                <LightPass color="#5F7FA8" opacity={0.3} cx={360} cy={420} rx={320} ry={360} blend="screen">
                  {body}
                </LightPass>
              </>
            );
          })()}
        </Svg>
      </CameraLayer>

      <CameraLayer cam={cam} shake={shake}>
        <Svg>
          <DeskSide />
          {(() => {
            const hand = <VarunGodDeskHand lift={lift} curl={curl} />;
            return (
              <>
                {hand}
                <LightPass color="#F0A35A" opacity={0.62} cx={1060} cy={560} rx={330} ry={150} blend="screen">
                  {hand}
                </LightPass>
                <LightPass color={OFFICE.screen} opacity={0.18} cx={1040} cy={560} rx={160} ry={90} blend="screen">
                  {hand}
                </LightPass>
              </>
            );
          })()}
        </Svg>
      </CameraLayer>

      <CameraLayer cam={cam} shake={shake} style={{filter: propBlur > 0.05 ? `blur(${propBlur / z}px)` : undefined}}>
        <Svg>
          <LaptopSide />
          <DeskLamp />
          <DustMotes t={t} x={1000} y={420} w={330} h={180} count={36} seed={8} size={1.1} opacity={0.5} />
        </Svg>
      </CameraLayer>

      <CameraLayer cam={cam} shake={shake} style={{filter: `blur(${globeBlur / z}px) brightness(0.42) saturate(0.6)`}}>
        <Svg>
          <g transform={`translate(${OFFICE.globe.x} ${OFFICE.globe.y - OFFICE.globe.r * 1.62})`}>
            <SnowGlobe r={OFFICE.globe.r} shine={0.18} t={t} lampSide={0.7} />
          </g>
        </Svg>
      </CameraLayer>
    </>
  );
};
