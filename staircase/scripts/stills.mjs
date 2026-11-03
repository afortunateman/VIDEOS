// Render review stills: node scripts/stills.mjs <outDir> <scale> <sec> [sec...]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [outDir, scaleArg, ...secs] = process.argv.slice(2);
const scale = Number(scaleArg || 0.5);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {
  browserExecutable: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  chromiumOptions: {gl: 'swangle'},
});
const composition = await selectComposition({serveUrl, id: 'Film', puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
for (const s of secs) {
  const frame = Math.round(Number(s) * 30);
  const t0 = Date.now();
  await renderStill({
    composition,
    serveUrl,
    frame,
    output: path.join(outDir, `t${String(s).replace('.', '_')}.png`),
    scale,
    puppeteerInstance: browser,
    chromiumOptions: {gl: 'swangle'},
    browserExecutable: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  });
  console.log(`frame ${frame} (${s}s) ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close({silent: true});
