// Physics audit: samples every shot at 10 Hz and flags bodies sinking into or floating above the
// stairs, actors passing through each other, the wall or the posts, and suitcases cutting into steps.
import * as THREE from 'three';
import {SHOTS} from '../src/shots';
import {ActorSpec, carryPose, gapsFor, layBody, radiiFor} from '../src/engine/Actor';
import {ballYRigid, DEPTH, partY, groundY, RISE, solveChain, WALL_X, WIDTH, V3} from '../src/engine/stairs';
import {CROWD_FAR, CROWD_WIDE} from '../src/shots/act5';

const only = process.argv[2] ? Number(process.argv[2]) : null;
type Hit = {shot: number; t: number; kind: string; who: string; amt: number};
const hits: Hit[] = [];
const flag = (h: Hit) => hits.push(h);

// Is a point inside the stair solid? Returns penetration depth (>0 inside).
const stairDepth = (x: number, y: number, z: number, plaza: boolean) => {
  if ((x < -WIDTH / 2 || x > WIDTH / 2) && !(plaza && z > -0.31)) return 0;
  const g = groundY(z, plaza);
  return y < g && y > g - 3 ? g - y : 0;
};
const POST_X = WIDTH / 2 - 0.18;

const caseCorners = (center: THREE.Vector3, q: THREE.Quaternion, half: V3): THREE.Vector3[] => {
  const out: THREE.Vector3[] = [];
  for (const sx of [-1, 0, 1]) for (const sy of [-1, 1]) for (const sz of [-1, -0.5, 0, 0.5, 1])
    out.push(new THREE.Vector3(sx * half[0], sy * half[1], sz * half[2]).applyQuaternion(q).add(center));
  return out;
};

for (const s of SHOTS) {
  if (only !== null && s.n !== only) continue;
  const T = s.end - s.start + (s.hold ?? 0);
  const plaza = !!s.plaza;
  for (let t = 0; t <= T; t += 0.1) {
    const actors: ActorSpec[] = s.actors?.(t, T) ?? [];
    const bodies: {id: string; pts: V3[]; radii: number[]}[] = [];
    const cases: {id: string; pts: THREE.Vector3[]}[] = [];
    for (const a of actors) {
      const segs = a.segs ?? 7;
      const radii = radiiFor(segs, a.headR ?? 0.46);
      const pts = layBody(a);
      bodies.push({id: a.id, pts, radii});
      const rearing = (a.rear ?? 0) > 0.001 ? Math.min(a.rearPivot ?? 3, pts.length - 1) : 0;
      // Contact with the steps (skip lifted front when rearing, and the crawl hump).
      pts.forEach((p, i) => {
        const r = radii[i] * (1 + (a.breathe ?? 0) * 0.06);
        const rest = a.body.mode === 'flat' ? (plaza ? groundY(p[2], true) + r : r) : partY(i, p[2], radii[i], plaza);
        const solid = a.body.mode === 'flat' ? rest : ballYRigid(p[2], radii[i], plaza);
        const gap = p[1] - rest;
        if (p[1] - solid < -0.04) flag({shot: s.n, t, kind: 'body sinks into steps', who: `${a.id}#${i}`, amt: solid - p[1]});
        if (a.body.mode === 'flat' && plaza && groundY(p[2], true) > 0.01) flag({shot: s.n, t, kind: 'flat body runs onto stairs', who: `${a.id}#${i}`, amt: groundY(p[2], true)});
        if (gap > 0.1 && i > rearing && a.cycles === undefined) flag({shot: s.n, t, kind: 'body floats', who: `${a.id}#${i}`, amt: gap});
        const onPlaza = plaza && p[2] > -0.31;
        if (onPlaza) {
          // Cornerstone block at [WALL_X-0.2, 1.6, -0.6], 0.9 x 3.8 x 2.6.
          const cx = WALL_X - 0.2;
          const dx = Math.max(0, Math.abs(p[0] - cx) - 0.45);
          const dz = Math.max(0, Math.abs(p[2] + 0.6) - 1.3);
          const d = Math.hypot(dx, dz);
          if (d < r - 0.02) flag({shot: s.n, t, kind: 'body inside cornerstone', who: `${a.id}#${i}`, amt: r - d});
        } else if (p[0] - r < WALL_X + 0.25 && p[1] - r < groundY(p[2], plaza) + 1.4) flag({shot: s.n, t, kind: 'body in wall', who: `${a.id}#${i}`, amt: WALL_X + 0.25 - (p[0] - r)});
        if (!onPlaza && p[0] > WIDTH / 2) flag({shot: s.n, t, kind: 'body off the edge', who: `${a.id}#${i}`, amt: p[0] - WIDTH / 2});
        // Posts.
        const k = Math.round(-p[2] / DEPTH);
        if (((k % 4) + 4) % 4 === 2 && !plaza) {
          const dx = Math.max(0, Math.abs(p[0] - POST_X) - 0.15);
          const dz = Math.max(0, Math.abs(p[2] + k * DEPTH) - 0.15);
          const d = Math.hypot(dx, dz);
          if (d < r - 0.03 && p[1] < k * RISE + 0.75 + r) flag({shot: s.n, t, kind: 'body through post', who: `${a.id}#${i}`, amt: r - d});
        }
      });
      // Carried suitcase.
      const sc = a.suitcase;
      if (sc?.mode === 'carry') {
        const cp = carryPose(a, pts, radii, sc.swing ?? 0);
        const q = cp.q;
        const c = new THREE.Vector3(0, -0.27, 0).applyQuaternion(q).add(cp.hand);
        if (cp.lift > 0.25) flag({shot: s.n, t, kind: 'case lifted high (check arm)', who: a.id, amt: cp.lift});
        let worst = 0;
        for (const v of caseCorners(c, q, [0.1, 0.18, 0.25])) worst = Math.max(worst, stairDepth(v.x, v.y, v.z, plaza));
        if (worst > 0.02) flag({shot: s.n, t, kind: 'carried case cuts into steps', who: a.id, amt: worst});
        cases.push({id: a.id, pts: caseCorners(c, q, [0.1, 0.18, 0.25])});
        // Case against own body (excluding the neck it hangs from).
        let into = 0;
        pts.forEach((p, i) => {
          if (i < 1) return;
          for (const v of caseCorners(c, q, [0.1, 0.18, 0.25])) into = Math.max(into, radii[i] * 0.95 - v.distanceTo(new THREE.Vector3(...p)));
        });
        if (into > 0.04) flag({shot: s.n, t, kind: 'carried case inside own body', who: a.id, amt: into});
      }
      if (sc?.mode === 'placed' && !a.armTo) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sc.yaw, sc.tilt ?? 0));
        const c = new THREE.Vector3(0, 0.45 - 0.27, 0).applyQuaternion(q).add(new THREE.Vector3(...sc.pos));
        const cs = caseCorners(c, q, [0.1, 0.18, 0.25]);
        cases.push({id: a.id + '(placed)', pts: cs});
        let worst = 0;
        let lowest = Infinity;
        for (const v of cs) {
          worst = Math.max(worst, stairDepth(v.x, v.y, v.z, plaza));
          lowest = Math.min(lowest, v.y - groundY(v.z, plaza));
        }
        if (worst > 0.02) flag({shot: s.n, t, kind: 'placed case cuts into steps', who: a.id, amt: worst});
        if (lowest > 0.02) flag({shot: s.n, t, kind: 'placed case floats', who: a.id, amt: lowest});
        // Support: are the bottom corners on the same tread? (overhang)
        const bottom = cs.filter((v) => v.y - c.y < -0.05);
        const unsup = bottom.filter((v) => v.y - groundY(v.z, plaza) > 0.04).length;
        if (unsup > bottom.length / 2) flag({shot: s.n, t, kind: 'placed case overhangs a step', who: a.id, amt: unsup / bottom.length});
      }
    }
    // Suitcases against other actors' bodies.
    for (const cs of cases)
      for (const b of bodies) {
        if (cs.id === b.id) continue;
        let w = 0;
        b.pts.forEach((p, i) => cs.pts.forEach((v) => (w = Math.max(w, b.radii[i] * 0.95 - v.distanceTo(new THREE.Vector3(...p))))));
        if (w > 0.04) flag({shot: s.n, t, kind: 'suitcase inside another body', who: `${cs.id}/${b.id}`, amt: w});
      }
    // Actor against actor.
    for (let i = 0; i < bodies.length; i++)
      for (let j = i + 1; j < bodies.length; j++) {
        let worst = 0;
        bodies[i].pts.forEach((p, a) =>
          bodies[j].pts.forEach((q, b) => {
            const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
            worst = Math.max(worst, bodies[i].radii[a] + bodies[j].radii[b] - d);
          }),
        );
        if (worst > 0.05) flag({shot: s.n, t, kind: 'actors pass through each other', who: `${bodies[i].id}/${bodies[j].id}`, amt: worst});
      }
  }
}

