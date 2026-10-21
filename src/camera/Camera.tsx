import React from 'react';
import {HEIGHT, WIDTH} from '../timeline/timeline';
import {clamp01, EaseFn, easeInOutCubic, lerp} from '../utils/easing';
import {drift} from '../utils/seededRandom';

export type CamKey = {
  /** Seconds (relative to whatever clock you pass in). */
  t: number;
  /** World point at the centre of frame. */
  x: number;
  y: number;
  zoom: number;
  rotate?: number;
  /** Easing used to arrive at this key from the previous one. */
  ease?: EaseFn;
};

export type CamState = {x: number; y: number; zoom: number; rotate: number};

export const cameraAt = (keys: CamKey[], t: number): CamState => {
  const first = keys[0];
  if (t <= first.t) return {x: first.x, y: first.y, zoom: first.zoom, rotate: first.rotate ?? 0};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const p = (b.ease ?? easeInOutCubic)(clamp01((t - a.t) / (b.t - a.t)));
      // Interpolate zoom in log space so pushes feel linear to the eye.
      const z = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), p));
      return {
        x: lerp(a.x, b.x, p),
        y: lerp(a.y, b.y, p),
        zoom: z,
        rotate: lerp(a.rotate ?? 0, b.rotate ?? 0, p),
      };
    }
  }
  const last = keys[keys.length - 1];
  return {x: last.x, y: last.y, zoom: last.zoom, rotate: last.rotate ?? 0};
};

/** Handheld / breathing offset in screen pixels. Keep amplitude tiny for "static" shots. */
export const handheld = (t: number, amp = 1.5, speed = 0.35, seed = 3) => ({
  x: drift(t * speed, seed) * amp,
  y: drift(t * speed, seed + 11) * amp * 0.8,
  r: drift(t * speed * 0.7, seed + 23) * amp * 0.02,
});

/**
 * A layer of the world seen through the camera. `depth` < 1 sits behind the focal
 * plane (moves and scales less), > 1 sits in front (moves and scales more).
 */
export const CameraLayer: React.FC<{
  cam: CamState;
  depth?: number;
  shake?: {x: number; y: number; r: number};
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({cam, depth = 1, shake, style, children}) => {
  const z = Math.pow(cam.zoom, depth);
  const cx = WIDTH / 2 + (cam.x - WIDTH / 2) * depth;
  const cy = HEIGHT / 2 + (cam.y - HEIGHT / 2) * depth;
  const sx = shake ? shake.x * depth : 0;
  const sy = shake ? shake.y * depth : 0;
  const rot = cam.rotate + (shake ? shake.r : 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
        transformOrigin: '0 0',
        transform: `translate(${WIDTH / 2 + sx}px, ${HEIGHT / 2 + sy}px) rotate(${rot}deg) scale(${z}) translate(${-cx}px, ${-cy}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
