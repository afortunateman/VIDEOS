// Shared bar grid. The score (music/compose.py) runs at 100 BPM in 4/4, so a bar is 2.4 s.
// Every scene boundary sits on a bar line; transitions start 0.8 s early and the outgoing
// scene lingers 0.6 s so the two overlap while the wipe plays.
(function () {
  const RV = (window.RV = window.RV || {});
  RV.BEAT = 0.6;
  RV.BAR = 2.4;
  RV.TOTAL = 118;
  RV.b = (bar, beat = 0) => +((bar * 4 + beat) * RV.BEAT).toFixed(4);

  // [id, first bar, last bar (exclusive)]
  RV.SCENES = [
    ["title", 0, 3],
    ["holland", 3, 6],
    ["war", 6, 10],
    ["voyage", 10, 14],
    ["arrival", 14, 18],
    ["markets", 18, 21],
    ["swiss", 21, 25],
    ["build", 25, 29],
    ["money", 29, 32],
    ["rules", 32, 35],
    ["complete", 35, 38],
    ["rare", 38, 41],
    ["snow", 41, 45],
    ["end", 45, 48],
  ];
  RV.LEAD = 0.8;
  RV.TAIL = 0.6;
  RV.sceneWindow = (id) => {
    const i = RV.SCENES.findIndex((s) => s[0] === id);
    const [, s, e] = RV.SCENES[i];
    const t0 = RV.b(s), t1 = RV.b(e);
    const start = i === 0 ? 0 : +(t0 - RV.LEAD).toFixed(4);
    const end = i === RV.SCENES.length - 1 ? RV.TOTAL : +(t1 + RV.TAIL).toFixed(4);
    return { t0, t1, start, end, dur: +(end - start).toFixed(4) };
  };
})();
