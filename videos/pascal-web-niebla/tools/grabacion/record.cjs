// Records a real walkthrough of the La Niebla demo site (pascalia-web: /pascal-web/bistro/, served locally) on an iPhone 13,
// as CDP screenshots with time dilation (CSS animations and JS timers slowed by SCALE, so the capture is smooth).
// Output: frames/*.jpg + frames.json (wall timestamps) + marks.json (app-time step marks, seconds).
// Usage: node record.js [base_url]   (default http://127.0.0.1:8765)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/frames';
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const SCALE = 4;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'es-CO', timezoneId: 'America/Bogota' });
  // Google Fonts from a local copy (the headless browser has no route to the internet): FONTS_DIR has fonts.css + woff2 files
  const FONTS = process.env.FONTS_DIR;
  if (FONTS) {
    await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(FONTS + '/fonts.css', 'utf8') }));
    await ctx.route(/fonts\.gstatic\.com/, r => { const f = new URL(r.request().url()).pathname.slice(1).replace(/\//g, '_');
      r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(FONTS + '/' + f) }); });
  }
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().includes('fonts.g') ? r.fallback() : r.abort());
  await ctx.addInitScript((SCALE) => {
    try { localStorage.setItem('pascalia_consentimiento', JSON.stringify({ v: 1, fecha: new Date().toISOString(), necesarias: true, preferencias: true, analitica: false })); } catch (e) {}
    // JS timers follow the slowed-down clock
    const st = window.setTimeout, si = window.setInterval;
    window.setTimeout = (f, ms, ...a) => st(f, (ms || 0) * SCALE, ...a);
    window.setInterval = (f, ms, ...a) => si(f, (ms || 0) * SCALE, ...a);
    // Smooth scrolling (carousels, anchors) also slowed down: our own easing instead of the browser's
    const anim = (el, left, top) => {
      const sx = el === window ? scrollX : el.scrollLeft, sy = el === window ? scrollY : el.scrollTop;
      const tx = left == null ? sx : left, ty = top == null ? sy : top, t0 = performance.now(), D = 520 * SCALE;
      const step = (now) => { const k = Math.min(1, (now - t0) / D), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e;
        if (el === window) window.__scrollTo(x, y); else { el.scrollLeft = x; el.scrollTop = y; }
        if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    window.__scrollTo = window.scrollTo.bind(window);
    const wrap = (proto, isBy) => {
      const orig = proto[isBy ? 'scrollBy' : 'scrollTo'];
      proto[isBy ? 'scrollBy' : 'scrollTo'] = function (o, y) {
        if (o && typeof o === 'object' && o.behavior === 'smooth') {
          const self = this === window ? window : this;
          const cx = self === window ? scrollX : self.scrollLeft, cy = self === window ? scrollY : self.scrollTop;
          const l = o.left == null ? null : (isBy ? cx + o.left : o.left), t = o.top == null ? null : (isBy ? cy + o.top : o.top);
          return anim(self, l, t);
        }
        return orig.apply(this, arguments);
      };
    };
    wrap(Element.prototype, false); wrap(Element.prototype, true);
    // Finger indicator: soft circle while pressed
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = `#__f{position:fixed;z-index:2147483647;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,193,7,.5);box-shadow:0 0 0 3px rgba(255,255,255,.9),0 4px 14px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .12s,transform .12s;transform:scale(.6)}
      #__f.on{opacity:1;transform:scale(1)}`;
      document.head.appendChild(s);
      const f = document.createElement('div'); f.id = '__f'; document.body.appendChild(f);
      const mv = (e) => { f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px'; };
      addEventListener('pointerdown', (e) => { mv(e); f.classList.add('on'); }, true);
      addEventListener('pointermove', mv, true);
      addEventListener('pointerup', () => st(() => f.classList.remove('on'), 140 * SCALE), true);
    });
  }, SCALE);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  const cdp = await ctx.newCDPSession(p);
  const frames = []; let capturing = false; const pending = [];
  async function loop() {
    let i = 0;
    while (capturing) {
      const t = Date.now() / 1000;
      try {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 390, height: 664, scale: 2.6 } });
        pending.push(fs.promises.writeFile(`${OUT}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64'))); i++;
        frames.push(t);
      } catch (e) { errs++; if (errs < 5) console.log('CAPERR', e.message); }
    }
  }
  let errs = 0;
  const marks = { __scale: SCALE }; let T0 = 0;
  const mark = (k) => { marks[k] = (Date.now() / 1000 - T0) / SCALE; console.log('mark', k, marks[k].toFixed(2)); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms * SCALE));  // Node timer: the page's setTimeout is slowed down already
  const center = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  let cur = [195, 500];
  async function glide(x, y, steps = 16) { const [x0, y0] = cur; for (let i = 1; i <= steps; i++) { const t = i / steps, e = t * t * (3 - 2 * t); await p.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e); await wait(14); } cur = [x, y]; }
  async function tap(sel, pause = 600) { await p.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); const [x, y] = await center(sel); await glide(x, y); await p.mouse.down(); await wait(110); await p.mouse.up(); await wait(pause); }
  // Smooth page scroll by dy CSS px over ms (app time)
  async function scroll(dy, ms) { const n = Math.max(1, Math.round(ms / 16)); let done = 0;
    for (let i = 1; i <= n; i++) { const t = i / n, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; const want = Math.round(dy * e); await p.evaluate((d) => window.__scrollTo(0, scrollY + d), want - done); done = want; await wait(16); } }
  async function scrollToSel(sel, ms, offset = 70) { const y = await p.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top - o, [sel, offset]); await scroll(y, ms); }

  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SCALE });
  capturing = true; const looper = loop(); T0 = Date.now() / 1000;
  await p.goto(BASE + '/pascal-web/bistro/', { waitUntil: 'domcontentloaded' });
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SCALE });
  mark('carga'); await wait(2600);
  mark('portada'); await glide(120, 420); await glide(300, 360, 30); await glide(200, 520, 30); await wait(1200);

  // Menu: open it, English, back to Spanish, close
  mark('menu'); await tap('[data-menu-btn]', 1500);
  mark('idioma'); await tap('[data-idioma="en"]', 1700); await tap('[data-idioma="es"]', 1200);
  await tap('[data-menu-btn]', 900);

  // Scroll through the story
  mark('nosotros'); await scrollToSel('#nosotros', 1800); await wait(1600);
  mark('acerca'); await scrollToSel('#acerca', 1600); await scroll(260, 900); await wait(1200);
  mark('galeria'); await scrollToSel('#galeria', 1400); await wait(900); await tap('#galeria [data-sig]', 1300); await tap('#galeria [data-sig]', 1100);
  mark('cinta'); await scroll(420, 1500); await wait(500);
  mark('inspiracion'); await scrollToSel('#inspiracion', 1400); await scroll(360, 1300); await wait(1300);
  mark('chef'); await scrollToSel('#chef', 1400); await scroll(300, 1000); await tap('#chef [data-sig]', 1300);
  mark('equipo'); await scrollToSel('#equipo', 1400); await scroll(280, 1000); await wait(1200);
  mark('reconocimientos'); await scrollToSel('#reconocimientos', 1400); await scroll(380, 1300); await wait(1000);
  mark('evento'); await scroll(520, 1500); await wait(700);
  mark('contacto'); await scrollToSel('#contacto', 1500); await scroll(500, 1600); await wait(1200);
  mark('pie'); await scroll(700, 1700); await wait(1200);

  // Menu (carta) from the footer link, tasting menu tab
  mark('carta'); await tap('.pie-nav [data-abrir="carta"]', 1500);
  await tap('[data-carta="carta"]', 1000);
  await p.evaluate(() => { const c = document.querySelector('#carta .capa-in'); c.__s = c; });
  for (let i = 0; i < 40; i++) { await p.evaluate(() => { const c = document.querySelector('#carta'); c.scrollTop += 9; const ci = document.querySelector('#carta .capa-in'); ci.scrollTop += 9; }); await wait(16); }
  await wait(600);
  mark('degustacion'); await tap('[data-carta="degustacion"]', 1700);
  await tap('#carta [data-cerrar]', 900);

  // Booking: header button (scroll up a bit so the header comes back)
  await scroll(-300, 900); await wait(500);
  mark('reserva'); await tap('[data-cab] [data-abrir="reserva"]', 1300);
  mark('personas'); await tap('[data-mas]', 600); await tap('[data-mas]', 900); await tap('[data-continuar]', 1100);
  mark('fecha'); await tap('[data-dias] button:not([disabled])[aria-label^="21 "]', 900); await tap('[data-continuar]', 1100);
  mark('hora'); await tap('[data-horas] button:nth-child(7)', 900); await tap('[data-continuar]', 1400);
  mark('resumen'); await wait(2600);
  mark('fin'); await wait(400);

  capturing = false; await looper; await Promise.all(pending);
  fs.writeFileSync(__dirname + '/frames.json', JSON.stringify({ t0: T0, scale: SCALE, frames }));
  fs.writeFileSync(__dirname + '/marks.json', JSON.stringify(marks));
  console.log('frames', frames.length, 'capture errors', errs);
  await b.close();
})();
