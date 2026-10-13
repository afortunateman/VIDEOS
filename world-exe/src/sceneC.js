// Scene C (4–6s) + the globe for the title (6–8s).
// The illustrated world map curls itself around an invisible sphere: every coastline point is carried
// from a flat sheet onto a sphere whose curvature grows from 0 to 1, so continents bend, the ocean's
// edges roll away like a wave, and the sheet closes into a planet. Then the globe winds up and spins
// with smear lines, overshoots and settles. Also hosts the shared map-drawing helpers used by scene B.
(function () {
  const WX = window.WX, C = WX.C;
  const { clamp, lerp, inv, ease, wobble, boil, trace, ink, paint, rgba, rng } = WX;
  const T = window.WX_TIMELINE.cues;
  const GEO = window.WX_GEO;
  const D2R = Math.PI / 180;

  const R0 = 380, LON0 = 15;               // the flat map at the end of scene B
  const FINAL = { cx: 960, cy: 492, R: 392, lon: -22, lat: 26 };

  // ------------------------------------------------------------------ data prep
  // land rings (Antarctica is left off: it sits under the subtitle and fights the pole maths)
  const LAND = GEO.land.filter((r) => Math.min(...r.pts.map((p) => p[1])) > -60);
  const BIG = LAND.reduce((a, r) => (r.area > a.area ? r : a));
  const EURASIA = { pts: GEO.eurasia, area: BIG.area, eurasia: true };

  // biomes, as lon/lat ellipses clipped into the land: [lon, lat, rx, ry, colour]
  const DESERTS = [[12, 23, 22, 8], [45, 22, 10, 7], [-112, 34, 9, 5], [133, -25, 12, 7], [22, -23, 7, 5], [95, 42, 16, 5], [-68, -24, 3, 9], [60, 40, 9, 5]];
  const FORESTS = [[-60, -5, 12, 8], [20, 0, 8, 6], [105, 2, 9, 7], [95, 60, 32, 7], [-100, 55, 18, 6]];
  const ICE = [[-42, 74, 16, 9], [-80, 74, 20, 5], [100, 74, 40, 3]];
  const MOUNTAINS = [[86, 29, 1.25], [80, 33, 1], [93, 30, 0.9], [-70, -18, 1.1], [-70, -32, 1], [-76, -6, 0.9], [-112, 44, 1], [-118, 52, 0.9], [9, 46, 0.85], [37, -3, 0.8], [44, 40, 0.8], [-5, 32, 0.7], [70, 37, 0.8]];
  const TREES = [];
  { const r = rng(12); FORESTS.forEach((f) => { for (let i = 0; i < 9; i++) TREES.push([f[0] + (r() - 0.5) * f[2] * 1.6, f[1] + (r() - 0.5) * f[3] * 1.4, 0.7 + r() * 0.5]); }); }
  const RIPPLES = [];
  { const r = rng(44); for (let i = 0; i < 70; i++) RIPPLES.push([r() * 360 - 180, r() * 130 - 65, r()]); }
  const GLOBE_CLOUDS = [[-30, 42, 1.0], [-38, -12, 0.85], [8, 12, 0.7], [62, -18, 0.9], [-95, 18, 0.9], [130, 30, 0.9], [160, -20, 0.8], [-150, -35, 0.85], [100, -45, 0.8], [-10, -40, 0.75], [30, 52, 0.7]];

  // ------------------------------------------------------------------ projection
  // flat map coordinates used by scene B (equirectangular, centred on LON0, map px)
  const flat = (lon, lat) => [R0 * (lon - LON0) * D2R, -R0 * lat * D2R];

  // view: {k, R, cx, cy, lon, lat, sx, sy}
  // k=0 -> equirectangular sheet; k=1 -> orthographic globe; in between the sheet lies on a sphere of radius R/k
  function projector(V) {
    const cl = Math.cos(V.lat * D2R), sl = Math.sin(V.lat * D2R);
    const k = V.k, Rk = V.R / Math.max(k, 1e-6);
    const sx = V.sx || 1, sy = V.sy || 1;
    function rotLL(lon, lat) {
      const l = (lon - V.lon) * D2R, p = lat * D2R;
      const x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l);
      const y2 = y * cl - z * sl, z2 = y * sl + z * cl;
      return [Math.atan2(x, z2), Math.asin(clamp(y2, -1, 1))];
    }
    function fromRot(lr, pr) {
      if (k < 1e-4) return [V.cx + V.R * lr * sx, V.cy - V.R * pr * sy, 1];
      const l2 = lr * k, p2 = pr * k;
      let X = Rk * Math.cos(p2) * Math.sin(l2), Y = Rk * Math.sin(p2);
      const Z = Math.cos(p2) * Math.cos(l2);
      if (Z < 0) { const m = Math.hypot(X, Y) || 1; X = (X / m) * Rk; Y = (Y / m) * Rk; }
      return [V.cx + X * sx, V.cy - Y * sy, Z];
    }
    // a whole ring, unwrapped across the sheet's seam and clamped to its edge
    function ring(pts) {
      const out = new Array(pts.length);
      let prev = null, vis = 0;
      for (let i = 0; i < pts.length; i++) {
        let [lr, pr] = rotLL(pts[i][0], pts[i][1]);
        if (k < 0.999 && prev !== null) {
          while (lr - prev > Math.PI) lr -= 2 * Math.PI;
          while (lr - prev < -Math.PI) lr += 2 * Math.PI;
        }
        prev = lr;
        const q = fromRot(clamp(lr, -Math.PI, Math.PI), pr);
        if (q[2] > 0) vis++;
        out[i] = q;
      }
      out.vis = vis;
      return out;
    }
    const point = (lon, lat) => { const [lr, pr] = rotLL(lon, lat); return fromRot(lr, pr); };
    return { V, rotLL, fromRot, ring, point, Rk };
  }

  // ------------------------------------------------------------------ land drawing kit (screen-space)
  function drawCoastHalo(ctx, pts, s = 1) {
    // vintage-map coastal rings: light shallows, a band of sea, a thin echo line
    ctx.lineJoin = 'round';
    ctx.beginPath(); trace(ctx, pts, true);
    ctx.lineWidth = 30 * s; ctx.strokeStyle = rgba('#7cc7d6', 0.55); ctx.stroke();
    ctx.lineWidth = 22 * s; ctx.strokeStyle = '#2f73ad'; ctx.stroke();
    ctx.lineWidth = 15 * s; ctx.strokeStyle = '#69b7cf'; ctx.stroke();
  }
  function drawLandShape(ctx, pts, o = {}) {
    const s = o.scale || 1;
    if (o.halo !== false) drawCoastHalo(ctx, pts, s);
    paint(ctx, (c) => trace(c, pts, true), o.fill || C.green, {
      tex: 0.55, texSeed: o.seed || 0, texScale: 0.7,
      shade: { dx: -7 * s, dy: -8 * s, color: C.greenDark, alpha: 0.9 },
      light: { dx: 5 * s, dy: 6 * s, color: '#8cc45a', alpha: 0.9 },
    });
  }
  function drawLandInk(ctx, pts, o = {}) {
    ink(ctx, boil(pts, 1.1, o.seed || 0), (o.w || 3.4) * (o.scale || 1), C.ink, { closed: true, seed: o.seed || 0, wvar: 0.55 });
  }
  function ellipseRing(e, n = 20) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([e[0] + Math.cos(a) * e[2] * (1 + 0.15 * Math.sin(a * 3 + e[0])), e[1] + Math.sin(a) * e[3] * (1 + 0.12 * Math.cos(a * 2 + e[1]))]);
    }
    return pts;
  }
  const DESERT_RINGS = DESERTS.map((e) => ellipseRing(e));
  const FOREST_RINGS = FORESTS.map((e) => ellipseRing(e));
  const ICE_RINGS = ICE.map((e) => ellipseRing(e));

  // draw every land ring through a projector. opts: {alpha, reveal(t)->per-ring 0..1, skipBig, detail}
  function drawLands(ctx, P, o = {}) {
    const s = o.scale || 1;
    const rings = [];
    (o.rings || LAND).forEach((r, i) => {
      if (o.skip && o.skip(r)) return;
      const pts = P.ring(r.pts);
      if (pts.vis === 0) return;
      rings.push({ r, pts, i });
    });
    // coastal halos first, all together, so neighbours' rings never cut across land
    ctx.save();
    for (const g of rings) {
      const a = o.reveal ? o.reveal(g.r) : 1;
      if (a <= 0) continue;
      ctx.globalAlpha = a * (o.alpha === undefined ? 1 : o.alpha);
      drawCoastHalo(ctx, g.pts, s);
    }
    ctx.restore();
    ctx.save();
    for (const g of rings) {
      const a = o.reveal ? o.reveal(g.r) : 1;
      if (a <= 0) continue;
      ctx.globalAlpha = a * (o.alpha === undefined ? 1 : o.alpha);
      drawLandShape(ctx, g.pts, { seed: g.i, halo: false, scale: s });
    }
    ctx.restore();
    // biomes clipped to land
    if (o.detail !== false) {
      ctx.save();
      ctx.beginPath();
      for (const g of rings) if (!o.reveal || o.reveal(g.r) > 0.95) trace(ctx, g.pts, true);
      ctx.clip();
      ctx.globalAlpha = o.detailAlpha === undefined ? 1 : o.detailAlpha;
      const biome = (list, col, shade, seed) => list.forEach((rg, i) => {
        const pts = P.ring(rg);
        if (pts.vis < rg.length * 0.3) return;
        paint(ctx, (c) => trace(c, pts, true), col, { tex: 0.45, texSeed: seed + i, shade: { dx: -4 * s, dy: -5 * s, color: shade, alpha: 1 } });
      });
      biome(DESERT_RINGS, '#e9c46a', '#d29a4a', 30);
      biome(FOREST_RINGS, '#2f7a3d', '#215a30', 40);
      biome(ICE_RINGS, C.snow, '#d4dde6', 50);
      ctx.restore();
    }
    // ink coastlines
    ctx.save();
    for (const g of rings) {
      const a = o.reveal ? o.reveal(g.r) : 1;
      if (a <= 0) continue;
      ctx.globalAlpha = a * (o.alpha === undefined ? 1 : o.alpha);
      const draw = o.inkReveal ? o.inkReveal(g.r) : 1;
      let pts = boil(g.pts, 1.1, g.i);
      if (draw < 1) pts = WX.partial(pts, draw);
      ink(ctx, pts, 3.2 * s, C.ink, { closed: draw >= 1, taper: draw < 1, seed: g.i, wvar: 0.55 });
    }
    ctx.restore();
    return rings;
  }

  // little illustrated icons sitting on the land (mountains, trees)
  function drawIcons(ctx, P, o = {}) {
    const s = (o.scale || 1) * (P.V.R / 392);
    const items = [];
    MOUNTAINS.forEach((m, i) => { const q = P.point(m[0], m[1]); if (q[2] > 0.18) items.push({ q, kind: 'm', sz: m[2], i }); });
    TREES.forEach((tr, i) => { const q = P.point(tr[0], tr[1]); if (q[2] > 0.25) items.push({ q, kind: 't', sz: tr[2], i }); });
    items.sort((a, b) => a.q[1] - b.q[1]);
    for (const it of items) {
      const z = it.q[2];
      const fs = Math.sqrt(z) * s;
      ctx.save();
      ctx.globalAlpha = clamp((z - 0.18) * 4) * (o.alpha === undefined ? 1 : o.alpha);
      ctx.translate(it.q[0], it.q[1]);
      if (it.kind === 'm') {
        const w = 15 * it.sz * fs, h = 17 * it.sz * fs;
        ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.1, -h); ctx.lineTo(w, 0); ctx.closePath();
        ctx.fillStyle = '#8a7a6a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-w * 0.1, -h); ctx.lineTo(w, 0); ctx.lineTo(w * 0.15, 0); ctx.closePath();
        ctx.fillStyle = '#6b5c50'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-w * 0.42, -h * 0.62); ctx.lineTo(-w * 0.1, -h); ctx.lineTo(w * 0.3, -h * 0.6); ctx.lineTo(w * 0.05, -h * 0.52); ctx.closePath();
        ctx.fillStyle = C.snow; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.1, -h); ctx.lineTo(w, 0);
        ctx.lineWidth = 2 * fs; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      } else {
        const rr = 5 * it.sz * fs;
        ctx.fillStyle = '#7a4a32'; ctx.fillRect(-rr * 0.18, -rr * 0.2, rr * 0.36, rr * 1.1);
        ctx.beginPath(); ctx.arc(0, -rr * 0.6, rr, 0, 7);
        ctx.fillStyle = '#2d7a3a'; ctx.fill();
        ctx.lineWidth = 1.6 * fs; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(-rr * 0.3, -rr * 0.9, rr * 0.35, 0, 7);
        ctx.fillStyle = '#7fbf5a'; ctx.fill();
      }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ ocean
  function oceanFill(ctx, x, y, w, h, seed = 9) {
    ctx.save();
    ctx.fillStyle = C.ocean;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    const pat = WX.pattern(ctx, WX.texWater);
    pat.setTransform(new DOMMatrix([0.8, 0, 0, 0.8, seed * 37, seed * 11]));
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  function drawRipples(ctx, P, t, alpha = 1, s = 1) {
    ctx.save();
    ctx.strokeStyle = rgba(C.foam, 0.7 * alpha);
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    for (const r of RIPPLES) {
      const q = P.point(r[0] + Math.sin(t * 0.8 + r[2] * 6) * 1.2, r[1]);
      if (q[2] < 0.2) continue;
      const L = (8 + 6 * r[2]) * Math.sqrt(q[2]) * s * (0.8 + 0.25 * Math.sin(t * 3 + r[2] * 9));
      ctx.moveTo(q[0] - L, q[1]);
      ctx.quadraticCurveTo(q[0] - L * 0.5, q[1] - L * 0.45, q[0], q[1]);
      ctx.quadraticCurveTo(q[0] + L * 0.5, q[1] + L * 0.45, q[0] + L, q[1]);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------------ scene B hooks (flat map under a camera)
  function camProjector(cam) {
    // flat map seen through scene B's camera: a k=0 projector whose output is transformed by the camera
    const P = projector({ k: 0, R: R0, cx: 0, cy: 0, lon: LON0, lat: 0 });
    const c = Math.cos(cam.th), s = Math.sin(cam.th);
    const xf = (q) => {
      const x = (q[0] - cam.c[0]) * cam.z, y = (q[1] - cam.c[1]) * cam.z;
      return [960 + x * c - y * s, 540 + x * s + y * c, q[2]];
    };
    return {
      V: { R: R0 * cam.z },
      ring: (pts) => { const o = P.ring(pts).map(xf); o.vis = pts.length; return o; },
      point: (lon, lat) => xf(P.point(lon, lat)),
    };
  }
  function africaMap() { return GEO.africa.map((p) => flat(p[0], p[1])); }
  function drawOceanFlat(ctx, t, cam) {
    oceanFill(ctx, -50, -50, 2020, 1180);
    const P = camProjector(cam);
    drawRipples(ctx, P, t, clamp((1.6 - Math.log(cam.z)) / 1.2), 1);
  }
  // the rest of the world appearing during the pull-back
  function drawWorldFlatReveal(ctx, t, cam) {
    const P = camProjector(cam);
    const t0 = T.continentsDraw;
    const afr = flat(20, 5);
    const reveal = (r) => {
      // nearer lands draw first
      const c = flat(r.pts[0][0], r.pts[0][1]);
      const d = r === BIG ? 0 : Math.hypot(c[0] - afr[0], c[1] - afr[1]) / 900;
      return ease.out2(clamp((t - t0 - d * 0.22) / 0.16));
    };
    // Africa itself is the morphing polygon until the very end, so Eurasia draws in on its own
    // and the merged Afro-Eurasian ring takes over once the morph has landed
    const handoff = t >= T.curlStart - 0.03;
    drawLands(ctx, P, {
      rings: handoff ? null : LAND.filter((r) => r !== BIG).concat([EURASIA]),
      reveal: (r) => (r === BIG ? 1 : reveal(r.eurasia ? BIG : r)),
      inkReveal: (r) => (r === BIG ? 1 : ease.inOut2(clamp((t - t0 - 0.05) / 0.3))),
      detailAlpha: inv(t0 + 0.15, t0 + 0.4, t),
    });
    drawIcons(ctx, P, { alpha: inv(t0 + 0.2, t0 + 0.4, t), scale: 0.9 });
  }

  // ------------------------------------------------------------------ the curl and the globe
  function view(t) {
    // curvature: the map rolls into a ball
    const ku = inv(T.curlStart, T.globeFormed - 0.08, t);
    const k = ease.inOut2(ku);
    // the camera pulls back while the sheet wraps, then eases in to frame the planet
    const R = lerp(R0, FINAL.R, ease.inOut2(ku)) - 92 * Math.sin(Math.PI * ease.inOut2(inv(T.curlStart, T.globeFormed + 0.05, t)));
    const cx = FINAL.cx;
    const cy = lerp(540, FINAL.cy, ease.inOut2(inv(T.curlStart + 0.1, T.globeFormed, t)));
    const lat = FINAL.lat * ease.inOut2(inv(T.curlStart, T.globeFormed, t));
    // longitude: drift while curling, wind up, whoosh round once, overshoot, settle; then a final nudge
    const L1 = LON0 - 10 * ease.inOut2(ku);
    const wind = 16 * Math.sin(Math.PI * 0.5 * inv(T.spinWindup, T.spinGo, t)) * (1 - inv(T.spinGo, T.spinGo + 0.12, t));
    const su = inv(T.spinGo, T.spinSettle, t);
    const target = FINAL.lon + 4 - 360; // spin westward, as the Earth turns
    const spinE = su <= 0 ? 0 : (su < 1 ? ease.inOut3(su) : 1);
    let lon = L1 + wind + (target - (LON0 - 10)) * spinE;
    // overshoot and settle after the spin
    const st = t - T.spinSettle;
    if (st > 0) lon += -14 * wobble(st, 1.6, 4.2);
    // the tiny final rotation under the title
    lon += -4 * ease.inOut2(inv(T.finalTurn[0], T.finalTurn[1], t));
    // squash & stretch: the globe bulges while it spins hard
    const speed = su > 0 && su < 1 ? Math.sin(Math.PI * su) : 0;
    const bump = wobble(t - T.globeFormed, 2.6, 6) * 0.05;
    const sx = 1 + 0.07 * speed - bump, sy = 1 - 0.05 * speed + bump;
    return { k, R, cx, cy, lon, lat, sx, sy, speed, ku };
  }

  function drawBackdrop(ctx, t, V) {
    const cx = V.cx, cy = V.cy;
    const g = ctx.createRadialGradient(cx, cy, 120, cx, cy, 1250);
    g.addColorStop(0, '#fff1c9');
    g.addColorStop(0.32, '#fbdca0');
    g.addColorStop(0.62, '#f2b27c');
    g.addColorStop(1, '#d9774f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
    // painted sunburst, turning slowly
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.06);
    const n = 28;
    ctx.beginPath();
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a0) * 1600, Math.sin(a0) * 1600);
      ctx.lineTo(Math.cos(a1) * 1600, Math.sin(a1) * 1600);
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(255,248,226,0.22)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = WX.pattern(ctx, WX.texWater);
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  }
  function drawSkyClouds(ctx, t, a) {
    if (a <= 0) return;
    const list = [[250 + t * 9, 230, 92, 1], [1680 - t * 8, 205, 80, 2], [205 - t * 6, 900, 74, 3], [1720 + t * 7, 885, 96, 4]];
    for (const [x, y, s, seed] of list) {
      WX.cloud(ctx, x, y + 8 * Math.sin(t * 1.3 + seed), s * a, { seed: seed + 30, shadeColor: '#efc9a8', line: 3.4 });
    }
  }

  // the ocean sheet as a mesh of little quads (exact for any curvature)
  function sheetPath(ctx, P) {
    const step = 6;
    for (let la = -90; la < 90; la += step) {
      for (let lo = -180; lo < 180; lo += step) {
        const q = [
          P.fromRot(lo * D2R, la * D2R), P.fromRot((lo + step) * D2R, la * D2R),
          P.fromRot((lo + step) * D2R, (la + step) * D2R), P.fromRot(lo * D2R, (la + step) * D2R),
        ];
        if (q[0][2] < 0 && q[1][2] < 0 && q[2][2] < 0 && q[3][2] < 0) continue;
        // keep winding consistent (front-facing quads only)
        const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
        if (area > 0) continue;
        ctx.moveTo(q[0][0], q[0][1]);
        ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[3][0], q[3][1]);
        ctx.closePath();
      }
    }
  }
  // the rolled-up edge of the sheet, inked with a foamy lip
  function sheetEdge(P) {
    const pts = [];
    const push = (lo, la) => pts.push(P.fromRot(lo * D2R, la * D2R));
    for (let lo = -180; lo <= 180; lo += 4) push(lo, 90);
    for (let la = 90; la >= -90; la -= 4) push(180, la);
    for (let lo = 180; lo >= -180; lo -= 4) push(lo, -90);
    for (let la = -90; la <= 90; la += 4) push(-180, la);
    return pts;
  }

  function drawGlobe(ctx, t, V) {
    const P = projector(V);
    const R = Math.min(P.Rk, V.R * 4); // radius of the sphere the sheet currently lies on
    const isGlobe = V.k > 0.999;
    const sphereA = clamp((V.k - 0.75) / 0.25);
    // glow behind the planet
    if (sphereA > 0) {
      const g = ctx.createRadialGradient(V.cx, V.cy, R * 0.9, V.cx, V.cy, R * 1.35);
      g.addColorStop(0, `rgba(255,236,170,${0.85 * sphereA})`);
      g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(V.cx, V.cy, R * 1.4, 0, 7); ctx.fill();
    }
    // ocean
    ctx.save();
    ctx.beginPath();
    if (isGlobe) ctx.ellipse(V.cx, V.cy, V.R * V.sx, V.R * V.sy, 0, 0, 7);
    else sheetPath(ctx, P);
    ctx.clip();
    oceanFill(ctx, 0, 0, 1920, 1080);
    // depth: lighter seas toward the light
    if (sphereA > 0) {
      const lg = ctx.createRadialGradient(V.cx - R * 0.4, V.cy - R * 0.45, R * 0.1, V.cx - R * 0.2, V.cy - R * 0.2, R * 1.3);
      lg.addColorStop(0, `rgba(120,200,220,${0.6 * sphereA})`);
      lg.addColorStop(1, 'rgba(120,200,220,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, 1920, 1080);
    }
    drawRipples(ctx, P, t, 1, V.R / 392);
    // ocean swell rings radiating as the continents settle
    const rs = t - T.globeFormed;
    if (rs > 0 && rs < 0.9) {
      [[-25, 15], [70, -10], [-150, 5]].forEach((c) => {
        const q = P.point(c[0], c[1]);
        if (q[2] < 0.2) return;
        const rr = (20 + rs * 150) * Math.sqrt(q[2]);
        ctx.beginPath(); ctx.ellipse(q[0], q[1], rr, rr * 0.7 * Math.sqrt(q[2]), 0, 0, 7);
        ctx.lineWidth = 3.5; ctx.strokeStyle = rgba(C.foam, 0.7 * (1 - rs / 0.9)); ctx.stroke();
      });
    }
    const lands = drawLands(ctx, P, { scale: V.R / 392 });
    drawIcons(ctx, P, {});
    drawGlobeClouds(ctx, t, P);
    drawGlobeBoat(ctx, t, P);
    // sphere cel-shading: a hard-edged shadow crescent with pencil hatching, and a lit rim
    if (sphereA > 0) {
      ctx.globalAlpha = sphereA;
      const sh = (c) => { c.ellipse(V.cx, V.cy, R * V.sx, R * V.sy, 0, 0, 7); };
      WX.celShade(ctx, sh, { dx: -R * 0.2, dy: -R * 0.24, color: 'rgba(14,30,70,0.42)', alpha: 1, hatch: 0.22, hx: V.cx, hy: V.cy }, false);
      WX.celShade(ctx, sh, { dx: -R * 0.06, dy: -R * 0.08, color: 'rgba(14,30,70,0.22)', alpha: 1 }, false);
      WX.celShade(ctx, sh, { dx: R * 0.05, dy: R * 0.06, color: 'rgba(255,246,220,0.35)', alpha: 1 }, false);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // spin smears: hand-drawn speed lines hugging the limb
    if (V.speed > 0.05) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const lat = -55 + i * 18;
        const ry = R * Math.cos(lat * D2R);
        const yy = V.cy - R * Math.sin(lat * D2R) * Math.cos(V.lat * D2R);
        const a0 = -0.9 + i * 0.07, a1 = a0 + 0.9 * V.speed;
        ctx.beginPath();
        ctx.ellipse(V.cx, yy, ry * V.sx * 1.03, ry * 0.22, 0, a0, a1);
        ctx.lineWidth = (6 - Math.abs(i - 3)) * V.speed + 1;
        ctx.strokeStyle = rgba(C.creamLight, 0.75 * V.speed);
        ctx.stroke();
      }
      // outer smear arcs off the trailing side
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(V.cx, V.cy, R * (1.08 + i * 0.06), -0.6 - i * 0.2, -0.6 - i * 0.2 + 0.8 * V.speed);
        ctx.lineWidth = 5 - i; ctx.strokeStyle = rgba(C.ink, 0.5 * V.speed);
        ctx.stroke();
      }
      ctx.restore();
    }
    // outline: the sheet's rolling edge while curling, then the planet's inked limb
    if (!isGlobe) {
      const edge = sheetEdge(P);
      // only the parts of the edge facing us
      let seg = [];
      const flush = () => { if (seg.length > 2) { ink(ctx, seg, 16, C.foam, { seed: 7, wvar: 0.4 }); ink(ctx, seg, 4, C.ink, { seed: 8 }); } seg = []; };
      for (const q of edge) { if (q[2] > 0.02) seg.push(q); else flush(); }
      flush();
    }
    if (sphereA > 0) {
      const limb = [];
      for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; limb.push([V.cx + Math.cos(a) * R * V.sx, V.cy + Math.sin(a) * R * V.sy]); }
      ctx.globalAlpha = sphereA;
      ink(ctx, boil(limb, 1.2, 99), 7, C.ink, { closed: true, seed: 99, wvar: 0.45 });
      // cartoon shine
      ctx.save();
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(V.cx, V.cy, R * 0.86, Math.PI * 1.08, Math.PI * 1.32);
      ctx.lineWidth = R * 0.045; ctx.strokeStyle = 'rgba(255,253,240,0.85)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(V.cx, V.cy, R * 0.86, Math.PI * 1.37, Math.PI * 1.41);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    return lands;
  }

  function drawGlobeClouds(ctx, t, P) {
    const s = P.V.R / 392;
    const appear = ease.out2(inv(T.curlStart, T.curlStart + 0.35, t));
    if (appear <= 0) return;
    for (const c of GLOBE_CLOUDS) {
      const q = P.point(c[0] + t * 6, c[1]);
      if (q[2] < 0.12) continue;
      const z = q[2];
      const sz = 44 * c[2] * s * Math.sqrt(z) * appear;
      ctx.save();
      ctx.globalAlpha = clamp((z - 0.12) * 4) * appear;
      // shadow cast on the sea/land below
      ctx.fillStyle = 'rgba(10,30,50,0.25)';
      ctx.beginPath(); ctx.ellipse(q[0] + sz * 0.35, q[1] + sz * 0.45, sz * 0.95, sz * 0.4, 0, 0, 7); ctx.fill();
      WX.cloud(ctx, q[0], q[1], sz, { seed: Math.round(c[0]), line: 2.6 });
      ctx.restore();
    }
  }
  // the little boat from scene B keeps sailing on the planet
  let boatLL = null;
  function drawGlobeBoat(ctx, t, P) {
    if (!boatLL) {
      const m = WX.sceneB ? WX.sceneB.boatMapAt(T.curlStart) : flat(50, -5);
      boatLL = [LON0 + m[0] / R0 / D2R, -m[1] / R0 / D2R];
    }
    const dt = t - T.curlStart;
    const lon = boatLL[0] + dt * 9, lat = boatLL[1] + dt * 3;
    const q = P.point(lon, lat), q2 = P.point(lon + 0.5, lat + 0.15);
    if (q[2] < 0.25) return;
    const s = 0.42 * Math.sqrt(q[2]) * (P.V.R / 392);
    ctx.save();
    ctx.translate(q[0], q[1]);
    const flip = q2[0] < q[0] ? -1 : 1;
    ctx.rotate(0.12 * Math.sin(t * 7));
    ctx.scale(s * flip, s);
    ctx.fillStyle = C.terracotta;
    ctx.beginPath(); ctx.moveTo(-44, -6); ctx.lineTo(44, -10); ctx.lineTo(34, 14); ctx.lineTo(-32, 16); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -86); ctx.lineTo(44, -20); ctx.lineTo(4, -14); ctx.closePath();
    ctx.fillStyle = C.creamLight; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  WX.world = {
    flat, africaMap, projector, drawLandShape, drawLandInk, drawOceanFlat, drawWorldFlatReveal, drawLands, FINAL,
    view, drawGlobe, drawBackdrop,
  };

  WX.sceneC = {
    draw(ctx, t) {
      const V = view(t);
      drawBackdrop(ctx, t, V);
      drawSkyClouds(ctx, t, ease.outBack(inv(T.globeFormed - 0.3, T.globeFormed + 0.3, t)));
      drawGlobe(ctx, t, V);
      if (WX.title) WX.title.draw(ctx, t, V);
    },
  };
})();
