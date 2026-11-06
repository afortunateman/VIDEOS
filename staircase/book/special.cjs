// Front matter, end page and the wraparound cover for the picture book. node book/special.cjs <stills dir> <out dir>
const {chromium} = require('playwright');
const fs = require('fs');
const [stills, out] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const W = 2588, H = 2625, BLEED = 37.5;
const fonts = '/home/user/VIDEOS/staircase/public/fonts/';
const logo = '/home/user/VIDEOS/staircase/public/title/logo.png';
const wl = '/home/user/VIDEOS/staircase/public/title/wingL.png', wr = '/home/user/VIDEOS/staircase/public/title/wingR.png';
const head = (w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fredoka;font-weight:600;src:url(file://${fonts}fredoka-latin-600-normal.woff2)}
@font-face{font-family:Fredoka;font-weight:700;src:url(file://${fonts}fredoka-latin-700-normal.woff2)}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
.t{font-family:Fredoka;color:#fff;text-align:center;-webkit-text-stroke:10px rgba(25,10,30,.85);paint-order:stroke fill;filter:drop-shadow(0 6px 14px rgba(10,4,16,.6))}
.ink{font-family:Fredoka;color:#4a0c0a;text-align:center}
</style></head><body>`;
// a spiral in the title's orange-and-maroon style (SVG)
const spiral = (size) => {
  const pts = []; for (let i = 0; i <= 200; i++) { const th = (i / 200) * 2.6 * 2 * Math.PI, r = 4 + 9.2 * th; pts.push(`${(r * Math.cos(th)).toFixed(1)},${(r * Math.sin(th)).toFixed(1)}`); }
  const d = 'M' + pts.join(' L');
  return `<svg width="${size}" height="${size}" viewBox="-85 -85 170 170"><path d="${d}" fill="none" stroke="#4a0c0a" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f6a25a" stroke-width="7.5" stroke-linecap="round"/></svg>`;
};
// the title artwork's butterfly, cut from the logo (both wings)
const butterfly = (w) => `<div style="position:relative;width:${w}px;height:${w * 0.82}px;margin:0 auto;overflow:hidden">
 <div style="position:absolute;left:${-888 * w / 212}px;top:${-497 * w / 212}px;width:${2000 * w / 212}px;height:${667 * w / 212}px;background:url(file://${wl}) 0 0/100% 100%"></div>
 <div style="position:absolute;left:${-888 * w / 212}px;top:${-497 * w / 212}px;width:${2000 * w / 212}px;height:${667 * w / 212}px;background:url(file://${wr}) 0 0/100% 100%"></div></div>`;
const CREAM = '#fbf3e6';
const pages = {
  // page 1 (right page): title over the dawn staircase, softly blurred
  p01_title: head(W, H) + `<div style="position:absolute;inset:-40px;background:url(file://${stills}/s01.png) center/cover;filter:blur(18px) brightness(.92)"></div>
   <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(255,240,220,.25),rgba(40,10,40,.25))"></div>
   <img src="file://${logo}" style="position:absolute;left:${180 + 60}px;width:${W - 180 - 60 - 112 - 37.5 - 60}px;top:820px;filter:drop-shadow(0 12px 30px rgba(40,8,6,.5))">
   <div class="t" style="position:absolute;left:180px;right:150px;bottom:360px;font-weight:600;font-size:96px">Varun Kamalahasan</div></body></html>`,
  // page 2 (left page): copyright
  p02_copyright: head(W, H) + `<div style="position:absolute;inset:0;background:${CREAM}"></div>
   <div class="ink" style="position:absolute;left:300px;right:330px;bottom:420px;font-weight:600;font-size:46px;line-height:1.55">
   The Caterpillar and the Infinity Staircase<br>Created by Varun Kamalahasan<br><br>
   Copyright © 2026 Varun Kamalahasan. All rights reserved.<br>
   No part of this book may be reproduced in any form without written permission from the author, except for brief quotations in reviews.<br><br>
   Pictures rendered from the animated short film of the same name.<br>First edition, 2026</div></body></html>`,
  // page 3 (right page): dedication
  p03_dedication: head(W, H) + `<div style="position:absolute;inset:0;background:${CREAM}"></div>
   <div style="position:absolute;left:200px;right:150px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px">
   ${spiral(260)}<div class="ink" style="font-weight:600;font-size:120px;line-height:1.3">For Mom<br>and Tofu</div></div></body></html>`,
  // page 32 (left page): the end
  p32_end: head(W, H) + `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#2d3a8c 0%,#141a45 60%,#090c24 100%)"></div>
   <div style="position:absolute;left:150px;right:220px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:80px">
   ${butterfly(520)}<div class="t" style="font-weight:700;font-size:200px;color:#f6a25a;-webkit-text-stroke:22px #4a0c0a">THE END</div></div></body></html>`,
};
// cover: bleed + back + spine + front + bleed, 300 DPI
const SPINE = 32 * 0.002347, CW = Math.round((0.125 + 8.5 + SPINE + 8.5 + 0.125) * 300), CH = 2625;
const half = (0.125 + 8.5) * 300, sp = SPINE * 300;
const cover = head(CW, CH) + `
 <div style="position:absolute;left:0;top:0;width:${half}px;height:${CH}px;background:url(file://${stills}/s27.png) center/cover"></div>
 <div style="position:absolute;left:0;top:0;width:${half}px;height:${CH}px;background:linear-gradient(to bottom,rgba(20,8,30,.55),rgba(20,8,30,.15) 60%,rgba(20,8,30,.35))"></div>
 <div class="t" style="position:absolute;left:${37.5 + 190}px;width:${half - 37.5 - 380}px;top:300px;font-weight:600;font-size:84px;line-height:1.3;text-wrap:balance">
 A little caterpillar climbs a staircase with no end, because everyone says that if he climbs high enough, he will become a butterfly.<br><br>
 Years pass. The steps never stop.<br><br>Then, one day, he sits down.</div>
 <div style="position:absolute;left:${half}px;top:0;width:${sp}px;height:${CH}px;background:#2b1630"></div>
 <div style="position:absolute;left:${half + sp}px;top:0;width:${half}px;height:${CH}px;background:url(file://${stills}/s01.png) center/cover"></div>
 <img src="file://${logo}" style="position:absolute;left:${half + sp + 190}px;width:${half - 190 - 37.5 - 190}px;top:240px;filter:drop-shadow(0 14px 34px rgba(40,8,6,.55))">
 <div class="t" style="position:absolute;left:${half + sp + 150}px;width:${half - 300 - 37.5}px;bottom:260px;font-weight:600;font-size:104px">Varun Kamalahasan</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [name, html] of [...Object.entries(pages), ['cover', cover]]) {
    const w = name === 'cover' ? CW : W, h = name === 'cover' ? CH : H;
    const p = await b.newPage({viewport: {width: w, height: h}});
    const tmp = `${out}/${name}.html`; fs.writeFileSync(tmp, html);
    await p.goto('file://' + tmp, {waitUntil: 'load'}); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({path: `${out}/${name}.png`}); await p.close();
    console.log('made', name, w, 'x', h);
  }
  await b.close();
})();
