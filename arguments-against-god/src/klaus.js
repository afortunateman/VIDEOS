// Klaus-style SVG toolkit: flat 2D shapes lit like 3D forms.
// Each "form" gets a soft colored shadow on the side away from the key
// light and a glowing rim on the edge facing the back light.
const P = n => Math.round(n * 10) / 10;

function smooth(pts, closed = false, t = 1) {
  const n = pts.length;
  const get = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${P(pts[0][0])} ${P(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t];
    d += ` C ${P(c1[0])} ${P(c1[1])} ${P(c2[0])} ${P(c2[1])} ${P(p2[0])} ${P(p2[1])}`;
  }
  return d + (closed ? ' Z' : '');
}

// Tapered tube outline along a polyline (arms, fingers, scarves, steam).
function limb(pts, ws) {
  const Ls = [], Rs = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const w = (Array.isArray(ws) ? ws[i] : ws) / 2;
    Ls.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    Rs.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  // rounded caps
  const s = pts[0], e = pts[pts.length - 1];
  const cap = (p, q, r) => [p[0] + (p[0] - q[0]) * r, p[1] + (p[1] - q[1]) * r];
  const ce = cap(e, pts[pts.length - 2], (Array.isArray(ws) ? ws[ws.length - 1] : ws) * 0.35 / (Math.hypot(e[0] - pts[pts.length - 2][0], e[1] - pts[pts.length - 2][1]) || 1));
  const cs = cap(s, pts[1], (Array.isArray(ws) ? ws[0] : ws) * 0.35 / (Math.hypot(s[0] - pts[1][0], s[1] - pts[1][1]) || 1));
  return smooth([...Ls, ce, ...Rs.reverse(), cs], true);
}

class Scene {
  constructor(o = {}) {
    this.w = 1920; this.h = 1080; this.defs = []; this.n = 0; this.cache = {};
    this.L = o.L || [-1, 0];        // direction toward key light
    this.R = o.R || [1, 0];         // direction toward rim light
    this.sh = o.sh || '#2a1830';    // shadow tint
    this.rim = o.rim || '#ffd8a8';  // rim tint
    this.key = o.key || null;       // key-light tint on the lit side
    this.kd = o.kd || 40; this.keyo = o.keyo ?? .35;
  }
  id(p = 'i') { return `${p}${this.n++}`; }
  blur(sd) {
    sd = Math.max(0.5, Math.round(sd * 2) / 2);
    const k = 'b' + String(sd).replace('.', '_');
    if (!this.cache[k]) {
      this.cache[k] = 1;
      this.defs.push(`<filter id="${k}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    }
    return `url(#${k})`;
  }
  _stops(st) { return st.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join(''); }
  lin(st, x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false) {
    const id = this.id('g');
    this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${this._stops(st)}</linearGradient>`);
    return `url(#${id})`;
  }
  rad(st, cx = .5, cy = .5, r = .5, user = false, fx, fy) {
    const id = this.id('g');
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${this._stops(st)}</radialGradient>`);
    return `url(#${id})`;
  }
  // A lit form. o: fill, L, R, sd (shadow depth), rd (rim depth), sh, rim, sho, rimo, tf, op, extra
  form(d, o = {}) {
    const L = o.L || this.L, R = o.R || this.R;
    const sd = o.sd ?? 18, rd = o.rd ?? 5;
    let s = `<g${o.tf ? ` transform="${o.tf}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}>`;
    s += `<path d="${d}" fill="${o.fill}"/>`;
    if (o.grad) s += `<path d="${d}" fill="${o.grad}"/>`;
    if (sd > 0 && o.sh !== false) {
      const m = this.id('m');
      this.defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${P(L[0] * sd)} ${P(L[1] * sd)})" filter="${this.blur(o.sb ?? sd * 0.4)}"/></mask>`);
      s += `<path d="${d}" fill="${o.sh || this.sh}" opacity="${o.sho ?? 0.5}" mask="url(#${m})"/>`;
    }
    if (rd > 0 && o.rim !== false) {
      const m = this.id('m');
      this.defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${P(-R[0] * rd)} ${P(-R[1] * rd)})" filter="${this.blur(o.rb ?? rd * 0.35)}"/></mask>`);
      s += `<path d="${d}" fill="${o.rim || this.rim}" opacity="${o.rimo ?? 0.9}" mask="url(#${m})"/>`;
    }
    const key = o.key === undefined ? null : (o.key === true ? this.key : o.key);
    if (key) {
      const kd = o.kd ?? this.kd, m = this.id('m');
      this.defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${P(-L[0] * kd)} ${P(-L[1] * kd)})" filter="${this.blur(kd * 0.5)}"/></mask>`);
      s += `<path d="${d}" fill="${key}" opacity="${o.keyo ?? this.keyo}" mask="url(#${m})" style="mix-blend-mode:screen"/>`;
    }
    if (o.extra) s += o.extra;
    return s + '</g>';
  }
  glow(cx, cy, r, color, op = 1, blend = 'screen') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${this.rad([[0, color, 1], [0.35, color, 0.45], [1, color, 0]])}" opacity="${op}" style="mix-blend-mode:${blend}"/>`;
  }
  ellipseGlow(cx, cy, rx, ry, color, op = 1, blend = 'screen') {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${this.rad([[0, color, 1], [0.4, color, 0.4], [1, color, 0]])}" opacity="${op}" style="mix-blend-mode:${blend}"/>`;
  }
  grain(op = 0.07) {
    this.defs.push(`<filter id="grainF" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`);
    return `<rect width="1920" height="1080" filter="url(#grainF)" opacity="${op}" style="mix-blend-mode:overlay"/>`;
  }
  vignette(op = 0.6, color = '#0a0510') {
    return `<rect width="1920" height="1080" fill="${this.rad([[0.55, color, 0], [1, color, 1]], .5, .5, .75)}" opacity="${op}"/>`;
  }
  svg(body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080"><defs>${this.defs.join('')}</defs>${body}</svg>`;
  }
}

// random with seed
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
