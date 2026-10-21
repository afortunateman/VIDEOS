import React from 'react';
import {HEIGHT, WIDTH} from '../timeline/timeline';

/** Full-frame colour wash, e.g. fade from / to black. */
export const Fade: React.FC<{opacity: number; color?: string}> = ({opacity, color = '#000'}) =>
  opacity <= 0 ? null : (
    <div style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT, background: color, opacity}} />
  );