// Static crowd: members in the same lane overlapping each other.
const crowdCheck = (name: string, members: typeof CROWD_WIDE) => {
  const radii = radiiFor(5, 0.42);
  const gaps = gapsFor(radii);
  const chains = members.map((m) => solveChain(m.headZ, m.x, radii, gaps, 1));
  let n = 0;
  for (let i = 0; i < chains.length; i++)
    for (let j = i + 1; j < chains.length; j++) {
      if (members[i].x !== members[j].x) continue;
      if (Math.abs(members[i].headZ - members[j].headZ) > 4) continue;
      let w = 0;
      chains[i].forEach((p, a) => chains[j].forEach((q, b) => (w = Math.max(w, radii[a] + radii[b] - Math.hypot(p[1] - q[1], p[2] - q[2])))));
      if (w > 0.05) n++;
    }
  console.log(`${name}: ${members.length} members, ${n} overlapping pairs`);
};
crowdCheck('CROWD_WIDE', CROWD_WIDE);
crowdCheck('CROWD_FAR', CROWD_FAR);

// Summarise: one line per shot/kind/who with time span and worst amount.
const groups = new Map<string, {t0: number; t1: number; amt: number}>();
for (const h of hits) {
  const k = `shot ${h.shot} | ${h.kind} | ${h.who}`;
  const g = groups.get(k);
  if (!g) groups.set(k, {t0: h.t, t1: h.t, amt: h.amt});
  else {
    g.t1 = h.t;
    g.amt = Math.max(g.amt, h.amt);
  }
}
for (const [k, g] of groups) console.log(`${k} | t ${g.t0.toFixed(1)}-${g.t1.toFixed(1)} | worst ${g.amt.toFixed(3)}`);
console.log(groups.size ? `${groups.size} issues` : 'physics clean');
