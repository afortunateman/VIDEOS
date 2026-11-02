/* THE STAIRCASE — Act 1: The Promise
 * A procedural canvas film. Everything is drawn in code; no images.
 * Character poses run "on twos" (12 fps) with a little boil, like stop-motion,
 * while the camera moves smoothly at the display rate.
 */
(() => {
'use strict';

const W = 1920, H = 1080;
const TAU = Math.PI * 2;

const SCENES = [
  { name: 'The Endless Staircase', start: 0,  dur: 12, fn: null },
  { name: 'The Mystery',           start: 12, dur: 10, fn: null },
  { name: 'The Elders',            start: 22, dur: 13, fn: null },
  { name: 'The Butterfly',         start: 35, dur: 10, fn: null },
];
const DURATION = 45;

/* ------------------------------------------------------------------ math */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeSine = t => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hash2 = (a, b) => hash(a * 57.13 + b * 13.71);
const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };

/* ------------------------------------------------------------------ color */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

const COL = {
  ivory: hex('#e4ddcb'), beige: hex('#c9bfa8'), fog: hex('#ddd7c8'), stone: hex('#b5ae9f'),
  charcoal: hex('#2a2725'), rust: hex('#8c4a2b'), amber: hex('#e1a24a'), gold: hex('#f3c66a'),
  lead: hex('#1d1610'),
};

// The protagonist. These values never change between scenes.
const HERO = {
  skin: hex('#8fa07b'), skinLight: hex('#bfcca6'), skinDark: hex('#5a694c'), skinDeep: hex('#36412e'),
  belly: hex('#cfd3b2'), leg: hex('#3d4934'),
  hat: hex('#6c4a30'), hatLight: hex('#97724e'), hatDark: hex('#3c291b'), band: hex('#2b1e15'),
  case: hex('#7a5034'), caseLight: hex('#a57850'), caseDark: hex('#4a301f'), strap: hex('#3a2619'), brass: hex('#a68a55'),
};
const ELDER = Object.assign({}, HERO, {
  skin: hex('#a0a48e'), skinLight: hex('#cfcfba'), skinDark: hex('#6a6d5b'), skinDeep: hex('#43453a'),
  belly: hex('#dcd8c2'), leg: hex('#4a4b40'),
});
const YOUNG = Object.assign({}, HERO, {
  skin: hex('#8a9a78'), skinLight: hex('#b5c19f'), skinDark: hex('#56644a'), skinDeep: hex('#343e2d'),
});

const ENV0 = { k: 1, warm: [0, 0, 0], wa: 0, lx: -0.45, ly: -0.8, rim: 0.45 };
const C = (c, env) => { if (!env) return c; const d = mul(c, env.k); return env.wa ? mix(d, env.warm, env.wa) : d; };

/* ------------------------------------------------------------------ frame state */
let T = 0;        // film time
let SF = 0;       // stop-motion frame index (12 fps)
let WEAVE = { x: 0, y: 0 };
const DEBUG = {};
const boil = (id, amp) => (hash2(SF + 0.5, id) - 0.5) * 2 * amp;
const pxScale = g => { const m = g.getTransform(); return Math.hypot(m.a, m.b); };

/* ------------------------------------------------------------------ offscreen helpers */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const TEX = {};
const patCache = new WeakMap();
function pat(g, key) {
  let m = patCache.get(g); if (!m) { m = {}; patCache.set(g, m); }
  if (!m[key]) m[key] = g.createPattern(TEX[key], 'repeat');
  return m[key];
}
function downsample(src, steps) {
  let cur = src;
  for (let i = 0; i < steps; i++) {
    const c = mk(Math.max(1, cur.width >> 1), Math.max(1, cur.height >> 1));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, c.width, c.height); cur = c;
  }
  return cur;
}

function makeConcrete(S, seed) {
  const c = mk(S, S), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = '#b8b1a2'; g.fillRect(0, 0, S, S);
  const wrap = fn => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };
  for (let i = 0; i < 90; i++) {
    const x = R() * S, y = R() * S, r = 10 + R() * 90, dark = R() < 0.55, a = 0.03 + R() * 0.07;
    const col = dark ? '60,54,46' : '235,228,214';
    wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); });
  }
  for (let k = 0; k < 6; k++) {
    const y0 = (k + 0.5) * S / 6; g.strokeStyle = 'rgba(70,64,56,0.10)'; g.lineWidth = 1.2; g.beginPath();
    for (let x = 0; x <= S; x += 8) { const y = y0 + Math.sin(x * TAU / S * 2 + k) * 1.2; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 22; i++) {
    const x = R() * S, y = R() * S, len = 40 + R() * 180, w = 1 + R() * 4;
    wrap(() => { const gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, 'rgba(80,70,58,0.12)'); gr.addColorStop(1, 'rgba(80,70,58,0)'); g.fillStyle = gr; g.fillRect(x, y, w, len); });
  }
  for (const [x, y] of [[S * .25, S * .25], [S * .75, S * .25], [S * .25, S * .75], [S * .75, S * .75]]) {
    g.fillStyle = 'rgba(240,232,218,0.18)'; g.beginPath(); g.arc(x + 1, y + 1.5, 5.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(45,40,35,0.45)'; g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill();
  }
  const id = g.getImageData(0, 0, S, S), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let n = (R() - 0.5) * 22; if (R() < 0.006) n -= 45; if (R() < 0.003) n += 30;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(id, 0, 0);
  return c;
}

function makeClay(S, seed) {
  const c = mk(S, S), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S);
  const wrap = fn => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };
  for (let i = 0; i < 80; i++) {
    const x = R() * S, y = R() * S, r = 6 + R() * 40, v = R() < 0.5 ? 70 : 190, a = 0.06 + R() * 0.12;
    wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); });
  }
  // a few thumbprints: the hand of the animator
  for (let k = 0; k < 3; k++) {
    const cx = S * (0.2 + 0.3 * k) + R() * 20, cy = R() * S, rot = R() * TAU;
    for (let j = 0; j < 9; j++) {
      g.strokeStyle = `rgba(${j % 2 ? 95 : 165},${j % 2 ? 95 : 165},${j % 2 ? 95 : 165},0.10)`; g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(cx, cy, 5 + j * 3.2, 3.5 + j * 2.3, rot, 0.3, Math.PI * 1.4); g.stroke();
    }
  }
  const id = g.getImageData(0, 0, S, S), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 28; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
  return c;
}

function makeGrain(w, h, seed) {
  const c = mk(w, h), g = c.getContext('2d'), R = rng(seed), id = g.createImageData(w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + ((R() + R() + R()) / 3 - 0.5) * 170;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}

function makeVignette() {
  const c = mk(W, H), g = c.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  gr.addColorStop(0, 'rgba(10,8,6,0)'); gr.addColorStop(0.6, 'rgba(10,8,6,0.28)'); gr.addColorStop(1, 'rgba(10,8,6,0.82)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}

function makeFogSprite(w, h, seed) {
  const c = mk(w, h), g = c.getContext('2d'), R = rng(seed);
  for (let i = 0; i < 70; i++) {
    const a = R() * TAU, rr = Math.sqrt(R());
    const x = w / 2 + Math.cos(a) * rr * w * 0.33, y = h / 2 + Math.sin(a) * rr * h * 0.26, r = 20 + R() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(232,226,212,0.13)'); gr.addColorStop(1, 'rgba(232,226,212,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return c;
}

/* ------------------------------------------------------------------ butterfly geometry
 * Unit space: wing root at origin, the right wing spans x 0..1.
 * Used by the stained-glass vision (scene 04) and the wall shadow (scene 03),
 * so the two butterflies share one silhouette.
 */
function forePath(g) {
  g.beginPath(); g.moveTo(0.03, -0.06);
  g.bezierCurveTo(0.18, -0.52, 0.60, -0.80, 0.97, -0.72);
  g.bezierCurveTo(1.03, -0.52, 0.93, -0.24, 0.80, -0.07);
  g.bezierCurveTo(0.60, 0.01, 0.30, 0.03, 0.05, 0.03);
  g.closePath();
}
function hindPath(g) {
  g.beginPath(); g.moveTo(0.04, 0.0);
  g.bezierCurveTo(0.34, -0.03, 0.70, 0.04, 0.77, 0.27);
  g.bezierCurveTo(0.81, 0.47, 0.64, 0.60, 0.47, 0.64);
  g.bezierCurveTo(0.42, 0.76, 0.36, 0.88, 0.31, 0.95);
  g.bezierCurveTo(0.26, 0.84, 0.25, 0.72, 0.21, 0.63);
  g.bezierCurveTo(0.11, 0.50, 0.05, 0.27, 0.03, 0.07);
  g.closePath();
}

const BF = { U: 720, W: 0, H: 0, rx: 24, ry: 0 };
function buildButterfly() {
  const U = BF.U;
  BF.W = Math.ceil(1.06 * U) + 48; BF.H = Math.ceil(1.80 * U) + 48; BF.ry = Math.ceil(0.82 * U) + 24;
  const c = mk(BF.W, BF.H), g = c.getContext('2d'), R = rng(42);
  g.translate(BF.rx, BF.ry); g.scale(U, U);
  const LEAD = rgba(COL.lead);
  const palette = [hex('#fbe9b8'), hex('#f6d68a'), hex('#f2c45f'), hex('#eaa944'), hex('#dc8a36'), hex('#c4682b'), hex('#9c4a24')];
  const cellColor = (j, nR) => {
    const t = j / (nR - 1);
    let k = Math.round(t * (palette.length - 1) + (R() - 0.5) * 1.6);
    k = Math.max(0, Math.min(palette.length - 1, k));
    let col = palette[k];
    if (R() < 0.08) col = hex('#f3ead2');
    if (R() < 0.05) col = hex('#b5532a');
    return col;
  };
  const glass = (pathFn, a0, a1, nA, radii) => {
    g.save(); pathFn(g); g.clip();
    const V = [];
    for (let i = 0; i <= nA; i++) {
      V[i] = []; const aa = lerp(a0, a1, i / nA);
      for (let j = 0; j < radii.length; j++) {
        const a = aa + (j > 0 && i > 0 && i < nA ? (R() - 0.5) * 0.07 : 0);
        const r = radii[j] * (j > 0 ? 1 + (R() - 0.5) * 0.09 : 1);
        V[i][j] = [0.03 + Math.cos(a) * r, Math.sin(a) * r];
      }
    }
    const cells = [];
    for (let i = 0; i < nA; i++) for (let j = 0; j < radii.length - 1; j++) {
      const p = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]];
      // split some outer cells in two for a less regular leading pattern
      if (j > 1 && R() < 0.35) {
        const m1 = [lerp(p[0][0], p[3][0], 0.5), lerp(p[0][1], p[3][1], 0.5)];
        const m2 = [lerp(p[1][0], p[2][0], 0.45), lerp(p[1][1], p[2][1], 0.45)];
        cells.push({ p: [p[0], p[1], m2, m1], col: cellColor(j, radii.length) });
        cells.push({ p: [m1, m2, p[2], p[3]], col: cellColor(j + 0.5, radii.length) });
      } else cells.push({ p, col: cellColor(j, radii.length) });
    }
    for (const cell of cells) {
      const p = cell.p; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) g.lineTo(p[k][0], p[k][1]); g.closePath();
      g.fillStyle = rgba(cell.col); g.fill();
      const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length;
      const gr = g.createRadialGradient(cx - 0.01, cy - 0.01, 0, cx, cy, 0.12);
      gr.addColorStop(0, 'rgba(255,248,225,0.45)'); gr.addColorStop(1, 'rgba(255,248,225,0)');
      g.fillStyle = gr; g.fill();
      g.save(); g.clip(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5;
      g.save(); g.scale(1 / 300, 1 / 300); g.fillStyle = pat(g, 'clay'); g.fillRect(-400, -400, 800, 800); g.restore();
      g.restore();
    }
    g.lineJoin = 'round'; g.strokeStyle = LEAD; g.lineWidth = 7 / U;
    for (const cell of cells) { const p = cell.p; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) g.lineTo(p[k][0], p[k][1]); g.closePath(); g.stroke(); }
    g.restore();
  };
  const eyespot = (x, y, r) => {
    const rings = [[1, '#f6e2b5'], [0.78, '#a8461f'], [0.56, '#f0b54a'], [0.3, '#3a2414']];
    for (const [k, col] of rings) { g.beginPath(); g.arc(x, y, r * k, 0, TAU); g.fillStyle = col; g.fill(); g.lineWidth = 6 / U; g.strokeStyle = LEAD; g.stroke(); }
    g.beginPath(); g.arc(x - r * 0.08, y - r * 0.1, r * 0.09, 0, TAU); g.fillStyle = '#fbefd2'; g.fill();
  };
  // hindwing first, forewing laid over it
  glass(hindPath, 0.0, 1.45, 8, [0, 0.12, 0.25, 0.38, 0.52, 0.66, 0.80, 1.15]);
  g.save(); hindPath(g); g.clip(); eyespot(0.50, 0.36, 0.105); g.restore();
  hindPath(g); g.lineWidth = 16 / U; g.strokeStyle = LEAD; g.stroke();
  glass(forePath, -1.32, 0.12, 10, [0, 0.12, 0.26, 0.41, 0.56, 0.71, 0.86, 1.25]);
  g.save(); forePath(g); g.clip(); eyespot(0.70, -0.50, 0.085);
  for (let k = 0; k < 4; k++) { const tt = 0.2 + k * 0.2; const x = lerp(0.96, 0.82, tt), y = lerp(-0.66, -0.12, tt); g.beginPath(); g.arc(x, y, 0.022, 0, TAU); g.fillStyle = '#f7ecd1'; g.fill(); g.lineWidth = 4 / U; g.strokeStyle = LEAD; g.stroke(); }
  g.restore();
  forePath(g); g.lineWidth = 16 / U; g.strokeStyle = LEAD; g.stroke();
  TEX.wing = c;
  TEX.wingGlow = downsample(c, 4);

  // body + antennae, centred canvas
  const bw = Math.ceil(0.7 * U), bh = Math.ceil(1.9 * U);
  const b = mk(bw, bh), h = b.getContext('2d');
  h.translate(bw / 2, BF.ry); h.scale(U, U);
  h.lineCap = 'round';
  for (const s of [-1, 1]) {
    h.beginPath(); h.moveTo(0.01 * s, -0.27); h.bezierCurveTo(0.06 * s, -0.5, 0.14 * s, -0.66, 0.23 * s, -0.78);
    h.strokeStyle = LEAD; h.lineWidth = 12 / U; h.stroke();
    h.strokeStyle = '#e9b456'; h.lineWidth = 4 / U; h.stroke();
    h.beginPath(); h.ellipse(0.235 * s, -0.79, 0.035, 0.025, 0.6 * s, 0, TAU); h.fillStyle = '#f3c66a'; h.fill(); h.lineWidth = 6 / U; h.strokeStyle = LEAD; h.stroke();
  }
  const bandsCols = ['#f6d68a', '#e3a043', '#f2c45f', '#c96d2c', '#eab14d', '#d98a37', '#f4d48a', '#b8592a'];
  h.save(); h.beginPath(); h.ellipse(0, 0.33, 0.055, 0.37, 0, 0, TAU); h.clip();
  for (let k = 0; k < 8; k++) { h.fillStyle = bandsCols[k]; h.fillRect(-0.1, -0.04 + k * 0.095, 0.2, 0.095); }
  h.strokeStyle = LEAD; h.lineWidth = 6 / U;
  for (let k = 1; k < 8; k++) { h.beginPath(); h.moveTo(-0.1, -0.04 + k * 0.095); h.quadraticCurveTo(0, -0.02 + k * 0.095, 0.1, -0.04 + k * 0.095); h.stroke(); }
  h.restore();
  h.beginPath(); h.ellipse(0, 0.33, 0.055, 0.37, 0, 0, TAU); h.lineWidth = 12 / U; h.strokeStyle = LEAD; h.stroke();
  h.beginPath(); h.ellipse(0, -0.08, 0.075, 0.13, 0, 0, TAU); h.fillStyle = '#eaa944'; h.fill(); h.lineWidth = 12 / U; h.stroke();
  h.beginPath(); h.moveTo(-0.07, -0.08); h.lineTo(0.07, -0.08); h.lineWidth = 6 / U; h.stroke();
  h.beginPath(); h.arc(0, -0.25, 0.058, 0, TAU); h.fillStyle = '#c4682b'; h.fill(); h.lineWidth = 12 / U; h.stroke();
  TEX.bbody = b; TEX.bbodyX = bw / 2;
  TEX.bbodyGlow = downsample(b, 4);
}

function buildTextures() {
  TEX.concrete = makeConcrete(512, 7);
  TEX.clay = makeClay(256, 11);
  TEX.grain = []; for (let i = 0; i < 6; i++) TEX.grain.push(makeGrain(960, 540, 100 + i));
  TEX.vignette = makeVignette();
  TEX.fog = makeFogSprite(512, 256, 5);
  buildButterfly();
  TEX.buf = mk(W, H);          // general purpose (scene 04 background, DOF)
  TEX.small = mk(W / 4, H / 4); // soft shadows & blurred foreground
}

/* ------------------------------------------------------------------ primitive drawing */
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
function concreteFill(g, texScale, shade) {
  g.save(); g.scale(texScale, texScale); g.fillStyle = pat(g, 'concrete'); g.fill(); g.restore();
  if (shade) { g.fillStyle = shade; g.fill(); }
}
function fogSprite(g, x, y, w, h, a) { g.globalAlpha = a; g.drawImage(TEX.fog, x - w / 2, y - h / 2, w, h); g.globalAlpha = 1; }

/* ------------------------------------------------------------------ the caterpillar
 * drawLeg, drawSegment, drawHead, drawHat, drawSuitcase are shared by
 * the side view (scenes 01–03) and the front view (scene 04).
 */
function drawLeg(g, x0, y0, x1, y1, bend, w, col) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, n = norm(-(y1 - y0), x1 - x0);
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx + n.x * bend, my + n.y * bend, x1, y1); g.stroke();
  g.beginPath(); g.arc(x1, y1, w * 0.62, 0, TAU); g.fillStyle = col; g.fill();
}

