/* THE STAIRCASE — Act 4: Nothing
 * Scenes 16–20. Needs engine.js. The quietest act: static cameras, ordinary daylight, no effects
 * beyond the film stock itself. Same caterpillar, same hat (worn, a little crooked), same suitcase.
 */
'use strict';

const R0 = 8, SP0 = R0 * 1.45;
function camOn(ax, ay, Zc, d, sx, sy) { const k = 1000 / d; return { f: 1000, x: ax - (sx - W / 2) / k, y: ay - (sy - H / 2) / k, z: Zc - d }; }
const kAt = (cam, z) => cam.f / (z - cam.z);
const treadPt = (S, k) => ({ x: S.x0 + (k + 0.5) * S.run, y: S.y0 - (k + 1) * S.rise });
function sky(g, top, bottom) {
  screen(g); const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, rgba(top)); gr.addColorStop(1, rgba(bottom)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
/* the same staircase, copied in parallel into the haze */
function stairLattice(g, cam, rot, Z, col, phase) {
  const k = kAt(cam, Z); setCam(g, cam.x, cam.y, k, rot);
  const run = 44, rise = 64, per = 1700, px = 0.824 * per, py = 0.567 * per;
  const hw = W / 2 / k + 600, hh = H / 2 / k + 600, span = Math.ceil((hw * 2) / run) + 40;
  g.fillStyle = rgba(col); g.strokeStyle = rgba(mix(col, [255, 250, 240], 0.25)); g.lineWidth = Math.max(2, 1.5 / k);
  for (let j = -6; j <= 6; j++) {
    const ox = j * px + phase, oy = j * py, i0 = Math.floor((cam.x - hw - ox) / run) - 20, x0 = ox + i0 * run;
    const yAt = x => oy - ((x - ox) / run) * rise;
    if (Math.abs(yAt(cam.x) - cam.y) > hh + 3000) continue;
    g.save(); g.translate(x0, yAt(x0)); simpleStair(g, span, rise, run, 420); g.fill();
    g.beginPath(); for (let i = 0; i < span; i++) { g.moveTo(i * run, -(i + 1) * rise); g.lineTo((i + 1) * run, -(i + 1) * rise); } g.stroke();
    g.restore();
  }
}
/* sitting: tail tucked along one tread, front held up */
function sitSpine(hx, gy, r, dir, rear, droop) {
  const sp = r * 0.92, pts = [];
  const rad = i => r * (1 - 0.3 * Math.pow((i - 1) / 5, 1.4));
  for (let i = 2; i < 7; i++) pts[i] = { x: hx - dir * sp * (i - 1) * 0.9, y: gy - rad(i) - (i === 2 ? r * 0.15 : 0) };
  pts[1] = { x: pts[2].x + dir * Math.cos(rear) * sp, y: pts[2].y - Math.sin(rear) * sp };
  pts[0] = { x: pts[1].x + dir * Math.cos(rear - droop) * sp * 1.05, y: pts[1].y - Math.sin(rear - droop) * sp * 1.05 };
  return pts;
}
/* draw with his stop-motion jitter frozen: when he is still, he is completely still */
function still(frame, fn) { const sf = SF; SF = frame; fn(); SF = sf; }
const OTHER_HATS = [
  null, null, null,
  { hat: hex('#5c5a55'), hatLight: hex('#86837b'), hatDark: hex('#32312e'), band: hex('#22211f') },
  { hat: hex('#2b2826'), hatLight: hex('#4d4945'), hatDark: hex('#151312'), band: hex('#5a1f18') },
];
const OTHER_CASES = [null, null, { case: hex('#4f5a5e'), caseLight: hex('#71808a'), caseDark: hex('#2f3639'), strap: hex('#242a2c') }, { case: hex('#5b6346'), caseLight: hex('#7d8762'), caseDark: hex('#383d2b'), strap: hex('#2a2e20') }];
/* afternoon: plain, warm, ordinary */
const DAY = { k: 0.97, warm: [255, 226, 186], wa: 0.06, lx: 0.45, ly: -0.85, rim: 0.45 };
const HAT_CROOKED = -0.2;

/* ================================================================== SCENE 16 — SITTING DOWN */
const S16 = { x0: -200 * 44, y0: 200 * 64, rise: 64, run: 44, n: 420, Z0: 0, Z1: 680, U: 420, tex: 0.55 };
let P16 = null;
const ZH16 = 260;
const PASS16 = [
  { z: 520, s0: -260, pal: 'young', hat: 3, bag: 2, look: true },
  { z: 90, s0: -120, pal: 'old', hat: 0, bag: 0 },
  { z: 520, s0: 120, pal: 'old', hat: 0, bag: 3, look: true },
  { z: 90, s0: 260, pal: 'young', hat: 4, bag: 0 },
  { z: 520, s0: 470, pal: 'young', hat: 0, bag: 0 },
  { z: 90, s0: -420, pal: 'young', hat: 0, bag: 2 },
  { z: 520, s0: -640, pal: 'old', hat: 4, bag: 0, look: true },
];
function passers(g, cam, rot, P, S, list, ts, hx, lanes) {
  for (const m of list.slice().sort((a, b) => b.z - a.z)) {
    if (lanes && !lanes(m)) continue;
    const crawl = { s0: 0, period: 0.85 + hash(m.s0) * 0.2, stride: 22, n: 7, spacing: SP0, lag: 0.09 };
    crawl.s0 = P.len * 0.5 + m.s0;
    const ss = crawlS(ts, crawl);
    if (ss[6] < 5 || ss[0] > P.len - 5) continue;
    setCam(g, cam.x, cam.y, kAt(cam, m.z), rot);
    const sp = spineOnPath(P, ss, SP0, R0);
    const pal = Object.assign({}, m.pal === 'old' ? ELDER : YOUNG, OTHER_HATS[m.hat] || {}, OTHER_CASES[m.bag] || {});
    // a glance on the way past; nobody stops
    const near = m.look ? 1 - smooth(40, 110, Math.abs(sp[0].x - hx)) : 0;
    const o = { r: R0, dir: 1, pal, env: DAY, hat: !!OTHER_HATS[m.hat], elder: m.pal === 'old', yaw: lerp(0.75, 0.12, near), pitch: lerp(0.15, -0.05, near), lid: 0.35 };
    if (OTHER_CASES[m.bag]) { o.suitcase = hangCase(S, sp[0], R0 * 1.2, R0, 1); o.holdLeg = 1; }
    drawCaterpillarSide(g, sp, o);
  }
}
function drawHeroSitting(g, hx, gy, r, o) {
  const sp = sitSpine(hx, gy, r, 1, o.rear, o.droop);
  drawCaterpillarSide(g, sp, Object.assign({ r, dir: 1, pal: HERO, env: DAY, hat: true, tired: 0.6, groundShadow: true }, o));
  return sp;
}
function scene16(g, lt, dur) {
  if (!P16) P16 = buildStairPath(S16, 190, 212, R0, 0);
  const ts = SF / 12 - SCENES[0].start;
  WEAR = 1;
  const tp = treadPt(S16, 200), hx = tp.x + 10, gy = tp.y;
  const cam = camOn(hx, gy - 50, ZH16, 1150, 780, 620);
  const rot = 0;
  sky(g, [222, 214, 198], [186, 178, 162]);
  stairLattice(g, cam, rot, 12000, mix([168, 160, 146], [214, 206, 190], 0.7), 300);
  stairLattice(g, cam, rot, 5000, mix([150, 142, 128], [214, 206, 190], 0.55), 1100);
  drawStair3D(g, S16, cam, rot);
  passers(g, cam, rot, P16, S16, PASS16, ts, hx, m => m.z > ZH16);
  // him: lowering himself down, putting the case beside him, then nothing
  const lower = easeIO(smooth(0.5, 3.8, ts)), place = easeIO(smooth(3.9, 5.8, ts));
  const sitFrame = Math.floor((SCENES[0].start + 6.0) * 12);
  const drawHim = () => {
    setCam(g, cam.x, cam.y, kAt(cam, ZH16), rot);
    const R = R0 * 1.2;
    const rest = { x: hx - R0 * 3.4, y: gy - R0 * 2.9 * 1.17, w: R0 * 3.9, h: R0 * 2.9, ang: 0 };
    const o = {
      rear: lerp(1.35, 0.98, lower), droop: lerp(0.15, 0.08, lower),
      yaw: lerp(0.78, 0.5, lower), pitch: lerp(0.15, -0.02, lower), lid: lerp(0.45, 0.5, lower), hatTilt: HAT_CROOKED,
    };
    const sp0 = sitSpine(hx, gy, R0, 1, o.rear, o.droop);
    if (place < 1) {
      const hold = { x: sp0[0].x + R * 0.3, y: sp0[0].y + R * 0.7, w: rest.w, h: rest.h, ang: 0 };
      if (hold.y + rest.h * 1.17 > gy) hold.y = gy - rest.h * 1.17;
      o.suitcase = { x: lerp(hold.x, rest.x, place), y: lerp(hold.y, rest.y, place), w: rest.w, h: rest.h, ang: Math.sin(place * Math.PI) * 0.12 };
      o.holdLeg = 1;
    } else drawSuitcase(g, rest.x, rest.y, rest.w, rest.h, 0, { pal: HERO, env: DAY, detail: 1 });
    drawHeroSitting(g, hx, gy, R0, o);
  };
  if (ts >= 6.0) still(sitFrame, drawHim); else drawHim();
  passers(g, cam, rot, P16, S16, PASS16, ts, hx, m => m.z <= ZH16);
}

/* ================================================================== SCENE 17 — NOTHING HAPPENS */
const PASS17 = [
  { z: 520, s0: -380, pal: 'old', hat: 0, bag: 0 },
  { z: 520, s0: -40, pal: 'young', hat: 3, bag: 0 },
  { z: 520, s0: 300, pal: 'young', hat: 0, bag: 3 },
  { z: 520, s0: -720, pal: 'young', hat: 0, bag: 2 },
];
function scene17(g, lt, dur) {
  if (!P16) P16 = buildStairPath(S16, 190, 212, R0, 0);
  const ts = SF / 12 - SCENES[1].start;
  WEAR = 1;
  const tp = treadPt(S16, 200), hx = tp.x + 10, gy = tp.y;
  const cam = camOn(hx - 6, gy - 22, ZH16, 560, 1060, 650);
  const rot = 0;
  sky(g, [224, 216, 200], [190, 182, 166]);
  // the light, still up there, still a long way off
  screen(g);
  g.save(); g.globalCompositeOperation = 'lighter';
  const lg = g.createRadialGradient(1620, 120, 0, 1620, 120, 520);
  lg.addColorStop(0, 'rgba(255,224,160,0.45)'); lg.addColorStop(0.3, 'rgba(255,206,140,0.16)'); lg.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
  stairLattice(g, cam, rot, 9000, mix([168, 160, 146], [216, 208, 192], 0.72), 600);
  // a distant flight with its own climbers
  {
    const k = kAt(cam, 4200); setCam(g, cam.x, cam.y, k, rot);
    g.save(); g.translate(cam.x - 2600, cam.y + 2200);
    for (let c = 0; c < 6; c++) {
      const prog = ((c * 0.17 + T * 0.006) % 1) * 120;
      tinyCrawler(g, prog * 44 + 6, -prog * 64 - 230, 0, 10, rgba(mix([110, 132, 92], [216, 208, 192], 0.55)), (T * 0.9 + c * 0.3) % 1);
    }
    g.restore();
  }
  drawStair3D(g, S16, cam, rot);
  passers(g, cam, rot, P16, S16, PASS17, ts, hx, () => true);
  // him. Fifteen seconds of it. One blink, late, so we know he hasn't stopped altogether.
  const blink = (() => { const d = Math.abs(ts - 10.9); return d < 0.18 ? 1 - d / 0.18 : 0; })();
  still(Math.floor((SCENES[0].start + 6.0) * 12), () => {
    setCam(g, cam.x, cam.y, kAt(cam, ZH16), rot);
    drawSuitcase(g, hx - R0 * 3.4, gy - R0 * 2.9 * 1.17, R0 * 3.9, R0 * 2.9, 0, { pal: HERO, env: DAY, detail: 2 });
    drawHeroSitting(g, hx, gy, R0, { rear: 0.98, droop: 0.08, yaw: 0.5, pitch: -0.02, lid: Math.max(0.5, blink), hatTilt: HAT_CROOKED });
  });
}

/* ================================================================== SCENE 18 — STILL A CATERPILLAR */
/* soft, out-of-focus concrete in daylight: the backdrop for close shots */
function softGround(g, tone, lightX, horizon) {
  const b = TEX.small, s = b.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over';
  const gr = s.createLinearGradient(0, 0, 0, b.height);
  gr.addColorStop(0, rgba(mix(tone, [255, 248, 232], 0.25))); gr.addColorStop(horizon, rgba(tone)); gr.addColorStop(1, rgba(mix(tone, [60, 54, 46], 0.4)));
  s.fillStyle = gr; s.fillRect(0, 0, b.width, b.height);
  s.save(); s.scale(0.5, 0.5); s.fillStyle = pat(s, 'concrete'); s.globalAlpha = 0.5; s.fillRect(0, 0, b.width * 2, b.height * 2); s.restore();
  const lg = s.createRadialGradient(b.width * lightX, b.height * 0.2, 0, b.width * lightX, b.height * 0.2, b.width * 0.7);
  lg.addColorStop(0, 'rgba(255,236,200,0.35)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
  s.fillStyle = lg; s.fillRect(0, 0, b.width, b.height);
  screen(g); g.imageSmoothingQuality = 'high'; g.drawImage(b, 0, 0, W, H);
}
/* a crack in the concrete, and the small thing growing out of it */
function crackPath(g, x, y, len, ang, seed, w) {
  // a real gap: two ragged lips, dark inside, a bright edge where the light catches it
  const n = 22, top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, wob = (hash(seed + i) - 0.5) * len * 0.07 + Math.sin(u * 9 + seed) * len * 0.015;
    const cx = x + Math.cos(ang) * len * u - Math.sin(ang) * wob, cy = y + Math.sin(ang) * len * u + Math.cos(ang) * wob;
    const ww = w * (0.25 + Math.sin(u * Math.PI) * 0.9 + hash(seed + i + 9) * 0.4);
    top.push([cx - Math.sin(ang) * ww * 0.5 + (hash(seed + i + 3) - 0.5) * w * 0.3, cy + Math.cos(ang) * -ww * 0.5]);
    bot.push([cx + Math.sin(ang) * ww * 0.5, cy + Math.cos(ang) * ww * 0.5 + (hash(seed + i + 5) - 0.5) * w * 0.3]);
  }
  g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath();
  g.fillStyle = 'rgba(26,20,15,0.9)'; g.fill();
  g.strokeStyle = 'rgba(246,234,210,0.35)'; g.lineWidth = Math.max(1, w * 0.18); g.lineJoin = 'round';
  g.beginPath(); bot.forEach((p, i) => i ? g.lineTo(p[0], p[1] + w * 0.12) : g.moveTo(p[0], p[1] + w * 0.12)); g.stroke();
  g.strokeStyle = 'rgba(40,32,24,0.35)'; g.lineWidth = Math.max(1, w * 0.3);
  g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1] - w * 0.15) : g.moveTo(p[0], p[1] - w * 0.15)); g.stroke();
  // grit along the edges
  g.fillStyle = 'rgba(70,60,48,0.5)';
  for (let i = 0; i < n * 2; i++) { const p = (i % 2 ? top : bot)[i >> 1]; g.beginPath(); g.arc(p[0] + (hash(seed + i * 3) - 0.5) * w * 1.5, p[1] + (hash(seed + i * 7) - 0.5) * w * 1.5, w * 0.08 + hash(i) * w * 0.12, 0, TAU); g.fill(); }
}
function drawFlower(g, bx, by, h, sway, open, light) {
  // stem, bending with the wind
  const tipX = bx + Math.sin(sway) * h * 0.55, tipY = by - Math.cos(sway * 0.6) * h;
  g.strokeStyle = rgba(mix([88, 116, 62], [150, 170, 110], light * 0.4)); g.lineWidth = h * 0.028; g.lineCap = 'round';
  g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + Math.sin(sway) * h * 0.1, by - h * 0.55, tipX, tipY); g.stroke();
  // two leaves
  for (const [u, side] of [[0.3, -1], [0.5, 1]]) {
    const lx = lerp(bx, tipX, u), ly = lerp(by, tipY, u);
    g.save(); g.translate(lx, ly); g.rotate(side * (0.9 + Math.sin(sway * 2 + u) * 0.15) - 0.2);
    const lg = g.createLinearGradient(0, 0, side * h * 0.22, 0);
    lg.addColorStop(0, rgba([84, 112, 60])); lg.addColorStop(1, rgba(mix([118, 146, 84], [200, 210, 150], light * 0.5)));
    g.fillStyle = lg; g.beginPath(); g.ellipse(side * h * 0.12, 0, h * 0.13, h * 0.04, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(60,80,40,0.5)'; g.lineWidth = h * 0.005; g.beginPath(); g.moveTo(0, 0); g.lineTo(side * h * 0.22, 0); g.stroke();
    g.restore();
  }
  // the head: a small, plain, slightly lopsided daisy facing the sun
  g.save(); g.translate(tipX, tipY); g.rotate(sway * 0.8 + 0.15); g.scale(1, 0.62);
  const pr = h * 0.2 * open;
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * TAU + hash(i) * 0.15, flick = Math.sin(T * 3.1 + i * 1.7) * 0.05;
    g.save(); g.rotate(a + flick);
    const pg = g.createLinearGradient(0, 0, pr, 0);
    pg.addColorStop(0, rgba(mix([232, 222, 196], [255, 244, 214], light))); pg.addColorStop(1, rgba(mix([214, 200, 170], [255, 236, 196], light)));
    g.fillStyle = pg; g.beginPath(); g.ellipse(pr * 0.55, 0, pr * (0.5 + hash(i + 3) * 0.08), pr * 0.16, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(150,130,100,0.35)'; g.lineWidth = pr * 0.02; g.stroke();
    g.restore();
  }
  const cg = g.createRadialGradient(-pr * 0.05, -pr * 0.08, 0, 0, 0, pr * 0.28);
  cg.addColorStop(0, rgba(mix([226, 168, 70], [255, 214, 120], light))); cg.addColorStop(1, rgba([160, 104, 36]));
  g.fillStyle = cg; g.beginPath(); g.arc(0, 0, pr * 0.27, 0, TAU); g.fill();
  g.fillStyle = 'rgba(110,70,24,0.55)';
  for (let i = 0; i < 18; i++) { const a = i * 2.4, rr = Math.sqrt(i / 18) * pr * 0.22; g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, pr * 0.018, 0, TAU); g.fill(); }
  g.restore();
  return { x: tipX, y: tipY };
}
function scene18(g, lt, dur) {
  const ts = SF / 12 - SCENES[2].start;
  WEAR = 1;
  const cuts = [3.2, 6.4, 8.6];
  const shot = ts < cuts[0] ? 0 : ts < cuts[1] ? 1 : ts < cuts[2] ? 2 : 3;
  const env = Object.assign({}, DAY, { rimCol: [255, 236, 200], rimA: 0.25 });
  if (shot === 0) {
    // he looks at his legs
    softGround(g, [176, 166, 148], 0.7, 0.62);
    setCam(g, 960 + Math.sin(lt * 0.3) * 4, 560, 1, 0);
    const r = 92, sp = sitSpine(1180, 1010, r, 1, 1.0, 0.75);
    drawCaterpillarSide(g, sp, { r, dir: 1, pal: HERO, env, hat: true, hatTilt: HAT_CROOKED, yaw: 0.4, pitch: -0.65, lid: 0.55, tired: 0.6, flex: smooth(0.6, 1.4, ts), detail: 2 });
  } else if (shot === 1) {
    // he looks back along his body
    softGround(g, [180, 170, 152], 0.3, 0.6);
    setCam(g, 960 - (ts - cuts[0]) * 6, 560, 1, 0);
    const r = 78, sp = sitSpine(1500, 900, r, 1, 0.9, 0.2);
    drawCaterpillarSide(g, sp, { r, dir: 1, pal: HERO, env, hat: true, hatTilt: HAT_CROOKED, yaw: lerp(0.2, -0.75, smooth(cuts[0] + 0.4, cuts[0] + 1.4, ts)), pitch: -0.3, lid: 0.45, tired: 0.6, detail: 2 });
  } else if (shot === 2) {
    // he looks up at the staircase: still going
    const b = TEX.small, s = b.getContext('2d');
    s.setTransform(1, 0, 0, 1, 0, 0); s.fillStyle = '#c9c0ad'; s.fillRect(0, 0, b.width, b.height);
    s.save(); s.scale(b.width / W, b.height / H);
    for (let i = -4; i < 16; i++) { const y = 1100 - i * 120, x = 200 + i * 90; s.fillStyle = 'rgba(244,236,220,0.6)'; s.fillRect(x - 1400, y - 16, 3200, 20); s.fillStyle = 'rgba(110,100,86,0.35)'; s.fillRect(x - 1400, y + 4, 3200, 90); }
    const lg = s.createRadialGradient(1500, 80, 0, 1500, 80, 600); lg.addColorStop(0, 'rgba(255,226,170,0.6)'); lg.addColorStop(1, 'rgba(255,226,170,0)'); s.fillStyle = lg; s.fillRect(0, 0, W, H);
    s.restore();
    screen(g); g.drawImage(b, 0, 0, W, H);
    setCam(g, 960, 560, 1, 0);
    const R = 330;
    drawHead(g, 840, 720, R, { pal: HERO, env, detail: 2, hat: true, hatTilt: HAT_CROOKED - 0.04, yaw: 0.45, pitch: lerp(0.2, 0.62, smooth(cuts[1] + 0.2, cuts[1] + 1.2, ts)), lid: 0.38, tired: 0.8 });
  } else {
    // and then, beside him, a crack in the step
    const u = smooth(cuts[2], dur, ts);
    softGround(g, [184, 174, 156], 0.75, 0.3);
    const z = lerp(1, 1.9, easeSine(u)), fx = 1240, fy = 700;
    ID(g); g.translate(W / 2 + WEAVE.x, H / 2 + WEAVE.y); g.scale(z, z); g.translate(-lerp(960, fx, u), -lerp(540, fy - 60, u));
    g.save(); g.globalAlpha = 0.5; g.scale(3, 3); g.beginPath(); g.rect(0, 0, W, H); g.fillStyle = pat(g, 'concrete'); g.fill(); g.restore();
    crackPath(g, 760, 560, 960, 0.2, 77, 16);
    crackPath(g, 1190, 700, 260, -0.95, 91, 7);
    g.fillStyle = 'rgba(96,120,70,0.7)';
    for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(fx - 60 + hash(i) * 110, fy + 8 + (hash(i + 4) - 0.5) * 18, 2 + hash(i + 8) * 4, 0, TAU); g.fill(); }
    drawFlower(g, fx, fy + 6, 130, Math.sin(T * 1.2) * 0.06 + vnoise(T * 0.7) * 0.05, 1, 0.4);
  }
  // a breath of black between the shots
  let dip = 0; for (const c of cuts) dip = Math.max(dip, 1 - Math.abs(ts - c) / 0.14);
  if (dip > 0) { screen(g); g.fillStyle = `rgba(0,0,0,${clamp(dip)})`; g.fillRect(0, 0, W, H); }
}

