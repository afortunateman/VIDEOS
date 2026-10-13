// Build-time data generator. Writes the static data files the composition loads:
//   js/data/script-font.js  — EMS Allure single-stroke script glyphs (for drawn-on gold titles)
//   js/data/world.js        — Natural Earth land (110m) as GeoJSON for the voyage globe
//   js/data/tasmania.js     — Tasmania coastline (10m) pre-projected for the supermarket map
// Run from this folder after `npm install`: node build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as topojson from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import { loadFont } from "./hershey.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = (f) => path.join(here, "..", "js", "data", f);
const nm = (f) => path.join(here, "node_modules", f);

// 1. Script font
const font = loadFont(nm("hersheytext/svg_fonts/EMSAllure.svg"));
const glyphs = {};
for (const [ch, g] of Object.entries(font.glyphs)) {
  glyphs[ch] = [Math.round(g.adv), g.strokes.map((s) => s.flatMap(([x, y]) => [Math.round(x), Math.round(y)]))];
}
fs.writeFileSync(out("script-font.js"),
  "// EMS Allure (SIL OFL) single-stroke glyphs: char -> [advance, [flat x,y stroke arrays]] (y up, 1000/em)\n" +
  `window.SCRIPT_FONT = ${JSON.stringify({ adv: font.defAdv, glyphs })};\n`);

// 2. World land for the globe (rounded coordinates keep the file small)
const land = JSON.parse(fs.readFileSync(nm("world-atlas/land-110m.json"), "utf8"));
const landGeo = topojson.feature(land, land.objects.land);
const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(2), +c[1].toFixed(2)] : c.map(round));
landGeo.features.forEach((f) => (f.geometry.coordinates = round(f.geometry.coordinates)));
fs.writeFileSync(out("world.js"), `// Natural Earth 1:110m land (public domain) via world-atlas\nwindow.WORLD_LAND = ${JSON.stringify(landGeo)};\n`);

// 3. Tasmania, projected into a 1000x1000 box
const c10 = JSON.parse(fs.readFileSync(nm("world-atlas/countries-10m.json"), "utf8"));
const countries = topojson.feature(c10, c10.objects.countries);
const aus = countries.features.find((f) => f.properties.name === "Australia");
const inBox = (ring) => ring.every(([x, y]) => x > 143.5 && x < 149 && y < -39.4 && y > -44);
const polys = aus.geometry.coordinates.filter((p) => inBox(p[0]));
polys.sort((a, b) => b[0].length - a[0].length);
const tas = { type: "MultiPolygon", coordinates: polys.slice(0, 12) };
const proj = geoMercator().fitExtent([[40, 40], [960, 960]], { type: "Feature", geometry: tas });
const pathGen = geoPath(proj).digits(1);
const main = pathGen({ type: "Polygon", coordinates: polys[0] });
const isles = pathGen({ type: "MultiPolygon", coordinates: polys.slice(1, 12) });
const pt = (lon, lat) => proj([lon, lat]).map((v) => +v.toFixed(1));
const towns = {
  launceston: pt(147.14, -41.43), hobart: pt(147.33, -42.88), devonport: pt(146.35, -41.18),
  burnie: pt(145.9, -41.05), ulverstone: pt(146.16, -41.16), georgeTown: pt(146.83, -41.1),
  scottsdale: pt(147.52, -41.16), stHelens: pt(148.24, -41.32), deloraine: pt(146.66, -41.52),
  campbellTown: pt(147.49, -41.93), newNorfolk: pt(147.06, -42.78), kingston: pt(147.31, -42.98),
  sorell: pt(147.56, -42.78), smithton: pt(145.12, -40.84), wynyard: pt(145.72, -40.99),
  queenstown: pt(145.55, -42.08), swansea: pt(148.07, -42.12), grindelwald: pt(146.98, -41.36),
};
fs.writeFileSync(out("tasmania.js"),
  "// Tasmania coastline from Natural Earth 1:10m, Mercator-projected into a 1000x1000 box\n" +
  `window.TASMANIA = ${JSON.stringify({ main, isles, towns })};\n`);
console.log("ok", Object.keys(glyphs).length, "glyphs; tas main path", main.length, "chars");
