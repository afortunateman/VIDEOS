import {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Face, faceTexture, skinTexture, toTexture} from './paint';
import {toon} from './toon';

export type Palette = {base: string; light: string; dark: string; spot: string; belly: string; feet: string};

export const HERO: Palette = {
  base: '#6fd38a',
  light: '#b6f0a0',
  dark: '#3e9e78',
  spot: '#ffcf4a',
  belly: '#e8f7b0',
  feet: '#2f6e5c',
};

export const TIRED: Palette = {
  base: '#9fb59a',
  light: '#c9d6b8',
  dark: '#6f8a80',
  spot: '#c9b07a',
  belly: '#dfe6c8',
  feet: '#4f6660',
};

type Props = {
  // Body centre points, head first. Units are world units relative to the group.
  path: [number, number, number][];
  lookAt: [number, number, number]; // where the face points, relative to the group
  face: Face;
  palette?: Palette;
  headRadius?: number;
  suitcase?: boolean;
  antennaSway?: number;
};

const Feet: React.FC<{radius: number; color: THREE.Material}> = ({radius, color}) => (
  <>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * radius * 0.55, -radius * 0.82, 0]} material={color} castShadow>
        <sphereGeometry args={[radius * 0.28, 16, 12]} />
      </mesh>
    ))}
  </>
);

export const Caterpillar: React.FC<Props> = ({
  path,
  lookAt,
  face,
  palette = HERO,
  headRadius = 0.46,
  suitcase = false,
  antennaSway = 0,
}) => {
  const mats = useMemo(() => {
    const skin = toTexture(skinTexture(3, palette.base, palette.light, palette.dark, palette.spot));
    return {
      body: toon({map: skin}),
      feet: toon({color: palette.feet}),
      tip: toon({color: palette.spot}),
      stalk: toon({color: palette.dark}),
      leather: toon({color: '#c4623f'}),
      strap: toon({color: '#7a3424'}),
      brass: toon({color: '#ffcc55', emissive: '#553300', emissiveIntensity: 0.3}),
    };
  }, [palette]);

  const headMat = useMemo(
    () => toon({map: toTexture(faceTexture(palette.base, palette.light, palette.dark, face))}),
    [palette, face],
  );

  const head = new THREE.Vector3(...path[0]);
  const neck = new THREE.Vector3(...path[1]);
  const target = new THREE.Vector3(...lookAt);

  // Orient the head so its local +z (where the face is painted) points at the target.
  const headQuat = useMemo(() => {
    const m = new THREE.Matrix4().lookAt(target, head, new THREE.Vector3(0, 1, 0));
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [lookAt, path]);

  const antennae = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(headQuat);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(headQuat);
    const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
    return [-1, 1].map((s) => {
      const root = head.clone().add(up.clone().multiplyScalar(headRadius * 0.85)).add(side.clone().multiplyScalar(s * headRadius * 0.35));
      const mid = root.clone().add(up.clone().multiplyScalar(0.32)).add(side.clone().multiplyScalar(s * (0.12 + antennaSway * 0.1))).add(fwd.clone().multiplyScalar(0.05));
      const tip = mid.clone().add(up.clone().multiplyScalar(0.18)).add(side.clone().multiplyScalar(s * 0.12)).add(fwd.clone().multiplyScalar(0.12 + antennaSway * 0.05));
      return {curve: new THREE.CatmullRomCurve3([root, mid, tip]), tip};
    });
  }, [headQuat, path, antennaSway, headRadius]);

  const n = path.length - 1;

  return (
    <group>
      {/* Head */}
      <mesh position={head} quaternion={headQuat} material={headMat} castShadow>
        <sphereGeometry args={[headRadius, 64, 48]} />
      </mesh>
      {antennae.map((a, i) => (
        <group key={i}>
          <mesh material={mats.stalk} castShadow>
            <tubeGeometry args={[a.curve, 16, 0.028, 8, false]} />
          </mesh>
          <mesh position={a.tip} material={mats.tip} castShadow>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
        </group>
      ))}
      {/* Body segments, each facing along the path */}
      {path.slice(1).map((p, i) => {
        const t = i / Math.max(1, n - 1);
        const r = headRadius * (0.78 - t * 0.32);
        const prev = new THREE.Vector3(...path[i]);
        const cur = new THREE.Vector3(...p);
        const dir = prev.clone().sub(cur).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dir.x, 0, dir.z).normalize());
        return (
          <group key={i} position={cur} quaternion={q}>
            <mesh material={mats.body} scale={[1, 0.95, 1.05]} castShadow receiveShadow>
              <sphereGeometry args={[r, 40, 28]} />
            </mesh>
            <Feet radius={r} color={mats.feet} />
          </group>
        );
      })}
      {suitcase ? (
        <group position={neck.clone().add(new THREE.Vector3(0.52, -0.12, 0.05))} rotation={[0.08, 0.35, -0.12]}>
          <mesh material={mats.leather} castShadow>
            <primitive object={new RoundedBoxGeometry(0.2, 0.36, 0.5, 4, 0.05)} attach="geometry" />
          </mesh>
          {[-0.14, 0.14].map((z) => (
            <mesh key={z} position={[0, 0, z]} material={mats.strap}>
              <boxGeometry args={[0.215, 0.37, 0.045]} />
            </mesh>
          ))}
          <mesh position={[0, 0.215, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.strap} castShadow>
            <torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} />
          </mesh>
          <mesh position={[0.105, 0.11, 0]} material={mats.brass}>
            <boxGeometry args={[0.02, 0.05, 0.08]} />
          </mesh>
        </group>
      ) : null}
      {suitcase ? <Limb from={neck.clone().add(new THREE.Vector3(0.22, -0.02, 0.02))} to={neck.clone().add(new THREE.Vector3(0.5, 0.1, 0.05))} material={mats.body} /> : null}
    </group>
  );
};

// A short rounded limb between two points.
const Limb: React.FC<{from: THREE.Vector3; to: THREE.Vector3; material: THREE.Material}> = ({from, to, material}) => {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={from.clone().add(to).multiplyScalar(0.5)} quaternion={q} material={material} castShadow>
      <capsuleGeometry args={[0.055, len, 6, 12]} />
    </mesh>
  );
};
