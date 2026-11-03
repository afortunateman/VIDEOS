// ACT I: the legend.
import {flatChain} from '../engine/stairs';
import {ActorSpec, gapsFor, PALETTES, radiiFor} from '../engine/Actor';
import {move, Shot, still} from '../engine/director';
import {blendLooks, LOOKS} from '../engine/look';
import {ButterflyShadow, Campfire, Embers} from '../engine/Props';
import {easeInOut, range, smooth, V3, WALL_X} from '../engine/stairs';
import {blink, crawlZ, headOf, hero, HX, look, talk, yOf, zOf} from './common';

const FIRE: V3 = [1.2, 0, 1.8];

const yawFacing = (from: [number, number], to: [number, number]) => Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]));
const around = (deg: number, r = 1.55): [number, number] => [FIRE[0] + Math.cos((deg * Math.PI) / 180) * r, FIRE[2] + Math.sin((deg * Math.PI) / 180) * r];

const ELDER_HEAD: [number, number] = around(215, 1.6);
const HERO_SEAT = around(70);

// The circle of listeners at the fire, in flat-ground poses.
const fireCircle = (t: number, o: {elderRear?: number; elderArm?: number; heroLook?: V3; heroFace?: Partial<ActorSpec['face']>; elderTalk?: boolean}) => {
  const listener = (id: string, deg: number, pal: string, seed: number, headR = 0.36): ActorSpec => {
    const p = around(deg);
    return {
      id,
      palette: PALETTES[pal],
      body: {mode: 'flat', head: p, yaw: yawFacing(p, [FIRE[0], FIRE[2]]), curl: 0.22},
      segs: 5,
      headR,
      lookAt: [ELDER_HEAD[0], 0.9, ELDER_HEAD[1]],
      face: {look: [0, -0.1], lid: blink(t, seed, 0.05), brow: -0.2, mouth: 'flat', catchColor: '#ffd08a'},
      t,
      seed,
      detail: 'hi',
      shadows: true,
    };
  };
  const heroSpec: ActorSpec = {
    id: 'hero',
    palette: PALETTES.hero,
    body: {mode: 'flat', head: HERO_SEAT, yaw: yawFacing(HERO_SEAT, [FIRE[0], FIRE[2]]), curl: -0.18},
    lookAt: o.heroLook ?? [ELDER_HEAD[0], 0.9, ELDER_HEAD[1]],
    face: {look: [0, -0.1], lid: blink(t, 1, 0.05), brow: -0.3, mouth: 'flat', catchColor: '#ffc070', ...(o.heroFace ?? {})},
    t,
    seed: 1,
    suitcase: {mode: 'placed', pos: [HERO_SEAT[0] + 0.55, 0, HERO_SEAT[1] + 0.75], yaw: 0.7, tag: true},
  };
  const elder: ActorSpec = {
    id: 'elder',
    palette: PALETTES.elder,
    body: {mode: 'flat', head: ELDER_HEAD, yaw: yawFacing(ELDER_HEAD, [FIRE[0] + 0.6, FIRE[2] + 1.2]), curl: 0.15},
    segs: 7,
    headR: 0.44,
    rear: o.elderRear ?? 0.25,
    rearPivot: 3,
    lookAt: [FIRE[0] + 0.8, 1.0, FIRE[2] + 1.4],
    face: {look: [0.1, 0], lid: blink(t, 4, 0.35), brow: 0.2, mouth: o.elderTalk === false ? 'soft' : talk(t, [[0, 99]], 'soft'), elder: true, catchColor: '#ffc070'},
    droop: 0.55,
    t,
    seed: 4,
    armUp: o.elderArm ?? 0.2 + 0.25 * Math.max(0, Math.sin(t * 2.2)),
    suitcase: null,
  };
  return [elder, heroSpec, listener('y1', 2, 'yellow', 7), listener('b1', 36, 'blue', 9), listener('p1', 106, 'pink', 11)];
};

