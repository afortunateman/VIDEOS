// 3 · The Second World War and the Dutch resistance — crimson night, searchlights, a young man in a flat cap.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).war = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const CUT = RV.b(8); // 19.2 s: wide shot -> close-up

    // ================= wide shot =================
    const wide = RV.g(cam);
    RV.rect(wide, -200, -200, 2320, 1500, RV.linear(defs, [[0, "#14070c"], [0.45, "#2e0d17"], [0.72, "#57182a"], [0.86, "#8a2a2e"], [1, "#a63a2f"]]));
    const stars = RV.g(wide);
    const sr = RV.rng(5);
    for (let i = 0; i < 70; i++) RV.circle(stars, sr() * 1920, sr() * 520, 0.8 + sr() * 1.6, "#f6e3c8", { opacity: (0.2 + sr() * 0.5).toFixed(2) });

    // searchlights (beams from behind the roofs)
    const beamFill = RV.linear(defs, [[0, "#ffe2a0", 0.42], [0.6, "#ffd88a", 0.1], [1, "#ffd88a", 0]], 0, 1, 0, 0);
    const beams = RV.g(wide);
    [[330, -18, 11], [1060, 8, 13], [1640, 22, 9]].forEach(([x, a0, sp], i) => {
      const bg = RV.g(beams, { transform: `translate(${x} 900)` });
      const beam = RV.g(bg);
      RV.poly(beam, [[-14, 0], [14, 0], [150, -1300], [-150, -1300]], beamFill);
      RV.spin(tl, beam, a0, -a0 * 1.4 + (i - 1) * 10, A, Z - A, 0, 0, "sine.inOut");
    });

    // a distant glow on the horizon that flares with the explosions
    const glowF = RV.radial(defs, [[0, "#ff8a3d", 0.75], [1, "#ff6a2a", 0]]);
    const flare = RV.ellipse(wide, 1400, 760, 520, 200, glowF, { opacity: 0 });
    tl.fromTo(flare, { opacity: 0 }, { opacity: 0.9, duration: 0.12, ease: "power2.out" }, RV.b(7, 1.5));
    tl.fromTo(flare, { opacity: 0.9 }, { opacity: 0.15, duration: 1.6, ease: "power2.out", immediateRender: false }, RV.b(7, 1.5) + 0.12);

    // bombers crossing in formation
    const planes = RV.g(wide);
    const plane = (p, x, y, s) => {
      const g = RV.g(p, { transform: `translate(${x} ${y}) scale(${s})` });
      RV.path(g, "M -70 0 C -50 -8 40 -8 70 -2 L 80 2 L 60 6 C 20 10 -50 8 -70 0 Z", "#0e0408");
      RV.path(g, "M -10 -2 L -40 -46 L -20 -46 L 26 -2 Z", "#0e0408");
      RV.path(g, "M -10 4 L -36 46 L -18 46 L 24 4 Z", "#0e0408");
      RV.path(g, "M -64 0 L -80 -20 L -70 -20 L -54 -2 Z", "#0e0408");
      return g;
    };
    plane(planes, 0, 0, 1);
    plane(planes, -150, 60, 0.85);
    plane(planes, -150, -60, 0.85);
    plane(planes, -290, 110, 0.7);
    tl.fromTo(planes, { x: -300, y: 260 }, { x: 2300, y: 160, duration: 9, ease: "none" }, A);

    // Dutch canal houses: stepped and bell gables, a church tower, a few lit windows
    const city = RV.g(wide);
    const dark = "#1e0810", mid = "#2b0d17", edge = "#4a1726";
    const houses = [];
    let x = -40;
    const hr = RV.rng(9);
    while (x < 2000) {
      const w = 110 + hr() * 70;
      const h = 220 + hr() * 180;
      houses.push([x, w, h, Math.floor(hr() * 3)]);
      x += w - 2;
    }
    houses.forEach(([hx, w, h, type], i) => {
      const base = 1000, topY = base - h;
      const pts = [[hx, base], [hx, topY]];
      if (type === 0) {
        // stepped gable
        const steps = 4;
        for (let k = 0; k < steps; k++) {
          const sx = hx + (w / 2) * (k / steps) * 0.9;
          pts.push([sx, topY - k * 26], [sx + (w / 2) * 0.9 / steps, topY - k * 26]);
        }
        pts.push([hx + w / 2 - 10, topY - steps * 26], [hx + w / 2 + 10, topY - steps * 26]);
        for (let k = steps - 1; k >= 0; k--) {
          const sx = hx + w - (w / 2) * (k / steps) * 0.9;
          pts.push([sx - (w / 2) * 0.9 / steps, topY - k * 26], [sx, topY - k * 26]);
        }
      } else if (type === 1) {
        // bell gable
        pts.push([hx + w * 0.18, topY], [hx + w * 0.22, topY - 40], [hx + w * 0.34, topY - 70], [hx + w * 0.5, topY - 96], [hx + w * 0.66, topY - 70], [hx + w * 0.78, topY - 40], [hx + w * 0.82, topY]);
      } else {
        pts.push([hx + w / 2, topY - 80]);
      }
      pts.push([hx + w, topY], [hx + w, base]);
      RV.poly(city, pts, i % 2 ? dark : mid);
      RV.path(city, `M ${hx + 1} ${base} L ${hx + 1} ${topY}`, "none", { stroke: edge, "stroke-width": 2, opacity: 0.7 });
      // windows
      const cols = Math.max(2, Math.floor(w / 46));
      const rows = Math.floor((h - 60) / 64);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const wx = hx + 18 + c * ((w - 36) / cols) + 6, wy = topY + 34 + r * 64;
          const lit = hr() < 0.16;
          RV.rect(city, wx, wy, (w - 36) / cols - 14, 34, lit ? "#f2b84b" : "#14050a", { opacity: lit ? 0.95 : 0.8 });
        }
    });
    // church tower
    const tower = RV.g(city, { transform: "translate(1180 1000)" });
    RV.rect(tower, -50, -560, 100, 560, "#1a070e");
    RV.poly(tower, [[-62, -560], [0, -760], [62, -560]], "#1a070e");
    RV.rect(tower, -3, -800, 6, 44, "#1a070e");
    RV.circle(tower, 0, -470, 26, "#d9a24a", { opacity: 0.85 });
    RV.path(tower, "M 0 -470 L 0 -488 M 0 -470 L 12 -466", "none", { stroke: "#1a070e", "stroke-width": 4 });
    // canal at the bottom with window reflections
    RV.rect(wide, -200, 1000, 2320, 200, "#16060c");
    const refl = RV.g(wide, { opacity: 0.5 });
    for (let i = 0; i < 26; i++) RV.rect(refl, (i * 173) % 1900, 1012 + ((i * 41) % 60), 28 + (i % 4) * 18, 4, "#f2b84b", { opacity: 0.55 });
    tl.fromTo(refl, { x: 0 }, { x: -30, duration: Z - A, ease: "sine.inOut" }, A);
    // embers
    RV.particles(wide, tl, { count: 50, t0: A, t1: CUT + 0.2, seed: 77, color: "#ff9a4a", size: [1.2, 3.6], vy: [-60, -25], vx: [-14, 18], y0: 300, y1: 1080, opacity: 0.8 });
    tl.fromTo(wide, { scale: 1.08, x: 0, svgOrigin: "960 700" }, { scale: 1.0, x: 30, svgOrigin: "960 700", duration: CUT - A, ease: "sine.out" }, A);

    // ================= close-up =================
    const close = RV.g(cam, { opacity: 0 });
    RV.rect(close, -200, -200, 2320, 1500, "#2d0d15");
    // brick wall
    const bricks = RV.g(close, { stroke: "#1f080e", "stroke-width": 5, opacity: 0.9 });
    for (let r = 0; r < 18; r++) {
      RV.path(bricks, `M -20 ${r * 64} L 1940 ${r * 64}`);
      for (let c = 0; c < 15; c++) {
        const bx = c * 140 + (r % 2 ? 70 : 0);
        RV.path(bricks, `M ${bx} ${r * 64} L ${bx} ${r * 64 + 64}`);
      }
    }
    // warm lamp pool from the left
    const lamp = RV.radial(defs, [[0, "#ffbf6b", 0.62], [0.45, "#e0743f", 0.22], [1, "#2d0d15", 0]]);
    RV.ellipse(close, 420, 300, 900, 800, lamp);
    // the lamp itself
    const lampG = RV.g(close, { transform: "translate(330 0)" });
    RV.rect(lampG, -4, -20, 8, 140, "#140508");
    RV.path(lampG, "M -50 120 L 50 120 L 32 180 L -32 180 Z", "#140508");
    RV.ellipse(lampG, 0, 190, 40, 14, "#ffe2a0");
    RV.ellipse(lampG, 0, 200, 120, 40, "#ffcf7a", { opacity: 0.25 });
    // a searchlight sweeping across the wall behind him
    const sweep = RV.linear(defs, [[0, "#ffe7b0", 0], [0.5, "#ffe7b0", 0.33], [1, "#ffe7b0", 0]], 0, 0, 1, 0);
    const band = RV.poly(close, [[0, -100], [260, -100], [120, 1180], [-140, 1180]], sweep);
    tl.fromTo(band, { x: -400 }, { x: 2300, duration: 2.6, ease: "power1.inOut" }, CUT + 1.6);
    // a resistance poster, half torn
    const post = RV.g(close, { transform: "translate(170 520) rotate(-4)" });
    RV.rect(post, 0, 0, 230, 300, "#e8d7b5");
    RV.rect(post, 18, 22, 194, 70, "#9e2b2b");
    for (let i = 0; i < 7; i++) RV.rect(post, 20, 120 + i * 22, 140 + ((i * 37) % 50), 8, "#6b5a46");
    RV.poly(post, [[160, 300], [230, 230], [230, 300]], "#2d0d15");

    // Roelf: coat, collar up, flat cap, lit from the lamp side
    const man = RV.g(RV.g(close, { transform: "translate(-40 -110)" }));
    const coat = "#232741", coatD = "#171a2e";
    RV.path(man, "M 640 1120 C 660 990 790 930 960 912 L 1230 912 C 1390 930 1520 990 1580 1120 Z", coat);
    RV.path(man, "M 1180 912 L 1230 912 C 1390 930 1520 990 1580 1120 L 1240 1120 C 1250 1040 1220 960 1180 912 Z", coatD);
    const hd = RV.head(man, { x: 1060, y: 940, scale: 1.75, skin: "#cc8762", skinDark: "#7f4636", nose: "#2b2766", hair: "#2a170f", cap: "#3d2c22", capDark: "#24180f", rim: "#ffc983" });
    // collar flaps over the neck
    RV.path(man, "M 920 1120 L 940 900 L 1030 1000 L 1010 1120 Z", "#2c3152");
    RV.path(man, "M 1150 1120 L 1170 990 L 1250 880 L 1270 1120 Z", "#2c3152");
    RV.path(man, "M 1170 990 L 1250 880 L 1262 1000 Z", coatD);
    // bundle of underground newspapers under his arm
    const papers = RV.g(man, { transform: "translate(1300 960) rotate(-8)" });
    for (let i = 0; i < 4; i++) RV.rect(papers, i * 4, -i * 7, 300, 150, i % 2 ? "#e9dcc0" : "#f3e8d1");
    for (let i = 0; i < 6; i++) RV.rect(papers, 30, -10 + i * 18, 200 - (i % 3) * 40, 7, "#6b5a46", { opacity: 0.7 });
    RV.rect(papers, 30, -40, 150, 14, "#2a1d16");
    RV.path(man, "M 1240 1120 C 1270 1040 1340 1000 1420 1010 L 1440 1120 Z", coatD);
    // a small Dutch flag pin that glints when he joins the resistance
    const pin = RV.g(man, { transform: "translate(1010 1040)", opacity: 0 });
    RV.rect(pin, -14, -10, 28, 7, "#ae1c28");
    RV.rect(pin, -14, -3, 28, 7, "#ffffff");
    RV.rect(pin, -14, 4, 28, 7, "#21468b");
    const glint = RV.path(pin, "M 0 -26 L 4 -4 L 26 0 L 4 4 L 0 26 L -4 4 L -26 0 L -4 -4 Z", "#fff6d8", { opacity: 0 });
    tl.fromTo(pin, { opacity: 0 }, { opacity: 1, duration: 0.3 }, RV.b(8, 1));
    tl.fromTo(glint, { opacity: 0, scale: 0.2, svgOrigin: "0 0" }, { opacity: 1, scale: 1.2, svgOrigin: "0 0", duration: 0.25, ease: "power2.out" }, RV.b(8, 1));
    tl.fromTo(glint, { opacity: 1 }, { opacity: 0, duration: 0.5, immediateRender: false }, RV.b(8, 1) + 0.25);

    // he glances over his shoulder, then back; blinks
    tl.fromTo(hd.pupil, { x: 0 }, { x: -8, duration: 0.35, ease: "power2.inOut" }, CUT + 0.9);
    tl.fromTo(hd.pupil, { x: -8 }, { x: 0, duration: 0.35, ease: "power2.inOut", immediateRender: false }, CUT + 2.2);
    tl.fromTo(hd.eye, { scaleY: 1 }, { scaleY: 0.1, svgOrigin: "80 -212", duration: 0.08, yoyo: true, repeat: 1 }, CUT + 3.4);
    tl.fromTo(hd.pupil, { scaleY: 1 }, { scaleY: 0.1, svgOrigin: "84 -212", duration: 0.08, yoyo: true, repeat: 1 }, CUT + 3.4);
    // the second explosion flickers on his face
    const flick = RV.rect(close, -200, -200, 2320, 1500, "#ff9a4a", { opacity: 0 });
    tl.fromTo(flick, { opacity: 0 }, { opacity: 0.22, duration: 0.08 }, RV.b(8, 3));
    tl.fromTo(flick, { opacity: 0.22 }, { opacity: 0, duration: 1.2, ease: "power2.out", immediateRender: false }, RV.b(8, 3) + 0.08);
    tl.fromTo(man, { x: 0, y: 30 }, { x: -30, y: 0, duration: Z - CUT, ease: "sine.out" }, CUT);
    tl.fromTo(close, { scale: 1.0, svgOrigin: "1100 700" }, { scale: 1.07, svgOrigin: "1100 700", duration: Z - CUT, ease: "sine.inOut" }, CUT);

    // the cut is hidden by a searchlight flash
    tl.set(close, { opacity: 1 }, CUT);
    tl.set(wide, { opacity: 0 }, CUT);
    const flash = RV.rect(fx, 0, 0, 1920, 1080, "#ffe9c2", { opacity: 0 });
    tl.fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.22, ease: "power2.in" }, CUT - 0.22);
    tl.fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, CUT);

    // entrance: storm clouds roll in from the right, wiping Holland away
    const band2 = RV.g(fx);
    const cr = RV.rng(31);
    RV.rect(band2, 160, -100, 700, 1300, "#2a0c15");
    for (let i = 0; i < 9; i++) {
      const cy = -60 + i * 150;
      RV.ellipse(band2, 160 + cr() * 60, cy, 150 + cr() * 90, 110 + cr() * 50, i % 2 ? "#3a1220" : "#2a0c15");
      RV.ellipse(band2, 60 + cr() * 80, cy + 60, 110 + cr() * 60, 80 + cr() * 40, i % 2 ? "#4a1828" : "#33101b");
    }
    RV.rect(band2, 500, -100, 1500, 1300, "#2a0c15", { opacity: 0 });
    tl.fromTo(band2, { x: 1950 }, { x: -1100, duration: 1.5, ease: "power1.inOut", immediateRender: true }, A);
    tl.fromTo(band2, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, A + 1.3);
    tl.fromTo(frame, { clipPath: "inset(0px 0px 0px 2100px)" }, { clipPath: "inset(0px 0px 0px -900px)", duration: 1.5, ease: "power1.inOut", immediateRender: true }, A);
  };
})();