/* ================================================================== SCENE 19 — THE FLOWER */
function scene19(g, lt, dur) {
  const ts = SF / 12 - SCENES[3].start;
  WEAR = 1;
  const wind = Math.sin(T * 1.15) * 0.07 + vnoise(T * 0.6) * 0.06 + vnoise(T * 2.3) * 0.015;
  const lean = easeSine(smooth(1.5, 9.5, lt));
  // warm afternoon: low sun from the right
  const b = TEX.small, s = b.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over';
  const gr = s.createLinearGradient(0, 0, 0, b.height);
  gr.addColorStop(0, '#d9c49a'); gr.addColorStop(0.55, '#b9a37c'); gr.addColorStop(1, '#7e6c52');
  s.fillStyle = gr; s.fillRect(0, 0, b.width, b.height);
  s.save(); s.scale(0.45, 0.45); s.globalAlpha = 0.45; s.fillStyle = pat(s, 'concrete'); s.fillRect(0, 0, b.width * 3, b.height * 3); s.restore();
  const sun = s.createRadialGradient(b.width * 0.95, b.height * 0.1, 0, b.width * 0.95, b.height * 0.1, b.width * 0.8);
  sun.addColorStop(0, 'rgba(255,226,160,0.55)'); sun.addColorStop(1, 'rgba(255,226,160,0)'); s.fillStyle = sun; s.fillRect(0, 0, b.width, b.height);
  screen(g); g.drawImage(b, 0, 0, W, H);
  setCam(g, 960, 540, lerp(1, 1.05, lt / dur), 0);
  // the step's surface in focus near the flower, and the crack it grows from
  g.save(); g.globalAlpha = 0.35; g.scale(3.2, 3.2); g.fillStyle = pat(g, 'concrete'); g.fillRect(0, 720 / 3.2, W, 600); g.restore();
  crackPath(g, 640, 905, 1000, 0.04, 77, 22);
  const fx = 1230, fy = 905, fh = 380;
  // its shadow, long and soft, cast to the left across the step
  {
    const sb = TEX.shadow || (TEX.shadow = mk(W / 2, H / 2)), sg = sb.getContext('2d');
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, sb.width, sb.height);
    sg.scale(0.5, 0.5); sg.translate(fx, fy); sg.transform(1, 0, 1.7, 0.24, 0, 0); sg.translate(-fx, -fy);
    drawFlower(sg, fx, fy, fh, wind * 1.1, 1, 0);
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#2a2016'; sg.fillRect(0, 0, sb.width, sb.height);
    const soft = downsample(sb, 2);
    g.save(); g.globalAlpha = 0.3; g.drawImage(soft, 0, 0, W, H); g.restore();
  }
  g.fillStyle = 'rgba(92,118,66,0.8)';
  for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(fx - 90 + hash(i) * 170, fy + 6 + (hash(i + 4) - 0.5) * 20, 3 + hash(i + 8) * 6, 0, TAU); g.fill(); }
  // him, leaning in, his suitcase beside him at the edge of the frame
  const env = { k: 0.98, warm: [255, 214, 150], wa: 0.14, lx: 0.85, ly: -0.45, rim: 0.6, rimCol: [255, 226, 170], rimA: 0.45 };
  g.save(); g.globalAlpha = 0.9;
  drawSuitcase(g, 70, 470, 560, 420, 0, { pal: HERO, env, detail: 2 });
  g.restore();
  const hx = lerp(470, 640, lean), hy = lerp(700, 660, lean), R = 250;
  drawSegment(g, hx - 120, hy + R * 1.05, R * 0.9, 0, { pal: HERO, env, detail: 2 }, 1, { x: 0, y: 1 });
  const blink = (() => { const d = Math.abs(ts - 7.6); return d < 0.16 ? 1 - d / 0.16 : 0; })();
  drawHead(g, hx, hy, R, {
    pal: HERO, env, detail: 2, hat: true, hatTilt: HAT_CROOKED + 0.03, yaw: lerp(0.95, 1.05, lean), pitch: lerp(0.05, 0.2, lean),
    lid: Math.max(lerp(0.42, 0.28, lean), blink), tired: lerp(0.5, 0.2, lean), smile: smooth(5, 10, lt) * 0.28,
  });
  // the flower, in the sun
  drawFlower(g, fx, fy, fh, wind, 1, 1);
  // the odd mote drifting through the light, nothing more
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const x = (hash(i) * W + T * (6 + hash(i + 1) * 10)) % W, y = (hash(i + 2) * 700 + Math.sin(T * 0.5 + i) * 30);
    g.fillStyle = `rgba(255,236,190,${0.18 + 0.15 * Math.sin(T + i)})`; g.beginPath(); g.arc(x, y, 1.5 + hash(i + 5) * 2, 0, TAU); g.fill();
  }
  g.restore();
}

