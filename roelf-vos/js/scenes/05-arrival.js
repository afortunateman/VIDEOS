// 5 · Arrival in Tasmania with one suitcase, odd jobs, and the little grocery store.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).arrival = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const JOBS = RV.b(16), SHOP = RV.b(17);

    // ================= A: the dock =================
    const dock = RV.g(cam);
    RV.rect(dock, -200, -200, 2320, 1500, RV.linear(defs, [[0, "#86bfcf"], [0.45, "#bfdcd6"], [0.62, "#f5e3bf"]]));
    RV.circle(dock, 420, 520, 420, RV.radial(defs, [[0, "#fff7e2", 0.9], [1, "#fff7e2", 0]]));
    RV.circle(dock, 420, 520, 74, "#fffaf0");
    const dc = RV.g(dock);
    RV.cloud(dc, 1450, 200, 420, { fill: "#fbfcf8", shade: "#cfe1df", seed: 12, lumps: 4 });
    RV.cloud(dc, 700, 150, 300, { fill: "#fbfcf8", shade: "#cfe1df", seed: 13, lumps: 3 });
    RV.streak(dc, 900, 360, 900, 22, "#ffffff", 0.6);
    tl.fromTo(dc, { x: -30 }, { x: 60, duration: SHOP - A, ease: "none" }, A);
    // kunanyi-like mountain behind the harbour
    const mt = RV.g(dock);
    RV.path(mt, "M 760 660 C 900 560 1000 430 1160 380 C 1260 350 1360 360 1440 400 C 1560 460 1700 560 1980 620 L 1980 700 L 760 700 Z", "#6f7fb0");
    RV.path(mt, "M 1160 380 C 1260 350 1360 360 1440 400 C 1380 420 1330 470 1300 540 C 1260 500 1220 450 1160 380 Z", "#8d9bc8");
    RV.path(mt, "M 1300 540 C 1330 470 1380 420 1440 400 C 1560 460 1700 560 1980 620 L 1980 700 L 1340 700 Z", "#5d6c9e");
    RV.path(dock, "M -100 690 C 200 650 420 670 700 640 C 980 610 1300 660 1600 640 C 1800 628 1900 640 2020 650 L 2020 720 L -100 720 Z", "#5f8f80");
    RV.path(dock, "M -100 700 C 300 680 700 690 1100 676 C 1500 664 1800 680 2020 690 L 2020 730 L -100 730 Z", "#4d7d70");
    // water
    RV.rect(dock, -200, 720, 2320, 200, RV.linear(defs, [[0, "#3d8f9a"], [1, "#2a6b7b"]]));
    const wl = RV.g(dock, { stroke: "#9fd3d0", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.7 });
    for (let i = 0; i < 22; i++) RV.path(wl, `M ${(i * 211) % 2000} ${738 + ((i * 37) % 60)} l ${30 + (i % 4) * 22} 0`);
    tl.fromTo(wl, { x: 0 }, { x: 50, duration: SHOP - A, ease: "sine.inOut" }, A);
    // the liner
    const ship = RV.g(dock);
    RV.path(ship, "M -400 560 L 700 560 C 760 560 800 600 820 660 L 800 790 L -400 790 Z", "#22304e");
    RV.path(ship, "M 700 560 C 760 560 800 600 820 660 L 800 790 L 700 790 Z", "#1a2540");
    RV.path(ship, "M -400 745 L 806 745 L 800 790 L -400 790 Z", "#b8323a");
    RV.rect(ship, -400, 556, 1100, 10, "#f2ece0");
    for (let i = 0; i < 26; i++) RV.circle(ship, -360 + i * 42, 620, 7, "#f5d68a", { opacity: 0.9 });
    for (let i = 0; i < 26; i++) RV.circle(ship, -340 + i * 42, 680, 6, "#0f1628", { opacity: 0.8 });
    RV.rect(ship, -300, 470, 880, 90, "#fbf8f0");
    RV.rect(ship, 360, 470, 220, 90, "#e7e0d2");
    for (let i = 0; i < 20; i++) RV.rect(ship, -280 + i * 42, 494, 24, 18, "#3a4b6e");
    RV.rect(ship, -220, 410, 660, 60, "#fbf8f0");
    RV.rect(ship, 300, 360, 140, 50, "#fbf8f0");
    for (let i = 0; i < 4; i++) RV.rect(ship, 312 + i * 32, 372, 20, 14, "#3a4b6e");
    [[-60, "#e8a33d"], [120, "#e8a33d"]].forEach(([fxx, c]) => {
      RV.path(ship, `M ${fxx - 50} 410 L ${fxx - 36} 250 L ${fxx + 44} 250 L ${fxx + 58} 410 Z`, c);
      RV.path(ship, `M ${fxx + 10} 410 L ${fxx + 18} 250 L ${fxx + 44} 250 L ${fxx + 58} 410 Z`, RV.shade(c, -0.15));
      RV.path(ship, `M ${fxx - 36} 250 L ${fxx + 44} 250 L ${fxx + 41} 284 L ${fxx - 38} 284 Z`, "#1d1d22");
    });
    for (let i = 0; i < 5; i++) RV.path(ship, `M ${-200 + i * 120} 470 C ${-200 + i * 120} 446 ${-130 + i * 120} 446 ${-130 + i * 120} 470 Z`, "#f08a3c");
    RV.path(ship, "M 520 360 L 520 180 M 520 190 L 800 560", "none", { stroke: "#2a2a33", "stroke-width": 4 });
    [["#ae1c28", 0], ["#ffffff", 1], ["#21468b", 2], ["#f2c14e", 3]].forEach(([c, i]) => RV.poly(ship, [[560 + i * 50, 240 + i * 62], [590 + i * 50, 250 + i * 62], [566 + i * 50, 270 + i * 62]], c));
    // smoke from the funnels
    const smoke = RV.g(dock, { opacity: 0.75 });
    for (let i = 0; i < 6; i++) RV.circle(smoke, 70 + i * 60, 220 - i * 40, 26 + i * 10, "#f1eee6", { opacity: (0.8 - i * 0.12).toFixed(2) });
    tl.fromTo(smoke, { x: 0, y: 0 }, { x: 80, y: -30, duration: SHOP - A, ease: "none" }, A);
    // dock planks
    RV.path(dock, "M -200 800 L 2120 800 L 2120 1180 L -200 1180 Z", "#9a6a46");
    RV.rect(dock, -200, 800, 2320, 22, "#b78456");
    const planks = RV.g(dock, { stroke: "#7a4f33", "stroke-width": 3 });
    for (let i = 0; i < 9; i++) RV.path(planks, `M -200 ${840 + i * 30 + i * i * 2} L 2120 ${840 + i * 30 + i * i * 2}`);
    for (let i = 0; i < 12; i++) RV.rect(dock, i * 190 - 40, 812, 26, 44, "#5c3a26", { rx: 4 });
    // gangway
    RV.poly(dock, [[640, 566], [680, 566], [1000, 820], [940, 820]], "#c9b79a");
    RV.path(dock, "M 640 540 L 940 794", "none", { stroke: "#5c3a26", "stroke-width": 4 });
    // crates & rope
    RV.rect(dock, 1640, 760, 120, 90, "#c08b56");
    RV.rect(dock, 1640, 760, 120, 10, "#8a5d36");
    RV.path(dock, "M 1640 760 L 1760 850 M 1760 760 L 1640 850", "none", { stroke: "#8a5d36", "stroke-width": 6 });
    RV.rect(dock, 1720, 690, 90, 70, "#d19a62");
    RV.ellipse(dock, 300, 880, 70, 22, "#c9a46a");
    RV.ellipse(dock, 300, 876, 46, 13, "#9a6a46");
    // the family: Roelf with the one suitcase, his wife, three children
    const fam = RV.g(dock);
    const kidsBob = [];
    const roelf = RV.person(fam, 1150, 990, { h: 300, coat: "#3b4670", coatDark: "#2a3356", hat: "fedora", bag: "#8a4b2c" });
    RV.person(fam, 1290, 990, { h: 282, coat: "#a8423a", coatDark: "#83312b", dress: true, hat: "scarf" });
    const kid = (x, h, o) => {
      const w = RV.g(fam);
      RV.person(w, x, 990, Object.assign({ h }, o));
      kidsBob.push(w);
    };
    kid(1400, 205, { coat: "#3f6b49", coatDark: "#2f553a", hair: "#6b4426", hat: "cap" });
    kid(1490, 178, { coat: "#d7a33f", coatDark: "#b3852d", dress: true, hair: "#8a5a2b" });
    kid(1565, 150, { coat: "#4f7fb3", coatDark: "#3b6592", hair: "#c9963f" });
    kidsBob.forEach((k, i) => tl.fromTo(k, { y: 0 }, { y: -10, duration: 0.3, ease: "sine.out", yoyo: true, repeat: 5, immediateRender: false }, T + 0.9 + i * 0.15));
    // seagulls
    const gulls = RV.g(dock);
    const gull = (x, y, s) => RV.path(gulls, `M ${x - 24 * s} ${y} C ${x - 14 * s} ${y - 12 * s} ${x - 6 * s} ${y - 10 * s} ${x} ${y} C ${x + 6 * s} ${y - 10 * s} ${x + 14 * s} ${y - 12 * s} ${x + 24 * s} ${y}`, "none", { stroke: "#ffffff", "stroke-width": 4 * s, "stroke-linecap": "round" });
    gull(900, 260, 1.2);
    gull(1020, 300, 0.9);
    gull(1700, 330, 1);
    tl.fromTo(gulls, { x: -60, y: 10 }, { x: 140, y: -30, duration: JOBS - A, ease: "none" }, A);
    tl.fromTo(dock, { scale: 1, svgOrigin: "1300 800" }, { scale: 1.12, svgOrigin: "1300 800", duration: JOBS - A + 0.2, ease: "sine.inOut" }, A);

    // ================= B: all sorts of jobs (three panels, one per beat) =================
    const jobs = RV.g(cam, { opacity: 0 });
    const panel = (i, bg, draw) => {
      const g = RV.g(jobs);
      const inner = RV.g(g);
      RV.rect(inner, i * 640, 0, 640, 1080, bg);
      draw(inner, i * 640 + 320);
      RV.rect(inner, i * 640 + 636, 0, 8, 1080, "#2a1815");
      tl.fromTo(g, { y: 1100 }, { y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, JOBS + i * RV.BEAT - 0.25);
      return g;
    };
    panel(0, "#ec8c4f", (g, cx) => {
      RV.circle(g, cx + 140, 300, 90, "#f9c46b");
      RV.path(g, `M ${cx - 320} 760 C ${cx - 100} 720 ${cx + 100} 740 ${cx + 320} 700 L ${cx + 320} 1080 L ${cx - 320} 1080 Z`, "#b5532f");
      RV.path(g, `M ${cx - 320} 820 C ${cx - 100} 790 ${cx + 100} 800 ${cx + 320} 780 L ${cx + 320} 1080 L ${cx - 320} 1080 Z`, "#8f3d24");
      const w = RV.person(g, cx - 40, 790, { h: 330, coat: "#2f3f6b", coatDark: "#24315a", hat: "cap" });
      RV.path(g, `M ${cx + 10} 600 L ${cx + 110} 800`, "none", { stroke: "#5c3a26", "stroke-width": 10, "stroke-linecap": "round" });
      RV.path(g, `M ${cx + 96} 790 L ${cx + 140} 812 L ${cx + 118} 846 L ${cx + 78} 822 Z`, "#9aa3ad");
      RV.ellipse(g, cx + 150, 830, 60, 18, "#6b2c18");
      return w;
    });
    panel(1, "#6aa152", (g, cx) => {
      RV.path(g, `M ${cx - 320} 820 L ${cx + 320} 820 L ${cx + 320} 1080 L ${cx - 320} 1080 Z`, "#4a7e3a");
      RV.rect(g, cx - 140, 520, 40, 300, "#6b4430");
      RV.ellipse(g, cx - 120, 420, 230, 170, "#3f7d3a");
      RV.ellipse(g, cx - 60, 450, 150, 110, "#356c31");
      const ar = RV.rng(4);
      for (let k = 0; k < 18; k++) RV.circle(g, cx - 300 + ar() * 360, 300 + ar() * 240, 13, "#d62839");
      RV.path(g, `M ${cx + 40} 820 L ${cx + 120} 380 M ${cx + 120} 820 L ${cx + 190} 390`, "none", { stroke: "#c08b56", "stroke-width": 10 });
      for (let k = 0; k < 8; k++) RV.path(g, `M ${cx + 48 + k * 9} ${780 - k * 52} L ${cx + 126 + k * 8.5} ${786 - k * 52}`, "none", { stroke: "#c08b56", "stroke-width": 8 });
      RV.person(g, cx + 140, 620, { h: 280, coat: "#7a3a2f", coatDark: "#5e2c24", hat: "fedora" });
      RV.rect(g, cx + 170, 780, 110, 60, "#a8743f");
      for (let k = 0; k < 5; k++) RV.circle(g, cx + 186 + k * 20, 776, 12, "#d62839");
    });
    panel(2, "#4a86ad", (g, cx) => {
      RV.path(g, `M ${cx - 320} 800 L ${cx + 320} 800 L ${cx + 320} 1080 L ${cx - 320} 1080 Z`, "#33627f");
      RV.rect(g, cx - 320, 860, 640, 14, "#e8e2d4", { opacity: 0.5 });
      const vanMove = RV.g(g);
      const van = RV.g(vanMove, { transform: `translate(${cx - 30} 790)` });
      RV.path(van, "M -200 -170 L 80 -170 L 80 0 L -200 0 Z", "#e9ddc4");
      RV.path(van, "M 80 -130 L 170 -130 L 220 -60 L 220 0 L 80 0 Z", "#c8463a");
      RV.path(van, "M 98 -116 L 160 -116 L 196 -66 L 98 -66 Z", "#bfe3f0");
      RV.circle(van, -120, 0, 42, "#1f1a1c");
      RV.circle(van, -120, 0, 16, "#9aa3ad");
      RV.circle(van, 150, 0, 42, "#1f1a1c");
      RV.circle(van, 150, 0, 16, "#9aa3ad");
      RV.rect(van, -170, -140, 220, 60, "#c8463a");
      RV.text(van, -60, -100, "DELIVERIES", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 4, fill: "#f6ead3" });
      const lines = RV.g(g, { stroke: "#e8f2f6", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.7 });
      for (let k = 0; k < 4; k++) RV.path(lines, `M ${cx - 300} ${640 + k * 40} l ${80 + (k % 2) * 60} 0`);
      tl.fromTo(vanMove, { x: -40 }, { x: 40, duration: 2.6, ease: "none" }, JOBS);
    });
    tl.set(jobs, { opacity: 1 }, JOBS - 0.26);
    tl.set(dock, { opacity: 0 }, JOBS + 2 * RV.BEAT + 0.3);

    // ================= C: the grocery store =================
    const shop = RV.g(cam, { opacity: 0 });
    RV.rect(shop, -200, -200, 2320, 1500, "#f1ddb8");
    RV.rect(shop, -200, -200, 2320, 340, "#e9cfa4");
    const brick = RV.g(shop, { stroke: "#d9b98a", "stroke-width": 3 });
    for (let r = 0; r < 12; r++) RV.path(brick, `M -200 ${150 + r * 60} L 2120 ${150 + r * 60}`);
    // sidewalk
    RV.rect(shop, -200, 930, 2320, 200, "#b9a58c");
    RV.rect(shop, -200, 930, 2320, 14, "#d8c7ad");
    // storefront
    const front = RV.g(shop, { transform: "translate(960 930)" });
    RV.rect(front, -620, -640, 1240, 640, "#2f5d46");
    RV.rect(front, -600, -470, 760, 440, "#cfe6e4");
    RV.rect(front, -600, -470, 760, 440, RV.linear(defs, [[0, "#ffffff", 0.35], [1, "#ffffff", 0]], 0, 0, 1, 1));
    // window display: shelves of produce
    const prod = RV.g(front);
    const pr = RV.rng(8);
    const fruit = ["#d62839", "#f28a33", "#9cc65a", "#f6c343", "#d62839", "#7fae3f"];
    for (let row = 0; row < 3; row++) {
      RV.rect(prod, -590, -300 + row * 120, 740, 12, "#8a5d36");
      for (let k = 0; k < 18; k++) {
        const c = fruit[(row * 3 + Math.floor(k / 3)) % fruit.length];
        RV.circle(prod, -575 + k * 40 + pr() * 6, -322 + row * 120, 16 + pr() * 4, c);
        RV.circle(prod, -580 + k * 40, -328 + row * 120, 4, "#ffffff", { opacity: 0.5 });
      }
    }
    RV.rect(prod, -560, -110, 180, 70, "#c08b56");
    RV.rect(prod, -360, -110, 180, 70, "#c08b56");
    RV.rect(prod, -160, -110, 180, 70, "#c08b56");
    for (let k = 0; k < 12; k++) RV.circle(prod, -540 + k * 46, -118, 20, fruit[k % 3 === 0 ? 0 : k % 3 === 1 ? 3 : 2]);
    // door
    RV.rect(front, 240, -470, 300, 470, "#244a37");
    RV.rect(front, 270, -440, 240, 260, "#cfe6e4");
    RV.rect(front, 270, -150, 240, 130, "#1d3c2d");
    RV.circle(front, 480, -160, 9, "#f2c14e");
    const openSign = RV.g(RV.g(front, { transform: "translate(390 -330)" }));
    RV.rect(openSign, -70, -26, 140, 52, "#f6ead3", { rx: 6 });
    RV.text(openSign, 0, 9, "OPEN", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 28, "letter-spacing": 6, fill: "#c8323a" });
    tl.fromTo(openSign, { scaleX: 0.05, svgOrigin: "0 0" }, { scaleX: 1, svgOrigin: "0 0", duration: 0.35, ease: "back.out(2)" }, SHOP + 0.4);
    // the shopkeeper in his apron
    const keeper = RV.g(front);
    RV.person(keeper, 390, -10, { h: 300, coat: "#f4f1ea", coatDark: "#d8d2c4", legs: "#2f3550", hat: null, hair: "#3a2418" });
    tl.fromTo(keeper, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, SHOP + 0.5);
    // sign board with his name written in gold
    RV.rect(front, -560, -620, 1120, 130, "#1f3f2f");
    RV.rect(front, -548, -608, 1096, 106, "none", { stroke: "#d9b45a", "stroke-width": 3 });
    const name = RV.script(front, "Vos", { x: -100, y: -530, size: 150, color: "#f2cf73", width: 5, align: "center" });
    RV.text(front, 230, -548, "GROCER", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 34, "letter-spacing": 14, fill: "#f2cf73" });
    RV.text(front, 230, -515, "EST. TASMANIA", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 400, "font-size": 18, "letter-spacing": 8, fill: "#d9c39a" });
    RV.drawOn(tl, name, SHOP + 0.15, 1.0);
    // striped awning unrolls on the shop-bell downbeat
    const awn = RV.g(front);
    const aw = RV.g(awn);
    for (let k = 0; k < 16; k++) {
      const x0 = -640 + k * 80;
      RV.poly(aw, [[x0, -490], [x0 + 80, -490], [x0 + 92, -380], [x0 + 12, -380]], k % 2 ? "#f6ead3" : "#c8323a");
      RV.path(aw, `M ${x0 + 12} -380 Q ${x0 + 52} -340 ${x0 + 92} -380 Z`, k % 2 ? "#f6ead3" : "#c8323a");
    }
    RV.rect(aw, -650, -500, 1300, 16, "#8f1f28");
    tl.fromTo(aw, { scaleY: 0.02, svgOrigin: "0 -490" }, { scaleY: 1, svgOrigin: "0 -490", duration: 0.5, ease: "back.out(1.6)" }, SHOP);
    // potted flowers and crates on the pavement
    RV.rect(shop, 220, 860, 120, 80, "#c08b56");
    for (let k = 0; k < 6; k++) RV.circle(shop, 236 + k * 18, 852, 16, "#f6c343");
    RV.rect(shop, 1590, 860, 120, 80, "#c08b56");
    for (let k = 0; k < 6; k++) RV.circle(shop, 1606 + k * 18, 852, 16, "#d62839");
    // sparkle when the bell rings
    const spark = RV.g(shop, { opacity: 0 });
    RV.path(spark, "M 1350 480 L 1358 512 L 1390 520 L 1358 528 L 1350 560 L 1342 528 L 1310 520 L 1342 512 Z", "#fff6d8");
    tl.fromTo(spark, { opacity: 0, scale: 0.3, svgOrigin: "1350 520" }, { opacity: 1, scale: 1.2, svgOrigin: "1350 520", duration: 0.25, ease: "power2.out" }, SHOP);
    tl.fromTo(spark, { opacity: 1 }, { opacity: 0, duration: 0.5, immediateRender: false }, SHOP + 0.25);
    tl.fromTo(shop, { scale: 1.06, svgOrigin: "960 600" }, { scale: 1.0, svgOrigin: "960 600", duration: Z - SHOP, ease: "power2.out" }, SHOP);
    // panels part like curtains to reveal the shop
    tl.set(shop, { opacity: 1 }, SHOP - 0.3);
    tl.fromTo(jobs, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, SHOP - 0.3);

    // entrance: iris out of the globe's Tasmania
    RV.iris(tl, frame, 960, 560, A, 1.3, "power2.in");
  };
})();
