// Drawing toolkit for the Roelf Vos film: SVG helpers, a seeded PRNG, the single-stroke gold
// script, and the reusable illustration pieces (clouds, mountains, trees, chalets, people, snow).
// Everything is built once at load time; motion lives on the one paused GSAP timeline.
(function () {
  const RV = (window.RV = window.RV || {});
  const NS = "http://www.w3.org/2000/svg";
  const W = (RV.W = 1920);
  const H = (RV.H = 1080);

  // ------------------------------------------------------------------ DOM helpers
  RV.el = function (tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  RV.g = (parent, attrs) => RV.el("g", attrs, parent);
  RV.path = (parent, d, fill, attrs) => RV.el("path", Object.assign({ d, fill: fill || "none" }, attrs), parent);
  RV.poly = (parent, pts, fill, attrs) =>
    RV.el("polygon", Object.assign({ points: pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "), fill }, attrs), parent);
  RV.rect = (parent, x, y, w, h, fill, attrs) => RV.el("rect", Object.assign({ x, y, width: w, height: h, fill }, attrs), parent);
  RV.circle = (parent, cx, cy, r, fill, attrs) => RV.el("circle", Object.assign({ cx, cy, r, fill }, attrs), parent);
  RV.ellipse = (parent, cx, cy, rx, ry, fill, attrs) => RV.el("ellipse", Object.assign({ cx, cy, rx, ry, fill }, attrs), parent);
  RV.text = (parent, x, y, str, attrs) => {
    const t = RV.el("text", Object.assign({ x, y }, attrs), parent);
    t.textContent = str;
    return t;
  };
  RV.htmlEl = function (tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };

  let gradId = 0;
  RV.linear = function (defs, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, attrs) {
    const id = "lg" + ++gradId;
    const g = RV.el("linearGradient", Object.assign({ id, x1, y1, x2, y2 }, attrs), defs);
    stops.forEach(([o, c, a]) => RV.el("stop", { offset: o, "stop-color": c, "stop-opacity": a === undefined ? 1 : a }, g));
    return "url(#" + id + ")";
  };
  RV.radial = function (defs, stops, cx = 0.5, cy = 0.5, r = 0.5, attrs) {
    const id = "rg" + ++gradId;
    const g = RV.el("radialGradient", Object.assign({ id, cx, cy, r }, attrs), defs);
    stops.forEach(([o, c, a]) => RV.el("stop", { offset: o, "stop-color": c, "stop-opacity": a === undefined ? 1 : a }, g));
    return "url(#" + id + ")";
  };
  RV.uid = (p) => p + ++gradId;

  // ------------------------------------------------------------------ numbers & colour
  RV.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  RV.lerp = (a, b, t) => a + (b - a) * t;
  const hex = (c) => {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  RV.mix = function (c1, c2, t) {
    const a = hex(c1), b = hex(c2);
    return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  };
  RV.shade = (c, t) => (t >= 0 ? RV.mix(c, "#ffffff", t) : RV.mix(c, "#000000", -t));
  RV.ptsToD = function (pts, close) {
    return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + (close ? " Z" : "");
  };
  // Catmull-Rom through points -> smooth cubic path
  RV.smoothD = function (pts, close, tension = 0.5) {
    const n = pts.length;
    if (n < 3) return RV.ptsToD(pts, close);
    const P = (i) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    const last = close ? n : n - 1;
    const k = tension / 3;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + (close ? " Z" : "");
  };
  RV.polyLen = function (pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  };

  // ------------------------------------------------------------------ stage per scene
  // Each scene <section class="clip"> gets: .frame (animatable wrapper) > svg > cam (camera group).
  RV.stage = function (id, bg) {
    const section = document.getElementById("sc-" + id);
    const frame = RV.htmlEl("div", "frame", section);
    if (bg) frame.style.background = bg;
    const svg = RV.el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "art" }, frame);
    const defs = RV.el("defs", {}, svg);
    const cam = RV.g(svg, { class: "cam" });
    const hud = RV.htmlEl("div", "hud", frame);
    // unclipped overlay above the frame, for transition edges (cloud bands, light sweeps)
    const fxSvg = RV.el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "art fx" }, section);
    const fxDefs = RV.el("defs", {}, fxSvg);
    const fx = RV.g(fxSvg);
    return { id, section, frame, svg, defs, cam, hud, fx, fxDefs, win: RV.sceneWindow(id) };
  };

  // ------------------------------------------------------------------ gold single-stroke script
  RV.scriptLayout = function (text, size, tracking = 0) {
    const F = window.SCRIPT_FONT;
    const sc = size / 1000;
    let x = 0;
    const strokes = [];
    for (const ch of text) {
      const g = F.glyphs[ch] || [F.adv, []];
      for (const flat of g[1]) {
        const pts = [];
        for (let i = 0; i < flat.length; i += 2) pts.push([(x + flat[i]) * sc, -flat[i + 1] * sc]);
        strokes.push(pts);
      }
      x += g[0] + tracking;
    }
    return { strokes, width: (x - tracking) * sc };
  };
  // Returns {g, paths:[{el,len}], width}. align: "left" | "center" | "right"
  RV.script = function (parent, text, opts) {
    const o = Object.assign({ x: 0, y: 0, size: 160, color: "#e9c46a", width: 3, align: "left", tracking: 0, glow: null }, opts);
    const L = RV.scriptLayout(text, o.size, o.tracking);
    const dx = o.align === "center" ? -L.width / 2 : o.align === "right" ? -L.width : 0;
    const g = RV.g(parent, { transform: `translate(${(o.x + dx).toFixed(1)} ${o.y})`, fill: "none", stroke: o.color, "stroke-width": o.width, "stroke-linecap": "round", "stroke-linejoin": "round" });
    if (o.glow) g.setAttribute("filter", o.glow);
    // the hidden offset parks the dash a little before the path start, so round caps leave no dot behind
    const pad = o.width * 2 + 2;
    const paths = L.strokes.map((pts) => {
      const len = Math.max(1, RV.polyLen(pts) * 1.06 + 2);
      const el = RV.path(g, RV.smoothD(pts, false), "none", { "stroke-dasharray": `${len.toFixed(1)} ${(len + pad * 2 + 10).toFixed(1)}`, "stroke-dashoffset": (len + pad).toFixed(1) });
      return { el, len, hide: len + pad };
    });
    return { g, paths, width: L.width };
  };
  // Draw strokes in order, as if written by one hand: each stroke's time is proportional to its length.
  RV.drawOn = function (tl, item, t, dur, ease = "power1.inOut") {
    const total = item.paths.reduce((s, p) => s + p.len, 0);
    let acc = 0;
    item.paths.forEach((p) => {
      const st = t + (acc / total) * dur;
      const d = Math.max(0.02, (p.len / total) * dur);
      tl.fromTo(p.el, { attr: { "stroke-dashoffset": p.hide } }, { attr: { "stroke-dashoffset": 0 }, duration: d, ease: "none", immediateRender: true }, st);
      acc += p.len;
    });
  };
  // Stroke-draw an arbitrary path element (len supplied or estimated)
  RV.drawPath = function (tl, el, len, t, dur, ease = "power2.inOut") {
    const pad = 24;
    el.setAttribute("stroke-dasharray", `${len} ${len + pad * 2 + 10}`);
    tl.fromTo(el, { attr: { "stroke-dashoffset": len + pad } }, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease, immediateRender: true }, t);
  };

  // ------------------------------------------------------------------ scenery pieces
  // Flat cloud: lumpy top, flat-ish bottom, a shade band underneath, and a highlight lip.
  RV.cloud = function (parent, x, y, w, opts) {
    const o = Object.assign({ fill: "#fff6ea", shade: "#f2d3b4", light: null, seed: 1, lumps: 4, h: w * 0.32, flat: true }, opts);
    const r = RV.rng(o.seed);
    const g = RV.g(parent, { transform: `translate(${x} ${y})` });
    const hh = o.h;
    const pts = [];
    const n = o.lumps;
    pts.push([-w / 2, 0]);
    for (let i = 0; i < n; i++) {
      const cx = -w / 2 + ((i + 0.5) / n) * w;
      const peak = hh * (0.55 + 0.45 * Math.sin(Math.PI * ((i + 0.5) / n))) * (0.75 + 0.35 * r());
      pts.push([cx - w / n * 0.42, -peak * 0.6]);
      pts.push([cx, -peak]);
      pts.push([cx + w / n * 0.42, -peak * 0.62]);
    }
    pts.push([w / 2, 0]);
    const top = RV.smoothD(pts, false, 0.6);
    const base = o.flat ? ` L${(w / 2).toFixed(1)} 0 Q ${(w / 2).toFixed(1)} ${(hh * 0.12).toFixed(1)} ${(w / 2 - hh * 0.2).toFixed(1)} ${(hh * 0.12).toFixed(1)} L ${(-w / 2 + hh * 0.2).toFixed(1)} ${(hh * 0.12).toFixed(1)} Q ${(-w / 2).toFixed(1)} ${(hh * 0.12).toFixed(1)} ${(-w / 2).toFixed(1)} 0 Z` : " Z";
    RV.path(g, top + base, o.fill);
    RV.path(g, `M${-w / 2 + hh * 0.15} ${hh * 0.02} L ${w / 2 - hh * 0.15} ${hh * 0.02} L ${w / 2 - hh * 0.25} ${hh * 0.12} L ${-w / 2 + hh * 0.25} ${hh * 0.12} Z`, o.shade);
    if (o.light) {
      const lp = pts.slice(2, pts.length - 2).map((p) => [p[0] * 0.92, p[1] * 0.92 + hh * 0.05]);
      RV.path(g, RV.smoothD(lp, false), "none", { stroke: o.light, "stroke-width": hh * 0.08, "stroke-linecap": "round", opacity: 0.8 });
    }
    return g;
  };

  // Long wispy cloud streak (reference: sunset streaks)
  RV.streak = function (parent, x, y, w, h, fill, opacity = 1) {
    const d = `M${x} ${y} C ${x + w * 0.25} ${y - h} ${x + w * 0.6} ${y - h * 1.1} ${x + w} ${y - h * 0.2} C ${x + w * 0.7} ${y + h * 0.15} ${x + w * 0.3} ${y + h * 0.25} ${x} ${y} Z`;
    return RV.path(parent, d, fill, { opacity });
  };

  // Faceted mountain with a lit face, a shadow face and an optional jagged snow cap.
  RV.mountain = function (parent, opts) {
    const o = Object.assign({ x: 960, peak: 300, base: 800, w: 900, light: "#9a97cf", dark: "#6b6a9e", mid: null, snow: true, snowLight: "#ffffff", snowDark: "#c9cbe6", seed: 3, cap: 0.32, skew: 0 }, opts);
    const r = RV.rng(o.seed);
    const g = RV.g(parent);
    const px = o.x + o.skew, py = o.peak;
    const L = [o.x - o.w / 2, o.base], R = [o.x + o.w / 2, o.base];
    const sl = [px - o.w * 0.22, py + (o.base - py) * 0.45 + r() * 30];
    const sr = [px + o.w * 0.2, py + (o.base - py) * 0.38 + r() * 30];
    RV.poly(g, [L, sl, [px, py], sr, R], o.dark);
    const ridge = [px + (r() - 0.5) * 30, o.base];
    RV.poly(g, [L, sl, [px, py], [px + o.w * 0.04, py + (o.base - py) * 0.5], ridge], o.light);
    if (o.mid) RV.poly(g, [[px, py], sr, [px + o.w * 0.12, py + (o.base - py) * 0.62], [px + o.w * 0.04, py + (o.base - py) * 0.5]], o.mid);
    if (o.snow) {
      const cy = py + (o.base - py) * o.cap;
      const lx = RV.lerp(px, sl[0], ((cy - py) / (sl[1] - py)) * 0.95);
      const rx = RV.lerp(px, sr[0], ((cy - py) / (sr[1] - py)) * 0.95);
      const teeth = [];
      const n = 5;
      for (let i = 0; i <= n; i++) {
        const xx = RV.lerp(lx, rx, i / n);
        teeth.push([xx, cy + (i % 2 ? -(o.base - py) * 0.06 : (o.base - py) * 0.05) + (r() - 0.5) * 14]);
      }
      RV.poly(g, [[px, py], ...teeth.reverse()], o.snowDark);
      const midIdx = Math.floor(teeth.length / 2);
      const lt = teeth.slice(midIdx);
      RV.poly(g, [[px, py], [px + o.w * 0.03, py + (o.base - py) * 0.2], ...lt], o.snowLight);
    }
    return g;
  };

  // Rolling hill band from a list of [x,y] crest points down to `bottom`.
  RV.hill = function (parent, crest, bottom, fill, attrs) {
    const d = RV.smoothD(crest, false, 0.55) + ` L ${crest[crest.length - 1][0]} ${bottom} L ${crest[0][0]} ${bottom} Z`;
    return RV.path(parent, d, fill, attrs);
  };

  RV.pine = function (parent, x, y, h, fill, dark, snow) {
    const g = RV.g(parent, { transform: `translate(${x} ${y})` });
    const w = h * 0.42;
    RV.rect(g, -h * 0.03, -h * 0.12, h * 0.06, h * 0.14, "#4a2f27");
    for (let i = 0; i < 3; i++) {
      const top = -h * (1 - i * 0.22);
      const bw = w * (0.55 + i * 0.25);
      const by = -h * (0.42 - i * 0.14);
      RV.poly(g, [[0, top], [bw / 2, by], [-bw / 2, by]], fill);
      RV.poly(g, [[0, top], [bw / 2, by], [bw * 0.08, by]], dark);
      if (snow) RV.poly(g, [[0, top], [bw * 0.18, top + (by - top) * 0.35], [-bw * 0.18, top + (by - top) * 0.35]], snow, { class: "snowcap" });
    }
    return g;
  };

  // Tasmanian eucalypt: pale trunk, a few rounded foliage clumps.
  RV.gum = function (parent, x, y, h, fill, dark, seed = 1) {
    const r = RV.rng(seed);
    const g = RV.g(parent, { transform: `translate(${x} ${y})` });
    RV.path(g, `M ${-h * 0.03} 0 C ${-h * 0.02} ${-h * 0.3} ${-h * 0.06} ${-h * 0.45} ${-h * 0.12} ${-h * 0.6} L ${-h * 0.09} ${-h * 0.61} C ${-h * 0.02} ${-h * 0.48} ${h * 0.01} ${-h * 0.4} ${h * 0.02} ${-h * 0.33} C ${h * 0.05} ${-h * 0.45} ${h * 0.1} ${-h * 0.52} ${h * 0.16} ${-h * 0.62} L ${h * 0.18} ${-h * 0.6} C ${h * 0.1} ${-h * 0.45} ${h * 0.04} ${-h * 0.3} ${h * 0.04} 0 Z`, "#e8dcc8");
    const clumps = [[-0.14, -0.66, 0.2], [0.17, -0.68, 0.19], [0.02, -0.86, 0.22], [-0.24, -0.82, 0.14], [0.27, -0.84, 0.13]];
    clumps.forEach(([cx, cy, rr]) => {
      const rx = rr * h * (0.9 + r() * 0.3), ry = rr * h * 0.62;
      RV.ellipse(g, cx * h, cy * h, rx, ry, fill);
      RV.ellipse(g, cx * h + rx * 0.18, cy * h + ry * 0.25, rx * 0.8, ry * 0.65, dark);
    });
    return g;
  };

  RV.roundTree = function (parent, x, y, h, fill, dark) {
    const g = RV.g(parent, { transform: `translate(${x} ${y})` });
    RV.rect(g, -h * 0.04, -h * 0.4, h * 0.08, h * 0.4, "#5a3b2e");
    RV.ellipse(g, 0, -h * 0.66, h * 0.32, h * 0.36, fill);
    RV.path(g, `M ${h * 0.02} ${-h * 1.0} A ${h * 0.32} ${h * 0.36} 0 0 1 ${h * 0.02} ${-h * 0.3} A ${h * 0.22} ${h * 0.34} 0 0 0 ${h * 0.02} ${-h * 1.0} Z`, dark);
    return g;
  };

  // Swiss chalet, drawn with its base centre at (0,0) so it can rise from the ground.
  // Returns {g, roof, snowRoof, windows:[...]}
  RV.chalet = function (parent, x, y, opts) {
    const o = Object.assign({ w: 220, h: 170, roof: "#7a2e1f", roofDark: "#5a1f14", wall: "#f3e9d6", wallDark: "#d9c8ab", timber: "#6b3f26", timberDark: "#4e2c1a", shutter: "#2f6b46", flowers: "#d7263d", balcony: true, storeys: 2, sign: null, night: false, glow: "#ffcf6e", snow: false, scale: 1, pane: "#3a4152", mullion: "#e8e2d4" }, opts);
    const g = RV.g(parent, { transform: `translate(${x} ${y}) scale(${o.scale})` });
    const inner = RV.g(g);
    const w = o.w, h = o.h;
    const lowH = o.storeys === 2 ? h * 0.48 : h * 0.8;
    // lower floor (plaster)
    RV.rect(inner, -w / 2, -lowH, w, lowH, o.wall);
    RV.rect(inner, w * 0.18, -lowH, w * 0.32, lowH, o.wallDark);
    // upper floor (timber)
    if (o.storeys === 2) {
      RV.rect(inner, -w / 2, -h, w, h - lowH, o.timber);
      RV.rect(inner, w * 0.18, -h, w * 0.32, h - lowH, o.timberDark);
      for (let i = 1; i < 6; i++) RV.rect(inner, -w / 2 + (w / 6) * i - 1, -h, 2, h - lowH, o.timberDark, { opacity: 0.5 });
    }
    // roof: steep gable with deep eaves
    const rh = w * 0.42;
    const ov = w * 0.14;
    const roofPts = [[-w / 2 - ov, -h + 6], [0, -h - rh], [w / 2 + ov, -h + 6]];
    const gable = RV.poly(inner, [[-w / 2, -h], [0, -h - rh + 14], [w / 2, -h]], o.storeys === 2 ? o.timber : o.wall);
    RV.poly(inner, [[0, -h - rh + 14], [w / 2, -h], [w * 0.18, -h]], o.storeys === 2 ? o.timberDark : o.wallDark, { opacity: 0.6 });
    const roof = RV.g(inner);
    RV.path(roof, `M ${roofPts[0][0]} ${roofPts[0][1]} L ${roofPts[1][0]} ${roofPts[1][1]} L ${roofPts[2][0]} ${roofPts[2][1]} L ${roofPts[2][0] - 10} ${roofPts[2][1] + 12} L 0 ${-h - rh + 22} L ${roofPts[0][0] + 10} ${roofPts[0][1] + 12} Z`, o.roof);
    RV.path(roof, `M 0 ${-h - rh} L ${roofPts[2][0]} ${roofPts[2][1]} L ${roofPts[2][0] - 10} ${roofPts[2][1] + 12} L 0 ${-h - rh + 22} Z`, o.roofDark);
    // gable window + cross beams
    RV.rect(inner, -w * 0.09, -h - rh * 0.45, w * 0.18, rh * 0.28, o.night ? o.glow : o.pane, { rx: 2 });
    // snow on roof (hidden until the snow scene grows it)
    let snowRoof = null;
    if (o.snow) {
      snowRoof = RV.path(inner, `M ${roofPts[0][0] - 2} ${roofPts[0][1] - 2} L 0 ${-h - rh - 6} L ${roofPts[2][0] + 2} ${roofPts[2][1] - 2} L ${roofPts[2][0] - 6} ${roofPts[2][1] + 6} Q ${w * 0.3} ${-h - rh * 0.25} ${w * 0.12} ${-h - rh * 0.55} Q 0 ${-h - rh * 0.7} ${-w * 0.14} ${-h - rh * 0.52} Q ${-w * 0.32} ${-h - rh * 0.22} ${roofPts[0][0] + 6} ${roofPts[0][1] + 6} Z`, "#f7f9ff", { class: "snowroof" });
    }
    // windows
    const windows = [];
    const win = (cx, cy, ww, wh) => {
      RV.rect(inner, cx - ww / 2 - ww * 0.55, cy - wh / 2, ww * 0.5, wh, o.shutter);
      RV.rect(inner, cx + ww / 2 + ww * 0.05, cy - wh / 2, ww * 0.5, wh, o.shutter);
      const pane = RV.rect(inner, cx - ww / 2, cy - wh / 2, ww, wh, o.night ? o.glow : o.pane);
      windows.push(pane);
      RV.rect(inner, cx - 1.5, cy - wh / 2, 3, wh, o.night ? "#e09a3c" : o.mullion, { opacity: 0.8 });
      RV.rect(inner, cx - ww / 2 - 3, cy + wh / 2, ww + 6, 5, o.wallDark);
    };
    const wy1 = -lowH * 0.52;
    win(-w * 0.25, wy1, w * 0.13, lowH * 0.42);
    win(w * 0.27, wy1, w * 0.13, lowH * 0.42);
    // door
    RV.rect(inner, -w * 0.06, -lowH * 0.72, w * 0.13, lowH * 0.72, o.timberDark, { rx: 3 });
    if (o.storeys === 2) {
      const wy2 = -lowH - (h - lowH) * 0.5;
      win(-w * 0.22, wy2, w * 0.12, (h - lowH) * 0.5);
      win(w * 0.22, wy2, w * 0.12, (h - lowH) * 0.5);
      if (o.balcony) {
        const by = -lowH - 2;
        RV.rect(inner, -w / 2 - 8, by - (h - lowH) * 0.36, w + 16, (h - lowH) * 0.36, o.timber);
        for (let i = 0; i < 14; i++) RV.rect(inner, -w / 2 - 4 + i * ((w + 8) / 14), by - (h - lowH) * 0.3, (w + 8) / 30, (h - lowH) * 0.24, o.timberDark);
        RV.rect(inner, -w / 2 - 10, by - (h - lowH) * 0.38, w + 20, 5, o.timberDark);
        // flower box
        for (let i = 0; i < 9; i++) RV.circle(inner, -w / 2 + 6 + i * (w / 8.5), by - (h - lowH) * 0.4, w * 0.025, i % 2 ? o.flowers : RV.shade(o.flowers, 0.2));
      }
    }
    if (o.sign) {
      RV.rect(inner, -w * 0.3, -lowH - 26, w * 0.6, 24, "#2b2420", { rx: 4 });
      RV.text(inner, 0, -lowH - 9, o.sign, { "text-anchor": "middle", "font-family": "Josefin Sans", "font-size": 15, "letter-spacing": 3, fill: "#f3d27a", "font-weight": 600 });
    }
    return { g, inner, roof, snowRoof, windows, h: h + rh };
  };

  RV.chapel = function (parent, x, y, opts) {
    const o = Object.assign({ s: 1, wall: "#f6efe2", wallDark: "#d8ccb6", roof: "#6c2a1e", roofDark: "#4d1c14", night: false, glow: "#ffd27a", snow: false }, opts);
    const g = RV.g(parent, { transform: `translate(${x} ${y}) scale(${o.s})` });
    // nave
    RV.rect(g, -70, -110, 140, 110, o.wall);
    RV.rect(g, 20, -110, 50, 110, o.wallDark);
    RV.poly(g, [[-82, -104], [0, -170], [82, -104]], o.roof);
    RV.poly(g, [[0, -170], [82, -104], [30, -104]], o.roofDark);
    // tower
    RV.rect(g, -95, -230, 50, 230, o.wall);
    RV.rect(g, -62, -230, 17, 230, o.wallDark);
    RV.poly(g, [[-102, -226], [-70, -340], [-38, -226]], o.roof);
    RV.poly(g, [[-70, -340], [-38, -226], [-58, -226]], o.roofDark);
    RV.rect(g, -72, -362, 4, 26, "#b08d3a");
    RV.rect(g, -79, -354, 18, 4, "#b08d3a");
    RV.path(g, "M -80 -190 L -80 -168 A 10 10 0 0 1 -60 -168 L -60 -190 Z", o.night ? o.glow : "#3a4152");
    // arched windows
    [-35, 5, 45].forEach((wx) => RV.path(g, `M ${wx - 9} -40 L ${wx - 9} -78 A 9 9 0 0 1 ${wx + 9} -78 L ${wx + 9} -40 Z`, o.night ? o.glow : "#3a4152"));
    let snowRoof = null;
    if (o.snow) {
      snowRoof = RV.g(g, { class: "snowroof" });
      RV.path(snowRoof, "M -86 -102 L 0 -174 L 86 -102 L 74 -100 Q 40 -126 0 -150 Q -40 -126 -74 -100 Z", "#f7f9ff");
      RV.path(snowRoof, "M -106 -224 L -70 -344 L -34 -224 L -46 -222 Q -60 -270 -70 -300 Q -80 -270 -94 -222 Z", "#f7f9ff");
    }
    return { g, snowRoof };
  };

  // ------------------------------------------------------------------ people
  // Stylised head facing right (Motionlab-like: long face, big wedge nose with an indigo shadow plane).
  // Origin at the base of the neck. Returns {g, eye, lid, brow, pupil}
  RV.head = function (parent, opts) {
    const o = Object.assign({ skin: "#e3a47c", skinDark: "#b8714f", nose: "#3d3a8a", hair: "#3a2418", cap: null, capDark: null, grey: false, glasses: false, mustache: false, smile: 0, scale: 1, x: 0, y: 0, lookUp: 0 }, opts);
    const g = RV.g(parent, { transform: `translate(${o.x} ${o.y}) scale(${o.scale})` });
    // neck
    RV.path(g, "M -42 30 L -38 -70 L 38 -60 L 44 30 Z", o.skinDark);
    // skull + face silhouette
    const face = "M -40 -60 C -78 -90 -100 -150 -98 -215 C -96 -290 -50 -340 20 -342 C 75 -343 104 -310 108 -268 L 112 -236 C 113 -228 114 -222 116 -216 L 176 -146 C 179 -142 177 -138 172 -137 L 122 -132 L 124 -120 C 126 -114 124 -110 119 -108 L 121 -98 C 123 -92 120 -86 114 -84 L 112 -66 C 108 -48 92 -38 70 -36 L 34 -34 C 8 -36 -20 -44 -40 -60 Z";
    RV.path(g, face, o.skin);
    // cheek / jaw shadow plane
    RV.path(g, "M -40 -60 C -78 -90 -100 -150 -98 -215 L -60 -230 C -40 -170 -6 -120 40 -100 C 64 -90 84 -82 112 -66 C 108 -48 92 -38 70 -36 L 34 -34 C 8 -36 -20 -44 -40 -60 Z", o.skinDark, { opacity: 0.55 });
    // nose shadow plane (indigo)
    RV.path(g, "M 116 -216 L 176 -146 C 179 -142 177 -138 172 -137 L 122 -132 L 128 -150 Z", o.nose);
    RV.path(g, "M 116 -216 L 128 -150 L 122 -132 L 106 -140 Z", RV.mix(o.nose, o.skinDark, 0.55), { opacity: 0.9 });
    // ear
    RV.path(g, "M -30 -196 C -50 -206 -62 -186 -56 -160 C -52 -140 -36 -132 -24 -142 Z", o.skinDark);
    RV.path(g, "M -36 -186 C -46 -186 -48 -170 -44 -158", "none", { stroke: RV.shade(o.skinDark, -0.25), "stroke-width": 4, "stroke-linecap": "round" });
    // hair
    const hairC = o.grey ? "#d9d6d0" : o.hair;
    if (!o.cap) {
      RV.path(g, "M -98 -205 C -100 -290 -52 -350 26 -352 C 82 -352 112 -318 110 -276 C 96 -300 70 -308 40 -300 C 10 -290 -10 -262 -18 -230 L -26 -200 C -40 -210 -50 -205 -56 -190 C -66 -170 -70 -150 -80 -140 C -94 -160 -98 -185 -98 -205 Z", hairC);
      RV.path(g, "M 40 -300 C 70 -306 96 -298 110 -276 C 92 -286 66 -290 40 -300 Z", RV.shade(hairC, 0.25), { opacity: 0.7 });
    } else {
      RV.path(g, "M -98 -205 C -98 -240 -90 -262 -76 -276 L -18 -250 L -26 -200 C -40 -210 -50 -205 -56 -190 C -66 -170 -70 -150 -80 -140 C -94 -160 -98 -185 -98 -205 Z", hairC);
      // flat cap
      RV.path(g, "M -104 -246 C -104 -300 -60 -350 20 -352 C 80 -354 118 -330 126 -300 C 150 -298 176 -292 186 -282 C 176 -270 150 -266 118 -266 C 70 -262 10 -262 -40 -252 C -70 -246 -96 -236 -104 -246 Z", o.cap);
      RV.path(g, "M 118 -266 C 150 -266 176 -270 186 -282 C 170 -276 146 -274 120 -276 Z", o.capDark || RV.shade(o.cap, -0.35));
      RV.path(g, "M -60 -330 C -20 -350 40 -350 80 -336", "none", { stroke: o.capDark || RV.shade(o.cap, -0.35), "stroke-width": 4, opacity: 0.6 });
    }
    // eye
    const eyeG = RV.g(g, { transform: `translate(0 ${-o.lookUp * 6})` });
    const eye = RV.ellipse(eyeG, 80, -212, 9, 9, "#fbf3e6");
    const pupil = RV.ellipse(eyeG, 84 + o.lookUp * 1, -212 - o.lookUp * 2, 5.5, 6.5, "#1d1a22");
    const lid = RV.path(eyeG, "M 68 -222 C 76 -228 88 -228 94 -220 L 94 -224 C 86 -232 74 -232 66 -226 Z", o.skinDark);
    const brow = RV.path(g, o.grey ? "M 56 -238 C 70 -246 90 -246 104 -238" : "M 58 -238 C 72 -246 92 -246 106 -240", "none", { stroke: o.grey ? "#e9e6e0" : RV.shade(hairC, -0.1), "stroke-width": 7, "stroke-linecap": "round" });
    if (o.rim) RV.path(g, "M 100 -306 C 106 -290 109 -262 112 -236 C 113 -228 114 -222 116 -216 L 176 -146", "none", { stroke: o.rim, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.5 });
    // mouth
    RV.path(g, o.smile > 0 ? "M 98 -104 C 104 -100 110 -100 114 -106" : "M 98 -103 L 114 -104", "none", { stroke: RV.shade(o.skinDark, -0.35), "stroke-width": 3.5, "stroke-linecap": "round" });
    if (o.mustache) RV.path(g, "M 92 -118 C 100 -126 116 -128 124 -122 C 118 -112 100 -110 92 -118 Z", o.grey ? "#e9e6e0" : hairC);
    if (o.glasses) {
      RV.circle(g, 82, -212, 17, "none", { stroke: "#2a2422", "stroke-width": 4 });
      RV.path(g, "M 66 -214 L -20 -200", "none", { stroke: "#2a2422", "stroke-width": 4 });
    }
    return { g, eye, pupil, lid, brow, eyeG };
  };

  // Simple full-length figure (front view), base at (0,0). opts: h, coat, legs, skin, hair, hat, dress, scarf
  RV.person = function (parent, x, y, opts) {
    const o = Object.assign({ h: 260, coat: "#3d4a7a", coatDark: "#2b3560", legs: "#2a2230", skin: "#e3a47c", skinDark: "#b8714f", nose: "#3d3a8a", hair: "#3a2418", hat: null, dress: false, facing: 1, child: false, bag: null }, opts);
    const g = RV.g(parent, { transform: `translate(${x} ${y})` });
    const s = o.h / 260;
    const b = RV.g(g, { transform: `scale(${s * o.facing} ${s})` });
    // legs
    if (!o.dress) {
      RV.path(b, "M -22 -110 L -26 -6 L -10 -6 L -4 -100 Z", o.legs);
      RV.path(b, "M 22 -110 L 26 -6 L 10 -6 L 4 -100 Z", RV.shade(o.legs, -0.2));
    } else {
      RV.path(b, "M -14 -60 L -16 -6 L -6 -6 L -4 -60 Z", o.skinDark);
      RV.path(b, "M 14 -60 L 16 -6 L 6 -6 L 4 -60 Z", o.skinDark);
    }
    RV.ellipse(b, -18, -4, 14, 6, "#1d1a1c");
    RV.ellipse(b, 18, -4, 14, 6, "#1d1a1c");
    // coat / body
    const bodyD = o.dress
      ? "M -30 -190 C -40 -150 -52 -90 -58 -56 L 58 -56 C 52 -90 40 -150 30 -190 C 20 -200 -20 -200 -30 -190 Z"
      : "M -34 -192 C -42 -150 -44 -110 -40 -84 L 40 -84 C 44 -110 42 -150 34 -192 C 22 -202 -22 -202 -34 -192 Z";
    RV.path(b, bodyD, o.coat);
    RV.path(b, o.dress ? "M 4 -196 C 20 -196 30 -190 30 -190 C 40 -150 52 -90 58 -56 L 16 -56 Z" : "M 4 -198 C 20 -198 34 -192 34 -192 C 42 -150 44 -110 40 -84 L 12 -84 Z", o.coatDark);
    // arms
    RV.path(b, "M -34 -188 C -46 -170 -50 -140 -48 -112 L -36 -112 C -36 -140 -32 -160 -26 -176 Z", o.coatDark);
    RV.path(b, "M 34 -188 C 46 -170 50 -140 48 -112 L 36 -112 C 36 -140 32 -160 26 -176 Z", o.coatDark);
    RV.circle(b, -42, -108, 7, o.skin);
    RV.circle(b, 42, -108, 7, o.skin);
    if (o.bag) {
      RV.rect(b, 30, -110, 44, 34, o.bag, { rx: 4 });
      RV.rect(b, 30, -96, 44, 4, RV.shade(o.bag, -0.3));
      RV.path(b, "M 44 -110 L 46 -118 L 58 -118 L 60 -110", "none", { stroke: RV.shade(o.bag, -0.4), "stroke-width": 3 });
    }
    // head (front view)
    RV.rect(b, -8, -210, 16, 18, o.skinDark);
    RV.ellipse(b, 0, -232, 20, 26, o.skin);
    RV.path(b, "M 0 -240 L 10 -222 L 0 -220 Z", o.nose);
    RV.circle(b, -7, -236, 2.2, "#1d1a22");
    RV.circle(b, 9, -236, 2.2, "#1d1a22");
    if (o.hat === "fedora") {
      RV.ellipse(b, 0, -252, 32, 7, "#2b2422");
      RV.path(b, "M -18 -252 C -18 -272 18 -272 18 -252 Z", "#3a302c");
      RV.rect(b, -18, -257, 36, 5, "#7a2e1f");
    } else if (o.hat === "scarf") {
      RV.path(b, "M -24 -238 C -26 -268 26 -268 24 -238 C 22 -224 26 -214 20 -210 L 14 -230 C 8 -248 -8 -248 -14 -230 L -20 -210 C -26 -214 -22 -224 -24 -238 Z", "#c8463a");
    } else if (o.hat === "cap") {
      RV.path(b, "M -21 -244 C -20 -264 20 -266 22 -246 L 34 -242 L -21 -240 Z", "#5a4636");
    } else {
      RV.path(b, "M -21 -236 C -24 -262 22 -266 22 -238 C 16 -250 -12 -252 -21 -236 Z", o.hair);
    }
    return g;
  };

  // Rotate an element about a local point by writing its transform attribute (seek-safe, exact pivot).
  RV.spin = function (tl, el, from, to, t, dur, cx = 0, cy = 0, ease = "none", extra) {
    const base = el.getAttribute("transform") || "";
    const st = { a: from };
    const apply = () => el.setAttribute("transform", `${base} rotate(${st.a.toFixed(3)} ${cx} ${cy})`);
    apply();
    tl.fromTo(st, { a: from }, Object.assign({ a: to, duration: dur, ease, onUpdate: apply, immediateRender: false }, extra || {}), t);
    return st;
  };

  // ------------------------------------------------------------------ snow
  // Deterministic snowfall: positions are a pure function of time, driven by one onUpdate.
  RV.snowfall = function (parent, tl, opts) {
    const o = Object.assign({ count: 160, x0: 0, x1: W, y0: -40, y1: H + 40, t0: 0, t1: 10, seed: 7, size: [2, 7], speed: [50, 120], color: "#ffffff", fadeIn: 1.5, opacity: 0.95, sway: 30, blur: false }, opts);
    const r = RV.rng(o.seed);
    const g = RV.g(parent, { opacity: 0 });
    const flakes = [];
    for (let i = 0; i < o.count; i++) {
      const depth = r();
      const sz = RV.lerp(o.size[0], o.size[1], depth);
      const c = RV.circle(g, 0, 0, sz, o.color, { opacity: (0.55 + 0.45 * depth).toFixed(2) });
      flakes.push({ c, x: RV.lerp(o.x0, o.x1, r()), y: r() * (o.y1 - o.y0), v: RV.lerp(o.speed[0], o.speed[1], depth), ph: r() * 6.28, f: 0.4 + r() * 0.6, a: o.sway * (0.4 + depth) });
    }
    const span = o.y1 - o.y0;
    const st = { t: 0 };
    tl.fromTo(st, { t: 0 }, {
      t: o.t1 - o.t0, duration: o.t1 - o.t0, ease: "none",
      onUpdate: () => {
        const t = st.t;
        for (const f of flakes) {
          const y = o.y0 + ((f.y + f.v * t) % span);
          const x = f.x + Math.sin(f.ph + t * f.f) * f.a;
          f.c.setAttribute("cx", x.toFixed(1));
          f.c.setAttribute("cy", y.toFixed(1));
        }
      },
    }, o.t0);
    tl.fromTo(g, { opacity: 0 }, { opacity: o.opacity, duration: o.fadeIn, ease: "sine.inOut" }, o.t0);
    return g;
  };

  // Generic deterministic drift for ambient particles (dust, embers): positions from time.
  RV.particles = function (parent, tl, opts) {
    const o = Object.assign({ count: 40, x0: 0, x1: W, y0: 0, y1: H, t0: 0, t1: 10, seed: 3, size: [1.5, 4], color: "#f3d27a", vx: [-10, 10], vy: [-30, -10], opacity: 0.6 }, opts);
    const r = RV.rng(o.seed);
    const g = RV.g(parent);
    const ps = [];
    for (let i = 0; i < o.count; i++) {
      const c = RV.circle(g, 0, 0, RV.lerp(o.size[0], o.size[1], r()), o.color, { opacity: (o.opacity * (0.4 + 0.6 * r())).toFixed(2) });
      ps.push({ c, x: RV.lerp(o.x0, o.x1, r()), y: RV.lerp(o.y0, o.y1, r()), vx: RV.lerp(o.vx[0], o.vx[1], r()), vy: RV.lerp(o.vy[0], o.vy[1], r()), ph: r() * 6.28 });
    }
    const w = o.x1 - o.x0, h = o.y1 - o.y0;
    const st = { t: 0 };
    tl.fromTo(st, { t: 0 }, {
      t: o.t1 - o.t0, duration: o.t1 - o.t0, ease: "none",
      onUpdate: () => {
        for (const p of ps) {
          let x = p.x + p.vx * st.t + Math.sin(p.ph + st.t * 0.8) * 8;
          let y = p.y + p.vy * st.t;
          x = o.x0 + ((((x - o.x0) % w) + w) % w);
          y = o.y0 + ((((y - o.y0) % h) + h) % h);
          p.c.setAttribute("cx", x.toFixed(1));
          p.c.setAttribute("cy", y.toFixed(1));
        }
      },
    }, o.t0);
    return g;
  };

  // ------------------------------------------------------------------ transitions
  // Circular iris reveal of a scene frame from (cx, cy).
  RV.iris = function (tl, frame, cx, cy, t, dur, ease = "power2.inOut") {
    tl.fromTo(frame, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(2300px at ${cx}px ${cy}px)`, duration: dur, ease, immediateRender: true }, t);
  };
  // Diagonal wipe (direction: 1 = left->right, -1 = right->left)
  RV.wipe = function (tl, frame, t, dur, dir = 1, ease = "power2.inOut") {
    const from = dir > 0 ? "polygon(0% 0%, 0% 0%, -20% 100%, -20% 100%)" : "polygon(120% 0%, 120% 0%, 100% 100%, 100% 100%)";
    const to = dir > 0 ? "polygon(0% 0%, 140% 0%, 120% 100%, -20% 100%)" : "polygon(-40% 0%, 120% 0%, 100% 100%, -20% 100%)";
    tl.fromTo(frame, { clipPath: from }, { clipPath: to, duration: dur, ease, immediateRender: true }, t);
  };
  RV.fadeIn = function (tl, frame, t, dur, ease = "sine.inOut") {
    tl.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: dur, ease, immediateRender: true }, t);
  };
  // A band of big clouds that sweeps across the frame, used to hide a cut.
  RV.cloudSweep = function (parent, tl, t, dur, opts) {
    const o = Object.assign({ fill: "#fff3e2", shade: "#f1cfae", dir: -1, seed: 11, y: 540 }, opts);
    const g = RV.g(parent);
    const r = RV.rng(o.seed);
    for (let i = 0; i < 14; i++) {
      const cx = (i % 7) * 380 - 200 + r() * 120;
      const cy = (i < 7 ? 300 : 820) + (r() - 0.5) * 380;
      RV.cloud(g, cx, cy, 700 + r() * 500, { fill: o.fill, shade: o.shade, seed: i + o.seed, h: 360 + r() * 140, lumps: 4 });
    }
    RV.rect(g, -300, 150, 2700, 800, o.fill);
    const dx = o.dir < 0 ? [W + 400, -W - 1500] : [-W - 1500, W + 400];
    tl.fromTo(g, { x: dx[0] }, { x: dx[1], duration: dur, ease: "power1.inOut", immediateRender: true }, t);
    return g;
  };

  // ------------------------------------------------------------------ captions
  // Captions are static HTML clips (editable in Studio); words rise in one by one, then fade.
  RV.captions = function (tl) {
    document.querySelectorAll(".caption").forEach((cap) => {
      const start = parseFloat(cap.dataset.start), dur = parseFloat(cap.dataset.duration);
      const inner = cap.querySelector(".cap-text");
      const words = inner.textContent.trim().split(/\s+/);
      inner.textContent = "";
      const spans = words.map((w, i) => {
        const s = RV.htmlEl("span", "w", inner, w);
        if (i < words.length - 1) inner.appendChild(document.createTextNode(" "));
        return s;
      });
      const stag = Math.min(0.08, 0.7 / words.length);
      tl.fromTo(spans, { opacity: 0, y: 18, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out", stagger: stag, immediateRender: true }, start + 0.05);
      tl.fromTo(spans, { opacity: 1, y: 0, filter: "blur(0px)" }, { opacity: 0, y: -10, filter: "blur(4px)", duration: 0.4, ease: "power1.in", stagger: 0.015, immediateRender: false }, start + dur - 0.45);
    });
  };

  // ------------------------------------------------------------------ film grain
  RV.grainTexture = function (size = 256, seed = 99) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(size, size);
    const r = RV.rng(seed);
    for (let i = 0; i < size * size; i++) {
      const v = 128 + (r() + r() + r() - 1.5) * 120;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  };
})();