/* ================================================================== SCENE 20 — THE FINAL QUESTION
 * Act 1 began by pulling back from him at the foot of the stair. Act 4 ends the same way,
 * from a step somewhere in the middle of it.
 */
const ST20 = { XL: -2100, XR: 2100, rise: 64, run: 44 };
const K20 = 38, XH20 = -1820;
let CLIMB20 = null;
function climbSprite(variant, frame) {
  return sprite(`climb|${variant}|${frame}`, 160, 90, sg => {
    const pal = Object.assign({}, variant % 3 === 0 ? ELDER : YOUNG, variant === 4 ? OTHER_HATS[3] : variant === 5 ? OTHER_HATS[4] : {});
    const r = 9, sp = [];
    for (let i = 0; i < 7; i++) {
      const hump = frame ? Math.max(0, Math.sin(i * 0.9)) * r * 0.9 : 0;
      sp.push({ x: 40 + i * r * 1.4, y: 80 - r - hump - (i < 2 ? r * 0.8 * (2 - i) / 2 : 0) });
    }
    drawCaterpillarSide(sg, sp, { r, dir: -1, pal, env: DAY, hat: variant >= 4, yaw: -0.8, pitch: 0.2, lid: 0.35, detail: 1 });
  });
}
function scene20(g, lt, dur) {
  const ts = SF / 12 - SCENES[4].start;
  WEAR = 1;
  if (!CLIMB20) { const R = rng(2020); CLIMB20 = []; for (let i = 0; i < 240; i++) CLIMB20.push({ x: ST20.XL + 200 + R() * (ST20.XR - ST20.XL - 400), k: 6 + R() * 260, v: 0.25 + R() * 0.35, var: Math.floor(R() * 6), ph: R() }); }
  const { XL, XR, rise, run } = ST20;
  const hy = -(K20 + 1) * rise, hz = K20 * run + run * 0.55;
  // the camera drifts back and up, slowly, and keeps going
  const e = easeSine(smooth(0, dur * 0.97, lt));
  const dist = 330 * Math.pow(52000 / 330, e);
  const dir = norm3(lerp3([-0.84, 0.05, -0.54], [-0.42, -0.38, -0.82], Math.pow(e, 0.9)));
  const Tg = lerp3([XH20 + 20, hy - 30, hz], [-300, hy - 4200, hz + 3200], Math.pow(e, 1.6));
  const cam = makeCam([Tg[0] + dir[0] * dist, Tg[1] + dir[1] * dist, Tg[2] + dir[2] * dist], Math.atan2(-dir[0], -dir[2]), Math.atan2(dir[1], Math.hypot(dir[0], dir[2])), 1000, 0);
  const haze = [214, 200, 176];
  screen(g);
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#e4d6b8'); sk.addColorStop(1, '#bfae8e'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  screenRoll(g, 0);
  const fogAt = (X, Y, Z) => { const d = Math.hypot(X - cam.x, Y - cam.y, Z - cam.z); return clamp(smooth(4000, 90000, d) * 0.95 + smooth(-6000, -16000, Y) * 0.6); };
  // the stair, far to near
  let kMax = 420;
  for (let k = kMax; k >= -40; k--) {
    const z0 = k * run, z1 = z0 + run, yb = -k * rise, yt = yb - rise;
    const fr = fogAt(-1000, yt, z0);
    if (fr > 0.995) continue;
    polyP(g, cam, [[XL, yb, z0], [XR, yb, z0], [XR, yt, z0], [XL, yt, z0]], 0.6, 'rgba(96,84,68,0.32)', fr, k * 2, [0, 1, 3], haze);
    if (cam.y < yt) polyP(g, cam, [[XL, yt, z0], [XR, yt, z0], [XR, yt, z1], [XL, yt, z1]], 0.6, 'rgba(250,236,206,0.3)', fogAt(-1000, yt, z0 + run / 2), k * 2 + 1, [0, 1, 3], haze);
  }
  // the others, still climbing
  for (const c of CLIMB20) {
    const kk = c.k + ts * c.v, kf = Math.floor(kk);
    const p = projC(cam, c.x, -(kf + 1) * rise, kf * run + run * 0.5);
    if (p.z < NEAR || p.x < -80 || p.x > W + 80 || p.y < -60 || p.y > H + 60) continue;
    const r = 9 * p.k, fa = fogAt(c.x, -(kf + 1) * rise, kf * run);
    if (r < 0.7) continue;
    const spr = climbSprite(c.var, Math.floor(T * 2.4 + c.ph * 2) % 2), s = r / 9;
    g.globalAlpha = 1 - fa;
    g.drawImage(spr, p.x - 70 * s, p.y - 80 * s, 160 * s, 90 * s);
    g.globalAlpha = 1;
  }
  // him, the flower and the suitcase, on their one step
  still(Math.floor((SCENES[0].start + 6.0) * 12), () => {
    const env = { k: 0.98, warm: [255, 220, 170], wa: 0.1, lx: 0.5, ly: -0.8, rim: 0.45 };
    const pt = (dx, dz) => projC(cam, XH20 + dx, hy, hz + dz);
    const base = pt(0, 0); if (base.z < NEAR) return;
    const k = base.k;
    const cs = pt(14, -26), fl = pt(-30, 26);
    drawSuitcase(g, cs.x, cs.y - R0 * 2.9 * 1.17 * k, R0 * 3.9 * k, R0 * 2.9 * k, 0, { pal: HERO, env, detail: k * R0 > 6 ? 2 : 1 });
    const sp = sitSpine(base.x, base.y, R0 * k, -1, 0.98, 0.1);
    drawCaterpillarSide(g, sp, { r: R0 * k, dir: -1, pal: HERO, env, hat: true, hatTilt: -HAT_CROOKED, yaw: -0.55, pitch: 0.05, lid: 0.45, tired: 0.5, groundShadow: true });
    drawFlower(g, fl.x, fl.y, 26 * k, Math.sin(T * 1.15) * 0.07 + vnoise(T * 0.6) * 0.06, 1, 0.6);
  });
  // warm haze over everything, thickening as we go
  screen(g); g.fillStyle = rgba(haze, 0.12 + 0.3 * e); g.fillRect(0, 0, W, H);
  // a slow fade to black
  const fade = smooth(dur - 6.5, dur - 0.3, lt);
  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }
}

startFilm([
  { name: 'Sitting Down',         start: 0,  dur: 11, fn: scene16 },
  { name: 'Nothing Happens',      start: 11, dur: 15, fn: scene17 },
  { name: 'Still a Caterpillar',  start: 26, dur: 12, fn: scene18 },
  { name: 'The Flower',           start: 38, dur: 13, fn: scene19 },
  { name: 'The Final Question',   start: 51, dur: 18, fn: scene20 },
]);
