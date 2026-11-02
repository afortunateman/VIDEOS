/* THE STAIRCASE — Act 2: The Machine
 * Scenes 06–11. Needs engine.js. Same caterpillar, same hat, same suitcase.
 */
'use strict';

const R0 = 8, SP0 = R0 * 1.45;
const PALE = Object.assign({}, YOUNG, { skin: hex('#8f9483'), skinLight: hex('#b7bba8'), skinDark: hex('#5e6355'), skinDeep: hex('#3a3d34') });
const PALE_OLD = Object.assign({}, ELDER, { skin: hex('#9a9a8a'), skinLight: hex('#c6c4b2'), skinDark: hex('#66665a'), skinDeep: hex('#404039') });

/* a camera that puts world point (ax, ay) at depth Zc onto screen point (sx, sy) */
function camOn(ax, ay, Zc, d, sx, sy) { const k = 1000 / d; return { f: 1000, x: ax - (sx - W / 2) / k, y: ay - (sy - H / 2) / k, z: Zc - d }; }
const kAt = (cam, z) => cam.f / (z - cam.z);
/* top of tread k (its middle), in profile coordinates */
const treadPt = (S, k) => ({ x: S.x0 + (k + 0.5) * S.run, y: S.y0 - (k + 1) * S.rise });
/* mouth movement while a line is being spoken */
function talk(t, wins, id) {
  for (const [a, b] of wins) if (t >= a && t <= b) return hash2(SF, id) > 0.28 ? 0.35 + 0.65 * hash2(SF, id + 1) : 0.08;
  return 0;
}
/* integrate a speed curve so the camera eases in and out of a pause */
function easedTime(t, a, b, ramp) {
  let acc = 0; const n = 120, dt = t / n;
  for (let i = 0; i < n; i++) { const u = (i + 0.5) * dt; acc += (1 - smooth(a - ramp, a + ramp, u) * (1 - smooth(b - ramp, b + ramp, u))) * dt; }
  return acc;
}
function caseBounce(sc, ts, crawl) {
  const f = ((ts - crawl.lag * 6) / crawl.period) % 1, mv = f < 0.62 ? Math.sin(f / 0.62 * Math.PI) : 0;
  sc.y -= mv * R0 * 0.55; sc.ang += mv * 0.08; return sc;
}
function sky(g, top, bottom) {
  screen(g); const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, rgba(top)); gr.addColorStop(1, rgba(bottom)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
/* the same staircase, copied in parallel into the fog, like a hall of mirrors */
function stairLattice(g, cam, rot, Z, col, phase) {
  const k = kAt(cam, Z); setCam(g, cam.x, cam.y, k, rot);
  const run = 44, rise = 64, per = 1700, px = 0.824 * per, py = 0.567 * per;
  const hw = W / 2 / k + 600, hh = H / 2 / k + 600;
  const span = Math.ceil((hw * 2) / run) + 40;
  g.fillStyle = rgba(col); g.strokeStyle = rgba(mix(col, [255, 250, 240], 0.3)); g.lineWidth = Math.max(2, 1.5 / k);
  for (let j = -6; j <= 6; j++) {
    // snap each copy to the step grid so every copy is the very same flight
    const ox = j * px + phase, oy = j * py;
    const i0 = Math.floor((cam.x - hw - ox) / run) - 20;
    const x0 = ox + i0 * run, y0 = oy - i0 * rise * (run / run) * 1;
    const yAt = x => oy - ((x - ox) / run) * rise;
    if (Math.abs(yAt(cam.x) - cam.y) > hh + 3000) continue;
    g.save(); g.translate(x0, yAt(x0)); simpleStair(g, span, rise, run, 420); g.fill();
    g.beginPath(); for (let i = 0; i < span; i++) { g.moveTo(i * run, -(i + 1) * rise); g.lineTo((i + 1) * run, -(i + 1) * rise); } g.stroke();
    g.restore();
  }
}
/* ================================================================== SCENE 06 — THOUSANDS OF STEPS */
const S6 = { x0: -400 * 44, y0: 400 * 64, rise: 64, run: 44, n: 900, Z0: 0, Z1: 900, U: 420, tex: 0.55, repeat: 3 };
let P6 = null, L6 = 0;
function scene6(g, lt, dur) {
  if (!P6) { P6 = buildStairPath(S6, 395, 425, R0, 0); L6 = P6.len / 31; }
  const ts = SF / 12 - SCENES[0].start;
  const crawl = { s0: 5.3 * L6, period: 0.85, stride: 24, n: 7, spacing: SP0, lag: 0.09 };
  const ss = crawlS(ts, crawl);
  // the camera keeps exactly his average pace, along the line of the stair
  const kf = 395 + (crawl.s0 + (lt / crawl.period) * crawl.stride - 3 * SP0) / L6;
  const cam = camOn(S6.x0 + kf * S6.run, S6.y0 - kf * S6.rise - 40, 45, 430, 1040, 640);
  const rot = -0.02;
  // day, dusk, night, dawn, day
  const ph = lt / dur;
  const night = smooth(0.18, 0.42, ph) * (1 - smooth(0.6, 0.84, ph));
  const dusk = Math.max(0, 1 - Math.abs(ph - 0.3) / 0.12) + Math.max(0, 1 - Math.abs(ph - 0.72) / 0.12);
  sky(g, mix(mix([226, 220, 206], [214, 160, 104], dusk * 0.6), [30, 34, 48], night), mix(mix([196, 189, 175], [170, 110, 70], dusk * 0.5), [18, 20, 28], night));
  const fogNow = mix(mix(FOGC, [210, 160, 110], dusk * 0.4), [52, 56, 70], night);
  stairLattice(g, cam, rot, 9000, mix([168, 160, 146], fogNow, 0.72), 0);
  stairLattice(g, cam, rot, 3600, mix([140, 133, 121], fogNow, 0.52), 700);
  screen(g); g.fillStyle = rgba(fogNow, 0.25); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) fogBank(g, cam, cam.x - 6000 + i * 2200 + ((T * 140) % 2200), cam.y + 1600 + hash(i) * 900, 3500, 4200, 1300, 0.35 * (1 - night * 0.6), rot);

  drawStair3D(g, S6, cam, rot);
  setCam(g, cam.x, cam.y, kAt(cam, 45), rot);
  const sp = spineOnPath(P6, ss, SP0, R0);
  const sc = caseBounce(hangCase(S6, sp[0], R0 * 1.2, R0, 1), ts, crawl);
  drawCaterpillarSide(g, sp, { r: R0, dir: 1, yaw: 0.78, pitch: 0.14, lid: 0.36, hat: true, hatTilt: -0.12, suitcase: sc, holdLeg: 1 });

  // the light of the passing day, laid over everything
  screen(g);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgba(mix(mix([255, 255, 255], [255, 196, 140], dusk * 0.55), [104, 114, 146], night * 0.85)); g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  if (night > 0.02) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const mx = 1500 - ph * 400, my = 210 + Math.abs(ph - 0.5) * 300;
    const mg = g.createRadialGradient(mx, my, 0, mx, my, 160);
    mg.addColorStop(0, `rgba(220,226,240,${0.5 * night})`); mg.addColorStop(0.25, `rgba(200,208,228,${0.25 * night})`); mg.addColorStop(1, 'rgba(160,170,200,0)');
    g.fillStyle = mg; g.fillRect(mx - 160, my - 160, 320, 320);
    g.fillStyle = `rgba(236,238,244,${0.75 * night})`; g.beginPath(); g.arc(mx, my, 26, 0, TAU); g.fill();
    for (let i = 0; i < 60; i++) { const a = night * (0.3 + 0.5 * hash(i + 5)) * (0.6 + 0.4 * Math.sin(T * 3 + i)); g.fillStyle = `rgba(230,232,240,${a})`; g.fillRect(hash(i) * W, hash(i + 0.3) * H * 0.45, 1.6, 1.6); }
    g.restore();
  }
}

