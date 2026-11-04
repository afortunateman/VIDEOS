import {ActorSpec, layBody, PALETTES, Palette, SuitcaseSpec} from '../engine/Actor';
import {blendLooks, Look, LOOKS} from '../engine/look';
import {crawlDistance, DEPTH, noise1, range, stepTop, V3} from '../engine/stairs';
import {Face} from '../scene/paint';

export const HX = 0.5; // hero's lane (open side of the stairs)
export const DX = -0.55; // the wall-side lane
export const STRIDE = 0.3;
export const RATE = 1.1; // crawl cycles per second

export const zOf = (step: number) => -step * DEPTH;
export const yOf = (step: number) => step * stepTop(1)[0];

export const L = LOOKS;
export const look = (name: string) => () => LOOKS[name];
export const lookBlend = (a: string, b: string, from: number, to: number) => (t: number) =>
  blendLooks(LOOKS[a], LOOKS[b], range(t, from, to));
export const withLook = (l: Look, o: Partial<Look>): Look => ({...l, ...o});
// Blend through a list of [time, look] keys.
export const lookKeys = (keys: [number, string | Look][]) => (t: number): Look => {
  const get = (k: string | Look) => (typeof k === 'string' ? LOOKS[k] : k);
  if (t <= keys[0][0]) return get(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, la] = keys[i];
    const [b, lb] = keys[i + 1];
    if (t <= b) return blendLooks(get(la), get(lb), smoothstep01((t - a) / (b - a)));
  }
  return get(keys[keys.length - 1][1]);
};
const smoothstep01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// Blink: the lid closes for ~0.13 s every few seconds, timing unique per character.
export const blink = (t: number, seed: number, lid: number) => {
  const period = 3.1 + (seed % 5) * 0.37;
  const p = (t + seed * 0.71) % period;
  const c = p < 0.06 ? p / 0.06 : p < 0.13 ? 1 - (p - 0.06) / 0.07 : 0;
  return Math.max(lid, c);
};

// Lip flap while a line is spoken (times local to the shot).
export const talk = (t: number, ranges: [number, number][], rest: Face['mouth'] = 'flat'): Face['mouth'] => {
  for (const [a, b] of ranges) {
    if (t >= a && t <= b) {
      const k = Math.floor((t - a) * 9 + Math.abs(noise1(t * 4, 3)) * 2) % 3;
      return (['o', 'open', 'flat'] as Face['mouth'][])[k];
    }
  }
  return rest;
};

// Crawl clocks that start and stop gently, so the body never jerks into or out of motion.
// easeStart: 0 before x = 0, then accelerates over w to full speed (x - w/2 after).
export const easeStart = (x: number, w = 0.35) => (x <= 0 ? 0 : x < w ? (x * x) / (2 * w) : x - w / 2);
// softStop: follows t, then decelerates over [stop - w, stop + w] to rest exactly at `stop`.
export const softStop = (t: number, stop: number, w = 0.3) =>
  t <= stop - w ? t : t >= stop + w ? stop : stop - ((stop + w - t) * (stop + w - t)) / (4 * w);

export const crawlZ = (z0: number, t: number, rate = RATE, stride = STRIDE) => z0 - crawlDistance(t * rate, stride);

export type HeroOpts = {
  t: number;
  headZ: number;
  x?: number;
  look?: V3;
  face?: Partial<Face>;
  cycles?: number;
  age?: number;
  droop?: number;
  rear?: number;
  suitcase?: SuitcaseSpec | null;
  swing?: number;
  palette?: Palette;
  plaza?: boolean;
  breathe?: number;
  tremble?: number;
  detail?: 'hi' | 'lo';
  id?: string;
  seed?: number;
  segs?: number;
  headR?: number;
  dir?: 1 | -1;
  armUp?: number;
};

export const baseFace: Face = {look: [0, -0.3], lid: 0.1, brow: 0, mouth: 'flat'};

export const hero = (o: HeroOpts): ActorSpec => {
  const seed = o.seed ?? 1;
  const f = {...baseFace, ...(o.face ?? {})};
  const spec: ActorSpec = {
    id: o.id ?? 'hero',
    palette: o.palette ?? PALETTES.hero,
    age: o.age ?? 0,
    body: {mode: 'stairs', headZ: o.headZ, x: o.x ?? HX, dir: o.dir ?? 1, plaza: o.plaza},
    cycles: o.cycles,
    rear: o.rear,
    lookAt: [0, 0, 0],
    face: {...f, lid: blink(o.t, seed, f.lid)},
    droop: o.droop ?? 0,
    t: o.t,
    suitcase:
      o.suitcase === undefined
        ? {mode: 'carry', tag: (o.id ?? 'hero') === 'hero', swing: o.swing ?? (o.cycles !== undefined ? Math.sin(o.cycles * Math.PI * 2) * 0.1 : 0)}
        : o.suitcase,
    breathe: o.breathe,
    tremble: o.tremble,
    detail: o.detail,
    seed,
    segs: o.segs,
    headR: o.headR,
    armUp: o.armUp,
  };
  const head = layBody(spec)[0];
  const dirZ = (o.dir ?? 1) === 1 ? -1 : 1;
  spec.lookAt = o.look ?? [head[0] + 0.2, head[1] + 0.9, head[2] + dirZ * 2.5];
  return spec;
};

export const headOf = (spec: ActorSpec): V3 => layBody(spec)[0];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