export const ACT1: Shot[] = [
  // 1. There was once a caterpillar who was climbing a staircase.
  {
    n: 1,
    start: 0,
    end: 4.0,
    look: look('dawn'),
    cloudSeaY: yOf(30) - 9,
    cam: move([
      {pos: [40, yOf(30) + 8, zOf(30) + 34], target: [0, yOf(30) + 5, zOf(30) - 14], fov: 30},
      {pos: [16, yOf(30) + 3.4, zOf(30) + 12], target: [0, yOf(30) + 1.8, zOf(30) - 5], fov: 30},
    ]),
    focus: (t) => headOf(hero({t, headZ: crawlZ(zOf(30), t)})),
    actors: (t) => [hero({t, headZ: crawlZ(zOf(30), t), cycles: t * 1.1})],
    shadowCenter: () => [0, yOf(30), zOf(30)],
    shadowSize: 8,
  },
  // 2. Nobody knew who had built it.
  {
    n: 2,
    start: 4.0,
    end: 6.2,
    plaza: true,
    look: look('morningMist'),
    cam: move(
      [
        {pos: [2.7, 0.95, 2.8], target: [-1.6, 1.35, -0.1], fov: 36},
        {pos: [2.45, 0.9, 0.7], target: [-1.6, 1.35, -1.0], fov: 36},
      ],
      (u) => u,
    ),
    focus: () => [-1.6, 1.3, -0.6],
    shadowCenter: () => [0, 0, 0],
  },
  // 3. Nobody knew what was at the top.
  {
    n: 3,
    start: 6.2,
    end: 8.4,
    plaza: true,
    look: look('morningMist'),
    cam: move([
      {pos: [1.4, 0.35, 4.6], target: [0.1, 1.3, -4], fov: 50},
      {pos: [1.3, 0.42, 4.0], target: [0.1, 26, -50], fov: 50},
    ]),
    focus: () => [0, 7, -10],
    shadowCenter: () => [0, 1, -2],
    post: () => ({maxBlur: 4}),
  },
  // 4. But the older caterpillars told stories.
  {
    n: 4,
    start: 8.4,
    end: 11.2,
    plaza: true,
    look: look('fire'),
    cam: move([
      {pos: [4.4, 2.15, 6.0], target: [0.35, 0.75, 1.0], fov: 40},
      {pos: [3.8, 1.9, 5.4], target: [0.35, 0.8, 1.0], fov: 40},
    ]),
    focus: () => FIRE,
    actors: (t) => fireCircle(t, {}),
    extras: (t) => (
      <>
        <Campfire pos={FIRE} t={t + 8.4} shadows={false} />
        <Embers pos={FIRE} t={t + 8.4} />
      </>
    ),
    shadowCenter: () => [0.5, 0, 1.5],
  },
  // 5. "Climb high enough," they said,
  {
    n: 5,
    start: 11.2,
    end: 13.4,
    plaza: true,
    look: look('fire'),
    cam: move([
      {pos: [3.6, 1.32, 3.0], target: [-0.6, 1.6, 0.4], fov: 42},
      {pos: [3.35, 1.36, 2.8], target: [-0.6, 1.75, 0.35], fov: 42},
    ]),
    focus: () => [-1.6, 1.7, -0.5],
    actors: (t) => fireCircle(t + 2.8, {elderRear: 0.25 + 0.6 * easeInOut(range(t, 0.1, 0.9)), elderArm: 0.4 + 0.6 * easeInOut(range(t, 0.2, 1.0))}),
    extras: (t) => (
      <>
        <Campfire pos={FIRE} t={t + 11.2} shadows={false} />
        <Embers pos={FIRE} t={t + 11.2} />
        <ButterflyShadow pos={[WALL_X - 0.2 + 0.46, 2.0, -0.3]} size={2.0} t={t} opacity={0.85 * smooth(range(t, 0.45, 1.2))} />
      </>
    ),
    shadowCenter: () => [0, 0, 1],
    post: () => ({focusRange: 1.2}),
  },
  // 6. "and you'll become a butterfly."
  {
    n: 6,
    start: 13.4,
    end: 15.6,
    plaza: true,
    look: look('fire'),
    cam: move([
      {pos: [HERO_SEAT[0] + 0.78, 0.66, HERO_SEAT[1] - 2.15], target: [HERO_SEAT[0], 0.62, HERO_SEAT[1]], fov: 30},
      {pos: [HERO_SEAT[0] + 0.62, 0.64, HERO_SEAT[1] - 1.72], target: [HERO_SEAT[0], 0.64, HERO_SEAT[1]], fov: 30},
    ]),
    focus: () => [HERO_SEAT[0], 0.5, HERO_SEAT[1]],
    actors: (t) => {
      const up = easeInOut(range(t, 0.9, 1.7));
      const lookAt: V3 = [ELDER_HEAD[0] * (1 - up) + 0.4 * up, 0.9 * (1 - up) + 4.5 * up, ELDER_HEAD[1] * (1 - up) - 5 * up];
      return fireCircle(t + 5, {heroLook: lookAt, heroFace: {look: [0.05, -0.2 - up * 0.5], lid: 0.0, brow: -0.6 * up, mouth: up > 0.5 ? 'o' : 'flat'}});
    },
    extras: (t) => (
      <>
        <Campfire pos={FIRE} t={t + 13.4} shadows={false} />
        <Embers pos={FIRE} t={t + 13.4} />
      </>
    ),
    shadowCenter: () => [HERO_SEAT[0], 0, HERO_SEAT[1]],
    post: () => ({focusRange: 0.5}),
  },
  // 7. So he climbed.
  {
    n: 7,
    start: 15.6,
    end: 17.1,
    plaza: true,
    look: () => ({...blendLooks(LOOKS.dawn, LOOKS.day, 0.55), sunDir: [0.8, 0.45, 0.45]}),
    cam: move([
      {pos: [3.7, 1.15, 1.5], target: [0.3, 0.55, -0.7], fov: 38},
      {pos: [3.5, 1.1, 1.0], target: [0.3, 0.6, -1.0], fov: 38},
    ]),
    focus: (t) => headOf(hero({t, headZ: crawlZ(0.75, t, 1.3, 0.5), plaza: true})),
    actors: (t) => [
      hero({
        t,
        headZ: crawlZ(0.75, t, 1.3, 0.5),
        plaza: true,
        cycles: t * 1.3,
        face: {look: [0.3, -0.4], lid: 0.15, brow: 0.6, mouth: 'flat'},
      }),
    ],
    shadowCenter: () => [HX, 0, 0],
    shadowSize: 4,
  },
];

export {flatChain, gapsFor, radiiFor, still};