function drawSegment(g, x, y, r, ang, o, idx, down) {
  const pal = o.pal, env = o.env;
  if (o.sil) { g.beginPath(); g.ellipse(x, y, r * 1.02, r * 0.96, ang, 0, TAU); g.fill(); return; }
  const lx = env.lx, ly = env.ly, rim = env.rim;
  const gr = g.createRadialGradient(x + lx * r * rim, y + ly * r * rim, r * 0.05, x + lx * r * 0.12, y + ly * r * 0.12, r * 1.08);
  gr.addColorStop(0, rgba(C(pal.skinLight, env)));
  gr.addColorStop(0.42, rgba(C(pal.skin, env)));
  gr.addColorStop(0.82, rgba(C(pal.skinDark, env)));
  gr.addColorStop(1, rgba(C(pal.skinDeep, env)));
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.02, r * 0.96, ang, 0, TAU); g.fill();
  if (env.rimCol) rimLight(g, x, y, r, env);
  if (o.detail > 0) {
    g.save(); g.clip();
    if (down) {
      g.fillStyle = rgba(C(pal.belly, env), 0.22);
      g.beginPath(); g.ellipse(x + down.x * r * 0.78, y + down.y * r * 0.78, r * 0.95, r * 0.42, ang, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55;
    g.translate(x, y); g.rotate(idx * 1.7); g.scale(r / 60, r / 60);
    g.fillStyle = pat(g, 'clay'); g.fillRect(-70, -70, 140, 140);
    g.restore();
    if (down && o.detail > 1) {
      // spiracle
      const sx = x + down.x * r * 0.32 - Math.cos(ang) * r * 0.15, sy = y + down.y * r * 0.32 - Math.sin(ang) * r * 0.15;
      g.fillStyle = rgba(C(pal.skinLight, env), 0.5); g.beginPath(); g.ellipse(sx, sy, r * 0.11, r * 0.08, ang, 0, TAU); g.fill();
      g.fillStyle = rgba(C(pal.skinDeep, env), 0.85); g.beginPath(); g.ellipse(sx, sy, r * 0.065, r * 0.045, ang, 0, TAU); g.fill();
      // a few fine bristles
      g.strokeStyle = rgba(C(pal.belly, env), 0.45); g.lineWidth = r * 0.025;
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k - 1) * 0.5 + (hash(idx * 9 + k) - 0.5) * 0.3 - down.x * 0.8;
        const bx = x + Math.cos(a) * r * 0.9, by = y + Math.sin(a) * r * 0.9;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * r * 0.22, by + Math.sin(a) * r * 0.22); g.stroke();
      }
    }
  }
}

// hat local space: origin = brim centre, units of head radius.
function brimPath(g, off) {
  g.beginPath();
  for (let i = 0; i <= 48; i++) {
    const th = i / 48 * TAU, c = Math.cos(th), s = Math.sin(th);
    const x = 1.2 * c, y = 0.27 * s - 0.1 * c * c + off;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}
function crownPath(g) {
  g.beginPath(); g.moveTo(-0.78, 0.02);
  g.bezierCurveTo(-0.85, -0.5, -0.66, -1.06, -0.04, -1.08);
  g.bezierCurveTo(0.6, -1.09, 0.86, -0.5, 0.78, 0.02);
  g.quadraticCurveTo(0, 0.25, -0.78, 0.02);
  g.closePath();
}
function drawHat(g, cx, cy, R, tilt, o) {
  const pal = o.pal, env = o.env;
  g.save(); g.translate(cx, cy); g.rotate(tilt); g.scale(R, R);
  if (o.sil) { brimPath(g, 0); g.fill(); crownPath(g); g.fill(); g.restore(); return; }
  const lightSide = env.lx < 0 ? -1 : 1;
  const lin = (c0, c1, c2) => { const gr = g.createLinearGradient(-1.2 * lightSide, -0.6, 1.2 * lightSide, 0.3); gr.addColorStop(0, rgba(C(c0, env))); gr.addColorStop(0.45, rgba(C(c1, env))); gr.addColorStop(1, rgba(C(c2, env))); return gr; };
  // brim: underside thickness then top surface
  brimPath(g, 0.075); g.fillStyle = rgba(C(pal.hatDark, env)); g.fill();
  brimPath(g, 0); g.fillStyle = lin(pal.hatLight, pal.hat, pal.hatDark); g.fill();
  if (o.detail > 0) {
    g.save(); brimPath(g, 0); g.clip(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.6;
    g.scale(1 / 70, 1 / 70); g.fillStyle = pat(g, 'clay'); g.fillRect(-120, -60, 240, 120); g.restore();
  }
  // worn front lip
  g.beginPath(); for (let i = 0; i <= 24; i++) { const th = 0.15 + i / 24 * (Math.PI - 0.3); const x = 1.2 * Math.cos(th), y = 0.27 * Math.sin(th) - 0.1 * Math.cos(th) ** 2; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.strokeStyle = rgba(C(pal.hatLight, env), 0.45); g.lineWidth = 0.035; g.stroke();
  // crown
  crownPath(g); g.fillStyle = lin(pal.hatLight, pal.hat, pal.hatDark); g.fill();
  if (o.detail > 0) {
    g.save(); crownPath(g); g.clip();
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.7;
    g.save(); g.scale(1 / 80, 1 / 80); g.fillStyle = pat(g, 'clay'); g.fillRect(-100, -100, 200, 140); g.restore();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // top sheen, dents, crease: a hat that has been sat on
    const sh = g.createRadialGradient(-0.25 * lightSide, -0.85, 0, -0.25 * lightSide, -0.85, 0.6);
    sh.addColorStop(0, rgba(C(pal.hatLight, env), 0.35)); sh.addColorStop(1, rgba(C(pal.hatLight, env), 0));
    g.fillStyle = sh; g.fillRect(-1, -1.2, 2, 1.3);
    g.fillStyle = rgba(C(pal.hatDark, env), 0.28);
    g.beginPath(); g.ellipse(0.42, -0.62, 0.14, 0.26, 0.3, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-0.46, -0.6, 0.12, 0.24, -0.3, 0, TAU); g.fill();
    g.strokeStyle = rgba(C(pal.hatDark, env), 0.7); g.lineWidth = 0.05; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.06, -1.06); g.quadraticCurveTo(0.04, -0.92, 0.02, -0.78); g.stroke();
    if (o.detail > 1) {
      // scuffs
      g.strokeStyle = rgba(C(pal.hatLight, env), 0.28); g.lineWidth = 0.02;
      for (let k = 0; k < 9; k++) {
        const x = (hash(k * 3.1) - 0.5) * 1.2, y = -0.2 - hash(k * 7.7) * 0.75, l = 0.05 + hash(k * 1.3) * 0.1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (hash(k) - 0.5) * 0.06); g.stroke();
      }
      // patch, stitched on long ago
      g.save(); g.translate(0.3, -0.5); g.rotate(0.18);
      rrect(g, -0.13, -0.1, 0.26, 0.2, 0.03); g.fillStyle = rgba(C(mix(pal.hat, pal.hatLight, 0.45), env)); g.fill();
      g.setLineDash([0.025, 0.02]); g.strokeStyle = rgba(C(COL.beige, env), 0.7); g.lineWidth = 0.012;
      rrect(g, -0.11, -0.08, 0.22, 0.16, 0.025); g.stroke(); g.setLineDash([]);
      g.restore();
    }
    g.restore();
  }
  // band
  g.beginPath(); g.moveTo(-0.81, -0.01); g.quadraticCurveTo(0, 0.23, 0.81, -0.01); g.lineTo(0.8, -0.23); g.quadraticCurveTo(0, 0.0, -0.8, -0.23); g.closePath();
  g.fillStyle = rgba(C(pal.band, env)); g.fill();
  g.strokeStyle = rgba(C(pal.hatLight, env), 0.25); g.lineWidth = 0.02;
  g.beginPath(); g.moveTo(-0.8, -0.23); g.quadraticCurveTo(0, 0.0, 0.8, -0.23); g.stroke();
  // little bow on the band
  const bs = -(o.bowSide || 1);
  g.fillStyle = rgba(C(pal.band, env));
  g.beginPath(); g.ellipse(0.58 * bs, -0.08, 0.1, 0.06, 0.5 * bs, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(0.66 * bs, -0.02, 0.09, 0.05, -0.4 * bs, 0, TAU); g.fill();
  if (o.detail > 1) {
    g.fillStyle = rgba(C(pal.hatLight, env), 0.35);
    for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(-0.7 + k * 0.18, 0.0 + Math.sin(k) * 0.02 + 0.06 * Math.sin((k / 7) * Math.PI), 0.01, 0, TAU); g.fill(); }
  }
  g.restore();
}

function drawSuitcase(g, gx, gy, w, h, ang, o) {
  const pal = o.pal, env = o.env;
  const hh = h * 0.17;
  g.save(); g.translate(gx, gy); g.rotate(ang);
  if (o.sil) {
    rrect(g, -w / 2, hh, w, h, h * 0.1); g.fill();
    g.lineWidth = h * 0.08; g.beginPath(); g.moveTo(-w * 0.17, hh); g.bezierCurveTo(-w * 0.17, -hh * 0.3, w * 0.17, -hh * 0.3, w * 0.17, hh); g.stroke();
    g.restore(); return;
  }
  // handle
  g.lineCap = 'round';
  g.strokeStyle = rgba(C(pal.caseDark, env)); g.lineWidth = h * 0.085;
  g.beginPath(); g.moveTo(-w * 0.17, hh); g.bezierCurveTo(-w * 0.17, -hh * 0.35, w * 0.17, -hh * 0.35, w * 0.17, hh); g.stroke();
  g.strokeStyle = rgba(C(pal.caseLight, env), 0.5); g.lineWidth = h * 0.025;
  g.beginPath(); g.moveTo(-w * 0.15, hh * 0.6); g.bezierCurveTo(-w * 0.15, -hh * 0.15, w * 0.15, -hh * 0.15, w * 0.15, hh * 0.6); g.stroke();
  // body
  rrect(g, -w / 2, hh, w, h, h * 0.1);
  const gr = g.createLinearGradient(-w * 0.3 * (env.lx < 0 ? 1 : -1), hh, w * 0.3 * (env.lx < 0 ? 1 : -1), hh + h);
  gr.addColorStop(0, rgba(C(pal.caseLight, env))); gr.addColorStop(0.5, rgba(C(pal.case, env))); gr.addColorStop(1, rgba(C(pal.caseDark, env)));
  g.fillStyle = gr; g.fill();
  if (o.detail > 0) {
    g.save(); g.clip();
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.7;
    g.save(); g.scale(h / 90, h / 90); g.fillStyle = pat(g, 'clay'); g.fillRect(-w / 2 * 90 / h, 0, w * 90 / h, h * 140 / h); g.restore();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // lid seam
    g.fillStyle = rgba(C(pal.caseDark, env), 0.9); g.fillRect(-w / 2, hh + h * 0.24, w, h * 0.035);
    g.fillStyle = rgba(C(pal.caseLight, env), 0.35); g.fillRect(-w / 2, hh + h * 0.275, w, h * 0.015);
    // straps
    for (const sx of [-0.28, 0.28]) {
      g.fillStyle = rgba(C(pal.strap, env)); g.fillRect(w * sx - w * 0.05, hh, w * 0.1, h);
      g.fillStyle = rgba(C(pal.caseLight, env), 0.18); g.fillRect(w * sx - w * 0.05, hh, w * 0.015, h);
      g.strokeStyle = rgba(C(pal.brass, env)); g.lineWidth = h * 0.025;
      g.strokeRect(w * sx - w * 0.065, hh + h * 0.36, w * 0.13, h * 0.1);
    }
    // corner caps (inside the body clip)
    g.fillStyle = rgba(C(pal.caseDark, env), 0.85);
    for (const [cx, cy, a] of [[-w / 2, hh, 0], [w / 2, hh, Math.PI / 2], [w / 2, hh + h, Math.PI], [-w / 2, hh + h, -Math.PI / 2]]) {
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, h * 0.17, a, a + Math.PI / 2); g.closePath(); g.fill();
      g.strokeStyle = rgba(C(pal.caseLight, env), 0.3); g.lineWidth = h * 0.012;
      g.beginPath(); g.arc(cx, cy, h * 0.15, a, a + Math.PI / 2); g.stroke();
    }
    // faded travel label, blank: whatever it once said has worn away
    g.save(); g.translate(w * 0.06, hh + h * 0.64); g.rotate(-0.16);
    g.beginPath(); g.ellipse(0, 0, w * 0.13, h * 0.13, 0, 0, TAU); g.fillStyle = rgba(C(COL.beige, env), 0.55); g.fill();
    g.strokeStyle = rgba(C(COL.rust, env), 0.35); g.lineWidth = h * 0.015; g.beginPath(); g.ellipse(0, 0, w * 0.1, h * 0.1, 0, 0, TAU); g.stroke();
    g.restore();
    if (o.detail > 1) {
      g.setLineDash([h * 0.03, h * 0.025]); g.strokeStyle = rgba(C(pal.caseLight, env), 0.45); g.lineWidth = h * 0.012;
      rrect(g, -w / 2 + h * 0.05, hh + h * 0.05, w - h * 0.1, h - h * 0.1, h * 0.07); g.stroke(); g.setLineDash([]);
      g.strokeStyle = rgba(C(pal.caseLight, env), 0.3); g.lineWidth = h * 0.012;
      for (let k = 0; k < 7; k++) { const x = (hash(k * 5.3) - 0.5) * w * 0.9, y = hh + h * (0.35 + hash(k * 2.1) * 0.55); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.06, y + h * 0.02); g.stroke(); }
    }
    g.restore();
  }
  // clasps & handle brackets
  g.fillStyle = rgba(C(pal.brass, env));
  for (const sx of [-0.1, 0.1]) g.fillRect(w * sx - h * 0.04, hh + h * 0.2, h * 0.08, h * 0.1);
  for (const sx of [-0.17, 0.17]) g.fillRect(w * sx - h * 0.04, hh - h * 0.01, h * 0.08, h * 0.06);
  g.restore();
}

