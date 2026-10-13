// 8 · 1980: the blueprint becomes a real chalet, and the camera pulls back as the village rises, one building per beat.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).build = function (tl, S) {
    const { defs, cam, win, frame, fx, svg } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const REAL = RV.b(26, 0.333); // ~62.2 s, the drawing turns real
    const BX = 960, BY = 800, BS = 0.75, ZOOM = 2.73 / 0.75;

    // ================= the Tasmanian valley (under the blueprint) =================
    const land = RV.g(cam);
    RV.rect(land, -400, -400, 2720, 1900, RV.linear(defs, [[0, "#8fc4e2"], [0.38, "#cfe6ea"], [0.56, "#f8e8c4"]]));
    RV.cloud(land, 400, 200, 380, { fill: "#ffffff", shade: "#d9e8ee", seed: 31, lumps: 4 });
    RV.cloud(land, 1500, 160, 460, { fill: "#ffffff", shade: "#d9e8ee", seed: 32, lumps: 5 });
    RV.hill(land, [[-300, 600], [200, 540], [700, 590], [1100, 530], [1600, 580], [2200, 540]], 1500, "#8ea6c6");
    RV.hill(land, [[-300, 650], [300, 610], [800, 660], [1300, 620], [1800, 650], [2200, 620]], 1500, "#a9c470");
    RV.hill(land, [[-300, 740], [400, 700], [1000, 740], [1500, 710], [2200, 735]], 1500, "#8dba52");
    RV.path(land, "M 1290 815 C 1400 790 1700 790 1830 812 C 1900 826 1880 852 1800 860 C 1640 874 1420 872 1320 856 C 1250 846 1240 826 1290 815 Z", "#6fb0cf");
    RV.path(land, "M 1340 822 C 1460 808 1660 808 1780 822", "none", { stroke: "#cdeaf2", "stroke-width": 4, opacity: 0.8, "stroke-linecap": "round" });
    RV.hill(land, [[-300, 880], [500, 860], [1100, 890], [1700, 870], [2200, 890]], 1500, "#7aab45");
    RV.path(land, "M 860 1500 C 900 1100 980 960 1000 880 C 1010 840 990 820 960 806", "none", { stroke: "#ead9b2", "stroke-width": 26, "stroke-linecap": "round" });
    const gums = RV.g(land);
    [[120, 760, 150, 1], [230, 790, 120, 2], [1990, 780, 160, 3], [1880, 740, 110, 4], [560, 700, 90, 5], [1220, 700, 80, 6], [70, 900, 200, 7]].forEach(([x, y, h, sd]) => RV.gum(gums, x, y, h, "#5e8f45", "#4d7a39", sd));

    // a crane swinging over the site
    const crane = RV.g(land, { transform: "translate(250 820)" });
    RV.rect(crane, -12, -460, 24, 460, "#f2b33d");
    for (let i = 0; i < 12; i++) RV.path(crane, `M -12 ${-i * 38} L 12 ${-i * 38 - 38}`, "none", { stroke: "#c98a22", "stroke-width": 3 });
    const jib = RV.g(RV.g(crane, { transform: "translate(0 -460)" }));
    RV.rect(jib, -90, -10, 420, 18, "#f2b33d");
    RV.rect(jib, -90, -10, 60, 40, "#7a6a5c");
    RV.path(jib, "M 280 8 L 280 140", "none", { stroke: "#4a4038", "stroke-width": 3 });
    RV.rect(jib, 262, 140, 36, 22, "#9a6a46");
    RV.spin(tl, jib, -6, 8, A, Z - A, 0, 0, "sine.inOut");

    // buildings rise on the beats
    const site = RV.g(land);
    const dust = RV.g(land);
    const tags = RV.g(land);
    const items = [
      { k: 0, kind: "chalet", x: BX, y: BY, o: { scale: BS } },
      { k: 1, kind: "chalet", x: 360, y: 790, o: { scale: 0.52, roof: "#6c2a1e" }, tag: "HOUSES" },
      { k: 2, kind: "chalet", x: 520, y: 810, o: { scale: 0.58, shutter: "#a8323a" } },
      { k: 3, kind: "chalet", x: 665, y: 780, o: { scale: 0.46 } },
      { k: 4, kind: "chalet", x: 1140, y: 830, o: { scale: 0.58, sign: "SHOP", shutter: "#2f5d8a" }, tag: "SHOPS" },
      { k: 5, kind: "chalet", x: 1270, y: 808, o: { scale: 0.52, sign: "CAFÉ" } },
      { k: 6, kind: "chalet", x: 760, y: 900, o: { scale: 0.78, w: 280, sign: "RESTAURANT", flowers: "#e85d9a" }, tag: "RESTAURANT" },
      { k: 7, kind: "chapel", x: 1420, y: 812, o: { s: 0.5 }, tag: "A CHAPEL BY THE LAKE" },
      { k: 8, kind: "chalet", x: 1610, y: 770, o: { scale: 0.36, storeys: 1, h: 110 }, tag: "RETIREMENT VILLAGE" },
      { k: 9, kind: "chalet", x: 1700, y: 776, o: { scale: 0.36, storeys: 1, h: 110 } },
      { k: 10, kind: "chalet", x: 1790, y: 770, o: { scale: 0.36, storeys: 1, h: 110 } },
      { k: 11, kind: "chalet", x: 1590, y: 950, o: { scale: 0.85, w: 340, h: 200, sign: "RESORT", roof: "#5a1f14" }, tag: "HOLIDAY RESORT" },
    ];
    items.forEach((it) => {
      const wrap = RV.g(site);
      const b = it.kind === "chapel" ? RV.chapel(wrap, it.x, it.y, it.o) : RV.chalet(wrap, it.x, it.y, it.o);
      if (it.k === 0) return;
      // one building per beat, the retirement row on eighths, the resort landing before the next scene
      const RISE = [0, 0, 1, 2, 3, 4, 5, 6, 7, 7.5, 8, 8.5];
      const t0 = RV.b(26, 1) + RISE[it.k] * RV.BEAT;
      tl.fromTo(wrap, { scaleY: 0, scaleX: 0.8, svgOrigin: `${it.x} ${it.y}` }, { scaleY: 1, scaleX: 1, svgOrigin: `${it.x} ${it.y}`, duration: 0.5, ease: "back.out(1.8)", immediateRender: true }, t0);
      const puff = RV.g(dust, { opacity: 0 });
      for (let j = -2; j <= 2; j++) RV.circle(puff, it.x + j * 26, it.y - 4, 14, "#efe2c6");
      tl.fromTo(puff, { opacity: 0.9, scale: 0.5, svgOrigin: `${it.x} ${it.y}` }, { opacity: 0, scale: 1.8, svgOrigin: `${it.x} ${it.y}`, duration: 0.7, ease: "power2.out", immediateRender: false }, t0 + 0.12);
      if (it.tag) {
        const tg = RV.g(tags, { opacity: 0 });
        const w = it.tag.length * 16.5 + 44;
        const ty = it.y - (it.kind === "chapel" ? 190 : (it.o.h || 170) * it.o.scale + 0.42 * (it.o.w || 220) * it.o.scale + 50);
        RV.rect(tg, it.x - w / 2, ty - 24, w, 40, "#2a1815", { rx: 20, opacity: 0.85 });
        RV.text(tg, it.x, ty + 4, it.tag, { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 20, "letter-spacing": 4, fill: "#f6ead3" });
        tl.fromTo(tg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: true }, t0 + 0.3);
        tl.fromTo(tg, { opacity: 1 }, { opacity: 0, duration: 0.35, immediateRender: false }, Math.min(Z - 0.6, t0 + 1.9));
      }
    });

    // camera: hold tight on the first chalet (matching the blueprint), then pull back over the valley
    tl.fromTo(cam, { scale: ZOOM, svgOrigin: `${BX} ${BY}` }, { scale: ZOOM, svgOrigin: `${BX} ${BY}`, duration: 0.01, immediateRender: true }, A);
    tl.fromTo(cam, { scale: ZOOM, svgOrigin: `${BX} ${BY}` }, { scale: 1.1, svgOrigin: `${BX} ${BY}`, duration: 2.6, ease: "power2.inOut", immediateRender: false }, REAL + 0.25);
    tl.fromTo(cam, { x: 0 }, { x: -20, duration: Z - REAL - 3, ease: "sine.inOut", immediateRender: false }, REAL + 2.9);

    // ================= the blueprint (on top) =================
    const bp = RV.g(svg);
    RV.rect(bp, 0, 0, 1920, 1080, "#1d4f8f");
    const grid = RV.g(bp, { stroke: "#ffffff" });
    for (let x = 0; x <= 1920; x += 40) RV.path(grid, `M ${x} 0 L ${x} 1080`, "none", { opacity: x % 200 === 0 ? 0.16 : 0.07 });
    for (let y = 0; y <= 1080; y += 40) RV.path(grid, `M 0 ${y} L 1920 ${y}`, "none", { opacity: y % 200 === 0 ? 0.16 : 0.07 });
    RV.rect(bp, 40, 40, 1840, 1000, "none", { stroke: "#e8f1ff", "stroke-width": 3, opacity: 0.6 });
    // line drawing of the chalet, revealed by a moving pen
    const clipId = RV.uid("bpclip");
    const clip = RV.el("clipPath", { id: clipId }, defs);
    const clipR = RV.rect(clip, 0, 0, 0, 1080, "#fff");
    const drawing = RV.g(bp, { "clip-path": `url(#${clipId})`, stroke: "#eaf3ff", "stroke-width": 1.15, "stroke-linejoin": "round" });
    const blue = "#1d4f8f";
    RV.chalet(drawing, BX, BY, { scale: 2.73, roof: blue, roofDark: blue, wall: blue, wallDark: blue, timber: blue, timberDark: blue, shutter: blue, flowers: blue, pane: blue, mullion: blue });
    const pen = RV.rect(bp, 0, 60, 3, 960, "#ffffff", { opacity: 0.8 });
    const drawT0 = T + 0.05, drawT1 = REAL - 0.25;
    tl.fromTo(clipR, { attr: { width: 560 } }, { attr: { width: 1400 }, duration: drawT1 - drawT0, ease: "power1.inOut", immediateRender: true }, drawT0);
    tl.fromTo(pen, { attr: { x: 560 } }, { attr: { x: 1400 }, duration: drawT1 - drawT0, ease: "power1.inOut", immediateRender: true }, drawT0);
    tl.fromTo(pen, { opacity: 0.8 }, { opacity: 0, duration: 0.2, immediateRender: false }, drawT1);
    // dimension lines
    const dims = RV.g(bp, { stroke: "#eaf3ff", "stroke-width": 2, fill: "none", opacity: 0.85 });
    const d1 = RV.path(dims, "M 600 870 L 1320 870 M 600 850 L 600 890 M 1320 850 L 1320 890");
    const d2 = RV.path(dims, "M 1420 800 L 1420 120 M 1400 800 L 1440 800 M 1400 120 L 1440 120");
    RV.drawPath(tl, d1, 820, T + 0.4, 0.9);
    RV.drawPath(tl, d2, 760, T + 0.8, 0.9);
    const dimT = RV.g(bp, { "font-family": "Josefin Sans", "font-weight": 400, fill: "#eaf3ff", "font-size": 22, "letter-spacing": 3 });
    RV.text(dimT, 960, 910, "12.0 M", { "text-anchor": "middle" });
    RV.text(dimT, 1450, 470, "11.5 M");
    RV.text(dimT, 230, 620, "STEEP GABLE ROOF");
    RV.text(dimT, 230, 660, "TIMBER BALCONY");
    RV.text(dimT, 230, 700, "FLOWER BOXES");
    tl.fromTo(dimT, { opacity: 0 }, { opacity: 0.9, duration: 0.5 }, T + 1.0);
    // title block
    const tb = RV.g(bp, { transform: "translate(1500 900)" });
    RV.rect(tb, 0, 0, 340, 110, "none", { stroke: "#eaf3ff", "stroke-width": 2 });
    RV.path(tb, "M 0 40 L 340 40 M 200 40 L 200 110", "none", { stroke: "#eaf3ff", "stroke-width": 2 });
    RV.text(tb, 16, 28, "SWISS VILLAGE · TASMANIA", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 17, "letter-spacing": 3, fill: "#eaf3ff" });
    RV.text(tb, 16, 82, "CHALET TYPE A", { "font-family": "Josefin Sans", "font-size": 17, "letter-spacing": 2, fill: "#eaf3ff" });
    RV.text(tb, 216, 82, "SHEET 1", { "font-family": "Josefin Sans", "font-size": 17, "letter-spacing": 2, fill: "#eaf3ff" });
    const yr = RV.script(bp, "1980", { x: 130, y: 300, size: 230, color: "#ffffff", width: 5 });
    RV.drawOn(tl, yr, T + 0.2, 1.4);
    // the drawing turns real: the blueprint dissolves away over the coloured chalet
    tl.fromTo(bp, { opacity: 1 }, { opacity: 0, duration: 0.55, ease: "sine.inOut", immediateRender: false }, REAL);

    // entrance: the blueprint unrolls from the top
    tl.fromTo(frame, { clipPath: "inset(0px 0px 1080px 0px)" }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.9, ease: "power2.inOut", immediateRender: true }, A);
    const roll = RV.g(fx);
    RV.rect(roll, -20, -26, 1960, 52, RV.linear(S.fxDefs, [[0, "#9fc3ef"], [0.5, "#eef6ff"], [1, "#4f82c0"]]), { rx: 26 });
    tl.fromTo(roll, { y: 0, opacity: 1 }, { y: 1110, opacity: 1, duration: 0.9, ease: "power2.inOut", immediateRender: true }, A);
    tl.set(roll, { opacity: 0 }, A + 0.95);
  };
})();
