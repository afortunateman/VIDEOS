// 2 · The Netherlands, 1921 — a peach sunrise over tulip fields, windmills turning, a stork on its way.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).holland = function (tl, S) {
    const { defs, cam, win, frame, hud } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const HZ = 610; // horizon

    // sky
    RV.rect(cam, -200, -200, 2320, 1500, RV.linear(defs, [[0, "#f19a68"], [0.38, "#f6b47e"], [0.62, "#fbd29d"], [0.72, "#fde4b8"]]));
    const sunGlow = RV.radial(defs, [[0, "#fff4d6", 0.95], [0.25, "#ffe7b4", 0.6], [1, "#fbd29d", 0]]);
    const sunG = RV.g(cam);
    RV.circle(sunG, 1240, 560, 560, sunGlow);
    RV.circle(sunG, 1240, 560, 140, "#fff3d4");
    RV.circle(sunG, 1240, 560, 116, "#fff8e6");
    tl.fromTo(sunG, { y: 40 }, { y: -10, duration: Z - A, ease: "sine.out" }, A);

    // clouds — far streaks and lumpy mid clouds, drifting at different speeds
    const far = RV.g(cam);
    RV.streak(far, -100, 300, 900, 40, "#fde3c3", 0.8);
    RV.streak(far, 900, 230, 1200, 34, "#fde3c3", 0.7);
    RV.streak(far, 300, 470, 1400, 26, "#ffe9cc", 0.75);
    RV.streak(far, 1300, 420, 900, 22, "#ffeacc", 0.7);
    tl.fromTo(far, { x: 0 }, { x: 70, duration: Z - A, ease: "none" }, A);
    const mid = RV.g(cam);
    RV.cloud(mid, 300, 210, 420, { fill: "#fff3e3", shade: "#f6c99f", seed: 3, lumps: 4 });
    RV.cloud(mid, 1580, 150, 520, { fill: "#fff3e3", shade: "#f6c99f", seed: 8, lumps: 5 });
    RV.cloud(mid, 640, 400, 300, { fill: "#fff6ea", shade: "#f6cba3", seed: 5, lumps: 3 });
    RV.cloud(mid, 1950, 360, 380, { fill: "#fff1df", shade: "#f6c99f", seed: 6, lumps: 4 });
    tl.fromTo(mid, { x: -40 }, { x: 120, duration: Z - A, ease: "none" }, A);

    // far horizon: tree line, farm and a distant windmill in atmospheric rose
    const hor = RV.g(cam);
    const haze = "#e3a084";
    const hr = RV.rng(17);
    for (let i = 0; i < 34; i++) {
      const x = -60 + i * 64 + hr() * 40;
      const r = 10 + hr() * 20;
      if (hr() < 0.25) RV.ellipse(hor, x, HZ - 34, 9, 38, RV.shade(haze, -0.04));
      else RV.ellipse(hor, x, HZ - r * 0.7, r * 1.15, r, hr() < 0.5 ? haze : RV.shade(haze, 0.05));
    }
    RV.rect(hor, -100, HZ - 14, 2120, 20, haze);
    const farMill = RV.g(hor, { transform: "translate(1640 604)" });
    RV.poly(farMill, [[-16, 0], [-10, -78], [10, -78], [16, 0]], "#cf8a70");
    RV.ellipse(farMill, 0, -80, 12, 7, "#c27c64");
    const farSails = RV.g(RV.g(farMill, { transform: "translate(0 -80)" }));
    for (let i = 0; i < 4; i++) RV.rect(farSails, -3, -70, 6, 70, "#c27c64", { transform: `rotate(${i * 90 + 20})` });
    tl.fromTo(farSails, { rotation: 0 }, { rotation: -160, svgOrigin: "0 0", duration: Z - A, ease: "none" }, A);
    RV.poly(hor, [[300, 600], [330, 574], [360, 600]], "#cd8770");
    RV.rect(hor, 306, 586, 48, 18, "#d99178");

    // canal reflecting the sky
    const water = RV.linear(defs, [[0, "#fbd8ab"], [1, "#f4b98a"]]);
    RV.rect(cam, -200, HZ, 2320, 70, water);
    const ripples = RV.g(cam, { stroke: "#fff1d9", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.8 });
    for (let i = 0; i < 18; i++) {
      const x = (i * 131) % 1900, y = HZ + 12 + ((i * 29) % 50);
      RV.path(ripples, `M ${x} ${y} L ${x + 40 + (i % 3) * 30} ${y}`);
    }
    tl.fromTo(ripples, { x: 0 }, { x: -60, duration: Z - A, ease: "sine.inOut" }, A);
    RV.ellipse(cam, 1240, HZ + 30, 160, 14, "#fff3d8", { opacity: 0.85 });
    RV.rect(cam, -200, HZ + 66, 2320, 12, "#3f8f4a");

    // tulip fields in perspective
    const fields = RV.g(cam);
    const top = HZ + 76, bot = 1180;
    const colors = ["#d62839", "#f6c343", "#ec5f9a", "#f28a33", "#fbf1df", "#b5179e", "#e83f4b", "#ffd45c", "#f07ab1", "#f39a3c"];
    const N = 26;
    // boundary positions: flower strips (even i) are three units wide, green gaps (odd i) one unit
    const units = [0];
    for (let i = 0; i < N; i++) units.push(units[i] + (i % 2 ? 1 : 3));
    const U = units[N];
    const xt = (i) => 520 + (units[i] / U) * 1080;
    const xb = (i) => -2600 + (units[i] / U) * 7100;
    for (let i = 0; i < N; i++) {
      const isLeaf = i % 2 === 1;
      const a0 = i, a1 = i + 1;
      const pad = isLeaf ? 0 : 0;
      const pts = [[xt(a0) - pad, top], [xt(a1) + pad, top], [xb(a1) + pad, bot], [xb(a0) - pad, bot]];
      if (isLeaf) {
        // the green gaps are thinner: draw a narrow strip centred on the boundary
        const mt = (xt(a0) + xt(a1)) / 2, mb = (xb(a0) + xb(a1)) / 2;
        RV.poly(fields, [[xt(a0), top], [xt(a1), top], [xb(a1), bot], [xb(a0), bot]], "#2f7d42");
        RV.poly(fields, [[mt - 3, top], [mt + 3, top], [mb + 70, bot], [mb - 70, bot]], "#246a37", { opacity: 0.6 });
      } else {
        const c = colors[(i / 2) % colors.length];
        RV.poly(fields, pts, c);
        // a lighter top edge per stripe gives the petals a sense of light
        RV.poly(fields, [[xt(a0), top], [xt(a0) + (xt(a1) - xt(a0)) * 0.35, top], [xb(a0) + (xb(a1) - xb(a0)) * 0.35, bot], [xb(a0), bot]], RV.shade(c, 0.18), { opacity: 0.7 });
      }
    }
    // the leaf strips actually need to be narrower than the flower strips: overlay flowers again slightly wider
    // flower heads in the nearest rows
    const heads = RV.g(cam);
    const rr = RV.rng(42);
    for (let k = 0; k < 420; k++) {
      const v = Math.pow(rr(), 0.7);
      const y = top + 40 + v * (1080 - top - 20);
      const t = (y - top) / (bot - top);
      const i = Math.floor(rr() * N / 2) * 2;
      const x0 = RV.lerp(xt(i), xb(i), t), x1 = RV.lerp(xt(i + 1), xb(i + 1), t);
      const x = RV.lerp(x0, x1, 0.15 + rr() * 0.7);
      const c = colors[(i / 2) % colors.length];
      const s = 2 + t * 13;
      RV.ellipse(heads, x, y, s * 0.8, s, RV.shade(c, rr() > 0.5 ? -0.12 : 0.15));
    }

    // windmill (left)
    const mill = RV.g(cam, { transform: "translate(420 690)" });
    RV.ellipse(mill, 10, 6, 210, 26, "#3a8a47");
    RV.poly(mill, [[-78, 0], [-40, -300], [40, -300], [78, 0]], "#6e4848");
    RV.poly(mill, [[10, 0], [8, -300], [40, -300], [78, 0]], "#523334");
    RV.rect(mill, -96, -150, 192, 14, "#3d2627");
    for (let i = 0; i < 12; i++) RV.rect(mill, -92 + i * 16, -168, 4, 18, "#3d2627");
    RV.rect(mill, -96, -170, 192, 5, "#3d2627");
    RV.path(mill, "M -18 0 L -18 -52 A 18 18 0 0 1 18 -52 L 18 0 Z", "#2f1d1e");
    RV.rect(mill, -14, -238, 22, 30, "#f2c27a", { rx: 3 });
    RV.rect(mill, -8, -112, 18, 24, "#f2c27a", { rx: 3 });
    RV.path(mill, "M -52 -296 C -52 -350 52 -350 52 -296 Z", "#3d2627");
    RV.rect(mill, -56, -302, 112, 10, "#2f1d1e");
    const hub = RV.g(mill, { transform: "translate(0 -322)" });
    const sails = RV.g(hub);
    for (let i = 0; i < 4; i++) {
      const s = RV.g(sails, { transform: `rotate(${i * 90 + 12})` });
      RV.rect(s, -5, -250, 10, 250, "#3d2627");
      RV.rect(s, 6, -240, 46, 196, "#f6ead3");
      for (let j = 0; j < 9; j++) RV.rect(s, 6, -240 + j * 22, 46, 3, "#3d2627", { opacity: 0.8 });
      for (let j = 0; j < 3; j++) RV.rect(s, 6 + j * 16, -240, 3, 196, "#3d2627", { opacity: 0.8 });
    }
    RV.circle(hub, 0, 0, 14, "#2f1d1e");
    tl.fromTo(sails, { rotation: 0 }, { rotation: 150, svgOrigin: "0 0", duration: Z - A, ease: "none" }, A);
    // reflection of the mill in the canal
    const refl = RV.g(cam, { opacity: 0.22, transform: "translate(420 676) scale(1 -0.25)" });
    RV.poly(refl, [[-78, 0], [-40, -300], [40, -300], [78, 0]], "#6e4848");
    // farmhouse
    const farm = RV.g(cam, { transform: "translate(690 688)" });
    RV.rect(farm, -70, -60, 140, 60, "#b8463a");
    RV.rect(farm, 10, -60, 60, 60, "#933629");
    RV.poly(farm, [[-82, -56], [-30, -120], [30, -120], [82, -56]], "#3f2a2a");
    RV.poly(farm, [[30, -120], [82, -56], [30, -56]], "#2c1c1c");
    RV.rect(farm, -50, -42, 22, 22, "#f2c27a");
    RV.rect(farm, 30, -42, 22, 22, "#f2c27a");
    RV.roundTree(cam, 820, 690, 110, "#3f8f4a", "#2f7340");
    RV.roundTree(cam, 870, 690, 80, "#4a9a50", "#2f7340");
    RV.roundTree(cam, 190, 692, 90, "#3f8f4a", "#2f7340");

    // a stork carrying a bundle across the sky
    const stork = RV.g(cam);
    const body = RV.g(stork);
    RV.path(body, "M 0 0 C 24 -12 64 -12 92 -4 C 104 -2 112 4 116 10 L 92 12 C 64 16 30 14 0 0 Z", "#fbf7ef");
    RV.path(body, "M 112 4 C 124 -6 134 -10 146 -8 L 150 -4 C 140 -2 128 2 118 10 Z", "#fbf7ef");
    RV.path(body, "M 146 -8 L 196 2 L 148 -1 Z", "#f08a33");
    RV.circle(body, 142, -6, 2.4, "#2b2422");
    RV.path(body, "M 2 4 L -60 18 L -60 22 L 4 8 Z", "#f08a33");
    RV.path(body, "M 0 2 L -40 -4 L -38 4 Z", "#2b2422");
    // bundle hanging from the beak
    RV.path(body, "M 178 0 L 176 40", "none", { stroke: "#efe3cf", "stroke-width": 3 });
    RV.path(body, "M 150 40 C 150 30 200 28 204 40 C 210 70 196 86 176 86 C 156 86 146 70 150 40 Z", "#fbefe0");
    RV.path(body, "M 150 40 C 168 48 188 48 204 40 C 196 52 160 54 150 40 Z", "#f3c1c8");
    RV.circle(body, 176, 58, 12, "#f0b591");
    const wingUp = RV.path(stork, "M 30 -4 C 40 -60 70 -110 120 -130 C 96 -90 84 -40 70 -6 Z", "#fbf7ef");
    const wingTip = RV.path(stork, "M 120 -130 C 100 -110 92 -90 86 -70 L 104 -76 C 108 -96 112 -114 120 -130 Z", "#2b2422");
    const wing = RV.g(stork);
    wing.appendChild(wingUp);
    wing.appendChild(wingTip);
    tl.fromTo(wing, { scaleY: 1 }, { scaleY: -0.55, svgOrigin: "50 -4", duration: 0.42, ease: "sine.inOut", repeat: 15, yoyo: true }, A);
    tl.fromTo(stork, { x: -360, y: 330, scale: 1.1 }, { x: 2150, y: 210, scale: 1.1, duration: 7.8, ease: "none" }, A + 0.3);
    tl.fromTo(body, { y: 0 }, { y: 8, duration: 0.42, ease: "sine.inOut", repeat: 15, yoyo: true }, A);

    // foreground tulips framing the shot (biggest parallax)
    const fg = RV.g(cam);
    const tulip = (x, y, h, c, rot, seed) => {
      const g = RV.g(fg, { transform: `translate(${x} ${y})` });
      const sway = RV.g(g);
      RV.path(sway, `M 0 0 C ${-8} ${-h * 0.4} ${10} ${-h * 0.7} 0 ${-h}`, "none", { stroke: "#2c7a3f", "stroke-width": 9, "stroke-linecap": "round" });
      RV.path(sway, `M 0 ${-h * 0.15} C ${-60} ${-h * 0.3} ${-70} ${-h * 0.55} ${-40} ${-h * 0.75} C ${-40} ${-h * 0.5} ${-20} ${-h * 0.32} 0 ${-h * 0.25} Z`, "#3a9a4c");
      RV.path(sway, `M 0 ${-h * 0.2} C ${-40} ${-h * 0.32} ${-56} ${-h * 0.52} ${-40} ${-h * 0.75} C ${-30} ${-h * 0.52} ${-16} ${-h * 0.36} 0 ${-h * 0.25} Z`, "#2c7a3f");
      const cup = RV.g(sway, { transform: `translate(0 ${-h})` });
      RV.path(cup, "M -34 -10 C -38 -60 -20 -84 0 -92 C 20 -84 38 -60 34 -10 C 26 10 -26 10 -34 -10 Z", c);
      RV.path(cup, "M 0 -92 C 20 -84 38 -60 34 -10 C 26 10 6 12 0 8 C 10 -20 10 -60 0 -92 Z", RV.shade(c, -0.18));
      RV.path(cup, "M -34 -10 C -38 -50 -30 -70 -16 -80 C -14 -50 -14 -20 -8 6 C -20 6 -30 0 -34 -10 Z", RV.shade(c, 0.15));
      tl.fromTo(sway, { rotation: -rot }, { rotation: rot, svgOrigin: "0 0", duration: 2.4 + seed * 0.3, ease: "sine.inOut", repeat: 3, yoyo: true }, A);
      return g;
    };
    tulip(80, 1120, 360, "#d62839", 3, 1);
    tulip(190, 1140, 300, "#f6c343", 4, 2);
    tulip(-10, 1150, 260, "#ec5f9a", 3, 3);
    tulip(1830, 1130, 340, "#f28a33", 3, 2);
    tulip(1720, 1150, 270, "#d62839", 4, 1);
    tulip(1950, 1150, 300, "#f6c343", 3, 3);

    // title card: the year in plum script + a small caps label
    const card = RV.g(S.fx);
    const lbl = RV.text(card, 965, 150, "THE NETHERLANDS", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 10, fill: "#6e2433" });
    const yr = RV.script(card, "1921", { x: 960, y: 345, size: 230, color: "#6e2433", width: 5.5, align: "center" });
    tl.fromTo(lbl, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, T + 0.25);
    RV.drawOn(tl, yr, T + 0.4, 1.5);
    tl.fromTo(card, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "sine.in", immediateRender: false }, Z - 1.6);

    // camera: slow push and drift
    tl.fromTo(cam, { scale: 1.02, x: 0, y: 0, svgOrigin: "960 600" }, { scale: 1.1, x: -40, y: -10, svgOrigin: "960 600", duration: Z - A, ease: "sine.inOut" }, A);
    tl.fromTo(fg, { x: 0 }, { x: -50, duration: Z - A, ease: "sine.inOut" }, A);

    // entrance: an iris opening from the sun, edged with a thin gold ring
    RV.iris(tl, frame, 1240, 560, A, 1.5, "power2.inOut");
    const ring = RV.circle(S.fx, 1240, 560, 0, "none", { stroke: "#ecc766", "stroke-width": 5 });
    tl.fromTo(ring, { attr: { r: 0 }, opacity: 1 }, { attr: { r: 2300 }, opacity: 0.6, duration: 1.5, ease: "power2.inOut", immediateRender: true }, A);
    tl.set(ring, { opacity: 0 }, A + 1.5);
  };
})();
