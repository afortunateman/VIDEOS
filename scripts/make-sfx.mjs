// Synthesises the film's sound effects as WAV files. Deterministic: same output every run.
// Usage: node scripts/make-sfx.mjs
import fs from 'node:fs';
import path from 'node:path';

const SR = 48000;
const OUT = path.resolve('public/audio');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buf = (sec) => new Float32Array(Math.round(sec * SR));

const white = (n, seed) => {
  const r = rng(seed);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = r() * 2 - 1;
  return b;
};

// RBJ biquad
const biquad = (x, type, freq, q = 0.707, gainDb = 0) => {
  const y = new Float32Array(x.length);
  const w0 = (2 * Math.PI * freq) / SR;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') [b0, b1, b2, a0, a1, a2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
  else if (type === 'hp') [b0, b1, b2, a0, a1, a2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
  else if (type === 'bp') [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha];
  else if (type === 'peak')
    [b0, b1, b2, a0, a1, a2] = [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

/** Band-pass whose centre frequency follows f(t). */
const sweepBp = (x, fAt, q) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) {
      // recompute coefficients occasionally
    }
    const w0 = (2 * Math.PI * fAt(i / SR)) / SR;
    const cos = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q);
    const b0 = alpha, b2 = -alpha, a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
    const v = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

const env = (n, attack, decay, shape = 1) => {
  const e = new Float32Array(n);
  const a = Math.max(1, Math.round(attack * SR));
  for (let i = 0; i < n; i++) {
    e[i] = i < a ? i / a : Math.pow(Math.exp(-(i - a) / (decay * SR)), shape);
  }
  return e;
};

const mul = (a, b) => a.map((v, i) => v * (b[i] ?? 0));
const add = (a, b, gain = 1, offset = 0) => {
  for (let i = 0; i < b.length && i + offset < a.length; i++) a[i + offset] += b[i] * gain;
  return a;
};
const sine = (n, f, phase = 0) => {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = Math.sin(2 * Math.PI * f * (i / SR) + phase);
  return b;
};
/** Decaying sine with optional downward pitch glide (for thumps and booms). */
const ping = (sec, f0, f1, decay) => {
  const n = Math.round(sec * SR);
  const b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t / (decay * 0.5));
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t / decay);
  }
  return b;
};

/** Small Schroeder reverb; returns wet signal. */
const reverb = (x, {room = 0.82, damp = 0.3, size = 1, seed = 1} = {}) => {
  const r = rng(seed);
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round(d * size * (0.97 + r() * 0.06)));
  const aps = [556, 441, 341].map((d) => Math.round(d * size));
  const out = new Float32Array(x.length);
  for (const d of combs) {
    const line = new Float32Array(d);
    let idx = 0, lp = 0;
    for (let i = 0; i < x.length; i++) {
      const o = line[idx];
      lp = o * (1 - damp) + lp * damp;
      line[idx] = x[i] + lp * room;
      idx = (idx + 1) % d;
      out[i] += o / combs.length;
    }
  }
  let y = out;
  for (const d of aps) {
    const line = new Float32Array(d);
    const z = new Float32Array(y.length);
    let idx = 0;
    for (let i = 0; i < y.length; i++) {
      const o = line[idx];
      const v = y[i] + o * 0.5;
      line[idx] = v;
      z[i] = o - v * 0.5;
      idx = (idx + 1) % d;
    }
    y = z;
  }
  return y;
};

const fadeEdges = (x, inSec = 0.005, outSec = 0.02) => {
  const ni = Math.round(inSec * SR);
  const no = Math.round(outSec * SR);
  for (let i = 0; i < ni && i < x.length; i++) x[i] *= i / ni;
  for (let i = 0; i < no && i < x.length; i++) x[x.length - 1 - i] *= i / no;
  return x;
};

const normalize = (x, peak = 0.89) => {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
};

const writeWav = (file, left, right = left) => {
  const n = left.length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    data.writeInt16LE(Math.round(l * 32767), i * 4);
    data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.writeUInt32LE(SR, 36);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.concat([h, data]));
  console.log('wrote', path.relative(process.cwd(), file), `${(n / SR).toFixed(2)}s`);
};

