import {mulberry32} from './seededRandom';

/**
 * Build a human-feeling typing schedule: one timestamp (seconds) per character.
 * Average speed is `cps`; spaces and punctuation get small pauses; `holdBefore`
 * lets a word land with a beat of hesitation. Times are rescaled to end by `endBy`.
 */
export const typeSchedule = (
  text: string,
  cps: number,
  start: number,
  opts: {seed?: number; endBy?: number; holdBefore?: Record<number, number>} = {},
) => {
  const rand = mulberry32(opts.seed ?? 7);
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];
    let dt = (1 / cps) * (0.65 + rand() * 0.7);
    if (prev === ' ') dt *= 1.25;
    if (prev === ',' || prev === '.') dt *= 2.2;
    if (opts.holdBefore?.[i]) dt += opts.holdBefore[i];
    if (i === 0) dt = 0;
    t += dt;
    times.push(t);
    void ch;
  }
  if (opts.endBy !== undefined && times.length > 1) {
    const span = times[times.length - 1] - start;
    const target = opts.endBy - start;
    if (span > target) {
      const k = target / span;
      for (let i = 0; i < times.length; i++) times[i] = start + (times[i] - start) * k;
    }
  }
  return times;
};

export const visibleCount = (times: number[], t: number) => {
  let n = 0;
  while (n < times.length && times[n] <= t) n++;
  return n;
};

/** Cursor is solid while typing, blinks when idle. */
export const cursorOn = (t: number, blink: number, lastKey: number | null) => {
  if (lastKey !== null && t - lastKey < blink) return true;
  return Math.floor(t / blink) % 2 === 0;
};