function drawHead(g, hx, hy, R, o) {
  const pal = o.pal, env = o.env;
  const Y = o.yaw || 0, P = o.pitch || 0;
  if (o.sil) {
    g.beginPath(); g.arc(hx, hy, R, 0, TAU); g.fill();
    if (o.hat) drawHat(g, hx, hy - R * (0.72 + 0.22 * P), R, o.hatTilt || 0, o);
    g.lineWidth = R * 0.08 * (o.antScale || 1); g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const L = o.antScale || 1;
      const rx = hx + Math.sin(Y + s * 0.5) * R * 0.5, ry = hy - R * 0.55;
      g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + s * 0.35 * R * L, ry - 0.7 * R * L, rx + s * 0.7 * R * L, ry - 0.82 * R * L); g.stroke();
      g.beginPath(); g.arc(rx + s * 0.7 * R * L, ry - 0.82 * R * L, R * 0.1 * (1 + (L - 1) * 0.8), 0, TAU); g.fill();
    }
    return;
  }
  // head ball
  const gr = g.createRadialGradient(hx + env.lx * R * env.rim, hy + env.ly * R * env.rim, R * 0.05, hx + env.lx * R * 0.1, hy + env.ly * R * 0.1, R * 1.06);
  gr.addColorStop(0, rgba(C(pal.skinLight, env)));
  gr.addColorStop(0.45, rgba(C(pal.skin, env)));
  gr.addColorStop(0.85, rgba(C(pal.skinDark, env)));
  gr.addColorStop(1, rgba(C(pal.skinDeep, env)));
  g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, R, 0, TAU); g.fill();
  if (env.rimCol) rimLight(g, hx, hy, R, env);
  const fy = hy + R * (0.04 - 0.5 * P);
  g.save(); g.beginPath(); g.arc(hx, hy, R, 0, TAU); g.clip();
  if (o.detail > 0) {
    g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55;
    g.translate(hx, hy); g.scale(R / 70, R / 70); g.fillStyle = pat(g, 'clay'); g.fillRect(-80, -80, 160, 160); g.restore();
    // cheek warmth and the soft fold under the face
    g.fillStyle = rgba(C(pal.skinDeep, env), 0.18);
    g.beginPath(); g.ellipse(hx + Math.sin(Y) * R * 0.5, hy + R * 0.85, R * 0.75, R * 0.3, 0, 0, TAU); g.fill();
  }
  // shadow of the brim
  if (o.hat) {
    const by = hy - R * (0.72 + 0.22 * P);
    const sg = g.createRadialGradient(hx, by + R * 0.2, R * 0.2, hx, by + R * 0.2, R * 1.1);
    sg.addColorStop(0, rgba(C(pal.skinDeep, env), 0.55)); sg.addColorStop(1, rgba(C(pal.skinDeep, env), 0));
    g.fillStyle = sg; g.beginPath(); g.ellipse(hx, by + R * 0.2, R * 1.2, R * 0.45, o.hatTilt || 0, 0, TAU); g.fill();
  }
  // eyes
  for (const s of [-1, 1]) {
    const a = Y + s * 0.42, vis = Math.cos(a);
    if (vis < 0.1) continue;
    const ex = hx + Math.sin(a) * R * 0.8, ey = fy;
    const rx = R * 0.165 * (0.3 + 0.7 * vis), ry = R * 0.215;
    g.save();
    g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, TAU);
    g.fillStyle = rgba(C(pal.skinDeep, env), 0.8); g.lineWidth = R * 0.05; g.strokeStyle = rgba(C(pal.skinDeep, env), 0.5); g.stroke();
    g.fillStyle = '#0d0b0a'; g.fill();
    g.clip();
    const eg = g.createRadialGradient(ex - rx * 0.2, ey - ry * 0.3, 0, ex, ey, ry * 1.2);
    eg.addColorStop(0, 'rgba(60,52,46,0.6)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.fillRect(ex - rx, ey - ry, rx * 2, ry * 2);
    if (o.reflect > 0) {
      const rf = o.reflect;
      const rg = g.createRadialGradient(ex, ey - ry * 0.45, 0, ex, ey - ry * 0.45, rx * 1.1);
      rg.addColorStop(0, `rgba(250,196,96,${0.55 * rf})`); rg.addColorStop(1, 'rgba(250,196,96,0)');
      g.fillStyle = rg; g.fillRect(ex - rx, ey - ry, rx * 2, ry * 2);
      // the butterfly, small and curved in the cornea
      g.save(); g.translate(ex + rx * 0.05, ey - ry * 0.4); const bs = rx * 0.78; g.scale(bs, bs * 0.72);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255,205,115,${0.9 * rf})`;
      for (const m of [-1, 1]) { g.save(); g.scale(m, 1); forePath(g); g.fill(); hindPath(g); g.fill(); g.restore(); }
      g.fillStyle = `rgba(255,236,190,${0.6 * rf})`; g.fillRect(-0.03, -0.2, 0.06, 0.7);
      g.restore();
    }
    // catchlights
    g.fillStyle = 'rgba(255,250,238,0.92)';
    g.beginPath(); g.ellipse(ex - rx * 0.32 + env.lx * rx * 0.1, ey - ry * 0.42, rx * 0.26, ry * 0.18, -0.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,250,238,0.5)';
    g.beginPath(); g.arc(ex + rx * 0.3, ey + ry * 0.35, rx * 0.1, 0, TAU); g.fill();
    // heavy, slightly sad lids (the outer corner droops)
    const lid = clamp(o.lid == null ? 0.3 : o.lid), sl = (s < 0 ? 1 : -1) * ry * 0.22;
    const ly = ey - ry + 2 * ry * lid;
    g.beginPath(); g.moveTo(ex - rx * 1.4, ey - ry * 1.5); g.lineTo(ex + rx * 1.4, ey - ry * 1.5);
    g.lineTo(ex + rx * 1.4, ly - sl); g.lineTo(ex - rx * 1.4, ly + sl); g.closePath();
    g.fillStyle = rgba(C(mix(pal.skin, pal.skinDark, 0.35), env)); g.fill();
    g.strokeStyle = rgba(C(pal.skinDeep, env)); g.lineWidth = R * 0.04;
    g.beginPath(); g.moveTo(ex + rx * 1.4, ly - sl); g.lineTo(ex - rx * 1.4, ly + sl); g.stroke();
    g.restore();
    if (o.elder) {
      // white tufted brows
      g.strokeStyle = rgba(C(COL.ivory, env), 0.85); g.lineWidth = R * 0.045; g.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const bx = ex - rx * 1.1 + k * rx * 0.55, by = ey - ry * 1.25 + (s < 0 ? 1 : -1) * (k - 2) * ry * 0.05;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (s < 0 ? -1 : 1) * rx * 0.35, by - ry * 0.35 + boil(k + s * 3, ry * 0.05)); g.stroke();
      }
      if (o.specs) {
        g.strokeStyle = rgba(C(hex('#2a221b'), env)); g.lineWidth = R * 0.035;
        g.beginPath(); g.ellipse(ex, ey, rx * 1.35, ry * 1.15, 0, 0, TAU); g.stroke();
      }
    }
  }
  if (o.elder && o.specs) {
    const a1 = Y - 0.42, a2 = Y + 0.42;
    if (Math.cos(a1) > 0.1 && Math.cos(a2) > 0.1) {
      g.strokeStyle = rgba(C(hex('#2a221b'), env)); g.lineWidth = R * 0.035;
      const x1 = hx + Math.sin(a1) * R * 0.8 + R * 0.2 * Math.cos(a1), x2 = hx + Math.sin(a2) * R * 0.8 - R * 0.2 * Math.cos(a2);
      g.beginPath(); g.moveTo(x1, fy - R * 0.05); g.quadraticCurveTo((x1 + x2) / 2, fy - R * 0.13, x2, fy - R * 0.05); g.stroke();
    }
  }
  // mouth
  if (Math.cos(Y) > 0.05) {
    const mx = hx + Math.sin(Y) * R * 0.78, my = fy + R * 0.42, mw = R * 0.16 * (0.4 + 0.6 * Math.cos(Y));
    if (o.mouthOpen > 0.05) {
      g.fillStyle = rgba(C(hex('#1c1712'), env)); g.beginPath(); g.ellipse(mx, my + R * 0.02, mw * 0.8, R * 0.09 * o.mouthOpen, 0, 0, TAU); g.fill();
    } else {
      g.strokeStyle = rgba(C(pal.skinDeep, env)); g.lineWidth = R * 0.04; g.lineCap = 'round';
      g.beginPath(); g.moveTo(mx - mw, my + R * 0.03); g.quadraticCurveTo(mx, my - R * 0.04, mx + mw, my + R * 0.03); g.stroke();
    }
    if (o.elder) {
      g.strokeStyle = rgba(C(COL.ivory, env), 0.7); g.lineWidth = R * 0.03;
      for (let k = 0; k < 6; k++) {
        const wx = mx + (k - 2.5) * mw * 0.45; g.beginPath(); g.moveTo(wx, my + R * 0.12);
        g.quadraticCurveTo(wx + (k - 2.5) * R * 0.04, my + R * 0.3, wx + (k - 2.5) * R * 0.03 + boil(k + 20, R * 0.02), my + R * 0.45); g.stroke();
      }
    }
  }
  g.restore();
  // hat on top
  if (o.hat) drawHat(g, hx + boil(51, R * 0.015), hy - R * (0.72 + 0.22 * P), R, o.hatTilt || 0, o);
  // antennae, poking out from under the brim
  const L = o.antScale || 1;
  for (const s of [-1, 1]) {
    const a = Y + s * 0.5; if (Math.cos(a) < -0.2) continue;
    const rx = hx + Math.sin(a) * R * 0.55, ry = hy - R * (o.hat ? 0.42 : 0.6) - P * R * 0.2;
    const tx = rx + s * (o.hat ? 1.0 : 0.62) * R * L + boil(s * 11, R * 0.04), ty = ry - (o.hat ? 0.62 : 0.78) * R * L + boil(s * 13, R * 0.04);
    g.strokeStyle = rgba(C(pal.skinDark, env)); g.lineWidth = R * 0.075; g.lineCap = 'round';
    g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + s * 0.55 * R * L, ry - 0.08 * R * L, tx, ty); g.stroke();
    g.fillStyle = rgba(C(pal.skinDeep, env)); g.beginPath(); g.arc(tx, ty, R * 0.11, 0, TAU); g.fill();
    g.fillStyle = rgba(C(pal.skinLight, env), 0.5); g.beginPath(); g.arc(tx - R * 0.03, ty - R * 0.03, R * 0.04, 0, TAU); g.fill();
  }
}

function rimLight(g, x, y, r, env) {
  g.save(); g.clip(); g.globalCompositeOperation = 'lighter';
  const cx = x - env.lx * r * 0.42, cy = y - env.ly * r * 0.42;
  const rg = g.createRadialGradient(cx, cy, r * 0.88, cx, cy, r * 1.42);
  rg.addColorStop(0, rgba(env.rimCol, 0)); rg.addColorStop(1, rgba(env.rimCol, env.rimA || 0.6));
  g.fillStyle = rg; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
  g.restore();
}
function setDetail(g, o) { const px = pxScale(g) * o.r; o.detail = px < 5 ? 0 : (px < 16 ? 1 : 2); }

/* side view. sp: points head-first. */
function drawCaterpillarSide(g, sp, o) {
  const n = sp.length, r = o.r, dir = o.dir || 1;
  o.pal = o.pal || HERO; o.env = o.env || ENV0; setDetail(g, o);
  const rad = i => i === 0 ? r * 1.2 : r * (1 - 0.3 * Math.pow((i - 1) / (n - 2), 1.4));
  const tan = [], down = [];
  for (let i = 0; i < n; i++) {
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)];
    const t = norm(a.x - b.x, a.y - b.y); tan.push(t);
    down.push(dir > 0 ? { x: -t.y, y: t.x } : { x: t.y, y: -t.x });
  }
  const legCol = o.sil ? null : rgba(C(o.pal.leg, o.env));
  if (o.sil) { g.fillStyle = g.strokeStyle = o.silCol || '#000'; }
  // contact shadow
  if (!o.sil && o.groundShadow) {
    g.fillStyle = 'rgba(20,16,12,0.22)';
    for (let i = 1; i < n; i++) { g.beginPath(); g.ellipse(sp[i].x, sp[i].y + rad(i) * 0.95, rad(i) * 1.2, rad(i) * 0.28, 0, 0, TAU); g.fill(); }
  }
  // far legs
  const legs = (far) => {
    for (let i = 1; i <= 3; i++) {
      if (!far && o.holdLeg === i) continue;
      const d = down[i], t = tan[i], ri = rad(i);
      const off = far ? -0.28 : 0.12;
      const bx = sp[i].x + d.x * ri * 0.55 + t.x * ri * off, by = sp[i].y + d.y * ri * 0.55 + t.y * ri * off;
      const kick = Math.sin(SF * 0.9 + i * 1.3) * 0.15;
      const tx = bx + d.x * ri * 0.75 + t.x * ri * (0.15 + kick) + boil(i * 3 + (far ? 1 : 0), ri * 0.05);
      const ty = by + d.y * ri * 0.75 + t.y * ri * (0.15 + kick);
      drawLeg(g, bx, by, tx, ty, ri * 0.15 * dir, ri * 0.17, o.sil ? (o.silCol || '#000') : (far ? rgba(mul(C(o.pal.leg, o.env), 0.7)) : legCol));
    }
  };
  legs(true);
  // prolegs
  for (let i = n - 4; i < n; i++) {
    const d = down[i], ri = rad(i);
    if (!o.sil) g.fillStyle = rgba(mul(C(o.pal.skinDark, o.env), 0.85));
    g.beginPath(); g.ellipse(sp[i].x + d.x * ri * 0.82, sp[i].y + d.y * ri * 0.82, ri * 0.3, ri * 0.24, Math.atan2(tan[i].y, tan[i].x), 0, TAU); g.fill();
  }
  // body, tail first
  for (let i = n - 1; i >= 1; i--) {
    const ri = rad(i), ang = Math.atan2(tan[i].y, tan[i].x);
    if (!o.sil && i < n - 1 && o.detail > 0) {
      g.fillStyle = rgba(C(o.pal.skinDeep, o.env), 0.3);
      g.beginPath(); g.ellipse(sp[i].x - tan[i].x * ri * 0.22, sp[i].y - tan[i].y * ri * 0.22, ri * 1.04, ri * 0.98, ang, 0, TAU); g.fill();
    }
    drawSegment(g, sp[i].x, sp[i].y, ri, ang, o, i, down[i]);
  }
  legs(false);
  // suitcase and the leg that holds it
  if (o.suitcase) {
    const s = o.suitcase;
    drawSuitcase(g, s.x, s.y, s.w, s.h, s.ang || 0, o);
    const i = o.holdLeg || 1, ri = rad(i), d = down[i];
    const bx = sp[i].x + d.x * ri * 0.45 + tan[i].x * ri * 0.3, by = sp[i].y + d.y * ri * 0.45 + tan[i].y * ri * 0.3;
    drawLeg(g, bx, by, s.x, s.y + s.h * 0.02, -ri * 0.25 * dir, ri * 0.19, o.sil ? (o.silCol || '#000') : legCol);
  }
  // head
  const R = rad(0);
  drawHead(g, sp[0].x, sp[0].y, R, Object.assign(o, { bowSide: dir }));
}

/* front view: standing reared up, facing the camera (scene 04, the speaking elder). */
function drawCaterpillarFront(g, x, gy, r, o) {
  o.pal = o.pal || HERO; o.env = o.env || ENV0; setDetail(g, o);
  const sway = o.sway || 0;
  const A = { x: x + boil(1, r * 0.03), y: gy - r * 0.95 };
  const B = { x: x + sway * 0.5 + boil(2, r * 0.03), y: gy - r * 2.45 + boil(3, r * 0.03) };
  const Hd = { x: x + sway + boil(4, r * 0.02), y: gy - r * 3.95 + boil(5, r * 0.03) };
  if (o.sil) g.fillStyle = g.strokeStyle = o.silCol || '#000';
  const legCol = o.sil ? (o.silCol || '#000') : rgba(C(o.pal.leg, o.env));
  if (!o.sil) {
    const sg = g.createRadialGradient(x + r * 1.5, gy, 0, x + r * 1.5, gy, r * 5);
    sg.addColorStop(0, 'rgba(10,8,6,0.45)'); sg.addColorStop(1, 'rgba(10,8,6,0)');
    g.fillStyle = sg; g.beginPath(); g.ellipse(x + r * 1.5, gy, r * 5, r * 0.9, 0, 0, TAU); g.fill();
  }
  // the body trails away behind him, up the step
  const side = o.trail || 1;
  for (let k = o.noTrail ? -1 : 4; k >= 0; k--) {
    const px = x + side * r * (0.95 + 0.9 * k), py = gy - r * (0.62 + 0.3 * k), rr = r * (0.9 - 0.08 * k);
    const env2 = o.sil ? o.env : Object.assign({}, o.env, { k: o.env.k * (0.92 - k * 0.05) });
    drawSegment(g, px, py, rr, 0, Object.assign({}, o, { env: env2 }), 10 + k, { x: 0, y: 1 });
  }
  // suitcase stands beside him
  if (o.suitcase) {
    const s = o.suitcase;
    drawSuitcase(g, s.x, s.y, s.w, s.h, s.ang || 0, o);
  }
  drawSegment(g, A.x, A.y, r, 0, o, 1, { x: 0, y: 1 });
  // prolegs at the base
  if (!o.sil) g.fillStyle = rgba(C(o.pal.skinDark, o.env));
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(A.x + s * r * 0.55, gy - r * 0.08, r * 0.3, r * 0.16, 0, 0, TAU); g.fill(); }
  // lower legs
  for (const s of [-1, 1]) drawLeg(g, A.x + s * r * 0.7, A.y - r * 0.1, A.x + s * r * 1.15, A.y + r * 0.45, -s * r * 0.1, r * 0.17, legCol);
  drawSegment(g, B.x, B.y, r * 0.96, 0, o, 2, { x: 0, y: 1 });
  // upper legs: arms. o.arms = [left, right] raise 0..1
  const arms = o.arms || [0, 0];
  for (const s of [-1, 1]) {
    const raise = arms[s < 0 ? 0 : 1];
    const bx = B.x + s * r * 0.72, by = B.y + r * 0.1;
    let tx, ty;
    if (o.suitcase && s === o.suitcase.side) { tx = o.suitcase.x; ty = o.suitcase.y + o.suitcase.h * 0.03; }
    else {
      const a = lerp(Math.PI / 2 - 0.5, -Math.PI / 2 + 0.65, raise);
      const L = r * lerp(0.75, 1.25, raise);
      tx = bx + s * Math.abs(Math.cos(a)) * L + boil(30 + s, r * 0.05); ty = by + Math.sin(a) * L + boil(32 + s, r * 0.05);
    }
    drawLeg(g, bx, by, tx, ty, -s * r * 0.18, r * 0.18, legCol);
  }
  drawHead(g, Hd.x, Hd.y, r * 1.2, o);
  return Hd;
}

/* ------------------------------------------------------------------ paths along stairs */
function buildStairPath(S, i0, i1, r, leadIn) {
  const pts = [];
  const { x0, y0, rise, run } = S;
  if (leadIn) pts.push([x0 - leadIn, y0 - r]);
  for (let i = i0; i <= i1; i++) {
    const xa = x0 + i * run, yb = y0 - i * rise, yt = yb - rise;
    pts.push([xa - r, yb - r]);
    for (let k = 0; k <= 4; k++) { const a = Math.PI + k / 4 * Math.PI / 2; pts.push([xa + Math.cos(a) * r, yt + Math.sin(a) * r]); }
  }
  pts.push([x0 + (i1 + 1) * run - r, y0 - (i1 + 1) * rise - r]);
  // chaikin
  let P = pts;
  for (let it = 0; it < 2; it++) {
    const Q = [P[0]];
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      Q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
    }
    Q.push(P[P.length - 1]); P = Q;
  }
  // resample every unit
  const xs = [], ys = [];
  let acc = 0; xs.push(P[0][0]); ys.push(P[0][1]);
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = 1 - acc;
    while (d <= L) { xs.push(lerp(a[0], b[0], d / L)); ys.push(lerp(a[1], b[1], d / L)); d += 1; }
    acc = L - (d - 1);
  }
  return { xs, ys, len: xs.length - 1 };
}
function pathPt(P, s) {
  s = clamp(s, 0, P.len - 1.001); const i = Math.floor(s), f = s - i;
  const x = lerp(P.xs[i], P.xs[i + 1], f), y = lerp(P.ys[i], P.ys[i + 1], f);
  const j0 = Math.max(0, i - 3), j1 = Math.min(P.len, i + 4);
  const t = norm(P.xs[j1] - P.xs[j0], P.ys[j1] - P.ys[j0]);
  return { x, y, tx: t.x, ty: t.y };
}
function crawlS(t, o) {
  const out = [];
  for (let i = 0; i < o.n; i++) {
    const ti = t - (o.n - 1 - i) * o.lag;
    const c = Math.floor(ti / o.period), f = ti / o.period - c;
    out.push(o.s0 + (c + smooth(0, 0.62, f)) * o.stride - i * o.spacing);
  }
  return out;
}
/* Caterpillar body along a path, front reared up. Returns spine points, head first. */
function spineOnPath(P, ss, spacing, r) {
  const n = ss.length, pts = [];
  for (let i = 0; i < n; i++) {
    const p = pathPt(P, ss[i]);
    let lift = 0;
    if (i > 0 && i < n - 1) lift = Math.max(0, spacing - (ss[i - 1] - ss[i + 1]) / 2) * 2.2;
    pts.push({ x: p.x + p.ty * lift + boil(i * 7.1, r * 0.06), y: p.y - p.tx * lift + boil(i * 3.7, r * 0.06), tx: p.tx, ty: p.ty });
  }
  const p2 = pts[2], nx = p2.ty, ny = -p2.tx;
  const a1 = 0.35 + 0.45 * Math.abs(p2.tx), a0 = a1 + 0.5;
  const d1 = { x: p2.tx * Math.cos(a1) + nx * Math.sin(a1), y: p2.ty * Math.cos(a1) + ny * Math.sin(a1) };
  pts[1] = { x: p2.x + d1.x * spacing, y: p2.y + d1.y * spacing };
  const d0 = { x: p2.tx * Math.cos(a0) + nx * Math.sin(a0), y: p2.ty * Math.cos(a0) + ny * Math.sin(a0) };
  pts[0] = { x: pts[1].x + d0.x * spacing * 1.1 + boil(99, r * 0.05), y: pts[1].y + d0.y * spacing * 1.1 + boil(98, r * 0.05) };
  return pts;
}
function stairSurfaceY(S, x) {
  if (x < S.x0) return S.y0;
  const k = Math.floor((x - S.x0) / S.run);
  return S.y0 - (k + 1) * S.rise;
}
/* hang the suitcase under the chin; it rests on the tread just below his head */
function hangCase(S, head, R, r, dir) {
  const w = r * 3.9, h = r * 2.9;
  let gx = head.x + dir * R * 0.35, gy = head.y + R * 0.75;
  let k = Math.floor((gx - S.x0) / S.run);
  while (k >= 0 && S.y0 - (k + 1) * S.rise < head.y + R * 0.2) k--;
  let surf;
  if (k < 0) { surf = S.y0; gx = Math.min(gx, S.x0 - w / 2 - 1); }
  else { const xa = S.x0 + k * S.run; gx = clamp(gx, xa + w / 2 + 1, xa + S.run - w / 2 - 1); surf = S.y0 - (k + 1) * S.rise; }
  if (gy + h * 1.17 > surf) gy = surf - h * 1.17;
  return { x: gx, y: gy, w, h, ang: boil(77, 0.04) };
}

/* ------------------------------------------------------------------ perspective concrete stair
 * World: x right, y DOWN, z away from camera. The stair climbs toward +x / -y;
 * its near flank sits on the plane z = Z0, parallel to the lens.
 */
const FOGC = [222, 216, 202];
const IDM = new DOMMatrix();
function proj3(cam, X, Y, Z) { const k = cam.f / (Z - cam.z); return { x: W / 2 + (X - cam.x) * k, y: H / 2 + (Y - cam.y) * k }; }
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function screenRoll(g, rot) { ID(g); g.translate(W / 2 + WEAVE.x, H / 2 + WEAVE.y); g.rotate(rot); g.translate(-W / 2, -H / 2); }
function quad3(g, cam, q, tex, shade, fogA, seed) {
  const p = q.map(v => proj3(cam, v[0], v[1], v[2]));
  g.beginPath(); g.moveTo(p[0].x, p[0].y); for (let i = 1; i < 4; i++) g.lineTo(p[i].x, p[i].y); g.closePath();
  const L1 = dist3(q[0], q[1]) / tex, L3 = dist3(q[0], q[3]) / tex;
  const pt = pat(g, 'concrete');
  if (L1 > 0.01 && L3 > 0.01) {
    const m = new DOMMatrix([(p[1].x - p[0].x) / L1, (p[1].y - p[0].y) / L1, (p[3].x - p[0].x) / L3, (p[3].y - p[0].y) / L3, p[0].x, p[0].y]);
    pt.setTransform(m.translate(-hash(seed) * 512, -hash(seed + 0.37) * 512));
    g.fillStyle = pt; g.fill(); pt.setTransform(IDM);
  }
  g.fillStyle = shade; g.fill();
  if (fogA > 0.004) { g.fillStyle = rgba(FOGC, fogA); g.fill(); }
}
function stairFog(cam, Y, Z) {
  return clamp(Math.max(smooth(900, 7600, -Y), smooth(4000, 45000, Z - cam.z) * 0.85) + smooth(-260, 60, Y) * 0.3);
}
function drawStair3D(g, S, cam, rot) {
  const { x0, y0, rise, run, n, Z0, Z1, U } = S;
  const kF = cam.f / (Z1 - cam.z), kN = cam.f / (Z0 - cam.z);
  const hw = W / 2 / kF * 1.3, hh = H / 2 / kF * 1.3;
  const xMin = cam.x - hw, xMax = cam.x + hw, yMin = cam.y - hh, yMax = cam.y + hh;
  const iMin = Math.max(0, Math.floor(Math.max((y0 - yMax) / rise, (xMin - x0) / run)) - 2);
  const iMax = Math.min(n - 1, Math.ceil(Math.min((y0 - yMin) / rise, (xMax - x0) / run)) + 2);
  const iCam = Math.floor((cam.x - x0) / run);
  const zm = (Z0 + Z1) / 2;
  screenRoll(g, rot);
  const step = i => {
    const xa = x0 + i * run, yb = y0 - i * rise, yt = yb - rise, xb = xa + run;
    if (cam.x < xa) quad3(g, cam, [[xa, yb, Z0], [xa, yt, Z0], [xa, yt, Z1], [xa, yb, Z1]], S.tex, 'rgba(88,82,72,0.34)', stairFog(cam, yt + rise / 2, zm), i * 2);
    if (cam.y < yt) {
      quad3(g, cam, [[xa, yt, Z0], [xb, yt, Z0], [xb, yt, Z1], [xa, yt, Z1]], S.tex, 'rgba(238,232,218,0.30)', stairFog(cam, yt, zm), i * 2 + 1);
      // ambient occlusion where the tread meets the next riser
      if (cam.x < xb && kN * rise > 5) {
        const a = proj3(cam, xb - run * 0.4, yt, Z0), b = proj3(cam, xb, yt, Z0), c = proj3(cam, xb, yt, Z1), d = proj3(cam, xb - run * 0.4, yt, Z1);
        const gr = g.createLinearGradient(a.x, a.y, b.x, b.y);
        gr.addColorStop(0, 'rgba(40,36,30,0)'); gr.addColorStop(1, `rgba(40,36,30,${0.3 * (1 - stairFog(cam, yt, zm))})`);
        g.fillStyle = gr; poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]); g.fill();
      }
    }
    // worn bright nosing
    if (kN * rise > 4) {
      const a = proj3(cam, xa, yt, Z0), b = proj3(cam, xa, yt, Z1);
      g.strokeStyle = `rgba(246,240,226,${0.3 * (1 - stairFog(cam, yt, zm))})`; g.lineWidth = Math.max(1, kN * rise * 0.025);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
  };
  for (let i = iMin; i <= Math.min(iCam - 1, iMax); i++) step(i);
  for (let i = iMax; i >= Math.max(iCam, iMin); i--) step(i);
  // underside, only when we are beneath it
  const yu = x => y0 - (x - x0 - U) * rise / run;
  if (cam.y > yu(cam.x)) {
    const xs = Math.max(x0 + U, xMin), xe = Math.min(x0 + n * run, xMax);
    if (xe > xs) quad3(g, cam, [[xs, yu(xs), Z0], [xe, yu(xe), Z0], [xe, yu(xe), Z1], [xs, yu(xs), Z1]], S.tex, 'rgba(40,36,32,0.55)', stairFog(cam, yu((xs + xe) / 2), zm) * 0.7, 9);
  }
  // near flank, in world space so the concrete stays put
  setCam(g, cam.x, cam.y, kN, rot);
  const first = Math.max(0, iMin - 1), last = Math.min(n, iMax + 2);
  g.beginPath();
  g.moveTo(x0 + first * run, y0 - first * rise);
  for (let i = first; i < last; i++) { const xa = x0 + i * run, yt = y0 - (i + 1) * rise; g.lineTo(xa, yt); g.lineTo(xa + run, yt); }
  const xe = x0 + last * run, ye = y0 - last * rise;
  g.lineTo(xe, ye + U * rise / run);
  if (S.ground && first === 0) g.lineTo(x0 + U, y0);
  else g.lineTo(x0 + first * run, y0 - first * rise + U * rise / run);
  g.closePath();
  concreteFill(g, S.tex, 'rgba(66,60,52,0.46)');
  const fg = g.createLinearGradient(0, -900, 0, -7600);
  fg.addColorStop(0, rgba(FOGC, 0)); fg.addColorStop(0.5, rgba(FOGC, 0.6)); fg.addColorStop(1, rgba(FOGC, 1));
  g.fillStyle = fg; g.fill();
  const gm = g.createLinearGradient(0, -260, 0, 60);
  gm.addColorStop(0, rgba(FOGC, 0)); gm.addColorStop(1, rgba(FOGC, 0.3));
  g.fillStyle = gm; g.fill();
  g.strokeStyle = 'rgba(30,27,24,0.4)'; g.lineWidth = Math.max(1 / kN, 3);
  g.beginPath(); g.moveTo(x0 + first * run, y0 - first * rise + U * rise / run); g.lineTo(xe, ye + U * rise / run); g.stroke();
}
function fogBank(g, cam, X, Y, Z, w, h, a, rot) {
  const k = cam.f / (Z - cam.z); if (k <= 0) return;
  const p = proj3(cam, X, Y, Z);
  screenRoll(g, rot); fogSprite(g, p.x, p.y, w * k, h * k, a);
}

/* ------------------------------------------------------------------ camera */
function setCam(g, cx, cy, z, rot = 0) {
  ID(g);
  g.translate(W / 2 + WEAVE.x, H / 2 + WEAVE.y); g.rotate(rot); g.scale(z, z); g.translate(-cx, -cy);
}
function viewBox(cx, cy, z, pad = 0) { const hw = W / 2 / z * 1.15 + pad, hh = H / 2 / z * 1.15 + pad; return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh }; }
function screen(g) { ID(g); }
// identity in film pixels; the main canvas may run at a reduced backing scale (BS)
let BS = 1;
function ID(g) { const k = g === ctx ? BS : 1; g.setTransform(k, 0, 0, k, 0, 0); }

/* ================================================================== SCENE 01 — THE ENDLESS STAIRCASE
 * A full 3D camera here (yaw + pitch) so the pull-back can reveal the stair's width,
 * its flank, and the fog it climbs into. World: x right, y down, z away.
 */
function makeCam(C, yaw, pitch, f, roll) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return { x: C[0], y: C[1], z: C[2], f, roll, R: [cy, 0, -sy], D: [sy * sp, cp, cy * sp], F: [sy * cp, -sp, cy * cp] };
}
function toCam(c, X, Y, Z) {
  const dx = X - c.x, dy = Y - c.y, dz = Z - c.z;
  return [dx * c.R[0] + dz * c.R[2], dx * c.D[0] + dy * c.D[1] + dz * c.D[2], dx * c.F[0] + dy * c.F[1] + dz * c.F[2]];
}
const NEAR = 12;
const camProj = (c, p) => ({ x: W / 2 + c.f * p[0] / p[2], y: H / 2 + c.f * p[1] / p[2] });
const projC = (c, X, Y, Z) => { const p = toCam(c, X, Y, Z); return Object.assign(camProj(c, p), { k: c.f / p[2], z: p[2] }); };
function clipPoly(cs) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
  }
  return out;
}
/* fill a planar polygon given in world space. uv: indices [o, u, v] of three vertices that set the texture axes */
function polyP(g, c, q, tex, shade, fogA, seed, uv) {
  const cs = q.map(v => toCam(c, v[0], v[1], v[2]));
  const allIn = cs.every(p => p[2] >= NEAR);
  const pc = allIn ? cs : clipPoly(cs);
  if (pc.length < 3) return;
  const p = pc.map(v => camProj(c, v));
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const v of p) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
  if (x1 < -60 || x0 > W + 60 || y1 < -60 || y0 > H + 60) return;
  g.beginPath(); g.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y); g.closePath();
  if (fogA < 0.97 && allIn && tex) {
    const [io, iu, iv] = uv || [0, 1, q.length - 1];
    const L1 = dist3(q[io], q[iu]) / tex, L3 = dist3(q[io], q[iv]) / tex;
    if (L1 > 0.01 && L3 > 0.01 && (x1 - x0) * (y1 - y0) > 30) {
      const po = p[io], pu = p[iu], pv = p[iv];
      const pt = pat(g, 'concrete');
      pt.setTransform(new DOMMatrix([(pu.x - po.x) / L1, (pu.y - po.y) / L1, (pv.x - po.x) / L3, (pv.y - po.y) / L3, po.x, po.y]).translate(-hash(seed) * 512, -hash(seed + 0.37) * 512));
      g.fillStyle = pt; g.fill(); pt.setTransform(IDM);
    } else { g.fillStyle = '#b6af9f'; g.fill(); }
  } else if (fogA < 0.97) { g.fillStyle = '#b6af9f'; g.fill(); }
  if (shade) { g.fillStyle = shade; g.fill(); }
  if (fogA > 0.004) { g.fillStyle = rgba(FOGC, Math.min(1, fogA)); g.fill(); }
}
const ST1 = { XL: -2100, XR: 2100, rise: 64, run: 44, Uz: 640, tex: 0.6 };
const PROF1 = { x0: 0, y0: 0, rise: 64, run: 44 };
const R1 = 8, SP1 = R1 * 1.45, XC1 = -1930;
let P1 = null;
const MONO1 = [
  { x: -14000, w: 2600, top: -30000, z: 26000 }, { x: -6500, w: 1700, top: -22000, z: 19000 },
  { x: 9500, w: 2400, top: -34000, z: 30000 }, { x: 15000, w: 3800, top: -26000, z: 22000 },
  { x: 25000, w: 2400, top: -30000, z: 36000 }, { x: -24000, w: 4600, top: -36000, z: 40000 },
  { x: 3000, w: 2000, top: -40000, z: 52000 },
];
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function fog1(c, Y, Z, X) { const d = Math.hypot(X - c.x, Y - c.y, Z - c.z); return clamp(Math.max(smooth(1100, 8600, -Y), smooth(9000, 70000, d) * 0.9) + smooth(-220, 40, Y) * 0.2); }

function scene1(g, lt, dur) {
  if (!P1) P1 = buildStairPath(PROF1, 0, 12, R1, 700);
  const crawl = { s0: 676, period: 1.15, stride: 14, n: 7, spacing: SP1, lag: 0.1 };
  const ts = SF / 12 - SCENES[0].start;
  const ss = crawlS(ts, crawl);
  const sAvg = crawl.s0 + (lt / crawl.period) * crawl.stride - 3 * SP1;
  const ap = pathPt(P1, sAvg);
  // camera: pulling back, and back, and back
  const e = easeSine(clamp(lt / dur * 0.96 + 0.02));
  const dir = norm3(lerp3([-0.8, 0.1, -0.59], [-0.5, 0.1, -0.86], Math.pow(e, 0.8)));
  const dist = 560 * Math.pow(17000 / 560, e);
  // aim above him by a share of the distance, so he sinks slowly to the bottom of frame instead of out of it
  const lift = dist * lerp(0.13, 0.4, e);
  const TgA = [XC1 + 30 + lerp(0, 500, e), ap.y - lift, ap.x + 60 + lerp(0, 900, e)];
  const TgB = lerp3([XC1 + 30, ap.y - 95, ap.x + 60], [-1300, -3500, 2400], Math.pow(e, 1.35));
  // ...and for the final reveal, a lower camera looking up, so the stair climbs out of frame
  const Tg = lerp3(TgA, TgB, smooth(0.5, 0.97, e));
  const cam = makeCam([Tg[0] + dir[0] * dist, Tg[1] + dir[1] * dist, Tg[2] + dir[2] * dist],
    Math.atan2(-dir[0], -dir[2]), Math.atan2(dir[1], Math.hypot(dir[0], dir[2])), 1000, lerp(-0.02, 0.012, e));
  const rot = cam.roll;

  // sky and the sea of fog the stair rises out of
  screen(g);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#e6e0d1'); sky.addColorStop(0.55, '#d6cfbe'); sky.addColorStop(1, '#c7c0af');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  screenRoll(g, rot);
  // monoliths and the faceless clock, far away in the fog
  for (const m of MONO1.slice().sort((a, b) => b.z - a.z)) {
    const a = projC(cam, m.x, m.top, m.z), b = projC(cam, m.x, 4000, m.z);
    if (a.z < NEAR) continue;
    const fa = 0.5 + smooth(15000, 70000, a.z) * 0.42;
    g.fillStyle = rgba(mix([146, 139, 127], FOGC, fa)); g.fillRect(a.x, a.y, m.w * a.k, b.y - a.y);
    g.fillStyle = rgba(mix([118, 111, 100], FOGC, fa + 0.04)); g.fillRect(a.x + m.w * a.k, a.y + 300 * a.k, m.w * 0.22 * a.k, b.y - a.y);
  }
  {
    const ck = projC(cam, 7500, -16000, 48000), r = 8200 * ck.k;
    g.save(); g.translate(ck.x, ck.y); g.scale(Math.cos(cam.R[2] * 0.6), 1);
    g.fillStyle = 'rgba(176,168,154,0.6)'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(126,118,106,0.55)'; g.lineWidth = r * 0.04; g.stroke();
    g.lineWidth = r * 0.032; g.lineCap = 'butt';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); g.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); g.stroke(); }
    const sec = Math.floor(T), tk = T - sec, settle = tk < 0.14 ? Math.sin(tk / 0.14 * Math.PI) * 0.025 : 0;
    const ha = -Math.PI / 2 + (sec + 7) / 60 * TAU + settle;
    g.strokeStyle = 'rgba(84,78,70,0.65)'; g.lineWidth = r * 0.045; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-Math.cos(ha) * r * 0.15, -Math.sin(ha) * r * 0.15); g.lineTo(Math.cos(ha) * r * 0.8, Math.sin(ha) * r * 0.8); g.stroke();
    g.fillStyle = 'rgba(84,78,70,0.65)'; g.beginPath(); g.arc(0, 0, r * 0.06, 0, TAU); g.fill();
    g.restore();
  }
  screen(g); g.fillStyle = rgba(FOGC, 0.4); g.fillRect(0, 0, W, H);
  screenRoll(g, rot);
  const hor = H / 2 + cam.f * Math.tan(Math.atan2(-cam.F[1], Math.hypot(cam.F[0], cam.F[2])));
  const sea = g.createLinearGradient(0, hor - 140, 0, H);
  sea.addColorStop(0, rgba(FOGC, 0)); sea.addColorStop(0.25, rgba([214, 208, 194], 0.92)); sea.addColorStop(1, rgba([196, 190, 176], 1));
  g.fillStyle = sea; g.fillRect(-200, hor - 140, W + 400, H - hor + 400);
  for (let i = 0; i < 8; i++) {
    const p = projC(cam, -30000 + i * 9000 + ((T * 300) % 9000), -9000 - hash(i) * 9000, 24000 + hash(i + 2) * 10000);
    if (p.z > NEAR) fogSprite(g, p.x, p.y, 30000 * p.k, 9000 * p.k, 0.5);
  }

  // the stair: risers and treads far to near, then the flank
  const { XL, XR, rise, run } = ST1;
  let kMax = 0;
  for (let k = 0; k < 400; k++) { if (fog1(cam, -k * rise, k * run, XC1) > 0.995) break; kMax = k; }
  for (let k = kMax; k >= 0; k--) {
    const z0 = k * run, z1 = z0 + run, yb = -k * rise, yt = yb - rise;
    const fr = fog1(cam, yt + rise / 2, z0, (XL + XR) / 2 * 0.3), ft = fog1(cam, yt, z0 + run / 2, (XL + XR) / 2 * 0.3);
    polyP(g, cam, [[XL, yb, z0], [XR, yb, z0], [XR, yt, z0], [XL, yt, z0]], ST1.tex, 'rgba(88,82,72,0.36)', fr, k * 2, [0, 1, 3]);
    if (cam.y < yt) {
      polyP(g, cam, [[XL, yt, z0], [XR, yt, z0], [XR, yt, z1], [XL, yt, z1]], ST1.tex, 'rgba(240,234,220,0.30)', ft, k * 2 + 1, [0, 1, 3]);
      // occlusion in the corner where tread meets the next riser
      const a = projC(cam, XL, yt, z1 - run * 0.45), b = projC(cam, XL, yt, z1), c2 = projC(cam, XR, yt, z1), d2 = projC(cam, XR, yt, z1 - run * 0.45);
      if (a.z > NEAR && d2.z > NEAR && Math.abs(b.y - a.y) + Math.abs(b.x - a.x) > 3) {
        const gr = g.createLinearGradient(a.x, a.y, b.x, b.y);
        gr.addColorStop(0, 'rgba(40,36,30,0)'); gr.addColorStop(1, `rgba(40,36,30,${0.32 * (1 - ft)})`);
        g.fillStyle = gr; poly(g, [[a.x, a.y], [b.x, b.y], [c2.x, c2.y], [d2.x, d2.y]]); g.fill();
      }
    }
    const n0 = projC(cam, XL, yt, z0), n1 = projC(cam, XR, yt, z0);
    if (n0.z > NEAR && n1.z > NEAR && n0.k * rise > 3) {
      g.strokeStyle = `rgba(247,241,228,${0.32 * (1 - ft)})`; g.lineWidth = Math.max(1, n0.k * rise * 0.03);
      g.beginPath(); g.moveTo(n0.x, n0.y); g.lineTo(n1.x, n1.y); g.stroke();
    }
  }
  if (cam.x < XL) {
    const fl = [[XL, 0, 0]];
    for (let k = 0; k <= kMax + 1; k++) { fl.push([XL, -(k + 1) * rise, k * run], [XL, -(k + 1) * rise, (k + 1) * run]); }
    const zl = (kMax + 2) * run; fl.push([XL, -(zl - ST1.Uz) * rise / run, zl], [XL, 0, ST1.Uz]);
    // texture axes: along the stair (z) and up (y)
    const cs = fl.map(v => toCam(cam, v[0], v[1], v[2]));
    const pc = cs.every(p => p[2] >= NEAR) ? cs : clipPoly(cs);
    if (pc.length > 2) {
      const p = pc.map(v => camProj(cam, v));
      g.beginPath(); g.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y); g.closePath();
      const o = projC(cam, XL, 0, 0), u = projC(cam, XL, 0, 2000), v = projC(cam, XL, -2000, 0);
      const pt = pat(g, 'concrete'), L = 2000 / ST1.tex;
      pt.setTransform(new DOMMatrix([(u.x - o.x) / L, (u.y - o.y) / L, (v.x - o.x) / L, (v.y - o.y) / L, o.x, o.y]));
      g.fillStyle = pt; g.fill(); pt.setTransform(IDM);
      g.fillStyle = 'rgba(62,57,50,0.5)'; g.fill();
      const fa = projC(cam, XL, -1100, 1100 / 1.45), fb = projC(cam, XL, -8600, 8600 / 1.45);
      const fg = g.createLinearGradient(fa.x, fa.y, fb.x, fb.y);
      fg.addColorStop(0, rgba(FOGC, 0.12)); fg.addColorStop(0.5, rgba(FOGC, 0.7)); fg.addColorStop(1, rgba(FOGC, 1));
      g.fillStyle = fg; g.fill();
      const ga = projC(cam, XL, -260, 300), gb = projC(cam, XL, 40, 300);
      const gm = g.createLinearGradient(ga.x, ga.y, gb.x, gb.y);
      gm.addColorStop(0, rgba(FOGC, 0)); gm.addColorStop(1, rgba(FOGC, 0.85));
      g.fillStyle = gm; g.fill();
    }
  }

  // mist at the foot of the stair and banks drifting across
  const ga = projC(cam, XC1, -200, 200), gb = projC(cam, XC1, 80, 200);
  if (ga.z > NEAR) {
    const gm = g.createLinearGradient(0, ga.y, 0, gb.y + 40);
    gm.addColorStop(0, rgba(FOGC, 0)); gm.addColorStop(0.6, rgba(FOGC, 0.55)); gm.addColorStop(1, rgba(FOGC, 0.85));
    g.fillStyle = gm; g.fillRect(-200, ga.y, W + 400, H - ga.y + 400);
  }
  // the caterpillar, projected from his path on the stair
  const sp3 = spineOnPath(P1, ss, SP1, R1);
  const hk = projC(cam, XC1, sp3[3].y, sp3[3].x).k;
  const sp = sp3.map(p => { const q = projC(cam, XC1, p.y, p.x); return { x: q.x, y: q.y }; });
  DEBUG.hero = sp[0];
  const sc3 = hangCase(PROF1, sp3[0], R1 * 1.2, R1, 1);
  const grip = projC(cam, XC1 - 14, sc3.y, sc3.x);
  drawCaterpillarSide(g, sp, {
    r: R1 * hk, dir: -1, yaw: -1.25, pitch: 0.2, lid: 0.32, hat: true, hatTilt: -0.1, holdLeg: 1,
    suitcase: { x: grip.x, y: grip.y, w: sc3.w * grip.k, h: sc3.h * grip.k, ang: sc3.ang },
  });

  for (let i = 0; i < 9; i++) {
    const p = projC(cam, -3000 + i * 900 + ((T * 30) % 900), -40 - hash(i + 3) * 70, -200 + hash(i) * 900);
    if (p.z > NEAR) fogSprite(g, p.x, p.y, 1800 * p.k, 380 * p.k, 0.22);
  }
  for (let i = 0; i < 12; i++) {
    const p = projC(cam, -6000 + i * 1500 + ((T * (50 + 30 * hash(i))) % 1500), -1400 - hash(i + 4) * 8000, 200 + hash(i) * 5000);
    if (p.z > NEAR) fogSprite(g, p.x, p.y, 5200 * p.k, 1600 * p.k, 0.42);
  }
}

/* ================================================================== SCENE 02 — THE MYSTERY */
const S2 = { x0: -200 * 44, y0: 200 * 64, rise: 64, run: 44, n: 420, Z0: 0, Z1: 1000, U: 380, tex: 0.55 };
const R2 = 8, SP2 = R2 * 1.45;
let P2 = null;
// distant floating stairs: x, y, Z, rotation, flip (−1 = upside down), scale, travellers
const FAR2 = [
  { x: -14000, y: -9000, Z: 30000, rot: 0.25, flip: 1, sc: 5, steps: 90, cats: 1 },
  { x: 16000, y: 7000, Z: 24000, rot: -0.75, flip: -1, sc: 4.5, steps: 80, cats: 2 },
  { x: -15000, y: 9000, Z: 16000, rot: 0.6, flip: 1, sc: 3, steps: 70, cats: 1 },
  { x: 9000, y: -6500, Z: 11000, rot: 0.05, flip: 1, sc: 2.4, steps: 70, cats: 2 },
  { x: 1000, y: 14000, Z: 20000, rot: 2.9, flip: 1, sc: 4, steps: 80, cats: 1 },
  { x: -4000, y: -14000, Z: 36000, rot: -1.45, flip: 1, sc: 6, steps: 60, cats: 1 },
];
function simpleStair(g, steps, rise, run, thick) {
  g.beginPath(); g.moveTo(0, 0);
  for (let i = 0; i < steps; i++) { g.lineTo(i * run, -(i + 1) * rise); g.lineTo((i + 1) * run, -(i + 1) * rise); }
  g.lineTo(steps * run, -steps * rise + thick); g.lineTo(0, thick); g.closePath();
}
function tinyCrawler(g, x, y, ang, s, col, phase) {
  g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col;
  for (let i = 5; i >= 0; i--) {
    const hump = Math.max(0, Math.sin(phase * TAU - i * 0.9)) * s * 0.6;
    g.beginPath(); g.arc(-i * s * 1.25, -s - hump, s * (i === 0 ? 1.15 : 1 - i * 0.05), 0, TAU); g.fill();
  }
  g.restore();
}
function scene2(g, lt, dur) {
  if (!P2) P2 = buildStairPath(S2, 190, 214, R2, 0);
  const startS = (200 - 190) * (S2.rise + S2.run) * 0.97 - 10;
  const crawl = { s0: startS, period: 1.2, stride: 16, n: 7, spacing: SP2, lag: 0.1 };
  const ts = SF / 12 - SCENES[1].start;
  const ss = crawlS(ts, crawl);
  const Zc = S2.Z0 + 45;
  const sAvg = crawl.s0 + (lt / crawl.period) * crawl.stride - 3 * SP2;
  const ap = pathPt(P2, sAvg);
  const e = easeSine(lt / dur);
  const d = lerp(1250, 980, e), k = 1000 / d;
  const sx = lerp(1420, 1040, e), sy = lerp(700, 620, e);
  const cam = { f: 1000, x: ap.x - (sx - W / 2) / k, y: ap.y - R2 * 2 - (sy - H / 2) / k, z: Zc - d };
  const rot = lerp(-0.06, 0.03, e);

  screen(g);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#ddd6c6'); sky.addColorStop(0.5, '#bfb7a7'); sky.addColorStop(1, '#6f6a60');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  // distant floating stairs, some upside down, with other travellers on them
  for (const f of FAR2.slice().sort((a, b) => b.Z - a.Z)) {
    const kk = cam.f / (f.Z - cam.z); setCam(g, cam.x, cam.y, kk, rot);
    const fog = 0.42 + smooth(8000, 40000, f.Z) * 0.45;
    g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.scale(f.sc, f.sc * f.flip);
    const run = 44, rise = 64;
    g.translate(-f.steps * run / 2, f.steps * rise / 2);
    simpleStair(g, f.steps, rise, run, 260);
    g.fillStyle = rgba(mix([104, 98, 88], FOGC, fog)); g.fill();
    g.strokeStyle = rgba(mix([214, 207, 192], FOGC, fog * 0.6)); g.lineWidth = 6;
    g.beginPath(); for (let i = 0; i < f.steps; i++) { g.moveTo(i * run, -(i + 1) * rise); g.lineTo((i + 1) * run, -(i + 1) * rise); } g.stroke();
    for (let c = 0; c < (f.cats || 0); c++) {
      const prog = ((c * 0.41 + 0.25 + T * 0.01) % 1) * f.steps;
      const ph = (T * 0.8 + c * 0.3) % 1;
      tinyCrawler(g, prog * run, -prog * rise - 2, 0, 11, rgba(mix([88, 112, 70], FOGC, fog * 0.75)), ph);
    }
    g.restore();
  }
  // drifting brutalist blocks
  for (let i = 0; i < 5; i++) {
    const Z = 9000 + i * 6000, kk = cam.f / (Z - cam.z); setCam(g, cam.x, cam.y, kk, rot);
    const bx = -12000 + i * 6500 + Math.sin(T * 0.1 + i) * 60, by = -7000 + hash(i + 40) * 14000;
    g.save(); g.translate(bx, by); g.rotate(hash(i + 3) * 0.5 - 0.25);
    g.fillStyle = rgba(mix([112, 106, 96], FOGC, 0.55 + i * 0.07)); g.fillRect(-900, -2200, 1800, 4400);
    g.fillStyle = rgba(mix([86, 80, 72], FOGC, 0.6 + i * 0.07)); g.fillRect(900, -2050, 400, 4400);
    g.restore();
  }
  screen(g); g.fillStyle = rgba(FOGC, 0.2); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) fogBank(g, cam, cam.x - 9000 + i * 2600 + ((T * 90) % 2600), cam.y + 2600 + hash(i) * 1500, 5000, 6000, 1800, 0.5, rot);

  drawStair3D(g, S2, cam, rot);
  setCam(g, cam.x, cam.y, cam.f / (Zc - cam.z), rot);
  const sp = spineOnPath(P2, ss, SP2, R2);
  const R = R2 * 1.2, sc = hangCase(S2, sp[0], R, R2, 1);
  drawCaterpillarSide(g, sp, { r: R2, dir: 1, yaw: 0.75, pitch: 0.22, lid: 0.34, hat: true, hatTilt: -0.12, suitcase: sc, holdLeg: 1 });
  // wisps passing between us and him
  for (let i = 0; i < 5; i++) fogBank(g, cam, cam.x - 1800 + i * 900 - ((T * 60) % 900), cam.y + 250 + hash(i) * 300, -250, 1300, 300, 0.3, rot);

  // out-of-focus pier sliding past the lens
  const pierX = lerp(2400, -500, smooth(5.4, 6.9, lt));
  const sm = TEX.small, sg = sm.getContext('2d');
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, sm.width, sm.height);
  sg.scale(0.25, 0.25);
  sg.save(); sg.translate(pierX, 0); sg.rotate(0.06);
  sg.fillStyle = '#2b2824'; sg.fillRect(-130, -200, 260, H + 400);
  sg.fillStyle = 'rgba(120,110,96,0.4)'; sg.fillRect(95, -200, 35, H + 400);
  sg.restore();
  screen(g); g.drawImage(sm, 0, 0, W, H);
}

/* ================================================================== SCENE 03 — THE ELDERS */
function staticSpine(hx, gy, r, dir, n, rear, breathe) {
  const sp = r * 1.45, pts = [];
  const rad = i => r * (1 - 0.3 * Math.pow((i - 1) / (n - 2), 1.4));
  const base = { x: hx - dir * sp * 0.9, y: gy - rad(2) };
  for (let i = 2; i < n; i++) {
    const x = base.x - dir * sp * (i - 2) * 0.98, y = gy - rad(i) - Math.max(0, Math.sin(i * 1.1 + breathe)) * r * 0.08;
    pts[i] = { x: x + boil(i * 5, r * 0.04), y: y + boil(i * 6, r * 0.03) };
  }
  const a1 = rear * 0.62, a0 = rear;
  pts[1] = { x: pts[2].x + dir * Math.cos(a1) * sp, y: pts[2].y - Math.sin(a1) * sp };
  pts[0] = { x: pts[1].x + dir * Math.cos(a0) * sp * 1.1 + boil(91, r * 0.04), y: pts[1].y - Math.sin(a0) * sp * 1.1 + boil(92, r * 0.04) };
  return pts;
}
const CROWD = [
  { x: 330, gy: 905, r: 14, dir: 1, pal: 'elder', delay: 0.4 },
  { x: 560, gy: 965, r: 15, dir: 1, pal: 'young', delay: 0.9 },
  { x: 735, gy: 880, r: 12.5, dir: 1, pal: 'elder', delay: 0.0, specs: true },
  { x: 1215, gy: 885, r: 12.5, dir: -1, pal: 'elder', delay: 0.6 },
  { x: 1690, gy: 925, r: 14, dir: -1, pal: 'young', delay: 1.2 },
  { x: 110, gy: 1035, r: 18, dir: 1, pal: 'elder', delay: 0.7 },
];
function scene3(g, lt, dur) {
  const ts = SF / 12 - SCENES[2].start;
  const e = easeSine(lt / dur);
  const z = lerp(1.0, 1.1, e), cx = 960, cy = lerp(575, 515, e);
  const flick = 0.86 + 0.1 * vnoise(ts * 6) + 0.04 * vnoise(ts * 17);
  const lamp = { x: 1000, y: 812 };
  const floorY = 770;

  setCam(g, cx, cy, z);
  // the wall: the riser of the next, impossibly tall step
  g.beginPath(); g.rect(-400, -600, 2720, floorY + 600); concreteFill(g, 0.9, 'rgba(26,23,20,0.78)');
  // glow of the lamp on the wall
  g.save(); g.globalCompositeOperation = 'lighter';
  const wl = g.createRadialGradient(lamp.x, floorY - 60, 0, lamp.x, floorY - 120, 900);
  wl.addColorStop(0, `rgba(200,130,60,${0.55 * flick})`); wl.addColorStop(0.45, `rgba(150,92,44,${0.25 * flick})`); wl.addColorStop(1, 'rgba(120,70,30,0)');
  g.fillStyle = wl; g.fillRect(-400, -600, 2720, floorY + 600);
  g.restore();

  // shadow on the wall, becoming a butterfly
  const wing = easeIO(smooth(3.4, 8.6, ts));
  const raise = smooth(3.0, 5.2, ts);
  const talk = ts < 9.5 ? (hash2(SF, 7) > 0.45 ? hash2(SF, 8) : 0) : 0;
  const elderX = 958, elderGY = 705, er = 15;
  const sm = TEX.small, sg = sm.getContext('2d');
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, sm.width, sm.height);
  // map world -> small buffer: same camera at quarter resolution
  sg.setTransform(0.25 * z, 0, 0, 0.25 * z, 0.25 * (W / 2 - cx * z), 0.25 * (H / 2 - cy * z));
  const S = lerp(5.2, 6.3, smooth(2, 11, ts)) * (1 + 0.02 * (flick - 0.9));
  const shX = lerp(elderX, 930, 0.5), shY = floorY - 62;
  sg.save(); sg.translate(shX, shY); sg.scale(S * 0.78, S * 1.12); sg.translate(-elderX, -elderGY);
  const flap = Math.sin(ts * 1.6) * 0.12 * smooth(8, 10, ts);
  const thorax = { x: elderX, y: elderGY - er * 2.45 };
  if (wing > 0.001) {
    sg.save(); sg.translate(thorax.x, thorax.y - er * 0.4);
    const ws = er * 5.2 * wing;
    for (const m of [-1, 1]) {
      sg.save(); sg.scale(m * ws * 1.45 * (1 - Math.abs(flap)), ws * (0.92 + 0.08 * wing));
      sg.rotate(-0.1 * (1 - wing));
      sg.fillStyle = '#000'; forePath(sg); sg.fill();
      sg.save(); sg.scale(1, 0.66); hindPath(sg); sg.fill(); sg.restore();
      sg.restore();
    }
    sg.restore();
  }
  drawCaterpillarFront(sg, elderX, elderGY, er, { sil: true, silCol: '#000', pal: ELDER, arms: [raise, raise], antScale: 1 + wing * 1.1, noTrail: true });
  sg.restore();
  // clip shadow to the wall
  g.save(); screen(g);
  g.beginPath(); const wallBottom = H / 2 + (floorY - cy) * z; g.rect(0, 0, W, wallBottom);
  g.clip();
  g.globalAlpha = 0.78; g.globalCompositeOperation = 'multiply';
  g.drawImage(sm, 0, 0, W, H);
  g.restore();

  setCam(g, cx, cy, z);
  // floor: a great concrete tread
  g.beginPath(); g.rect(-400, floorY, 2720, 900); concreteFill(g, 0.9, 'rgba(30,26,22,0.72)');
  const fl = g.createLinearGradient(0, floorY, 0, floorY + 24);
  fl.addColorStop(0, 'rgba(10,8,6,0.6)'); fl.addColorStop(1, 'rgba(10,8,6,0)'); g.fillStyle = fl; g.fillRect(-400, floorY, 2720, 24);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.translate(lamp.x, lamp.y); g.scale(1, 0.32);
  const pool = g.createRadialGradient(0, 0, 0, 0, 0, 900);
  pool.addColorStop(0, `rgba(210,140,70,${0.5 * flick})`); pool.addColorStop(0.5, `rgba(140,88,40,${0.2 * flick})`); pool.addColorStop(1, 'rgba(120,70,30,0)');
  g.fillStyle = pool; g.fillRect(-1200, -1200, 2400, 2400);
  g.restore();

  // the raised stone
  poly(g, [[878, floorY + 2], [878, elderGY], [1040, elderGY], [1040, floorY + 2]]); concreteFill(g, 0.9, 'rgba(26,21,16,0.74)');
  poly(g, [[878, elderGY], [1040, elderGY], [1030, elderGY - 9], [888, elderGY - 9]]); concreteFill(g, 0.9, 'rgba(120,80,44,0.55)');
  g.fillStyle = 'rgba(255,180,100,0.10)'; g.fillRect(878, elderGY, 162, 22);

  // the elder, lit from below
  const envE = { k: 0.72 * flick, warm: [150, 80, 30], wa: 0.3, lx: 0.15, ly: 0.75, rim: 0.55, rimCol: [255, 170, 90], rimA: 0.35 };
  drawCaterpillarFront(g, elderX, elderGY, er, {
    pal: ELDER, env: envE, elder: true, specs: true, arms: [raise * (0.9 + 0.1 * Math.sin(ts * 3)), raise],
    yaw: 0.05 * Math.sin(ts * 0.7), pitch: lerp(-0.05, 0.25, raise) + talk * 0.04, lid: 0.45, mouthOpen: talk, trail: 1,
    sway: Math.sin(ts * 1.3) * er * 0.12,
  });

  // the lamp: a thimble of oil and a small flame
  g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(lamp.x, lamp.y + 6, 15, 5, 0, 0, TAU); g.fill();
  const lb = g.createLinearGradient(lamp.x - 12, 0, lamp.x + 12, 0); lb.addColorStop(0, '#8a6a3c'); lb.addColorStop(0.5, '#c79a55'); lb.addColorStop(1, '#5a4228');
  g.fillStyle = lb; poly(g, [[lamp.x - 12, lamp.y - 8], [lamp.x + 12, lamp.y - 8], [lamp.x + 9, lamp.y + 6], [lamp.x - 9, lamp.y + 6]]); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  const fh = 20 + 4 * vnoise(ts * 9);
  const halo = g.createRadialGradient(lamp.x, lamp.y - 18, 0, lamp.x, lamp.y - 18, 140);
  halo.addColorStop(0, `rgba(255,190,100,${0.55 * flick})`); halo.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = halo; g.fillRect(lamp.x - 140, lamp.y - 160, 280, 280);
  g.translate(lamp.x + vnoise(ts * 7) * 1.5, lamp.y - 8);
  g.beginPath(); g.moveTo(0, -fh); g.bezierCurveTo(6, -fh * 0.5, 6, -2, 0, 0); g.bezierCurveTo(-6, -2, -6, -fh * 0.5, 0, -fh);
  const fg = g.createLinearGradient(0, -fh, 0, 0); fg.addColorStop(0, 'rgba(255,220,150,0.7)'); fg.addColorStop(1, 'rgba(255,240,200,1)');
  g.fillStyle = fg; g.fill();
  g.restore();

  // the audience: rim-lit by the flame, slowly looking up
  const look = (d) => easeIO(smooth(5.4 + d, 9.4 + d, ts));
  const drawMember = (m, isHero) => {
    const pal = isHero ? HERO : (m.pal === 'elder' ? ELDER : YOUNG);
    const L = look(m.delay || 0);
    const hdx = m.x, gy = m.gy;
    const lv = norm(lamp.x - hdx, lamp.y - 60 - gy);
    const env = { k: 0.4 * flick, warm: [110, 58, 24], wa: 0.32, lx: lv.x, ly: lv.y, rim: 0.85, rimCol: [255, 168, 88], rimA: 0.5 * flick };
    const sp = staticSpine(hdx, gy, m.r, m.dir, 7, lerp(1.0, 1.25, L), ts * 1.3 + m.x);
    const o = {
      r: m.r, dir: m.dir, pal, env, yaw: m.dir * lerp(0.95, 0.7, L), pitch: lerp(0.1, 0.62, L),
      lid: lerp(m.pal === 'elder' ? 0.45 : 0.35, 0.12, L), elder: m.pal === 'elder', specs: m.specs, groundShadow: true,
      blink: 0,
    };
    if (isHero) {
      Object.assign(o, { hat: true, hatTilt: 0.1 + lerp(0, 0.12, L), lid: lerp(0.36, 0.1, L) });
      const R = m.r * 1.2;
      const w = m.r * 3.9, h = m.r * 2.9;
      o.suitcase = { x: sp[0].x - m.dir * 0 + m.dir * R * 0.2 - w * 0.0, y: gy - h * 1.17, w, h, ang: 0 };
      o.suitcase.x = sp[0].x + m.dir * R * 1.6;
      o.holdLeg = 1;
    }
    drawCaterpillarSide(g, sp, o);
  };
  // back row first
  const order = CROWD.slice().sort((a, b) => a.gy - b.gy);
  const hero = { x: 1450, gy: 990, r: 17, dir: -1, delay: 0.3 };
  let heroDrawn = false;
  for (const m of order) {
    if (!heroDrawn && m.gy > hero.gy) { drawMember(hero, true); heroDrawn = true; }
    drawMember(m, false);
  }
  if (!heroDrawn) drawMember(hero, true);

  // dust in the lamplight
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const x = 500 + hash(i) * 1000 + Math.sin(T * 0.3 + i) * 20;
    const y = 200 + ((hash(i + 0.5) * 700 - T * (6 + hash(i + 2) * 10)) % 700 + 700) % 700;
    const d = Math.hypot(x - lamp.x, (y - 600) * 1.4) / 700;
    const a = clamp(1 - d) * 0.5 * (0.5 + 0.5 * Math.sin(T * 2 + i));
    g.fillStyle = `rgba(255,200,130,${a})`; g.beginPath(); g.arc(x, y, 1.2 + hash(i + 7) * 1.6, 0, TAU); g.fill();
  }
  g.restore();
}

/* ================================================================== SCENE 04 — THE BUTTERFLY */
const ST4 = { f: 880, camH: 1.25, hor: 760, rise: 0.17, run: 0.3, z0: 2.4, half: 3.2 };
function proj4(x, y, z) { return { x: 960 + ST4.f * x / z, y: ST4.hor - ST4.f * (y - ST4.camH) / z }; }
function drawButterflyGlass(g, cx, cy, sc, reveal, t) {
  const flap = 0.95 + 0.05 * Math.sin(t * 0.8);
  const U = BF.U;
  // halo and rays
  g.save(); g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(cx, cy, 0, cx, cy, 1300 * sc);
  halo.addColorStop(0, `rgba(255,205,120,${0.55 * reveal})`); halo.addColorStop(0.35, `rgba(220,150,70,${0.22 * reveal})`); halo.addColorStop(1, 'rgba(160,90,40,0)');
  g.fillStyle = halo; g.fillRect(cx - 1400 * sc, cy - 1400 * sc, 2800 * sc, 2800 * sc);
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * TAU + t * 0.02 + hash(k) * 0.2, wdt = 0.025 + hash(k + 3) * 0.05, len = (1400 + hash(k + 5) * 1200) * sc;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, len);
    rg.addColorStop(0, `rgba(255,215,140,${(0.12 + 0.1 * hash(k + 9)) * reveal * (0.7 + 0.3 * Math.sin(t * 0.7 + k))})`); rg.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = rg; g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a - wdt) * len, cy + Math.sin(a - wdt) * len); g.lineTo(cx + Math.cos(a + wdt) * len, cy + Math.sin(a + wdt) * len); g.closePath(); g.fill();
  }
  g.restore();
  // wings, revealed from the body outward
  const s = sc;
  const drawWings = (img, alpha, mode) => {
    g.save(); g.globalAlpha = alpha; if (mode) g.globalCompositeOperation = mode;
    for (const m of [-1, 1]) {
      g.save(); g.translate(cx, cy); g.scale(m * s * flap, s);
      g.drawImage(img, -BF.rx, -BF.ry, BF.W, BF.H);
      g.restore();
    }
    g.drawImage(img === TEX.wing ? TEX.bbody : TEX.bbodyGlow, cx - TEX.bbodyX * s, cy - BF.ry * s, TEX.bbody.width * s, TEX.bbody.height * s);
    g.restore();
  };
  if (reveal < 0.999) {
    const b = TEX.buf2 || (TEX.buf2 = mk(W, H)), bg = b.getContext('2d');
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, W, H);
    const m = g.getTransform(); bg.setTransform(m);
    const gg = g; // draw into buffer using same helper
    const saved = g;
    // draw wings into the buffer
    for (const mm of [-1, 1]) { bg.save(); bg.translate(cx, cy); bg.scale(mm * s * flap, s); bg.drawImage(TEX.wing, -BF.rx, -BF.ry, BF.W, BF.H); bg.restore(); }
    bg.drawImage(TEX.bbody, cx - TEX.bbodyX * s, cy - BF.ry * s, TEX.bbody.width * s, TEX.bbody.height * s);
    bg.globalCompositeOperation = 'destination-in';
    const rr = (0.05 + reveal * 1.3) * U * s;
    const mg = bg.createRadialGradient(cx, cy, rr * 0.6, cx, cy, rr);
    mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    bg.fillStyle = mg; bg.fillRect(cx - 2000 * s, cy - 2000 * s, 4000 * s, 4000 * s);
    bg.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.25 + 0.75 * reveal; g.drawImage(b, 0, 0); g.restore();
  } else drawWings(TEX.wing, 1, null);
  // bloom
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * reveal;
  for (const m of [-1, 1]) { g.save(); g.translate(cx, cy); g.scale(m * s * flap, s); g.drawImage(TEX.wingGlow, -BF.rx, -BF.ry, BF.W, BF.H); g.restore(); }
  g.drawImage(TEX.bbodyGlow, cx - TEX.bbodyX * s, cy - BF.ry * s, TEX.bbody.width * s, TEX.bbody.height * s);
  g.restore();
}
function drawStairs4(g, glow) {
  const { rise, run, z0, half } = ST4;
  const N = 150;
  for (let k = N; k >= 0; k--) {
    const z = z0 + k * run, y = k * rise, yPrev = (k - 1) * rise;
    const haze = clamp(Math.pow(k / 70, 0.8));
    g.globalAlpha = 1 - smooth(105, 150, k);
    // tread
    if (y < ST4.camH) {
      const a = proj4(-half, y, z), b = proj4(half, y, z), c = proj4(half, y, z + run), d = proj4(-half, y, z + run);
      poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]);
      const tc = mix([150, 118, 78], mix([200, 150, 90], [255, 214, 140], glow), haze * 0.9);
      concreteFill(g, 0.8, rgba(tc, 0.75));
    }
    // riser
    if (k > 0) {
      const a = proj4(-half, yPrev, z), b = proj4(half, yPrev, z), c = proj4(half, y, z), d = proj4(-half, y, z);
      poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]);
      const rc = mix([40, 32, 26], mix([170, 120, 70], [250, 196, 120], glow), haze * 0.9);
      concreteFill(g, 0.8, rgba(rc, 0.82));
      g.strokeStyle = `rgba(255,214,150,${0.25 + 0.3 * (1 - haze)})`; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(c.x, c.y); g.stroke();
    }
  }  g.globalAlpha = 1;
}
function scene4(g, lt, dur) {
  const ts = SF / 12 - SCENES[3].start;
  const reveal = easeIO(smooth(0.3, 2.9, lt));
  // the hero on the second step
  const stand = proj4(0, ST4.rise * 3, ST4.z0 + ST4.run * 3.5);
  const hr = 11, hx = 960, gy = stand.y;
  const headY = gy - hr * 3.95, R = hr * 1.2;
  // camera: hold, then the long push into his face
  const pushT = easeIO(smooth(4.2, 9.75, lt));
  const zEnd = 26;
  const z = lerp(1, 1.1, smooth(0, 4.2, lt)) * Math.pow(zEnd / 1.1, pushT);
  const target = { x: hx, y: headY - R * 0.05 };
  const cx = lerp(960, target.x, Math.pow(pushT, 0.6)), cy = lerp(560, target.y, Math.pow(pushT, 0.55));

  // background rendered at falling resolution: a cheap, honest depth of field
  const q = 1 / (1 + 15 * smooth(1.4, 9, z));
  const b = TEX.buf, bg = b.getContext('2d');
  bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalAlpha = 1; bg.globalCompositeOperation = 'source-over';
  bg.clearRect(0, 0, W, H);
  const sky = bg.createLinearGradient(0, 0, 0, H * q);
  sky.addColorStop(0, '#2c2118'); sky.addColorStop(0.5, '#3a2a1c'); sky.addColorStop(1, '#16110d');
  bg.fillStyle = sky; bg.fillRect(0, 0, W * q, H * q);
  const camL = (p, zz) => { bg.setTransform(q, 0, 0, q, 0, 0); bg.translate(W / 2 + WEAVE.x, H / 2 + WEAVE.y); bg.scale(zz, zz); bg.translate(-(960 + (cx - 960) * p), -(540 + (cy - 540) * p)); };
  const pB = 0.32;
  camL(1, z);
  drawStairs4(bg, reveal);
  camL(pB, Math.pow(z, 0.32));
  drawButterflyGlass(bg, 960, 470, 0.6, reveal, T);
  // golden haze over the far stair
  bg.setTransform(q, 0, 0, q, 0, 0);
  bg.globalCompositeOperation = 'lighter';
  const hz = bg.createLinearGradient(0, 0, 0, H);
  hz.addColorStop(0, `rgba(120,80,40,${0.25 * reveal})`); hz.addColorStop(0.6, `rgba(90,58,28,${0.12 * reveal})`); hz.addColorStop(1, 'rgba(0,0,0,0)');
  bg.fillStyle = hz; bg.fillRect(0, 0, W, H);
  bg.globalCompositeOperation = 'source-over';
  screen(g); g.imageSmoothingQuality = 'high';
  if (q < 0.3) {
    // a second, smaller hop softens the stair edges into bokeh-like bands
    const s2 = TEX.small, s2g = s2.getContext('2d'), w2 = Math.max(8, Math.round(W * q * 0.5)), h2 = Math.max(5, Math.round(H * q * 0.5));
    s2g.setTransform(1, 0, 0, 1, 0, 0); s2g.clearRect(0, 0, s2.width, s2.height); s2g.imageSmoothingQuality = 'high';
    s2g.drawImage(b, 0, 0, W * q, H * q, 0, 0, w2, h2);
    g.drawImage(b, 0, 0, W * q, H * q, 0, 0, W, H);
    g.globalAlpha = smooth(0.3, 0.1, q); g.drawImage(s2, 0, 0, w2, h2, 0, 0, W, H); g.globalAlpha = 1;
  } else g.drawImage(b, 0, 0, W * q, H * q, 0, 0, W, H);

  // the caterpillar, in focus
  setCam(g, cx, cy, z);
  const env = { k: 0.88 + 0.1 * reveal, warm: [190, 120, 50], wa: 0.14 + 0.1 * reveal, lx: -0.15, ly: -0.9, rim: 0.6, rimCol: [255, 196, 110], rimA: 0.75 * reveal };
  const blinkAt = [2.4, 8.2];
  let lid = lerp(0.3, 0.14, smooth(1, 4, lt));
  for (const bt of blinkAt) { const d = Math.abs(ts - bt); if (d < 0.17) lid = Math.max(lid, 1 - d / 0.17); }
  const w = hr * 3.9, h = hr * 2.9;
  drawCaterpillarFront(g, hx, gy, hr, {
    pal: HERO, env, hat: true, hatTilt: -0.05, yaw: -0.08 + 0.03 * Math.sin(ts * 0.5), pitch: lerp(0.35, 0.55, smooth(0, 3, lt)),
    lid, reflect: reveal, trail: 1, sway: Math.sin(ts * 0.6) * hr * 0.05,
    suitcase: { x: hx - hr * 3.0, y: gy - h * 1.17, w, h, ang: 0, side: -1 },
  });

  // warm light spilling from above, and motes drifting through it
  screen(g);
  g.save(); g.globalCompositeOperation = 'lighter';
  const top = g.createLinearGradient(0, 0, 0, H * 0.6);
  top.addColorStop(0, `rgba(255,190,100,${0.12 * reveal * smooth(2, 12, z) + 0.02})`); top.addColorStop(1, 'rgba(255,190,100,0)');
  g.fillStyle = top; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const depth = 0.3 + hash(i + 1) * 1.6;
    const x = ((hash(i) * W + Math.sin(T * 0.2 + i) * 30 - (cx - 960) * depth * 0.6) % W + W) % W;
    const y = ((hash(i + 0.5) * H - T * (8 + hash(i + 2) * 14) - (cy - 560) * depth * 0.6) % H + H) % H;
    const size = (1 + hash(i + 7) * 2.2) * (1 + depth * smooth(1, 20, z) * 3);
    const a = reveal * (0.25 + 0.35 * Math.sin(T * 1.5 + i * 2)) / (1 + depth * smooth(2, 20, z) * 1.5);
    if (a <= 0) continue;
    const dg = g.createRadialGradient(x, y, 0, x, y, size);
    dg.addColorStop(0, `rgba(255,214,150,${a})`); dg.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = dg; g.fillRect(x - size, y - size, size * 2, size * 2);
  }
  g.restore();
}

SCENES[0].fn = scene1; SCENES[1].fn = scene2; SCENES[2].fn = scene3; SCENES[3].fn = scene4;

/* ------------------------------------------------------------------ the film stock */
function post(g, t) {
  screen(g);
  // grade: lift blacks a touch, warm the mids
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(196,170,128,0.35)'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  g.drawImage(TEX.vignette, 0, 0);
  const f24 = Math.floor(t * 24);
  // flicker
  g.fillStyle = `rgba(12,10,8,${0.03 + hash2(f24, 1) * 0.05})`; g.fillRect(0, 0, W, H);
  // grain
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.32;
  const gr = TEX.grain[f24 % TEX.grain.length];
  const ox = Math.floor(hash2(f24, 2) * 40), oy = Math.floor(hash2(f24, 3) * 40);
  g.drawImage(gr, -ox, -oy, W + 40, H + 40);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // dust and the odd hair on the gate
  const nd = hash2(f24, 4) < 0.35 ? 1 + Math.floor(hash2(f24, 5) * 3) : 0;
  for (let i = 0; i < nd; i++) {
    const x = hash2(f24, 10 + i) * W, y = hash2(f24, 20 + i) * H, s = 1.5 + hash2(f24, 30 + i) * 4;
    g.fillStyle = hash2(f24, 40 + i) < 0.7 ? 'rgba(20,16,12,0.55)' : 'rgba(240,232,214,0.45)';
    g.beginPath(); g.ellipse(x, y, s, s * (0.5 + hash2(f24, 50 + i)), hash2(f24, 60 + i) * 3, 0, TAU); g.fill();
  }
  if (hash2(f24, 70) < 0.04) {
    const x = hash2(f24, 71) * W;
    g.strokeStyle = 'rgba(235,226,206,0.18)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 0);
    g.bezierCurveTo(x + 10, H * 0.3, x - 8, H * 0.6, x + 4, H); g.stroke();
  }
  if (hash2(Math.floor(t * 24 / 3), 80) < 0.05) {
    g.strokeStyle = 'rgba(30,24,18,0.35)'; g.lineWidth = 1; const x = hash2(f24, 81) * W, y = hash2(f24, 82) * H;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y - 10, x + 40, y + 30, x + 70, y + 20); g.stroke();
  }
}

function render(t) {
  t = clamp(t, 0, DURATION - 1e-4);
  T = t; SF = Math.floor(t * 12);
  const f24 = Math.floor(t * 24);
  WEAVE = { x: (hash2(f24, 91) - 0.5) * 1.6, y: (hash2(f24, 92) - 0.5) * 2.2 };
  let si = SCENES.length - 1;
  for (let i = 0; i < SCENES.length; i++) if (t < SCENES[i].start + SCENES[i].dur) { si = i; break; }
  const sc = SCENES[si], lt = t - sc.start;
  const g = ctx;
  ID(g); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save(); sc.fn(g, lt, sc.dur); g.restore();
  ID(g); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // dips to black between scenes
  const fin = si === 0 ? 1.8 : 0.4, fout = si === SCENES.length - 1 ? 1.4 : 0.35;
  const fade = Math.min(smooth(0, fin, lt), smooth(0, fout, sc.dur - lt));
  if (fade < 1) { g.fillStyle = `rgba(0,0,0,${1 - fade})`; g.fillRect(0, 0, W, H); }
  post(g, t);
  return si;
}

/* ------------------------------------------------------------------ player */
const canvas = document.getElementById('film');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');
buildTextures();

const params = new URLSearchParams(location.search);
window.__film = { render, DURATION, SCENES, post: t => post(ctx, t), scenes: SCENES, DEBUG };
if (params.has('capture')) { render(+params.get('t') || 0); return; }

const ui = {
  root: document.getElementById('ui'), play: document.getElementById('play'), scrub: document.getElementById('scrub'),
  time: document.getElementById('time'), full: document.getElementById('full'), stage: document.getElementById('stage'),
};
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let cur = 0, last = performance.now();
const fmt = s => `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function setPlaying(p) {
  playing = p;
  if (ui.play) { ui.play.setAttribute('aria-label', p ? 'Pause' : 'Play'); ui.play.dataset.state = p ? 'playing' : 'paused'; }
}
setPlaying(playing);
// if this machine can't keep up, drop the backing resolution a notch (never below half)
const costs = [];
function adapt(ms) {
  costs.push(ms); if (costs.length < 40) return;
  const med = costs.slice().sort((a, b) => a - b)[20]; costs.length = 0;
  if (med > 26 && BS > 0.5) { BS -= 0.25; canvas.width = Math.round(W * BS); canvas.height = Math.round(H * BS); }
}
function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (playing) { cur += dt; if (cur >= DURATION) { cur = DURATION; setPlaying(false); } }
  const t0 = performance.now();
  render(cur);
  if (playing && !document.hidden) adapt(performance.now() - t0);
  if (ui.scrub && document.activeElement !== ui.scrub) ui.scrub.value = cur;
  if (ui.time) ui.time.textContent = `${fmt(cur)} / ${fmt(DURATION)}`;
  requestAnimationFrame(tick);
}
if (ui.scrub) {
  ui.scrub.max = DURATION;
  ui.scrub.addEventListener('input', () => { cur = +ui.scrub.value; });
}
if (ui.play) ui.play.addEventListener('click', () => { if (!playing && cur >= DURATION) cur = 0; setPlaying(!playing); });
if (ui.full) ui.full.addEventListener('click', () => {
  const el = ui.stage || document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
});
canvas.addEventListener('click', () => { if (!playing && cur >= DURATION) cur = 0; setPlaying(!playing); });
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT' && e.key !== ' ') return;
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); if (!playing && cur >= DURATION) cur = 0; setPlaying(!playing); }
  else if (e.key === 'ArrowRight') cur = Math.min(DURATION, cur + 2);
  else if (e.key === 'ArrowLeft') cur = Math.max(0, cur - 2);
  else if (e.key >= '1' && e.key <= '4') { cur = SCENES[+e.key - 1].start; }
  else if (e.key === 'f' && ui.full) ui.full.click();
});
let idle;
const wake = () => { if (!ui.root) return; ui.root.classList.remove('hide'); clearTimeout(idle); idle = setTimeout(() => { if (playing) ui.root.classList.add('hide'); }, 2200); };
addEventListener('pointermove', wake); addEventListener('keydown', wake); wake();
requestAnimationFrame(tick);
})();
