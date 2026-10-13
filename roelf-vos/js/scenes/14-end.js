// 14 · Ending — night snow over the little village, and the name written once more in gold.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).end = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const NAME = RV.b(45, 3) + 0.4; // ~111.0 s, after "And Roelf got to see it."

    RV.rect(cam, -300, -300, 2520, 1700, RV.linear(defs, [[0, "#151b3d"], [0.45, "#26306a"], [0.78, "#4a5596"], [1, "#6a73b0"]]));
    const stars = RV.g(cam);
    const sr = RV.rng(101);
    for (let i = 0; i < 90; i++) RV.circle(stars, sr() * 1920, sr() * 700, 0.7 + sr() * 1.6, "#ffffff", { opacity: (0.2 + sr() * 0.5).toFixed(2) });
    const glowN = RV.radial(defs, [[0, "#ecc766", 0.16], [1, "#ecc766", 0]]);
    const ng = RV.ellipse(cam, 960, 470, 760, 300, glowN, { opacity: 0 });
    tl.fromTo(ng, { opacity: 0 }, { opacity: 1, duration: 2, ease: "sine.inOut" }, NAME + 0.8);

    // snowy village silhouette along the bottom
    const vg = RV.g(cam);
    RV.hill(vg, [[-300, 900], [400, 870], [1000, 900], [1600, 875], [2300, 900]], 1500, "#b8c0e4");
    RV.hill(vg, [[-300, 960], [500, 940], [1100, 970], [1700, 950], [2300, 965]], 1500, RV.linear(defs, [[0, "#c9cfee"], [1, "#7d86bd"]]));
    const night = { night: true, wall: "#c3c0d6", wallDark: "#9f9ab8", timber: "#3b2a3c", timberDark: "#2c1f2e", roof: "#4a2434", roofDark: "#371a28", shutter: "#2c3b5c", snow: true };
    [[160, 900, 0.34], [300, 892, 0.3], [430, 905, 0.36], [1490, 896, 0.34], [1630, 890, 0.3], [1770, 902, 0.36], [1880, 896, 0.28]].forEach(([x, y, s]) => RV.chalet(vg, x, y, Object.assign({ scale: s }, night)));
    RV.chapel(vg, 1340, 905, { s: 0.42, night: true, wall: "#d2cde0", wallDark: "#a8a2c2", roof: "#4a2434", roofDark: "#371a28", snow: true });
    [[560, 910, 90], [620, 920, 70], [1230, 905, 80], [1990, 910, 100]].forEach(([x, y, h]) => RV.pine(vg, x, y, h, "#1f2c48", "#18223a", "#f2f4ff"));
    tl.fromTo(vg, { y: 160 }, { y: 0, duration: 2.4, ease: "power2.out", immediateRender: true }, A);
    tl.fromTo(stars, { y: 220 }, { y: 0, duration: 2.4, ease: "power2.out", immediateRender: true }, A);

    RV.snowfall(cam, tl, { count: 200, t0: A, t1: Z, seed: 22, size: [1.5, 5.5], speed: [40, 100], fadeIn: 0.8, sway: 26 });

    // the name, the years, the village
    const name = RV.script(cam, "Roelf Vos", { x: 960, y: 520, size: 300, color: "#ecc766", width: 5.2, align: "center" });
    RV.drawOn(tl, name, NAME, 2.3);
    const yrs = RV.text(cam, 960, 640, "1921 – 1992", { "text-anchor": "middle", "font-family": "Cormorant Garamond", "font-weight": 600, "font-size": 58, "letter-spacing": 6, fill: "#f6ead3", style: "font-variant-numeric: lining-nums; font-feature-settings: 'lnum' 1" });
    tl.fromTo(yrs, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }, NAME + 2.0);
    const rule = RV.rect(cam, 840, 676, 240, 2, "#ecc766");
    tl.fromTo(rule, { scaleX: 0, svgOrigin: "960 677" }, { scaleX: 1, svgOrigin: "960 677", duration: 0.8, ease: "power2.out", immediateRender: true }, NAME + 2.4);
    const sub = RV.text(cam, 960, 730, "GRINDELWALD · TASMANIA", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 400, "font-size": 24, "letter-spacing": 12, fill: "#f6ead3" });
    tl.fromTo(sub, { opacity: 0 }, { opacity: 0.85, duration: 1.0, ease: "sine.inOut" }, NAME + 2.8);

    tl.fromTo(cam, { scale: 1.0, svgOrigin: "960 540" }, { scale: 1.05, svgOrigin: "960 540", duration: Z - A, ease: "sine.inOut", immediateRender: false }, A);
    RV.fadeIn(tl, frame, A, 1.4);
  };
})();
