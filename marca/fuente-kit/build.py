# Assembles guia-visual.html and plantillas/plantilla-pagina.html: inlines the icon sprite and the flower.
import re, sys, os
K, SRC = sys.argv[1], sys.argv[2]
sprite = open(f'{K}/iconos/iconos.svg').read()
if 'id="plus"' not in sprite:
    sprite = sprite.replace('</svg>', '  <symbol id="plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>\n</svg>')
    open(f'{K}/iconos/iconos.svg', 'w').write(sprite)
    open(f'{K}/iconos/svg/plus.svg', 'w').write('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>\n')
symbols = re.findall(r'<symbol id="([^"]+)" viewBox="0 0 24 24">.*?</symbol>', sprite, re.S)
sym_xml = '\n'.join(re.findall(r'<symbol .*?</symbol>', sprite, re.S))
flor = open(f'{K}/logos/flor.svg').read()
finner = re.search(r'<svg[^>]*>(.*)</svg>', flor, re.S)[1].strip()
# give node circles a class so the motion CSS can pulse them
fnodes = finner.replace('<g fill="#fff">', '<g class="flor-nodes" fill="#fff">')
fsym = re.sub(r'id="(petal|vein)"', r'id="f-\1"', finner).replace('href="#petal"', 'href="#f-petal"').replace('href="#vein"', 'href="#f-vein"')
fnodes = re.sub(r'id="(petal|vein)"', r'id="h-\1"', fnodes).replace('href="#petal"', 'href="#h-petal"').replace('href="#vein"', 'href="#h-vein"')
SPRITE = f'<svg class="sr-only" aria-hidden="true" focusable="false">\n<symbol id="flor" viewBox="-112 -112 224 224">{fsym}</symbol>\n{sym_xml}\n</svg>'
HERO = f'<svg class="hero-flor flor-spin" viewBox="-112 -112 224 224">{fnodes}</svg>'
CLOSE = '<svg class="close-flor flor-spin reveal" aria-hidden="true" style="justify-self:center"><use href="#flor"/></svg>'
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def cr(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
SW = [('yellow','#FFC107','Acción'),('yellow-hover','#FFB300','Hover'),('yellow-soft','#FFD54F','Selección'),('gold-ink','#8A6100','Amarillo legible'),
      ('graphite','#1F1F1F','Texto · resultado'),('graphite-deep','#181818','Pie'),('muted','#5C5C5C','Texto secundario'),('gray','#E9E9E9','Hairline'),
      ('cream','#FFF8E1','Calidez'),('cream-line','#F3E7BE','Hairline crema'),('white','#FFFFFF','Aire')]
sw = ''
for n, h, use in SW:
    ink = '#1F1F1F' if lum(h) > .18 else '#FFFFFF'
    sw += (f'<div class="sw"><div class="sw-c" style="background:{h};color:{ink};box-shadow:inset 0 -1px 0 var(--gray)">{use}</div>'
           f'<div class="sw-t"><b>{n}</b><code>{h} · --{n}</code><code>vs blanco {cr(h,"#FFFFFF"):.1f}:1 · vs grafito {cr(h,"#1F1F1F"):.1f}:1</code></div></div>\n')
icons = ''.join(f'<div><svg class="i" aria-hidden="true"><use href="#{s}"/></svg>{s}</div>' for s in symbols + ['plus'] if s)
icons = ''.join(dict.fromkeys(re.findall(r'<div>.*?</div>', icons)))
for src, dst in (('guia.html', f'{K}/guia-visual.html'), ('plantilla.html', f'{K}/plantillas/plantilla-pagina.html')):
    t = open(f'{SRC}/{src}').read()
    t = t.replace('<!--SPRITE-->', SPRITE).replace('<!--FLOR_HERO-->', HERO).replace('<!--FLOR_CLOSE-->', CLOSE).replace('<!--SWATCHES-->', sw).replace('<!--ICONS-->', icons)
    open(dst, 'w').write(t)
print(len(symbols), 'icons')
for n,h,_ in SW: print(n, f'{cr(h,"#FFFFFF"):.2f}', f'{cr(h,"#1F1F1F"):.2f}')
