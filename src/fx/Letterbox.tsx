import React from 'react';
import {HEIGHT, WIDTH} from '../timeline/timeline';

/** 2.39:1 inside a 16:9 frame. Characters should be composed between these lines. */
export const BAR = Math.round((HEIGHT - WIDTH / 2.39) / 2); // 138
export const BAND_TOP = BAR;
export const BAND_BOTTOM = HEIGHT - BAR;

export const Letterbox: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: BAR, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, bottom: 0, width: WIDTH, height: BAR, background: '#000'}} />
  </>
);
