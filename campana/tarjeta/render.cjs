// Renders tarjeta.html variants to PNG with the preinstalled Chromium.
const { chromium } = require('/opt/node-tools/node_modules/playwright-core');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const v of ['story-hw', 'feed-hw', 'story-cl', 'feed-cl']) {
    const h = v.startsWith('story') ? 1920 : 1350;
    const p = await b.newPage({ viewport: { width: 1080, height: h } });
    await p.goto('file://' + path.resolve('tarjeta.html') + '#' + v);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({ path: `tarjeta-${v}.png` });
    await p.close();
  }
  await b.close();
})();
