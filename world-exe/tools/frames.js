#!/usr/bin/env node
// Quick look: render selected timestamps to PNGs (and an optional contact sheet).
//   node tools/frames.js 0.2 0.9 1.4 ...          -> out/preview/t_0.200.png ...
//   node tools/frames.js --sheet 0 8 0.5          -> one contact sheet of every 0.5s
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
(async () => {
  const args = process.argv.slice(2);
  let times = [], sheet = false;
  if (args[0] === '--sheet') {
    sheet = true;
    const [a, b, s] = args.slice(1).map(Number);
    for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(4));
  } else times = args.map(Number);
  const outDir = path.join(ROOT, 'out', 'preview');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html') + '?render=1');
  await page.waitForFunction(() => window.WX_READY === true, null, { timeout: 60000 });
  const files = [];
  for (const t of times) {
    const t0 = Date.now();
    const data = await page.evaluate((tt) => { window.WX.renderAt(tt); return document.getElementById('cv').toDataURL('image/png'); }, t);
    const f = path.join(outDir, `t_${t.toFixed(3)}.png`);
    fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
    files.push(f);
    console.log(path.relative(ROOT, f), Date.now() - t0 + 'ms');
  }
  if (sheet) {
    const cols = 4, w = 480, h = 270;
    const rows = Math.ceil(files.length / cols);
    const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px">` +
      files.map((f, i) => `<div style="position:relative"><img src="file://${f}" width=${w} height=${h}><span style="position:absolute;left:6px;top:4px;color:#fff;font:bold 16px sans-serif;text-shadow:0 0 3px #000">${times[i].toFixed(2)}s</span></div>`).join('') + '</body>';
    const sp = await browser.newPage({ viewport: { width: cols * (w + 4), height: rows * (h + 4) } });
    const hf = path.join(outDir, 'sheet.html');
    fs.writeFileSync(hf, html);
    await sp.goto('file://' + hf);
    await sp.waitForTimeout(300);
    await sp.screenshot({ path: path.join(outDir, 'sheet.png') });
    console.log('sheet -> out/preview/sheet.png');
  }
  await browser.close();
})();
