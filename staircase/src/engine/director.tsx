import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {defaultPost, PostSettings} from '../scene/Post';
import {ActorSpec} from './Actor';
import {Look} from './look';
import {Carving} from './World';
import {easeInOut, lerp, noise1, V3} from './stairs';

export type Cam = {pos: V3; target: V3; fov: number; up?: V3};

export type Shot = {
  n: number;
  start: number; // seconds in the film
  end: number;
  plaza?: boolean;
  look: (t: number, T: number) => Look;
  cam: (t: number, T: number) => Cam;
  focus: (t: number, T: number) => V3;
  actors?: (t: number, T: number) => ActorSpec[];
  extras?: (t: number, T: number) => React.ReactNode;
  cloudSeaY?: number;
  carvings?: Carving[];
  shadowCenter?: (t: number, T: number) => V3;
  shadowSize?: number;
  post?: (t: number, T: number) => Partial<PostSettings>;
  topGlow?: (t: number, T: number) => number;
  voice?: (t: number, T: number) => number; // warm light from above
  worldT?: (t: number, T: number) => number; // clock for cloud drift
  iRange?: [number, number];
  highClouds?: boolean;
  handheld?: number; // amplitude
  shake?: (t: number, T: number) => number;
};

// Smooth path through camera keys (Catmull-Rom), progress eased over the whole shot.
export const path = (keys: Cam[], u: number): Cam => {
  if (keys.length === 1) return keys[0];
  const n = keys.length - 1;
  const x = Math.min(0.99999, Math.max(0, u)) * n;
  const i = Math.floor(x);
  const f = x - i;
  const P = (k: number) => keys[Math.max(0, Math.min(n, k))];
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  const v = (sel: (c: Cam) => V3): V3 =>
    [0, 1, 2].map((j) => cr(sel(P(i - 1))[j], sel(P(i))[j], sel(P(i + 1))[j], sel(P(i + 2))[j])) as V3;
  return {
    pos: v((c) => c.pos),
    target: v((c) => c.target),
    fov: lerp(P(i).fov, P(i + 1).fov, f),
    up: P(i).up,
  };
};

export const move = (keys: Cam[], ease: (t: number) => number = easeInOut) => (t: number, T: number) => path(keys, ease(t / T));
export const still = (c: Cam) => () => c;

// ---------------- rendering helpers ----------------
export const CameraDriver: React.FC<{cam: Cam; handheld: number; shake: number; t: number}> = ({cam, handheld, shake, t}) => {
  const {camera} = useThree();
  useFrame(() => {
    const c = camera as THREE.PerspectiveCamera;
    const hx = noise1(t * 0.45, 1) * handheld + noise1(t * 9, 11) * shake;
    const hy = noise1(t * 0.4, 2) * handheld + noise1(t * 10, 12) * shake;
    const hz = noise1(t * 0.35, 3) * handheld * 0.5;
    c.position.set(cam.pos[0] + hx, cam.pos[1] + hy, cam.pos[2] + hz);
    c.up.set(...(cam.up ?? [0, 1, 0]));
    c.fov = cam.fov;
    c.near = 0.05;
    c.far = 2000;
    c.lookAt(cam.target[0] + hx * 0.6, cam.target[1] + hy * 0.6, cam.target[2]);
    c.updateProjectionMatrix();
    c.layers.enable(1);
  }, 0);
  return null;
};

export const Rig: React.FC<{look: Look; center: V3; size: number; voice: number}> = ({look, center, size, voice}) => {
  const {scene} = useThree();
  if (!(scene.fog instanceof THREE.Fog)) scene.fog = new THREE.Fog('#ffffff', 50, 300);
  const fog = scene.fog as THREE.Fog;
  fog.color.set(look.fogColor);
  fog.near = look.fogNear;
  fog.far = look.fogFar;
  const sun = new THREE.Vector3(...look.sunDir).normalize();
  // Keep the key light above the horizon even when the sun sits low.
  const keyDir = sun.clone();
  keyDir.y = Math.max(keyDir.y, 0.28);
  keyDir.normalize();
  const kp = new THREE.Vector3(...center).add(keyDir.multiplyScalar(40));
  return (
    <>
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiIntensity]} />
      <ambientLight color={look.ambient} intensity={look.ambientIntensity} />
      <directionalLight
        color={look.keyColor}
        intensity={look.keyIntensity}
        position={kp}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        ref={(l: THREE.DirectionalLight | null) => {
          if (l) {
            l.target.position.set(...center);
            l.target.updateMatrixWorld();
          }
        }}
      />
      {voice > 0.001 ? (
        <directionalLight
          color="#ffd08a"
          intensity={voice * 2.6}
          position={[center[0] + 4, center[1] + 30, center[2] - 25]}
          ref={(l: THREE.DirectionalLight | null) => {
            if (l) {
              l.target.position.set(...center);
              l.target.updateMatrixWorld();
            }
          }}
        />
      ) : null}
    </>
  );
};

export const postFor = (look: Look, focusDist: number, extra: Partial<PostSettings> = {}): PostSettings => ({
  ...defaultPost,
  saturation: look.saturation,
  lift: look.lift,
  vignette: look.vignette,
  bloom: look.bloom,
  focus: focusDist,
  focusRange: Math.max(0.4, focusDist * 0.28),
  maxBlur: 7,
  ...extra,
});
