// Title reveal (6–8s): WORLD.EXE drops in letter by letter, each landing with a squash, a little
// rebound and a settle; then "by Legally Varun" is written on beneath it in sunny yellow script.
(function () {
  const WX = window.WX, C = WX.C;
  const { clamp, lerp, inv, ease, boil } = WX;
  const T = window.WX_TIMELINE.cues;
  const G = window.WX_GLYPHS;

  const F = 212;                 // title size (px per em)
  const BASE_Y = 688;            // title baseline
  const DEPTH = [9, 15];         // extrusion vector
  const SUB_F = 70, SUB_Y = 800; // subtitle size & baseline

  const title = G.title;
  const tLeft = 960 - (title.width * F) / 2;
  const sub = G.subtitle;
  const sLeft = 960 - (sub.width * SUB_F) / 2;

  // per-glyph motion: drop from above, squash on landing, rebound, settle
  function glyphMotion(i, t) {
    const L = T.letterLands[i];
    const fall = 0.3;
    const tau = t - L;
    if (tau < -fall) return null;
    const dir = i % 2 ? 1 : -1;
    if (tau < 0) {
      const u = (tau + fall) / fall;          // 0..1 during the fall
      const y = -760 * (1 - u * u);           // gravity: accelerating down
      // stretched along the fall
      return { dy: y, sx: 0.86, sy: 1.2, rot: dir * 0.22 * (1 - u) };
    }
    const sq = Math.exp(-7.5 * tau) * Math.cos(2 * Math.PI * 3.1 * tau);
    const hopU = inv(0.05, 0.25, tau);
    const hop = hopU > 0 && hopU < 1 ? -46 * 4 * hopU * (1 - hopU) : 0;
    const rot = dir * 0.05 * Math.exp(-6 * tau) * Math.sin(2 * Math.PI * 2.2 * tau);
    return { dy: hop, sx: 1 + 0.26 * sq, sy: 1 - 0.34 * sq, rot };
  }

  function glyphPath(ctx, g, m, ox, oy, boilAmp, seed) {
    // em-space contours -> screen, transformed about the glyph's foot
    const cx = (g.bbox[0] + g.bbox[2]) / 2;
    const c = Math.cos(m.rot), s = Math.sin(m.rot);
    const fx = tLeft + (g.x + cx) * F, fy = BASE_Y + m.dy;
    g.contours.forEach((ct, ci) => {
      const pts = ct.map((p) => {
        const x = (p[0] - cx) * F * m.sx, y = p[1] * F * m.sy;
        return [fx + ox + x * c - y * s, fy + oy + x * s + y * c];
      });
      const P = boil(pts, boilAmp, seed + ci * 7, 0.12);
      ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
      ctx.closePath();
    });
  }

  function drawGlyph(ctx, g, i, m) {
    const seed = 200 + i * 31;
    const isDot = g.ch === '.';
    const face = isDot ? C.yellow : '#fff4da';
    const faceLow = isDot ? C.yellowDeep : '#f6d9a2';
    const bAmp = 1.1;
    const steps = 9;
    const shape = (ox, oy) => (c) => glyphPath(c, g, m, ox, oy, bAmp, seed);
    // 1. one fat ink silhouette for face + extrusion
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= steps; k++) shape((DEPTH[0] * k) / steps, (DEPTH[1] * k) / steps)(ctx);
    ctx.lineWidth = 15; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = C.ink; ctx.fill();
    // 2. terracotta extrusion
    ctx.beginPath();
    for (let k = 1; k <= steps; k++) shape((DEPTH[0] * k) / steps, (DEPTH[1] * k) / steps)(ctx);
    const eg = ctx.createLinearGradient(0, BASE_Y - F * 0.75, 0, BASE_Y + 20);
    eg.addColorStop(0, C.terraLight); eg.addColorStop(1, C.terraDark);
    ctx.fillStyle = eg; ctx.fill();
    // 3. face
    ctx.beginPath(); shape(0, 0)(ctx);
    ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    const fg = ctx.createLinearGradient(0, BASE_Y + m.dy - F * 0.72 * m.sy, 0, BASE_Y + m.dy);
    fg.addColorStop(0, isDot ? C.yellowLight : '#fffaf0');
    fg.addColorStop(0.55, face);
    fg.addColorStop(1, faceLow);
    WX.paint(ctx, shape(0, 0), fg, {
      tex: 0.3, texSeed: i, texScale: 0.6,
      shade: { dx: 0, dy: -F * 0.075, color: isDot ? C.yellowDeep : '#efc98d', alpha: 0.95, hatch: 0.12 },
      light: { dx: F * 0.022, dy: F * 0.03, color: '#ffffff', alpha: 0.75 },
    });
    // 4. a crisp ink edge on the face, slightly boiled
    ctx.beginPath(); shape(0, 0)(ctx);
    ctx.lineWidth = 3.6; ctx.strokeStyle = C.ink; ctx.stroke();
  }

  // soft shadows for the lettering, drawn at quarter resolution and blurred cheaply
  let SH = null, SH2 = null;
  function drawShadows(ctx, t) {
    if (!SH) { SH = WX.makeCanvas(480, 270); SH2 = WX.makeCanvas(480, 270); }
    const c = SH.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, 480, 270);
    c.setTransform(0.25, 0, 0, 0.25, 0, 0);
    // title: each letter's shadow firms up as it arrives
    title.glyphs.forEach((g, i) => {
      const m = glyphMotion(i, t);
      if (!m) return;
      const a = clamp(1 + m.dy / 170);
      if (a <= 0.01) return;
      c.fillStyle = `rgba(12,22,45,${0.34 * a * a})`;
      c.beginPath();
      glyphPath(c, g, { ...m, dy: 0 }, 24 - m.dy * 0.05, 34, 0, 0);
      c.fill();
    });
    // subtitle, revealed with its pen stroke
    const [a0, a1] = T.subtitleWrite;
    const u = inv(a0, a1, t);
    if (u > 0) {
      c.save();
      c.beginPath(); c.rect(0, 0, subEdge(t), 1080); c.clip();
      c.fillStyle = 'rgba(12,22,45,0.5)';
      c.beginPath(); subtitlePath(c, subDy(t) + 7); c.fill();
      c.restore();
    }
    const c2 = SH2.getContext('2d');
    c2.clearRect(0, 0, 480, 270);
    c2.filter = 'blur(1.6px)';
    c2.drawImage(SH, 0, 0);
    c2.filter = 'none';
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(SH2, 0, 0, 1920, 1080);
    ctx.restore();
  }
  function drawTitle(ctx, t) {
    title.glyphs.forEach((g, i) => {
      const m = glyphMotion(i, t);
      if (!m) return;
      drawGlyph(ctx, g, i, m);
    });
  }

  // a four-point twinkle pops off the dot when the signature chime sounds
  function drawTwinkle(ctx, t) {
    const lt = t - T.signatureChime;
    if (lt < 0 || lt > 0.5) return;
    const dot = title.glyphs.find((g) => g.ch === '.');
    const x = tLeft + (dot.x + dot.bbox[2]) * F + 14, y = BASE_Y - F * 0.3;
    const pop = WX.spring(lt, 3.2, 8) * (1 - ease.in2(clamp((lt - 0.25) / 0.25)));
    const s = 30 * pop;
    if (s < 0.5) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.3 * lt);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.2 : s * (i % 4 === 0 ? 1 : 0.7);
      const a2 = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r0 = i % 2 ? r : r;
      ctx.lineTo(Math.cos(a2) * r0, Math.sin(a2) * r0);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = C.yellowLight; ctx.fill();
    ctx.restore();
  }

  function subtitlePath(ctx, dy) {
    sub.glyphs.forEach((g, gi) => {
      g.contours.forEach((ct, ci) => {
        const pts = ct.map((p) => [sLeft + (g.x + p[0]) * SUB_F, SUB_Y + dy + p[1] * SUB_F]);
        const P = boil(pts, 0.55, 500 + gi * 13 + ci, 0.12);
        ctx.moveTo(P[0][0], P[0][1]);
        for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
        ctx.closePath();
      });
    });
  }
  const subDy = (t) => 10 * (1 - ease.out3(inv(T.subtitleWrite[0], T.subtitleWrite[0] + 0.3, t)));
  function subEdge(t) {
    const u = ease.inOut2(inv(T.subtitleWrite[0], T.subtitleWrite[1], t));
    return lerp(sLeft - 30, sLeft + sub.width * SUB_F + 40, u);
  }
  function drawSubtitle(ctx, t) {
    const [a, b] = T.subtitleWrite;
    const u = inv(a, b, t);
    if (u <= 0) return;
    const dy = subDy(t);
    const edge = subEdge(t);
    ctx.save();
    // written on from left to right, like a pen stroke
    ctx.beginPath();
    ctx.rect(0, SUB_Y - SUB_F * 1.4, edge, SUB_F * 2.4);
    ctx.clip();
    // an ink outline keeps the yellow legible on sea, land and sky alike
    ctx.lineJoin = 'round';
    ctx.beginPath(); subtitlePath(ctx, dy);
    ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
    const sg = ctx.createLinearGradient(0, SUB_Y - SUB_F * 0.8, 0, SUB_Y + SUB_F * 0.2);
    sg.addColorStop(0, '#ffe07a'); sg.addColorStop(0.6, C.yellow); sg.addColorStop(1, '#ffb92e');
    ctx.fillStyle = sg; ctx.fill();
    ctx.restore();
    // the pen's glint riding the writing edge
    if (u < 1) {
      ctx.save();
      const gx = edge - 26, gy = SUB_Y - SUB_F * 0.35 + 6 * Math.sin(u * 30);
      ctx.fillStyle = 'rgba(255,240,180,0.9)';
      ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  WX.title = {
    draw(ctx, t) {
      if (t < T.titleStart - 0.35) return;
      drawShadows(ctx, t);
      drawTitle(ctx, t);
      drawSubtitle(ctx, t);
      drawTwinkle(ctx, t);
    },
  };
})();
