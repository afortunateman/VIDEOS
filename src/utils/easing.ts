export type EaseFn = (t: number) => number;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const linear: EaseFn = (t) => t;
export const easeInOutCubic: EaseFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutSine: EaseFn = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic: EaseFn = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic: EaseFn = (t) => t * t * t;
export const easeOutQuart: EaseFn = (t) => 1 - Math.pow(1 - t, 4);
/** Long, gentle start and a very soft landing. Good for slow camera moves. */
export const easeInOutQuint: EaseFn = (t) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
export const easeOutBack: EaseFn = (t) => {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map v from [a,b] to [0,1] (clamped), then apply an easing. */
export const progress = (v: number, a: number, b: number, ease: EaseFn = linear) =>
  ease(clamp01((v - a) / (b - a)));

/** Piecewise interpolation over keyframes [[t, value], ...] with one easing per segment. */
export const keyed = (t: number, keys: [number, number][], ease: EaseFn = easeInOutSine) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, ease(clamp01((t - t0) / (t1 - t0))));
  }
  return keys[keys.length - 1][1];
};
