// A caterpillar actor. Everything is computed from the spec, so any frame renders on its own.
import {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {butterflyTagTexture, Face, faceTexture, leatherTexture, mix, skinTexture, toTexture} from '../scene/paint';
import {toon} from '../scene/toon';
import {ballY, DEPTH, flatChain, groundY, noise1, RISE, solveChain, V3, waveLift} from './stairs';

export type Palette = {base: string; light: string; dark: string; spot: string; feet: string};

export const PALETTES: Record<string, Palette> = {
  hero: {base: '#6fd38a', light: '#b6f0a0', dark: '#3e9e78', spot: '#ffcf4a', feet: '#2f6e5c'},
  heroOld: {base: '#a9c79e', light: '#d6e6c4', dark: '#76987f', spot: '#e0c98a', feet: '#56705f'},
  elder: {base: '#a99ad6', light: '#d4cbf2', dark: '#7466a8', spot: '#f2e6ff', feet: '#4e4580'},
  descender: {base: '#c27bb0', light: '#e8b4d8', dark: '#8a4f80', spot: '#ffd6a0', feet: '#5e3058'},
  quitter: {base: '#9fb59a', light: '#c9d6b8', dark: '#6f8a80', spot: '#c9b07a', feet: '#4f6660'},
  yellow: {base: '#ffd45e', light: '#fff0a8', dark: '#d99a3a', spot: '#ff7a5a', feet: '#9a5a2a'},
  blue: {base: '#6fb8ff', light: '#b8dcff', dark: '#3e78c8', spot: '#fff27a', feet: '#2a4a8a'},
  pink: {base: '#ff9ac0', light: '#ffd0e2', dark: '#d0608e', spot: '#fff0a0', feet: '#8a3060'},
  orange: {base: '#ffa45e', light: '#ffd2a0', dark: '#d0683a', spot: '#6fd38a', feet: '#8a3e1a'},
  teal: {base: '#5fd6c8', light: '#a8f0e6', dark: '#2e9a96', spot: '#ffb0d0', feet: '#1e6060'},
};

const blendPalette = (a: Palette, b: Palette, t: number): Palette => {
  const q = Math.round(t * 4) / 4; // quantised so textures cache well
  if (q <= 0) return a;
  if (q >= 1) return b;
  const k = Object.keys(a) as (keyof Palette)[];
  const out = {} as Palette;
  for (const key of k) {
    const c = new THREE.Color(a[key]).lerp(new THREE.Color(b[key]), q);
    out[key] = '#' + c.getHexString();
  }
  return out;
};

// ---------- texture & material caches (bounded) ----------
const lru = <T,>(limit: number, dispose: (v: T) => void) => {
  const m = new Map<string, T>();
  return (key: string, make: () => T) => {
    const hit = m.get(key);
    if (hit) {
      m.delete(key);
      m.set(key, hit);
      return hit;
    }
    const v = make();
    m.set(key, v);
    if (m.size > limit) {
      const first = m.keys().next().value as string;
      dispose(m.get(first)!);
      m.delete(first);
    }
    return v;
  };
};
const faceCache = lru<THREE.Texture>(28, (t) => t.dispose());
const skinCache = lru<THREE.MeshToonMaterial>(24, (m) => {
  m.map?.dispose();
  m.dispose();
});
const flatCache = new Map<string, THREE.MeshToonMaterial>();
const flat = (color: string) => {
  let m = flatCache.get(color);
  if (!m) {
    m = toon({color});
    flatCache.set(color, m);
  }
  return m;
};

const qz = (v: number, step = 0.1) => Math.round(v / step) * step;
const faceKey = (p: Palette, f: Face) =>
  [p.base, qz(f.look[0]), qz(f.look[1]), qz(f.lid), qz(f.brow, 0.2), f.mouth, f.sweat ? 1 : 0, f.squeeze ? 1 : 0, f.catchColor ?? '', f.elder ? 1 : 0, qz(f.lidTilt ?? 99), qz(f.blush ?? 9)].join('|');

const getFace = (p: Palette, f: Face) =>
  faceCache(faceKey(p, f), () =>
    toTexture(
      faceTexture(p.base, p.light, p.dark, {
        ...f,
        look: [qz(f.look[0]), qz(f.look[1])],
        lid: qz(f.lid),
        brow: qz(f.brow, 0.2),
      }),
    ),
  );

const getSkin = (p: Palette) => skinCache(p.base, () => toon({map: toTexture(skinTexture(3, p.base, p.light, p.dark, p.spot))}));

// ---------- shared geometry ----------
const GEO = {
  headHi: new THREE.SphereGeometry(1, 64, 48),
  headLo: new THREE.SphereGeometry(1, 28, 20),
  segHi: new THREE.SphereGeometry(1, 40, 28),
  segLo: new THREE.SphereGeometry(1, 18, 12),
  foot: new THREE.SphereGeometry(1, 12, 8),
  tip: new THREE.SphereGeometry(1, 14, 10),
  caseBody: new RoundedBoxGeometry(0.2, 0.36, 0.5, 4, 0.05),
  caseLid: new RoundedBoxGeometry(0.06, 0.36, 0.5, 3, 0.03),
  strap: new THREE.BoxGeometry(0.215, 0.37, 0.045),
  handle: new THREE.TorusGeometry(0.07, 0.018, 8, 16, Math.PI),
  tag: new THREE.PlaneGeometry(0.16, 0.16),
};

let tagMat: THREE.MeshToonMaterial | null = null;
const getTagMat = () => {
  if (!tagMat) {
    tagMat = toon({map: toTexture(butterflyTagTexture())});
    tagMat.transparent = true;
    tagMat.alphaTest = 0.5;
    tagMat.side = THREE.DoubleSide;
  }
  return tagMat;
};
const leatherCache = new Map<string, THREE.MeshToonMaterial>();
const leather = (base: string) => {
  let m = leatherCache.get(base);
  if (!m) {
    m = toon({map: toTexture(leatherTexture(5, base))});
    leatherCache.set(base, m);
  }
  return m;
};

// ---------- spec ----------
export type Body =
  | {mode: 'stairs'; headZ: number; x: number; dir?: 1 | -1; plaza?: boolean}
  | {mode: 'flat'; head: [number, number]; yaw: number; curl?: number}
  | {mode: 'points'; pts: V3[]};

export type SuitcaseSpec =
  | {mode: 'carry'; tag?: boolean; color?: string; swing?: number}
  | {mode: 'placed'; pos: V3; yaw: number; tag?: boolean; color?: string; open?: number; tilt?: number};

export type ActorSpec = {
  id: string;
  palette: Palette;
  age?: number; // 0 = young, 1 = old (fades toward heroOld)
  body: Body;
  segs?: number;
  headR?: number;
  cycles?: number; // crawl wave phase, for the hump
  waveAmp?: number;
  rear?: number; // radians the front lifts
  rearPivot?: number; // segment index where the lift starts
  breathe?: number; // 0..1 body inflation (sigh)
  lookAt: V3;
  face: Face;
  droop?: number; // antennae droop 0..1
  t: number; // seconds, for idle motion
  suitcase?: SuitcaseSpec | null;
  detail?: 'hi' | 'lo';
  shadows?: boolean;
  tremble?: number;
  armUp?: number; // 0..1 raise the free arm (gesture)
  armTo?: V3; // right hand reaching to a point (e.g. a suitcase being put down)
  seed?: number;
};

const UP = new THREE.Vector3(0, 1, 0);

export const radiiFor = (segs: number, headR: number) => {
  const radii = [headR];
  for (let i = 1; i <= segs; i++) radii.push(headR * (0.78 - ((i - 1) / Math.max(1, segs - 1)) * 0.32));
  return radii;
};
export const gapsFor = (radii: number[]) => radii.slice(1).map((r, i) => (r + radii[i]) * 0.62);

export const layBody = (spec: ActorSpec): V3[] => {
  const segs = spec.segs ?? 7;
  const radii = radiiFor(segs, spec.headR ?? 0.46);
  const gaps = gapsFor(radii);
  let pts: V3[];
  const b = spec.body;
  if (b.mode === 'stairs') pts = solveChain(b.headZ, b.x, radii, gaps, b.dir ?? 1, b.plaza);
  else if (b.mode === 'flat') pts = flatChain(b.head, b.yaw, b.curl ?? 0, radii, gaps);
  else pts = b.pts.map((p) => [...p] as V3);

  // Crawl hump.
  if (spec.cycles !== undefined) {
    const amp = spec.waveAmp ?? 0.07;
    pts = pts.map((p, i) => (i === 0 ? p : [p[0], p[1] + waveLift(spec.cycles!, i, amp), p[2]]));
  }

  // Rear up: bend the front of the body upward, joint by joint. Each link's lift is measured from
  // the slope it was resting on (the stairs), so the front rises off the steps instead of bending
  // into the step above. On flat ground this is the same as lifting from horizontal.
  const rear = spec.rear ?? 0;
  if (rear > 0.001) {
    const p = Math.min(spec.rearPivot ?? 3, pts.length - 1);
    const heading = new THREE.Vector3(pts[0][0] - pts[p][0], 0, pts[0][2] - pts[p][2]).normalize();
    const out = pts.map((q) => new THREE.Vector3(...q));
    for (let j = p - 1; j >= 0; j--) {
      const v = new THREE.Vector3(...pts[j]).sub(new THREE.Vector3(...pts[j + 1]));
      const len = v.length();
      const horiz = Math.hypot(v.x, v.z);
      const slope = Math.atan2(v.y, horiz); // elevation of the resting link
      // Ease the extra lift off as the link nears vertical so a big rear never folds backwards.
      const lift = ((rear * (p - j)) / p) * (1 - Math.max(0, slope) / 1.45);
      const elev = slope + lift;
      out[j] = out[j + 1].clone().add(heading.clone().multiplyScalar(Math.cos(elev) * len)).add(new THREE.Vector3(0, Math.sin(elev) * len, 0));
    }
    pts = out.map((v) => [v.x, v.y, v.z] as V3);
  }
  // Contact: nothing may sit lower than resting on the steps.
  if (b.mode === 'stairs') pts = pts.map((q, i) => [q[0], Math.max(q[1], ballY(q[2], radii[i], b.plaza)), q[2]] as V3);
  return pts;
};

// Point where the right hand holds a carried suitcase handle.
export const handPoint = (pts: V3[], radii: number[]) => {
  const n = new THREE.Vector3(...pts[1]);
  const h = new THREE.Vector3(...pts[0]).sub(n).setY(0).normalize();
  const side = new THREE.Vector3().crossVectors(h, UP).normalize();
  return {neck: n, side, heading: h, hand: n.clone().add(side.multiplyScalar(radii[1] + 0.2)).add(new THREE.Vector3(0, 0.12, 0))};
};

// Stair height with each riser softened into a short ramp just before it, so anything lifted to
// clear it rises smoothly as it approaches a step instead of popping up.
const softGround = (z: number, plaza?: boolean) => {
  const W = 0.22;
  let g = groundY(z, plaza);
  const i = Math.round(-z / DEPTH);
  for (let k = i - 1; k <= i + 1; k++) {
    const ze = -(k + 0.5) * DEPTH; // edge up to step k+1
    if (z >= ze && z < ze + W) {
      const top = groundY(ze - 1e-4, plaza);
      g = Math.max(g, top - RISE * ((z - ze) / W));
    }
  }
  return g;
};

// Pose of a carried suitcase: hangs from the hand, lifted just enough to clear the steps.
export const carryPose = (spec: ActorSpec, pts: V3[], radii: number[], swing: number) => {
  const hp = handPoint(pts, radii);
  const q = new THREE.Quaternion()
    .setFromUnitVectors(new THREE.Vector3(0, 0, -1), hp.heading)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), swing));
  const plaza = spec.body.mode === 'stairs' ? spec.body.plaza : spec.body.mode === 'flat';
  let lift = 0;
  if (spec.body.mode !== 'flat') {
    for (const sx of [-1, 1])
      for (let sz = -1; sz <= 1; sz += 0.25) {
        const v = new THREE.Vector3(sx * 0.1, -0.27 - 0.18, sz * 0.25).applyQuaternion(q).add(hp.hand);
        lift = Math.max(lift, softGround(v.z, plaza) + 0.015 - v.y);
      }
  }
  const hand = hp.hand.clone().add(new THREE.Vector3(0, lift, 0));
  return {...hp, hand, q, lift};
};

