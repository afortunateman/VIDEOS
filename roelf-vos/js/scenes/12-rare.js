// 12 · Two Grindelwalds — snowy Switzerland on the left, green Tasmania on the right; then Tasmania takes the frame.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).rare = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const SLIDE = RV.b(39, 2) - 0.3; // ~94.5 s

    // clip paths for the two halves
    const cl = RV.el("clipPath", { id: RV.uid("cl") }, defs);
    const clR = RV.rect(cl, 0, 0, 960, 1080, "#fff");
    const cr = RV.el("clipPath", { id: RV.uid("cr") }, defs);
    const crR = RV.rect(cr, 960, 0, 960, 1080, "#fff");

    // ---------- left: Grindelwald, Switzerland (snow) ----------
    const left = RV.g(cam, { "clip-path": `url(#${cl.id})` });
    const L = RV.g(left, { transform: "translate(-480 0)" });
    RV.rect(L, -200, -200, 2320, 1500, RV.linear(defs, [[0, "#9db0cf"], [0.5, "#cfd9e8"], [0.62, "#e9eef5"]]));
    RV.mountain(L, { x: 960, peak: 140, base: 720, w: 1100, light: "#eef2fa", dark: "#b8c2dc", mid: "#d3daeb", snow: false, seed: 61 });
    RV.mountain(L, { x: 620, peak: 300, base: 720, w: 700, light: "#e3e8f4", dark: "#a9b4d2", snow: false, seed: 62 });
    RV.mountain(L, { x: 1320, peak: 280, base: 720, w: 760, light: "#e3e8f4", dark: "#a9b4d2", snow: false, seed: 63 });
    RV.hill(L, [[300, 720], [700, 690], [1100, 720], [1600, 700]], 1300, "#f4f6fb");
    RV.hill(L, [[300, 820], [700, 800], [1100, 830], [1600, 810]], 1300, "#ffffff");
    [[620, 740, 0.4], [820, 760, 0.48], [1080, 750, 0.42], [960, 860, 0.62], [720, 880, 0.55], [1200, 880, 0.5]].forEach(([x, y, s]) => {
      const c = RV.chalet(L, x, y, { scale: s, snow: true });
    });
    [[540, 760, 80], [580, 780, 100], [1290, 770, 90], [1340, 790, 70], [520, 900, 120], [1400, 900, 130]].forEach(([x, y, h]) => RV.pine(L, x, y, h, "#2f5a4a", "#24473a", "#ffffff"));
    RV.snowfall(left, tl, { count: 110, x0: 0, x1: 980, t0: A, t1: Z, seed: 4, size: [2, 6], speed: [60, 120], fadeIn: 0.6 });

    // ---------- right: Grindelwald, Tasmania (green) ----------
    const right = RV.g(cam, { "clip-path": `url(#${cr.id})` });
    const Rg = RV.g(right);
    RV.rect(Rg, -600, -200, 3200, 1500, RV.linear(defs, [[0, "#8ec7e3"], [0.46, "#cfe7e8"], [0.62, "#f6e6c0"]]));
    const dusk = RV.rect(right, -600, -200, 3200, 1500, RV.linear(defs, [[0, "#2f3b78"], [0.5, "#5a66a8"], [0.66, "#c8a6c0"]]), { opacity: 0 });
    const R = RV.g(right);
    RV.circle(R, 1500, 300, 70, "#fff6dc");
    RV.circle(R, 1500, 300, 220, RV.radial(defs, [[0, "#fff6dc", 0.6], [1, "#fff6dc", 0]]));
    RV.cloud(R, 1200, 200, 300, { fill: "#ffffff", shade: "#d9e8ee", seed: 64, lumps: 3 });
    RV.hill(R, [[300, 640], [800, 600], [1300, 640], [1800, 600], [2600, 630]], 1400, "#8ea6c6");
    RV.hill(R, [[300, 720], [900, 680], [1500, 720], [2100, 690], [2600, 710]], 1400, "#9cc35a");
    RV.hill(R, [[300, 840], [900, 810], [1500, 850], [2100, 820], [2600, 840]], 1400, "#7fb04a");
    [[1240, 740, 0.4], [1440, 760, 0.48], [1700, 750, 0.42], [1580, 870, 0.62], [1340, 880, 0.55], [1820, 880, 0.5]].forEach(([x, y, s]) => RV.chalet(R, x, y, { scale: s }));
    [[1120, 760, 130, 1], [1960, 760, 150, 2], [1060, 920, 200, 3], [2050, 930, 190, 4]].forEach(([x, y, h, sd]) => RV.gum(R, x, y, h, "#5e8f45", "#4d7a39", sd));
    tl.fromTo(R, { x: 0 }, { x: -480, duration: 1.2, ease: "power2.inOut", immediateRender: false }, SLIDE);
    // the Tasmanian side slowly drifts toward dusk, handing over to the snow scene
    tl.fromTo(dusk, { opacity: 0 }, { opacity: 0.9, duration: Z - SLIDE - 1.4, ease: "sine.in", immediateRender: false }, SLIDE + 1.4);
    const duskVeil = RV.rect(right, -600, -200, 3200, 1500, "#27306a", { opacity: 0 });
    tl.fromTo(duskVeil, { opacity: 0 }, { opacity: 0.45, duration: Z - SLIDE - 1.4, ease: "sine.in", immediateRender: false }, SLIDE + 1.4);

    // divider + labels
    const div = RV.g(fx);
    const line = RV.rect(div, 957, 0, 6, 1080, "#ecc766");
    const knot = RV.g(div);
    RV.circle(knot, 960, 540, 26, "#2a1815", { stroke: "#ecc766", "stroke-width": 5 });
    RV.path(knot, "M 960 522 L 964 536 L 978 540 L 964 544 L 960 558 L 956 544 L 942 540 L 956 536 Z", "#ecc766");
    const labels = RV.g(fx);
    const lab = (x, txt, sub) => {
      const g = RV.g(labels);
      RV.rect(g, x - 260, 70, 520, 92, "#2a1815", { rx: 46, opacity: 0.78 });
      RV.text(g, x, 112, txt, { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 9, fill: "#f6ead3" });
      RV.text(g, x, 146, sub, { "text-anchor": "middle", "font-family": "Cormorant Garamond", "font-style": "italic", "font-weight": 600, "font-size": 28, fill: "#ecc766" });
      return g;
    };
    const lA = lab(480, "GRINDELWALD", "Switzerland");
    const lB = lab(1440, "GRINDELWALD", "Tasmania");
    tl.fromTo([lA, lB], { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.25, immediateRender: true }, T + 0.2);
    tl.fromTo(lA, { opacity: 1 }, { opacity: 0, duration: 0.4, immediateRender: false }, SLIDE);
    tl.fromTo(lB, { x: 0 }, { x: -480, duration: 1.2, ease: "power2.inOut", immediateRender: false }, SLIDE);
    tl.fromTo(lB, { opacity: 1 }, { opacity: 0, duration: 0.5, immediateRender: false }, Z - 1.6);
    // the divider sweeps left and Tasmania takes the whole frame
    const dv = { x: 960 };
    const applyDiv = () => {
      clR.setAttribute("width", Math.max(0, dv.x).toFixed(1));
      crR.setAttribute("x", dv.x.toFixed(1));
      crR.setAttribute("width", (1920 - dv.x + 1).toFixed(1));
      line.setAttribute("x", (dv.x - 3).toFixed(1));
      knot.setAttribute("transform", `translate(${(dv.x - 960).toFixed(1)} 0)`);
    };
    applyDiv();
    tl.fromTo(dv, { x: 960 }, { x: -40, duration: 1.2, ease: "power2.inOut", onUpdate: applyDiv, immediateRender: false }, SLIDE);
    // divider grows in at the start
    tl.fromTo(line, { scaleY: 0, svgOrigin: "960 540" }, { scaleY: 1, svgOrigin: "960 540", duration: 0.5, ease: "power2.out", immediateRender: true }, A - 0.1);
    tl.fromTo(knot, { opacity: 0 }, { opacity: 1, duration: 0.4 }, A + 0.8);
    tl.fromTo(div, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, SLIDE + 1.1);

    tl.fromTo(cam, { scale: 1.04, svgOrigin: "960 540" }, { scale: 1.0, svgOrigin: "960 540", duration: Z - A, ease: "sine.out" }, A);
    // entrance: the frame opens like two doors from the gold centre line
    tl.fromTo(frame, { clipPath: "inset(0px 960px 0px 960px)" }, { clipPath: "inset(0px 0px 0px 0px)", duration: 1.1, ease: "power3.inOut", immediateRender: true }, A + 0.2);
  };
})();
