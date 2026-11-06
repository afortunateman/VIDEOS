// Render the picture-book stills: node book/stills.mjs <plan.json> <outDir> <scale> [id ...]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [planFile, outDir, scaleArg, ...only] = process.argv.slice(2);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8')).filter((p) => !only.length || only.includes(p.id));
fs.mkdirSync(outDir, {recursive: true});
const exe = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions: {gl: 'swangle'}});
for (const p of plan) {
  const inputProps = {n: p.n, t: p.t, wide: p.wide ?? 0.8, move: p.move, aim: p.aim, shade: p.shade, look: p.look, lookTweak: p.lookTweak};
  const composition = await selectComposition({serveUrl, id: 'BookStill', inputProps, puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
  for (let k = 0; k < 2; k++) {
    try {
      await renderStill({composition, serveUrl, inputProps, frame: 0, output: path.join(outDir, `${p.id}.png`), scale: Number(scaleArg), puppeteerInstance: browser, timeoutInMilliseconds: 900000, chromiumOptions: {gl: 'swangle'}, browserExecutable: exe});
      console.log('ok', p.id);
      break;
    } catch (e) {
      console.log('retry', p.id, String(e).slice(0, 120));
    }
  }
}
await browser.close({silent: true});
