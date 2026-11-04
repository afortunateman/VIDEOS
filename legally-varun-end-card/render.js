// Renders card.html frame by frame and encodes a 1080x1920 60fps MP4.
// Usage: node render.js [outDir] [--frames=0,60,120]  (frames = preview stills only)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };

(async () => {
  const outDir = path.resolve(process.argv[2] || 'build');
  const only = (process.argv.find(a => a.startsWith('--frames=')) || '').slice(9);
  fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });

  // tiny static server (ES modules don't load from file://)
  const server = http.createServer((req, res) => {
    const file = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
  const port = server.address().port;

  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[page error]', e.message));
  await page.goto(`http://localhost:${port}/card.html`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(() => window.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const list = only ? only.split(',').map(Number) : [...Array(total).keys()];

  for (const f of list) {
    const url = await page.evaluate(n => window.renderFrame(n), f);
    const file = path.join(outDir, 'frames', `f${String(f).padStart(4, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    if (f % 30 === 0) process.stdout.write(`frame ${f}/${total}\n`);
  }
  await browser.close();
  server.close();
  if (only) return;

  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '60',
    '-i', path.join(outDir, 'frames', 'f%04d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-movflags', '+faststart',
    path.join(outDir, 'legally-varun-end-card.mp4')], { stdio: 'inherit' });
  console.log('done');
})();