/* ================================================================== SCENE 07 — THE ABANDONED */
const S7 = { x0: -200 * 44, y0: 200 * 64, rise: 64, run: 44, n: 420, Z0: 0, Z1: 430, U: 420, tex: 0.55, wall: 1400, wallShade: 'rgba(78,72,64,0.5)' };
let P7 = null, L7 = 0;
const ZH7 = 210;
/* the ones who stopped: k = step, z = depth, pose */
const STILL7 = [
  { k: 197.4, z: 388, dir: -1, pal: 'pale', pitch: -0.45, lid: 0.85, yaw: -0.6 },
  { k: 199.6, z: 388, dir: 1, pal: 'old', pitch: -0.1, lid: 0.55, yaw: 0.25 },
  { k: 201.5, z: 388, dir: -1, pal: 'pale', pitch: -0.55, lid: 1, yaw: -0.3 },
  { k: 204.6, z: 388, dir: 1, pal: 'old', pitch: -0.35, lid: 0.7, yaw: 0.5 },
  { k: 207.4, z: 388, dir: -1, pal: 'pale', pitch: -0.2, lid: 0.6, yaw: -0.15 },
  { k: 210.5, z: 388, dir: 1, pal: 'pale', pitch: -0.5, lid: 0.9, yaw: 0.4 },
];
const BONES7 = [
  { k: 202.3, z: 150, pose: 'sit', dir: 1, flag: true },
  { k: 203.4, z: 140, pose: 'lie', dir: -1, openCase: true },
  { k: 206.2, z: 155, pose: 'lie', dir: 1 },
  { k: 208.6, z: 135, pose: 'lie', dir: -1 },
  { k: 209.3, z: 160, pose: 'sit', dir: -1 },
];
/* compact spines that fit on one tread */
function slumpSpine(hx, gy, r, dir, rear, droop) {
  const sp = r * 0.92, pts = [];
  const rad = i => r * (1 - 0.3 * Math.pow((i - 1) / 5, 1.4));
  for (let i = 2; i < 7; i++) pts[i] = { x: hx - dir * sp * (i - 1) * 0.9, y: gy - rad(i) - (i === 2 ? r * 0.15 : 0) + boil(i * 3 + hx, r * 0.02) };
  pts[1] = { x: pts[2].x + dir * Math.cos(rear) * sp, y: pts[2].y - Math.sin(rear) * sp };
  pts[0] = { x: pts[1].x + dir * Math.cos(rear - droop) * sp * 1.05, y: pts[1].y - Math.sin(rear - droop) * sp * 1.05 };
  return pts;
}
function scene7(g, lt, dur) {
  if (!P7) { P7 = buildStairPath(S7, 195, 220, R0, 0); L7 = P7.len / 26; }
  const ts = SF / 12 - SCENES[1].start;
  const P0 = 7.2, P1 = 10.9;
  const tmap = t => t < P0 ? t : t < P1 ? P0 : t - (P1 - P0);
  const crawl = { s0: 5.2 * L7, period: 0.85, stride: 24, n: 7, spacing: SP0, lag: 0.09, tmap };
  const ss = crawlS(ts, crawl);
  const te = easedTime(lt, P0, P1, 0.35);
  const kf = 195 + (crawl.s0 + (te / crawl.period) * crawl.stride - 3 * SP0) / L7;
  const cam = camOn(S7.x0 + kf * S7.run, S7.y0 - kf * S7.rise - 30, ZH7, 340, 980, 560);
  const rot = 0.0;
  sky(g, [214, 208, 194], [150, 144, 132]);
  stairLattice(g, cam, rot, 9000, mix([140, 133, 121], FOGC, 0.7), 300);
  drawStair3D(g, S7, cam, rot);
  const env = { k: 0.9, warm: [0, 0, 0], wa: 0, lx: -0.5, ly: -0.8, rim: 0.45 };
  // against the wall: motionless
  for (const m of STILL7) {
    const k = kAt(cam, m.z); setCam(g, cam.x, cam.y, k, rot);
    const tp = treadPt(S7, Math.floor(m.k));
    const sp = slumpSpine(tp.x + (m.k % 1 - 0.5) * S7.run * 0.4, tp.y, R0 * 0.95, m.dir, 0.9, 0.9 + m.pitch);
    drawCaterpillarSide(g, sp, { r: R0 * 0.95, dir: m.dir, pal: m.pal === 'old' ? PALE_OLD : PALE, env: Object.assign({}, env, { k: 0.78 }),
      yaw: m.yaw, pitch: m.pitch, lid: m.lid, elder: m.pal === 'old', groundShadow: true });
  }
  // the hero
  const looking = smooth(P0 + 0.2, P0 + 0.8, ts) * (1 - smooth(P1 - 1.6, P1 - 1.0, ts));
  const adjust = smooth(P1 - 1.4, P1 - 0.9, ts) * (1 - smooth(P1 - 0.45, P1 - 0.05, ts));
  setCam(g, cam.x, cam.y, kAt(cam, ZH7), rot);
  const sp = spineOnPath(P7, ss, SP0, R0);
  const sc = caseBounce(hangCase(S7, sp[0], R0 * 1.2, R0, 1), ts, crawl);
  drawCaterpillarSide(g, sp, {
    r: R0, dir: 1, env, hat: true, suitcase: sc, holdLeg: 1,
    yaw: lerp(0.78, 0.1, looking), pitch: lerp(0.14, -0.28, looking), lid: lerp(0.36, 0.42, looking),
    hatTilt: -0.12 + adjust * 0.18 * Math.sin(ts * 9), hatLift: adjust * 0.14, adjust,
  });
  // the ones who did not get up again, nearer to us
  for (const b of BONES7.slice().sort((a, c) => c.z - a.z)) {
    const k = kAt(cam, b.z); setCam(g, cam.x, cam.y, k, rot);
    const tp = treadPt(S7, Math.floor(b.k)), x = tp.x + (b.k % 1 - 0.5) * S7.run * 0.5;
    if (b.openCase) drawOpenSuitcase(g, x + b.dir * 30, tp.y, R0 * 3.9, R0 * 2.9, env);
    const sp2 = b.pose === 'sit' ? slumpSpine(x, tp.y, R0 * 0.95, b.dir, 1.25, 0.15) : slumpSpine(x, tp.y, R0 * 0.95, b.dir, 0.1, -0.05);
    if (b.pose === 'lie') sp2[0].y = tp.y - R0 * 1.1, sp2[1].y = tp.y - R0 * 0.95;
    drawSkeleton(g, sp2, { r: R0 * 0.95, dir: b.dir, env, flag: b.flag, yaw: b.dir * 0.5 });
  }
}

