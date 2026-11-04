// Motion audit: steps every shot at 30 fps and flags one-frame pops in any body segment, the carried
// suitcase or the head's facing (a jump much bigger than the motion either side of it).
import * as THREE from 'three';
import {SHOTS} from '../src/shots';
import {ActorSpec, carryPose, layBody, radiiFor} from '../src/engine/Actor';

const only = process.argv[2] ? Number(process.argv[2]) : null;
const FPS = 30;
type Sample = {pts: THREE.Vector3[]; hand: THREE.Vector3 | null; fwd: THREE.Vector3};
const UP = new THREE.Vector3(0, 1, 0);
const sample = (a: ActorSpec): Sample => {
  const radii = radiiFor(a.segs ?? 7, a.headR ?? 0.46);
  const p = layBody(a);
  const pts = p.map((q) => new THREE.Vector3(...q));
  const sc = a.suitcase;
  const hand = sc?.mode === 'carry' ? carryPose(a, p, radii, sc.swing ?? 0).hand : null;
  const head = pts[0];
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...a.lookAt), head, UP));
  return {pts, hand, fwd: new THREE.Vector3(0, 0, 1).applyQuaternion(q)};
};

let count = 0;
for (const s of SHOTS) {
  if (only !== null && s.n !== only) continue;
  const T = s.end - s.start + (s.hold ?? 0);
  const n = Math.round(T * FPS);
  const series = new Map<string, Sample[]>();
  for (let f = 0; f <= n; f++) {
    const t = f / FPS;
    for (const a of s.actors?.(t, T) ?? []) {
      if (!series.has(a.id)) series.set(a.id, []);
      series.get(a.id)!.push(sample(a));
    }
  }
  for (const [id, ser] of series) {
    if (ser.length < 5) continue;
    const tracks: {name: string; at: (k: number) => THREE.Vector3}[] = [];
    ser[0].pts.forEach((_, i) => tracks.push({name: `seg${i}`, at: (k) => ser[k].pts[i]}));
    if (ser.every((x) => x.hand)) tracks.push({name: 'case', at: (k) => ser[k].hand!});
    tracks.push({name: 'facing', at: (k) => ser[k].fwd.clone().multiplyScalar(0.5)});
    for (const tr of tracks) {
      // accel[k] = |x[k+1] - 2x[k] + x[k-1]|, velocity |x[k+1]-x[k]|
      const vel: number[] = [];
      for (let k = 0; k + 1 < ser.length; k++) vel.push(tr.at(k + 1).distanceTo(tr.at(k)));
      for (let k = 2; k + 2 < vel.length; k++) {
        const nb = [vel[k - 2], vel[k - 1], vel[k + 1], vel[k + 2]].sort((x, y) => x - y);
        const m = (nb[1] + nb[2]) / 2;
        if (vel[k] > 0.012 && vel[k] > 2.5 * m + 0.004) {
          count++;
          console.log(`shot ${s.n} t=${(k / FPS).toFixed(2)} f+${k} ${id} ${tr.name}: step ${(vel[k] * 100).toFixed(1)}cm vs ${(m * 100).toFixed(1)}cm`);
        }
      }
    }
  }
}
console.log(count ? `${count} pops` : 'no pops');
