#!/usr/bin/env node
// Offline, frame-accurate render of the intro:
//   1. headless Chromium loads index.html?render=1 and draws each frame with WX.renderAt(t)
//      (several pages in parallel, each taking every Nth frame)
//   2. ffmpeg encodes the PNG sequence (H.264, BT.709) and muxes the Python-made score
// Usage: node tools/render.js [--fps 60] [--workers 4] [--out out/world_exe_intro.mp4]
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', timeline.fps);
const WORKERS = +arg('workers', 4);
const OUT = path.resolve(ROOT, arg('out', 'out/world_exe_intro.mp4'));
const AUDIO = path.join(ROOT, 'audio', 'world_exe_score.wav');
const FRAMES = path.join(ROOT, 'out', 'frames');
const total = Math.round(timeline.duration * FPS);

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const t0 = Date.now();
  let done = 0;
  async function worker(w) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', (e) => { console.error('[page error]', e.message); process.exit(1); });
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?render=1');
    await page.waitForFunction(() => window.WX_READY === true, null, { timeout: 60000 });
    for (let f = w; f < total; f += WORKERS) {
      const t = f / FPS;
      const data = await page.evaluate((tt) => { window.WX.renderAt(tt); return document.getElementById('cv').toDataURL('image/png'); }, t);
      fs.writeFileSync(path.join(FRAMES, `f_${String(f).padStart(4, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
      done++;
      if (done % 24 === 0 || done === total) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  frames ${done}/${total}  ${el.toFixed(0)}s elapsed, ~${((el / done) * (total - done)).toFixed(0)}s left   `);
      }
    }
    await page.close();
  }
  console.log(`rendering ${total} frames at ${FPS} fps with ${WORKERS} workers`);
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
  await browser.close();
  console.log('\n  encoding…');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const hasAudio = fs.existsSync(AUDIO);
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%04d.png'),
    ...(hasAudio ? ['-i', AUDIO] : []),
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    ...(hasAudio ? ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
    '-t', String(timeline.duration),
    '-movflags', '+faststart',
    OUT,
  ];
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
  console.log(`wrote ${path.relative(ROOT, OUT)}${hasAudio ? '' : ' (no audio found — run `npm run build:audio` first)'}`);
})();
