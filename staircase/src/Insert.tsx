import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Scene} from './Film';
import {INSERT_DETERMINED} from './shots/act2';

// A stand-alone 3 s insert shot, rendered on its own (the film's timeline is unchanged).
export const Insert: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const shot = INSERT_DETERMINED;
  const t = frame / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}}>
        <Scene frame={frame} at={{shot, t, T: shot.end - shot.start, time: shot.start + t}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
