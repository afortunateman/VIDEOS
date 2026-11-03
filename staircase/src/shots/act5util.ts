import {rng} from '../scene/paint';
export {crawlDistance, easeInOut, lerp, lerp3, range, smooth} from '../engine/stairs';
export type {V3} from '../engine/stairs';
export const rngLike = (seed: number) => rng(seed);
