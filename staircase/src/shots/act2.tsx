// ACT II: the climb, and the caterpillar coming down.
import {ActorSpec, PALETTES, Suitcase} from '../engine/Actor';
import {Cam, move, Shot} from '../engine/director';
import {LOOKS} from '../engine/look';
import {Dust, Skeleton} from '../engine/Props';
import {crawlDistance, easeInOut, lerp, lerp3, range, smooth, V3, WALL_X} from '../engine/stairs';
import {add, crawlZ, headOf, hero, HeroOpts, look, talk, withLook, yOf, zOf} from './common';

const descender = (o: HeroOpts): ActorSpec =>
  hero({
    ...o,
    id: o.id ?? 'descender',
    palette: PALETTES.descender,
    dir: -1,
    x: o.x ?? -0.55,
    headR: 0.44,
    seed: 6,
    droop: o.droop ?? 0.35,
    suitcase: o.suitcase === undefined ? {mode: 'carry', color: '#6a7fb0', swing: o.cycles !== undefined ? Math.sin(o.cycles * Math.PI * 2) * 0.1 : 0} : o.suitcase,
  });

const quitter = (id: string, step: number, x: number, o: Partial<ActorSpec> = {}, t = 0): ActorSpec => {
  const s = hero({t, headZ: zOf(step), x, headR: 0.3, segs: 5, palette: PALETTES.quitter, id, seed: step, suitcase: null, droop: 0.8});
  return {...s, ...o, face: {look: [0, 0.5], lid: 0.62, brow: -0.6, mouth: 'flat', ...(o.face ?? {})}};
};

// ---- shot 15–20 geometry: the meeting ----
const MEET = 150;
const H_STOP = zOf(MEET - 1.4);
const D_STOP = zOf(MEET + 0.4);
const heroMeet = (t: number, extra: Partial<HeroOpts> = {}) => hero({t, headZ: H_STOP, x: 0.5, ...extra});
const descMeet = (t: number, extra: Partial<HeroOpts> = {}) => descender({t, headZ: D_STOP, ...extra});
const HH = headOf(heroMeet(0));
const DH = headOf(descMeet(0));

// Approach: both crawl and stop at the same moment.
const ARRIVE = 2.7;
const heroApproachZ = (t: number) => {
  const c = Math.min(t, ARRIVE) * 1.1;
  const total = crawlDistance(ARRIVE * 1.1, 1);
  return H_STOP + (crawlDistance(ARRIVE * 1.1, 0.4) - crawlDistance(c, 0.4)) * (1 / Math.max(total, 1e-6)) * total;
};
const descApproachZ = (t: number) => {
  const c = Math.min(t, ARRIVE) * 1.1;
  return D_STOP - (crawlDistance(ARRIVE * 1.1, 0.5) - crawlDistance(c, 0.5));
};

const raking = withLook(LOOKS.afternoon, {sunDir: [0.55, 0.45, -0.7], hemiIntensity: 1.1});

