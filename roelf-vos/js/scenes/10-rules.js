// 10 · The building rules — a chalkboard: a modern box gets a red cross, then turns into a proper chalet and a tick.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).rules = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const VETO = RV.b(32, 2), MORPH = RV.b(32, 3.2), OK = RV.b(33, 2);
    const CH = "#f3f1e7";

    // board + frame
    RV.rect(cam, -100, -100, 2120, 1280, "#6b4630");
    RV.rect(cam, 34, 34, 1852, 1012, "#2f3d38");
    const smudge = RV.radial(defs, [[0, "#4a5a53", 0.55], [1, "#2f3d38", 0]]);
    RV.ellipse(cam, 520, 380, 520, 300, smudge);
    RV.ellipse(cam, 1420, 720, 600, 300, smudge);
    RV.ellipse(cam, 1300, 220, 380, 160, smudge, { opacity: 0.6 });
    RV.rect(cam, 34, 34, 1852, 1012, "none", { stroke: "#4d3222", "stroke-width": 10 });
    RV.rect(cam, 14, 14, 1892, 1052, "none", { stroke: "#8a5d3e", "stroke-width": 14 });
    // chalk tray
    RV.rect(cam, 120, 1040, 1680, 20, "#5c3a26");
    RV.rect(cam, 1500, 1028, 70, 14, "#f3f1e7", { rx: 6 });
    RV.rect(cam, 1590, 1030, 44, 12, "#e88a8a", { rx: 6 });
    // ornamental corners (like the reference's café board)
    const orn = RV.g(cam, { fill: "none", stroke: CH, "stroke-width": 3, opacity: 0.55, "stroke-linecap": "round" });
    [[90, 90, 1, 1], [1830, 90, -1, 1], [90, 990, 1, -1], [1830, 990, -1, -1]].forEach(([x, y, sx, sy]) => {
      RV.path(orn, `M ${x} ${y + sy * 90} C ${x} ${y + sy * 30} ${x + sx * 30} ${y} ${x + sx * 90} ${y} M ${x + sx * 24} ${y + sy * 60} C ${x + sx * 24} ${y + sy * 36} ${x + sx * 36} ${y + sy * 24} ${x + sx * 60} ${y + sy * 24}`);
    });

    // heading in chalk script
    const head = RV.script(cam, "Building Rules", { x: 960, y: 210, size: 150, color: CH, width: 4.2, align: "center" });
    RV.drawOn(tl, head, T + 0.1, 1.3);
    const ul = RV.path(cam, "M 640 250 C 800 236 1100 236 1280 252", "none", { stroke: CH, "stroke-width": 3.5, "stroke-linecap": "round", opacity: 0.8 });
    RV.drawPath(tl, ul, 660, T + 1.2, 0.5);

    // the house in chalk: starts as a flat-roofed box, morphs into a chalet
    const house = RV.g(cam, { fill: "none", stroke: CH, "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" });
    const outline = RV.el("polyline", { points: "520,880 520,520 760,520 1000,520 1000,880 520,880" }, house);
    RV.drawPath(tl, outline, 2000, T + 0.3, 1.0);
    tl.fromTo(outline, { attr: { points: "520,880 520,520 760,520 1000,520 1000,880 520,880" } }, { attr: { points: "520,880 520,600 760,380 1000,600 1000,880 520,880" }, duration: 0.7, ease: "back.out(1.4)", immediateRender: false }, MORPH);
    // modern picture windows (erased in the morph)
    const modern = RV.g(house);
    RV.rect(modern, 560, 570, 380, 150);
    RV.path(modern, "M 750 570 L 750 720");
    RV.rect(modern, 820, 760, 90, 120);
    RV.drawPath(tl, modern.children[0], 1060, T + 0.9, 0.5);
    tl.fromTo(modern, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, MORPH - 0.1);
    // chalet details appear after the morph
    const roof = RV.path(house, "M 470 640 L 760 345 L 1050 640", "none", { "stroke-width": 7 });
    RV.drawPath(tl, roof, 830, MORPH + 0.4, 0.5);
    const balc = RV.g(house, { opacity: 0 });
    RV.path(balc, "M 500 700 L 1020 700 M 500 760 L 1020 760");
    for (let i = 0; i < 14; i++) RV.path(balc, `M ${515 + i * 37} 700 L ${515 + i * 37} 760`, "none", { "stroke-width": 3 });
    tl.fromTo(balc, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, MORPH + 0.6);
    const wins = RV.g(house, { opacity: 0 });
    [[620, 800], [900, 800], [650, 630], [870, 630]].forEach(([x, y]) => {
      RV.rect(wins, x - 32, y - 34, 64, 68);
      RV.path(wins, `M ${x} ${y - 34} L ${x} ${y + 34}`, "none", { "stroke-width": 3 });
      RV.rect(wins, x - 64, y - 34, 26, 68, "none", { stroke: "#9fd39a", "stroke-width": 4 });
      RV.rect(wins, x + 38, y - 34, 26, 68, "none", { stroke: "#9fd39a", "stroke-width": 4 });
    });
    RV.rect(wins, 730, 790, 60, 90);
    RV.rect(wins, 735, 460, 50, 60);
    tl.fromTo(wins, { opacity: 0 }, { opacity: 1, duration: 0.35 }, MORPH + 0.75);
    const flowers = RV.g(cam, { opacity: 0 });
    for (let i = 0; i < 13; i++) RV.circle(flowers, 515 + i * 40, 690, 11, i % 2 ? "#ef8fa3" : "#e85d5d", { opacity: 0.9 });
    tl.fromTo(flowers, { opacity: 0, scale: 0.6, svgOrigin: "760 690" }, { opacity: 1, scale: 1, svgOrigin: "760 690", duration: 0.35, ease: "back.out(2)" }, MORPH + 0.95);

    // the red cross
    const cross = RV.g(cam, { stroke: "#e2554e", "stroke-width": 16, "stroke-linecap": "round", fill: "none" });
    const x1 = RV.path(cross, "M 470 470 L 1050 930");
    const x2 = RV.path(cross, "M 1050 470 L 470 930");
    RV.drawPath(tl, x1, 760, VETO, 0.18, "power1.in");
    RV.drawPath(tl, x2, 760, VETO + 0.2, 0.18, "power1.in");
    tl.fromTo(cross, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, MORPH - 0.15);
    tl.fromTo(cam, { x: 0 }, { x: 10, duration: 0.05, yoyo: true, repeat: 3, ease: "none", immediateRender: false }, VETO + 0.2);
    const no = RV.text(cam, 760, 470, "FLAT ROOF? NOT HERE.", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 30, "letter-spacing": 8, fill: "#e2554e" });
    tl.fromTo(no, { opacity: 0 }, { opacity: 1, duration: 0.2 }, VETO + 0.3);
    tl.fromTo(no, { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, MORPH);

    // the green tick
    const tick = RV.path(cam, "M 190 640 L 250 720 L 410 480", "none", { stroke: "#8fd38a", "stroke-width": 18, "stroke-linecap": "round", "stroke-linejoin": "round" });
    RV.drawPath(tl, tick, 420, OK, 0.3, "power2.out");
    const spark = RV.g(cam, { opacity: 0 });
    RV.path(spark, "M 410 420 L 418 462 L 460 470 L 418 478 L 410 520 L 402 478 L 360 470 L 402 462 Z", "#fffbe8");
    tl.fromTo(spark, { opacity: 0, scale: 0.3, svgOrigin: "410 470" }, { opacity: 1, scale: 1.3, svgOrigin: "410 470", duration: 0.25 }, OK + 0.25);
    tl.fromTo(spark, { opacity: 1 }, { opacity: 0, duration: 0.4, immediateRender: false }, OK + 0.5);

    // chalk annotations
    const notes = [
      ["steep roof", 1290, 420, "M 1275 404 C 1190 390 1120 400 1040 470"],
      ["timber balcony", 1290, 575, "M 1275 562 C 1200 580 1110 640 1030 720"],
      ["flower boxes", 1290, 730, "M 1275 716 C 1190 712 1110 700 1040 692"],
      ["shutters", 1290, 870, "M 1275 856 C 1200 846 1100 830 990 808"],
    ];
    notes.forEach(([txt, x, y, arrow], i) => {
      const t0 = OK + 0.35 + i * 0.5;
      const n = RV.script(cam, txt, { x, y, size: 76, color: CH, width: 3.2 });
      RV.drawOn(tl, n, t0, 0.55);
      const ar = RV.path(cam, arrow, "none", { stroke: CH, "stroke-width": 3, "stroke-linecap": "round", opacity: 0.8 });
      RV.drawPath(tl, ar, 420, t0, 0.4);
    });

    // entrance: the board slides up into frame
    tl.fromTo(frame, { y: 1080 }, { y: 0, duration: 0.9, ease: "power3.out", immediateRender: true }, A);
    tl.fromTo(cam, { scale: 1.0, svgOrigin: "960 600" }, { scale: 1.05, svgOrigin: "960 600", duration: Z - A, ease: "sine.inOut", immediateRender: false }, A + 0.9);
  };
})();
