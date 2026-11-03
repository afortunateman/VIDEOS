// Flags cameras that sit inside geometry or whose view of the subject is blocked.
import {SHOTS} from '../src/shots';
import {DEPTH, RISE, WALL_X, WIDTH, groundY} from '../src/engine/stairs';
import * as THREE from 'three';

type V = [number, number, number];
const solidAt = (p: V, plaza: boolean): string | null => {
  const [x, y, z] = p;
  // Stair solid: within the stair width and below the tread (body extends ~3 units under).
  if (x > -WIDTH / 2 && x < WIDTH / 2) {
    const g = groundY(z, plaza);
    if (y < g - 0.01 && y > g - 3) return 'stairs';
  }
  // Wall slabs: x in [WALL_X-0.25, WALL_X+0.25], up to ~1.5 above the tread (2.1 for carved).
  if (x > WALL_X - 0.25 && x < WALL_X + 0.25) {
    const g = groundY(z, plaza);
    if (y < g + 1.4 && y > g - 0.6) return 'wall';
  }
  // Posts at x = W/2 - 0.18 every 4 steps (i % 4 == 2).
  const px = WIDTH / 2 - 0.18;
  if (Math.abs(x - px) < 0.16) {
    const i = Math.round(-z / DEPTH);
    if (((i % 4) + 4) % 4 === 2 && Math.abs(z + i * DEPTH) < 0.16) {
      const top = i * RISE;
      if (y > top && y < top + 0.75) return 'post';
    }
  }
  return null;
};

let problems = 0;
for (const s of SHOTS) {
  const T = s.end - s.start;
  for (const f of [0.02, 0.35, 0.7, 0.98]) {
    const t = f * T;
    const cam = s.cam(t, T);
    const focus = s.focus(t, T);
    const inside = solidAt(cam.pos, !!s.plaza);
    const a = new THREE.Vector3(...cam.pos);
    const b = new THREE.Vector3(...focus);
    const d = a.distanceTo(b);
    let blocked: string | null = null;
    for (let k = 1; k < 120; k++) {
      const u = k / 120;
      if (u * d > d - 0.6) break; // ignore the last 0.6 (the subject itself)
      const p = a.clone().lerp(b, u);
      const hit = solidAt([p.x, p.y, p.z], !!s.plaza);
      if (hit) {
        blocked = `${hit} at ${(u * d).toFixed(2)}`;
        break;
      }
    }
    if (inside || blocked) {
      problems++;
      console.log(`shot ${s.n} t=${t.toFixed(2)}: ${inside ? 'CAMERA INSIDE ' + inside : ''} ${blocked ? 'view blocked by ' + blocked : ''}`);
    }
  }
}
console.log(problems ? `${problems} problems` : 'all cameras clear');