export const ACT2: Shot[] = [
  // 8. He climbed past thousands of steps.  (god's-eye crane up)
  {
    n: 8,
    start: 17.1,
    end: 19.8,
    look: look('day'),
    cloudSeaY: yOf(40) - 12,
    cam: (t, T) => {
      const h = headOf(hero({t, headZ: crawlZ(zOf(40), t)}));
      const u = easeInOut(t / T);
      const r = lerp(-0.35, 0.2, u);
      return {pos: [h[0] + 0.05, h[1] + lerp(2.6, 14, u), h[2] + 0.02], target: h, fov: 42, up: [Math.sin(r), 0, -Math.cos(r)]} as Cam;
    },
    focus: (t) => headOf(hero({t, headZ: crawlZ(zOf(40), t)})),
    actors: (t) => [hero({t, headZ: crawlZ(zOf(40), t), cycles: t * 1.1})],
    shadowCenter: (t) => headOf(hero({t, headZ: crawlZ(zOf(40), t)})),
    shadowSize: 10,
    post: () => ({maxBlur: 3}),
  },
  // 9. Past caterpillars who had given up.
  {
    n: 9,
    start: 19.8,
    end: 22.0,
    look: look('day'),
    cloudSeaY: yOf(60) - 12,
    cam: (t) => {
      const h = headOf(hero({t, headZ: crawlZ(zOf(59.2), t, 1.1, 0.42), x: -0.05}));
      return {pos: [3.7, h[1] + 1.35, h[2] + 0.4], target: [0.35, h[1] + 0.05, h[2] - 0.75], fov: 36};
    },
    focus: (t) => headOf(hero({t, headZ: crawlZ(zOf(59.2), t, 1.1, 0.42), x: -0.05})),
    actors: (t) => {
      const hz = crawlZ(zOf(59.2), t, 1.1, 0.42);
      const h = headOf(hero({t, headZ: hz, x: -0.05}));
      const q1 = quitter('q1', 62, 1.0, {lookAt: [6, yOf(61) - 2, zOf(62) + 1]}, t);
      q1.suitcase = {mode: 'placed', pos: [1.42, yOf(60.5) + 0.1, zOf(60.5)], yaw: 0, tilt: Math.PI / 2, open: 1, color: '#b0705a'};
      const q1h = headOf(q1);
      const glance = smooth(range(t, 0.5, 1.1)) * (1 - smooth(range(t, 1.7, 2.2)));
      return [
        hero({
          t,
          headZ: hz,
          x: -0.05,
          cycles: t * 1.1,
          look: lerp3([h[0] + 0.2, h[1] + 0.9, h[2] - 2.5], q1h, glance),
          face: {look: [0.4 * glance, 0.2 * glance - 0.3], brow: 0.5 * glance, lid: 0.15},
        }),
        q1,
        {...quitter('q2', 64.2, -1.02, {}, t), lookAt: [-1.02, yOf(64) - 1, zOf(64.2) - 0.2] as V3, face: {look: [0, 0.6], lid: 0.85, brow: -0.5, mouth: 'flat'}},
      ];
    },
    extras: () => null,
    shadowCenter: () => [0, yOf(61), zOf(61)],
    // The first quitter's suitcase lies open and empty on the step below.
    post: () => ({}),
  },
  // 10. Past the skeletons of those who had died trying.  (rack focus)
  {
    n: 10,
    start: 22.0,
    end: 25.3,
    look: () => withLook(LOOKS.afternoon, {sunDir: [0.75, 0.55, 0.35]}),
    cloudSeaY: yOf(80) - 12,
    cam: move([
      {pos: [2.3, yOf(81) + 0.4, zOf(81) + 0.55], target: [0.0, yOf(80.4) + 0.5, zOf(80.4)], fov: 40},
      {pos: [2.25, yOf(81) + 0.42, zOf(81) + 0.4], target: [0.0, yOf(80.6) + 0.5, zOf(80.8)], fov: 40},
    ]),
    focus: (t) => {
      const skull: V3 = [1.05, yOf(81) + 0.5, zOf(81)];
      const h = headOf(hero({t, headZ: crawlZ(zOf(78.9), t, 1.1, 0.42), x: -0.05}));
      return lerp3(skull, h, smooth(range(t, 1.0, 1.9)));
    },
    actors: (t) => {
      const hz = crawlZ(zOf(78.9), t, 1.1, 0.42);
      const h = headOf(hero({t, headZ: hz, x: -0.05}));
      const see = smooth(range(t, 1.6, 2.4));
      return [
        hero({
          t,
          headZ: hz,
          x: -0.05,
          cycles: t * 1.1,
          look: lerp3([h[0] + 0.2, h[1] + 0.9, h[2] - 2.5], [1.05, yOf(81) + 0.3, zOf(81)], see),
          face: {look: [0.3 * see, 0.4 * see - 0.3], brow: 0.8 * see, lid: 0.0, mouth: see > 0.5 ? 'o' : 'flat'},
        }),
      ];
    },
    extras: () => (
      <>
        <Skeleton spec={{body: {mode: 'stairs', headZ: zOf(81), x: 1.05}, rear: 0.35, rearPivot: 2, segs: 6, headR: 0.32, lookAt: [1.2, yOf(83) + 0.6, zOf(83)]}} />
        <group position={[1.42, yOf(77) + 0.1, zOf(77)]} rotation={[0, 0.2, Math.PI / 2]}>
          <group position={[0, 0.45, 0]}>
            <Suitcase color="#9a8a7a" />
          </group>
        </group>
      </>
    ),
    shadowCenter: () => [0.5, yOf(80), zOf(80)],
    post: () => ({focusRange: 0.35, maxBlur: 8}),
  },
  // 11. Some had left messages carved into the walls.
  {
    n: 11,
    start: 25.3,
    end: 28.4,
    look: look('afternoon'),
    cloudSeaY: yOf(102) - 12,
    carvings: [{slab: 20, graffiti: true}],
    cam: move([
      {pos: [2.3, yOf(102) + 1.3, zOf(102) + 2.2], target: [WALL_X, yOf(102) + 0.9, zOf(102) + 1.0], fov: 40},
      {pos: [2.2, yOf(102) + 1.35, zOf(102) + 1.2], target: [WALL_X, yOf(102) + 1.1, zOf(102) - 0.9], fov: 40},
    ]),
    focus: () => [WALL_X + 0.3, yOf(102) + 1.0, zOf(102)],
    actors: (t) => {
      const hz = crawlZ(zOf(100.4), Math.min(t, 1.1), 1.1, 0.42);
      return [
        hero({
          t,
          headZ: hz,
          x: 0.25,
          cycles: Math.min(t, 1.1) * 1.1,
          look: [WALL_X, yOf(102) + 1.0 + 0.2 * Math.sin(t), zOf(101.5) - smooth(range(t, 0.8, 3)) * 1.4],
          face: {look: [-0.4, -0.3], lid: 0.05, brow: -0.2},
        }),
      ];
    },
    shadowCenter: () => [0, yOf(102), zOf(102)],
  },
  // 12–14. The whispered messages.
  ...([
    [12, 28.4, 29.6, 21, ['KEEP', 'GOING']],
    [13, 29.6, 31.2, 22, ['THE TOP IS', 'WORTH IT']],
    [14, 31.2, 32.8, 23, ["YOU'RE ALMOST", 'THERE']],
  ] as [number, number, number, number, string[]][]).map(([n, a, b, slab, lines]): Shot => {
    const st = slab * 5 + 2;
    const yc = yOf(st) + 0.45;
    const zc = zOf(st);
    const keys: Cam[] =
      n === 14
        ? [
            {pos: [1.1, yc + 0.2, zc + 0.5], target: [WALL_X, yc + 0.1, zc - 0.1], fov: 46},
            {pos: [0.6, yc + 0.35, zc + 1.2], target: [-0.9, yOf(st - 1) + 0.25, zOf(st - 1)], fov: 40},
          ]
        : [
            {pos: [1.15, yc + 0.12, zc + 0.4], target: [WALL_X, yc, zc + 0.15], fov: 46},
            {pos: [1.15, yc + 0.12, zc - 0.25], target: [WALL_X, yc, zc - 0.15], fov: 46},
          ];
    return {
      n,
      start: a,
      end: b,
      look: () => raking,
      cloudSeaY: yOf(st) - 12,
      carvings: [{slab, lines, seed: n}],
      cam: move(keys, n === 14 ? (u) => easeInOut(range(u, 0.35, 1)) : (u) => u),
      focus: (t, T) => (n === 14 ? lerp3([WALL_X, yc, zc], [-0.9, yOf(st - 1) + 0.3, zOf(st - 1)], smooth(range(t / T, 0.4, 0.9))) : [WALL_X, yc, zc]),
      extras: () =>
        n === 14 ? (
          <Skeleton spec={{body: {mode: 'stairs', headZ: zOf(st - 1.2), x: -0.95, dir: -1}, segs: 6, headR: 0.32, lookAt: [WALL_X, yOf(st) + 0.2, zOf(st - 1.2)]}} />
        ) : null,
      shadowCenter: () => [WALL_X + 1, yc, zc],
      shadowSize: 5,
      post: () => ({focusRange: 0.25, maxBlur: 9}),
    };
  }),
  // 15. One day, he came across a caterpillar descending the staircase.
  {
    n: 15,
    start: 32.8,
    end: 36.6,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    cam: move([
      {pos: [7.4, HH[1] + 1.5, (HH[2] + DH[2]) / 2 + 0.9], target: [0, (HH[1] + DH[1]) / 2 + 0.1, (HH[2] + DH[2]) / 2 - 0.2], fov: 28},
      {pos: [6.2, HH[1] + 1.2, (HH[2] + DH[2]) / 2 + 0.6], target: [0, (HH[1] + DH[1]) / 2 + 0.1, (HH[2] + DH[2]) / 2 - 0.1], fov: 28},
    ]),
    focus: () => lerp3(HH, DH, 0.5),
    actors: (t) => {
      const meet = smooth(range(t, ARRIVE - 0.4, ARRIVE + 0.3));
      const h = heroMeet(t, {headZ: heroApproachZ(t), cycles: Math.min(t, ARRIVE) * 1.1});
      const d = descMeet(t, {headZ: descApproachZ(t), cycles: Math.min(t, ARRIVE) * 1.1});
      const hp = headOf(h);
      const dp = headOf(d);
      h.lookAt = lerp3([hp[0] + 0.2, hp[1] + 0.9, hp[2] - 2.5], dp, meet);
      d.lookAt = lerp3([dp[0], dp[1] - 0.6, dp[2] + 2.5], hp, meet);
      h.face = {...h.face, look: [0, -0.3 + meet * 0.1], brow: -0.3 * meet};
      d.face = {...d.face, look: [0, 0.2], lid: Math.max(d.face.lid, 0.4)};
      return [h, d];
    },
    shadowCenter: () => lerp3(HH, DH, 0.5),
  },
  // 16. "What's at the top?" he asked.  (over the descender's shoulder)
  {
    n: 16,
    start: 36.6,
    end: 38.8,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    cam: move([
      {pos: [1.05, DH[1] + 1.0, DH[2] - 1.55], target: add(HH, [0, 0.05, 0]), fov: 34},
      {pos: [0.98, DH[1] + 0.98, DH[2] - 1.42], target: add(HH, [0, 0.05, 0]), fov: 34},
    ]),
    focus: () => HH,
    actors: (t) => [
      heroMeet(t, {look: DH, face: {look: [-0.1, -0.5], lid: 0, brow: -0.5, mouth: talk(t, [[0.34, 1.32]], 'flat')}}),
      descMeet(t, {look: HH, face: {look: [0, 0.4], lid: 0.4, brow: 0, mouth: 'flat'}}),
    ],
    shadowCenter: () => lerp3(HH, DH, 0.5),
    post: () => ({focusRange: 0.5}),
  },
  // 17. "Glory," the caterpillar replied.  (reverse, over the hero's shoulder)
  {
    n: 17,
    start: 38.8,
    end: 41.3,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    voice: (t) => 0.55 * smooth(range(t, 0.15, 0.6)) * (1 - smooth(range(t, 1.7, 2.4))),
    cam: move([
      {pos: [3.3, HH[1] + 0.5, HH[2] + 1.7], target: add(DH, [0, 0.1, 0]), fov: 30},
      {pos: [3.15, HH[1] + 0.46, HH[2] + 1.55], target: add(DH, [0, 0.14, 0]), fov: 30},
    ]),
    focus: () => DH,
    actors: (t) => {
      const up = smooth(range(t, 0.2, 0.7)) * (1 - smooth(range(t, 1.6, 2.3)));
      return [
        heroMeet(t, {look: DH, face: {look: [-0.1, -0.5], lid: 0, brow: -0.5}}),
        descMeet(t, {
          look: lerp3(HH, [DH[0] + 1.6, DH[1] + 2.6, DH[2] + 0.4], up),
          armUp: up,
          face: {look: [0.1, -0.5 * up + 0.2 * (1 - up)], lid: 0.4 - 0.2 * up, brow: -0.4 * up, mouth: talk(t, [[0.24, 0.95]], up > 0.4 ? 'soft' : 'flat'), catchColor: up > 0.3 ? '#ffe2a0' : undefined},
        }),
      ];
    },
    shadowCenter: () => lerp3(HH, DH, 0.5),
    post: () => ({focusRange: 0.6}),
  },
  // 18. "Have you seen it?"
  {
    n: 18,
    start: 41.3,
    end: 42.5,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    cam: move([
      {pos: add(HH, [-0.2, 0.88, -1.5]), target: add(HH, [0, 0.04, 0]), fov: 30},
      {pos: add(HH, [-0.18, 0.82, -1.38]), target: add(HH, [0, 0.04, 0]), fov: 30},
    ]),
    focus: () => HH,
    actors: (t) => [
      heroMeet(t, {look: DH, face: {look: [-0.2, -0.45], lid: 0, brow: -0.6, mouth: talk(t, [[0.18, 0.88]], 'flat')}}),
      descMeet(t, {look: HH}),
    ],
    shadowCenter: () => HH,
    post: () => ({focusRange: 0.45}),
  },
  // 19. "No."
  {
    n: 19,
    start: 42.5,
    end: 43.4,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    cam: move([
      {pos: add(DH, [1.5, 0.1, 0.75]), target: add(DH, [0, 0.04, 0]), fov: 30},
      {pos: add(DH, [1.42, 0.1, 0.7]), target: add(DH, [0, 0.04, 0]), fov: 30},
    ]),
    focus: () => DH,
    actors: (t) => {
      const away = smooth(range(t, 0.45, 0.8));
      return [
        heroMeet(t, {look: DH}),
        descMeet(t, {
          look: lerp3(HH, add(DH, [-1.5, -0.8, 0.6]), away * 0.6),
          face: {look: [-0.5 * away, 0.3 * away], lid: 0.45, brow: -0.25, mouth: talk(t, [[0.21, 0.55]], 'flat')},
        }),
      ];
    },
    shadowCenter: () => DH,
    post: () => ({focusRange: 0.45}),
  },
  // 20. "But I've heard."  (he moves on down; the hero watches him go)
  {
    n: 20,
    start: 43.4,
    end: 44.6,
    look: look('afternoon'),
    cloudSeaY: yOf(MEET) - 12,
    cam: move([
      {pos: [4.6, HH[1] + 1.05, HH[2] - 0.3], target: [0, (HH[1] + DH[1]) / 2, (HH[2] + DH[2]) / 2 + 0.3], fov: 34},
      {pos: [4.5, HH[1] + 1.0, HH[2] + 0.1], target: [0, HH[1], HH[2] + 0.4], fov: 34},
    ]),
    focus: () => HH,
    actors: (t) => {
      const go = Math.max(0, t - 0.7);
      const dz = D_STOP + crawlDistance(go * 1.1, 0.5);
      const d = descMeet(t, {
        headZ: dz,
        cycles: go * 1.1,
        rear: 0.12 * Math.sin(range(t, 0.15, 0.6) * Math.PI),
        face: {look: [0, 0.3], lid: 0.45, brow: 0.2, mouth: talk(t, [[0.16, 0.8]], 'flat')},
      });
      const dp = headOf(d);
      d.lookAt = go > 0 ? [dp[0], dp[1] - 0.5, dp[2] + 2.5] : HH;
      return [heroMeet(t, {look: dp, face: {look: [-0.2, 0.1], lid: 0.1, brow: 0.3}}), d];
    },
    shadowCenter: () => lerp3(HH, DH, 0.5),
  },
];

export const _unused = {Dust, lerp};
