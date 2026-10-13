// 7 · Switzerland — holiday snapshots in the Alps, then the idea: why not build one back home?
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).swiss = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const IDEA = RV.b(23);

    // ================= A: the Alps =================
    const alps = RV.g(cam);
    RV.rect(alps, -200, -200, 2320, 1500, RV.linear(defs, [[0, "#7fb2df"], [0.42, "#bcdcef"], [0.6, "#eef3ee"]]));
    const cl = RV.g(alps);
    RV.cloud(cl, 380, 170, 420, { fill: "#ffffff", shade: "#d3e3f1", seed: 21, lumps: 4 });
    RV.cloud(cl, 1700, 120, 360, { fill: "#ffffff", shade: "#d3e3f1", seed: 22, lumps: 4 });
    RV.streak(cl, 700, 330, 1000, 26, "#ffffff", 0.7);
    tl.fromTo(cl, { x: -40 }, { x: 80, duration: IDEA - A + 0.4, ease: "none" }, A);
    const mts = RV.g(alps);
    RV.mountain(mts, { x: 1720, peak: 330, base: 760, w: 900, light: "#b9c2e4", dark: "#98a2cc", snowDark: "#dfe4f4", seed: 4, cap: 0.36 });
    RV.mountain(mts, { x: 300, peak: 260, base: 760, w: 1000, light: "#a7acd9", dark: "#8287c0", mid: "#9499cd", seed: 5, cap: 0.34 });
    RV.mountain(mts, { x: 1180, peak: 120, base: 780, w: 1200, light: "#9a97cf", dark: "#6b6a9e", mid: "#827fb6", seed: 6, cap: 0.36, skew: -60 });
    RV.mountain(mts, { x: 760, peak: 330, base: 780, w: 700, light: "#8d8bc4", dark: "#625f96", seed: 8, cap: 0.3 });
    tl.fromTo(mts, { x: 0 }, { x: -25, duration: IDEA - A + 0.4, ease: "sine.inOut" }, A);
    // meadows
    const mead = RV.g(alps);
    RV.hill(mead, [[-200, 760], [300, 700], [800, 740], [1300, 690], [1800, 730], [2120, 700]], 1300, "#9ccc4a");
    RV.hill(mead, [[-200, 800], [400, 770], [900, 800], [1400, 760], [2120, 790]], 1300, "#7fb63c");
    // lake
    RV.path(mead, "M 380 790 C 520 770 820 772 960 792 C 1020 800 1000 820 940 826 C 760 842 520 840 400 822 C 340 812 330 798 380 790 Z", "#5fa8c8");
    RV.path(mead, "M 430 798 C 600 786 800 788 920 800", "none", { stroke: "#bfe3ef", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.8 });
    // pines and chalets on the slopes
    const vill = RV.g(alps);
    [[160, 760, 70], [210, 770, 90], [1150, 740, 80], [1210, 752, 60], [1600, 760, 90], [1660, 770, 70], [1880, 750, 80]].forEach(([x, y, h]) => RV.pine(vill, x, y, h, "#2f6b46", "#24553a"));
    [[1000, 770, 0.38], [1330, 750, 0.32], [1460, 780, 0.42], [620, 760, 0.3], [1760, 790, 0.36]].forEach(([x, y, sc]) => RV.chalet(vill, x, y, { scale: sc }));
    RV.chapel(vill, 270, 790, { s: 0.42 });
    // front meadow with wildflowers
    const front = RV.g(alps);
    RV.hill(front, [[-200, 900], [500, 860], [1100, 900], [1600, 870], [2120, 900]], 1300, "#68a336");
    const fr = RV.rng(71);
    for (let i = 0; i < 160; i++) {
      const x = fr() * 2000 - 40, y = 900 + fr() * 200;
      RV.circle(front, x, y, 3 + (y - 900) / 40, ["#ffffff", "#f6c343", "#e85d9a", "#c4b5fd"][i % 4], { opacity: 0.9 });
    }
    // a cow with a bell
    const cow = RV.g(front, { transform: "translate(620 900)" });
    RV.ellipse(cow, 0, -40, 70, 40, "#f6efe2");
    RV.ellipse(cow, -20, -46, 26, 18, "#4a3328");
    RV.ellipse(cow, 30, -30, 18, 14, "#4a3328");
    for (const lx of [-46, -24, 26, 46]) RV.rect(cow, lx - 6, -10, 12, 30, "#e9dfcd");
    RV.ellipse(cow, 82, -54, 26, 22, "#f6efe2");
    RV.ellipse(cow, 98, -46, 14, 10, "#f2b5a8");
    RV.path(cow, "M 70 -76 L 64 -92 M 92 -76 L 100 -92", "none", { stroke: "#e9dfcd", "stroke-width": 5, "stroke-linecap": "round" });
    RV.circle(cow, 74, -30, 9, "#f2c14e");

    // the couple, seen from behind, admiring the view
    const couple = RV.g(alps);
    const back = (x, y, o) => {
      const g = RV.g(couple, { transform: `translate(${x} ${y}) scale(${o.s || 1})` });
      RV.path(g, "M -26 -100 L -30 0 L -12 0 L -6 -90 Z", o.legs || "#3b3a48");
      RV.path(g, "M 26 -100 L 30 0 L 12 0 L 6 -90 Z", RV.shade(o.legs || "#3b3a48", -0.15));
      RV.path(g, o.dress ? "M -40 -230 C -52 -170 -62 -110 -66 -70 L 66 -70 C 62 -110 52 -170 40 -230 C 20 -246 -20 -246 -40 -230 Z" : "M -42 -232 C -50 -180 -52 -130 -46 -90 L 46 -90 C 52 -130 50 -180 42 -232 C 22 -246 -22 -246 -42 -232 Z", o.coat);
      RV.path(g, "M 0 -244 C 22 -244 42 -232 42 -232 C 50 -180 52 -130 46 -90 L 10 -90 Z", RV.shade(o.coat, -0.15));
      RV.rect(g, -10, -262, 20, 22, o.skinDark || "#b8714f");
      RV.ellipse(g, 0, -282, 26, 30, o.hair);
      if (o.pack) {
        RV.rect(g, -34, -226, 68, 92, o.pack, { rx: 14 });
        RV.rect(g, -26, -170, 52, 26, RV.shade(o.pack, -0.2), { rx: 6 });
      }
      if (o.hat === "fedora") {
        RV.ellipse(g, 0, -300, 42, 9, "#3d3330");
        RV.path(g, "M -24 -300 C -24 -330 24 -330 24 -300 Z", "#4d413b");
        RV.rect(g, -24, -306, 48, 6, "#7a2e1f");
      } else if (o.hat === "sun") {
        RV.ellipse(g, 0, -300, 50, 11, "#f1dca8");
        RV.path(g, "M -22 -300 C -22 -326 22 -326 22 -300 Z", "#f1dca8");
        RV.rect(g, -22, -306, 44, 6, "#c8463a");
      }
      return g;
    };
    const roelf = back(1420, 1040, { coat: "#4f6a8f", hair: "#4a3024", hat: "fedora", pack: "#a8523a", s: 1.15 });
    const wife = back(1580, 1046, { coat: "#c8463a", hair: "#8a5a2b", hat: "sun", dress: true, legs: "#c98a62", s: 1.08 });
    // her camera, raised
    const camG = RV.g(wife);
    RV.path(camG, "M 36 -200 C 56 -230 66 -260 60 -276", "none", { stroke: "#c8463a", "stroke-width": 16, "stroke-linecap": "round" });
    RV.rect(camG, 40, -300, 46, 30, "#2a2626", { rx: 4 });
    RV.circle(camG, 60, -285, 9, "#5a6170");
    // his pointing arm
    const arm = RV.path(roelf, "M -36 -210 C -70 -250 -96 -300 -110 -350", "none", { stroke: "#4f6a8f", "stroke-width": 18, "stroke-linecap": "round" });
    tl.fromTo(arm, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T + 0.8);

    // camera flashes, polaroids fly to the corner
    const flash = RV.rect(fx, 0, 0, 1920, 1080, "#ffffff", { opacity: 0 });
    const shots = [RV.b(22), RV.b(22, 2)];
    const polaroid = (parent, tint) => {
      const g = RV.g(parent);
      RV.rect(g, -110, -130, 220, 260, "#fbf8f0");
      RV.rect(g, -96, -116, 192, 180, tint);
      RV.poly(g, [[-96, 64], [-40, -40], [0, 10], [40, -60], [96, 30], [96, 64]], "#7a78b4");
      RV.poly(g, [[-40, -40], [-26, -14], [-50, -16]], "#ffffff");
      RV.poly(g, [[40, -60], [56, -30], [26, -32]], "#ffffff");
      RV.rect(g, -96, 40, 192, 24, "#7fb63c");
      return g;
    };
    const stack = RV.g(fx);
    shots.forEach((t0, i) => {
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.85, duration: 0.06, ease: "none", immediateRender: false }, t0);
      tl.fromTo(flash, { opacity: 0.85 }, { opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, t0 + 0.06);
      const hold = RV.g(stack);
      const p = polaroid(hold, i ? "#f3c98d" : "#a9d3ee");
      tl.fromTo(hold, { x: 1640, y: 760, rotation: 0, scale: 0.2, opacity: 0 }, { x: 250 + i * 70, y: 250 + i * 40, rotation: -8 + i * 14, scale: 1, opacity: 1, duration: 0.7, ease: "power3.out", immediateRender: true }, t0 + 0.1);
    });
    tl.fromTo(alps, { scale: 1.0, svgOrigin: "1200 800" }, { scale: 1.08, svgOrigin: "1200 800", duration: IDEA - A, ease: "sine.inOut" }, A);

    // ================= B: the idea =================
    const idea = RV.g(cam, { opacity: 0 });
    RV.rect(idea, -200, -200, 2320, 1500, RV.radial(defs, [[0, "#ffe7a6"], [0.5, "#f6bf62"], [1, "#e58e45"]], 0.62, 0.32, 0.8));
    const rays = RV.g(idea, { opacity: 0.22 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      RV.poly(rays, [[1180, 300], [1180 + Math.cos(a - 0.06) * 1600, 300 + Math.sin(a - 0.06) * 1600], [1180 + Math.cos(a + 0.06) * 1600, 300 + Math.sin(a + 0.06) * 1600]], "#fff4cf");
    }
    RV.spin(tl, rays, 0, 14, IDEA, Z - IDEA, 1180, 300, "none");
    // a scatter of holiday postcards behind him
    const cards = RV.g(idea);
    [[260, 300, -10, "#a9d3ee"], [420, 760, 8, "#f3c98d"], [1650, 760, -6, "#a9d3ee"], [1700, 330, 12, "#cfe6c2"]].forEach(([x, y, r, c]) => {
      const g = RV.g(cards, { transform: `translate(${x} ${y}) rotate(${r}) scale(0.9)` });
      polaroid(g, c);
    });
    // Roelf, now in his fifties: greying hair, glasses
    const who = RV.g(RV.g(idea, { transform: "translate(0 0)" }));
    RV.path(who, "M 560 1120 C 580 990 700 930 860 914 L 1120 914 C 1280 930 1400 990 1460 1120 Z", "#3f6b55");
    RV.path(who, "M 1080 914 L 1120 914 C 1280 930 1400 990 1460 1120 L 1150 1120 C 1160 1040 1130 960 1080 914 Z", "#30574a");
    RV.path(who, "M 900 920 L 960 1010 L 1030 920 Z", "#f6ead3");
    const hd = RV.head(who, { x: 960, y: 950, scale: 1.65, hair: "#7a6656", grey: false, glasses: true, smile: 1, nose: "#4a4596" });
    // the light bulb
    const bulb = RV.g(idea, { opacity: 0 });
    const bx = 1220, by = 250;
    RV.circle(bulb, bx, by, 150, RV.radial(defs, [[0, "#fffbe6", 0.95], [1, "#fff3c4", 0]]));
    RV.path(bulb, `M ${bx - 50} ${by + 10} C ${bx - 80} ${by - 40} ${bx - 60} ${by - 100} ${bx} ${by - 104} C ${bx + 60} ${by - 100} ${bx + 80} ${by - 40} ${bx + 50} ${by + 10} C ${bx + 34} ${by + 30} ${bx + 30} ${by + 44} ${bx + 28} ${by + 58} L ${bx - 28} ${by + 58} C ${bx - 30} ${by + 44} ${bx - 34} ${by + 30} ${bx - 50} ${by + 10} Z`, "#fff6cf");
    RV.path(bulb, `M ${bx - 14} ${by + 50} L ${bx - 10} ${by - 10} L ${bx} ${by + 10} L ${bx + 10} ${by - 10} L ${bx + 14} ${by + 50}`, "none", { stroke: "#e2a43a", "stroke-width": 5, "stroke-linejoin": "round" });
    RV.rect(bulb, bx - 30, by + 58, 60, 14, "#9a8f82", { rx: 4 });
    RV.rect(bulb, bx - 26, by + 74, 52, 12, "#7f756a", { rx: 4 });
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i - 3.5) * 0.42;
      RV.path(bulb, `M ${bx + Math.cos(a) * 130} ${by - 20 + Math.sin(a) * 130} L ${bx + Math.cos(a) * 180} ${by - 20 + Math.sin(a) * 180}`, "none", { stroke: "#fff6cf", "stroke-width": 9, "stroke-linecap": "round" });
    }
    tl.fromTo(bulb, { opacity: 0, scale: 0.4, svgOrigin: `${bx} ${by}` }, { opacity: 1, scale: 1, svgOrigin: `${bx} ${by}`, duration: 0.5, ease: "back.out(2.2)" }, IDEA + 0.05);
    tl.fromTo(bulb, { y: 0 }, { y: -12, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, IDEA + 0.6);
    // eyes light up
    tl.fromTo(hd.eyeG, { y: 0 }, { y: -4, duration: 0.3, ease: "power2.out" }, IDEA);
    tl.fromTo(hd.pupil, { y: 0 }, { y: -3, duration: 0.3, ease: "power2.out" }, IDEA);
    tl.fromTo(hd.brow, { y: 0 }, { y: -10, duration: 0.3, ease: "back.out(2)" }, IDEA);
    tl.fromTo(idea, { scale: 1.0, svgOrigin: "1000 600" }, { scale: 1.08, svgOrigin: "1000 600", duration: Z - IDEA, ease: "sine.inOut" }, IDEA);
    // cut on the sparkle (hidden by a white flash)
    tl.set(idea, { opacity: 1 }, IDEA);
    tl.set([alps, stack], { opacity: 0 }, IDEA);
    tl.fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, IDEA);

    // entrance: wipe in from the left
    RV.wipe(tl, frame, A, 1.1, 1);
  };
})();
