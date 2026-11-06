// Lay out one picture-book page at print size and save it flattened (PNG, 300 DPI).
// 8.5 x 8.5 in trim + 0.125 in bleed on top, bottom and the outer edge = 8.625 x 8.75 in = 2588 x 2625 px.
// node book/page.cjs <spec.json>   spec: {img, out, side: 'L'|'R', box: [x0,y0,x1,y1] (fractions), text, size?}
const {chromium} = require('playwright');
const fs = require('fs');
const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const W = 2588, H = 2625, BLEED = 37.5;
const fonts = '/home/user/VIDEOS/staircase/public/fonts/';
const pageHtml = (s) => {
  const blocks = s.blocks || [{text: s.text, box: s.box, size: s.size}];
  const trimX = s.side === 'L' ? BLEED : 0, trimW = W - BLEED, trimY = BLEED, trimH = H - 2 * BLEED;
  const gutter = 180 / trimW; // keep 0.6" clear of the spine
  const parts = blocks.map((bk, i) => {
    let [x0, y0, x1, y1] = bk.box;
    if (s.side === 'L') x1 = Math.min(x1, 1 - gutter); else x0 = Math.max(x0, gutter);
    x0 = Math.max(x0, 0.055); x1 = Math.min(x1, 0.945); // and 0.375"+ from the trimmed outer edges
    const L = trimX + x0 * trimW, T = trimY + y0 * trimH, BW = (x1 - x0) * trimW, BH = (y1 - y0) * trimH;
    const v = y0 > 0.5 ? 'flex-end' : 'flex-start';
    const size = bk.size || 150;
    return {i, size, html: `<div class="glow" style="left:${L - 120}px;top:${T - 100}px;width:${BW + 240}px;height:${BH + 200}px"></div>
<div class="box" style="left:${L}px;top:${T}px;width:${BW}px;height:${BH}px;align-items:${v}"><div class="txt" id="t${i}" data-size="${size}" style="font-size:${size}px">${bk.text}</div></div>`};
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fredoka;font-weight:600;src:url(file://${fonts}fredoka-latin-600-normal.woff2)}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}
.img{position:absolute;inset:0;background:url(file://${s.img}) center/cover no-repeat}
.glow{position:absolute;background:radial-gradient(ellipse at center,rgba(12,6,24,.42) 0%,rgba(12,6,24,.22) 45%,rgba(12,6,24,0) 72%)}
.box{position:absolute;display:flex;justify-content:center}
.txt{text-align:center;font-family:Fredoka;font-weight:600;line-height:1.2;color:#ffffff;text-wrap:balance;
 -webkit-text-stroke:12px rgba(25,10,30,.85);paint-order:stroke fill;letter-spacing:1px;filter:drop-shadow(0 6px 14px rgba(10,4,16,.6))}
</style></head><body><div class="img"></div>${parts.map((x) => x.html).join('\n')}
<script>
 // shrink each block's type until it fits its box (never below ~26 pt)
 document.fonts.ready.then(()=>{ const out=[]; document.querySelectorAll('.txt').forEach(t=>{ const b=t.parentElement; let f=+t.dataset.size;
   while((t.scrollHeight>b.clientHeight||t.scrollWidth>b.clientWidth) && f>108){ f-=4; t.style.fontSize=f+'px'; } out.push(f); }); document.title='ready:'+out.join('/'); });
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
