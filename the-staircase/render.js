// Render frames of the film with headless Chromium.
//   node render.js stills <outDir> 1.0 6.5 ...     -> PNG stills at given times
//   node render.js video  <out.mp4> [fps]          -> full film as MP4 (needs ffmpeg)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?capture&t=0');
  await page.waitForFunction(() => window.__film);
  const grab = async t => {
    const url = await page.evaluate(t => { window.__film.render(t); return document.getElementById('film').toDataURL('image/png'); }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of rest.map(Number)) {
      fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`), await grab(t));
    }
  } else if (mode === 'video') {
    const fps = +(rest[0] || 24);
    const dur = await page.evaluate(() => window.__film.DURATION);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', process.env.CRF || '23', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(dur * fps);
    for (let i = 0; i < n; i++) {
      const buf = await grab(i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 48 === 0) process.stderr.write(`frame ${i}/${n}\n`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
