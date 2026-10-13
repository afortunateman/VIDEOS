// 11 · 1989 — the village is complete: a golden-hour panorama of Swiss chalets in the Tasmanian hills.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).complete = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const SX = 1480, SY = 560;

    RV.rect(cam, -300, -300, 2520, 1700, RV.linear(defs, [[0, "#d9735a"], [0.25, "#f09a62"], [0.45, "#f8c27a"], [0.58, "#fde3ad"]]));
    RV.circle(cam, SX, SY, 700, RV.radial(defs, [[0, "#fff4d0", 0.95], [0.2, "#ffe0a0", 0.6], [1, "#f8c27a", 0]]));
    RV.circle(cam, SX, SY, 110, "#fff6dc");
    const sk = RV.g(cam);
    RV.streak(sk, -100, 260, 1100, 40, "#f9b48e", 0.8);
    RV.streak(sk, 900, 200, 1200, 36, "#fbc29a", 0.7);
    RV.streak(sk, 300, 420, 1500, 24, "#ffd9b0", 0.8);
    RV.streak(sk, 1200, 380, 900, 20, "#ffe2bc", 0.7);
    RV.cloud(sk, 360, 150, 380, { fill: "#ffd8b8", shade: "#f2a283", seed: 41, lumps: 4 });
    RV.cloud(sk, 1750, 120, 300, { fill: "#ffd8b8", shade: "#f2a283", seed: 42, lumps: 3 });
    tl.fromTo(sk, { x: -30 }, { x: 70, duration: Z - A, ease: "none" }, A);
    // birds
    const birds = RV.g(cam, { stroke: "#7a3b33", "stroke-width": 4, fill: "none", "stroke-linecap": "round" });
    [[700, 300, 1], [760, 330, 0.8], [820, 290, 0.9], [640, 340, 0.7]].forEach(([x, y, s]) => RV.path(birds, `M ${x - 20 * s} ${y} Q ${x - 10 * s} ${y - 12 * s} ${x} ${y} Q ${x + 10 * s} ${y - 12 * s} ${x + 20 * s} ${y}`));
    tl.fromTo(birds, { x: -100, y: 20 }, { x: 300, y: -40, duration: Z - A, ease: "none" }, A);

    // hills, back to front
    RV.hill(cam, [[-300, 600], [200, 560], [700, 600], [1200, 550], [1700, 590], [2300, 560]], 1500, "#a77f9e");
    RV.hill(cam, [[-300, 640], [400, 600], [900, 650], [1400, 610], [1900, 640], [2300, 620]], 1500, "#b39a66");
    RV.hill(cam, [[-300, 700], [300, 660], [800, 690], [1300, 680], [1800, 700], [2300, 690]], 1500, "#9fae55");
    const lake = RV.path(cam, "M 1320 812 C 1480 786 1780 786 1960 806 L 1960 880 C 1760 890 1480 888 1340 870 C 1270 860 1260 826 1320 812 Z", "#f6c27a");
    const shine = RV.g(cam, { stroke: "#fff1cf", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.85 });
    for (let i = 0; i < 7; i++) RV.path(shine, `M ${1420 + (i % 3) * 30 + i * 8} ${816 + i * 9} l ${70 - i * 6} 0`);
    tl.fromTo(shine, { x: 0 }, { x: 18, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: 3 }, A);
    RV.hill(cam, [[-300, 780], [400, 740], [1000, 785], [1500, 896], [2300, 892]], 1500, "#86a44a");
    // road
    RV.path(cam, "M 520 1300 C 600 1060 760 900 900 840 C 1000 800 1080 790 1180 770", "none", { stroke: "#efd9a8", "stroke-width": 22, "stroke-linecap": "round" });

    // the village
    const vill = RV.g(cam);
    const warm = { wall: "#f8ead0", wallDark: "#e0c39a", roof: "#8a3322", roofDark: "#62221a" };
    [[260, 700, 0.42], [380, 688, 0.36], [500, 708, 0.45], [640, 696, 0.4], [770, 716, 0.48], [905, 706, 0.42], [1050, 728, 0.52], [1190, 716, 0.42]].forEach(([x, y, s], i) => RV.chalet(vill, x, y, Object.assign({ scale: s, shutter: i % 2 ? "#2f6b46" : "#a8323a" }, warm)));
    [[1520, 702], [1600, 696], [1680, 702]].forEach(([x, y]) => RV.chalet(vill, x, y, Object.assign({ scale: 0.3, storeys: 1, h: 110 }, warm)));
    RV.chalet(vill, 1820, 740, Object.assign({ scale: 0.66, w: 340, h: 200, sign: "RESORT" }, warm));
    [[120, 760, 140, 1], [1270, 720, 90, 2], [1420, 700, 80, 3], [2000, 760, 150, 4]].forEach(([x, y, h, sd]) => RV.gum(vill, x, y, h, "#5f8a3e", "#4c7332", sd));
    [[340, 820, 0.55], [580, 836, 0.6], [830, 852, 0.62], [1090, 842, 0.55]].forEach(([x, y, s], i) => RV.chalet(vill, x, y, Object.assign({ scale: s, shutter: i % 2 ? "#a8323a" : "#2f6b46" }, warm)));
    RV.chapel(vill, 1350, 826, { s: 0.6, wall: "#fbf1de", wallDark: "#e6cfa8" });
    // golden light wash and long warm glow
    RV.rect(cam, -300, -300, 2520, 1700, RV.linear(defs, [[0, "#ff9a4a", 0], [0.6, "#ff9a4a", 0.06], [1, "#ff8a3a", 0.16]], 1, 0, 0, 0));
    // foreground meadow framing the shot
    const fg = RV.g(cam);
    RV.hill(fg, [[-300, 960], [400, 920], [1000, 970], [1600, 930], [2300, 960]], 1500, "#6f9640");
    const fr = RV.rng(7);
    for (let i = 0; i < 120; i++) RV.circle(fg, fr() * 2000, 960 + fr() * 120, 3 + fr() * 4, ["#fff3d6", "#f6c343", "#ef8fa3"][i % 3], { opacity: 0.9 });
    RV.gum(fg, -40, 1100, 420, "#4f7a34", "#3e652a", 11);
    RV.gum(fg, 1990, 1120, 380, "#4f7a34", "#3e652a", 12);
    tl.fromTo(fg, { x: 0 }, { x: -60, duration: Z - A, ease: "sine.inOut" }, A);

    // title card
    const card = RV.g(fx);
    const lbl = RV.text(card, 150, 160, "GRINDELWALD · TASMANIA", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 10, fill: "#6e2a2a" });
    const yr = RV.script(card, "1989", { x: 140, y: 340, size: 220, color: "#6e2a2a", width: 5.5 });
    tl.fromTo(lbl, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, T + 3.5);
    RV.drawOn(tl, yr, T + 3.6, 1.4);

    tl.fromTo(cam, { scale: 1.12, x: 60, svgOrigin: "960 700" }, { scale: 1.0, x: -40, svgOrigin: "960 700", duration: Z - A, ease: "sine.inOut" }, A);
    RV.iris(tl, frame, SX, SY, A, 1.4, "power2.inOut");
    const ring = RV.circle(fx, SX, SY, 0, "none", { stroke: "#fff1c8", "stroke-width": 5 });
    tl.fromTo(ring, { attr: { r: 0 }, opacity: 1 }, { attr: { r: 2300 }, opacity: 0.5, duration: 1.4, ease: "power2.inOut", immediateRender: true }, A);
    tl.set(ring, { opacity: 0 }, A + 1.4);
  };
})();
