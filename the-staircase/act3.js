/* THE STAIRCASE — Act 3: The Revelation
 * Scenes 12–15. Needs engine.js. Same caterpillar, same hat, same suitcase; years on the stair (WEAR = 1).
 */
'use strict';

const R0 = 8, SP0 = R0 * 1.45;
function camOn(ax, ay, Zc, d, sx, sy) { const k = 1000 / d; return { f: 1000, x: ax - (sx - W / 2) / k, y: ay - (sy - H / 2) / k, z: Zc - d }; }
const kAt = (cam, z) => cam.f / (z - cam.z);
const lerpPal = (p, o) => Object.assign({}, p, o);
/* rays of light from a point */
function lightBurst(g, x, y, R, a, t, n = 20) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(x, y, 0, x, y, R);
  halo.addColorStop(0, `rgba(255,246,220,${0.9 * a})`); halo.addColorStop(0.12, `rgba(255,224,160,${0.55 * a})`);
  halo.addColorStop(0.45, `rgba(230,170,90,${0.18 * a})`); halo.addColorStop(1, 'rgba(200,140,70,0)');
  g.fillStyle = halo; g.fillRect(x - R, y - R, R * 2, R * 2);
  for (let k = 0; k < n; k++) {
    const an = k / n * TAU + t * 0.03 + hash(k) * 0.25, w = 0.02 + hash(k + 3) * 0.045, len = R * (1.2 + hash(k + 5) * 1.3);
    const rg = g.createRadialGradient(x, y, 0, x, y, len);
    rg.addColorStop(0, `rgba(255,232,180,${(0.1 + 0.08 * hash(k + 9)) * a * (0.7 + 0.3 * Math.sin(t * 0.8 + k))})`); rg.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = rg; g.beginPath(); g.moveTo(x, y);
    g.lineTo(x + Math.cos(an - w) * len, y + Math.sin(an - w) * len); g.lineTo(x + Math.cos(an + w) * len, y + Math.sin(an + w) * len); g.closePath(); g.fill();
  }
  g.restore();
}
function motes(g, n, a, rise, seed, area) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const [x0, y0, w, h] = area || [0, 0, W, H];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((hash(i + seed) * w + Math.sin(T * 0.4 + i) * 25) % w + w) % w;
    const y = y0 + ((hash(i + seed + 0.5) * h - T * rise * (0.5 + hash(i + 2))) % h + h) % h;
    const al = a * (0.4 + 0.6 * Math.sin(T * 1.7 + i * 2.3)); if (al <= 0) continue;
    g.fillStyle = `rgba(255,226,170,${al})`; g.beginPath(); g.arc(x, y, 1 + hash(i + 7) * 2.2, 0, TAU); g.fill();
  }
  g.restore();
}
/* his suitcase, knocked flat onto its face: t = 0 standing, 1 lying. x is its left edge, gy the step */
function fallenCase(g, x, gy, w, h, env, t = 1, tilt = 0) {
  const sq = lerp(1, 0.34, t);
  g.fillStyle = `rgba(15,12,10,${0.3 * t})`; g.beginPath(); g.ellipse(x + w / 2, gy + h * 0.03, w * 0.58, h * 0.1, 0, 0, TAU); g.fill();
  g.save(); g.translate(x + w / 2, gy); g.rotate(tilt); g.scale(1, sq);
  drawSuitcase(g, 0, -h * 1.17, w, h, 0, { pal: HERO, env, detail: 2 });
  g.restore();
}

