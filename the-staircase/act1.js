/* THE STAIRCASE — Act 1: The Promise
 * Scenes 01–04. Needs engine.js.
 */
'use strict';

/* ================================================================== SCENE 01 — THE ENDLESS STAIRCASE
 * A full 3D camera here (yaw + pitch) so the pull-back can reveal the stair's width,
 * its flank, and the fog it climbs into. World: x right, y down, z away.
 */
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

startFilm([
  { name: 'The Endless Staircase', start: 0,  dur: 12, fn: scene1 },
  { name: 'The Mystery',           start: 12, dur: 10, fn: scene2 },
  { name: 'The Elders',            start: 22, dur: 13, fn: scene3 },
  { name: 'The Butterfly',         start: 35, dur: 10, fn: scene4 },
]);