const Limb: React.FC<{from: THREE.Vector3; to: THREE.Vector3; material: THREE.Material; r?: number}> = ({from, to, material, r = 0.055}) => {
  const dir = to.clone().sub(from);
  const len = Math.max(0.01, dir.length());
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  return (
    <mesh position={from.clone().add(to).multiplyScalar(0.5)} quaternion={q} material={material} castShadow>
      <capsuleGeometry args={[r, len, 6, 12]} />
    </mesh>
  );
};

export const Suitcase: React.FC<{
  color?: string;
  tag?: boolean;
  open?: number;
  shadows?: boolean;
}> = ({color = '#c4623f', tag, open = 0, shadows = true}) => {
  const strap = flat(mix(color, '#3a1208', 0.45));
  const brass = flat('#ffcc55');
  return (
    <group>
      {/* Pivot is the top of the handle; the case hangs below it. */}
      <group position={[0, -0.27, 0]}>
        {open > 0 ? (
          // Hollow shell so the empty inside shows: back panel plus four rim walls.
          <group>
            <mesh position={[-0.085, 0, 0]} material={leather(color)} castShadow={shadows} receiveShadow>
              <boxGeometry args={[0.03, 0.36, 0.5]} />
            </mesh>
            <mesh position={[-0.06, 0, 0]} material={flat('#3a2230')}>
              <boxGeometry args={[0.012, 0.33, 0.47]} />
            </mesh>
            {[-1, 1].map((k) => (
              <mesh key={`r${k}`} position={[0, k * 0.165, 0]} material={leather(color)} castShadow={shadows}>
                <boxGeometry args={[0.2, 0.03, 0.5]} />
              </mesh>
            ))}
            {[-1, 1].map((k) => (
              <mesh key={`e${k}`} position={[0, 0, k * 0.235]} material={leather(color)} castShadow={shadows}>
                <boxGeometry args={[0.2, 0.36, 0.03]} />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh geometry={GEO.caseBody} material={leather(color)} castShadow={shadows} receiveShadow />
        )}
        {open > 0 ? (
          // Lid hinged on the bottom edge of the outer face, swung open; inside is empty.
          <group position={[0.1, -0.18, 0]} rotation={[0, 0, -open * 1.9]}>
            <mesh position={[0.03, 0.18, 0]} geometry={GEO.caseLid} material={leather(color)} castShadow={shadows} />
          </group>
        ) : (
          <>
            {[-0.14, 0.14].map((z) => (
              <mesh key={z} position={[0, 0, z]} geometry={GEO.strap} material={strap} />
            ))}
            <mesh position={[0.105, 0.11, 0]} material={brass}>
              <boxGeometry args={[0.02, 0.05, 0.08]} />
            </mesh>
          </>
        )}
        <mesh position={[0, 0.195, 0]} rotation={[0, Math.PI / 2, 0]} geometry={GEO.handle} material={strap} castShadow={shadows} />
        {tag ? (
          <group position={[0.125, 0.12, 0.06]} rotation={[0, Math.PI / 2, 0.12]}>
            <mesh position={[0, -0.04, 0]} geometry={GEO.tag} material={getTagMat()} />
          </group>
        ) : null}
      </group>
    </group>
  );
};

export const Actor: React.FC<{spec: ActorSpec}> = ({spec}) => {
  const segs = spec.segs ?? 7;
  const headR = spec.headR ?? 0.46;
  const radii = useMemo(() => radiiFor(segs, headR), [segs, headR]);
  const pal = blendPalette(spec.palette, PALETTES.heroOld, spec.age ?? 0);
  const skin = getSkin(pal);
  const faceMap = getFace(pal, spec.face);
  const headMat = useMemo(() => toon({}), []);
  headMat.map = faceMap;
  const hi = (spec.detail ?? 'hi') === 'hi';
  const sh = spec.shadows ?? true;
  const feetMat = flat(pal.feet);
  const tipMat = flat(pal.spot);
  const stalkMat = flat(pal.dark);
  const seed = spec.seed ?? 1;

  const pts = layBody(spec);
  const breathe = 1 + (spec.breathe ?? 0) * 0.06;

  const head = new THREE.Vector3(...pts[0]);
  const target = new THREE.Vector3(...spec.lookAt);
  const headQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(target, head, UP));

  // Antennae with droop and a little lagging sway.
  const up = UP.clone().applyQuaternion(headQuat);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(headQuat);
  const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
  const droop = spec.droop ?? 0;
  const antennae = [-1, 1].map((s) => {
    const sway = noise1(spec.t * 1.3, seed * 7 + s) * 0.06;
    const root = head.clone().add(up.clone().multiplyScalar(headR * 0.85)).add(side.clone().multiplyScalar(s * headR * 0.35));
    const rise = up.clone().multiplyScalar(1 - droop * 0.9).add(fwd.clone().multiplyScalar(-droop * 0.6)).normalize();
    const mid = root.clone().add(rise.clone().multiplyScalar(headR * 0.7)).add(side.clone().multiplyScalar(s * (headR * 0.26 + sway)));
    const tipDir = rise.clone().add(new THREE.Vector3(0, -droop * 1.4, 0)).normalize();
    const tip = mid
      .clone()
      .add(tipDir.multiplyScalar(headR * 0.42))
      .add(side.clone().multiplyScalar(s * headR * 0.26))
      .add(fwd.clone().multiplyScalar(headR * 0.25 + sway));
    return {curve: new THREE.CatmullRomCurve3([root, mid, tip]), tip};
  });

  const hp = handPoint(pts, radii);
  const sc = spec.suitcase;

  return (
    <group>
      <mesh position={head} quaternion={headQuat} scale={headR} geometry={hi ? GEO.headHi : GEO.headLo} material={headMat} castShadow={sh} receiveShadow />
      {antennae.map((a, i) => (
        <group key={i}>
          <mesh material={stalkMat} castShadow={sh}>
            <tubeGeometry args={[a.curve, hi ? 16 : 8, headR * 0.06, 6, false]} />
          </mesh>
          <mesh position={a.tip} scale={headR * 0.16} geometry={GEO.tip} material={tipMat} castShadow={sh} />
        </group>
      ))}
      {pts.slice(1).map((p, k) => {
        const i = k + 1;
        const r = radii[i] * breathe;
        const prev = new THREE.Vector3(...pts[i - 1]);
        const cur = new THREE.Vector3(...p);
        const d = prev.clone().sub(cur);
        d.y = 0;
        if (d.lengthSq() < 1e-6) d.set(0, 0, -1);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize());
        const tr = spec.tremble ?? 0;
        return (
          <group key={i} position={cur} quaternion={q}>
            <mesh scale={[r, r * 0.95, r * 1.05]} geometry={hi ? GEO.segHi : GEO.segLo} material={skin} castShadow={sh} receiveShadow />
            {hi
              ? [-1, 1].map((s) => (
                  <mesh
                    key={s}
                    position={[s * r * 0.55 + noise1(spec.t * 22, i * 3 + s) * tr * 0.03, -r * 0.82 + Math.abs(noise1(spec.t * 18, i + s * 5)) * tr * 0.04, 0]}
                    scale={r * 0.28}
                    geometry={GEO.foot}
                    material={feetMat}
                    castShadow={sh}
                  />
                ))
              : null}
          </group>
        );
      })}
      {sc?.mode === 'carry' ? (
        (() => {
          const cp = carryPose(spec, pts, radii, sc.swing ?? 0);
          return (
            <>
              <group position={cp.hand} quaternion={cp.q}>
                <Suitcase color={sc.color} tag={sc.tag} shadows={sh} />
              </group>
              <Limb from={hp.neck.clone().add(hp.side.clone().multiplyScalar(radii[1] * 0.6))} to={cp.hand.clone().add(new THREE.Vector3(0, -0.02, 0))} material={skin} r={0.055 * (headR / 0.46)} />
            </>
          );
        })()
      ) : null}
      {sc?.mode === 'placed' ? (
        <group position={sc.pos} rotation={[0, sc.yaw, sc.tilt ?? 0]}>
          <group position={[0, 0.45, 0]}>
            <Suitcase color={sc.color} tag={sc.tag} open={sc.open} shadows={sh} />
          </group>
        </group>
      ) : null}
      {spec.armTo ? (
        <Limb from={hp.neck.clone().add(hp.side.clone().multiplyScalar(radii[1] * 0.6))} to={new THREE.Vector3(...spec.armTo)} material={skin} r={0.055 * (headR / 0.46)} />
      ) : null}
      {spec.armUp ? (
        <Limb
          from={hp.neck.clone().add(hp.side.clone().multiplyScalar(-radii[1] * 0.6))}
          to={hp.neck
            .clone()
            .add(hp.side.clone().multiplyScalar(-(radii[1] + 0.12)))
            .add(new THREE.Vector3(0, 0.1 + spec.armUp * 0.42, 0))
            .add(hp.heading.clone().multiplyScalar(spec.armUp * 0.18))}
          material={skin}
          r={0.055 * (headR / 0.46)}
        />
      ) : null}
    </group>
  );
};