/* ================================================================== SCENE 12 — THE SCREAM */
const S12 = { x0: -200 * 44, y0: 200 * 64, rise: 64, run: 44, n: 420, Z0: 0, Z1: 560, U: 420, tex: 0.55, wall: 1500, wallShade: 'rgba(76,70,62,0.52)' };
let P12 = null, SSTOP12 = 0;
const ZH12 = 60, FREEZE12 = 8.8;
function flatSpine(P, ss, r) { return ss.map((s, i) => { const p = pathPt(P, s); return { x: p.x + boil(i * 7.1, r * 0.04), y: p.y + r * 0.14 + boil(i * 3.7, r * 0.04) }; }); }
function scene12(g, lt, dur) {
  if (!P12) {
    P12 = buildStairPath(S12, 194, 214, R0, 0);
    // stop with his head in the middle of a tread
    const tx = S12.x0 + 200.62 * S12.run, ty = S12.y0 - 201 * S12.rise - R0; let bd = 1e9;
    for (let i = 0; i < P12.len; i++) { const d = Math.hypot(P12.xs[i] - tx, P12.ys[i] - ty); if (d < bd) { bd = d; SSTOP12 = i; } }
  }
  let ts = SF / 12 - SCENES[0].start;
  // the silence: everything stops dead on one frame
  const frozen = ts >= FREEZE12;
  if (frozen) { SF = Math.floor((SCENES[0].start + FREEZE12) * 12) - 1; ts = SF / 12 - SCENES[0].start; }
  WEAR = 1;
  const crawl = { s0: 0, period: 1.3, stride: 18, n: 7, spacing: SP0, lag: 0.13, tmap: t => Math.min(t, 2.0) };
  crawl.s0 = SSTOP12 - crawlS(2.0, crawl)[0];
  const ss = crawlS(ts, crawl);
  const tremble = frozen ? 0 : smooth(2.0, 2.25, ts) * (1 - smooth(3.3, 3.5, ts)) + smooth(4.9, 5.2, ts) * 0.6;
  const collapse = easeIO(smooth(3.3, 3.85, ts));
  const lift = smooth(4.55, 5.05, ts);
  const scream = smooth(4.9, 5.12, ts);
  const slip = smooth(3.6, 4.05, ts) + Math.sin(smooth(4.05, 4.4, ts) * Math.PI) * 0.12;
  const reared = spineOnPath(P12, ss, SP0, R0), flat = flatSpine(P12, ss, R0);
  const kk = collapse * (1 - lift * 0.5);
  const sp = reared.map((p, i) => ({ x: lerp(p.x, flat[i].x, kk), y: lerp(p.y, flat[i].y, kk) }));
  if (tremble > 0) for (let i = 0; i < 3; i++) { sp[i].x += (hash2(Math.floor(T * 24), i) - 0.5) * R0 * 0.18 * tremble; sp[i].y += (hash2(Math.floor(T * 24), i + 9) - 0.5) * R0 * 0.12 * tremble; }
  const head = sp[0];
  // the camera: a slow watch, then a rush at his face
  const push = Math.pow(smooth(5.0, 7.3, ts), 1.7);
  const d = 360 * Math.pow(62 / 360, push);
  const cam = camOn(lerp(sp[3].x, head.x, Math.min(1, push * 1.5)), lerp(sp[3].y - 20, head.y - R0 * 0.55, Math.min(1, push * 1.5)), ZH12, d, 960, lerp(600, 560, push));
  // the world, drawn off to the side so it can be bent
  const buf = TEX.buf, b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  const gr = b.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#cfc8b8'); gr.addColorStop(1, '#8a8478');
  b.fillStyle = gr; b.fillRect(0, 0, W, H);
  drawStair3D(b, S12, cam, 0);
  const amp = frozen ? 0 : smooth(5.0, 6.0, ts);
  screen(g);
  if (amp > 0) {
    for (let y = 0; y < H; y += 10) {
      const off = (Math.sin(y * 0.017 + T * 13) * 30 + Math.sin(y * 0.051 - T * 8) * 12) * amp;
      g.drawImage(buf, 0, y, W, 10, off, y, W, 10);
    }
    const sm = TEX.small, s2 = sm.getContext('2d'); s2.setTransform(1, 0, 0, 1, 0, 0); s2.globalCompositeOperation = 'source-over';
    s2.drawImage(buf, 0, 0, sm.width, sm.height);
    const hp = proj3(cam, head.x, head.y, ZH12);
    for (let i = 1; i <= 4; i++) {
      const sc = 1 + i * 0.05 * amp; g.globalAlpha = 0.2 * amp;
      g.drawImage(sm, hp.x - hp.x * sc, hp.y - hp.y * sc, W * sc, H * sc);
    }
    g.globalAlpha = 1;
  } else g.drawImage(buf, 0, 0);

  setCam(g, cam.x, cam.y, kAt(cam, ZH12), 0);
  const env = { k: 0.9, warm: [0, 0, 0], wa: 0, lx: -0.45, ly: -0.8, rim: 0.45 };
  // the suitcase slips from his grip and falls over
  const hang = hangCase(S12, reared[0], R0 * 1.2, R0, 1);
  const fall = smooth(3.4, 4.05, ts), fallE = fall * fall;
  const bx = head.x - S12.run * 0.95, by = stairSurfaceY(S12, bx);
  const o = {
    r: R0, dir: 1, env, hat: true, holdLeg: 1, tremble,
    yaw: lerp(lerp(0.75, 0.6, collapse), 0.3, lift), pitch: lerp(lerp(0.12, -0.35, collapse), 0.5, lift),
    lid: lerp(lerp(0.5, 0.62, collapse), 0.8, scream), tired: 1, scream,
    hatShift: -0.24 * slip, hatTilt: -0.12 - 0.36 * slip, hatLift: 0.06 * slip,
  };
  if (fall <= 0) { o.suitcase = hang; }
  else {
    const restX = bx - hang.w * 0.5, standX = hang.x - hang.w / 2, standGY = hang.y + hang.h * 1.17;
    const bounce = Math.sin(smooth(4.05, 4.4, ts) * Math.PI) * 0.1;
    fallenCase(g, lerp(standX, restX, fallE), lerp(standGY, by, fallE), hang.w, hang.h, env, Math.min(1, fallE + bounce * 0.4), (1 - fallE) * 0.5 * fall);
  }
  drawCaterpillarSide(g, sp, o);
  if (frozen) {
    // silence: the colour drains and nothing moves
    screen(g);
    g.globalCompositeOperation = 'saturation'; g.globalAlpha = 0.6; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = 'rgba(20,18,16,0.12)'; g.fillRect(0, 0, W, H);
  }
}

