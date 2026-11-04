// ACT III & IV: years, exhaustion, breaking, and the voice.
import {Cam, move, Shot} from '../engine/director';
import {blendLooks, LOOKS} from '../engine/look';
import {crawlDistance, easeInOut, lerp, lerp3, range, smooth, V3} from '../engine/stairs';
import {add, crawlZ, easeStart, headOf, hero, HX, HeroOpts, look, lookKeys, yOf, zOf} from './common';

const AGE = 0.6;
const old = (o: HeroOpts) => hero({age: AGE, droop: 0.65, ...o});

// Voice pulses: one per phrase of "You're almost there. / Don't give up now. / You've come so far!"
const pulse = (t: number, starts: number[]) =>
  starts.reduce((acc, s) => {
    const d = t - s;
    return d < 0 ? acc : Math.max(acc, Math.exp(-d * 1.6) * smooth(range(d, 0, 0.15)));
  }, 0);
const VOICE_STARTS = [0.1, 1.45, 2.7];

export const ACT3: Shot[] = [
  // 21. Years passed.  (locked-off time-lapse)
  {
    n: 21,
    start: 44.6,
    end: 46.1,
    look: (t, T) =>
      lookKeys([
        [0, 'afternoon'],
        [0.25, 'dusk'],
        [0.45, 'night'],
        [0.62, 'predawn'],
        [0.78, 'dawn'],
        [1, 'overcast'],
      ])(t / T),
    cloudSeaY: yOf(33) - 12,
    worldT: (t) => t * 45,
    cam: () => ({pos: [8.2, yOf(33) + 2.3, zOf(33) + 3.4], target: [0, yOf(33) + 0.9, zOf(33) - 0.6], fov: 34}),
    focus: () => [HX, yOf(33), zOf(33)],
    actors: (t, T) => [hero({t, headZ: zOf(30) - (t / T) * 6 * 0.62, cycles: t * 6, age: (t / T) * AGE, droop: (t / T) * 0.65})],
    shadowCenter: () => [0, yOf(33), zOf(33)],
    shadowSize: 8,
  },
  // 22. His body grew tired.
  {
    n: 22,
    start: 46.1,
    end: 47.7,
    look: look('overcast'),
    cloudSeaY: yOf(40) - 12,
    handheld: 0.01,
    cam: (t) => {
      const h = headOf(old({t, headZ: crawlZ(zOf(40), t, 0.55, 0.3)}));
      return {pos: add(h, [0.62, 0.62, -1.45]), target: add(h, [0, 0.02, 0]), fov: 30};
    },
    focus: (t) => headOf(old({t, headZ: crawlZ(zOf(40), t, 0.55, 0.3)})),
    actors: (t) => [
      old({
        t,
        headZ: crawlZ(zOf(40), t, 0.55, 0.3),
        cycles: t * 0.55,
        face: {look: [0, 0.25], lid: 0.55, lidTilt: 0.7, brow: -0.55, mouth: 'tired', sweat: true},
        breathe: 0.25 * Math.sin(t * 5),
      }),
    ],
    shadowCenter: () => [HX, yOf(40), zOf(40)],
    post: () => ({focusRange: 0.4}),
  },
  // 23. His legs weakened.  (feet tremble and slip on the edge)
  {
    n: 23,
    start: 47.7,
    end: 49.5,
    look: look('overcast'),
    cloudSeaY: yOf(41) - 12,
    cam: move([
      {pos: [HX + 2.0, yOf(41) + 0.32, zOf(41) + 1.0], target: [HX + 0.1, yOf(41) + 0.05, zOf(41) + 0.75], fov: 32},
      {pos: [HX + 1.9, yOf(41) + 0.3, zOf(41) + 0.95], target: [HX + 0.1, yOf(41) + 0.03, zOf(41) + 0.75], fov: 32},
    ]),
    focus: () => [HX + 0.25, yOf(41) + 0.05, zOf(41) + 0.55],
    actors: (t) => [
      old({
        t,
        headZ: zOf(41.25) + 0.13 * smooth(range(t, 0.85, 1.0)),
        tremble: 1,
        face: {look: [0, 0.4], lid: 0.5, lidTilt: 0.7, brow: -0.65, mouth: t > 0.85 ? 'o' : 'tired', sweat: true},
        look: undefined,
        rear: 0.08 * smooth(range(t, 0.85, 1.0)),
      }),
    ],
    shadowCenter: () => [HX, yOf(41), zOf(41)],
    post: () => ({focusRange: 0.3}),
  },
  // 24. (sigh) But he kept climbing
  {
    n: 24,
    start: 49.5,
    end: 51.7,
    look: look('overcast'),
    cloudSeaY: yOf(43) - 12,
    cam: move([
      {pos: [HX + 0.55, yOf(43) + 1.95, zOf(43) - 1.7], target: [HX, yOf(43) + 0.5, zOf(43) + 0.1], fov: 34},
      {pos: [HX + 0.55, yOf(43) + 2.0, zOf(43) - 1.95], target: [HX, yOf(43) + 0.6, zOf(43) - 0.2], fov: 34},
    ]),
    focus: (t) => headOf(old({t, headZ: zOf(43) - crawlDistance(easeStart(t - 0.85) * 1.0, 0.36)})),
    actors: (t) => {
      const go = easeStart(t - 0.85);
      const breathe = t < 0.25 ? smooth(range(t, 0, 0.25)) * 0.7 : 0.7 - smooth(range(t, 0.25, 0.85)) * 1.5 + smooth(range(t, 0.85, 1.2)) * 0.8;
      const droopHead = smooth(range(t, 0.25, 0.7)) * (1 - smooth(range(t, 0.85, 1.2)));
      const spec = old({
        t,
        headZ: zOf(43) - crawlDistance(go * 1.0, 0.36),
        cycles: go * 1.0,
        breathe,
        rear: 0.18 * smooth(range(t, 0.85, 1.1)) * (1 - smooth(range(t, 1.6, 2.1))),
        face: {look: [0, -0.3 + 0.6 * droopHead], lid: 0.45 + 0.35 * droopHead, brow: lerp(-0.5, 0.7, smooth(range(t, 0.85, 1.2))), lidTilt: t > 0.85 ? undefined : 0.7, mouth: t > 0.85 ? 'grit' : 'frown', sweat: true},
      });
      const h = headOf(spec);
      spec.lookAt = lerp3([h[0] + 0.2, h[1] + 0.9, h[2] - 2.5], [h[0], h[1] - 1.2, h[2] - 1], droopHead);
      return [spec];
    },
    shadowCenter: () => [HX, yOf(43), zOf(43)],
  },
  // 25a. ...because the thought of remaining a caterpillar terrified him...  (dolly zoom down the drop)
  {
    n: 25,
    start: 51.7,
    end: 54.0,
    look: look('overcast'),
    cloudSeaY: yOf(47) - 16,
    // Dolly zoom on his face from uphill on the open side: he peers over the edge, scared,
    // while the staircase falling away behind him stretches.
    cam: (t, T) => {
      const h = headOf(old({t, headZ: zOf(47)}));
      const u = easeInOut(t / T);
      const d = lerp(3.0, 1.3, u);
      const out: V3 = [0.62, 0.5, -0.6];
      const n = Math.hypot(...out);
      return {
        pos: add(h, [(out[0] / n) * d, (out[1] / n) * d, (out[2] / n) * d]),
        target: add(h, [0.05, -0.2, 0]),
        fov: (2 * Math.atan(0.85 / d) * 180) / Math.PI,
      } as Cam;
    },
    focus: () => headOf(old({t: 0, headZ: zOf(47)})),
    actors: (t) => {
      const s = old({t, headZ: zOf(47), face: {look: [0.1, 0.55], lid: 0, brow: -0.85, mouth: 'o', sweat: true}});
      const h = headOf(s);
      s.lookAt = [h[0] + 1.9, h[1] - 0.55, h[2] - 0.7];
      return [s];
    },
    shadowCenter: () => [HX, yOf(47), zOf(47)],
    post: () => ({focusRange: 0.6, maxBlur: 9}),
  },
  // 25b. ...more than the staircase.  (he turns back up, jaw set, and climbs into the wind)
  {
    n: 25.5,
    start: 54.0,
    end: 56.4,
    look: (t) => blendLooks(LOOKS.overcast, LOOKS.dusk, 0.35 * smooth(range(t, 0, 2.4))),
    cloudSeaY: yOf(47) - 14,
    worldT: (t) => 54 + t * 3,
    cam: (t) => {
      const h = headOf(old({t, headZ: zOf(47) - crawlDistance(easeStart(t - 0.7) * 1.1, 0.4)}));
      return {pos: add(h, [0.62, 0.6, -1.6]), target: add(h, [0, 0.08, 0]), fov: 32};
    },
    handheld: 0.012,
    focus: (t) => headOf(old({t, headZ: zOf(47) - crawlDistance(easeStart(t - 0.7) * 1.1, 0.4)})),
    actors: (t) => {
      const go = easeStart(t - 0.7);
      const turn = smooth(range(t, 0.05, 0.6));
      const s = old({
        t,
        headZ: zOf(47) - crawlDistance(go * 1.1, 0.4),
        cycles: go * 1.1,
        face: {look: [0.1, lerp(0.5, -0.3, turn)], lid: lerp(0, 0.25, turn), brow: lerp(-0.8, 0.95, turn), mouth: turn > 0.5 ? 'grit' : 'o', sweat: true},
      });
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.7, h[1] - 1.8, h[2] + 2.4], [h[0] + 0.15, h[1] + 0.9, h[2] - 2.5], turn);
      return [s];
    },
    shadowCenter: () => [HX, yOf(47), zOf(47)],
    post: () => ({focusRange: 0.5}),
  },
  // 26. One day, he couldn't take it anymore.  (tries a step, slides back)
  {
    n: 26,
    start: 56.4,
    end: 58.8,
    look: look('dusk'),
    cloudSeaY: yOf(52) - 12,
    handheld: 0.015,
    cam: move([
      {pos: [3.7, yOf(52) + 1.0, zOf(52) + 0.2], target: [HX, yOf(52) + 0.5, zOf(52) - 0.3], fov: 34},
      {pos: [3.55, yOf(52) + 0.95, zOf(52) + 0.1], target: [HX, yOf(52) + 0.45, zOf(52) - 0.3], fov: 34},
    ]),
    focus: () => [HX, yOf(52) + 0.5, zOf(52)],
    actors: (t) => {
      const push = smooth(range(t, 0.2, 1.0));
      const fall = smooth(range(t, 1.15, 1.45));
      const s = old({
        t,
        headZ: zOf(52) - 0.32 * push * (1 - fall),
        rear: 0.45 * push * (1 - fall),
        breathe: -0.6 * fall,
        tremble: push * (1 - fall),
        face: {look: [0.1, -0.5 + 0.9 * fall], lid: 0.3 + 0.4 * fall, brow: 0.9 - 1.5 * fall, lidTilt: fall > 0.3 ? 0.7 : undefined, mouth: fall > 0.3 ? 'frown' : 'grit', sweat: true},
      });
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.2, h[1] + 1.2, h[2] - 2.0], [h[0] + 0.3, h[1] - 0.6, h[2] - 1.2], fall);
      return [s];
    },
    shadowCenter: () => [HX, yOf(52), zOf(52)],
  },
  // 27a. He stopped climbing and screamed at the top of his lungs.
  {
    n: 27,
    start: 58.8,
    end: 60.6,
    look: look('dusk'),
    cloudSeaY: yOf(52) - 12,
    shake: (t) => 0.03 * smooth(range(t, 0.35, 0.5)) * (1 - smooth(range(t, 1.5, 1.8))),
    cam: (t) => {
      const h = headOf(old({t, headZ: zOf(52), rear: 0.7 * smooth(range(t, 0.05, 0.4))}));
      return {pos: add(h, [1.75, 0.42, -1.05]), target: add(h, [0, 0.05, 0]), fov: 30};
    },
    focus: (t) => headOf(old({t, headZ: zOf(52), rear: 0.7 * smooth(range(t, 0.05, 0.4))})),
    actors: (t) => {
      const up = smooth(range(t, 0.05, 0.4));
      const s = old({
        t,
        headZ: zOf(52),
        rear: 0.7 * up,
        breathe: 0.7 * up,
        droop: 0.65 * (1 - up),
        face: up > 0.6 ? {look: [0, 0], lid: 0, brow: 1, mouth: 'scream', squeeze: true} : {look: [0, -0.3], lid: 0.45, lidTilt: 0.7, brow: -0.4, mouth: 'frown'},
      });
      const h = headOf(s);
      s.lookAt = [h[0] + 1.4, h[1] + 2.0, h[2] - 0.6];
      return [s];
    },
    shadowCenter: () => [HX, yOf(52), zOf(52)],
    post: () => ({focusRange: 0.5}),
  },
  // 27b. ...swallowed by the scale.
  {
    n: 27.5,
    start: 60.6,
    end: 62.4,
    look: (t) => blendLooks(LOOKS.dusk, LOOKS.night, 0.35 * smooth(range(t, 0, 1.8))),
    cloudSeaY: yOf(52) - 12,
    cam: move(
      [
        {pos: [50, yOf(52) + 20, zOf(52) + 40], target: [0, yOf(52) + 3, zOf(52) - 4], fov: 28},
        {pos: [58, yOf(52) + 24, zOf(52) + 47], target: [0, yOf(52) + 3.5, zOf(52) - 5], fov: 28},
      ],
      (u) => u,
    ),
    focus: () => [HX, yOf(52), zOf(52)],
    actors: (t) => {
      const s = old({t, headZ: zOf(52), rear: 0.7, breathe: 0.7, droop: 0, face: {look: [0, 0], lid: 0, brow: 1, mouth: 'scream', squeeze: true}});
      const h = headOf(s);
      s.lookAt = [h[0] + 0.3, h[1] + 2.2, h[2] - 1.2];
      return [s];
    },
    shadowCenter: () => [HX, yOf(52), zOf(52)],
    shadowSize: 6,
    post: () => ({maxBlur: 2}),
  },
  // 28. Then, from somewhere above, a voice called out.
  {
    n: 28,
    start: 62.4,
    end: 65.6,
    look: look('night'),
    cloudSeaY: yOf(52) - 12,
    topGlow: (t) => 0.9 * smooth(range(t, 1.6, 3.0)),
    cam: move([
      {pos: [HX + 1.5, yOf(52) + 0.3, zOf(52) + 2.4], target: [HX, yOf(52) + 0.6, zOf(52)], fov: 40},
      {pos: [HX + 1.6, yOf(52) + 0.25, zOf(52) + 2.5], target: [0, yOf(52) + 40, zOf(52) - 80], fov: 44},
    ]),
    focus: (t, T) => lerp3([HX, yOf(52) + 0.6, zOf(52)], [0, yOf(52) + 20, zOf(52) - 40], easeInOut(t / T)),
    actors: (t) => {
      const lift = smooth(range(t, 1.2, 2.8));
      const s = old({t, headZ: zOf(52), breathe: -0.4, face: {look: [0, -0.4 - 0.4 * lift], lid: 0.5 - 0.4 * lift, lidTilt: 0.7 * (1 - lift), brow: -0.5, mouth: lift > 0.5 ? 'flat' : 'frown'}});
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.2, h[1] - 0.6, h[2] - 1.5], [h[0] + 0.3, h[1] + 3, h[2] - 3], lift);
      return [s];
    },
    shadowCenter: () => [HX, yOf(52), zOf(52)],
    post: () => ({maxBlur: 5}),
  },
  // 29. "You're almost there. Don't give up now. You've come so far!"
  {
    n: 29,
    start: 65.6,
    end: 70.0,
    look: look('night'),
    cloudSeaY: yOf(52) - 12,
    topGlow: (t) => 0.7 + 0.3 * pulse(t, VOICE_STARTS),
    voice: (t) => 0.55 + 0.6 * pulse(t, VOICE_STARTS),
    cam: move([
      {pos: add(headOf(old({t: 0, headZ: zOf(52)})), [0.55, 0.62, -1.75]), target: add(headOf(old({t: 0, headZ: zOf(52)})), [0, 0.05, 0]), fov: 32},
      {pos: add(headOf(old({t: 0, headZ: zOf(52)})), [0.48, 0.55, -1.5]), target: add(headOf(old({t: 0, headZ: zOf(52)})), [0, 0.05, 0]), fov: 32},
    ]),
    focus: () => headOf(old({t: 0, headZ: zOf(52)})),
    actors: (t) => {
      const hope = smooth(range(t, 0.1, 1.6));
      const s = old({
        t,
        headZ: zOf(52),
        breathe: 0.2 * hope,
        droop: 0.65 - 0.4 * hope,
        face: {look: [0.1, -0.6], lid: lerp(0.45, 0.0, hope), brow: lerp(-0.4, -0.7, hope), mouth: hope > 0.6 ? 'soft' : 'flat', catchColor: '#ffe2a0'},
      });
      const h = headOf(s);
      s.lookAt = [h[0] + 0.25, h[1] + 3.2, h[2] - 3];
      return [s];
    },
    shadowCenter: () => [HX, yOf(52), zOf(52)],
    post: () => ({focusRange: 0.4}),
  },
];