/* ================================================================== SCENE 08 — THE MESSAGES */
const LEDGE8 = 880;
let GLYPHS8 = null, P8 = null;
/* carved symbols: the wall's vocabulary, from plain encouragement to something stranger */
function glyphPath(type, s, R) {
  const p = new Path2D();
  const cat = (x, y, sc) => { for (let i = 0; i < 5; i++) { p.moveTo(x - i * sc * 0.42 + sc * 0.16, y); p.arc(x - i * sc * 0.42, y, sc * 0.16, 0, TAU); } p.moveTo(x + sc * 0.62, y - sc * 0.08); p.arc(x + sc * 0.42, y - sc * 0.08, sc * 0.2, 0, TAU); p.moveTo(x + sc * 0.4, y - sc * 0.26); p.lineTo(x + sc * 0.32, y - sc * 0.5); p.moveTo(x + sc * 0.5, y - sc * 0.26); p.lineTo(x + sc * 0.62, y - sc * 0.48); };
  const stairs = (x, y, sc, n) => { p.moveTo(x, y); for (let i = 0; i < n; i++) { p.lineTo(x + i * sc, y - (i + 1) * sc); p.lineTo(x + (i + 1) * sc, y - (i + 1) * sc); } };
  const bfly = (x, y, sc) => { for (const m of [-1, 1]) { p.moveTo(x, y); p.bezierCurveTo(x + m * sc * 0.6, y - sc * 0.9, x + m * sc * 1.1, y - sc * 0.4, x, y); p.moveTo(x, y); p.bezierCurveTo(x + m * sc * 0.8, y + sc * 0.2, x + m * sc * 0.5, y + sc * 0.8, x, y); } p.moveTo(x, y - sc * 0.4); p.lineTo(x, y + sc * 0.5); };
  switch (type) {
    case 'tally': { const n = 3 + Math.floor(R() * 3); for (let i = 0; i < Math.min(n, 4); i++) { p.moveTo(i * s * 0.22, 0); p.lineTo(i * s * 0.22 + (R() - 0.5) * 4, -s * 0.8); } if (n >= 5) { p.moveTo(-s * 0.1, -s * 0.15); p.lineTo(s * 0.78, -s * 0.65); } break; }
    case 'arrow': p.moveTo(0, 0); p.lineTo(0, -s); p.moveTo(-s * 0.3, -s * 0.66); p.lineTo(0, -s); p.lineTo(s * 0.3, -s * 0.66); break;
    case 'stairs': stairs(0, 0, s * 0.18, 5); p.moveTo(s * 0.9, -s * 0.9); p.lineTo(s * 0.9, -s * 1.25); p.moveTo(s * 0.78, -s * 1.12); p.lineTo(s * 0.9, -s * 1.25); p.lineTo(s * 1.02, -s * 1.12); break;
    case 'cat': cat(0, -s * 0.3, s); break;
    case 'catstairs': stairs(-s * 0.6, 0, s * 0.2, 6); cat(-s * 0.1, -s * 0.7, s * 0.45); break;
    case 'bfly': bfly(0, -s * 0.5, s * 0.6); break;
    case 'sun': p.moveTo(s * 0.25, -s * 0.5); p.arc(0, -s * 0.5, s * 0.25, 0, TAU); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; p.moveTo(Math.cos(a) * s * 0.36, -s * 0.5 + Math.sin(a) * s * 0.36); p.lineTo(Math.cos(a) * s * 0.55, -s * 0.5 + Math.sin(a) * s * 0.55); } break;
    case 'spiral': { p.moveTo(0, -s * 0.5); for (let a = 0; a < TAU * 4; a += 0.2) p.lineTo(Math.cos(a) * a * s * 0.02, -s * 0.5 + Math.sin(a) * a * s * 0.02); break; }
    case 'rings': for (let i = 1; i <= 5; i++) { p.moveTo(i * s * 0.1, -s * 0.5); p.arc(0, -s * 0.5, i * s * 0.1, 0, TAU); } break;
    case 'eye': p.moveTo(-s * 0.5, -s * 0.5); p.quadraticCurveTo(0, -s * 0.95, s * 0.5, -s * 0.5); p.quadraticCurveTo(0, -s * 0.05, -s * 0.5, -s * 0.5); p.moveTo(s * 0.15, -s * 0.5); p.arc(0, -s * 0.5, s * 0.15, 0, TAU); break;
    case 'bflyring': for (let i = 1; i <= 3; i++) { p.moveTo(i * s * 0.17, -s * 0.5); p.arc(0, -s * 0.5, i * s * 0.17, 0, TAU); } bfly(0, -s * 0.5, s * 0.22); break;
  }
  return p;
}
function buildGlyphs8() {
  const R = rng(808), out = [];
  for (let x = -300; x < 4200;) {
    const st = 1 - smooth(500, 2700, x);            // how strange the wall has become here
    const gap = lerp(150, 46, st);
    for (const row of [150, 300, 450, 600, 740]) {
      if (R() < 0.25 - st * 0.2) continue;
      let type;
      const r = R();
      if (st < 0.3) type = r < 0.35 ? 'tally' : r < 0.6 ? 'arrow' : r < 0.8 ? 'stairs' : r < 0.93 ? 'cat' : 'sun';
      else if (st < 0.7) type = r < 0.2 ? 'catstairs' : r < 0.4 ? 'bfly' : r < 0.55 ? 'eye' : r < 0.7 ? 'spiral' : r < 0.85 ? 'arrow' : 'tally';
      else type = ['catstairs', 'rings', 'bflyring', 'eye', 'spiral'][Math.floor((x / 46 + row / 150) % 5 + 5) % 5];
      const s = st > 0.7 ? 40 : 44 + R() * 30;
      out.push({ x: x + (R() - 0.5) * gap * 0.3 * (1 - st), y: row + 45 + (R() - 0.5) * 30 * (1 - st), rot: (R() - 0.5) * 0.3 * (1 - st), w: lerp(5.5, 3.4, st) * (0.8 + R() * 0.4), path: glyphPath(type, s, R), s, a: 0.45 + R() * 0.55, worn: R() < 0.3 });
    }
    x += gap + R() * gap * 0.5 * (1 - st);
  }
  return out;
}
function scene8(g, lt, dur) {
  if (!GLYPHS8) GLYPHS8 = buildGlyphs8();
  const ts = SF / 12 - SCENES[2].start;
  const camX = 2200 - 175 * lt;                   // the wall drifts by, and gets stranger
  const buf = TEX.buf, b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  // wall, macro: the concrete grain is big here
  b.fillStyle = '#9d9585'; b.fillRect(0, 0, W, H);
  b.save(); b.translate(-camX * 1, 0); b.beginPath(); b.rect(camX, 0, W, LEDGE8); b.scale(2.2, 2.2);
  b.fillStyle = pat(b, 'concrete'); b.fill(); b.restore();
  b.fillStyle = 'rgba(70,62,52,0.28)'; b.fillRect(0, 0, W, LEDGE8);
  // raking light from the left, so every groove has a shadow side and a bright lip
  const rk = b.createLinearGradient(0, 0, W, 0);
  rk.addColorStop(0, 'rgba(255,236,200,0.18)'); rk.addColorStop(0.6, 'rgba(255,236,200,0.0)'); rk.addColorStop(1, 'rgba(20,16,12,0.25)');
  b.fillStyle = rk; b.fillRect(0, 0, W, LEDGE8);
  b.lineCap = 'round'; b.lineJoin = 'round';
  for (const gl of GLYPHS8) {
    const sx = gl.x - camX; if (sx < -120 || sx > W + 120) continue;
    b.globalAlpha = gl.a;
    if (gl.worn) b.setLineDash([gl.s * 0.3, gl.s * 0.08, gl.s * 0.12, gl.s * 0.05]);
    for (const [dx, dy, col, wk] of [[-1.6, -1.6, 'rgba(24,20,16,0.6)', 1], [1.3, 1.3, 'rgba(246,234,210,0.32)', 0.55], [0, 0, 'rgba(58,50,42,0.65)', 0.6]]) {
      b.save(); b.translate(sx + dx, gl.y + dy); b.rotate(gl.rot);
      b.strokeStyle = col; b.lineWidth = gl.w * wk; b.stroke(gl.path); b.restore();
    }
    b.setLineDash([]); b.globalAlpha = 1;
  }
  // air pockets in the pour: the wall's own pockmarks
  for (let i = 0; i < 160; i++) {
    const wx = hash(i * 3.3) * 4600 - 400, sx = wx - camX; if (sx < -20 || sx > W + 20) continue;
    const y = hash(i * 7.1) * (LEDGE8 - 30), rr = 2 + hash(i * 1.9) * 6;
    b.fillStyle = 'rgba(28,24,20,0.55)'; b.beginPath(); b.arc(sx, y, rr, 0, TAU); b.fill();
    b.strokeStyle = 'rgba(246,236,214,0.28)'; b.lineWidth = rr * 0.35; b.beginPath(); b.arc(sx, y, rr, 0.1 * Math.PI, 0.9 * Math.PI); b.stroke();
  }
  // a crack running along, and the ledge he walks on
  b.strokeStyle = 'rgba(30,25,20,0.5)'; b.lineWidth = 2;
  b.beginPath(); for (let x = 0; x <= W; x += 24) { const wx = x + camX; const y = 820 + vnoise(wx * 0.004) * 30 + vnoise(wx * 0.03) * 6; x ? b.lineTo(x, y) : b.moveTo(x, y); } b.stroke();
  b.save(); b.translate(-camX, 0); b.beginPath(); b.rect(camX, LEDGE8, W, H - LEDGE8); b.scale(2.2, 2.2); b.fillStyle = pat(b, 'concrete'); b.fill(); b.restore();
  const lg = b.createLinearGradient(0, LEDGE8, 0, H);
  lg.addColorStop(0, 'rgba(240,228,206,0.35)'); lg.addColorStop(0.09, 'rgba(240,228,206,0.15)'); lg.addColorStop(0.1, 'rgba(30,26,22,0.35)'); lg.addColorStop(1, 'rgba(20,16,12,0.7)');
  b.fillStyle = lg; b.fillRect(0, LEDGE8, W, H - LEDGE8);
  const ao = b.createLinearGradient(0, LEDGE8 - 40, 0, LEDGE8);
  ao.addColorStop(0, 'rgba(20,16,12,0)'); ao.addColorStop(1, 'rgba(20,16,12,0.35)'); b.fillStyle = ao; b.fillRect(0, LEDGE8 - 40, W, 40);

  // he passes through, his suitcase dragged behind on a strap
  const r = 19, sp0 = r * 1.45;
  if (!P8) { P8 = { xs: [], ys: [], len: 0 }; for (let i = 0; i <= 6000; i++) { P8.xs.push(-1200 + i); P8.ys.push(LEDGE8 + 18 - r); } P8.len = 6000; }
  const crawl = { s0: 860, period: 0.7, stride: r * 3.4, n: 7, spacing: sp0, lag: 0.07 };
  const ss = crawlS(ts, crawl).map(s => s + 175 * ts);    // the wall drifts right on screen, and so does he
  const sp = spineOnPath(P8, ss, sp0, r);
  const env = { k: 0.95, warm: [0, 0, 0], wa: 0, lx: -0.9, ly: -0.4, rim: 0.55, rimCol: [255, 228, 190], rimA: 0.35 };
  const tail = sp[6], cw = r * 3.9, chh = r * 2.9;
  const cx = tail.x - cw * 0.85 + boil(5, 1.5), cy = LEDGE8 + 18 - chh * 1.17 + Math.abs(boil(6, 2));
  b.strokeStyle = rgba(HERO.strap); b.lineWidth = r * 0.14;
  b.beginPath(); b.moveTo(tail.x - r * 0.4, tail.y + r * 0.2); b.quadraticCurveTo((tail.x + cx) / 2, cy - chh * 0.05, cx + cw * 0.17, cy + chh * 0.1); b.stroke();
  drawSuitcase(b, cx, cy, cw, chh, -0.04 + boil(7, 0.02), { pal: HERO, env, detail: 2 });
  drawCaterpillarSide(b, sp, { r, dir: 1, env, yaw: 0.85, pitch: 0.3, lid: 0.4, hat: true, hatTilt: -0.1, groundShadow: true });

  // shallow depth of field: the top of the wall and the ledge's edge fall soft
  screen(g); g.drawImage(buf, 0, 0);
  const sm = TEX.small, s2 = sm.getContext('2d');
  s2.setTransform(1, 0, 0, 1, 0, 0); s2.globalCompositeOperation = 'source-over'; s2.clearRect(0, 0, sm.width, sm.height);
  s2.drawImage(buf, 0, 0, sm.width, sm.height);
  s2.globalCompositeOperation = 'destination-in';
  const mg = s2.createLinearGradient(0, 0, 0, sm.height);
  mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(0.22, 'rgba(0,0,0,0)'); mg.addColorStop(0.9, 'rgba(0,0,0,0)'); mg.addColorStop(1, 'rgba(0,0,0,1)');
  s2.fillStyle = mg; s2.fillRect(0, 0, sm.width, sm.height);
  s2.globalCompositeOperation = 'source-over';
  g.drawImage(sm, 0, 0, W, H);
  // motes in the raking light
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const x = ((hash(i) * W + 175 * lt * (0.4 + hash(i + 3))) % W), y = (hash(i + 0.5) * LEDGE8 - lt * 8 + H) % LEDGE8;
    g.fillStyle = `rgba(255,236,200,${0.25 * (0.5 + 0.5 * Math.sin(T * 2 + i))})`; g.beginPath(); g.arc(x, y, 1.5 + hash(i + 9) * 2.5, 0, TAU); g.fill();
  }
  g.restore();
}

