const { chromium } = require('playwright');
const K = process.argv[2];
const jobs = [
  ['logo-horizontal.svg', 'logo-horizontal.png', 1200, null, 'transparent'],
  ['logo-horizontal-blanco.svg', 'logo-horizontal-blanco.png', 1200, null, 'transparent'],
  ['logo-horizontal-una-tinta.svg', 'logo-horizontal-una-tinta.png', 1200, null, 'transparent'],
  ['logo-vertical.svg', 'logo-vertical.png', 800, null, 'transparent'],
  ['logo-vertical-blanco.svg', 'logo-vertical-blanco.png', 800, null, 'transparent'],
  ['flor.svg', 'flor-1024.png', 1024, 1024, 'transparent'],
  ['flor.svg', 'flor-512.png', 512, 512, 'transparent'],
  ['flor-sobre-oscuro.svg', 'flor-sobre-oscuro-512.png', 512, 512, 'transparent'],
  ['flor.svg', 'favicon-32.png', 32, 32, 'transparent'],
  ['flor.svg', 'favicon-192.png', 192, 192, 'transparent'],
];
(async () => {
  const b = await chromium.launch();
  for (const [src, out, w, h, bg] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h || 600 } });
    require('fs').writeFileSync(__dirname + '/tmp.html', `<html><body style="margin:0;background:${bg}"><img id="i" src="file://${K}/logos/${src}" style="display:block;width:${w}px;height:${h ? h + 'px' : 'auto'}"></body></html>`); await p.goto('file://' + __dirname + '/tmp.html');
    await p.waitForTimeout(300);
    await (await p.$('#i')).screenshot({ path: `${K}/logos/png/${out}`, omitBackground: true });
    await p.close();
  }
  // Apple touch icon: flower on cream with padding (iOS fills transparency with black)
  let p = await b.newPage({ viewport: { width: 180, height: 180 } });
  require('fs').writeFileSync(__dirname + '/tmp.html', `<body style="margin:0;width:180px;height:180px;background:#FFF8E1;display:grid;place-items:center"><img src="file://${K}/logos/flor.svg" style="width:132px;height:132px"></body>`); await p.goto('file://' + __dirname + '/tmp.html');
  await p.waitForTimeout(300); await p.screenshot({ path: `${K}/logos/png/apple-touch-icon-180.png` });
  // Social card 1200x630
  p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(`file://${K}/plantillas/tarjeta-social.html`); await p.waitForTimeout(800);
  await p.screenshot({ path: `${K}/logos/png/tarjeta-social-1200x630.png` });
  await b.close();
})();
