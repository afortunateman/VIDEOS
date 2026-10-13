// Parse EMS / Hershey single-stroke SVG fonts and lay out text as smoothed SVG path data.
import fs from "node:fs";
export function loadFont(file) {
  const src = fs.readFileSync(file, "utf8");
  const defAdv = +(/<font[^>]*horiz-adv-x="([^"]+)"/.exec(src) || [0, 500])[1];
  const glyphs = {};
  const re = /<glyph\s+([^>]*?)\/>/g;
  let m;
  while ((m = re.exec(src))) {
    const a = m[1];
    const uni = /unicode="([^"]*)"/.exec(a);
    if (!uni) continue;
    let u = uni[1]
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    const adv = +((/horiz-adv-x="([^"]+)"/.exec(a) || [0, defAdv])[1]);
    const d = (/\sd="([^"]*)"/.exec(" " + a) || [0, ""])[1];
    glyphs[u] = { adv, strokes: parseStrokes(d) };
  }
  return { glyphs, defAdv };
}
function parseStrokes(d) {
  const strokes = [];
  let cur = null;
  const toks = d.match(/[ML]|-?[\d.]+(?:e-?\d+)?/g) || [];
  let cmd = null;
  for (let i = 0; i < toks.length; ) {
    const t = toks[i];
    if (t === "M" || t === "L") { cmd = t; i++; continue; }
    const x = +toks[i], y = +toks[i + 1]; i += 2;
    if (cmd === "M") { cur = [[x, y]]; strokes.push(cur); cmd = "L"; }
    else cur.push([x, y]);
  }
  return strokes;
}
// Catmull-Rom smoothing to cubic beziers.
function smooth(pts, tension = 0.5) {
  if (pts.length < 3) return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
  let s = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const k = tension / 3;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    s += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return s;
}
// Returns { strokes: [pathData...], width } in font units scaled by size/1000, y down, baseline at 0.
export function layout(font, text, { size = 100, tracking = 0, smoothing = true } = {}) {
  const sc = size / 1000;
  let x = 0;
  const out = [];
  for (const ch of text) {
    const g = font.glyphs[ch] || { adv: font.defAdv, strokes: [] };
    for (const st of g.strokes) {
      const pts = st.map(([px, py]) => [(x + px) * sc, -py * sc]);
      out.push(smoothing ? smooth(pts) : "M" + pts.map((p) => p.join(" ")).join(" L"));
    }
    x += g.adv + tracking;
  }
  return { strokes: out, width: (x - tracking) * sc };
}
