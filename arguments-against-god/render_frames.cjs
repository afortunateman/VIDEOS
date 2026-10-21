(async () => {
const { chromium } = require('playwright');
const path = require('path');
const dir = path.dirname(__filename);
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['office', 'dining', 'fist'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
for (const [i, s] of scenes.entries()) {
  await page.goto(`file://${dir}/frames.html?scene=${s}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/frames/${s}.png` });
  console.log('rendered', s);
}
await browser.close();
})();
