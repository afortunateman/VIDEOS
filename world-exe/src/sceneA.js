// Scene A (0–2.5s): an illustrated ocean; a little wave rolls, curls and crashes; the sea blooms
// into a valley of hills with a river carved by the wave; mountains are inked in and pop up,
// clouds hop across the sky, trees sprout and sway, and the camera glides up the river.
// Ends with the centre mountain stretching up and the camera swooping into it (handoff to B).
(function () {
  const WX = window.WX, C = WX.C;
  const { clamp, lerp, inv, ease, spring, wobble, vnoise, fbm, boil, trace, ink, stroke, paint, mix, rgba, rng } = WX;
  const T = window.WX_TIMELINE.cues;

  const HZ = 430;          // horizon line
  const CAMH = 640;        // camera height (ground projection constant)
  const ROW0 = 0.5, ROWDZ = 0.58, NROWS = 46;
  const RIVER_HW = 150;

  const riverX = (z) => 310 * Math.sin(0.8 * z + 0.15) + 120 * Math.sin(1.85 * z + 2.1);

  // ------------------------------------------------------------------ camera
  function camZ(t) {
    // gentle glide up the river that accelerates into the swoop
    const u = inv(T.riverDolly - 0.1, 2.5, t);
    return 2.6 * u * u * (1.15 - 0.15 * u);
  }
  function camera(t) {
    const z = camZ(t);
    return { z, x: riverX(z + 1.6) * 0.9 };
  }
  const project = (xw, dz, cam) => [960 + (xw - cam.x) / dz, HZ + CAMH / dz];

  // ------------------------------------------------------------------ land bloom (sea -> land)
  const CRASH = [0, 868];
  { const dz = CAMH / (CRASH[1] - HZ); CRASH[0] = project(riverX(dz), dz, camera(T.waveCrash))[0]; } // the wave crashes into the river's mouth
  const BLOOM_MAX = 1700, BLOOM_DUR = 0.5;
  const bloomR = (t) => BLOOM_MAX * ease.out2(inv(T.landBloom, T.landBloom + BLOOM_DUR, t));
  // time at which the bloom front reaches distance d
  const bloomArrive = (d) => T.landBloom + BLOOM_DUR * (1 - Math.sqrt(Math.max(0, 1 - Math.min(d, BLOOM_MAX * 0.999) / BLOOM_MAX)));
  function rise(sx, sy, t) {
    const d = Math.hypot(sx - CRASH[0], sy - CRASH[1]);
    const tau = t - bloomArrive(d);
    return tau <= 0 ? 0 : spring(tau, 2.1, 5.2);
  }
  function bloomPoly(t, grow = 0) {
    const R = bloomR(t) + grow;
    const pts = [];
    const b = WX.frame.boil;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r = R * (1 + 0.05 * vnoise(i * 0.45, b * 0.7) + 0.035 * Math.sin(a * 7 + 1.3));
      pts.push([CRASH[0] + Math.cos(a) * r, CRASH[1] + Math.sin(a) * r * 0.82]);
    }
    return pts;
  }

  // ------------------------------------------------------------------ terrain
  function hillH(xw, k, z) {
    const d = Math.abs(xw - riverX(z));
    const valley = 0.55 + 0.9 * WX.smooth(inv(RIVER_HW, 1100, d));
    const notch = WX.smooth(inv(RIVER_HW * 1.0, RIVER_HW * 3.2, d));
    const n = 0.5 + 0.5 * fbm(xw * 0.0014 + k * 3.17, k * 0.71, 2);
    return (150 + 260 * n) * valley * notch;
  }
  function swellH(xw, k, t) {
    return 20 + 12 * Math.sin(xw * 0.0042 + t * 2.3 + k * 1.7) + 9 * vnoise(xw * 0.004 + t * 0.5, k * 1.3);
  }
  const ROW_GREENS = ['#4a9a47', '#2f7d3f', '#6aac4f', '#3a8a43', '#86b851', '#45944a', '#327a45'];
  const LAND_HAZE = '#cfe0c4', SEA_HAZE = '#b9dcdc';

  // trees per row (deterministic)
  const TREES = [];
  for (let k = 0; k < NROWS; k++) {
    const r = rng(1000 + k * 17);
    const z = ROW0 + k * ROWDZ;
    const cnt = 2 + Math.floor(r() * 4);
    const list = [];
    for (let i = 0; i < cnt; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const off = RIVER_HW * (2.0 + r() * 3.5) + r() * 520;
      list.push({ xw: riverX(z) + side * off, kind: r() < 0.38 ? 'pine' : r() < 0.6 ? 'tall' : 'round', size: 150 + r() * 90, seed: k * 7 + i, pop: T.treePops[(k * 3 + i * 5) % T.treePops.length] });
    }
    TREES.push(list);
  }

  // ------------------------------------------------------------------ rows
  function ridge(k, dz, cam, t, landAmt) {
    const z = ROW0 + k * ROWDZ;
    const base = HZ + CAMH / dz;
    const pts = [];
    for (let sx = -100; sx <= 2020; sx += 24) {
      const xw = cam.x + (sx - 960) * dz;
      let h = swellH(xw, k, t);
      if (landAmt) {
        const m = landAmt === 1 ? 1 : rise(sx, base, t);
        h = lerp(h, hillH(xw, k, z), m);
      }
      pts.push([sx, base - h / dz]);
    }
    return { pts, base, z };
  }

  // the sea is its own set of finer swell rows (independent of the hill rows)
  const SEA_DZ = 0.3, SEA_N = 54;
  const SUN = [1560, 175];
  function seaRidge(j, dz, cam, t) {
    const base = HZ + CAMH / dz;
    const pts = [];
    for (let sx = -100; sx <= 2020; sx += 24) {
      const xw = cam.x + (sx - 960) * dz;
      pts.push([sx, base - swellH(xw, j, t) / dz]);
    }
    return { pts, base };
  }
  function drawSeaRows(ctx, t, cam) {
    // far-to-near; near rows deep blue, far rows misted
    const g = ctx.createLinearGradient(0, HZ, 0, 1080);
    g.addColorStop(0, SEA_HAZE); g.addColorStop(0.25, C.oceanLight); g.addColorStop(1, C.deep);
    ctx.fillStyle = g;
    ctx.fillRect(-200, HZ - 2, 2320, 1300);
    const waveDz = CAMH / (WAVE_Y0 - HZ);
    let waveDrawn = false;
    for (let j = SEA_N - 1; j >= 0; j--) {
      const dz = 0.62 + j * SEA_DZ;
      if (dz > 15) continue;
      if (!waveDrawn && dz < waveDz) { drawWave(ctx, t); waveDrawn = true; }
      const fog = Math.pow(clamp((dz - 0.8) / 11), 0.7);
      const { pts, base } = seaRidge(j, dz, cam, t);
      const col = mix(j % 2 ? C.ocean : '#24639b', SEA_HAZE, fog * 0.85);
      ctx.beginPath();
      trace(ctx, pts.concat([[2020, 1300], [-100, 1300]]), true);
      const gr = ctx.createLinearGradient(0, base - 40 / dz, 0, base + 120 / dz);
      gr.addColorStop(0, mix(C.oceanMid, SEA_HAZE, fog * 0.8));
      gr.addColorStop(1, col);
      ctx.fillStyle = gr;
      ctx.fill();
      // foam crests: broken cream dashes riding the swells
      const w = clamp(6 / Math.sqrt(dz), 1, 7);
      let seg = [];
      for (let i = 0; i < pts.length; i++) {
        const xw = cam.x + (pts[i][0] - 960) * dz;
        const on = vnoise(xw * 0.005 + j * 4.1 - t * 0.7, j * 2.3) > 0.2;
        if (on) seg.push(pts[i]);
        if ((!on || i === pts.length - 1) && seg.length > 2) { ink(ctx, seg, w, mix(C.foam, SEA_HAZE, fog * 0.7), { seed: j * 3 + i }); seg = []; }
        else if (!on) seg = [];
      }
      // sun glitter: a column of warm dashes under the sun
      const spread = 40 + 260 / dz;
      ctx.strokeStyle = rgba(C.yellowLight, 0.9 - fog * 0.4);
      ctx.lineCap = 'round';
      ctx.lineWidth = clamp(4.5 / Math.sqrt(dz), 1.2, 6);
      ctx.beginPath();
      for (let q = 0; q < 3; q++) {
        const h = WX.hash2(j * 7 + q, WX.frame.boil % 4);
        const x = SUN[0] + (h - 0.5) * 2 * spread;
        const y = base - 6 / dz + q * 3;
        const L = (14 + 30 * WX.hash2(q, j)) / Math.sqrt(dz);
        if (h > 0.08) { ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); }
      }
      ctx.stroke();
    }
    if (!waveDrawn) drawWave(ctx, t);
  }

  function drawRiverSegment(ctx, k, cam, t, zFront) {
    const zFar = ROW0 + k * ROWDZ, zNear = zFar - ROWDZ;
    if (zNear > zFront) return;
    const z1 = Math.min(zFar, zFront);
    const Lb = [], Rb = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const z = lerp(zNear, z1, i / steps);
      const dz = z - cam.z;
      if (dz < 0.32) continue;
      const xr = riverX(z);
      Lb.push(project(xr - RIVER_HW, dz, cam));
      Rb.push(project(xr + RIVER_HW, dz, cam));
    }
    if (Lb.length < 2) return;
    const dzMid = (zNear + z1) / 2 - cam.z;
    const fog = Math.pow(clamp((dzMid - 0.8) / 11), 0.7);
    // sandy banks (only the two sides are stroked, so segments join seamlessly)
    const bankW = clamp(16 / Math.sqrt(Math.max(dzMid, 0.3)), 2, 22);
    stroke(ctx, Lb, bankW, mix(C.creamDark, LAND_HAZE, fog));
    stroke(ctx, Rb, bankW, mix(C.creamDark, LAND_HAZE, fog));
    const poly = Lb.concat(Rb.slice().reverse());
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (const p of poly) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fillStyle = mix(C.oceanMid, SEA_HAZE, fog * 0.8);
    ctx.fill();
    // a lighter current down the middle, as a continuous inner ribbon
    const inner = Lb.map((p, i) => [lerp(p[0], Rb[i][0], 0.3), lerp(p[1], Rb[i][1], 0.3)])
      .concat(Rb.map((p, i) => [lerp(Lb[i][0], p[0], 0.62), lerp(Lb[i][1], p[1], 0.62)]).reverse());
    ctx.beginPath();
    ctx.moveTo(inner[0][0], inner[0][1]);
    for (const p of inner) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fillStyle = mix('#5aaed0', SEA_HAZE, fog * 0.7);
    ctx.fill();
    // ink banks
    const lw = clamp(3.4 / Math.sqrt(dzMid), 0.8, 4.8);
    stroke(ctx, Lb.map((p) => [p[0] - bankW * 0.45, p[1]]), lw, mix(C.ink, LAND_HAZE, fog * 0.8));
    stroke(ctx, Rb.map((p) => [p[0] + bankW * 0.45, p[1]]), lw, mix(C.ink, LAND_HAZE, fog * 0.8));
    // ripples drifting downstream
    for (let j = 0; j < 3; j++) {
      const zz = zNear + ((j * 0.37 + 0.15 + t * 0.7 + k * 0.13) % 1) * ROWDZ;
      if (zz > z1) continue;
      const dz = zz - cam.z;
      if (dz < 0.4) continue;
      const xr = riverX(zz) + [-0.45, 0.1, 0.5][j] * RIVER_HW;
      const p = project(xr, dz, cam);
      const s = (18 + 10 * j) / dz;
      ctx.beginPath();
      ctx.moveTo(p[0] - s, p[1]);
      ctx.quadraticCurveTo(p[0], p[1] - s * 0.3, p[0] + s, p[1]);
      ctx.lineWidth = clamp(4.5 / dz, 0.8, 5); ctx.strokeStyle = rgba(C.foam, 0.8 * (1 - fog)); ctx.stroke();
    }
    // the surge front: the crashed wave's water racing up the new river
    if (zFront < zFar + 0.001 && zFront > zNear) {
      const dz = zFront - cam.z;
      if (dz > 0.4) {
        const xr = riverX(zFront);
        const a = project(xr - RIVER_HW * 1.1, dz, cam), b2 = project(xr + RIVER_HW * 1.1, dz, cam);
        const m = [(a[0] + b2[0]) / 2, a[1] - 26 / dz];
        ink(ctx, [a, m, b2], clamp(26 / dz, 3, 40), C.foam, { seed: k });
      }
    }
  }

  function drawLandRows(ctx, t, cam, landAmt) {
    ctx.fillStyle = LAND_HAZE;
    ctx.fillRect(-200, HZ - 2, 2320, 80);
    const zFront = cam.z + lerp(0.4, 16, ease.out2(inv(T.waveCrash, T.waveCrash + 0.7, t)));
    for (let k = NROWS - 1; k >= 0; k--) {
      const zk = ROW0 + k * ROWDZ;
      const dz = zk - cam.z;
      if (dz < 0.42 || dz > 15.5) continue;
      const fog = Math.pow(clamp((dz - 0.8) / 11), 0.7);
      const { pts, base } = ridge(k, dz, cam, t, landAmt);
      const baseCol = ROW_GREENS[k % ROW_GREENS.length];
      ctx.beginPath();
      trace(ctx, pts.concat([[2020, 1400], [-100, 1400]]), true);
      const top = Math.min(...pts.map((p) => p[1]));
      const gr = ctx.createLinearGradient(0, top, 0, base + 30 / dz);
      gr.addColorStop(0, mix(mix(baseCol, '#c3dd7a', 0.42), LAND_HAZE, fog));
      gr.addColorStop(0.55, mix(baseCol, LAND_HAZE, fog));
      gr.addColorStop(1, mix(mix(baseCol, C.greenDeep, 0.55), LAND_HAZE, fog));
      ctx.fillStyle = gr;
      ctx.fill();
      // cel-shaded hollow: darker band hugging each ridge's underside
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.22 * (1 - fog);
      ctx.drawImage(WX.texHatch, 0, top + 40 / dz, 1920, 180 / dz);
      ctx.restore();
      // grass tufts on near ridges
      if (dz < 3.5) {
        ctx.strokeStyle = mix(C.greenDeep, LAND_HAZE, fog);
        ctx.lineWidth = clamp(3 / dz, 0.8, 3.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 2; i < pts.length - 1; i += 7) {
          const p = pts[i + (k % 3)] || pts[i];
          const h = (16 + 10 * WX.hash2(i, k)) / dz;
          const lean = Math.sin(t * 3 + i) * 0.3;
          for (let q = -1; q <= 1; q++) {
            ctx.moveTo(p[0] + q * h * 0.25, p[1] + h * 0.35);
            ctx.quadraticCurveTo(p[0] + q * h * 0.3, p[1] - h * 0.2, p[0] + q * h * 0.55 + lean * h, p[1] - h * (q ? 0.45 : 0.7));
          }
        }
        ctx.stroke();
      }
      // ink ridge line (fades into the haze with distance)
      if (fog < 0.85) ink(ctx, pts, clamp(5 / Math.sqrt(dz), 1, 6.5), mix(C.ink, LAND_HAZE, fog * 1.1), { seed: k * 13, taper: false, wvar: 0.55 });
      drawRiverSegment(ctx, k, cam, t, zFront);
      // flowers on the nearest slopes
      if (dz < 2.2) {
        const r = rng(500 + k);
        for (let i = 0; i < 6; i++) {
          const sx = r() * 1920, pi = Math.round((sx + 100) / 24);
          const p = pts[clamp(pi, 0, pts.length - 1)];
          const yy = p[1] + (20 + r() * 50) / dz;
          const col = [C.yellow, C.cream, C.terraLight][i % 3];
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(sx, yy, 4.5 / dz, 0, 7); ctx.fill();
        }
      }
      // trees growing on this ridge
      for (const tr of TREES[k]) {
        const sx = 960 + (tr.xw - cam.x) / dz;
        if (sx < -150 || sx > 2070) continue;
        const h = lerp(swellH(tr.xw, k, t), hillH(tr.xw, k, zk), landAmt === 1 ? 1 : rise(sx, base, t));
        const sy = base - h / dz + 4 / dz;
        const pt = t - Math.max(tr.pop, bloomArrive(Math.hypot(sx - CRASH[0], sy - CRASH[1])) + 0.05);
        if (pt <= 0) continue;
        const s = spring(pt, 2.6, 6.5);
        const wob = wobble(pt, 3.2, 7);
        const sway = 0.07 * Math.sin(t * 3.1 + tr.xw * 0.01) + 0.05 * Math.sin(t * 1.7 + k);
        ctx.save();
        ctx.globalAlpha = 1 - fog * 0.6;
        WX.tree(ctx, sx, sy, (tr.size / dz) * 0.5, { kind: tr.kind, sway, seed: tr.seed, sy: s * (1 + 0.3 * wob), sx: s * (1 - 0.18 * wob) });
        ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------------ mountains
  const MOUNTAINS = [
    { x: 455, w: 600, h: 255, peak: 0.46, cue: T.mountainPops[0], seed: 3, col: '#6d93b7' },
    { x: 1545, w: 560, h: 240, peak: 0.55, cue: T.mountainPops[1], seed: 9, col: '#7097b8' },
    { x: 1005, w: 760, h: 365, peak: 0.5, cue: T.mountainPops[2], seed: 5, col: '#5f89b2' },
  ];
  function mountainShape(m) {
    const N = 34, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const prof = u < m.peak ? u / m.peak : (1 - u) / (1 - m.peak);
      const shoulder = 0.07 * Math.sin(u * Math.PI * 3 + m.seed) * prof * (1 - prof) * 4;
      const y = -m.h * (Math.pow(prof, 1.25) + shoulder + 0.03 * vnoise(u * 11 + m.seed, 1));
      pts.push([(u - 0.5) * m.w, Math.min(8, y + 8)]);
    }
    return pts;
  }
  MOUNTAINS.forEach((m) => {
    m.pts = mountainShape(m);
    const ys = -m.h * 0.6;
    // snow cap: silhouette above snowline + a zig-zag drip edge
    const top = m.pts.filter((p) => p[1] < ys);
    const xl = top[0][0], xr = top[top.length - 1][0];
    const drips = [];
    const nd = 6;
    for (let i = nd; i >= 0; i--) {
      const x = lerp(xl, xr, i / nd);
      drips.push([x, ys + (i % 2 ? 26 : -4) * (m.h / 300)]);
    }
    m.snow = top.concat(drips);
    // shadow face: right of a ridge line falling from the peak
    const pk = m.pts.reduce((a, p) => (p[1] < a[1] ? p : a));
    m.peakPt = pk;
    const ridgeL = [pk, [pk[0] + m.w * 0.03, pk[1] * 0.62], [pk[0] - m.w * 0.02, pk[1] * 0.3], [pk[0] + m.w * 0.06, 8]];
    const right = m.pts.filter((p) => p[0] > pk[0]);
    m.shadow = ridgeL.concat(right.slice().reverse());
  });

  // returns {sx, sy} squash/stretch for a mountain at time t (B extends the centre one)
  function mountainState(m, t) {
    const lt = t - m.cue;
    const pen = clamp((t - (m.cue - 0.2)) / 0.2);
    if (pen <= 0) return null;
    const pop = lt > 0 ? spring(lt, 2.2, 6) : 0;
    const wob = wobble(lt, 2.2, 6);
    return { pen, fill: clamp(lt / 0.16), pop, sy: lt > 0 ? pop : 0, sx: 1 - 0.14 * wob, snow: lt > 0.06 ? spring(lt - 0.06, 3, 7) : 0 };
  }

  function drawMountain(ctx, m, st, extraSY = 1, extraSX = 1) {
    const base = [m.x, HZ];
    ctx.save();
    ctx.translate(base[0], base[1]);
    // pencil under-drawing: the silhouette inked on before the body pops
    if (st.pen < 1 || st.pop < 0.02) {
      const line = boil(WX.partial(m.pts, ease.inOut2(st.pen)), 1.6, m.seed);
      ink(ctx, line, 4.2, C.ink, { seed: m.seed, taperEnd: st.pen < 1 });
      if (st.pen < 1) {
        const tip = line[line.length - 1];
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(tip[0], tip[1], 4.5, 0, 7); ctx.fill();
      }
    }
    if (st.pop > 0.001) {
      const sy = Math.max(0.001, st.pop) * extraSY, sx = st.sx * extraSX;
      ctx.scale(sx, sy);
      const P = boil(m.pts, 1.5 / Math.max(0.5, sy), m.seed);
      const shape = (c) => trace(c, P, true);
      // watercolour wash flooding down from the inked line
      ctx.save();
      ctx.beginPath();
      ctx.rect(-m.w, -m.h * 1.2, m.w * 2, m.h * 1.25 * ease.out2(st.fill) + 4);
      ctx.clip();
      paint(ctx, shape, m.col, {
        tex: 0.6, texSeed: m.seed,
        light: { dx: 26, dy: 10, color: mix(m.col, '#cfe6ee', 0.45), alpha: 0.9 },
      });
      paint(ctx, (c) => trace(c, boil(m.shadow, 1.2, m.seed + 2), true), mix(m.col, '#26406b', 0.42), { tex: 0.4, texSeed: m.seed + 1 });
      ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip();
      ctx.globalAlpha = 0.25;
      ctx.drawImage(WX.texHatch, m.peakPt[0], -m.h, m.w * 0.5, m.h * 1.1);
      ctx.restore();
      ctx.restore();
      // snow cap pops a beat later
      if (st.snow > 0.01) {
        ctx.save();
        const pk = m.peakPt;
        ctx.translate(pk[0], pk[1]);
        ctx.scale(st.snow, st.snow);
        ctx.translate(-pk[0], -pk[1]);
        const S = boil(m.snow, 1.3, m.seed + 4);
        paint(ctx, (c) => trace(c, S, true), C.snow, {
          tex: 0.25, texSeed: 4,
          shade: { dx: -18, dy: -6, color: '#cddbe6', alpha: 1 },
        });
        ink(ctx, S, 3, C.ink, { closed: true, seed: m.seed + 5, wvar: 0.5 });
        ctx.restore();
      }
      ink(ctx, P, 5.2 / Math.sqrt(Math.max(1, (sx + sy) / 2)), C.ink, { closed: false, seed: m.seed, taper: true, wvar: 0.5 });
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ sky
  function drawSky(ctx, t) {
    const g = ctx.createLinearGradient(0, -400, 0, HZ + 20);
    g.addColorStop(0, '#5fa9c6');
    g.addColorStop(0.45, '#9fd2d6');
    g.addColorStop(0.82, '#e9e6c9');
    g.addColorStop(1, '#f9e3b7');
    ctx.fillStyle = g;
    ctx.fillRect(-3000, -3000, 8000, 3000 + HZ + 40);
    // long painterly streaks
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = C.creamLight;
    ctx.lineCap = 'round';
    const r = rng(77);
    for (let i = 0; i < 7; i++) {
      const y = 120 + r() * 230, x = r() * 1700 - 100, L = 200 + r() * 420;
      ctx.lineWidth = 4 + r() * 8;
      ctx.beginPath();
      ctx.moveTo(x + t * 6, y);
      ctx.quadraticCurveTo(x + L * 0.5 + t * 6, y - 6, x + L + t * 6, y + 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawSun(ctx, t, x, y, r) {
    const b = WX.frame.boil;
    ctx.save();
    ctx.translate(x, y);
    // soft glow
    const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 3.2);
    g.addColorStop(0, 'rgba(255,226,138,0.55)');
    g.addColorStop(1, 'rgba(255,226,138,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 3.2, 0, 7); ctx.fill();
    // hand-drawn rays, turning slowly and breathing
    ctx.rotate(t * 0.25);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const L = r * (1.55 + 0.18 * Math.sin(t * 4 + i * 1.7) + (i % 2 ? 0.25 : 0));
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.1) * r * 1.15, Math.sin(a - 0.1) * r * 1.15);
      ctx.quadraticCurveTo(Math.cos(a) * L * 0.9 + vnoise(i, b) * 3, Math.sin(a) * L * 0.9, Math.cos(a) * L, Math.sin(a) * L);
      ctx.quadraticCurveTo(Math.cos(a + 0.02) * L * 0.9, Math.sin(a + 0.02) * L * 0.9, Math.cos(a + 0.1) * r * 1.15, Math.sin(a + 0.1) * r * 1.15);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? C.yellowLight : C.yellow;
      ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = rgba(C.terracotta, 0.8); ctx.stroke();
    }
    ctx.rotate(-t * 0.25);
    const disc = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; disc.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const D = boil(disc, 1.4, 31);
    paint(ctx, (c) => trace(c, D, true), C.yellow, {
      tex: 0.35, texSeed: 2,
      shade: { dx: -r * 0.18, dy: -r * 0.2, color: C.yellowDeep, alpha: 1 },
      light: { dx: r * 0.22, dy: r * 0.25, color: C.yellowLight, alpha: 1 },
    });
    ink(ctx, D, 4, C.terraDark, { closed: true, seed: 3 });
    ctx.restore();
  }

  // bouncing clouds: they hop along an invisible floor, squashing on each landing
  const HOPPERS = [
    { y: 250, x0: -260, vx: 640, s: 52, lead: 0, seed: 1 },
    { y: 165, x0: 120, vx: 560, s: 38, lead: 0.125, seed: 2 },
    { y: 315, x0: 640, vx: 600, s: 30, lead: 0.06, seed: 3 },
  ];
  function drawHoppers(ctx, t) {
    const start = T.cloudBounces[0] - 0.36;
    if (t < start) return;
    const period = T.cloudBounces[1] - T.cloudBounces[0];
    for (const h of HOPPERS) {
      const lt = t - start;
      const x = h.x0 + h.vx * lt;
      const ph = (t - T.cloudBounces[0] + h.lead) / period; // contacts at integers
      const frac = ph - Math.floor(ph);
      const arc = Math.sin(Math.PI * frac);
      const y = h.y - h.s * 1.5 * arc;
      const near = Math.min(frac, 1 - frac);
      const sq = 1 + 0.42 * Math.exp(-Math.pow(near / 0.07, 2)) - 0.1 * Math.exp(-Math.pow((frac - 0.5) / 0.3, 2)) * 0;
      const appear = spring(lt - h.lead, 2.5, 6);
      WX.cloud(ctx, x, y + h.s * 0.25 * (sq - 1), h.s * appear, { squash: sq, seed: h.seed });
    }
  }
  function drawFarClouds(ctx, t) {
    WX.cloud(ctx, 260 + t * 14, 120, 70, { seed: 11, alpha: 0.95, line: 2.6 });
    WX.cloud(ctx, 1240 + t * 10, 95, 58, { seed: 12, alpha: 0.95, line: 2.4 });
  }

  // gulls over the sea
  function drawGulls(ctx, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const gulls = [[300, 300, 1], [380, 260, 0.75], [1340, 330, 0.85]];
    gulls.forEach((g, i) => {
      const x = g[0] + t * 90 + Math.sin(t * 2 + i) * 10, y = g[1] - t * 25 + Math.sin(t * 3 + i * 2) * 6;
      const f = Math.sin(t * 13 + i * 2.1);
      const s = 18 * g[2];
      ctx.beginPath();
      ctx.moveTo(x - s, y - s * 0.35 * f);
      ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.55 - s * 0.3 * f, x, y);
      ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.55 - s * 0.3 * f, x + s, y - s * 0.35 * f);
      ctx.lineWidth = 3.4 * g[2]; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.ink; ctx.stroke();
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------ the hero wave
  const WAVE_Y0 = 880;
  function waveParams(t) {
    const t0 = T.waveStart, tc = T.waveCurl, tk = T.waveCrash;
    const u = inv(t0, tk, t);
    const xc = lerp(150, CRASH[0] - 170, 0.62 * u + 0.38 * u * u);
    // anticipation: the swell sinks back a little before it gathers, then rears up
    const dip = Math.sin(Math.PI * inv(t0, t0 + 0.24, t));
    let h = lerp(95, 300, ease.outBack(inv(t0 + 0.14, tc, t), 0.9)) - 38 * dip;
    const crash = inv(tk - 0.05, tk + 0.26, t);
    h = lerp(h, 30, ease.in2(crash));
    const curl = ease.inOut2(inv(t0 + 0.3, tk, t));
    // squash & stretch: tall and narrow while rising fast, wide and flat as it crashes
    const sx = 1 - 0.12 * Math.sin(Math.PI * inv(t0 + 0.16, tc, t)) + 0.45 * ease.out2(crash);
    return { xc, h, curl, crash, sx, L: 470 + 160 * u, y0: WAVE_Y0 };
  }
  function drawWave(ctx, t) {
    if (t > T.waveCrash + 0.45) return;
    const p = waveParams(t);
    const { xc, h, curl, crash, y0 } = p;
    const r = h * 0.42;
    const fade = 1 - inv(T.waveCrash + 0.15, T.waveCrash + 0.45, t);
    ctx.save();
    ctx.globalAlpha = fade;
    // squash/stretch about the wave's foot
    ctx.translate(xc, y0); ctx.scale(p.sx, 1); ctx.translate(-xc, -y0);
    // back slope
    const back = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const prof = Math.pow((1 - Math.cos(Math.PI * u)) / 2, 1.3);
      back.push([xc - p.L * (1 - u), y0 - h * prof + 5 * Math.sin(u * 8 + t * 7) * (1 - u)]);
    }
    // the lip: a spiral thrown forward from the crest
    const O = [xc + r * 0.08, y0 - h + r + r * 0.9 * crash];
    const sweep = curl * Math.PI * (1.55 + 0.3 * crash);
    const spiral = [];
    const NS = 26;
    for (let i = 0; i <= NS; i++) {
      const s = i / NS;
      const a = -Math.PI / 2 + sweep * s;
      const rad = r * (1 - 0.58 * s);
      spiral.push([O[0] + Math.cos(a) * rad * 1.18, O[1] + Math.sin(a) * rad]);
    }
    // body = back slope + outer half of the spiral + the face dropping to the trough
    const cut = Math.min(NS, Math.round((NS * (Math.PI)) / Math.max(sweep, 1e-3)));
    const outer = spiral.slice(0, Math.max(2, Math.min(cut, NS) + 1));
    const F0 = outer[outer.length - 1];
    const face = [];
    for (let i = 1; i <= 8; i++) {
      const u = i / 8;
      face.push([lerp(F0[0], xc + r * 1.9, u) + Math.sin(u * Math.PI) * r * 0.25, lerp(F0[1], y0 + 6, Math.pow(u, 0.8))]);
    }
    const body = back.concat(outer, face, [[xc + r * 2.4, y0 + 260], [xc - p.L - 60, y0 + 260]]);
    const B = boil(body, 1.5, 21);
    const shape = (c) => trace(c, B, true);
    const g = ctx.createLinearGradient(0, y0 - h, 0, y0 + 60);
    g.addColorStop(0, '#6cc3d6'); g.addColorStop(0.35, '#3d93c0'); g.addColorStop(0.8, '#225f98'); g.addColorStop(1, '#1d5690');
    paint(ctx, shape, g, {
      tex: 0.45, texSeed: 7,
      shade: { dx: -r * 0.42, dy: r * 0.1, color: 'rgba(14,52,92,0.55)', alpha: 1, hatch: 0.22 },
      light: { dx: r * 0.35, dy: r * 0.25, color: 'rgba(180,232,236,0.55)', alpha: 1 },
    });
    // watery streaks following the back of the wave
    ctx.save();
    ctx.beginPath(); shape(ctx); ctx.clip();
    for (let q = 1; q <= 3; q++) {
      const off = q * h * 0.17;
      const st = back.slice(5).map((pt) => [pt[0] + off * 0.35, pt[1] + off]);
      ink(ctx, st, 5 - q, 'rgba(214,244,240,0.55)', { seed: 30 + q });
    }
    ctx.restore();
    // the eye of the curl
    if (sweep > Math.PI * 0.9) {
      const e = clamp((sweep - Math.PI * 0.9) / (Math.PI * 0.4));
      ctx.save();
      ctx.globalAlpha = fade * e;
      ctx.beginPath();
      ctx.ellipse(O[0] + r * 0.05, O[1] + r * 0.05, r * 0.52, r * 0.45, 0, 0, 7);
      ctx.fillStyle = '#16497b';
      ctx.fill();
      ctx.restore();
    }
    // foam cap riding the back, over the crest and around the curl, ending in a fat blob
    const foamPath = boil(back.slice(9).concat(spiral.slice(1)), 1.2, 23);
    const fw = r * 0.38 + 6;
    ink(ctx, foamPath, fw + 7, C.ink, { seed: 9, wvar: 0.2 });
    ink(ctx, foamPath, fw, C.foam, { seed: 9, wvar: 0.2 });
    const tip = foamPath[foamPath.length - 1];
    const tr = r * 0.13 + 4;
    ctx.beginPath(); ctx.arc(tip[0], tip[1], tr, 0, 7);
    ctx.fillStyle = C.foam; ctx.fill();
    ctx.lineWidth = 3.2; ctx.strokeStyle = C.ink; ctx.stroke();
    // little foam claws just past the crest
    for (let i = 3; i < Math.min(NS, 16); i += 4) {
      const a = -Math.PI / 2 + sweep * (i / NS);
      const q = spiral[i];
      const rr = r * 0.075 + 3;
      const cx2 = q[0] + Math.cos(a) * fw * 0.5, cy2 = q[1] + Math.sin(a) * fw * 0.5;
      ctx.beginPath(); ctx.arc(cx2, cy2, rr, 0, 7);
      ctx.fillStyle = C.foam; ctx.fill();
      ctx.lineWidth = 2.6; ctx.strokeStyle = C.ink; ctx.stroke();
    }
    // ink contour of the back and face
    ink(ctx, boil(back, 1.2, 24), 4.6, C.ink, { seed: 10 });
    ink(ctx, boil(face, 1.2, 25), 4, C.ink, { seed: 11 });
    ctx.restore();
    drawSpray(ctx, t, fade);
  }
  // the lip tip at time t (for spray flung off the curl)
  function lipTip(t) {
    const p = waveParams(t);
    const r = p.h * 0.42;
    const O = [p.xc + r * 0.08, p.y0 - p.h + r + r * 0.9 * p.crash];
    const a = -Math.PI / 2 + p.curl * Math.PI * (1.55 + 0.3 * p.crash) * 0.55;
    const rad = r * (1 - 0.58 * 0.55);
    return [p.xc + (O[0] + Math.cos(a) * rad * 1.18 - p.xc) * p.sx, O[1] + Math.sin(a) * rad];
  }
  function drawSpray(ctx, t, fade) {
    const r = rng(321);
    for (let j = 0; j < 12; j++) {
      const born = 0.42 + j * 0.045;
      const age = t - born;
      const vx = 380 + r() * 380, vy = -(260 + r() * 360), sz = 4 + r() * 6;
      if (age <= 0 || age > 0.38) continue;
      const o = lipTip(born);
      const x = o[0] + vx * age, y = o[1] + vy * age + 1400 * age * age;
      const svy = vy + 2800 * age;
      ctx.save();
      ctx.globalAlpha = fade * (1 - age / 0.38);
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(svy, vx));
      ctx.scale(1.6, 0.8);
      ctx.beginPath(); ctx.arc(0, 0, sz, 0, 7);
      ctx.fillStyle = C.foam; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.restore();
    }
  }
  function drawSplash(ctx, t) {
    const ls = t - T.waveCrash;
    if (ls <= 0 || ls > 0.6) return;
    const cx = CRASH[0], cy = WAVE_Y0 - 16;
    const k = ease.out3(clamp(ls / 0.22));
    const fall = clamp((ls - 0.16) / 0.38);
    ctx.save();
    ctx.globalAlpha = 1 - ease.in2(fall);
    // crown of foam
    const crown = [];
    const NC = 22;
    for (let i = 0; i <= NC; i++) {
      const a = Math.PI + (i / NC) * Math.PI;
      const spike = i % 2 ? 1 : 0.5;
      const rr = 170 * k * spike;
      crown.push([cx + Math.cos(a) * rr * 1.45, cy + Math.sin(a) * rr * (1 - 0.65 * fall) + 30 * fall]);
    }
    crown.push([cx + 200 * k, cy + 40], [cx - 200 * k, cy + 40]);
    const Cr = boil(crown, 2, 40);
    paint(ctx, (c) => trace(c, Cr, true), C.foam, { tex: 0.3, shade: { dx: 12, dy: -14, color: '#cfe7ea', alpha: 1 } });
    ink(ctx, Cr, 4, C.ink, { closed: true, seed: 41 });
    // fat drops, stretched along their flight and squashed when slow
    const r2 = rng(99);
    for (let i = 0; i < 11; i++) {
      const ang = Math.PI * (1.08 + 0.84 * (i / 10)) + (r2() - 0.5) * 0.2;
      const sp = 560 + r2() * 420;
      const x = cx + Math.cos(ang) * sp * ls * 1.35;
      const y = cy + Math.sin(ang) * sp * ls + 1700 * ls * ls;
      const vx = Math.cos(ang) * sp * 1.35, vy = Math.sin(ang) * sp + 3400 * ls;
      const v = Math.hypot(vx, vy);
      const sz = 10 + r2() * 13;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(vy, vx));
      const st = clamp(v / 900, 0.6, 1.9);
      ctx.scale(st, 1 / Math.sqrt(st));
      ctx.beginPath(); ctx.arc(0, 0, sz, 0, 7);
      ctx.fillStyle = i % 3 ? C.foam : '#8fd0de'; ctx.fill();
      ctx.lineWidth = 2.6; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // tall foreground grasses framing the valley (multiplane foreground)
  function drawForeground(ctx, t) {
    const lt = t - (T.landBloom + 0.25);
    if (lt <= 0) return;
    const clumps = [[60, 1100, 1, 0], [1880, 1100, -1, 1]];
    clumps.forEach(([x0, y0, dir, ci]) => {
      const r = rng(300 + ci);
      for (let i = 0; i < 7; i++) {
        const delay = i * 0.03;
        const s = spring(lt - delay, 2.4, 6);
        if (s <= 0) continue;
        const L = (170 + r() * 190) * s;
        const ang = dir * (-0.35 + i * 0.1) + 0.07 * Math.sin(t * 2.6 + i) + 0.05 * Math.sin(t * 4.3 + i * 2);
        const bx = x0 + dir * (i * 24 - 60);
        const pts = [];
        for (let j = 0; j <= 12; j++) {
          const u = j / 12;
          const bend = ang * (0.4 + 1.3 * u * u);
          pts.push([bx + Math.sin(bend) * L * u, y0 - Math.cos(bend) * L * u]);
        }
        const w = 30 + r() * 16;
        const col = [C.greenDark, C.green, '#58a54c', C.greenDeep][i % 4];
        ink(ctx, pts, w + 7, C.ink, { seed: i + 50 + ci * 9, wvar: 0.15 });
        ink(ctx, pts, w, col, { seed: i + 50 + ci * 9, wvar: 0.15 });
        // a light midrib
        ink(ctx, pts.slice(1, 10).map((p) => [p[0] - dir * 3, p[1]]), 3.5, 'rgba(190,230,140,0.7)', { seed: i + 70 });
      }
    });
  }

  // ------------------------------------------------------------------ main
  // swoop transform (A->B): zoom into the centre mountain
  function swoop(t) {
    const u = inv(T.mountainSwoop, T.newLand + 0.04, t);
    const z = Math.exp(Math.log(9) * ease.in3(u));
    const rot = -0.22 * ease.in2(u);
    return { z, rot, u };
  }
  WX.sceneA = {
    HZ,
    MOUNTAINS,
    swoop,
    centreMountainScreen(t) {
      // the centre mountain's silhouette in screen space (used by scene B to reveal through it)
      const m = MOUNTAINS[2];
      const st = mountainState(m, t);
      const ext = stretch(t);
      const sw = swoop(t);
      const focus = [m.x, HZ - m.h * 0.62 * ext.sy];
      return m.pts.map((p) => {
        let x = m.x + p[0] * ext.sx, y = HZ + p[1] * (st ? st.pop : 1) * ext.sy;
        x -= focus[0]; y -= focus[1];
        const c = Math.cos(sw.rot), s = Math.sin(sw.rot);
        return [960 + (x * c - y * s) * sw.z, 540 + (x * s + y * c) * sw.z + (focus[1] - 540) * (1 - ease.out2(sw.u))];
      });
    },
    draw(ctx, t) {
      const cam = camera(t);
      const sw = swoop(t);
      const ext = stretch(t);
      const m = MOUNTAINS[2];
      const focus = [m.x, HZ - m.h * 0.62 * ext.sy];
      ctx.save();
      // camera: zoom/rotate about the centre mountain while swooping
      if (sw.u > 0) {
        ctx.translate(960, 540 + (focus[1] - 540) * (1 - ease.out2(sw.u)));
        ctx.rotate(sw.rot);
        ctx.scale(sw.z, sw.z);
        ctx.translate(-focus[0], -focus[1]);
      }
      // gentle banking as we follow the river
      const bank = 0.018 * Math.sin(t * 1.9) * inv(T.riverDolly, T.riverDolly + 0.6, t);
      ctx.translate(960, 540); ctx.rotate(bank); ctx.translate(-960, -540);

      drawSky(ctx, t);
      drawSun(ctx, t, 1560, 175, 66);
      drawFarClouds(ctx, t);
      // distant blue range rising behind the mountains
      const rangeUp = ease.out3(inv(T.landBloom + 0.05, T.landBloom + 0.5, t));
      if (rangeUp > 0) {
        const rp = [];
        for (let x = -100; x <= 2020; x += 40) rp.push([x, HZ + 6 - rangeUp * (60 + 45 * (0.5 + 0.5 * fbm(x * 0.004, 3.3, 2)))]);
        const R = boil(rp.concat([[2020, HZ + 10], [-100, HZ + 10]]), 1, 61);
        paint(ctx, (c) => trace(c, R, true), '#a6c3cf', { tex: 0.35 });
        ink(ctx, R.slice(0, rp.length), 2.6, rgba(C.ink, 0.55), { seed: 62 });
      }
      MOUNTAINS.forEach((mm, i) => {
        const st = mountainState(mm, t);
        if (!st) return;
        if (i === 2) drawMountain(ctx, mm, st, ext.sy, ext.sx);
        else drawMountain(ctx, mm, st);
      });
      drawHoppers(ctx, t);

      // ground: sea and land composited through the bloom mask
      const bloomDone = t > T.landBloom + BLOOM_DUR + 0.02; // bloom now covers the frame
      const bloomStarted = t > T.landBloom;
      if (!bloomStarted) {
        drawSeaRows(ctx, t, cam);
      } else if (bloomDone) {
        drawLandRows(ctx, t, cam, 0.5);
      } else {
        drawSeaRows(ctx, t, cam);
        ctx.save();
        const bp = bloomPoly(t);
        ctx.beginPath(); trace(ctx, bp, true); ctx.clip();
        drawLandRows(ctx, t, cam, 0.5);
        ctx.restore();
        // the frothy edge where sea turns to land
        ctx.save();
        ctx.beginPath(); ctx.rect(-200, HZ + 4, 2320, 1000); ctx.clip();
        ink(ctx, bp, 10, C.foam, { closed: true, seed: 70, wvar: 0.6 });
        ink(ctx, bloomPoly(t, 8), 2.8, rgba(C.ink, 0.85), { closed: true, seed: 71 });
        ctx.restore();
      }
      // a watercolour pass over the whole ground
      ctx.save();
      ctx.beginPath(); ctx.rect(-200, HZ, 2320, 900); ctx.clip();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = WX.pattern(ctx, WX.texWater);
      ctx.fillRect(-200, HZ, 2320, 900);
      ctx.restore();

      drawSplash(ctx, t);
      drawGulls(ctx, t, 1 - inv(T.landBloom, T.landBloom + 0.4, t));
      drawForeground(ctx, t);
      ctx.restore();
    },
  };
  function stretch(t) {
    // the centre mountain: anticipation squash, then a long elastic stretch skyward
    const a = inv(T.mountainStretch, T.mountainStretch + 0.12, t);
    const s = inv(T.mountainStretch + 0.1, T.newLand, t);
    const squash = Math.sin(Math.PI * a) * (1 - s);
    const sy = 1 - 0.16 * squash + 0.85 * ease.outBack(s, 2.2);
    const sx = 1 + 0.14 * squash - 0.12 * Math.sin(Math.PI * clamp(s * 1.4));
    return { sy, sx };
  }
})();
