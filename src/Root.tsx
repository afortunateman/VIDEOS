import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FPS, HEIGHT, WIDTH, sceneFrames} from './timeline/timeline';
import {TestSheet} from './TestSheet';
import {S1Office} from './scenes/S1Office';
import {StyleTest} from './styletest/StyleTest';
import {StyleTestCloseUp} from './styletest/StyleTestCloseUp';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="S1Office" component={S1Office} durationInFrames={sceneFrames('S1')} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="StyleTest" component={StyleTest} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="StyleTestCloseUp" component={StyleTestCloseUp} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="TestSheet" component={TestSheet} durationInFrames={30} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
