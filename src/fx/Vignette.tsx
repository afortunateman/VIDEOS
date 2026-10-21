import React from 'react';
import {HEIGHT, WIDTH} from '../timeline/timeline';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: WIDTH,
      height: HEIGHT,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength * 0.55}) 80%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);
