// Records a real walkthrough of Pascal Sign (local copy of the site, mocked account API) as CDP screencast frames.
// Output: frames/*.jpg + frames.json (timestamps) + marks.json (step times) + downloaded PDFs.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const { setup } = require('./mock.js');
const OUT = __dirname + '/frames';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${__dirname}/camara.y4m`] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-CO', timezoneId: 'America/Bogota', serviceWorkers: 'block', acceptDownloads: true, permissions: ['camera'] });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('pascalia_consentimiento', JSON.stringify({ v: 1, fecha: new Date().toISOString(), necesarias: true, preferencias: true, analitica: false })); } catch (e) {}
    // Finger indicator: a soft circle while pressed, a ripple on tap
    addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style');
      st.textContent = `#__f{position:fixed;z-index:2147483647;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,193,7,.45);box-shadow:0 0 0 3px rgba(255,255,255,.9),0 4px 14px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .12s,transform .12s;transform:scale(.6)}
      #__f.on{opacity:1;transform:scale(1)}`;
      document.head.appendChild(st);
      const f = document.createElement('div'); f.id = '__f'; document.body.appendChild(f);
      const mv = (e) => { f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px'; };
      addEventListener('pointerdown', (e) => { mv(e); f.classList.add('on'); }, true);
      addEventListener('pointermove', mv, true);
      addEventListener('pointerup', () => setTimeout(() => f.classList.remove('on'), 140), true);
    });
  });
  await setup(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  p.on('dialog', async d => { console.log('DIALOG', d.message().slice(0, 100)); await new Promise(r => setTimeout(r, 300)); d.accept(); });

  const SCALE = 4;
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  let capturing = false, pending = [];
  async function loop() {
    let i = 0;
    while (capturing) {
      const t = Date.now() / 1000;
      try {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 390, height: 664, scale: 2.6 } });
        const f = `${OUT}/${String(i).padStart(5, '0')}.jpg`; i++;
        pending.push(fs.promises.writeFile(f, Buffer.from(data, 'base64')));
        frames.push(t);
      } catch (e) {}
    }
  }
  const marks = {};
  const t0 = () => Date.now() / 1000;
  const mark = (k) => { marks[k] = t0(); console.log('mark', k); };
  const wait = (ms) => p.waitForTimeout(ms * SCALE);
  const center = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  // Slow, visible pointer travel and tap
  let cur = [195, 600];
  async function glide(x, y, steps = 18) { const [x0, y0] = cur; for (let i = 1; i <= steps; i++) { const t = i / steps, e = t * t * (3 - 2 * t); await p.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e); await wait(12); } cur = [x, y]; }
  async function tap(sel, pause = 500) { const [x, y] = await center(sel); await glide(x, y); await p.mouse.down(); await wait(120); await p.mouse.up(); await wait(pause); }
  async function typeIn(sel, text) { await tap(sel, 250); await p.locator(sel).first().pressSequentially(text, { delay: 55 * SCALE }); await wait(300); }
  async function drag(from, to, steps = 40) { await glide(from[0], from[1]); await p.mouse.down(); await wait(150); for (let i = 1; i <= steps; i++) { const t = i / steps, e = t * t * (3 - 2 * t); await p.mouse.move(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e); await wait(16); } cur = to; await wait(150); await p.mouse.up(); await wait(400); }

  await p.goto('http://127.0.0.1:8765/PascalSign/', { waitUntil: 'networkidle' });
  await wait(600);
  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SCALE });
  capturing = true; const looper = loop(); marks.__scale = SCALE;
  await wait(300);

  // 1 · home, open the PDF
  mark('home'); await wait(2600);
  await p.locator('label[for="archivo"]').scrollIntoViewIfNeeded(); await wait(700);
  mark('abrir');
  const [x, y] = await center('label[for="archivo"]');
  console.log('label at', x, y);
  await glide(x, y);
  const chooserP = p.waitForEvent('filechooser', { timeout: 8000 });
  await p.mouse.down(); await wait(120); await p.mouse.up();
  let chooser; try { chooser = await chooserP; } catch (e) { const c2 = p.waitForEvent('filechooser'); await p.click('label[for="archivo"]'); chooser = await c2; }
  await wait(500);
  await chooser.setFiles(__dirname + '/Cuenta de cobro noviembre.pdf');
  await wait(2200);
  mark('doc'); await wait(1800);

  // 2 · new signature: draw, name, object, filing number
  mark('firmar'); await tap('#btn-firmar', 900);
  mark('dibujar');
  const pad = await p.locator('#pad').boundingBox();
  const pts = [];
  const ox = pad.x + 40, base = pad.y + pad.height * .62;
  // big initial C
  for (let i = 0; i <= 30; i++) { const a = Math.PI * (0.25 + 1.45 * i / 30); pts.push([ox + 30 + 34 * Math.cos(a), base - 30 - 40 * Math.sin(a) * -1]); }
  // lower-case run with a tall "l" and a "P"-like loop
  let sx = pts[pts.length - 1][0];
  const humps = [14, 11, 46, 13, 11, 0, 58, 12, 10, 14];
  humps.forEach((hgt, k) => {
    if (hgt === 0) { for (let i = 0; i <= 8; i++) { pts.push([sx + i * 2.2, base - 2]); } sx += 18; return; }
    const w = hgt > 40 ? 20 : 17;
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([sx + w * t + (hgt > 40 ? 6 * Math.sin(t * Math.PI * 2) : 0), base - hgt * Math.sin(Math.PI * t)]); }
    sx += w;
  });
  const flour = []; for (let i = 0; i <= 44; i++) { const t = i / 44; flour.push([sx + 8 - t * (sx - ox + 10), base + 14 + 8 * Math.sin(t * Math.PI) - 6 * t]); }
  await glide(pts[0][0], pts[0][1]); await p.mouse.down();
  for (const [X, Y] of pts) { await p.mouse.move(X, Y); await wait(9); }
  await p.mouse.up(); await wait(200);
  await glide(flour[0][0], flour[0][1], 8); await p.mouse.down();
  for (const [X, Y] of flour) { await p.mouse.move(X, Y); await wait(9); }
  await p.mouse.up(); cur = flour[flour.length - 1]; await wait(600);
  // 2b · the other ways: upload an image of the signature, or take a photo of it
  mark('imagen');
  await tap('[data-tab="imagen"]', 800);
  { const [ix, iy] = await center('label.subir'); await glide(ix, iy);
    const fc = p.waitForEvent('filechooser', { timeout: 8000 });
    await p.mouse.down(); await wait(120); await p.mouse.up();
    let ch; try { ch = await fc; } catch (e) { const c2 = p.waitForEvent('filechooser'); await p.click('label.subir'); ch = await c2; }
    await wait(500); await ch.setFiles(__dirname + '/firma-foto.jpg'); }
  await wait(2000);
  mark('foto');
  await p.locator('#camara').scrollIntoViewIfNeeded(); await wait(300);
  await tap('#camara', 2200);
  await tap('[data-tomar]', 1800);
  await wait(600);
  await p.locator('[data-tab="dibujar"]').scrollIntoViewIfNeeded(); await wait(300);
  mark('volver');
  await tap('[data-tab="dibujar"]', 900);
  mark('datos');
  await typeIn('#nombre', 'Carlos Pérez');
  await p.locator('#sello-objeto').scrollIntoViewIfNeeded(); await wait(300);
  await typeIn('#sello-objeto', 'Cuenta de cobro');
  await typeIn('#sello-radicado', 'RAD-2026-131');
  await wait(500);
  mark('usar'); await tap('#usar', 1200);

  // 3 · place: drag over the signature line, resize with the yellow handle
  mark('acomodar');
  const pg = await p.locator('.pagina').first().boundingBox();
  let col = await p.locator('.colocada').boundingBox();
  let grab = [col.x + col.width * .45, col.y + col.height * .35];
  await drag(grab, [grab[0] - (col.x - pg.x - pg.width * .10), grab[1] + (pg.y + pg.height * .52 - col.y)]);
  await wait(500);
  mark('tamano');
  let asa = await p.locator('.colocada .asa').boundingBox();
  await drag([asa.x + 15, asa.y + 15], [asa.x + 15 - 78, asa.y + 15 - 40], 34);
  await wait(400);
  col = await p.locator('.colocada').boundingBox();
  grab = [col.x + col.width * .45, col.y + col.height * .35];
  const dx = (pg.x + pg.width * .075) - col.x, dy = (pg.y + pg.height * .633 - col.height) - col.y;
  await drag(grab, [grab[0] + dx, grab[1] + dy], 26);
  await wait(400);
  await glide(pg.x + pg.width * .8, pg.y + pg.height * .2); await p.mouse.down(); await wait(80); await p.mouse.up();
  await wait(1000);

  // 4 · finish and save the signed PDF
  mark('listo'); await tap('#btn-listo', 1200);
  mark('guardar');
  const dlP = p.waitForEvent('download');
  await tap('#descargar', 300);
  const dl = await dlP; await dl.saveAs(__dirname + '/firmado.pdf');
  await wait(2200);
  mark('firmado'); await wait(1500);
  await tap('#btn-cerrar', 1200);

  // 5 · account: download the consolidated signature history
  mark('cuenta'); await tap('#btn-cuenta', 1300);
  await p.locator('[data-exp="pdf"]').scrollIntoViewIfNeeded(); await wait(900);
  mark('historial');
  const dl2P = p.waitForEvent('download');
  await tap('[data-exp="pdf"]', 300);
  const dl2 = await dl2P; await dl2.saveAs(__dirname + '/historial.pdf');
  await wait(1800);

  // 6 · delegate the signature
  await p.locator('[data-delegar]').scrollIntoViewIfNeeded(); await wait(700);
  mark('delegar'); await tap('[data-delegar]', 1400);
  await typeIn('#dg-correo', 'asistente@correo.com');
  await p.locator('[name="dg-modo"][value="restringida"]').scrollIntoViewIfNeeded(); await wait(400);
  mark('objetos'); await tap('[name="dg-modo"][value="restringida"]', 500);
  await typeIn('#dg-objetos', 'Cuenta de cobro');
  await wait(300);
  mark('delegarok'); await tap('[data-crear]', 2200);
  await p.locator('[data-lista]').scrollIntoViewIfNeeded(); await wait(2500);
  mark('fin'); await wait(1200);

  capturing = false; await looper; await Promise.all(pending);
  fs.writeFileSync(__dirname + '/frames.json', JSON.stringify(frames));
  fs.writeFileSync(__dirname + '/marks.json', JSON.stringify(marks));
  console.log('frames', frames.length);
  await b.close();
})();
