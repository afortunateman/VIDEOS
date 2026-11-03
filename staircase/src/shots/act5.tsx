// ACT V & VI: everyone is almost there; he sits; the question.
import {ActorSpec, gapsFor, handPoint, layBody, PALETTES, radiiFor} from '../engine/Actor';
import {Cam, move, Shot, still} from '../engine/director';
import {blendLooks, LOOKS} from '../engine/look';
import {Crowd, CrowdMember, Sunbeam} from '../engine/Props';
import {Card, assets} from '../engine/World';
import {crawlDistance, easeInOut, lerp, lerp3, range, rngLike, smooth, V3} from './act5util';
import {add, blink, crawlZ, headOf, hero, HeroOpts, HX, look, lookKeys, withLook, yOf, zOf} from './common';

const S = 52; // the step where he stops (no railing post here)
const AGE = 0.7;
const HZ = zOf(S);
const old = (o: Partial<HeroOpts> & {t: number}) => hero({headZ: HZ, age: AGE, droop: 0.45, ...o});

// Where the suitcase ends up when he puts it down: on the tread beside him.
const restSpec = old({t: 0});
const restHand = handPoint(layBody(restSpec), radiiFor(7, 0.46));
const CASE_STEP = Math.round(-restHand.hand.z / 0.62);
const CASE_REST: V3 = [HX + 0.62, yOf(CASE_STEP), restHand.hand.z];

const SIT = 0.55;
const seated = (o: Partial<HeroOpts> & {t: number}) =>
  old({rear: SIT, suitcase: {mode: 'placed', pos: CASE_REST, yaw: 0, tag: true}, ...o});
const SH = headOf(seated({t: 0}));

// Same hopeful face on everyone who hears the voice.
const hearing = {look: [0.1, -0.6] as [number, number], lid: 0, brow: -0.7, mouth: 'soft' as const, catchColor: '#ffe2a0'};

const climber = (id: string, step: number, x: number, pal: string, t: number, extra: Partial<HeroOpts> = {}): ActorSpec =>
  hero({t, id, headZ: zOf(step), x, palette: PALETTES[pal], headR: 0.42, seed: step * 3, suitcase: {mode: 'carry', color: ['#6a7fb0', '#7fa06a', '#b08a5a', '#a06a8a'][Math.floor(step) % 4]}, ...extra});

// The crowd for the wide shots: climbers scattered all along the stairs.
const crowdMembers = (exclude: [number, number], density = 1): CrowdMember[] => {
  const r = rngLike(17);
  const out: CrowdMember[] = [];
  const pals = ['hero', 'yellow', 'blue', 'pink', 'orange', 'teal', 'descender'];
  for (let i = -200; i < 560; i += 1) {
    if (r() > 0.42 * density) continue;
    if (i > exclude[0] && i < exclude[1]) continue;
    out.push({headZ: zOf(i + r() * 0.6), x: r() > 0.5 ? 0.5 : -0.55, palette: pals[Math.floor(r() * pals.length)], lookUp: 0.6 + r() * 0.4});
  }
  return out;
};
const CROWD_WIDE = crowdMembers([S - 24, S + 24]);
const CROWD_FAR = crowdMembers([S - 8, S + 30], 0.6);

const NEAR_CLIMBERS = (t: number, faces = true): ActorSpec[] =>
  (
    [
      ['c1', S + 5.5, -0.55, 'yellow'],
      ['c2', S + 11, 0.5, 'blue'],
      ['c3', S + 16.5, -0.55, 'pink'],
      ['c4', S + 22, 0.5, 'orange'],
      ['c5', S - 7, -0.55, 'teal'],
    ] as [string, number, number, string][]
  ).map(([id, st, x, pal], k) => {
    const c = climber(id, st, x, pal, t, {detail: k < 4 ? 'hi' : 'lo', face: faces ? {...hearing, lid: blink(t, k + 3, 0)} : undefined});
    if (faces) {
      const h = headOf(c);
      c.lookAt = [h[0] + 0.2, h[1] + 3.2, h[2] - 3];
    }
    return c;
  });

const night = LOOKS.night;

