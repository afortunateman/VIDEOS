import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Shot} from './engine/director';
import {Scene} from './Film';
import {SHOTS} from './shots';
import {INSERTS} from './Insert';
import {STAIR_STYLE} from './engine/World';

// One frame of a shot, rendered square at print resolution for the picture book.
// `wide` keeps the film's horizontal view in the square frame (1 = same width as the 16:9 shot; the extra height
// shows more sky and ground, which leaves room for text).
// `move` / `aim` nudge the camera position / target (world units) for a better book framing, e.g. lifting the
// camera so a foreground flame no longer covers a face.
export type BookStillProps = {n: number; t: number; wide?: number; move?: [number, number, number]; aim?: [number, number, number]; shade?: number};
// `shade` scales the sun's shadow strength (1 = as in the film), to keep hard shadows off a face.

export const BookStill: React.FC<BookStillProps> = ({n, t, wide = 1, move = [0, 0, 0], aim = [0, 0, 0], shade = 1}) => {
  const {width, height} = useVideoConfig();
  STAIR_STYLE.solid = true; // book pictures use the solid, flush stair blocks
  const base = SHOTS.find((s) => s.n === n) ?? Object.values(INSERTS).find((s) => s.n === n)!;
  const k = 1 + (16 / 9 - 1) * wide; // tan(vfov/2) scale that keeps the horizontal view at aspect 1
  const shot: Shot = {
    ...base,
    sunShadow: (tt, T) => (base.sunShadow?.(tt, T) ?? 1) * shade,
    cam: (tt, T) => {
      const c = base.cam(tt, T);
      const pos: [number, number, number] = [c.pos[0] + move[0], c.pos[1] + move[1], c.pos[2] + move[2]];
      const target: [number, number, number] = [c.target[0] + aim[0], c.target[1] + aim[1], c.target[2] + aim[2]];
      return {...c, pos, target, fov: (2 * Math.atan(Math.tan(((c.fov / 2) * Math.PI) / 180) * k) * 180) / Math.PI};
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
