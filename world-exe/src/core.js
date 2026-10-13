// WORLD.EXE — core drawing kit.
// Everything here exists to make vector shapes feel hand-made: line boil on twelves,
// brush-pressure ink lines, watercolour fills, offset cel-shading and paper grain.
(function () {
  const WX = (window.WX = window.WX || {});
  WX.W = 1920;
  WX.H = 1080;

  // ------------------------------------------------------------------ palette
  WX.C = {
    ink: '#16233b',
    inkSoft: '#2b3a55',
    deep: '#123a66',
    ocean: '#1f5c94',
    oceanMid: '#2c79b3',
    oceanLight: '#4fa3c7',
    foam: '#fbf3df',
    green: '#3f8f45',
    greenDark: '#2a6a3c',
    greenDeep: '#1f4f33',
    greenLight: '#79b956',
    leaf: '#9ccc5e',
    cream: '#f7e9c9',
    creamLight: '#fff6e2',
    creamDark: '#ead2a2',
    terracotta: '#c75b3e',
    terraDark: '#9c3f2c',
    terraLight: '#e08a5e',
    yellow: '#ffc93c',
    yellowDeep: '#f4a823',
    yellowLight: '#ffe28a',
    sky: '#a9d6dd',
    skyHigh: '#7fbfd0',
    peach: '#f6c99b',
    snow: '#fdfaf2',
    rock: '#8f7f73',
  };

  // ------------------------------------------------------------------ math
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => clamp((x - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);
  const ease = {
    in2: (t) => t * t,
    in3: (t) => t * t * t,
    out2: (t) => 1 - (1 - t) * (1 - t),
    out3: (t) => 1 - Math.pow(1 - t, 3),
    out4: (t) => 1 - Math.pow(1 - t, 4),
    inOut2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inOut3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  };
  // damped spring 0 -> 1 (t in seconds since trigger)
  const spring = (t, freq = 2.4, damp = 6) => (t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(2 * Math.PI * freq * t));
  // damped wobble around 0 (impulse response), for jiggles after impacts
  const wobble = (t, freq = 3, damp = 7) => (t <= 0 ? 0 : Math.exp(-damp * t) * Math.sin(2 * Math.PI * freq * t));
  // time-window helper: 0 before a, 1 after b, eased between
  const win = (t, a, b, e = ease.inOut3) => e(inv(a, b, t));

  Object.assign(WX, { clamp, lerp, inv, smooth, ease, spring, wobble, win });

  // ------------------------------------------------------------------ colour
  const rgbCache = new Map();
  function rgb(hex) {
    let v = rgbCache.get(hex);
    if (!v) {
      if (hex[0] === '#') {
        const h = hex.slice(1);
        v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      } else v = hex.match(/[\d.]+/g).slice(0, 3).map(Number); // rgb()/rgba() strings from mix()
      if (rgbCache.size > 4000) rgbCache.clear();
      rgbCache.set(hex, v);
    }
    return v;
  }
  // mix two hex colours -> css rgb()/rgba()
  function mix(a, b, t, alpha) {
    const p = rgb(a), q = rgb(b);
    t = clamp(t);
    const r = Math.round(p[0] + (q[0] - p[0]) * t), g = Math.round(p[1] + (q[1] - p[1]) * t), bl = Math.round(p[2] + (q[2] - p[2]) * t);
    return alpha === undefined ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
  }
  const rgba = (hex, a) => { const p = rgb(hex); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
  Object.assign(WX, { rgb, mix, rgba });

  // ------------------------------------------------------------------ noise
  function hash2(x, y) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }
  function fbm(x, y, oct = 3) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; }
    return s;
  }
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  Object.assign(WX, { hash2, vnoise, fbm, rng });

  // ------------------------------------------------------------------ frame state
  // Line boil: drawings are re-traced 12 times a second, like pencil animation shot on twos.
  WX.frame = { t: 0, boil: 0 };
  WX.setTime = (t) => { WX.frame.t = t; WX.frame.boil = Math.floor(t * 12 + 1e-6); };

  // ------------------------------------------------------------------ points & paths
  // jitter a polyline along its length (index-keyed so moving shapes boil, not swim)
  function boil(pts, amp, seed = 0, freq = 0.33) {
    if (!amp) return pts;
    const b = WX.frame.boil;
    const res = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      res[i] = [
        p[0] + amp * vnoise(i * freq + seed * 3.7, b * 1.93 + seed),
        p[1] + amp * vnoise(i * freq + seed * 5.1 + 40, b * 1.71 - seed),
      ];
    }
    return res;
  }
  function trace(ctx, pts, closed = true) {
    const n = pts.length;
    if (n < 2) return;
    if (n < 3) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); return; }
    if (closed) {
      const a = pts[n - 1], b = pts[0];
      ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
    }
  }
  function polyLen(pts, closed) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (closed) L += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
    return L;
  }
  // resample to n points evenly spaced by arc length
  function resample(pts, n, closed = false) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const cum = [0];
    for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + Math.hypot(src[i][0] - src[i - 1][0], src[i][1] - src[i - 1][1]));
    const L = cum[cum.length - 1];
    const res = [];
    let j = 0;
    const m = closed ? n : n - 1;
    for (let i = 0; i < n; i++) {
      const d = (L * i) / m;
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const seg = cum[j + 1] - cum[j] || 1;
      const u = (d - cum[j]) / seg;
      res.push([lerp(src[j][0], src[j + 1][0], u), lerp(src[j][1], src[j + 1][1], u)]);
    }
    return res;
  }
  // first fraction f of an open polyline (for drawing lines on)
  function partial(pts, f) {
    if (f >= 1) return pts;
    if (f <= 0) return [pts[0], pts[0]];
    const L = polyLen(pts) * f;
    const res = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= L) {
        const u = (L - acc) / (d || 1);
        res.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
        return res;
      }
      acc += d;
      res.push(pts[i]);
    }
    return res;
  }
  // staggered morph between equal-length point lists: the change travels along the line
  function morph(a, b, t, spread = 0.5, e = ease.inOut3, reverse = false) {
    const n = a.length;
    const res = new Array(n);
    for (let i = 0; i < n; i++) {
      const k = reverse ? 1 - i / (n - 1) : i / (n - 1);
      const u = e(clamp((t - k * spread) / (1 - spread)));
      res[i] = [lerp(a[i][0], b[i][0], u), lerp(a[i][1], b[i][1], u)];
    }
    return res;
  }
  const xform = (pts, fn) => pts.map(fn);
  Object.assign(WX, { boil, trace, polyLen, resample, partial, morph, xform });

  // ------------------------------------------------------------------ ink
  // Brush-pressure ink line: a filled ribbon whose width swells and tapers like a sable brush.
  function ink(ctx, pts, w, color, o = {}) {
    const n = pts.length;
    if (n < 2 || w <= 0) return;
    const closed = !!o.closed;
    const taper = o.taper === undefined ? !closed : o.taper;
    const seed = o.seed || 0;
    const wv = o.wvar === undefined ? 0.45 : o.wvar;
    const b = WX.frame.boil;
    const L = [], R = [];
    let total = 0;
    const cum = [0];
    for (let i = 1; i < n; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(total); }
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
      const c = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
      let tx = c[0] - a[0], ty = c[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const s = total ? cum[i] / total : 0;
      let prof = 1;
      if (taper) prof = Math.pow(Math.sin(Math.PI * clamp(s * 0.94 + 0.03)), 0.55);
      if (o.taperEnd) prof *= Math.pow(clamp((1 - s) * 6), 0.6);
      const press = 1 + wv * vnoise(i * 0.11 + seed, b * 0.77 + seed * 3);
      const hw = (w * prof * press) / 2;
      L.push([p[0] - ty * hw, p[1] + tx * hw]);
      R.push([p[0] + ty * hw, p[1] - tx * hw]);
    }
    ctx.beginPath();
    if (closed) {
      trace(ctx, L, true);
      trace(ctx, R.slice().reverse(), true);
      ctx.fillStyle = color;
      ctx.fill('evenodd');
    } else {
      trace(ctx, L.concat(R.reverse()), true);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  // simple round stroke (used where ribbons would be overkill)
  function stroke(ctx, pts, w, color, closed = false, cap = 'round') {
    ctx.beginPath();
    trace(ctx, pts, closed);
    ctx.lineWidth = w;
    ctx.lineCap = cap;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  Object.assign(WX, { ink, stroke });

  // ------------------------------------------------------------------ textures
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  WX.makeCanvas = makeCanvas;

  function buildTextures() {
    // watercolour: white base with soft blotches, pigment granulation and dry-brush streaks
    const S = 512;
    const wc = makeCanvas(S, S), g = wc.getContext('2d');
    const id = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      // tileable by sampling a torus-ish blend
      const fx = x / S, fy = y / S;
      const n1 = fbm(Math.cos(fx * 6.283) * 1.6 + 4, Math.sin(fx * 6.283) * 1.6 + fy * 0, 4);
      const n2 = fbm(fy * 6 + 11, Math.cos(fy * 6.283) * 1.7 + Math.sin(fx * 6.283) * 0.5, 4);
      const blot = 0.5 + 0.5 * (n1 * 0.6 + n2 * 0.6);
      const gran = hash2(x * 7 + 3, y * 13 + 1);
      const streak = 0.5 + 0.5 * vnoise(x * 0.02 + y * 0.004, y * 0.35);
      let v = 1 - 0.32 * blot * blot - 0.1 * gran * gran - 0.07 * streak;
      v = clamp(v, 0, 1) * 255;
      const i = (y * S + x) * 4;
      id.data[i] = v; id.data[i + 1] = v * 0.99; id.data[i + 2] = v * 0.97; id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    WX.texWater = wc;

    // pencil hatching for cel shadows
    const hc = makeCanvas(256, 256), h = hc.getContext('2d');
    const r = rng(7);
    h.lineCap = 'round';
    for (let i = -20; i < 40; i++) {
      const x0 = i * 9 + r() * 4;
      h.strokeStyle = `rgba(22,35,59,${0.35 + r() * 0.4})`;
      h.lineWidth = 1 + r() * 1.4;
      h.beginPath();
      h.moveTo(x0, -10);
      h.quadraticCurveTo(x0 + 60 + r() * 10, 120, x0 + 140 + r() * 10, 270);
      h.stroke();
    }
    WX.texHatch = hc;

    // paper grain for the whole frame (multiply)
    const P = makeCanvas(WX.W / 2, WX.H / 2), pg = P.getContext('2d');
    const pd = pg.createImageData(P.width, P.height);
    for (let y = 0; y < P.height; y++) for (let x = 0; x < P.width; x++) {
      const fib = vnoise(x * 0.9, y * 0.06) * 0.5 + vnoise(x * 0.07, y * 0.8) * 0.5;
      const tooth = hash2(x, y);
      const cloud = fbm(x * 0.012, y * 0.012, 3);
      let v = 1 - 0.06 * tooth - 0.035 * (fib * 0.5 + 0.5) - 0.05 * (cloud * 0.5 + 0.5);
      v *= 255;
      const i = (y * P.width + x) * 4;
      pd.data[i] = v; pd.data[i + 1] = v * 0.985; pd.data[i + 2] = v * 0.955; pd.data[i + 3] = 255;
    }
    pg.putImageData(pd, 0, 0);
    WX.texPaper = P;
  }
  WX.buildTextures = buildTextures;

  // pattern cache per context
  const patCache = new WeakMap();
  function pattern(ctx, img) {
    let m = patCache.get(ctx);
    if (!m) { m = new Map(); patCache.set(ctx, m); }
    if (!m.has(img)) m.set(img, ctx.createPattern(img, 'repeat'));
    return m.get(img);
  }

  // ------------------------------------------------------------------ painting
  // Fill a shape with watercolour body: flat colour + pigment texture (+ optional cel shadow/highlight).
  // pathFn(ctx) must add the shape's sub-paths to the current path.
  function paint(ctx, pathFn, color, o = {}) {
    ctx.save();
    ctx.beginPath();
    pathFn(ctx);
    ctx.fillStyle = color;
    ctx.fill(o.rule || 'nonzero');
    if (o.tex !== 0) {
      ctx.clip(o.rule || 'nonzero');
      const pat = pattern(ctx, WX.texWater);
      const ox = (o.texSeed || 0) * 137.1, oy = (o.texSeed || 0) * 91.7;
      const sc = o.texScale || 1;
      pat.setTransform(new DOMMatrix([sc, 0, 0, sc, ox, oy]));
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = o.tex === undefined ? 0.55 : o.tex;
      ctx.fillStyle = pat;
      ctx.fillRect(-4000, -4000, 8000, 8000);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (o.shade) celShade(ctx, pathFn, o.shade, false);
      if (o.light) celShade(ctx, pathFn, o.light, false);
    }
    ctx.restore();
  }
  // Cel shading by self-offset: the band of the shape NOT covered by itself shifted by (dx,dy).
  // s = {dx, dy, color, alpha, hatch}
  function celShade(ctx, pathFn, s, doClip = true) {
    ctx.save();
    if (doClip) { ctx.beginPath(); pathFn(ctx); ctx.clip(); }
    ctx.beginPath();
    ctx.rect(-5000, -5000, 10000, 10000);
    ctx.translate(s.dx, s.dy);
    pathFn(ctx);
    ctx.translate(-s.dx, -s.dy);
    ctx.globalAlpha = s.alpha === undefined ? 1 : s.alpha;
    ctx.globalCompositeOperation = s.mode || 'source-over';
    ctx.fillStyle = s.color;
    ctx.fill('evenodd');
    if (s.hatch) {
      ctx.clip('evenodd');
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = s.hatch;
      const pat = pattern(ctx, WX.texHatch);
      pat.setTransform(new DOMMatrix([1, 0, 0, 1, (s.hx || 0) + WX.frame.boil * 3, s.hy || 0]));
      ctx.fillStyle = pat;
      ctx.fillRect(-5000, -5000, 10000, 10000);
    }
    ctx.restore();
  }
  Object.assign(WX, { paint, celShade, pattern });

  // ------------------------------------------------------------------ small shared drawings
  // A puffy storybook cloud made of overlapping lobes. squash: >1 wide/flat.
  // cumulus silhouette: the outer boundary of a few overlapping lobes, sitting on a flat base
  const CLOUD_LOBES = [[-0.6, 0.08, 0.34], [-0.22, -0.16, 0.48], [0.28, -0.22, 0.45], [0.64, 0.06, 0.32], [0.02, 0.1, 0.42]];
  WX.cloud = function (ctx, x, y, s, o = {}) {
    if (s < 1) return;
    const sq = o.squash || 1;
    const seed = o.seed || 0;
    const b = WX.frame.boil;
    const flip = seed % 2 ? -1 : 1;
    const N = 80, base = 0.27;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      let best = 0.2;
      for (const L of CLOUD_LOBES) {
        const cx = L[0] * flip, cy = L[1] - 0.05;
        const bdot = dx * cx + dy * cy;
        const disc = bdot * bdot - (cx * cx + cy * cy) + L[2] * L[2];
        if (disc >= 0) best = Math.max(best, bdot + Math.sqrt(disc));
      }
      let px = dx * best, py = dy * best + 0.05;
      if (py > base) py = base + (py - base) * 0.15;
      const wob = 1 + 0.02 * vnoise(i * 0.35 + seed, b * 1.3);
      pts.push([x + px * s * 1.05 * sq * wob, y + (py * s * wob) / sq]);
    }
    const shape = (c) => trace(c, pts, true);
    const lw = (o.line === undefined ? 3.2 : o.line) * Math.max(0.5, s / 60);
    ctx.save();
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    paint(ctx, shape, o.color || WX.C.creamLight, {
      tex: 0.28, texSeed: seed,
      shade: { dx: -s * 0.06, dy: -s * 0.2, color: o.shadeColor || '#ecd3b8', alpha: 1 },
      light: { dx: s * 0.05, dy: s * 0.1, color: '#ffffff', alpha: 0.65 },
    });
    // inner lobe lines where one puff overlaps the next give it volume
    if (s > 18) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(WX.C.inkSoft, 0.6);
      ctx.lineWidth = lw * 0.6;
      for (const [li, a0, a1] of [[2, 0.96, 1.22], [3, 0.92, 1.16]]) {
        const L = CLOUD_LOBES[li];
        const cx = x + L[0] * flip * s * 1.05 * sq, cy = y + L[1] * s / sq;
        const r = L[2] * s * 1.02;
        ctx.beginPath();
        if (flip > 0) ctx.arc(cx, cy, r, Math.PI * a0, Math.PI * a1);
        else ctx.arc(cx, cy, r, Math.PI * (3 - a1), Math.PI * (3 - a0));
        ctx.stroke();
      }
    }
    if (lw > 0) ink(ctx, pts, lw, o.inkColor || WX.C.inkSoft, { closed: true, seed: seed + 3, wvar: 0.5 });
    ctx.restore();
  };

  // A storybook tree. kind: 'round' | 'pine' | 'tall'. sway in radians; pop = scale 0..1+
  WX.tree = function (ctx, x, y, s, o = {}) {
    if (s <= 0.2) return;
    const kind = o.kind || 'round';
    const sway = o.sway || 0;
    const seed = o.seed || 0;
    const C = WX.C;
    const lw = Math.max(1.2, s * 0.07);
    ctx.save();
    ctx.translate(x, y);
    const sy = o.sy || 1, sx = o.sx || 1;
    ctx.scale(sx, sy);
    // trunk bends (overlapping action: tip lags behind)
    const tipX = Math.sin(sway) * s * 0.9, tipY = -s * (kind === 'tall' ? 1.05 : 0.8);
    const midX = tipX * 0.35;
    ctx.beginPath();
    ctx.moveTo(-s * 0.07, 0);
    ctx.quadraticCurveTo(midX - s * 0.05, tipY * 0.5, tipX - s * 0.03, tipY);
    ctx.lineTo(tipX + s * 0.03, tipY);
    ctx.quadraticCurveTo(midX + s * 0.05, tipY * 0.5, s * 0.07, 0);
    ctx.closePath();
    ctx.fillStyle = '#7a4a32';
    ctx.fill();
    ctx.lineWidth = lw * 0.8; ctx.strokeStyle = C.ink; ctx.stroke();
    const cx = tipX * 1.05, cy = tipY;
    const lag = Math.sin(sway * 1.25) * s * 0.12; // canopy overshoot
    let shape;
    if (kind === 'pine') {
      const P = [];
      const tiers = [[0.58, 0.28], [0.46, -0.1], [0.32, -0.46]]; // half-width, tier base y (in s)
      const top = cy - s * 0.92;
      const L = [], R = [];
      tiers.forEach((tr, k) => {
        const ww = s * tr[0], yy = cy + s * tr[1];
        const tx = cx + lag * (k + 1) * 0.6;
        L.push([tx - ww, yy], [tx - ww * 0.42, yy - s * 0.12]);
        R.push([tx + ww, yy], [tx + ww * 0.42, yy - s * 0.12]);
      });
      L.push([cx + lag * 2.2, top]);
      R.reverse();
      P.push(...L, ...R);
      shape = (c) => {
        c.moveTo(P[0][0], P[0][1]);
        for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]);
        c.closePath();
      };
    } else {
      const rr = kind === 'tall' ? s * 0.36 : s * 0.5;
      const ry = kind === 'tall' ? s * 0.62 : s * 0.46;
      const b = WX.frame.boil;
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const bump = 1 + 0.09 * Math.sin(a * 5 + seed) + 0.04 * vnoise(i + seed, b * 1.4);
        pts.push([cx + lag + Math.cos(a) * rr * bump, cy - ry * 0.55 + Math.sin(a) * ry * bump]);
      }
      shape = (c) => trace(c, pts, true);
    }
    ctx.beginPath(); shape(ctx);
    ctx.lineWidth = lw * 2; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    paint(ctx, shape, o.color || (kind === 'pine' ? C.greenDark : C.green), {
      tex: 0.5, texSeed: seed,
      shade: { dx: -s * 0.12, dy: -s * 0.14, color: kind === 'pine' ? C.greenDeep : C.greenDark, alpha: 1 },
      light: { dx: s * 0.1, dy: s * 0.12, color: C.leaf, alpha: 0.85 },
    });
    ctx.restore();
  };
})();
