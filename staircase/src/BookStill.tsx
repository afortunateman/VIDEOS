import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Shot} from './engine/director';
import {Scene} from './Film';
import {SHOTS} from './shots';
import {INSERTS} from './Insert';

// One frame of a shot, rendered square at print resolution for the picture book.
// `wide` keeps the film's horizontal view in the square frame (1 = same width as the 16:9 shot; the extra height
// shows more sky and ground, which leaves room for text).
export type BookStillProps = {n: number; t: number; wide?: number};

export const BookStill: React.FC<BookStillProps> = ({n, t, wide = 1}) => {
  const {width, height} = useVideoConfig();
  const base = SHOTS.find((s) => s.n === n) ?? Object.values(INSERTS).find((s) => s.n === n)!;
  const k = 1 + (16 / 9 - 1) * wide; // tan(vfov/2) scale that keeps the horizontal view at aspect 1
  const shot: Shot = {
    ...base,
    cam: (tt, T) => {
      const c = base.cam(tt, T);
      return {...c, fov: (2 * Math.atan(Math.tan(((c.fov / 2) * Math.PI) / 180) * k) * 180) / Math.PI};
    },
  };
  const T = base.end - base.start + (base.hold ?? 0);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}}>
        <Scene frame={0} at={{shot, t, T, time: base.start + t}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