/* ================================================================== SCENE 13 — THE VOICE */
const F13 = { f: 900, camH: 1.05, rise: 0.17, run: 0.3, z0: 1.9, half: 3.2, rw: 0.12 };
function scene13(g, lt, dur) {
  const ts = SF / 12 - SCENES[1].start;
  WEAR = 1;
  const tilt = easeIO(smooth(1.3, 7.4, lt));
  const hor = lerp(250, 1060, tilt);
  const P = (x, y, z) => ({ x: 960 + F13.f * x / z, y: hor - F13.f * (y - F13.camH) / z, k: F13.f / z });
  const vpY = hor - F13.f * F13.rise / F13.run;
  const breathe = 1 + 0.12 * Math.sin(lt * 1.6) * smooth(3, 5, lt);
  const light = [255, 236, 196];
  screen(g);
  const sk = g.createLinearGradient(0, vpY - 900, 0, vpY + 1100);
  sk.addColorStop(0, '#f3e7c9'); sk.addColorStop(0.35, '#d9c7a0'); sk.addColorStop(1, '#3b342b');
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  // the staircase, far to near, fading into the light
  const { rise, run, z0, half } = F13, N = 150;
  for (let k = N; k >= -4; k--) {
    const z = z0 + k * run, y = k * rise, haze = smooth(2.5, 24, z);
    if (y < F13.camH) {
      const a = P(-half, y, z), b = P(half, y, z), c = P(half, y, z + run), d = P(-half, y, z + run);
      poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]);
      concreteFill(g, 0.8, rgba(mix([214, 200, 172], light, haze), 0.45 + haze * 0.5));
    }
    const a = P(-half, y - rise, z), b = P(half, y - rise, z), c = P(half, y, z), d = P(-half, y, z);
    if (Math.max(a.y, b.y) < -50 || Math.min(c.y, d.y) > H + 50) continue;
    poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]);
    concreteFill(g, 0.8, rgba(mix([96, 86, 72], light, Math.pow(haze, 0.8)), 0.5 + haze * 0.5));
    g.strokeStyle = `rgba(255,240,210,${0.45 * (1 - haze) + 0.2})`; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(c.x, c.y); g.stroke();
  }
  // the light at the top, breathing
  lightBurst(g, 960, vpY, 900 * breathe, 0.9, T);
  const hz = g.createRadialGradient(960, vpY, 0, 960, vpY, 1400);
  hz.addColorStop(0, `rgba(255,244,222,${0.5 * breathe})`); hz.addColorStop(1, 'rgba(255,244,222,0)');
  g.fillStyle = hz; g.fillRect(0, 0, W, H);
  motes(g, 70, 0.45, 18, 300);
  // him, sitting on the bottom step beside his fallen suitcase, looking up
  const p = P(-0.28, 0, z0 + run * 0.5), r = F13.rw * p.k;
  const env = { k: 0.92, warm: [255, 210, 150], wa: 0.1, lx: 0.15, ly: -0.95, rim: 0.55, rimCol: [255, 226, 170], rimA: 0.28 };
  setCam(g, 960, 540, 1, 0);
  fallenCase(g, p.x + r * 1.9, p.y, r * 3.9, r * 2.9, env, 1, -0.05);
  const look = smooth(0.6, 2.6, ts);
  const sp = staticSpine(p.x, p.y, r, 1, 7, lerp(0.85, 1.25, look), ts * 0.9);
  drawCaterpillarSide(g, sp, {
    r, dir: 1, env, hat: true, yaw: lerp(0.85, 1.25, look), pitch: lerp(0.0, 0.75, look), lid: lerp(0.6, 0.32, look), tired: 1,
    hatShift: -0.24, hatTilt: -0.48, hatLift: 0.06, groundShadow: true,
  });
}

