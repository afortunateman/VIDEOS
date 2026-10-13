// 1 · Title — dark coffee-brown silk, flourish lines, the name written in gold.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).title = function (tl, S) {
    const { defs, cam, win } = S;
    const T = win.t0;
    RV.rect(cam, -100, -100, 2120, 1280, "#2a1815");
    // drifting glows (radial gradients are cheap to repaint)
    const glow = RV.radial(defs, [[0, "#7a3f28", 0.55], [0.5, "#4a2519", 0.25], [1, "#2a1815", 0]]);
    const glow2 = RV.radial(defs, [[0, "#9a5a34", 0.35], [1, "#2a1815", 0]]);
    const g1 = RV.ellipse(cam, 520, 420, 820, 520, glow);
    const g2 = RV.ellipse(cam, 1500, 760, 760, 480, glow);
    const g3 = RV.ellipse(cam, 1100, 300, 520, 300, glow2);
    tl.fromTo(g1, { x: -60, y: 20 }, { x: 80, y: -30, duration: 8, ease: "sine.inOut" }, T);
    tl.fromTo(g2, { x: 50, y: 0 }, { x: -90, y: 40, duration: 8, ease: "sine.inOut" }, T);
    tl.fromTo(g3, { x: 0, opacity: 0.4 }, { x: -120, opacity: 1, duration: 8, ease: "sine.inOut" }, T);

    // silk folds
    const fold = RV.linear(defs, [[0, "#3c2420"], [0.55, "#2f1b18"], [1, "#24130f"]], 0, 0, 1, 1);
    const fold2 = RV.linear(defs, [[0, "#452a22", 0.9], [1, "#2a1815", 0]], 0, 0, 1, 0);
    const folds = RV.g(cam);
    RV.path(folds, "M -100 760 C 300 620 520 900 900 780 C 1240 670 1460 900 2020 720 L 2020 1180 L -100 1180 Z", fold, { opacity: 0.9 });
    RV.path(folds, "M -100 160 C 260 60 620 300 980 180 C 1300 80 1560 260 2020 120 L 2020 -100 L -100 -100 Z", fold, { opacity: 0.8 });
    RV.path(folds, "M -100 300 C 400 120 700 520 1200 360 C 1500 260 1700 380 2020 300 L 2020 340 C 1700 420 1500 300 1200 410 C 700 580 400 190 -100 360 Z", fold2, { opacity: 0.55 });
    tl.fromTo(folds, { x: 0, y: 10 }, { x: -70, y: -14, duration: 8, ease: "sine.inOut" }, T);

    // flourish lines sweeping across, drawn on like ink
    const lines = RV.g(cam, { fill: "none", "stroke-linecap": "round" });
    const curves = [
      ["M -60 820 C 320 760 380 520 720 520 C 1000 520 1080 700 1340 640 C 1600 580 1700 380 2000 330", "#e9c46a", 2.2, 0.55],
      ["M -60 880 C 360 860 520 640 860 640 C 1180 640 1260 820 1560 760 C 1760 720 1860 600 2000 560", "#f6ead3", 1.4, 0.35],
      ["M -60 240 C 260 320 420 160 700 200 C 980 240 1120 120 1400 160 C 1660 200 1800 120 2000 60", "#f6ead3", 1.2, 0.3],
      ["M 2000 980 C 1700 940 1500 1020 1200 960 C 900 900 760 1000 420 980", "#e9c46a", 1.6, 0.35],
      ["M -60 560 C 200 480 300 300 520 260", "#e9c46a", 1.4, 0.4],
    ];
    curves.forEach(([d, c, w, op], i) => {
      const p = RV.path(lines, d, "none", { stroke: c, "stroke-width": w, opacity: op });
      RV.drawPath(tl, p, 2600, T + 0.15 + i * 0.22, 2.6, "power2.out");
    });
    tl.fromTo(lines, { x: 0 }, { x: -40, duration: 8, ease: "sine.inOut" }, T);

    // dust motes
    RV.particles(cam, tl, { count: 46, t0: T, t1: win.end, seed: 21, color: "#f2d38a", size: [1.2, 3.4], vy: [-26, -8], vx: [-6, 10], opacity: 0.55 });

    // the name
    const words = RV.g(cam);
    const small = RV.script(words, "the story of", { x: 540, y: 420, size: 128, color: "#f6ead3", width: 2.6 });
    const name = RV.script(words, "Roelf Vos", { x: 1000, y: 690, size: 340, color: "#ecc766", width: 5.2, align: "center" });
    RV.drawOn(tl, small, T + 0.6, 1.4);
    RV.drawOn(tl, name, T + 1.75, 2.35);
    // a soft gold underglow once the name is written
    const ng = RV.radial(defs, [[0, "#f3c96b", 0.28], [1, "#f3c96b", 0]]);
    const under = RV.ellipse(words, 1000, 600, 700, 220, ng, { opacity: 0 });
    words.insertBefore(under, words.firstChild);
    tl.fromTo(under, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: "sine.inOut" }, T + 3.2);

    // subtitle
    const sub = RV.text(cam, 960, 828, "THE MAN WHO BUILT HIS OWN SWITZERLAND", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 400, "font-size": 25, "letter-spacing": 11, fill: "#f6ead3" });
    tl.fromTo(sub, { opacity: 0, y: 14 }, { opacity: 0.88, y: 0, duration: 1.1, ease: "power2.out" }, T + 4.3);

    // slow camera push
    tl.fromTo(cam, { scale: 1, x: 0, y: 0, svgOrigin: "960 540" }, { scale: 1.07, x: -50, y: -30, svgOrigin: "960 540", duration: win.end - T, ease: "sine.inOut" }, T);
  };
})();
