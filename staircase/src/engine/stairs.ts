// Staircase geometry and contact physics.
// Stairs climb toward -z. Step i has its tread top at y = i * RISE, centred on z = -i * DEPTH.

export const DEPTH = 0.62;
export const RISE = 0.34;
export const WIDTH = 3.2;
export const WALL_X = -WIDTH / 2 - 0.25;

export type V3 = [number, number, number];

export const stepTop = (i: number): [number, number] => [i * RISE, -i * DEPTH];

export const stepIndexAt = (z: number, plaza: boolean) => {
  const i = Math.round(-z / DEPTH);
  return plaza ? Math.max(i, 0) : i;
};

export const groundY = (z: number, plaza = false) => stepIndexAt(z, plaza) * RISE;

// Height of the centre of a ball of radius r resting on the stair profile at z.
// It touches either a tread or a step's front edge, whichever holds it highest.
export const ballY = (z: number, r: number, plaza = false) => {
  let best = groundY(z, plaza) + r;
  // Check the nearest step edges (front corners) inside the footprint.
  const i0 = Math.floor((-z - r) / DEPTH - 0.5);
  const i1 = Math.ceil((-z + r) / DEPTH + 0.5);
  for (let i = i0; i <= i1; i++) {
    // Edge between step i (below, toward +z) and step i+1 sits at z = -(i + 0.5) * DEPTH,
    // with the corner at the top of step i+1.
    const ez = -(i + 0.5) * DEPTH;
    const dz = ez - z;
    if (Math.abs(dz) >= r) continue;
    const top = stepIndexAt(ez - 1e-4, plaza) * RISE;
    best = Math.max(best, top + Math.sqrt(r * r - dz * dz));
  }
  return best;
};

// Lay a body on the stairs. Head at headZ; each segment is placed `gap` behind the previous one
// (3D distance), resting on the steps. dir = +1 when the body trails toward +z (climbing up),
// -1 when it trails toward -z (crawling down).
export const solveChain = (
  headZ: number,
  x: number,
  radii: number[],
  gaps: number[],
  dir: 1 | -1,
  plaza = false,
): V3[] => {
  const pts: V3[] = [[x, ballY(headZ, radii[0], plaza), headZ]];
  for (let i = 1; i < radii.length; i++) {
    const [, py, pz] = pts[i - 1];
    const g = gaps[i - 1];
    const f = (z: number) => {
      const y = ballY(z, radii[i], plaza);
      return Math.hypot(y - py, z - pz) - g;
    };
    let lo = pz;
    let hi = pz + dir * g * 1.01;
    // Expand if a big drop makes the vertical distance alone exceed the gap.
    if (f(hi) < 0) hi = pz + dir * g * 1.6;
    for (let k = 0; k < 28; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid;
      else hi = mid;
    }
    const z = (lo + hi) / 2;
    pts.push([x, ballY(z, radii[i], plaza), z]);
  }
  return pts;
};

// Flat-ground chain for the plaza (y = 0), following a gentle arc.
export const flatChain = (
  head: [number, number],
  yaw: number, // direction the head faces, radians (0 = -z, up the stairs)
  curl: number, // radians of turn per segment
  radii: number[],
  gaps: number[],
): V3[] => {
  const pts: V3[] = [[head[0], radii[0], head[1]]];
  let a = yaw;
  let x = head[0];
  let z = head[1];
  for (let i = 1; i < radii.length; i++) {
    // Move backwards (opposite to facing).
    x += Math.sin(a) * gaps[i - 1];
    z += Math.cos(a) * gaps[i - 1];
    a += curl;
    pts.push([x, radii[i], z]);
  }
  return pts;
};

// Crawl progress: the head advances in pulses, one stride per wave cycle. Never moves backwards.
export const crawlDistance = (cycles: number, stride: number) =>
  stride * (cycles - Math.sin(2 * Math.PI * cycles) / (2 * Math.PI));

// Hump of the peristaltic wave for segment i (0 = head): travels from tail to head.
export const waveLift = (cycles: number, i: number, amp: number) => {
  const s = Math.sin(2 * Math.PI * cycles + i * 0.85);
  return s > 0 ? amp * s * s : 0;
};

// Deterministic smooth noise for handheld camera and idle motion.
export const noise1 = (t: number, seed = 0) => {
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
export const easeInOut = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
// Map t from [a, b] to [0, 1], clamped.
export const range = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