/* ================================================================== SCENE 14 — EVERYONE HEARS IT
 * Seen from where the voice is: high above, looking down the staircase at everyone looking up.
 */
const F14 = { rise: 170, run: 300, half: 3000, rw: 40 };     // millimetres, so the engine camera's units feel familiar
const HATS14 = [
  null, null, null,
  { hat: hex('#5c5a55'), hatLight: hex('#86837b'), hatDark: hex('#32312e'), band: hex('#22211f') },
  { hat: hex('#2b2826'), hatLight: hex('#4d4945'), hatDark: hex('#151312'), band: hex('#5a1f18') },
  { hat: hex('#8f7a52'), hatLight: hex('#b39d70'), hatDark: hex('#5e4e33'), band: hex('#3a2f20') },
];
const CASES14 = [null, null, { case: hex('#4f5a5e'), caseLight: hex('#71808a'), caseDark: hex('#2f3639'), strap: hex('#242a2c') }, { case: hex('#5b6346'), caseLight: hex('#7d8762'), caseDark: hex('#383d2b'), strap: hex('#2a2e20') }];
let CROWD14 = null, FLIGHTS14 = null;
function buildCrowd14() {
  const R = rng(1414), out = [];
  for (let i = 0; i < 520; i++) {
    const k = 2 + Math.floor(Math.pow(R(), 0.8) * 160), x = (R() * 2 - 1) * (F14.half - 250);
    if (k < 5 && Math.abs(x) < 700) continue;
    out.push({
      k, x, pal: R() < 0.35 ? 'old' : 'young', hat: Math.floor(R() * HATS14.length), bag: Math.floor(R() * CASES14.length),
      expr: R() < 0.34 ? 'hope' : R() < 0.5 ? 'tired' : 'set', stop: 1.3 + R() * 4.6, phase: R() * TAU, lie: R() < 0.1,
    });
  }
  return out.sort((a, b) => b.k - a.k);
}
function buildFlights14() {
  const R = rng(1415), out = [];
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    out.push({ x: i * 8200 + (R() - 0.5) * 2400, y: (R() - 0.5) * 14000 + Math.abs(i) * 1500, z: (R() - 0.3) * 14000, n: 200, dots: [] });
  }
  for (let i = 0; i < 14; i++) out.push({ x: (R() - 0.5) * 110000, y: 9000 + R() * 30000, z: 15000 + R() * 50000, n: 220, dots: [] });
  for (const f of out) for (let j = 0; j < 520; j++) f.dots.push({ k: Math.floor(R() * f.n), x: (R() * 2 - 1) * 2600, c: R() });
  return out;
}
function crowdSprite(m, pose) {
  const key = `c|${m.pal}|${m.hat}|${m.bag}|${m.expr}|${pose}`;
  return sprite(key, 150, 170, sg => {
    const pal0 = m.pal === 'old' ? ELDER : YOUNG;
    const pal = Object.assign({}, pal0, HATS14[m.hat] || {}, CASES14[m.bag] || {});
    const env = { k: 1, warm: [255, 214, 160], wa: 0.12, lx: 0, ly: -0.9, rim: 0.5 };
    const r = 16, x = 75, gy = 158;
    const up = pose === 'look';
    const ex = m.expr;
    const o = {
      pal, env, hat: !!HATS14[m.hat], elder: m.pal === 'old', trail: 1, detail: 2,
      pitch: up ? 0.8 : -0.25, yaw: 0, lid: ex === 'tired' ? 0.62 : ex === 'hope' ? (up ? 0.08 : 0.3) : 0.36,
      tired: ex === 'tired' ? 1 : 0, smile: ex === 'hope' && up ? 0.35 : 0,
    };
    if (CASES14[m.bag]) o.suitcase = { x: x - r * 2.9, y: gy - r * 2.9 * 1.17, w: r * 3.9, h: r * 2.9, side: -1 };
    sg.save(); sg.translate(0, 0);
    if (m.lie) {
      // too tired to move: lying flat on the step, eyes half open
      const sp = [];
      for (let i = 0; i < 7; i++) sp.push({ x: x + 42 - i * r * 1.2, y: gy - r * (i ? 0.95 : 1.05) });
      drawCaterpillarSide(sg, sp, Object.assign(o, { r, dir: 1, yaw: 0.6, pitch: up ? 0.6 : -0.2, lid: 0.75, suitcase: null }));
    } else drawCaterpillarFront(sg, x, gy, r, o);
    sg.restore();
  });
}
function scene14(g, lt, dur) {
  if (!CROWD14) { CROWD14 = buildCrowd14(); FLIGHTS14 = buildFlights14(); }
  const ts = SF / 12 - SCENES[2].start;
  WEAR = 1;
  const { rise, run, half, rw } = F14;
  // pulling back and up, away from him, the way the voice would see it
  const e = smooth(0, dur, lt), pe = Math.pow(e, 0.85);
  const dist = 900 * Math.pow(42000 / 900, pe);
  const dir = norm3(lerp3([0, -0.62, -0.78], [0, -0.82, -0.57], e));
  const tgt = [0, lerp(-300, 26 * rise, Math.pow(e, 0.7)), lerp(run * 0.5, 40 * run, Math.pow(e, 0.7))];
  const cam = makeCam([tgt[0] + dir[0] * dist, tgt[1] + dir[1] * dist, tgt[2] + dir[2] * dist], 0, Math.atan2(dir[1], Math.hypot(dir[0], dir[2])), 1000, 0.03 * Math.sin(lt * 0.3));
  const fogC = [84, 77, 67];
  screen(g);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5d564c'); bg.addColorStop(1, '#2c2924'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  screenRoll(g, cam.roll);
  const fogOf = z => smooth(6000, 160000, z) * 0.9;
  // the other staircases, as the frame widens
  const flight = (f, detail) => {
    for (let k = f.n; k >= 0; k -= detail) {
      const y0 = f.y + k * rise, z0 = f.z + k * run;
      const q = [[f.x - half, y0, z0], [f.x + half, y0, z0], [f.x + half, y0, z0 + run * detail], [f.x - half, y0, z0 + run * detail]];
      const cs = q.map(v => toCam(cam, v[0], v[1], v[2])); if (cs.some(c => c[2] < NEAR)) continue;
      const p = cs.map(c => camProj(cam, c)); if (p.every(v => v.y < -40) || p.every(v => v.y > H + 40) || p.every(v => v.x < -40) || p.every(v => v.x > W + 40)) continue;
      const fa = fogOf(cs[0][2]);
      g.fillStyle = rgba(mix(k % 2 ? [150, 141, 125] : [172, 162, 144], [92, 84, 72], 0.25 + 0.5 * fa)); poly(g, p.map(v => [v.x, v.y])); g.fill();
      g.strokeStyle = rgba(mix([40, 36, 30], [92, 84, 72], fa)); g.lineWidth = 1.2; g.beginPath(); g.moveTo(p[3].x, p[3].y); g.lineTo(p[2].x, p[2].y); g.stroke();
    }
    for (const d of f.dots) {
      const pp = projC(cam, f.x + d.x, f.y + d.k * rise, f.z + d.k * run + run * 0.5); if (pp.z < NEAR) continue;
      if (pp.x < -10 || pp.x > W + 10 || pp.y < -10 || pp.y > H + 10) continue;
      const s = Math.max(1.2, rw * pp.k * 0.9);
      g.fillStyle = rgba(mix(d.c < 0.5 ? [132, 158, 108] : [160, 162, 136], fogC, fogOf(pp.z) * 0.55));
      g.fillRect(pp.x - s * 0.5, pp.y - s * 3, s, s * 3);
      g.fillStyle = 'rgba(255,230,180,0.75)'; g.fillRect(pp.x - s * 0.45, pp.y - s * 3.4, s * 0.9, s * 0.7);
    }
  };
  const flightsShown = smooth(0.25, 0.6, e);
  if (flightsShown > 0) {
    g.globalAlpha = flightsShown;
    for (const f of FLIGHTS14.slice().sort((a, b) => b.z - a.z)) flight(f, cam.f / (f.z - cam.z + 1) * rise > 3 ? 1 : 4);
    g.globalAlpha = 1;
  }
  // the main staircase
  const kMax = 170;
  for (let k = kMax; k >= -2; k--) {
    const y = k * rise, z = k * run, fa = fogOf(Math.max(1, z - cam.z));
    polyP(g, cam, [[-half, y, z], [half, y, z], [half, y, z + run], [-half, y, z + run]], 0.6, k % 2 ? 'rgba(150,140,124,0.32)' : 'rgba(170,160,142,0.3)', fa, k * 2 + 1, [0, 1, 3], fogC);
    // the drop at the far edge of each tread: the shadow of the step below
    const a = projC(cam, -half, y, z + run * 0.78), b = projC(cam, half, y, z + run * 0.78), c = projC(cam, half, y, z + run), d = projC(cam, -half, y, z + run);
    if (a.z > NEAR && d.z > NEAR) { g.fillStyle = `rgba(28,24,20,${0.45 * (1 - fa)})`; poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]); g.fill(); }
    const n0 = projC(cam, -half, y, z), n1 = projC(cam, half, y, z);
    if (n0.z > NEAR) { g.strokeStyle = `rgba(246,238,220,${0.4 * (1 - fa)})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(n0.x, n0.y); g.lineTo(n1.x, n1.y); g.stroke(); }
  }
  // everyone on it: climbing toward us, stopping one by one, then all looking up at once
  const LOOK = 6.6;
  for (const m of CROWD14) {
    const moving = !m.lie && ts < m.stop;
    const bob = moving ? Math.abs(Math.sin(ts * 3.2 + m.phase)) : 0;
    const p = projC(cam, m.x + (moving ? Math.sin(ts * 1.6 + m.phase) * 30 : 0), m.k * rise, m.k * run + run * 0.6);
    if (p.z < NEAR || p.x < -60 || p.x > W + 60 || p.y < -80 || p.y > H + 120) continue;
    const r = rw * p.k;
    const fa = fogOf(p.z);
    if (r < 1.6) {
      const rr = Math.max(1.1, r);
      g.fillStyle = rgba(mix([140, 164, 116], fogC, fa * 0.6)); g.fillRect(p.x - rr, p.y - rr * 4, rr * 2, rr * 4);
      g.fillStyle = `rgba(255,228,170,${0.7 * (1 - fa * 0.5)})`; g.fillRect(p.x - rr * 0.8, p.y - rr * 4.4, rr * 1.6, rr * 0.9);
      continue;
    }
    const spr = crowdSprite(m, ts >= LOOK ? 'look' : 'climb');
    const s = r / 16;
    g.globalAlpha = 1 - fa * 0.7;
    g.drawImage(spr, p.x - 75 * s, p.y - 158 * s - bob * r * 0.35, 150 * s, 170 * s);
    g.globalAlpha = 1;
  }
  // and him, at the top of it, nearest to us
  {
    const p = projC(cam, -150, 0, run * 0.5), r = rw * p.k;
    if (p.z > NEAR && r > 1) {
      const env = { k: 1, warm: [255, 214, 160], wa: 0.15, lx: 0, ly: -0.9, rim: 0.55, rimCol: [255, 226, 170], rimA: 0.45 };
      fallenCase(g, p.x + r * 1.7, p.y, r * 3.9, r * 2.9, env, 1, -0.05);
      drawCaterpillarFront(g, p.x, p.y, r, {
        pal: HERO, env, hat: true, trail: -1, yaw: 0.05, pitch: 0.8, lid: 0.3, tired: 1,
        hatShift: -0.1, hatTilt: -0.18, hatLift: 0.08, arms: [0.05, 0.05],
      });
    }
  }
  // the light they are all looking toward is where we are
  screen(g);
  g.save(); g.globalCompositeOperation = 'lighter';
  const wl = g.createLinearGradient(0, 0, 0, H);
  wl.addColorStop(0, 'rgba(255,214,150,0.22)'); wl.addColorStop(0.6, 'rgba(255,200,130,0.05)'); wl.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = wl; g.fillRect(0, 0, W, H);
  g.restore();
  motes(g, 50, 0.3, -14, 900);
}

/* ================================================================== SCENE 15 — ALMOST THERE
 * Straight down on a loop of four flights that always climb (each corner higher than the last),
 * with a smaller loop inside it turned 45°, and another inside that, forever.
 * Zooming in by √2 while turning 45° lands exactly on the next loop, so the shot never ends.
 */
function flightTop(g, ax, ay, bx, by, wdt, shade, depth) {
  // a flight from a (bottom) to b (top), seen from above: treads get lighter as they rise
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * wdt / 2, ny = ux * wdt / 2;
  const n = 22;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const c = mix([62, 56, 48], [226, 216, 196], (i + 1) / n * 0.85 + 0.1);
    g.fillStyle = rgba(mix(c, [20, 18, 16], shade));
    poly(g, [[ax + dx * t0 + nx, ay + dy * t0 + ny], [ax + dx * t1 + nx, ay + dy * t1 + ny], [ax + dx * t1 - nx, ay + dy * t1 - ny], [ax + dx * t0 - nx, ay + dy * t0 - ny]]); g.fill();
  }
  g.strokeStyle = rgba(mix([30, 27, 24], [20, 18, 16], shade)); g.lineWidth = Math.max(0.6, wdt * 0.035);
  g.beginPath();
  for (let i = 1; i < n; i++) { const t = i / n; g.moveTo(ax + dx * t + nx, ay + dy * t + ny); g.lineTo(ax + dx * t - nx, ay + dy * t - ny); }
  g.stroke();
  // the drop on one side: these stairs float
  g.fillStyle = `rgba(10,8,6,${0.35 * (1 - shade * 0.5)})`;
  poly(g, [[ax - nx, ay - ny], [bx - nx, by - ny], [bx - nx * (1 + depth), by - ny * (1 + depth) + wdt * 0.25 * depth], [ax - nx * (1 + depth), ay - ny * (1 + depth) + wdt * 0.25 * depth]]); g.fill();
}
function scene15(g, lt, dur) {
  const u = lt / dur;
  const ts = SF / 12 - SCENES[3].start;
  screen(g);
  const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, '#191613'); bg.addColorStop(1, '#3b352d'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // camera: turning 45° and closing in by √2 over the whole shot
  const zoom = Math.pow(Math.SQRT2, u), rot = u * Math.PI / 4 + 0.08;
  ID(g); g.translate(W / 2 + WEAVE.x, H / 2 + WEAVE.y); g.rotate(rot); g.scale(zoom, zoom);
  const S0 = 1500;
  const corner = (L, i) => { const s = S0 / Math.pow(Math.SQRT2, L) / 2, a = L * Math.PI / 4 + i * Math.PI / 2 + Math.PI / 4; return [Math.cos(a) * s * Math.SQRT2, Math.sin(a) * s * Math.SQRT2]; };
  const levels = [];
  for (let L = -3; L <= 9; L++) levels.push(L);
  // outermost first; each loop sits lower than the one around it
  for (const L of levels) {
    const s = S0 / Math.pow(Math.SQRT2, L), wdt = s * 0.11, shade = clamp((L + 3) / 13) * 0.75;
    const cs = [0, 1, 2, 3].map(i => corner(L, i));
    // each loop's corners land on the middle of the flights around it: the loops feed into one another
    for (let i = 0; i < 4; i++) flightTop(g, cs[i][0], cs[i][1], cs[(i + 1) % 4][0], cs[(i + 1) % 4][1], wdt, shade, 0.8);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = rgba(mix([210, 200, 180], [20, 18, 16], shade)); g.fillRect(cs[i][0] - wdt * 0.6, cs[i][1] - wdt * 0.6, wdt * 1.2, wdt * 1.2);
    }
    // climbers going round, and the warm light that stays just ahead of them
    const per = 4, speed = 0.06;
    for (let c = 0; c < 4; c++) {
      const lead = ((c + ts * speed * 4 + L * 0.37) % per + per) % per;
      for (let j = 0; j < 9; j++) {
        const q = ((lead - j * 0.045 - 0.12) % per + per) % per, e = Math.floor(q), f = q - e;
        const a = cs[e], b = cs[(e + 1) % 4];
        const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), off = (hash(j + c * 9) - 0.5) * wdt * 0.6;
        const dx = b[0] - a[0], dy = b[1] - a[1], ll = Math.hypot(dx, dy), ux = dx / ll, uy = dy / ll;
        const sz = wdt * 0.07;
        g.fillStyle = rgba(mix([132, 152, 108], [20, 18, 16], shade));
        g.save(); g.translate(x - uy * off, y + ux * off); g.rotate(Math.atan2(uy, ux));
        g.beginPath(); g.ellipse(0, 0, sz * 2.4, sz, 0, 0, TAU); g.fill();
        g.fillStyle = rgba(mix([90, 64, 42], [20, 18, 16], shade)); g.beginPath(); g.arc(sz * 2.1, 0, sz * 0.8, 0, TAU); g.fill();
        g.restore();
      }
      const lq = (lead + 0.02) % per, le = Math.floor(lq), lf = lq - le;
      const lx = lerp(cs[le][0], cs[(le + 1) % 4][0], lf), ly = lerp(cs[le][1], cs[(le + 1) % 4][1], lf);
      g.save(); g.globalCompositeOperation = 'lighter';
      const lr = wdt * 1.6, lg = g.createRadialGradient(lx, ly, 0, lx, ly, lr);
      const la = (0.55 + 0.2 * Math.sin(T * 2 + c + L)) * (1 - shade * 0.6);
      lg.addColorStop(0, `rgba(255,232,180,${la})`); lg.addColorStop(0.3, `rgba(255,190,110,${la * 0.45})`); lg.addColorStop(1, 'rgba(255,170,90,0)');
      g.fillStyle = lg; g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
      g.restore();
    }
  }
  screen(g);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(10,8,6,0)'); vg.addColorStop(1, 'rgba(10,8,6,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

startFilm([
  { name: 'The Scream',          start: 0,  dur: 11, fn: scene12 },
  { name: 'The Voice',           start: 11, dur: 11, fn: scene13 },
  { name: 'Everyone Hears It',   start: 22, dur: 14, fn: scene14 },
  { name: 'Almost There',        start: 36, dur: 9,  fn: scene15 },
]);
