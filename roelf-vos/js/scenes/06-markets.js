// 6 · From one grocery to thirteen supermarkets — pins pop across Tasmania on the eighth notes.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).markets = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const TAS = window.TASMANIA;
    const s = 1.1, ox = 290, oy = -95;
    const P = (pt) => [ox + pt[0] * s, oy + pt[1] * s];

    RV.rect(cam, -400, -400, 2720, 1880, RV.radial(defs, [[0, "#3f7fa8"], [0.7, "#2a5d84"], [1, "#1f4766"]], 0.45, 0.5, 0.8));
    const waves = RV.g(cam, { stroke: "#5f9cc2", "stroke-width": 3, fill: "none", "stroke-linecap": "round", opacity: 0.45 });
    const wr = RV.rng(66);
    for (let i = 0; i < 40; i++) {
      const x = wr() * 2100 - 100, y = wr() * 1100;
      RV.path(waves, `M ${x} ${y} q 14 -10 28 0 q 14 10 28 0`);
    }
    tl.fromTo(waves, { x: 0 }, { x: -40, duration: Z - A, ease: "sine.inOut" }, A);

    // the island: drop shadow, body, inner shade, highlands
    const map = RV.g(cam, { transform: `translate(${ox} ${oy}) scale(${s})` });
    RV.path(map, TAS.main, "#1c4562", { transform: "translate(10 12)", opacity: 0.8 });
    RV.path(map, TAS.isles, "#1c4562", { transform: "translate(10 12)", opacity: 0.8 });
    RV.path(map, TAS.main, "#93c65c");
    RV.path(map, TAS.isles, "#93c65c");
    RV.path(map, TAS.main, "none", { stroke: "#dff1b8", "stroke-width": 3, opacity: 0.9 });
    RV.path(map, TAS.isles, "none", { stroke: "#dff1b8", "stroke-width": 2.5, opacity: 0.9 });
    const hl = RV.g(map);
    const mr = RV.rng(3);
    for (let i = 0; i < 26; i++) {
      const x = 390 + mr() * 260, y = 470 + mr() * 220;
      const h = 22 + mr() * 30;
      RV.poly(hl, [[x - h * 0.7, y], [x, y - h], [x + h * 0.7, y]], "#76a84a");
      RV.poly(hl, [[x, y - h], [x + h * 0.7, y], [x + h * 0.1, y]], "#5f9140");
    }
    const tr = RV.rng(9);
    for (let i = 0; i < 40; i++) {
      const x = 360 + tr() * 480, y = 380 + tr() * 420;
      RV.circle(hl, x, y, 6 + tr() * 6, tr() < 0.5 ? "#6fa448" : "#5e9640", { opacity: 0.8 });
    }

    // thirteen stores, popping up on the eighth notes (the 13th lands on the downbeat of bar 20)
    const order = ["launceston", "devonport", "hobart", "burnie", "scottsdale", "stHelens", "deloraine", "newNorfolk", "smithton", "georgeTown", "swansea", "campbellTown", "queenstown"];
    const times = order.map((_, k) => (k < 12 ? RV.b(18, k * 0.5) : RV.b(20)));
    const pins = RV.g(cam);
    order.forEach((town, k) => {
      const [x, y] = P(TAS.towns[town]);
      const g = RV.g(pins);
      const icon = RV.g(g);
      RV.ellipse(icon, x, y + 2, 22, 7, "#1c4562", { opacity: 0.45 });
      RV.path(icon, `M ${x} ${y} L ${x - 10} ${y - 26} L ${x + 10} ${y - 26} Z`, "#f6ead3");
      RV.rect(icon, x - 32, y - 82, 64, 56, "#f8f1e2", { rx: 4 });
      RV.rect(icon, x - 32, y - 52, 64, 26, "#e9dcc4");
      RV.poly(icon, [[x - 38, y - 82], [x + 38, y - 82], [x + 32, y - 96], [x - 32, y - 96]], "#2f5d46");
      for (let j = 0; j < 4; j++) {
        RV.poly(icon, [[x - 34 + j * 17, y - 82], [x - 17 + j * 17, y - 82], [x - 15 + j * 17, y - 66], [x - 32 + j * 17, y - 66]], j % 2 ? "#f6ead3" : "#c8323a");
      }
      RV.rect(icon, x - 24, y - 60, 22, 24, "#9fd0d6");
      RV.rect(icon, x + 6, y - 60, 16, 34, "#2f5d46");
      const ring = RV.circle(g, x, y - 50, 10, "none", { stroke: "#f6d27a", "stroke-width": 4, opacity: 0 });
      const t0 = times[k];
      tl.fromTo(icon, { scale: 0, svgOrigin: `${x} ${y}` }, { scale: k === 12 ? 1.05 : 0.85, svgOrigin: `${x} ${y}`, duration: 0.45, ease: "back.out(2.6)", immediateRender: true }, t0);
      tl.fromTo(ring, { attr: { r: 10 }, opacity: 0.9 }, { attr: { r: 70 }, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, t0);
      if (k === 0) {
        const lab = RV.text(g, x + 44, y - 40, "LAUNCESTON", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 22, "letter-spacing": 5, fill: "#ffffff" });
        tl.fromTo(lab, { opacity: 0 }, { opacity: 1, duration: 0.4 }, t0 + 0.1);
        tl.fromTo(lab, { opacity: 1 }, { opacity: 0, duration: 0.4, immediateRender: false }, t0 + 1.6);
      }
    });

    // counter
    const cnt = RV.g(fx);
    const num = RV.text(cnt, 1560, 450, "1", { "text-anchor": "middle", "font-family": "Cormorant Garamond", "font-weight": 600, "font-size": 300, fill: "#f2cf73", style: "font-variant-numeric: lining-nums; font-feature-settings: 'lnum' 1" });
    RV.text(cnt, 1560, 560, "SUPERMARKETS", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 30, "letter-spacing": 11, fill: "#f6ead3" });
    const ul = RV.rect(cnt, 1420, 588, 280, 4, "#f2cf73");
    tl.fromTo(cnt, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, T - 0.1);
    const ct = { t: 0 };
    let shown = -1;
    tl.fromTo(ct, { t: 0 }, {
      t: Z - A, duration: Z - A, ease: "none",
      onUpdate: () => {
        const now = A + ct.t;
        let n = 0;
        for (const tt of times) if (now >= tt - 0.001) n++;
        n = Math.max(1, n);
        if (n !== shown) {
          num.textContent = String(n);
          shown = n;
        }
      },
    }, A);
    tl.fromTo(num, { scale: 1, svgOrigin: "1560 380" }, { scale: 1.25, svgOrigin: "1560 380", duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, RV.b(20));
    // burst of rays + falling coins on the thirteenth
    const burst = RV.g(fx, { opacity: 0 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      RV.path(burst, `M ${1560 + Math.cos(a) * 190} ${380 + Math.sin(a) * 190} L ${1560 + Math.cos(a) * 260} ${380 + Math.sin(a) * 260}`, "none", { stroke: "#f6d27a", "stroke-width": 6, "stroke-linecap": "round" });
    }
    tl.fromTo(burst, { opacity: 1, scale: 0.7, svgOrigin: "1560 380" }, { opacity: 0, scale: 1.35, svgOrigin: "1560 380", duration: 0.8, ease: "power2.out", immediateRender: false }, RV.b(20));
    const coins = RV.g(fx);
    const cr = RV.rng(13);
    for (let i = 0; i < 26; i++) {
      const c = RV.g(coins);
      const x = 1250 + cr() * 640;
      RV.ellipse(c, x, 0, 16, 16, "#f2c14e");
      RV.ellipse(c, x, 0, 10, 10, "none", { stroke: "#c9962e", "stroke-width": 3 });
      tl.fromTo(c, { y: -80 - cr() * 300, opacity: 1 }, { y: 1200, opacity: 1, duration: 1.4 + cr() * 0.8, ease: "power1.in", immediateRender: true }, RV.b(20) + cr() * 0.4);
    }
    tl.fromTo(ul, { scaleX: 0, svgOrigin: "1560 590" }, { scaleX: 1, svgOrigin: "1560 590", duration: 0.6, ease: "power2.out" }, T + 0.2);

    // map label
    const lab = RV.text(fx, 230, 960, "TASMANIA", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 30, "letter-spacing": 16, fill: "#dff1b8" });
    tl.fromTo(lab, { opacity: 0 }, { opacity: 0.85, duration: 0.6 }, T + 0.3);

    // camera: start tight on Launceston (where the shop is) and pull back to the whole island
    const [lx, ly] = P(TAS.towns.launceston);
    tl.fromTo(cam, { scale: 3.2, svgOrigin: `${lx} ${ly - 40}` }, { scale: 1, svgOrigin: `${lx} ${ly - 40}`, duration: 1.4, ease: "power3.inOut", immediateRender: true }, A + 0.1);
    tl.fromTo(cam, { x: 0 }, { x: -30, duration: Z - A - 1.5, ease: "sine.inOut", immediateRender: false }, A + 1.5);
    RV.fadeIn(tl, frame, A + 0.1, 0.5);
  };
})();