export const ACT5: Shot[] = [
  // 30. But something was different this time.
  {
    n: 30,
    start: 70.0,
    end: 72.4,
    look: () => night,
    cloudSeaY: yOf(S) - 12,
    topGlow: () => 0.6,
    voice: () => 0.4,
    cam: move([
      {pos: add(headOf(old({t: 0})), [0.68, 0.75, -1.5]), target: add(headOf(old({t: 0})), [0, 0.05, 0]), fov: 32},
      {pos: add(headOf(old({t: 0})), [0.64, 0.7, -1.4]), target: add(headOf(old({t: 0})), [0, 0.05, 0]), fov: 32},
    ]),
    focus: () => headOf(old({t: 0})),
    actors: (t) => {
      const notice = smooth(range(t, 0.9, 1.6));
      const s = old({
        t,
        droop: 0.25,
        face: {look: [lerp(0.1, 0.6, notice), lerp(-0.6, -0.3, notice)], lid: 0.05, brow: lerp(-0.7, 0.2, notice), mouth: notice > 0.3 ? 'flat' : 'soft', catchColor: '#ffe2a0'},
      });
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.25, h[1] + 3.2, h[2] - 3], [h[0] + 2.2, h[1] + 1.2, h[2] - 3.5], notice);
      return [s, ...NEAR_CLIMBERS(t).slice(0, 2)];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.5}),
  },
  // 31. For the first time, he noticed that every caterpillar was hearing the same voice.
  {
    n: 31,
    start: 72.4,
    end: 77.3,
    look: () => night,
    cloudSeaY: yOf(S + 12) - 12,
    topGlow: (t) => 0.6 + 0.15 * Math.sin(t * 2),
    voice: () => 0.5,
    cam: move(
      [
        {pos: [2.9, yOf(S + 9) + 1.9, zOf(S + 9)], target: [0, yOf(S + 4.5) + 0.5, zOf(S + 4.5)], fov: 36},
        {pos: [2.9, yOf(S + 27) + 1.9, zOf(S + 27)], target: [0, yOf(S + 22.5) + 0.5, zOf(S + 22.5)], fov: 36},
      ],
      (u) => easeInOut(u) * 0.85 + u * 0.15,
    ),
    focus: (t, T) => lerp3([0, yOf(S + 5) + 0.6, zOf(S + 5)], [0, yOf(S + 22) + 0.6, zOf(S + 22)], easeInOut(t / T)),
    actors: (t) => {
      const s = old({t, droop: 0.25, face: {look: [-0.5, 0.2], lid: 0.05, brow: 0.2, mouth: 'flat'}});
      return [s, ...NEAR_CLIMBERS(t)];
    },
    shadowCenter: (t, T) => [0, yOf(S + 12), zOf(S + 12)],
    shadowSize: 16,
  },
  // 32. And every single one of them was almost there.  (huge pull-back)
  {
    n: 32,
    start: 77.3,
    end: 80.3,
    look: () => night,
    cloudSeaY: yOf(S) - 14,
    topGlow: (t) => 0.75 + 0.2 * Math.sin(t * 2.5),
    voice: () => 0.5,
    cam: move([
      {pos: [HX + 2.4, yOf(S) + 1.1, HZ + 2.8], target: [0, yOf(S + 4) + 0.6, zOf(S + 4)], fov: 38},
      {pos: [26, yOf(S) + 18, HZ + 26], target: [0, yOf(S + 30), zOf(S + 30)], fov: 42},
      {pos: [120, yOf(S) + 75, HZ + 105], target: [0, yOf(S + 110), zOf(S + 110)], fov: 46},
    ]),
    focus: (t, T) => lerp3([0, yOf(S + 4), zOf(S + 4)], [0, yOf(S + 110), zOf(S + 110)], easeInOut(t / T)),
    actors: (t) => [old({t, droop: 0.25, face: {look: [-0.2, -0.4], lid: 0.05, brow: 0.2, mouth: 'flat'}}), ...NEAR_CLIMBERS(t)],
    extras: () => <Crowd members={CROWD_WIDE} glow={1} />,
    shadowCenter: () => [0, yOf(S + 8), zOf(S + 8)],
    shadowSize: 18,
    post: () => ({maxBlur: 3}),
  },
  // 33. He looked up at the endless staircase.  (his point of view)
  {
    n: 33,
    start: 80.3,
    end: 83.0,
    look: look('predawn'),
    cloudSeaY: yOf(S) - 12,
    cam: move([
      {pos: [HX - 0.05, yOf(S) + 1.05, HZ - 0.05], target: [0, yOf(S) + 18, HZ - 40], fov: 48},
      {pos: [HX - 0.05, yOf(S) + 1.08, HZ - 0.1], target: [0, yOf(S) + 26, HZ - 52], fov: 46},
    ]),
    focus: () => [0, yOf(S + 20) + 1, zOf(S + 20)],
    extras: () => <Crowd members={CROWD_FAR} />,
    shadowCenter: () => [0, yOf(S + 6), zOf(S + 6)],
    shadowSize: 10,
    post: () => ({maxBlur: 4}),
  },
  // 34. Then he looked at his little suitcase.
  {
    n: 34,
    start: 83.0,
    end: 85.3,
    look: () => blendLooks(LOOKS.predawn, LOOKS.dawn, 0.15),
    cloudSeaY: yOf(S) - 12,
    cam: move([
      {pos: add([restHand.hand.x, restHand.hand.y, restHand.hand.z], [1.15, 0.12, -0.5]), target: add([restHand.hand.x, restHand.hand.y, restHand.hand.z], [0, -0.24, 0]), fov: 30},
      {pos: add([restHand.hand.x, restHand.hand.y, restHand.hand.z], [1.0, 0.1, -0.43]), target: add([restHand.hand.x, restHand.hand.y, restHand.hand.z], [0, -0.24, 0]), fov: 30},
    ]),
    focus: () => [restHand.hand.x, restHand.hand.y - 0.26, restHand.hand.z],
    actors: (t) => {
      const s = old({t, swing: 0.05 * Math.sin(t * 3) * Math.exp(-t), face: {look: [0.4, 0.6], lid: 0.3, brow: -0.3, mouth: 'flat'}});
      s.lookAt = [restHand.hand.x + 0.2, restHand.hand.y - 0.4, restHand.hand.z];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.18, maxBlur: 9}),
  },
  // 35. And finally, he sat down.  (first locked-off shot)
  {
    n: 35,
    start: 85.3,
    end: 87.5,
    look: (t) => blendLooks(LOOKS.predawn, LOOKS.dawn, 0.15 + 0.25 * smooth(range(t, 0, 2.2))),
    cloudSeaY: yOf(S) - 12,
    cam: still({pos: [4.3, yOf(S) + 0.95, HZ + 0.5], target: [HX, yOf(S) + 0.62, HZ + 0.15], fov: 30}),
    focus: () => [HX, yOf(S) + 0.6, HZ + 0.2],
    actors: (t) => {
      const lower = easeInOut(range(t, 0.15, 0.85));
      const sit = easeInOut(range(t, 0.8, 1.7));
      const hand: V3 = [restHand.hand.x, restHand.hand.y, restHand.hand.z];
      const pivotDown: V3 = [CASE_REST[0], CASE_REST[1] + 0.45, CASE_REST[2]];
      const handNow = lerp3(hand, pivotDown, lower);
      const placed = t > 0.15;
      const s = old({
        t,
        rear: SIT * sit,
        breathe: -0.5 * smooth(range(t, 1.5, 2.1)),
        suitcase: placed ? {mode: 'placed', pos: [handNow[0], handNow[1] - 0.45, handNow[2]], yaw: 0, tag: true} : undefined,
        face: {look: [0.2, lower < 1 ? 0.5 : -0.1], lid: 0.35 + 0.25 * smooth(range(t, 1.5, 2.1)), brow: -0.3, mouth: 'flat'},
      });
      if (placed && lower < 0.98) s.armTo = [handNow[0], handNow[1] - 0.02, handNow[2]];
      const h = headOf(s);
      s.lookAt = lower < 1 ? [handNow[0], handNow[1] - 0.3, handNow[2]] : [h[0] + 0.3, h[1] + 0.2, h[2] - 2];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
  },
  // 36. For a while, he waited.  (locked wide; the sun comes up)
  {
    n: 36,
    start: 87.5,
    end: 89.4,
    look: (t, T) => withLook(LOOKS.dawn, {sunDir: [0.75, lerp(0.06, 0.13, t / T), -0.65]}),
    cloudSeaY: yOf(S) - 10,
    worldT: (t) => 87.5 + t * 2,
    cam: still({pos: [13, yOf(S) + 3.2, HZ + 7.5], target: [0, yOf(S) + 1.3, HZ - 2.2], fov: 32}),
    focus: () => SH,
    actors: (t) => [seated({t, face: {look: [0.2, -0.2], lid: 0.35, brow: -0.2, mouth: 'flat'}})],
    shadowCenter: () => [HX, yOf(S), HZ],
  },
  // 37. He wasn't sure what he expected to happen.
  {
    n: 37,
    start: 89.4,
    end: 92.0,
    look: (t) => blendLooks(LOOKS.dawn, LOOKS.day, 0.2 + 0.15 * (t / 2.6)),
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: add(SH, [0.7, 1.0, -1.65]), target: add(SH, [0, -0.2, 0]), fov: 36}),
    focus: () => SH,
    actors: (t) => {
      const s = seated({t, face: {look: [0, -0.4], lid: 0.15, brow: -0.4, mouth: 'flat'}});
      const h = headOf(s);
      const a = smooth(range(t, 0.2, 0.7));
      const b = smooth(range(t, 1.0, 1.4));
      const c = smooth(range(t, 1.7, 2.1));
      let look: V3 = lerp3([h[0] + 0.3, h[1] + 0.2, h[2] - 2], [h[0] + 0.2, h[1] + 3, h[2] - 1.5], a);
      look = lerp3(look, [h[0] + 2.5, h[1] + 0.8, h[2] - 0.5], b);
      look = lerp3(look, [h[0] - 1.5, h[1] + 0.8, h[2] - 1.5], c);
      s.lookAt = look;
      s.face = {...s.face, look: [lerp(0, 0.4, b) - 0.8 * c, -0.4 * a + 0.2 * b]};
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
  },
  // 38. But nothing did.
  {
    n: 38,
    start: 92.0,
    end: 93.6,
    look: () => blendLooks(LOOKS.dawn, LOOKS.day, 0.4),
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: add(SH, [0.55, 0.72, -1.1]), target: add(SH, [0, 0.0, 0]), fov: 30}),
    focus: () => SH,
    actors: (t) => {
      const s = seated({t, face: {look: [0, -0.1], lid: 0.08, brow: 0, mouth: 'flat'}});
      s.face.lid = t > 0.7 && t < 0.84 ? 1 : 0.08;
      const h = headOf(s);
      s.lookAt = [h[0] + 0.5, h[1] + 0.3, h[2] - 2];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.4}),
  },
  // 39. The staircase carried on as it always had.
  {
    n: 39,
    start: 93.6,
    end: 96.4,
    look: () => blendLooks(LOOKS.dawn, LOOKS.day, 0.6),
    cloudSeaY: yOf(S) - 10,
    worldT: (t) => 93.6 + t * 6,
    cam: still({pos: [2.7, yOf(S) + 0.65, HZ + 3.4], target: [0, yOf(S) + 8, HZ - 20], fov: 46}),
    focus: () => [0, yOf(S + 10), zOf(S + 10)],
    actors: (t) => [seated({t, face: {look: [0, -0.4], lid: 0.2, brow: 0, mouth: 'flat'}})],
    extras: () => <Crowd members={CROWD_FAR} />,
    shadowCenter: () => [HX, yOf(S + 4), zOf(S + 4)],
    shadowSize: 10,
    post: () => ({maxBlur: 4}),
  },
  // 40. The other caterpillars did too.
  {
    n: 40,
    start: 96.4,
    end: 98.3,
    look: () => blendLooks(LOOKS.dawn, LOOKS.day, 0.75),
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: [4.4, yOf(S) + 1.05, HZ + 0.6], target: [-0.1, yOf(S) + 0.55, HZ - 0.2], fov: 36}),
    focus: () => SH,
    actors: (t) => {
      const a = climber('pa', 0, -0.8, 'yellow', t, {headZ: crawlZ(zOf(S - 1.5), t, 1.1, 0.5), cycles: t * 1.1});
      const b = climber('pb', 0, -0.8, 'blue', t, {headZ: crawlZ(zOf(S - 5.8), t, 1.1, 0.5), cycles: t * 1.1 + 0.4});
      const s = seated({t, face: {look: [-0.5, 0], lid: 0.2, brow: -0.1, mouth: 'flat'}});
      const ah = headOf(a);
      s.lookAt = lerp3(ah, [ah[0], ah[1], ah[2] - 1.5], smooth(range(t, 0, 1.9)));
      return [s, a, b];
    },
    shadowCenter: () => [0, yOf(S), HZ],
  },
  // 41. And he was still just as he was before.
  {
    n: 41,
    start: 98.3,
    end: 101.2,
    look: () => LOOKS.day,
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: add(SH, [0.95, 1.15, -1.0]), target: add(SH, [0, -0.45, 0.45]), fov: 38}),
    focus: () => add(SH, [0, -0.3, 0.4]),
    actors: (t) => {
      const s = seated({t, face: {look: [0, 0.7], lid: 0.3, brow: -0.3, mouth: 'flat'}});
      const pts = layBody(s);
      const look = smooth(range(t, 0.2, 0.9));
      const h = pts[0];
      s.lookAt = lerp3([h[0] + 0.3, h[1] + 0.2, h[2] - 2], [pts[4][0] + 0.2, pts[4][1] - 0.2, pts[4][2]], look);
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.6}),
  },
  // 42. There was no revelation or enlightenment.  (a sunbeam... then a cloud)
  {
    n: 42,
    start: 101.2,
    end: 103.9,
    look: (t) => {
      const beam = smooth(range(t, 0.25, 0.75)) * (1 - smooth(range(t, 1.5, 2.2)));
      return withLook(LOOKS.day, {keyIntensity: lerp(3.2, 1.9, smooth(range(t, 1.5, 2.2))), exposure: 1 + beam * 0.08});
    },
    cloudSeaY: yOf(S) - 10,
    voice: (t) => 1.1 * smooth(range(t, 0.25, 0.75)) * (1 - smooth(range(t, 1.5, 2.2))),
    cam: still({pos: [5.2, yOf(S) + 1.7, HZ + 1.6], target: [HX, yOf(S) + 1.1, HZ - 0.3], fov: 36}),
    focus: () => SH,
    actors: (t) => {
      const beam = smooth(range(t, 0.25, 0.75)) * (1 - smooth(range(t, 1.5, 2.2)));
      const s = seated({t, face: {look: [0.1, -0.6 * beam], lid: 0.2 - 0.2 * beam, brow: -0.6 * beam, mouth: beam > 0.5 ? 'o' : 'flat', catchColor: beam > 0.3 ? '#fff2c8' : undefined}});
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.3, h[1] + 0.2, h[2] - 2], [h[0] + 1.2, h[1] + 4, h[2] - 2], beam);
      return [s];
    },
    extras: (t) => {
      const beam = smooth(range(t, 0.25, 0.75)) * (1 - smooth(range(t, 1.5, 2.2)));
      return (
        <>
          <Sunbeam from={[SH[0] + 3.5, SH[1] + 14, SH[2] - 6]} to={[SH[0], SH[1] - 1.1, SH[2] + 0.2]} radius={1.1} opacity={0.75 * beam} />
          <Card tex={assets().clouds[2]} position={[SH[0] + lerp(16, 3.5, smooth(range(t, 0.9, 2.2))), SH[1] + 13, SH[2] - 6]} scale={[12, 6]} />
        </>
      );
    },
    shadowCenter: () => [HX, yOf(S), HZ],
  },
  // 43. There were no wings.
  {
    n: 43,
    start: 103.9,
    end: 105.1,
    look: () => withLook(LOOKS.day, {keyIntensity: 2.2}),
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: add(SH, [1.45, 0.45, -0.75]), target: add(SH, [-0.05, -0.25, 0.55]), fov: 36}),
    focus: () => add(SH, [0, -0.15, 0.35]),
    actors: (t) => {
      const s = seated({t, face: {look: [-0.6, 0.3], lid: 0.25, brow: -0.2, mouth: 'flat'}});
      const pts = layBody(s);
      const turn = smooth(range(t, 0.1, 0.5));
      const h = pts[0];
      s.lookAt = lerp3([h[0] + 0.5, h[1] + 0.2, h[2] - 2], [pts[3][0] + 0.9, pts[3][1] + 0.5, pts[3][2] + 0.8], turn);
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.6}),
  },
  // 44. And certainly, there was no glory.
  {
    n: 44,
    start: 105.1,
    end: 107.5,
    look: () => withLook(blendLooks(LOOKS.day, LOOKS.golden, 0.3), {glow: 0.12}),
    cloudSeaY: yOf(S) - 10,
    cam: move([
      {pos: [0.95, yOf(S) + 1.9, HZ - 1.5], target: [0, yOf(S) + 30, HZ - 62], fov: 42},
      {pos: [0.95, yOf(S) + 1.95, HZ - 1.7], target: [0, yOf(S) + 34, HZ - 66], fov: 40},
    ]),
    focus: () => [0, yOf(S + 60) + 1.2, zOf(S + 60)],
    extras: () => <Crowd members={CROWD_FAR} />,
    shadowCenter: () => [0, yOf(S + 6), zOf(S + 6)],
    shadowSize: 10,
    post: () => ({maxBlur: 3}),
  },
  // 45. But for the first time in his life, he wasn't miserable.
  {
    n: 45,
    start: 107.5,
    end: 111.2,
    look: look('golden'),
    cloudSeaY: yOf(S) - 10,
    cam: still({pos: add(SH, [0.55, 0.72, -1.25]), target: add(SH, [0, 0.0, 0]), fov: 30}),
    focus: () => SH,
    actors: (t) => {
      const soft = smooth(range(t, 1.2, 2.8));
      const s = seated({t, droop: 0.45 - 0.15 * soft, face: {look: [0.15, -0.1], lid: lerp(0.35, 0.28, soft), brow: lerp(-0.3, -0.05, soft), mouth: soft > 0.5 ? 'soft' : 'flat'}});
      const h = headOf(s);
      s.lookAt = [h[0] + 1.4, h[1] + 0.3, h[2] - 1.2];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.4}),
  },
  // 46. For the first time, he was just there.  (he turns to the view; camera rises behind him)
  {
    n: 46,
    start: 111.2,
    end: 114.1,
    look: (t) => blendLooks(LOOKS.golden, LOOKS.sunset, smooth(range(t, 0, 2.9))),
    cloudSeaY: yOf(S) - 9,
    cam: move([
      {pos: [HX - 1.7, yOf(S) + 0.95, HZ + 0.9], target: [HX + 6, yOf(S) + 0.6, HZ - 0.6], fov: 40},
      {pos: [HX - 2.0, yOf(S) + 2.1, HZ + 1.3], target: [HX + 12, yOf(S) - 0.6, HZ - 1.2], fov: 42},
    ]),
    focus: () => SH,
    actors: (t) => {
      const turn = smooth(range(t, 0.2, 1.2));
      const s = seated({t, droop: 0.3, face: {look: [0, -0.1], lid: 0.25, brow: -0.1, mouth: 'soft'}});
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 0.4, h[1] + 1.2, h[2] - 2.5], [h[0] + 4, h[1] - 0.2, h[2] - 0.3], turn);
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({maxBlur: 5}),
  },
  // 47. And that was enough.  (the poster shot)
  {
    n: 47,
    start: 114.1,
    end: 115.5,
    look: look('sunset'),
    cloudSeaY: yOf(S) - 9,
    cam: still({pos: [HX - 2.7, yOf(S) + 0.78, HZ + 2.9], target: [HX + 8, yOf(S) + 0.45, HZ - 1.6], fov: 34}),
    focus: () => SH,
    actors: (t) => {
      const s = seated({t, droop: 0.3, face: {look: [0, -0.1], lid: 0.3, brow: -0.1, mouth: 'soft'}});
      const h = headOf(s);
      s.lookAt = [h[0] + 4, h[1] - 0.2, h[2] - 0.3];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({maxBlur: 5}),
  },
  // 48. He looked up at the staircase once more.
  {
    n: 48,
    start: 115.5,
    end: 118.0,
    look: (t) => blendLooks(LOOKS.sunset, LOOKS.dusk, 0.5 * smooth(range(t, 0, 2.5))),
    cloudSeaY: yOf(S) - 9,
    cam: still({pos: add(SH, [2.4, 0.35, 0.4]), target: add(SH, [0, -0.05, -0.3]), fov: 32}),
    focus: () => SH,
    actors: (t) => {
      const turn = smooth(range(t, 0.3, 1.4));
      const s = seated({t, droop: 0.3, face: {look: [0, lerp(0, -0.5, turn)], lid: 0.25, brow: -0.2, mouth: 'flat'}});
      const h = headOf(s);
      s.lookAt = lerp3([h[0] + 4, h[1] - 0.2, h[2] - 0.3], [h[0] + 0.2, h[1] + 3, h[2] - 3], turn);
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.5}),
  },
  // 49. And for the first time, he wondered...
  {
    n: 49,
    start: 118.0,
    end: 120.4,
    look: (t) => blendLooks(LOOKS.dusk, LOOKS.night, 0.3 + 0.2 * smooth(range(t, 0, 2.4))),
    cloudSeaY: yOf(S) - 9,
    cam: move(
      [
        {pos: add(SH, [0.42, 0.7, -0.88]), target: add(SH, [0, 0.12, 0]), fov: 34},
        {pos: add(SH, [0.34, 0.58, -0.72]), target: add(SH, [0, 0.12, 0]), fov: 34},
      ],
      (u) => u,
    ),
    focus: () => SH,
    actors: (t) => {
      const s = seated({t, droop: 0.3, face: {look: [0.15, -0.5], lid: 0.12, brow: -0.25, mouth: 'flat', catchColor: '#dfe8ff'}});
      const h = headOf(s);
      s.lookAt = [h[0] + 0.2, h[1] + 3, h[2] - 3];
      return [s];
    },
    shadowCenter: () => [HX, yOf(S), HZ],
    post: () => ({focusRange: 0.3}),
  },
  // 50. What if the top was invented by caterpillars who couldn't bear the thought that climbing was all there was?
  {
    n: 50,
    start: 120.4,
    end: 131.5,
    look: (t) => lookKeys([[0, blendLooks(LOOKS.dusk, LOOKS.night, 0.5)], [4.5, 'night']])(t),
    cloudSeaY: yOf(S) - 9,
    topGlow: () => 0.25,
    cam: move(
      [
        {pos: [HX + 1.6, yOf(S) + 1.0, HZ + 2.3], target: SH, fov: 36},
        {pos: [5, yOf(S) + 14, HZ - 10], target: [0, yOf(S + 40), zOf(S + 40)], fov: 40},
        {pos: [9, yOf(S) + 55, HZ - 85], target: [0, yOf(S + 230), zOf(S + 230)], fov: 44},
        {pos: [12, yOf(S) + 100, HZ - 160], target: [0, yOf(S + 420), zOf(S + 420)], fov: 46},
      ],
      (u) => easeInOut(u) * 0.7 + u * 0.3,
    ),
    focus: (t, T) => lerp3(SH, [0, yOf(S + 230), zOf(S + 230)], smooth(t / T)),
    actors: (t) => [
      (() => {
        const s = seated({t, droop: 0.3, face: {look: [0.15, -0.5], lid: blink(t, 1, 0.12), brow: -0.25, mouth: 'flat', catchColor: '#dfe8ff'}});
        const h = headOf(s);
        s.lookAt = [h[0] + 0.2, h[1] + 3, h[2] - 3];
        return s;
      })(),
    ],
    extras: () => <Crowd members={CROWD_FAR} />,
    shadowCenter: () => [HX, yOf(S), HZ],
    shadowSize: 10,
    post: () => ({maxBlur: 4}),
  },
];

export const _keep = {gapsFor, crawlDistance, Cam: null as unknown as Cam, rngLike};