// Insert (not in the film's timeline): "...but he kept climbing", seen from straight above. Same overcast
// light and the same tired, older body as shots 22-24; he hauls himself up the steps, slow and steady.
const TOP_Z0 = zOf(43);
const topHeadZ = (t: number) => TOP_Z0 - crawlDistance(t * 0.8, 0.36);
export const INSERT_TOP: Shot = {
  n: 24.5,
  start: 51.7,
  end: 53.7,
  look: look('overcast'),
  cloudSeaY: yOf(43) - 12,
  cam: (t) => {
    // Glides up the stair slope a little slower than he climbs, so he moves up through the frame.
    const z = lerp(TOP_Z0 + 0.5, TOP_Z0 + 0.2, t / 2);
    const y = (-z / 0.62) * 0.34;
    return {pos: [HX + 0.15, y + 5.2, z], target: [HX, y, z - 0.05], fov: 38, up: [0, 0, -1]};
  },
  focus: (t) => headOf(old({t, headZ: topHeadZ(t)})),
  actors: (t) => [
    old({
      t,
      headZ: topHeadZ(t),
      cycles: t * 0.8,
      face: {look: [0, -0.2], lid: 0.45, brow: 0.7, mouth: 'grit', sweat: true},
    }),
  ],
  shadowCenter: () => [HX, yOf(43), TOP_Z0 - 0.3],
};