// ---------------------------------------------------------------------------
// Sounds
// ---------------------------------------------------------------------------

/** tap: a dry knuckle on a wooden desk, with a slight low thump. */
const makeTap = (seed) => {
  const len = 0.7;
  const n = Math.round(len * SR);
  const click = mul(biquad(white(n, seed), 'bp', 2600, 1.2), env(n, 0.0005, 0.004));
  const knock = mul(biquad(white(n, seed + 1), 'bp', 900, 2.5), env(n, 0.001, 0.018));
  const body = new Float32Array(n);
  add(body, ping(len, 210, 180, 0.05), 0.9);
  add(body, ping(len, 390, 360, 0.03), 0.45);
  add(body, ping(len, 720, 700, 0.018), 0.25);
  const thump = ping(len, 95, 60, 0.06);
  const dry = new Float32Array(n);
  add(dry, click, 0.5);
  add(dry, knock, 0.9);
  add(dry, body, 0.8);
  add(dry, thump, 0.7);
  const wet = reverb(dry, {room: 0.7, damp: 0.5, size: 0.6, seed});
  const out = new Float32Array(n);
  add(out, dry, 1);
  add(out, biquad(wet, 'lp', 3000), 0.18);
  return fadeEdges(normalize(out, 0.9), 0.0005, 0.05);
};

/** key: a soft laptop key click (scissor switch). */
const makeKey = (seed) => {
  const len = 0.16;
  const n = Math.round(len * SR);
  const r = rng(seed);
  const f = 3200 + r() * 1800;
  const click = mul(biquad(white(n, seed), 'bp', f, 1.8), env(n, 0.0004, 0.006));
  const bottom = mul(biquad(white(n, seed + 7), 'bp', 1400 + r() * 500, 2), env(n, 0.0008, 0.012));
  const thock = ping(len, 260 + r() * 60, 220, 0.012);
  const release = mul(biquad(white(n, seed + 3), 'bp', f * 1.2, 2), env(n, 0.0004, 0.004));
  const out = new Float32Array(n);
  add(out, click, 0.6);
  add(out, bottom, 0.5);
  add(out, thock, 0.35);
  add(out, release, 0.25, Math.round((0.055 + r() * 0.02) * SR));
  return fadeEdges(normalize(out, 0.85), 0.0003, 0.02);
};

/** room tone: low, quiet, a little alive. */
const makeRoomTone = (sec, seed) => {
  const n = Math.round(sec * SR);
  const mk = (s) => {
    let x = biquad(white(n, s), 'lp', 220, 0.6);
    x = biquad(x, 'lp', 400, 0.6);
    const hiss = biquad(white(n, s + 5), 'hp', 5000);
    add(x, hiss, 0.02);
    // slow breathing of the air
    for (let i = 0; i < n; i++) x[i] *= 0.85 + 0.15 * Math.sin((2 * Math.PI * i) / SR / 7.3 + s);
    return x;
  };
  const l = normalize(mk(seed), 0.5);
  const r = normalize(mk(seed + 100), 0.5);
  return [fadeEdges(l, 0.5, 0.5), fadeEdges(r, 0.5, 0.5)];
};

/** drone: a low, hollow pad with slow beating. */
const makeDrone = (sec, root, seed) => {
  const n = Math.round(sec * SR);
  const r = rng(seed);
  const partials = [
    [root, 1],
    [root * 1.003, 0.8],
    [root * 1.5, 0.35],
    [root * 2.0, 0.22],
    [root * 2.997, 0.08],
  ];
  const mk = (detune) => {
    const x = new Float32Array(n);
    for (const [f, a] of partials) {
      const ph = r() * 6.28;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const wob = 1 + 0.002 * Math.sin(2 * Math.PI * 0.07 * t + ph);
        x[i] += a * Math.sin(2 * Math.PI * f * detune * wob * t + ph);
      }
    }
    // soft, hollow: a little filtered noise breath on top
    add(x, biquad(biquad(white(n, seed + 9), 'bp', root * 4, 4), 'lp', 600), 0.6);
    for (let i = 0; i < n; i++) x[i] *= 0.75 + 0.25 * Math.sin((2 * Math.PI * i) / SR / 9 + detune * 10);
    return x;
  };
  return [fadeEdges(normalize(mk(1), 0.6), 2, 2), fadeEdges(normalize(mk(1.002), 0.6), 2, 2)];
};

