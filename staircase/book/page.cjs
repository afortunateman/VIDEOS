// Lay out one picture-book page at print size and save it flattened (PNG, 300 DPI).
// 8.5 x 8.5 in trim + 0.125 in bleed on top, bottom and the outer edge = 8.625 x 8.75 in = 2588 x 2625 px.
// node book/page.cjs <spec.json>   spec: {img, out, side: 'L'|'R', box: [x0,y0,x1,y1] (fractions), text, size?}
const {chromium} = require('playwright');
const fs = require('fs');
const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const W = 2588, H = 2625, BLEED = 37.5;
const fonts = '/home/user/VIDEOS/staircase/public/fonts/';
const pageHtml = (s) => {
  // the box is in trim-page fractions; map into the page, keeping clear of the gutter (0.6") and trim edges
  const trimX = s.side === 'L' ? BLEED : 0, trimW = W - BLEED, trimY = BLEED, trimH = H - 2 * BLEED;
  let [x0, y0, x1, y1] = s.box;
  const gutter = 180 / trimW; // 0.6"
  if (s.side === 'L') x1 = Math.min(x1, 1 - gutter); else x0 = Math.max(x0, gutter);
  const L = trimX + x0 * trimW, T = trimY + y0 * trimH, BW = (x1 - x0) * trimW, BH = (y1 - y0) * trimH;
  const vAlign = y0 > 0.5 ? 'flex-end' : 'flex-start';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fredoka;font-weight:600;src:url(file://${fonts}fredoka-latin-600-normal.woff2)}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}
.img{position:absolute;inset:0;background:url(file://${s.img}) center/cover no-repeat}
.glow{position:absolute;left:${L - 140}px;top:${T - 120}px;width:${BW + 280}px;height:${BH + 240}px;
 background:radial-gradient(ellipse at center,rgba(12,6,24,.42) 0%,rgba(12,6,24,.22) 45%,rgba(12,6,24,0) 72%)}
.box{position:absolute;left:${L}px;top:${T}px;width:${BW}px;height:${BH}px;display:flex;align-items:${vAlign};justify-content:center}
.txt{text-align:center;font-family:Fredoka;font-weight:600;font-size:${s.size || 150}px;line-height:1.2;color:#ffffff;text-wrap:balance;
 -webkit-text-stroke:12px rgba(25,10,30,.85);paint-order:stroke fill;letter-spacing:1px;
 filter:drop-shadow(0 6px 14px rgba(10,4,16,.6))}
</style></head><body><div class="img"></div><div class="glow"></div><div class="box"><div class="txt" id="t">${s.text}</div></div>
<script>
 // shrink the type until it fits the box (but not below ~28 pt)
 const t=document.getElementById('t'), b=t.parentElement; let f=${s.size || 150};
 document.fonts.ready.then(()=>{ while((t.scrollHeight>b.clientHeight||t.scrollWidth>b.clientWidth) && f>118){ f-=4; t.style.fontSize=f+'px'; } document.title='ready:'+f; });
</script></body></html>`;
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
  for (const s of specs) {
    const tmp = s.out.replace(/\.png$/, '.html');
    fs.writeFileSync(tmp, pageHtml(s));
    await p.goto('file://' + tmp, {waitUntil: 'load'});
    await p.waitForFunction(() => document.title.startsWith('ready'));
    const f = (await p.title()).split(':')[1];
    await p.screenshot({path: s.out});
    console.log('page', s.out.split('/').pop(), 'font', f);
  }
  await b.close();
})();
