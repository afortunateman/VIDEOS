import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, S1} from '../timeline/timeline';
import {Grain} from '../fx/Grain';
import {Vignette} from '../fx/Vignette';
import {Letterbox} from '../fx/Letterbox';
import {Fade} from '../fx/Fade';
import {ShotDesk} from './s1/ShotDesk';
import {ShotScreen} from './s1/ShotScreen';
import {ShotFace} from './s1/ShotFace';
import {S1Audio} from './s1/S1Audio';
import {progress, easeInOutSine} from '../utils/easing';

export const S1Office: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const fadeIn = 1 - progress(t, 0, S1.fadeInEnd, easeInOutSine);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {t < S1.shotOts && <ShotDesk t={t} />}
      {t >= S1.shotOts && t < S1.shotFace && <ShotScreen t={t} phase="blank" />}
      {t >= S1.shotFace && t < S1.shotTyping && <ShotFace t={t} />}
      {t >= S1.shotTyping && <ShotScreen t={t} phase="typing" />}
      <Vignette strength={0.6} />
      <Grain />
      <Fade opacity={fadeIn} />
      <Letterbox />
      <S1Audio />
    </AbsoluteFill>
  );
};
