// 4 · 1951, the voyage — a crimson globe turns from Europe to Tasmania while a little liner sails the route.
(function () {
  const RV = window.RV;
  (RV.scene = RV.scene || {}).voyage = function (tl, S) {
    const { defs, cam, win, frame, fx } = S;
    const T = win.t0, A = win.start, Z = win.end;
    const CX = 960, CY = 560, R = 430;

    RV.rect(cam, -200, -200, 2320, 1500, RV.radial(defs, [[0, "#4a1520"], [0.6, "#2a0e17"], [1, "#1a0910"]], 0.5, 0.52, 0.75));
    const stars = RV.g(cam);
    const sr = RV.rng(51);
    for (let i = 0; i < 120; i++) RV.circle(stars, sr() * 1920, sr() * 1080, 0.7 + sr() * 1.8, "#f8e6cf", { opacity: (0.15 + sr() * 0.55).toFixed(2) });
    tl.fromTo(stars, { x: 0 }, { x: -60, duration: Z - A, ease: "none" }, A);
    RV.circle(cam, CX, CY, R * 1.55, RV.radial(defs, [[0.55, "#c2303a", 0.35], [1, "#c2303a", 0]]));

    // globe group (scaled for the final zoom)
    const globe = RV.g(cam);
    const ocean = RV.radial(defs, [[0, "#e04844"], [0.55, "#bd2a33"], [1, "#7e1622"]], 0.38, 0.34, 0.75);
    const oceanC = RV.circle(globe, CX, CY, R, ocean);
    const grat = RV.path(globe, "", "none", { stroke: "#ffb08c", "stroke-width": 1.2, opacity: 0.16 });
    const land = RV.path(globe, "", "#7c1120");
    const landEdge = RV.path(globe, "", "none", { stroke: "#ef6a5c", "stroke-width": 1.6, opacity: 0.55 });
    const routeAll = RV.path(globe, "", "none", { stroke: "#f6d27a", "stroke-width": 3, "stroke-dasharray": "2 12", "stroke-linecap": "round", opacity: 0.35 });
    const routeDone = RV.path(globe, "", "none", { stroke: "#f6d27a", "stroke-width": 5, "stroke-dasharray": "3 11", "stroke-linecap": "round" });
    const shadeG = RV.radial(defs, [[0, "#000", 0], [0.62, "#000", 0], [1, "#1a0508", 0.55]], 0.38, 0.34, 0.72);
    const shadeC = RV.circle(globe, CX, CY, R, shadeG);
    const rimC = RV.circle(globe, CX, CY, R + 4, "none", { stroke: "#ff9d86", "stroke-width": 6, opacity: 0.3 });

    // markers and labels
    const mkNL = RV.g(globe);
    RV.circle(mkNL, 0, 0, 9, "#f6d27a");
    RV.circle(mkNL, 0, 0, 18, "none", { stroke: "#f6d27a", "stroke-width": 2, opacity: 0.6 });
    RV.text(mkNL, -22, -26, "THE NETHERLANDS", { "text-anchor": "end", "font-family": "Josefin Sans", "font-weight": 600, "font-size": 24, "letter-spacing": 6, fill: "#f6d27a" });
    const mkTAS = RV.g(globe);
    RV.circle(mkTAS, 0, 0, 9, "#f6d27a");
    RV.circle(mkTAS, 0, 0, 18, "none", { stroke: "#f6d27a", "stroke-width": 2, opacity: 0.6 });
    RV.text(mkTAS, 30, 52, "TASMANIA", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 7, fill: "#f6d27a" });

    // the liner, with a family of five on the stern deck
    const shipPos = RV.g(globe);
    const ship = RV.g(shipPos);
    const shipArt = RV.g(ship);
    RV.path(shipArt, "M -60 0 L 62 0 L 52 15 L -54 15 Z", "#f8ecd6");
    RV.path(shipArt, "M -54 15 L 52 15 L 48 20 L -50 20 Z", "#3a1118");
    RV.rect(shipArt, -34, -13, 64, 13, "#fffaf0");
    RV.rect(shipArt, -22, -24, 40, 11, "#fffaf0");
    for (let i = 0; i < 7; i++) RV.rect(shipArt, -30 + i * 9, -9, 4, 4, "#7c1120");
    RV.rect(shipArt, -2, -40, 13, 16, "#f2c14e");
    RV.rect(shipArt, -2, -40, 13, 4, "#2a1418");
    const family = RV.g(shipArt);
    [[-54, 15, "#2f3a6b"], [-47, 14, "#c8463a"], [-41, 10, "#3a5f3a"], [-36, 8.5, "#d9a441"], [-31.5, 7, "#4a6ea8"]].forEach(([fx2, h, c]) => {
      RV.rect(family, fx2 - 1.8, -h + 3, 3.6, h - 3, c, { rx: 1.2 });
      RV.circle(family, fx2, -h + 1.5, 2, "#f0c7a0");
    });
    const wake = RV.g(globe);
    const wakeDots = [];
    for (let i = 0; i < 10; i++) wakeDots.push(RV.circle(wake, 0, 0, 4 - i * 0.3, "#fff2de", { opacity: (0.7 - i * 0.065).toFixed(2) }));

    // little clouds drifting over the globe
    const clouds = RV.g(globe);
    RV.cloud(clouds, 1240, 360, 150, { fill: "#fff3ea", shade: "#f2c4b4", seed: 2, lumps: 3, h: 46 });
    RV.cloud(clouds, 1260, 760, 190, { fill: "#fff3ea", shade: "#f2c4b4", seed: 4, lumps: 3, h: 52 });
    RV.cloud(clouds, 700, 820, 130, { fill: "#fff3ea", shade: "#f2c4b4", seed: 7, lumps: 3, h: 40 });
    tl.fromTo(clouds, { x: -80 }, { x: 120, duration: Z - A, ease: "none" }, A);

    // route through Suez to Tasmania
    const wp = [[4.4, 51.9], [2, 51.1], [-4.5, 49], [-9.8, 43.5], [-9.6, 38.5], [-6, 35.9], [2, 37.2], [11, 37.6], [20, 34.5], [32.3, 31.4], [32.6, 29.8], [34.6, 27.4], [38.6, 21], [43.4, 12.7], [51, 12.2], [65, 8.5], [80, 5.6], [95, -6], [106, -20], [114.5, -35.2], [125, -36.6], [136, -37.5], [142, -39.6], [146.2, -40.7], [146.85, -41.1]];
    const route = [];
    for (let i = 0; i < wp.length - 1; i++) {
      const it = d3.geoInterpolate(wp[i], wp[i + 1]);
      for (let k = 0; k < 24; k++) route.push(it(k / 24));
    }
    route.push(wp[wp.length - 1]);
    const cum = [0];
    for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + d3.geoDistance(route[i - 1], route[i]));
    const total = cum[cum.length - 1];
    const at = (p) => {
      const d = p * total;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const f = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
      return { i, pt: d3.geoInterpolate(route[i - 1], route[i])(Math.max(0, Math.min(1, f))) };
    };

    const proj = d3.geoOrthographic().translate([CX, CY]).clipAngle(90).precision(0.6);
    const gp = d3.geoPath(proj);
    const grid = d3.geoGraticule10();
    const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clamp = (x) => Math.max(0, Math.min(1, x));
    const P0 = T + 0.3, P1 = RV.b(13, 1); // sailing window
    const ZOOM0 = RV.b(13, 0.5);
    const visible = (ll, rot) => d3.geoDistance(ll, [-rot[0], -rot[1]]) < Math.PI / 2 - 0.04;

    const st = { t: 0 };
    const update = () => {
      const now = A + st.t;
      const p = ease(clamp((now - P0) / (P1 - P0)));
      const zoomK = ease(clamp((now - ZOOM0) / (Z - ZOOM0)));
      const cLon = RV.lerp(8, 146.5, ease(clamp((now - P0 + 0.6) / (P1 - P0 + 0.4))));
      const cLat = RV.lerp(36, -41.5, ease(clamp((now - P0 + 0.6) / (P1 - P0 + 0.4))));
      const rot = [-cLon, -cLat];
      const rr = R * (1 + zoomK * 5.5);
      proj.rotate(rot).scale(rr);
      oceanC.setAttribute("r", rr.toFixed(1));
      shadeC.setAttribute("r", rr.toFixed(1));
      rimC.setAttribute("r", (rr + 4).toFixed(1));
      land.setAttribute("d", gp(window.WORLD_LAND) || "");
      landEdge.setAttribute("d", land.getAttribute("d"));
      grat.setAttribute("d", gp(grid) || "");
      routeAll.setAttribute("d", gp({ type: "LineString", coordinates: route }) || "");
      const cur = at(p);
      const done = route.slice(0, cur.i).concat([cur.pt]);
      routeDone.setAttribute("d", done.length > 1 ? gp({ type: "LineString", coordinates: done }) || "" : "");
      const sp = proj(cur.pt);
      const ahead = proj(at(Math.min(1, p + 0.01)).pt);
      const dir = ahead[0] - sp[0] < -0.5 ? -1 : 1;
      const big = 1 + 1.2 * ease(clamp((now - RV.b(12, 0)) / 0.7)) - 1.2 * ease(clamp((now - RV.b(12, 3)) / 0.8)) - 0.3 * zoomK;
      shipPos.setAttribute("transform", `translate(${sp[0].toFixed(1)} ${(sp[1] - 6).toFixed(1)})`);
      ship.setAttribute("transform", `scale(${(dir * big).toFixed(3)} ${big.toFixed(3)})`);
      ship.setAttribute("opacity", visible(cur.pt, rot) ? 1 : 0);
      wakeDots.forEach((w, k) => {
        const q = proj(at(Math.max(0, p - 0.004 * (k + 1))).pt);
        w.setAttribute("cx", q[0].toFixed(1));
        w.setAttribute("cy", (q[1] + 8).toFixed(1));
        w.setAttribute("opacity", p > 0.01 ? (0.7 - k * 0.065).toFixed(2) : 0);
      });
      const nl = proj([4.9, 52.4]), ta = proj([146.6, -41.9]);
      mkNL.setAttribute("transform", `translate(${nl[0].toFixed(1)} ${nl[1].toFixed(1)})`);
      mkNL.setAttribute("opacity", visible([4.9, 52.4], rot) ? clamp((now - T - 0.2) / 0.5) * (1 - clamp((p - 0.14) / 0.08)) : 0);
      mkTAS.setAttribute("transform", `translate(${ta[0].toFixed(1)} ${ta[1].toFixed(1)})`);
      mkTAS.setAttribute("opacity", visible([146.6, -41.9], rot) ? clamp((p - 0.82) / 0.1) * (1 - zoomK) : 0);
    };
    update();
    tl.fromTo(st, { t: 0 }, { t: Z - A, duration: Z - A, ease: "none", onUpdate: update }, A);

    // year in gold script
    const yr = RV.script(fx, "1951", { x: 150, y: 290, size: 230, color: "#f2cf73", width: 5.5 });
    const lbl = RV.text(fx, 160, 120, "THE VOYAGE", { "font-family": "Josefin Sans", "font-weight": 600, "font-size": 26, "letter-spacing": 10, fill: "#f6ead3" });
    tl.fromTo(lbl, { opacity: 0, x: -16 }, { opacity: 0.9, x: 0, duration: 0.8, ease: "power2.out" }, T + 0.2);
    RV.drawOn(tl, yr, T + 0.35, 1.5);
    tl.fromTo([yr.g, lbl], { opacity: 1 }, { opacity: 0, duration: 0.6, immediateRender: false }, RV.b(13, 0));

    // entrance: an iris opening first to the globe's edge, then to the full sky
    tl.fromTo(frame, { clipPath: `circle(0px at ${CX}px ${CY}px)` }, { clipPath: `circle(${R + 6}px at ${CX}px ${CY}px)`, duration: 0.7, ease: "power3.out", immediateRender: true }, A);
    tl.fromTo(frame, { clipPath: `circle(${R + 6}px at ${CX}px ${CY}px)` }, { clipPath: `circle(1400px at ${CX}px ${CY}px)`, duration: 0.9, ease: "power2.inOut", immediateRender: false }, A + 0.75);
    tl.set(frame, { clipPath: "none" }, A + 1.7);
    const ring = RV.circle(fx, CX, CY, 0, "none", { stroke: "#f2cf73", "stroke-width": 5 });
    tl.fromTo(ring, { attr: { r: 0 }, opacity: 1 }, { attr: { r: R + 6 }, duration: 0.7, ease: "power3.out", immediateRender: true }, A);
    tl.fromTo(ring, { attr: { r: R + 6 }, opacity: 1 }, { attr: { r: 1400 }, opacity: 0, duration: 0.9, ease: "power2.inOut", immediateRender: false }, A + 0.75);
  };
})();
