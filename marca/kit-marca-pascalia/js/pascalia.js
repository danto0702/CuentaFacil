// PascalIA · comportamiento de marca: entradas al hacer scroll, marcador, nav, barra de progreso,
// titular palabra por palabra, menú móvil, pestañas, barra de Pascal, resplandor y volver arriba.
// Sin dependencias. Respeta prefers-reduced-motion. Úsalo con <script src="js/pascalia.js" defer></script>.
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };

  // Titular: divide en palabras para que suban una a una (80 ms entre palabras)
  $$('.h1[data-words]').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
            var w = d.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part; frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('mark')) walk(n);
        else if (n.nodeType === 1) { n.classList.add('w'); n.style.setProperty('--i', i++); }
      });
    })(h);
    requestAnimationFrame(function () { h.classList.add('go'); });
  });

  // Entradas al hacer scroll y marcador
  var targets = $$('.reveal, .mark, [data-in]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add(el.classList.contains('mark') ? 'on' : 'in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('mark') ? 'on' : 'in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .15 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Nav: se compacta al bajar 24 px, barra de lectura y botón volver arriba
  var nav = d.querySelector('.nav');
  var bar = d.querySelector('[data-progress] i, .progress i');
  var top = d.querySelector('.to-top');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    if (nav) nav.toggleAttribute('data-scrolled', y > 24);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (top) top.classList.toggle('show', y > window.innerHeight);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  // Menú móvil
  var menu = d.querySelector('.menu-btn');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  // Pestañas con indicador deslizante
  $$('.tabs').forEach(function (tabs) {
    var ink = tabs.querySelector('.tab-ink');
    var btns = $$('button[role=tab]', tabs);
    function move(b) {
      if (!ink || !b) return;
      ink.style.width = b.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) {
          var on = o === b; o.setAttribute('aria-selected', String(on));
          var p = o.getAttribute('aria-controls'); if (p && d.getElementById(p)) d.getElementById(p).hidden = !on;
        });
        move(b);
      });
    });
    move(btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0]);
    window.addEventListener('resize', function () { move(tabs.querySelector('[aria-selected=true]')); });
  });

  // Barra de Pascal: oculta el texto guía al escribir
  $$('.askbar').forEach(function (b) {
    var input = b.querySelector('input');
    if (input) input.addEventListener('input', function () { b.classList.toggle('has-text', input.value.length > 0); });
  });

  // Chips seleccionables
  $$('.chip[aria-pressed]').forEach(function (c) {
    c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); });
  });

  // Resplandor que sigue el cursor e inclinación leve (solo con mouse)
  if (fine && !reduce) {
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (el.classList.contains('tilt')) {
          el.style.setProperty('--ry', (((e.clientX - r.left) / r.width) - .5) * 6 + 'deg');
          el.style.setProperty('--rx', (.5 - ((e.clientY - r.top) / r.height)) * 6 + 'deg');
        }
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  // FAQ: solo una abierta a la vez dentro del mismo grupo
  $$('.faq[data-single]').forEach(function (g) {
    $$('details', g).forEach(function (det) {
      det.addEventListener('toggle', function () { if (det.open) $$('details', g).forEach(function (o) { if (o !== det) o.open = false; }); });
    });
  });
})();
