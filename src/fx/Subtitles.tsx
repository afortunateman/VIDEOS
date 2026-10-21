import React from 'react';
import {useCurrentFrame} from 'remotion';
import {linesForScene} from '../timeline/dialogue';
import {FPS, SceneId, SHOW_SUBTITLES, WIDTH} from '../timeline/timeline';
import {BAND_BOTTOM} from './Letterbox';

/** Bottom-centre subtitles inside the letterbox band. Reads dialogue.ts. */
export const Subtitles: React.FC<{scene: SceneId}> = ({scene}) => {
  const frame = useCurrentFrame();
  if (!SHOW_SUBTITLES) return null;
  const t = frame / FPS;
  const line = linesForScene(scene).find((l) => t >= l.start && t < l.start + l.estDuration + 0.4);
  if (!line) return null;
  const local = t - line.start;
  const end = line.estDuration + 0.4;
  const opacity = Math.min(1, local / 0.2, (end - local) / 0.2);
  return (
    <div
      style={{
        position: 'absolute',
        left: WIDTH * 0.12,
        width: WIDTH * 0.76,
        top: BAND_BOTTOM - 120,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        fontSize: 40,
        lineHeight: 1.3,
        color: '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
        opacity,
      }}
    >
      {line.text}
    </div>
  );
};