/** warm swell: the screen turning into candlelight. A slow major chord blooming. */
const makeWarmSwell = (sec, seed) => {
  const n = Math.round(sec * SR);
  const freqs = [110, 138.59, 164.81, 220, 277.18];
  const mk = (d) => {
    const x = new Float32Array(n);
    const r = rng(seed + d * 1000);
    for (const f of freqs) {
      const ph = r() * 6.28;
      const a = 1 / (1 + f / 200);
      for (let i = 0; i < n; i++) x[i] += a * Math.sin(2 * Math.PI * f * (1 + d * 0.0015) * (i / SR) + ph);
    }
    const shimmer = biquad(biquad(white(n, seed + d), 'bp', 2200, 6), 'lp', 4000);
    add(x, shimmer, 0.4);
    for (let i = 0; i < n; i++) {
      const t = i / sec / SR;
      x[i] *= Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.6);
    }
    return x;
  };
  return [normalize(mk(0), 0.6), normalize(mk(1), 0.6)];
};

/** rustle: shirt cloth as he leans in to the keyboard. */
const makeRustle = (seed) => {
  const len = 0.9;
  const n = Math.round(len * SR);
  let x = biquad(white(n, seed), 'bp', 1800, 0.7);
  x = biquad(x, 'lp', 5000);
  const e = new Float32Array(n);
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const base = Math.sin(Math.PI * Math.min(1, t / len)) ** 2;
    e[i] = base * (0.6 + 0.4 * Math.abs(Math.sin(t * 37 + r())));
  }
  return fadeEdges(normalize(mul(x, e), 0.7), 0.01, 0.05);
};

/** wind: a low, moaning outdoor wind bed (also used far away for pre-laps). */
const makeWind = (sec, seed) => {
  const n = Math.round(sec * SR);
  const mk = (s) => {
    const base = biquad(white(n, s), 'lp', 900);
    const r = rng(s);
    const p1 = r() * 6, p2 = r() * 6;
    const f = (t) => 380 + 180 * Math.sin(2 * Math.PI * 0.09 * t + p1) + 90 * Math.sin(2 * Math.PI * 0.23 * t + p2);
    const howl = sweepBp(base, f, 5);
    const bed = biquad(white(n, s + 3), 'lp', 300);
    const x = new Float32Array(n);
    add(x, howl, 1);
    add(x, bed, 0.5);
    for (let i = 0; i < n; i++) x[i] *= 0.7 + 0.3 * Math.sin((2 * Math.PI * i) / SR / 5.7 + p2);
    return x;
  };
  return [fadeEdges(normalize(mk(seed), 0.6), 1, 1), fadeEdges(normalize(mk(seed + 50), 0.6), 1, 1)];
};

// ---------------------------------------------------------------------------
writeWav(`${OUT}/sfx/tap.wav`, makeTap(11));
writeWav(`${OUT}/sfx/tap_2.wav`, makeTap(12));
writeWav(`${OUT}/sfx/tap_3.wav`, makeTap(13));
for (let i = 1; i <= 6; i++) writeWav(`${OUT}/sfx/key_${i}.wav`, makeKey(100 + i * 17));
{
  const [l, r] = makeRoomTone(30, 5);
  writeWav(`${OUT}/sfx/room_tone.wav`, l, r);
}
{
  const [l, r] = makeWind(30, 21);
  writeWav(`${OUT}/sfx/wind.wav`, l, r);
}
writeWav(`${OUT}/sfx/rustle.wav`, makeRustle(3));
{
  const [l, r] = makeDrone(30, 55, 8);
  writeWav(`${OUT}/music/drone_low.wav`, l, r);
}
{
  const [l, r] = makeWarmSwell(7, 4);
  writeWav(`${OUT}/music/warm_swell.wav`, l, r);
}
