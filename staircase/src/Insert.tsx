import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Shot} from './engine/director';
import {Scene} from './Film';
import {INSERT_DETERMINED} from './shots/act2';
import {INSERT_TOP} from './shots/act3';
import {INSERT_STAIRS, INSERT_WIDE} from './shots/act5';

// Stand-alone insert shots, rendered on their own (the film's timeline is unchanged).
export const INSERTS: Record<string, Shot> = {determined: INSERT_DETERMINED, top: INSERT_TOP, wide: INSERT_WIDE, stairs: INSERT_STAIRS};

export const Insert: React.FC<{which: string}> = ({which}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const shot = INSERTS[which];
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}}>
        <Scene frame={frame} at={{shot, t, T: shot.end - shot.start, time: shot.start + t}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
