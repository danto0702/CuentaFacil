# Builds outlined PascalIA logo SVGs (Montserrat 800 converted to paths) next to the flower mark.
import re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
K = sys.argv[1]
f = TTFont(f'{K}/fuentes/montserrat-latin-800-normal.woff2')
gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
hmtx = f['hmtx']
def text_path(s, size, x0, base, track=-0.03):
    sc = size / upm; x = x0; d = []
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, x, base)))
        d.append(pen.getCommands())
        x += hmtx[g][0] * sc + track * size
    return ' '.join(d), x - track * size
src = open(f'{K}/logos/flor.svg').read()
inner = re.search(r'<svg[^>]*>(.*)</svg>', src, re.S)[1]
def flower(x, y, s, white_veins='#fff'):
    # flor.svg viewBox is -112..112 (224 units)
    return f'<g transform="translate({x} {y}) scale({s/224:.5f}) translate(112 112)">{inner.replace("#fff", white_veins)}</g>'
def write(name, body, w, h, label='PascalIA'):
    open(f'{K}/logos/{name}', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{label}">\n{body}\n</svg>\n')
SIZE = 72
for variant, ink in (('', '#1F1F1F'), ('-blanco', '#FFFFFF'), ('-grafito', '#1F1F1F')):
    # Horizontal: flower 96 + gap 18 + wordmark
    p1, x1 = text_path('Pascal', SIZE, 114, 76)
    p2, x2 = text_path('IA', SIZE, x1 - 0.03 * SIZE, 76)
    ia = '#1F1F1F' if variant == '-grafito' else '#FFC107'
    veins = '#1F1F1F' if variant == '-blanco' else '#fff'
    body = flower(0, 0, 100, veins) + f'<path fill="{ink}" d="{p1}"/><path fill="{ia}" d="{p2}"/>'
    write(f'logo-horizontal{variant}.svg', body, x2 + 4, 100)
    # Vertical: flower centered over wordmark
    pw, xe = text_path('Pascal', SIZE, 0, 0)
    _, xe2 = text_path('IA', SIZE, xe - 0.03 * SIZE, 0)
    W = max(xe2, 180) + 8; ox = (W - xe2) / 2
    p1, x1 = text_path('Pascal', SIZE, ox, 236)
    p2, _ = text_path('IA', SIZE, x1 - 0.03 * SIZE, 236)
    body = flower((W - 160) / 2, 0, 160, veins) + f'<path fill="{ink}" d="{p1}"/><path fill="{ia}" d="{p2}"/>'
    write(f'logo-vertical{variant}.svg', body, W, 256)
    # Wordmark only
    p1, x1 = text_path('Pascal', SIZE, 0, 58)
    p2, x2 = text_path('IA', SIZE, x1 - 0.03 * SIZE, 58)
    write(f'wordmark{variant}.svg', f'<path fill="{ink}" d="{p1}"/><path fill="{ia}" d="{p2}"/>', x2 + 2, 76)
# Flower on dark: veins graphite-coloured so the mark reads on #1F1F1F
write('flor-sobre-oscuro.svg', flower(0, 0, 224, '#1F1F1F'), 224, 224, 'Flor de PascalIA')
print('ok')
