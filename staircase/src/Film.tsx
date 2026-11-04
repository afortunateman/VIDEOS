import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Actor} from './engine/Actor';
import {CameraDriver, postFor, Rig} from './engine/director';
import {World} from './engine/World';
import {Post} from './scene/Post';
import {AUDIO_PIECES, FILM_SECONDS, locate} from './timeline';

export {FILM_SECONDS};

const Scene: React.FC<{frame: number}> = ({frame}) => {
  const {shot, t, T, time} = locate(frame);
  const look = shot.look(t, T);
  const cam = shot.cam(t, T);
  const focus = shot.focus(t, T);
  const rawDist = new THREE.Vector3(...cam.pos).distanceTo(new THREE.Vector3(...focus));
  // Focus targets are usually a head's centre; focus on its near surface for close shots.
  const focusDist = rawDist < 6 ? Math.max(0.2, rawDist - 0.42) : rawDist;
  const actors = shot.actors?.(t, T) ?? [];
  const center = shot.shadowCenter?.(t, T) ?? focus;
  return (
    <>
      <CameraDriver cam={cam} handheld={shot.handheld ?? 0} shake={shot.shake?.(t, T) ?? 0} t={time} />
      <Rig look={look} center={center} size={shot.shadowSize ?? 7} voice={shot.voice?.(t, T) ?? 0} />
      <World
        key={shot.plaza ? 'plaza' : `stairs-${shot.iRange?.join('-') ?? 'd'}`}
        look={look}
        plaza={!!shot.plaza}
        cloudSeaY={shot.cloudSeaY ?? -12}
        carvings={shot.carvings}
        t={shot.worldT?.(t, T) ?? time}
        iMin={shot.iRange?.[0]}
        iMax={shot.iRange?.[1]}
        highClouds={shot.highClouds ?? true}
        topGlow={shot.topGlow?.(t, T) ?? 0}
        cloudZ={focus[2]}
      />
      {actors.map((a) => (
        <Actor key={a.id} spec={a} />
      ))}
      {shot.extras?.(t, T)}
      <Post settings={{...postFor(look, focusDist, shot.post?.(t, T)), exposure: look.exposure, seed: time}} />
    </>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const fadeIn = interpolate(time, [0, 1.4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(time, [FILM_SECONDS - 2.4, FILM_SECONDS - 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {AUDIO_PIECES.map((p) => (
        <Sequence key={p.voFrom} from={p.filmAt} layout="none">
          <Audio src={staticFile('vo.mp3')} startFrom={p.voFrom} endAt={p.voTo ?? undefined} />
        </Sequence>
      ))}
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, preserveDrawingBuffer: true}}>
        <Scene frame={frame} />
      </ThreeCanvas>
      <AbsoluteFill style={{backgroundColor: '#000', opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