/* ================================================================== SCENE 09 — THE DESCENDING CATERPILLARS
 * Frontal and symmetrical: a corridor of stairs between two walls, vanishing up the middle.
 * He climbs the left lane, seen from behind; the procession comes down the right lane toward us.
 */
const F9 = { f: 900, camH: 1.1, hor: 560, rise: 0.17, run: 0.3, z0: 2.2, wall: 1.55, wallH: 6, rw: 0.1 };
const p9 = (x, y, z) => ({ x: 960 + F9.f * x / z, y: F9.hor - F9.f * (y - F9.camH) / z, k: F9.f / z });
/* where a walker stands for a fractional step position kf (hops between steps) */
function walk9(kf) {
  const k0 = Math.floor(kf), st = smooth(0.35, 0.85, kf - k0);
  return { y: (k0 + st) * F9.rise + Math.sin(st * Math.PI) * 0.035, z: F9.z0 + (k0 + 0.5 + st) * F9.run };
}
const LINES9 = { hero: [[4.4, 5.7], [8.6, 9.7]], medal: [[6.5, 7.1], [10.6, 11.0], [11.45, 12.35]] };
const PROC9 = [
  { pal: 'young', medal: true }, { pal: 'old', scroll: true }, { pal: 'young' }, { pal: 'old' },
  { pal: 'young' }, { pal: 'old' }, { pal: 'young' }, { pal: 'old' }, { pal: 'young' },
];
function drawCorridor9() {
  const g = ctx, { rise, run, z0, wall, wallH } = F9, N = 70, fogC = [214, 207, 192];
  const fogAt = z => smooth(3, 22, z);
  // side walls with pilasters, converging on the vanishing point
  for (const sd of [-1, 1]) {
    const x = sd * wall, a = p9(x, -4 * rise, z0 - 4 * run), b = p9(x, N * rise, z0 + N * run);
    const at = p9(x, -4 * rise + wallH, z0 - 4 * run), bt = p9(x, N * rise + wallH, z0 + N * run);
    const gr = g.createLinearGradient(a.x, 0, b.x, 0);
    gr.addColorStop(0, 'rgba(118,111,100,1)'); gr.addColorStop(1, rgba(fogC));
    g.fillStyle = gr; poly(g, [[a.x, a.y], [b.x, b.y], [bt.x, bt.y], [at.x, at.y]]); g.fill();
    for (let j = 0; j < N; j += 4) {
      const z1 = z0 + j * run, z2 = z1 + 0.5;
      const q1 = p9(x, j * rise - 0.4, z1), q2 = p9(x, j * rise - 0.4, z2), q3 = p9(x, j * rise + wallH, z2), q4 = p9(x, j * rise + wallH, z1);
      const fa = fogAt(z1);
      g.fillStyle = rgba(mix([196, 188, 172], fogC, fa)); poly(g, [[q1.x, q1.y], [q2.x, q2.y], [q3.x, q3.y], [q4.x, q4.y]]); g.fill();
      const e1 = p9(x, j * rise - 0.4, z2 + 0.04), e2 = p9(x, j * rise + wallH, z2 + 0.04);
      g.fillStyle = rgba(mix([70, 64, 56], fogC, fa)); poly(g, [[q2.x, q2.y], [e1.x, e1.y], [e2.x, e2.y], [q3.x, q3.y]]); g.fill();
    }
  }
  // the steps, far to near
  for (let k = N; k >= -4; k--) {
    const z = z0 + k * run, y = k * rise, fa = fogAt(z);
    if (y < F9.camH) {
      const a = p9(-wall, y, z), b = p9(wall, y, z), c = p9(wall, y, z + run), d = p9(-wall, y, z + run);
      poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]); concreteFill(g, 0.8, rgba(mix([226, 219, 204], fogC, fa), 0.55));
    }
    const a = p9(-wall, y - rise, z), b = p9(wall, y - rise, z), c = p9(wall, y, z), d = p9(-wall, y, z);
    poly(g, [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]]); concreteFill(g, 0.8, rgba(mix([92, 86, 76], fogC, fa), 0.6));
    g.strokeStyle = `rgba(246,240,226,${0.35 * (1 - fa)})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(c.x, c.y); g.stroke();
  }
}
function scene9(g, lt, dur) {
  const ts = SF / 12 - SCENES[3].start;
  const e = smooth(0, dur, lt);
  screen(g); g.fillStyle = '#d6cfbf'; g.fillRect(0, 0, W, H);
  // a very slow push: the frame tightens on the two of them
  const z = lerp(1, 1.08, e);
  ID(g); g.translate(W / 2 + WEAVE.x, 600 + WEAVE.y); g.scale(z, z); g.translate(-W / 2, -600);
  drawCorridor9();
  const env = { k: 0.95, warm: [0, 0, 0], wa: 0, lx: -0.3, ly: -0.9, rim: 0.45 };
  const actors = [];
  // the climber: up the left lane, then he stops
  const hkf = Math.min(2, ts / 3.1 * 2);
  const hw = walk9(hkf);
  actors.push({ z: hw.z, draw: () => {
    const p = p9(-0.4, hw.y, hw.z), r = F9.rw * p.k;
    const put = smooth(3.1, 3.7, ts), lookUp = smooth(3.7, 4.3, ts), watch = smooth(13.2, 14.2, ts);
    const w = r * 3.9, h = r * 2.9;
    const held = { x: p.x - r * 1.85, y: p.y - r * 1.62, w, h, ang: boil(77, 0.03), side: -1, held: true };
    const rest = { x: p.x - r * 2.7, y: p.y - h * 1.17, w, h, ang: 0, held: false };
    const sc = put < 1 ? { x: lerp(held.x, rest.x, put), y: lerp(held.y, rest.y, put), w, h, ang: held.ang * (1 - put), side: -1, held: true } : rest;
    drawCaterpillarBack(g, p.x, p.y, r, {
      pal: HERO, env, hat: true, suitcase: sc,
      yaw: lerp(lerp(Math.PI, 1.9, lookUp), 1.25, watch), pitch: lerp(0.1, 0.5, lookUp) * (1 - watch * 0.6),
      hatTilt: lerp(0, 0.16, lookUp) * (1 - watch) - 0.06 * watch, sway: Math.sin(ts * 0.8) * r * 0.04,
    });
  } });
  // the procession: down the right lane, pausing while the one with the medal talks
  const tmap = t => t < 4.0 ? t : t < 12.8 ? 4.0 : t - 8.8;
  PROC9.forEach((m, j) => {
    const kf = 3 + (4.0 - tmap(ts)) * 1.15 + j * 1.6;
    if (kf > 40) return;
    const pw = walk9(kf);
    actors.push({ z: pw.z, draw: () => {
      const p = p9(0.4, pw.y, pw.z), r = F9.rw * p.k;
      const fa = smooth(4, 14, pw.z);
      const envP = Object.assign({}, env, { k: lerp(0.95, 1.1, fa), warm: [214, 207, 192], wa: fa * 0.7 });
      const isMedal = !!m.medal;
      const facing = isMedal ? smooth(4.0, 4.5, ts) * (1 - smooth(12.6, 13.1, ts)) : 0;
      drawCaterpillarFront(g, p.x, p.y, r, {
        pal: m.pal === 'old' ? ELDER : YOUNG, env: envP, elder: m.pal === 'old', medal: m.medal, scroll: m.scroll, trail: 1,
        yaw: lerp(0, -0.42, facing), pitch: lerp(-0.05, -0.22, facing), lid: isMedal ? 0.18 : 0.32,
        smile: isMedal ? smooth(7.1, 7.6, ts) * (ts > 12.35 ? 1 : 0.75) : 0,
        mouthOpen: isMedal ? talk(ts, LINES9.medal, 40) : 0,
        arms: [0.05 * Math.sin(ts * 4 + j), 0.05 * Math.sin(ts * 4 + j + 1)],
      });
    } });
  });
  actors.sort((a, b) => b.z - a.z).forEach(a => a.draw());
  // haze up the corridor
  ID(g);
  const hz = g.createLinearGradient(0, 0, 0, H * 0.55);
  hz.addColorStop(0, 'rgba(222,216,202,0.55)'); hz.addColorStop(1, 'rgba(222,216,202,0)');
  g.fillStyle = hz; g.fillRect(0, 0, W, H * 0.55);
}

/* ================================================================== SCENE 10 — YEARS */
const S10 = { x0: -200 * 44, y0: 200 * 64, rise: 64, run: 44, n: 420, Z0: 0, Z1: 520, U: 420, tex: 0.55, wall: 1500, wallShade: 'rgba(84,78,70,0.5)' };
let P10 = null, L10 = 0;
const PLANTS10 = [{ k: 197, z: 500, s: 1.2 }, { k: 199, z: 30, s: 0.8 }, { k: 202, z: 470, s: 1.5 }, { k: 204, z: 120, s: 0.9 }, { k: 206, z: 505, s: 1.1 }];
function drawPlant(g, x, y, sc, grow, wither, seed) {
  if (grow <= 0.01) return;
  const green = [104, 132, 74], brown = [122, 94, 60];
  const col = rgba(mix(green, brown, wither)), h = 70 * sc * grow, droop = wither * 1.2;
  g.strokeStyle = col; g.lineWidth = 2.6 * sc; g.lineCap = 'round';
  for (let st = 0; st < 3; st++) {
    const lean = (hash(seed + st) - 0.5) * 0.8;
    const tx = x + Math.sin(lean + droop * (st - 1) * 0.6) * h, ty = y - Math.cos(lean + droop) * h * (0.6 + 0.4 * hash(seed + st + 3));
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.6, tx, ty); g.stroke();
    for (let l = 1; l <= 3; l++) {
      if (grow < l / 4) continue;
      const u = l / 4, lx = lerp(x, tx, u), ly = lerp(y, ty, u), side = l % 2 ? 1 : -1;
      g.fillStyle = col; g.save(); g.translate(lx, ly); g.rotate(side * (0.9 + droop * 0.8) + lean);
      g.beginPath(); g.ellipse(side * 7 * sc, 0, 8 * sc * (1 - wither * 0.4), 3.2 * sc, 0, 0, TAU); g.fill(); g.restore();
    }
  }
}
function scene10(g, lt, dur) {
  if (!P10) { P10 = buildStairPath(S10, 194, 214, R0, 0); L10 = P10.len / 21; }
  const ts = SF / 12 - SCENES[4].start;
  WEAR = smooth(0.5, dur - 1, lt);
  // he slows down
  const tmap = t => t - 0.36 * t * t / dur;
  const crawl = { s0: 4.2 * L10, period: 0.95, stride: 22, n: 7, spacing: SP0, lag: 0.1 + 0.06 * lt / dur, tmap };
  const ss = crawlS(ts, crawl);
  const cam = camOn(S10.x0 + 200.6 * S10.run, S10.y0 - 200.6 * S10.rise, 45, 330, 900, 620);   // locked off
  const rot = 0;
  // time lapse: days flicking past, a winter, a spring that comes and goes
  const day = 0.5 + 0.5 * Math.cos(TAU * ts / 1.15);
  const snowFall = smooth(3.2, 3.8, ts) * (1 - smooth(6.0, 6.6, ts));
  const snowLay = smooth(3.4, 5.6, ts) * (1 - smooth(6.3, 7.4, ts));
  const grow = smooth(6.6, 9.4, ts), wither = smooth(9.6, 11.2, ts);
  const dust = smooth(0.5, dur, lt);
  sky(g, mix([60, 64, 78], [222, 216, 202], day), mix([40, 42, 50], [170, 164, 150], day));
  stairLattice(g, cam, rot, 9000, mix(mix([130, 124, 114], FOGC, 0.65), [60, 64, 78], 1 - day), 0);
  S10.treadDraw = (gg, c, i, xa, xb, yt) => {
    const a = proj3(c, xa, yt, S10.Z0), b = proj3(c, xb, yt, S10.Z0), cc = proj3(c, xb, yt, S10.Z1), d = proj3(c, xa, yt, S10.Z1);
    poly(gg, [[a.x, a.y], [b.x, b.y], [cc.x, cc.y], [d.x, d.y]]);
    if (dust > 0) { gg.fillStyle = `rgba(214,204,184,${0.3 * dust})`; gg.fill(); }
    if (snowLay > 0) { gg.fillStyle = `rgba(242,244,246,${0.92 * snowLay})`; gg.fill(); }
  };
  drawStair3D(g, S10, cam, rot);
  // cobwebs thicken in the corners
  setCam(g, cam.x, cam.y, kAt(cam, 480), rot);
  g.strokeStyle = `rgba(235,232,224,${0.35 * dust})`; g.lineWidth = 0.8;
  for (const k of [196, 201, 205]) {
    const x = S10.x0 + (k + 1) * S10.run, y = S10.y0 - (k + 1) * S10.rise;
    for (let j = 0; j < 7 * dust; j++) { g.beginPath(); g.moveTo(x, y - 40 - j * 5); g.quadraticCurveTo(x - 20, y - 18, x - 40 - j * 4, y); g.stroke(); }
  }
  for (const p of PLANTS10.slice().sort((a, b) => b.z - a.z)) {
    setCam(g, cam.x, cam.y, kAt(cam, p.z), rot);
    const tp = treadPt(S10, p.k);
    drawPlant(g, tp.x + S10.run * 0.42, tp.y, p.s, grow, wither, p.k);
  }
  setCam(g, cam.x, cam.y, kAt(cam, 45), rot);
  const sp = spineOnPath(P10, ss, SP0, R0);
  const sc = hangCase(S10, sp[0], R0 * 1.2, R0, 1);
  const env = { k: lerp(0.75, 1, day), warm: [40, 50, 80], wa: 0.12 * (1 - day), lx: lerp(0.6, -0.6, (ts / 1.15) % 1), ly: -0.8, rim: 0.45 };
  drawCaterpillarSide(g, sp, {
    r: R0, dir: 1, env, hat: true, hatTilt: -0.12 - 0.06 * WEAR, suitcase: sc, holdLeg: 1,
    yaw: 0.78, pitch: lerp(0.14, -0.12, WEAR), lid: lerp(0.36, 0.6, WEAR), tired: WEAR, snow: snowLay,
  });
  // falling snow
  if (snowFall > 0) {
    screen(g); g.fillStyle = 'rgba(244,246,248,0.85)';
    for (let i = 0; i < 260; i++) {
      const sp2 = 0.6 + hash(i) * 1.4, x = (hash(i + 1) * W + Math.sin(T * 2 + i) * 20 + T * 30 * sp2) % W, y = (hash(i + 2) * H + T * 260 * sp2) % H;
      if (hash(i + 3) > snowFall) continue;
      g.beginPath(); g.arc(x, y, 1 + sp2 * 1.4, 0, TAU); g.fill();
    }
  }
  // the light of a thousand days
  screen(g); g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgba(mix([132, 140, 166], [255, 255, 255], day)); g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
}

/* ================================================================== SCENE 11 — THE FEAR */
function scene11(g, lt, dur) {
  const ts = SF / 12 - SCENES[5].start;
  WEAR = 1;
  const bf = smooth(1.4, 3.4, ts) * (1 - smooth(5.6, 7.2, ts));
  const warp = smooth(4.4, 7.0, ts);
  const self = smooth(6.8, 8.6, ts);
  const up = easeIO(smooth(8.8, 10.6, ts));
  const shadow = smooth(9.2, 11.2, ts);
  // cold, flat, blurred stair behind him
  const b = TEX.small, bs = b.getContext('2d');
  bs.setTransform(1, 0, 0, 1, 0, 0); bs.globalCompositeOperation = 'source-over';
  const bgG = bs.createLinearGradient(0, 0, 0, b.height); bgG.addColorStop(0, '#6c6d6c'); bgG.addColorStop(1, '#2f302f');
  bs.fillStyle = bgG; bs.fillRect(0, 0, b.width, b.height);
  bs.save(); bs.scale(b.width / W, b.height / H); bs.translate(0, up * 160);
  for (let i = -6; i < 14; i++) {
    const y = 980 - i * 110, x = 300 + i * 140;
    bs.fillStyle = 'rgba(150,150,146,0.35)'; bs.fillRect(x - 900, y - 18, 2400, 22);
    bs.fillStyle = 'rgba(20,20,20,0.25)'; bs.fillRect(x - 900, y + 4, 2400, 80);
  }
  bs.restore();
  screen(g); g.drawImage(b, 0, 0, W, H);
  // the face, filling the frame
  const z = lerp(1, 1.07, smooth(0, dur, lt));
  setCam(g, 960 + Math.sin(lt * 0.4) * 6, 560 - up * 40, z, 0);
  const R = 470, hx = 960, hy = 640 + up * 30;
  const env = { k: 0.82, warm: [110, 122, 140], wa: 0.12, lx: -0.35, ly: -0.9, rim: 0.55, rimCol: [190, 200, 215], rimA: 0.35 };
  const o = {
    pal: HERO, env, detail: 2, hat: true, hatTilt: -0.04 - up * 0.06, yaw: -0.04 + Math.sin(lt * 0.5) * 0.02, pitch: lerp(0.08, 0.62, up),
    lid: Math.max(lerp(0.46, 0.2, bf) + 0.12 * self, blinkAt(ts, [5.0, 8.4])), tired: 1,
    reflect: 0, reflectB: bf, reflectWarp: warp, selfReflect: self * (1 - up * 0.6), stairReflect: up, brimShadow: shadow * 0.9,
  };
  // the neck below, out of focus at the bottom of frame
  drawSegment(g, hx, hy + R * 1.35, R * 0.95, 0, Object.assign({}, o, { env: Object.assign({}, env, { k: 0.6 }) }), 1, { x: 0, y: 1 });
  drawHead(g, hx, hy, R, o);
  if (bf > 0) {
    // a little warmth on the face while the vision lasts
    screen(g); g.save(); g.globalCompositeOperation = 'lighter';
    const wg = g.createRadialGradient(960, 700, 0, 960, 700, 700);
    wg.addColorStop(0, `rgba(255,190,100,${0.12 * bf})`); wg.addColorStop(1, 'rgba(255,190,100,0)');
    g.fillStyle = wg; g.fillRect(0, 0, W, H); g.restore();
  }
}
function blinkAt(t, times) { let l = 0; for (const b of times) { const d = Math.abs(t - b); if (d < 0.2) l = Math.max(l, 1 - d / 0.2); } return l; }

startFilm([
  { name: 'Thousands of Steps',          start: 0,  dur: 12, fn: scene6 },
  { name: 'The Abandoned',               start: 12, dur: 13, fn: scene7 },
  { name: 'The Messages',                start: 25, dur: 11, fn: scene8 },
  { name: 'The Descending Caterpillars', start: 36, dur: 17, fn: scene9 },
  { name: 'Years',                       start: 53, dur: 12, fn: scene10 },
  { name: 'The Fear',                    start: 65, dur: 12, fn: scene11 },
]);
