// 13 · 1992, it snowed — a blue dusk over the village, Roelf on his balcony, the first flake, then white everywhere.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).snow = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const FIRST = RV.b(42), COVER0 = RV.b(42, 2), COVER1 = RV.b(44, 2);

    const world = RV.g(cam);
    RV.rect(world, -400, -400, 2720, 1900, RV.linear(defs, [[0, "#2c376f"], [0.32, "#46519a"], [0.52, "#7a7fba"], [0.64, "#d3a9bb"]]));
    const stars = RV.g(world);
    const sr = RV.rng(81);
    for (let i = 0; i < 60; i++) RV.circle(stars, sr() * 1920, sr() * 380, 0.8 + sr() * 1.5, "#ffffff", { opacity: (0.3 + sr() * 0.5).toFixed(2) });
    tl.fromTo(stars, { opacity: 1 }, { opacity: 0, duration: 2.5, immediateRender: false }, FIRST - 0.5);
    // snow clouds gathering
    const clouds = RV.g(world, { opacity: 0.0 });
    RV.cloud(clouds, 300, 140, 700, { fill: "#7c84bb", shade: "#646ca6", seed: 91, lumps: 5, h: 220 });
    RV.cloud(clouds, 1000, 90, 800, { fill: "#858dc2", shade: "#6a72ab", seed: 92, lumps: 6, h: 240 });
    RV.cloud(clouds, 1700, 150, 700, { fill: "#7c84bb", shade: "#646ca6", seed: 93, lumps: 5, h: 210 });
    tl.fromTo(clouds, { opacity: 0.25, y: -80 }, { opacity: 1, y: 0, duration: FIRST - A + 1, ease: "sine.inOut" }, A);

    // hills, each with a white twin that fades in as the snow settles
    const hills = [
      [[[-300, 620], [300, 580], [900, 620], [1500, 570], [2300, 610]], "#5b609f", "#c7cdeb"],
      [[[-300, 690], [400, 650], [1000, 690], [1600, 660], [2300, 690]], "#4a5590", "#d6dbf2"],
      [[[-300, 780], [500, 750], [1100, 790], [1700, 770], [2300, 790]], "#3c477e", "#e6e9f8"],
    ];
    const snowLayers = [];
    hills.forEach(([crest, c, w]) => {
      RV.hill(world, crest, 1600, c);
      snowLayers.push(RV.hill(world, crest, 1600, w, { opacity: 0 }));
    });
    // lake with lit reflections
    RV.path(world, "M 1180 812 C 1340 790 1640 790 1800 808 C 1860 818 1840 846 1760 852 C 1580 866 1360 864 1220 850 C 1150 842 1130 822 1180 812 Z", "#6470b2");
    const refl = RV.g(world, { opacity: 0.7 });
    for (let i = 0; i < 10; i++) RV.rect(refl, 1240 + i * 52, 816 + (i % 3) * 10, 18, 4, "#ffcf6e");

    // the village at dusk, windows lit
    const night = { night: true, wall: "#c9c4d6", wallDark: "#9f9ab8", timber: "#4a3346", timberDark: "#38263a", roof: "#5a2a3a", roofDark: "#43202e", shutter: "#2c3b5c", snow: true };
    const roofs = [];
    const vill = RV.g(world);
    [[180, 690, 0.4], [320, 680, 0.36], [450, 700, 0.44], [600, 690, 0.4], [740, 708, 0.48], [880, 700, 0.42], [1020, 716, 0.5], [1500, 690, 0.3], [1580, 684, 0.3], [1660, 690, 0.3]].forEach(([x, y, s], i) => {
      const c = RV.chalet(vill, x, y, Object.assign({ scale: s, storeys: i >= 7 ? 1 : 2, h: i >= 7 ? 110 : 170 }, night));
      roofs.push(c.snowRoof);
    });
    const chap = RV.chapel(vill, 1150, 820, { s: 0.6, night: true, wall: "#d2cde0", wallDark: "#a8a2c2", roof: "#5a2a3a", roofDark: "#43202e", snow: true });
    roofs.push(chap.snowRoof);
    [[300, 800, 0.55], [540, 816, 0.6], [790, 830, 0.62]].forEach(([x, y, s]) => roofs.push(RV.chalet(vill, x, y, Object.assign({ scale: s }, night)).snowRoof));
    const trees = RV.g(vill);
    [[90, 720, 110], [1080, 700, 90], [1880, 720, 130], [1960, 760, 100], [1420, 700, 80]].forEach(([x, y, h]) => RV.pine(trees, x, y, h, "#22314e", "#1a2640", "#f2f4ff"));
    const caps = trees.querySelectorAll(".snowcap");
    // window glow halos
    const halo = RV.radial(defs, [[0, "#ffcf6e", 0.35], [1, "#ffcf6e", 0]]);
    const halos = RV.g(world);
    [[180, 650], [450, 660], [740, 668], [1020, 676], [300, 760], [540, 774], [790, 790], [1150, 770]].forEach(([x, y]) => RV.ellipse(halos, x, y, 120, 60, halo));
    // snow settles on roofs, trees and ground
    roofs.forEach((r, i) => r && tl.fromTo(r, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: "sine.inOut", immediateRender: true }, COVER0 + (i % 5) * 0.2));
    tl.fromTo(caps, { opacity: 0 }, { opacity: 1, duration: 2, ease: "sine.inOut", immediateRender: true }, COVER0 + 0.4);
    snowLayers.forEach((l, i) => tl.fromTo(l, { opacity: 0 }, { opacity: 1, duration: COVER1 - COVER0, ease: "sine.inOut", immediateRender: true }, COVER0 + i * 0.4));

    // ---------- Roelf on his balcony (foreground right) ----------
    const porch = RV.g(cam);
    RV.rect(porch, 1180, 160, 900, 1000, "#3b2a3c");
    RV.rect(porch, 1180, 160, 900, 1000, RV.linear(defs, [[0, "#000", 0], [1, "#000", 0.25]], 0, 0, 1, 0));
    RV.rect(porch, 1560, 300, 300, 640, "#ffcf6e");
    RV.rect(porch, 1560, 300, 300, 640, RV.radial(defs, [[0, "#fff1c9", 0.9], [1, "#ffb84e", 0.2]]));
    RV.rect(porch, 1546, 290, 328, 20, "#2a1d2b");
    RV.rect(porch, 1546, 290, 20, 660, "#2a1d2b");
    RV.rect(porch, 1854, 290, 20, 660, "#2a1d2b");
    const glowP = RV.radial(defs, [[0, "#ffcf6e", 0.45], [1, "#ffcf6e", 0]]);
    RV.ellipse(porch, 1600, 700, 520, 420, glowP);
    // eaves overhead
    RV.path(porch, "M 1100 120 L 2100 40 L 2100 190 L 1100 210 Z", "#43202e");
    const eaveSnow = RV.path(porch, "M 1096 116 L 2104 36 L 2104 70 C 1800 86 1500 110 1100 146 Z", "#f4f6ff", { opacity: 0 });
    tl.fromTo(eaveSnow, { opacity: 0 }, { opacity: 1, duration: 2.5, ease: "sine.inOut", immediateRender: true }, COVER0 + 0.6);
    // old Roelf: grey hair, cardigan, scarf, looking up
    const man = RV.g(porch);
    RV.path(man, "M 1240 1140 C 1250 980 1340 900 1450 884 L 1600 884 C 1700 900 1780 960 1800 1140 Z", "#7a4f3e");
    RV.path(man, "M 1560 884 L 1600 884 C 1700 900 1780 960 1800 1140 L 1600 1140 C 1610 1040 1590 940 1560 884 Z", "#603d31");
    RV.path(man, "M 1400 880 C 1450 920 1560 920 1620 870 L 1640 930 C 1560 980 1440 980 1380 930 Z", "#a8323a");
    RV.path(man, "M 1560 930 L 1600 1100 L 1550 1110 L 1520 940 Z", "#8f2a31");
    const hd = RV.head(man, { x: 1480, y: 900, scale: 1.25, grey: true, hair: "#dcd8d2", glasses: true, smile: 1, lookUp: 1, skin: "#e2a882", skinDark: "#b07458", nose: "#3f3a86", rim: "#ffd590" });
    hd.g.setAttribute("transform", hd.g.getAttribute("transform") + " rotate(-8)");
    // balcony railing in front of him
    const rail = RV.g(porch);
    RV.rect(rail, 1140, 1000, 980, 24, "#4a3346");
    for (let i = 0; i < 16; i++) RV.rect(rail, 1150 + i * 62, 1024, 26, 70, "#4a3346");
    RV.rect(rail, 1140, 1086, 980, 20, "#38263a");
    const railSnow = RV.path(rail, "M 1136 1002 C 1300 984 1700 986 2124 998 L 2124 1008 L 1136 1010 Z", "#f4f6ff", { opacity: 0 });
    tl.fromTo(railSnow, { opacity: 0 }, { opacity: 1, duration: 2, ease: "sine.inOut", immediateRender: true }, COVER0 + 0.8);
    tl.fromTo(hd.eye, { scaleY: 1 }, { scaleY: 0.1, svgOrigin: "80 -212", duration: 0.09, yoyo: true, repeat: 1, immediateRender: false }, FIRST + 1.6);
    tl.fromTo(hd.pupil, { scaleY: 1 }, { scaleY: 0.1, svgOrigin: "84 -214", duration: 0.09, yoyo: true, repeat: 1, immediateRender: false }, FIRST + 1.6);

    // the first snowflake, glinting as it falls past his face
    const flake = RV.g(fx, { opacity: 0 });
    const fl = RV.g(flake);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      RV.path(fl, `M 0 0 L ${Math.cos(a) * 22} ${Math.sin(a) * 22} M ${Math.cos(a) * 12} ${Math.sin(a) * 12} L ${Math.cos(a + 0.5) * 18} ${Math.sin(a + 0.5) * 18} M ${Math.cos(a) * 12} ${Math.sin(a) * 12} L ${Math.cos(a - 0.5) * 18} ${Math.sin(a - 0.5) * 18}`, "none", { stroke: "#ffffff", "stroke-width": 3, "stroke-linecap": "round" });
    }
    RV.circle(fl, 0, 0, 36, RV.radial(S.fxDefs, [[0, "#ffffff", 0.7], [1, "#ffffff", 0]]));
    const fp = { u: 0 };
    tl.fromTo(fp, { u: 0 }, {
      u: 1, duration: 3.2, ease: "none", immediateRender: false,
      onUpdate: () => {
        const u = fp.u;
        const x = 1290 + Math.sin(u * 5.2) * 60 - u * 120, y = 120 + u * 760;
        flake.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(u * 160).toFixed(1)})`);
        flake.setAttribute("opacity", Math.min(1, u * 6, (1 - u) * 4).toFixed(2));
      },
    }, FIRST - 0.4);

    // snowfall: far layer behind the porch, near layer in front
    RV.snowfall(world, tl, { count: 170, t0: FIRST + 0.5, t1: Z, seed: 12, size: [1.5, 4], speed: [40, 80], fadeIn: 2.5, sway: 22 });
    RV.snowfall(fx, tl, { count: 70, t0: FIRST + 1.2, t1: Z, seed: 13, size: [3.5, 8], speed: [90, 150], fadeIn: 2.5, sway: 40 });
    // the light cools to snow-blue and brightens
    const lift = RV.rect(cam, -400, -400, 2720, 1900, "#dfe6ff", { opacity: 0 });
    tl.fromTo(lift, { opacity: 0 }, { opacity: 0.12, duration: COVER1 - COVER0, ease: "sine.inOut", immediateRender: false }, COVER0);

    // camera: mid shot, push in on his face as the flake falls, then pull back over the white village
    tl.fromTo(cam, { scale: 1.0, x: 0, y: 0, svgOrigin: "1480 600" }, { scale: 1.32, x: -40, y: 40, svgOrigin: "1480 600", duration: 2.4, ease: "power2.inOut", immediateRender: true }, FIRST - 0.6);
    tl.fromTo(cam, { scale: 1.32, x: -40, y: 40, svgOrigin: "1480 600" }, { scale: 0.86, x: -120, y: -20, svgOrigin: "1480 600", duration: Z - FIRST - 2.0, ease: "power2.inOut", immediateRender: false }, FIRST + 2.0);
    tl.fromTo(porch, { x: 0 }, { x: 260, duration: Z - FIRST - 2.6, ease: "power2.inOut", immediateRender: false }, FIRST + 2.6);
    RV.fadeIn(tl, frame, A, 1.0);
  };
})();
