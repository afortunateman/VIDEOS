import React from 'react';
import {useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline/timeline';

/** Subtle animated film grain. Rendered at half resolution and scaled up. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const seed = (frame * 7919) % 997;
  return (
    <svg
      width={WIDTH / 2}
      height={HEIGHT / 2}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: 'scale(2)',
        transformOrigin: '0 0',
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <filter id="grain-f" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="noStitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.6" intercept="-0.3" />
          <feFuncG type="linear" slope="1.6" intercept="-0.3" />
          <feFuncB type="linear" slope="1.6" intercept="-0.3" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-f)" />
    </svg>
  );
};
