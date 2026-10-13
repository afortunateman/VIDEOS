// 9 · And the money? 1982: thirteen supermarkets fold into one SOLD stamp, and the coins pour into the village.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).money = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const DING = RV.b(29, 3.5), ROW = RV.b(30), STAMP = RV.b(30, 2), POUR = RV.b(31);

    RV.rect(cam, -200, -200, 2320, 1500, RV.radial(defs, [[0, "#4a2a22"], [0.6, "#2e1915"], [1, "#1e100e"]], 0.5, 0.45, 0.8));
    const gl = RV.radial(defs, [[0, "#f3c96b", 0.22], [1, "#f3c96b", 0]]);
    const glow = RV.ellipse(cam, 960, 500, 700, 420, gl);
    tl.fromTo(glow, { scale: 0.8, svgOrigin: "960 500" }, { scale: 1.15, svgOrigin: "960 500", duration: Z - A, ease: "sine.inOut" }, A);
    RV.particles(cam, tl, { count: 36, t0: A, t1: Z, seed: 91, color: "#f2d38a", size: [1.2, 3], vy: [-22, -8], opacity: 0.5 });

    // a big gold question mark, written by hand
    const q = RV.g(cam);
    const qm = RV.script(q, "?", { x: 960, y: 720, size: 620, color: "#ecc766", width: 9, align: "center" });
    RV.drawOn(tl, qm, T + 0.05, 1.0);
    const coin = RV.g(q);
    const qx = 960 - 28, qy = 728;
    // find the dot of the question mark: the last stroke
    const coinC = RV.g(coin);
    RV.circle(coinC, 0, 0, 34, "#f2c14e");
    RV.circle(coinC, 0, 0, 24, "none", { stroke: "#c9962e", "stroke-width": 5 });
    RV.text(coinC, 0, 12, "$", { "text-anchor": "middle", "font-family": "Cormorant Garamond", "font-weight": 600, "font-size": 36, fill: "#a87a22" });
    const coinPos = RV.g(q, {});
    coinPos.appendChild(coin);
    tl.fromTo(coin, { x: qx, y: qy, scale: 0, opacity: 0 }, { x: qx, y: qy - 20, scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.4)", immediateRender: true }, DING);
    tl.fromTo(coinC, { scaleX: 1 }, { scaleX: -1, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, DING + 0.15);
    const qSpark = RV.path(q, `M ${qx} ${qy - 90} L ${qx + 8} ${qy - 28} L ${qx + 70} ${qy - 20} L ${qx + 8} ${qy - 12} L ${qx} ${qy + 50} L ${qx - 8} ${qy - 12} L ${qx - 70} ${qy - 20} L ${qx - 8} ${qy - 28} Z`, "#fff6d8", { opacity: 0 });
    tl.fromTo(qSpark, { opacity: 0 }, { opacity: 0.9, duration: 0.1 }, DING);
    tl.fromTo(qSpark, { opacity: 0.9 }, { opacity: 0, duration: 0.5, immediateRender: false }, DING + 0.1);
    tl.fromTo(q, { opacity: 1, scale: 1, svgOrigin: "960 520" }, { opacity: 0, scale: 0.6, svgOrigin: "960 520", duration: 0.35, ease: "power2.in", immediateRender: false }, ROW - 0.2);

    // thirteen stores
    const stores = RV.g(cam);
    const icons = [];
    for (let k = 0; k < 13; k++) {
      const row = k < 7 ? 0 : 1;
      const col = row ? k - 7 : k;
      const x = row ? 600 + col * 145 : 525 + col * 145, y = row ? 650 : 470;
      const g = RV.g(stores);
      const ic = RV.g(g);
      RV.rect(ic, x - 52, y - 70, 104, 90, "#f8f1e2", { rx: 6 });
      RV.rect(ic, x - 52, y - 20, 104, 40, "#e9dcc4");
      RV.poly(ic, [[x - 60, y - 70], [x + 60, y - 70], [x + 52, y - 92], [x - 52, y - 92]], "#2f5d46");
      for (let j = 0; j < 5; j++) RV.poly(ic, [[x - 56 + j * 22.4, y - 70], [x - 33.6 + j * 22.4, y - 70], [x - 31 + j * 22.4, y - 50], [x - 53 + j * 22.4, y - 50]], j % 2 ? "#f6ead3" : "#c8323a");
      RV.rect(ic, x - 40, y - 38, 34, 40, "#9fd0d6");
      RV.rect(ic, x + 10, y - 38, 28, 58, "#2f5d46");
      icons.push({ g, ic, x, y });
      tl.fromTo(ic, { scale: 0, svgOrigin: `${x} ${y}` }, { scale: 1, svgOrigin: `${x} ${y}`, duration: 0.35, ease: "back.out(2.2)", immediateRender: true }, ROW + k * 0.04);
      // gather into the middle
      tl.fromTo(g, { x: 0, y: 0, opacity: 1 }, { x: 960 - x, y: 560 - y, opacity: 0, duration: 0.45, ease: "power3.in", immediateRender: false }, STAMP - 0.5 + (k % 7) * 0.012);
    }
    const lbl13 = RV.text(cam, 960, 820, "THIRTEEN SUPERMARKETS", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 28, "letter-spacing": 12, fill: "#f6ead3" });
    tl.fromTo(lbl13, { opacity: 0 }, { opacity: 0.9, duration: 0.3 }, ROW + 0.3);
    tl.fromTo(lbl13, { opacity: 0.9 }, { opacity: 0, duration: 0.25, immediateRender: false }, STAMP - 0.35);

    // the SOLD stamp
    const stamp = RV.g(cam);
    const st = RV.g(stamp);
    RV.rect(st, 660, 400, 600, 300, "none", { stroke: "#d8443a", "stroke-width": 14, rx: 22 });
    RV.rect(st, 684, 424, 552, 252, "none", { stroke: "#d8443a", "stroke-width": 4, rx: 14 });
    RV.text(st, 960, 570, "SOLD", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 150, "letter-spacing": 22, fill: "#d8443a" });
    RV.text(st, 960, 646, "1982 · TO WOOLWORTHS", { "text-anchor": "middle", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 34, "letter-spacing": 7, fill: "#d8443a" });
    tl.fromTo(st, { scale: 2.6, rotation: -14, opacity: 0, svgOrigin: "960 550" }, { scale: 1, rotation: -7, opacity: 0.95, svgOrigin: "960 550", duration: 0.28, ease: "power4.in", immediateRender: true }, STAMP - 0.28);
    const shake = RV.g(fx);
    tl.fromTo(cam, { x: 0, y: 0 }, { x: 8, y: -6, duration: 0.05, yoyo: true, repeat: 3, ease: "none", immediateRender: false }, STAMP);
    // ink splatter ring
    const ring = RV.circle(shake, 960, 550, 60, "none", { stroke: "#d8443a", "stroke-width": 6, opacity: 0 });
    tl.fromTo(ring, { attr: { r: 200 }, opacity: 0.7 }, { attr: { r: 520 }, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, STAMP);

    // coins pour from the stamp into a little gold-line village on the right
    const village = RV.g(cam, { fill: "none", stroke: "#ecc766", "stroke-width": 4, "stroke-linejoin": "round" });
    const vlines = [];
    [[1450, 860, 1], [1600, 880, 1.25], [1760, 860, 1]].forEach(([x, y, s]) => {
      const p = RV.path(village, `M ${x - 70 * s} ${y} L ${x - 70 * s} ${y - 90 * s} L ${x - 90 * s} ${y - 86 * s} L ${x} ${y - 170 * s} L ${x + 90 * s} ${y - 86 * s} L ${x + 70 * s} ${y - 90 * s} L ${x + 70 * s} ${y} Z M ${x - 30 * s} ${y} L ${x - 30 * s} ${y - 40 * s} L ${x + 30 * s} ${y - 40 * s} L ${x + 30 * s} ${y}`);
      vlines.push(p);
      RV.drawPath(tl, p, 900 * s, POUR - 0.4 + vlines.length * 0.15, 0.8);
    });
    RV.drawPath(tl, RV.path(village, "M 1340 880 L 1880 880", "none"), 560, POUR - 0.5, 0.7);
    const vfill = RV.g(cam, { opacity: 0 });
    [[1450, 860, 1], [1600, 880, 1.25], [1760, 860, 1]].forEach(([x, y, s]) => {
      RV.chalet(vfill, x, y, { scale: 0.62 * s, storeys: 2 });
    });
    tl.fromTo(vfill, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "sine.inOut" }, POUR + 1.2);
    tl.fromTo(stamp, { x: 0, y: 0, scale: 1, svgOrigin: "960 550" }, { x: -380, y: -60, scale: 0.6, svgOrigin: "960 550", duration: 0.8, ease: "power2.inOut", immediateRender: false }, POUR - 0.6);
    const coins = RV.g(cam);
    const cr = RV.rng(19);
    for (let i = 0; i < 30; i++) {
      const c = RV.g(coins, { opacity: 0 });
      RV.circle(c, 0, 0, 15, "#f2c14e");
      RV.circle(c, 0, 0, 10, "none", { stroke: "#c9962e", "stroke-width": 3 });
      const t0 = POUR + i * 0.07;
      const tx = 1380 + cr() * 480, ty = 760 + cr() * 100, peak = 140 + cr() * 160;
      const pr = { u: 0 };
      tl.fromTo(pr, { u: 0 }, {
        u: 1, duration: 0.9, ease: "none", immediateRender: false,
        onUpdate: () => {
          const u = pr.u;
          const x = RV.lerp(600, tx, u), y = RV.lerp(520, ty, u) - Math.sin(u * Math.PI) * peak;
          c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
          c.setAttribute("opacity", u > 0.97 ? 0 : 1);
        },
      }, t0);
    }
    RV.wipe(tl, frame, A + 0.35, 0.8, -1);
  };
})();
