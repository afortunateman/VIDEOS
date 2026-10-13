// Scene B (2.4–4.0s): a journey through the world.
// Through the swooping mountain we dive onto a patchwork landscape seen from above. A road paints
// itself across it, little houses pop up beside it, the road wriggles into a coastline as the sea
// floods in, a sailing boat loops and glides off leaving a curling wake — then the camera pulls
// back and the coastline bends into the outline of Africa on an illustrated world map.
(function () {
  const WX = window.WX, C = WX.C;
  const { clamp, lerp, inv, ease, spring, wobble, vnoise, boil, trace, ink, stroke, paint, mix, rgba, rng, resample } = WX;
  const T = window.WX_TIMELINE.cues;
  const S = [960, 540];
  const ZL = 22; // local px per map px at the start of the pull-back

  // ------------------------------------------------------------------ geometry helpers
  function catmull(ctrl, per = 18) {
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let j = 0; j < per; j++) {
        const t = j / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(ctrl[ctrl.length - 1]);
    return out;
  }
  function normals(pts) {
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l]; // right-hand side (y down): the sea side
    });
  }
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

  // ------------------------------------------------------------------ the local landscape
  const ROAD_CTRL = [[-500, 1500], [-80, 1170], [260, 1010], [470, 830], [700, 735], [930, 560], [1130, 420], [1380, 330], [1600, 160], [1850, 20], [2250, -260], [2800, -650]];
  const N_LINE = 220;
  const ROAD = resample(catmull(ROAD_CTRL), N_LINE);
  const RN = normals(ROAD);
  const COAST = ROAD.map((p, i) => {
    const w = 46 * Math.sin(i * 0.13 + 0.5) + 26 * Math.sin(i * 0.37 + 2) + 14 * Math.sin(i * 0.9);
    return [p[0] + RN[i][0] * (w + 20), p[1] + RN[i][1] * (w + 20)];
  });
  const CN = normals(COAST);
  // anchor: the coast point nearest the middle of the screen
  let iA = 0;
  COAST.forEach((p, i) => { if (Math.hypot(p[0] - S[0], p[1] - S[1]) < Math.hypot(COAST[iA][0] - S[0], COAST[iA][1] - S[1])) iA = i; });
  const L0 = COAST[iA];

  // patchwork fields on a tilted, jittered grid
  const FIELD_COLS = ['#86bd55', '#a9c95b', '#e8c46a', '#d48a5c', '#5fa04a', '#c7b55a', '#9ccf6a', '#e1a96a'];
  const FIELDS = [];
  {
    const r = rng(4242);
    const ang = 0.38, cw = 240, ch = 185;
    for (let gy = -12; gy <= 13; gy++) for (let gx = -14; gx <= 14; gx++) {
      const jx = (r() - 0.5) * 40, jy = (r() - 0.5) * 30;
      const c0 = rot([gx * cw + jx + (gy % 2) * 70, gy * ch + jy], ang);
      const cx = c0[0] + 700, cy = c0[1] + 380;
      if (cx < -3000 || cx > 3400 || cy < -2200 || cy > 3000) continue;
      const c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
        const p = rot([sx * (cw / 2 - 12 - r() * 10), sy * (ch / 2 - 12 - r() * 10)], ang + (r() - 0.5) * 0.08);
        return [cx + p[0], cy + p[1]];
      });
      // subdivide the edges so the smooth tracer keeps them field-shaped (rounded corners, straight sides)
      const corners = [];
      for (let k = 0; k < 4; k++) {
        const a = c4[k], b = c4[(k + 1) % 4];
        for (let j = 0; j < 5; j++) corners.push([lerp(a[0], b[0], j / 5), lerp(a[1], b[1], j / 5)]);
      }
      corners.c4 = c4;
      FIELDS.push({ c: [cx, cy], corners, col: FIELD_COLS[Math.floor(r() * FIELD_COLS.length)], stripe: ang + (r() < 0.5 ? 0 : Math.PI / 2), seed: gx * 31 + gy, tree: r() });
    }
  }
  // groves of round trees sitting on the hedgerows
  const GROVES = [];
  {
    const r = rng(77);
    for (let i = 0; i < 200; i++) {
      const f = FIELDS[Math.floor(r() * FIELDS.length)];
      const k = Math.floor(r() * 4);
      const a = f.corners.c4[k], b = f.corners.c4[(k + 1) % 4];
      const u = r();
      GROVES.push({ p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], s: 18 + r() * 16, seed: i });
    }
  }
  const HOUSE_S = [0.3, 0.4, 0.5, 0.6, 0.7];
  const HOUSES = HOUSE_S.map((s, i) => {
    const idx = Math.round(s * (N_LINE - 1));
    const n = RN[idx];
    const side = i % 2 ? 1.0 : 1.35;
    return { p: [ROAD[idx][0] - n[0] * 95 * side, ROAD[idx][1] - n[1] * 95 * side], cue: T.housePops[i], seed: i, roof: i % 3 === 1 ? C.yellowDeep : C.terracotta };
  });

  // ------------------------------------------------------------------ cameras
  const W = () => WX.world; // world map module (scene C)
  let FRAME = null; // computed lazily (needs the world module)
  function setupFrame() {
    const world = W();
    const africa = world.africaMap();
    const A = africa[0];
    // orient the local coast to the real coast heading north from Tanzania
    const k = 6;
    const aMap = Math.atan2(africa[k][1] - A[1], africa[k][0] - A[0]);
    const lt = COAST[Math.min(N_LINE - 1, iA + 6)], lb = COAST[iA];
    const aLoc = Math.atan2(lt[1] - lb[1], lt[0] - lb[0]);
    const phi = aMap - aLoc;
    const toMap = (p) => { const q = rot([p[0] - L0[0], p[1] - L0[1]], phi); return [A[0] + q[0] / ZL, A[1] + q[1] / ZL]; };
    FRAME = { A, phi, toMap, africa };
    buildMorph();
  }
  function localCam(t) {
    const u = ease.out3(inv(T.newLand - 0.1, T.newLand + 0.4, t));
    const s = lerp(0.78, 1, u);
    const rho = 0.32 * (1 - u) + 0.03 * Math.sin(t * 1.4);
    const dr = inv(T.newLand - 0.1, T.zoomOut + 0.1, t);
    const d = [lerp(-70, 90, dr), lerp(50, -55, dr)];
    return { s, rho, d };
  }
  // map camera {z, th, c}: screen = S + z * R(th) * (map - c)
  function mapCam(t) {
    const { A, phi } = FRAME;
    const lc = localCam(t);
    const c0q = rot([S[0] + lc.d[0] - L0[0], S[1] + lc.d[1] - L0[1]], phi);
    const c0 = [A[0] + c0q[0] / ZL, A[1] + c0q[1] / ZL];
    const z0 = ZL * lc.s, th0 = lc.rho - phi;
    const u = inv(T.zoomOut, T.curlStart - 0.04, t);
    if (u <= 0) return { z: z0, th: th0, c: c0, u: 0 };
    const e = ease.inOut3(u);
    const z = Math.exp(lerp(Math.log(z0), Math.log(1), e));
    // keep the anchor near frame while zoomed in: blend centre in log-zoom space
    const cz = clamp((Math.log(z0) - Math.log(z)) / Math.log(z0));
    const ce = ease.inOut2(cz);
    let dth = -th0;
    while (dth > Math.PI) dth -= 2 * Math.PI;
    while (dth < -Math.PI) dth += 2 * Math.PI;
    return { z, th: th0 + dth * ease.inOut2(u), c: [lerp(c0[0], 0, ce), lerp(c0[1], 0, ce)], u };
  }
  const camApply = (ctx, cam) => {
    ctx.translate(S[0], S[1]);
    ctx.rotate(cam.th);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-cam.c[0], -cam.c[1]);
  };
  const camPt = (cam, m) => {
    const q = rot([(m[0] - cam.c[0]) * cam.z, (m[1] - cam.c[1]) * cam.z], cam.th);
    return [S[0] + q[0], S[1] + q[1]];
  };
  // affine local->map as a canvas transform
  const localApply = (ctx) => {
    const { A, phi } = FRAME;
    ctx.translate(A[0], A[1]);
    ctx.rotate(phi);
    ctx.scale(1 / ZL, 1 / ZL);
    ctx.translate(-L0[0], -L0[1]);
  };

  // ------------------------------------------------------------------ land -> Africa morph
  let MORPH = null;
  function buildMorph() {
    const { africa, toMap } = FRAME;
    // split Africa at the Horn and at Mozambique
    const near = (lon, lat) => {
      const m = W().flat(lon, lat);
      let bi = 0, bd = 1e9;
      africa.forEach((p, i) => { const d = Math.hypot(p[0] - m[0], p[1] - m[1]); if (d < bd) { bd = d; bi = i; } });
      return bi;
    };
    let iHorn = near(51.2, 11.8), iMoz = near(35.4, -23.9);
    const n = africa.length;
    let ring = africa;
    if (iHorn > iMoz) { // ring heads south first: reverse so it heads north
      ring = [africa[0]].concat(africa.slice(1).reverse());
      iHorn = n - iHorn; iMoz = n - iMoz;
    }
    const part = (a, b) => ring.slice(a, b + 1);
    const p1 = part(0, iHorn), p2 = part(iHorn, iMoz), p3 = ring.slice(iMoz).concat([ring[0]]);
    const len = (q) => WX.polyLen(q);
    const NT = 300;
    const L1 = len(p1), L2 = len(p2), L3 = len(p3), LT = L1 + L2 + L3;
    const n1 = Math.round((NT * L1) / LT), n3 = Math.round((NT * L3) / LT), n2 = NT - n1 - n3;
    const target = resample(p1, n1).concat(resample(p2, n2), resample(p3, n3));
    // local land polygon pieces in the same order (anchor -> north along the coast -> round the land -> back)
    const north = COAST.slice(iA);
    const south = COAST.slice(0, iA + 1);
    const endN = north[north.length - 1], endS = south[0];
    const closure = [endN, [endN[0] - 600, endN[1] - 900], [-2600, -1600], [-2800, 1400], [-1800, 2600], [endS[0] - 700, endS[1] + 500], endS];
    const src = resample(north, n1).concat(resample(closure, n2), resample(south, n3)).map(toMap);
    MORPH = { src, target, n1, n2, n3 };
  }
  function landPolyMap(t) {
    const u = inv(T.zoomOut + 0.02, T.curlStart - 0.06, t);
    const { src, target } = MORPH;
    const N = src.length;
    // points near the anchor settle first; the far side of the land swings round last
    return src.map((p, i) => {
      const d = Math.min(i, N - i) / (N / 2);
      const k = clamp(d * 0.55);
      const e = ease.inOut3(clamp((u - k * 0.5) / 0.5));
      return [lerp(p[0], target[i][0], e), lerp(p[1], target[i][1], e)];
    });
  }

  // ------------------------------------------------------------------ drawing: the local landscape
  function drawFields(ctx, t, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#3b7f3e';
    ctx.fillRect(-3000, -3000, 7000, 7000);
    // cull to the screen, and draw distant fields simply (they are tiny once we pull back)
    const M = ctx.getTransform();
    const sc = Math.hypot(M.a, M.b);
    const lod = sc < 0.22;
    for (const f of FIELDS) {
      const sx = M.a * f.c[0] + M.c * f.c[1] + M.e, sy = M.b * f.c[0] + M.d * f.c[1] + M.f;
      const rad = 170 * sc;
      if (sx < -rad || sx > 1920 + rad || sy < -rad || sy > 1080 + rad) continue;
      if (lod) {
        ctx.beginPath(); trace(ctx, f.corners, true);
        ctx.fillStyle = f.col; ctx.fill();
        continue;
      }
      const P = boil(f.corners, 1.4, f.seed);
      const shape = (c) => trace(c, P, true);
      paint(ctx, shape, f.col, { tex: 0.5, texSeed: f.seed, shade: { dx: -7, dy: -9, color: mix(f.col, '#2a5a30', 0.35), alpha: 1 } });
      // crop rows
      ctx.save();
      ctx.beginPath(); shape(ctx); ctx.clip();
      ctx.translate(f.c[0], f.c[1]);
      ctx.rotate(f.stripe);
      ctx.strokeStyle = mix(f.col, '#24412a', 0.22);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = -140; y <= 140; y += 16) { ctx.moveTo(-180, y); ctx.lineTo(180, y + 4 * Math.sin(y)); }
      ctx.stroke();
      ctx.restore();
      ink(ctx, P, 3.4, rgba(C.ink, 0.85), { closed: true, seed: f.seed + 1, wvar: 0.5 });
    }
    ctx.restore();
  }
  function drawGroves(ctx, t, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const M = ctx.getTransform();
    const sc = Math.hypot(M.a, M.b);
    for (const g of GROVES) {
      const gx = M.a * g.p[0] + M.c * g.p[1] + M.e, gy = M.b * g.p[0] + M.d * g.p[1] + M.f;
      if (gx < -60 || gx > 1980 || gy < -60 || gy > 1140 || sc < 0.15) continue;
      const sw = 2.5 * Math.sin(t * 3 + g.seed);
      const x = g.p[0] + sw, y = g.p[1];
      // drop shadow
      ctx.fillStyle = 'rgba(20,50,30,0.35)';
      ctx.beginPath(); ctx.ellipse(x + g.s * 0.35, y + g.s * 0.4, g.s, g.s * 0.85, 0, 0, 7); ctx.fill();
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rr = g.s * (1 + 0.12 * Math.sin(a * 4 + g.seed) + 0.04 * vnoise(i + g.seed, WX.frame.boil));
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
      }
      paint(ctx, (c) => trace(c, pts, true), C.green, {
        tex: 0.4, texSeed: g.seed,
        shade: { dx: -g.s * 0.3, dy: -g.s * 0.3, color: C.greenDark, alpha: 1 },
        light: { dx: g.s * 0.3, dy: g.s * 0.3, color: C.leaf, alpha: 0.9 },
      });
      ink(ctx, pts, 2.6, C.ink, { closed: true, seed: g.seed, wvar: 0.4 });
    }
    ctx.restore();
  }
  // the road paints itself on, then wriggles into a sandy coastline
  function roadLine(t) {
    const mu = inv(T.coastFlood - 0.08, T.coastFlood + 0.26, t);
    if (mu <= 0) return ROAD;
    const base = WX.morph(ROAD, COAST, mu, 0.45, ease.inOut3);
    // a travelling wriggle as it changes
    const amp = 55 * Math.sin(Math.PI * mu);
    return base.map((p, i) => {
      const s = i / (N_LINE - 1);
      const w = amp * Math.sin(s * 22 - mu * 14) * Math.sin(Math.PI * clamp(mu * 1.6 - s * 0.6));
      return [p[0] + RN[i][0] * w, p[1] + RN[i][1] * w];
    });
  }
  function drawRoad(ctx, t, alpha) {
    const draw = ease.inOut2(inv(T.roadDraw, T.roadDraw + 0.36, t));
    if (draw <= 0) return;
    const mu = inv(T.coastFlood - 0.08, T.coastFlood + 0.26, t);
    const line = WX.partial(boil(roadLine(t), 1.5, 3), draw);
    ctx.save();
    ctx.globalAlpha = alpha;
    const w = lerp(64, 92, mu);
    stroke(ctx, line, w + 10, mix('#8a5a3a', C.ink, mu));
    stroke(ctx, line, w, mix('#dcb987', '#f4e0b3', mu));
    // wheel ruts become ripples in the sand
    if (mu < 0.6) {
      ctx.setLineDash([22, 26]);
      stroke(ctx, line, 4, rgba('#a8794f', 0.8 * (1 - mu / 0.6)));
      ctx.setLineDash([]);
    }
    // round head of the brush while it paints
    if (draw < 1) {
      const h = line[line.length - 1];
      ctx.beginPath(); ctx.arc(h[0], h[1], w * 0.62, 0, 7);
      ctx.fillStyle = '#dcb987'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#8a5a3a'; ctx.stroke();
    }
    ctx.restore();
  }
  function drawHouse(ctx, h, t) {
    const lt = t - h.cue;
    if (lt <= 0) return;
    const s = spring(lt, 3, 7);
    const wob = wobble(lt, 3, 7);
    ctx.save();
    ctx.translate(h.p[0], h.p[1]);
    ctx.rotate(-0.12 + 0.05 * h.seed);
    ctx.scale(s * (1 - 0.25 * wob), s * (1 + 0.35 * wob));
    const W2 = 46, D = 34, Hh = 30;
    // shadow on the ground
    ctx.fillStyle = 'rgba(25,45,30,0.35)';
    ctx.beginPath(); ctx.ellipse(16, 10, W2 * 1.2, D * 0.9, 0, 0, 7); ctx.fill();
    // front wall
    const wall = [[-W2, -4], [W2, -4], [W2, Hh - 4], [-W2, Hh - 4]];
    paint(ctx, (c) => trace(c, boil(wall, 0.8, h.seed), true), C.cream, { tex: 0.3, shade: { dx: -10, dy: 0, color: C.creamDark, alpha: 1 } });
    ctx.fillStyle = '#6b4a3a';
    ctx.fillRect(-8, 6, 16, Hh - 10);
    ctx.fillStyle = C.yellowLight;
    ctx.fillRect(-W2 + 10, 4, 14, 11); ctx.fillRect(W2 - 24, 4, 14, 11);
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink;
    ctx.strokeRect(-W2 + 10, 4, 14, 11); ctx.strokeRect(W2 - 24, 4, 14, 11); ctx.strokeRect(-8, 6, 16, Hh - 10);
    ink(ctx, boil(wall, 0.8, h.seed), 3.4, C.ink, { closed: true, seed: h.seed });
    // roof: two planes seen from above, lit and shaded
    const ridgeL = [-W2 - 6, -D * 0.95], ridgeR = [W2 + 6, -D * 0.95];
    const back = [[-W2 - 10, -D * 1.9], [W2 + 10, -D * 1.9], ridgeR, ridgeL];
    const front = [ridgeL, ridgeR, [W2 + 12, -2], [-W2 - 12, -2]];
    paint(ctx, (c) => trace(c, boil(back, 0.8, h.seed + 1), true), mix(h.roof, '#ffffff', 0.18), { tex: 0.4 });
    paint(ctx, (c) => trace(c, boil(front, 0.8, h.seed + 2), true), h.roof, { tex: 0.4, shade: { dx: 0, dy: -8, color: mix(h.roof, '#3a1a10', 0.3), alpha: 1 } });
    ink(ctx, boil(back, 0.8, h.seed + 1), 3.2, C.ink, { closed: true, seed: h.seed + 3 });
    ink(ctx, boil(front, 0.8, h.seed + 2), 3.2, C.ink, { closed: true, seed: h.seed + 4 });
    // chimney with a puff
    ctx.fillStyle = '#8e4a35'; ctx.fillRect(W2 * 0.45, -D * 1.75, 12, 20);
    ctx.strokeRect(W2 * 0.45, -D * 1.75, 12, 20);
    if (lt > 0.12) {
      const pt = lt - 0.12;
      const pr = 7 + pt * 26;
      ctx.globalAlpha = clamp(1 - pt * 1.4);
      ctx.beginPath(); ctx.arc(W2 * 0.45 + 6 + pt * 30, -D * 1.75 - 10 - pt * 50, pr, 0, 7);
      ctx.fillStyle = C.creamLight; ctx.fill();
      ctx.lineWidth = 2.4; ctx.stroke();
    }
    ctx.restore();
  }

  // the sea floods in from the far side and stops at the new coastline
  function floodFront(t) {
    const u = inv(T.coastFlood, T.coastFlood + 0.3, t);
    const D = 1700 * (1 - ease.out3(u));
    return { D, u };
  }
  function drawLocalSea(ctx, t, alpha) {
    const { D, u } = floodFront(t);
    if (u <= 0) return;
    const line = roadLine(t);
    // far away the front is a smooth swell; it takes on the coast's wiggles as it arrives
    const sm = clamp(D / 350);
    const F = line.map((p, i) => {
      let nx = lerp(CN[i][0], RN[i][0], sm), ny = lerp(CN[i][1], RN[i][1], sm);
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const b = [lerp(p[0], ROAD[i][0], sm), lerp(p[1], ROAD[i][1], sm)];
      return [b[0] + nx * (D + 30), b[1] + ny * (D + 30)];
    });
    const poly = F.concat([[3600, -1400], [3600, 3600], [-1600, 3600]]);
    ctx.save();
    ctx.globalAlpha = alpha;
    const shape = (c) => trace(c, poly, true);
    paint(ctx, shape, C.ocean, { tex: 0.5, texSeed: 9 });
    ctx.save();
    ctx.beginPath(); shape(ctx); ctx.clip();
    // shallow water hugging the coast
    stroke(ctx, line.map((p, i) => [p[0] + CN[i][0] * 70, p[1] + CN[i][1] * 70]), 120, rgba('#5fb6cc', 0.75));
    stroke(ctx, line.map((p, i) => [p[0] + CN[i][0] * 150, p[1] + CN[i][1] * 150]), 80, rgba('#3f8fbd', 0.6));
    // ripples
    const r = rng(5);
    ctx.strokeStyle = rgba(C.foam, 0.75);
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const x = -600 + r() * 3400, y = -600 + r() * 2600;
      const ph = t * 1.6 + r() * 6;
      const L = 16 + 10 * Math.sin(ph);
      ctx.moveTo(x - L, y); ctx.quadraticCurveTo(x, y - 9, x + L, y);
    }
    ctx.stroke();
    ctx.restore();
    // racing foam front, then lapping foam along the beach
    const foam = F.map((p, i) => [p[0] + RN[i][0] * (8 + 6 * Math.sin(i * 0.5 + t * 8)), p[1] + RN[i][1] * (8 + 6 * Math.sin(i * 0.5 + t * 8))]);
    ink(ctx, boil(foam, 2, 12), 14, C.foam, { seed: 12, taper: false, wvar: 0.6 });
    ink(ctx, boil(F, 1.5, 13), 4, C.ink, { seed: 13, taper: false });
    ctx.restore();
  }

  // ------------------------------------------------------------------ boat
  function boatLocal(tau) {
    // a gentle S-curve glide, parallel to the new coast
    const st = [1180, 1010], dir = [0.84, -0.54], perp = [0.54, 0.84];
    const along = 430 * tau + 120 * (1 - Math.exp(-tau * 5));
    const side = 46 * Math.sin(tau * 5.2);
    return [st[0] + dir[0] * along + perp[0] * side, st[1] + dir[1] * along + perp[1] * side];
  }
  // where the boat sails once the coast has become Africa's: out in the Indian Ocean
  function boatOffshore(t) {
    const dt = Math.max(0, t - T.zoomOut);
    return W().flat(44.5 + 7 * dt, -9 + 2.5 * dt);
  }
  function boatMap(t, tau) {
    const m = FRAME.toMap(boatLocal(tau));
    const u = ease.inOut3(inv(T.zoomOut, T.curlStart - 0.1, t));
    if (u <= 0) return m;
    const o = boatOffshore(t), here = FRAME.toMap(boatLocal(t - T.boatSail));
    return [m[0] + (o[0] - here[0]) * u, m[1] + (o[1] - here[1]) * u];
  }
  function drawBoat(ctx, x, y, ang, s, t) {
    ctx.save();
    ctx.translate(x, y);
    const bob = 0.1 * Math.sin(t * 7.5) + 0.05 * Math.sin(t * 13);
    const flip = Math.cos(ang) < 0 ? -1 : 1;
    ctx.rotate(bob);
    ctx.scale(s * flip, s * (1 + 0.04 * Math.sin(t * 15)));
    // hull
    const hull = [[-46, -6], [46, -10], [36, 14], [-34, 16]];
    paint(ctx, (c) => trace(c, boil(hull, 0.6, 81), true), C.terracotta, { tex: 0.3, shade: { dx: 0, dy: -7, color: C.terraDark, alpha: 1 } });
    ink(ctx, boil(hull, 0.6, 81), 3.4, C.ink, { closed: true, seed: 81 });
    ctx.fillStyle = C.yellow;
    ctx.fillRect(-34, -2, 68, 5);
    // mast & sails
    ctx.lineWidth = 3.6; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -92); ctx.stroke();
    const billow = 6 * Math.sin(t * 5);
    const sail = [[4, -88], [46 + billow, -22], [4, -16]];
    const jib = [[-4, -80], [-4, -18], [-38 - billow * 0.5, -22]];
    paint(ctx, (c) => trace(c, boil(sail, 0.7, 82), true), C.creamLight, { tex: 0.3, shade: { dx: 8, dy: 0, color: C.creamDark, alpha: 1 } });
    paint(ctx, (c) => trace(c, boil(jib, 0.7, 83), true), C.cream, { tex: 0.3 });
    ink(ctx, boil(sail, 0.7, 82), 3.2, C.ink, { closed: true, seed: 82 });
    ink(ctx, boil(jib, 0.7, 83), 3.2, C.ink, { closed: true, seed: 83 });
    ctx.fillStyle = C.terracotta;
    ctx.beginPath(); ctx.moveTo(14, -60); ctx.lineTo(30, -40); ctx.lineTo(14, -40); ctx.closePath(); ctx.fill();
    // pennant
    ctx.fillStyle = C.yellow;
    ctx.beginPath(); ctx.moveTo(0, -92); ctx.quadraticCurveTo(-14, -96 + 3 * Math.sin(t * 12), -26, -92); ctx.lineTo(0, -84); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function boatScreen(t, cam) {
    const tau = t - T.boatSail;
    const mp = boatMap(t, tau), mq = boatMap(t, tau + 0.01);
    const sp = camPt(cam, mp), sq = camPt(cam, mq);
    return { sp, ang: Math.atan2(sq[1] - sp[1], sq[0] - sp[0]), map: mp };
  }
  function drawBoatAndTrail(ctx, t, cam) {
    const tau = t - T.boatSail;
    if (tau <= 0) return;
    const appear = spring(tau, 3, 7);
    const zr = clamp(Math.log(cam.z) / Math.log(ZL));
    const bs = (0.42 + 0.58 * zr) * appear * 0.95;
    // the wake: the boat's own path, back in time, rolling up into a curl at its tail
    const N = 40, span = Math.min(tau, 0.55);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const tt = tau - (span * i) / N;
      const lp = boatMap(t, tt);
      pts.push(camPt(cam, [lp[0], lp[1] + 0.5 / ZL]));
    }
    if (pts.length > 3 && span > 0.04) {
      const a = pts[N], b2 = pts[N - 1];
      let dx = a[0] - b2[0], dy = a[1] - b2[1];
      let L = Math.max(5, Math.hypot(dx, dy)) * 1.5;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      let ang = Math.atan2(dy, dx);
      const curl = clamp(span / 0.35);
      let p = a;
      for (let i = 0; i < 34 * curl; i++) {
        ang += 0.16 + i * 0.012;
        L *= 0.95;
        p = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L];
        pts.push(p);
      }
      const wake = pts.slice();
      ink(ctx, wake, 20 * bs, C.foam, { seed: 90, wvar: 0.35 });
      ink(ctx, wake, 4 * bs, rgba(C.ink, 0.45), { seed: 91 });
    }
    const b = boatScreen(t, cam);
    drawBoat(ctx, b.sp[0], b.sp[1] - 8 * bs, b.ang, bs, t);
  }

  function drawCloudShadows(ctx, t, alpha) {
    const list = [[420 + t * 60, 260, 70, 1], [1500 + t * 50, 820, 60, 2]];
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const [x, y, s, seed] of list) {
      ctx.fillStyle = 'rgba(20,40,40,0.18)';
      ctx.beginPath(); ctx.ellipse(x + 90, y + 120, s * 1.1, s * 0.6, 0, 0, 7); ctx.fill();
      WX.cloud(ctx, x, y, s, { seed: seed + 20 });
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ main
  WX.sceneB = {
    mapCam,
    boatMapAt(t) { if (!FRAME) setupFrame(); return boatScreen(t, { z: 1, th: 0, c: [0, 0] }).map; },
    draw(ctx, t) {
      if (!FRAME) setupFrame();
      const cam = mapCam(t);
      const zr = clamp(Math.log(cam.z) / Math.log(ZL));
      const localA = clamp((zr - 0.22) / 0.3); // local detail fades as the map takes over

      ctx.save();
      // reveal through the swooping mountain: a watercolour bloom opening inside it
      const rv = inv(T.newLand - 0.1, T.newLand + 0.05, t);
      if (rv < 1) {
        const R = 1300 * ease.in2(rv);
        const pts = [];
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const r = R * (1 + 0.08 * vnoise(i * 0.5, WX.frame.boil));
          pts.push([960 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.8]);
        }
        ctx.beginPath(); trace(ctx, pts, true); ctx.clip();
      }

      // ocean underlay (visible once the land shrinks to a continent)
      if (cam.u > 0) W().drawOceanFlat(ctx, t, cam);

      // the land: everything left of the coast; becomes Africa as we pull back
      const land = cam.u > 0 ? landPolyMap(t).map((m) => camPt(cam, m)) : null;
      ctx.save();
      if (land) {
        W().drawLandShape(ctx, land, { seed: 5, fill: C.green });
        ctx.beginPath(); trace(ctx, land, true); ctx.clip();
      }
      ctx.save();
      camApply(ctx, cam);
      localApply(ctx);
      drawFields(ctx, t, localA);
      drawGroves(ctx, t, localA);
      const early = 1 - inv(T.zoomOut + 0.04, T.zoomOut + 0.22, t);
      drawRoad(ctx, t, localA * early);
      HOUSES.forEach((h) => { ctx.save(); ctx.globalAlpha = localA * early; drawHouse(ctx, h, t); ctx.restore(); });
      ctx.restore();
      ctx.restore();
      if (cam.u <= 0) {
        ctx.save(); camApply(ctx, cam); localApply(ctx);
        drawLocalSea(ctx, t, 1);
        ctx.restore();
      } else {
        // during the pull-back the coastline is re-inked in screen space, staying crisp
        const seaA = 1 - inv(T.zoomOut, T.zoomOut + 0.16, t);
        if (seaA > 0) {
          ctx.save();
          ctx.globalAlpha = seaA;
          ctx.save(); camApply(ctx, cam); localApply(ctx);
          drawLocalSea(ctx, t, 1);
          ctx.restore();
          ctx.restore();
        }
        // the sandy beach rides along the bending coastline, thinning as we rise
        const beachW = 34 * Math.pow(zr, 1.4);
        if (beachW > 0.6) {
          ctx.save();
          ctx.beginPath(); trace(ctx, land, true);
          ctx.lineJoin = 'round';
          ctx.lineWidth = beachW; ctx.strokeStyle = '#f4e0b3'; ctx.stroke();
          ctx.restore();
        }
        W().drawLandInk(ctx, land, { seed: 5 });
        // the rest of the world draws itself in around Africa
        W().drawWorldFlatReveal(ctx, t, cam);
      }
      drawBoatAndTrail(ctx, t, cam);
      ctx.save(); camApply(ctx, cam); localApply(ctx);
      drawCloudShadows(ctx, t, localA);
      ctx.restore();
      ctx.restore();

      // bloom rim while revealing
      if (rv > 0 && rv < 1) {
        const R = 1300 * ease.in2(rv);
        const pts = [];
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const r = R * (1 + 0.08 * vnoise(i * 0.5, WX.frame.boil));
          pts.push([960 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.8]);
        }
        ink(ctx, pts, 12, C.creamLight, { closed: true, seed: 3, wvar: 0.6 });
        ink(ctx, pts.map((p) => [lerp(960, p[0], 1.012), lerp(520, p[1], 1.012)]), 3, C.ink, { closed: true, seed: 4 });
      }
    },
  };
})();
