# Generates the 7 scene sub-compositions of "Gracias por confiar" (Halloween → November) with their seek-safe GSAP motion.
# Scenes 1-4 reuse the Halloween look of cuentafacil-halloween; from midnight (scene 5) the PascalIA identity takes over.
import os, json, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(OUT, exist_ok=True)
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
NAMES = ['01-medianoche', '02-terrores', '03-gracias', '04-cuentas', '05-noviembre', '06-asistente', '07-cierre']
DUR = dict(zip(NAMES, T['dur']))
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2C60-2C7F,U+A720-A7FF'
FONTS = f'''
@font-face{{font-family:"Creepster";font-style:normal;font-weight:400;src:url("assets/fonts/Creepster-latin.woff2") format("woff2")}}
@font-face{{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin.woff2") format("woff2");unicode-range:{LATIN}}}
@font-face{{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin-ext.woff2") format("woff2");unicode-range:{EXT}}}
@font-face{{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin.woff2") format("woff2");unicode-range:{LATIN}}}
@font-face{{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin-ext.woff2") format("woff2");unicode-range:{EXT}}}
'''
COMMON = '''
#root{background:radial-gradient(120% 80% at 50% 18%,#3A1D5E 0%,#22113A 45%,#120820 100%);color:#FFF3E0}
.abs{position:absolute}
.creep{font-family:"Creepster",cursive;font-weight:400;letter-spacing:.02em;line-height:.95}
.disp{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;letter-spacing:-.035em}
.txt{font-family:"Geist",sans-serif}
.center{left:60px;right:60px;text-align:center}
.glow{position:absolute;border-radius:50%;filter:blur(90px)}
.char{position:absolute;filter:drop-shadow(0 30px 40px rgba(0,0,0,.55))}
.chip{display:inline-block;padding:14px 30px;border-radius:999px;font:700 34px/1 "Geist",sans-serif;letter-spacing:.2em;text-transform:uppercase}
.chip.t{background:#FF7A1A;color:#1A0B05}
.chip.h{background:#FFC107;color:#1F1405}
.moon{position:absolute;border-radius:50%;background:radial-gradient(circle at 38% 36%,#FFF8DC 0%,#FFE8A3 55%,#F2C866 100%);box-shadow:0 0 120px 40px rgba(255,220,130,.28)}
.moon i{position:absolute;border-radius:50%;background:rgba(200,160,80,.28)}
.star{position:absolute;width:6px;height:6px;border-radius:50%;background:#FFF3E0}
.web{position:absolute;width:360px;height:360px;opacity:.85}
.web path{fill:none;stroke:rgba(235,225,255,.55);stroke-width:2}
.spider{position:absolute;top:0;width:90px}
.spider line{stroke:rgba(235,225,255,.6);stroke-width:2}
.bat{position:absolute;width:120px;fill:#0B0612}
.fog{position:absolute;left:-200px;right:-200px;height:260px;border-radius:50%;background:rgba(190,170,230,.16);filter:blur(40px)}
.ok{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#25D366;vertical-align:-8px;margin-right:12px}
.ok svg{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.spark{position:absolute;width:60px;height:60px}
.spark path{fill:#FFE27A}
'''
CHECK = '<span class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'

# ---------- decoration helpers ----------
def web(id_, corner):
    # corner web drawn for the top-left corner, mirrored for the others via CSS transform
    spokes = 7; rings = [60, 120, 185, 255, 330]
    d = []
    angs = [i * (90 / (spokes - 1)) for i in range(spokes)]
    for a in angs:
        r = math.radians(a); d.append(f'M0 0 L{360*math.cos(r):.1f} {360*math.sin(r):.1f}')
    for R in rings:
        pts = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in angs]
        s = f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            mx, my = (x0 + x1) / 2, (y0 + y1) / 2
            k = 0.86  # sag toward the corner
            s += f' Q{mx*k:.1f} {my*k:.1f} {x1:.1f} {y1:.1f}'
        d.append(s)
    pos = {'tl': 'left:-6px;top:-6px', 'tr': 'right:-6px;top:-6px;transform:scaleX(-1)',
           'bl': 'left:-6px;bottom:-6px;transform:scaleY(-1)', 'br': 'right:-6px;bottom:-6px;transform:scale(-1,-1)'}[corner]
    return f'<svg id="{id_}" class="web" style="{pos}" viewBox="0 0 360 360" data-layout-allow-overflow><path d="{" ".join(d)}"/></svg>'

def spider(id_, x, drop, size=90):
    h = drop + 70
    legs = ''
    for side in (-1, 1):
        for j, (dy, ex, ey) in enumerate([(-10, 40, -28), (-3, 44, -6), (4, 42, 16), (10, 34, 34)]):
            legs += f'<path d="M{45+side*12} {drop+40+dy} Q{45+side*(ex-6)} {drop+30+dy+ey*0.2} {45+side*ex} {drop+40+ey}" stroke="#0B0612" stroke-width="5" fill="none" stroke-linecap="round"/>'
    return (f'<svg id="{id_}" class="spider" style="left:{x}px;width:{size}px" viewBox="0 0 90 {h}" data-layout-allow-overflow>'
            f'<line x1="45" y1="0" x2="45" y2="{drop+20}"/>{legs}'
            f'<ellipse cx="45" cy="{drop+44}" rx="20" ry="24" fill="#0B0612"/><circle cx="45" cy="{drop+22}" r="13" fill="#0B0612"/>'
            f'<circle cx="40" cy="{drop+21}" r="4" fill="#FF7A1A"/><circle cx="50" cy="{drop+21}" r="4" fill="#FF7A1A"/></svg>')

BAT = 'M60 30 C52 18 40 12 26 14 C32 20 32 26 28 30 C20 26 10 28 2 34 C14 36 22 42 26 50 C32 44 40 42 46 46 C50 40 54 38 60 40 C66 38 70 40 74 46 C80 42 88 44 94 50 C98 42 106 36 118 34 C110 28 100 26 92 30 C88 26 88 20 94 14 C80 12 68 18 60 30 Z'
def bat(id_, x, y, w=120, rot=0):
    return f'<svg id="{id_}" class="bat" style="left:{x}px;top:{y}px;width:{w}px;transform:rotate({rot}deg)" viewBox="0 0 120 56"><path d="{BAT}"/></svg>'

def moon(id_, x, y, s):
    return (f'<div id="{id_}" class="moon" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px">'
            f'<i style="left:22%;top:30%;width:18%;height:18%"></i><i style="left:58%;top:52%;width:12%;height:12%"></i><i style="left:46%;top:18%;width:8%;height:8%"></i></div>')

STARS = [(80,120),(210,260),(330,90),(520,180),(700,70),(860,230),(990,140),(150,420),(940,420),(600,330),(420,40),(1020,300)]
def stars(p):
    return ''.join(f'<i class="star {p}-st" style="left:{x}px;top:{y}px;opacity:{0.35 + (i%3)*0.2:.2f}"></i>' for i,(x,y) in enumerate(STARS))

def spark(id_, x, y, s=60):
    return f'<svg id="{id_}" class="spark" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px" viewBox="0 0 24 24"><path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"/></svg>'

def chars(name):
    return f'assets/chars/{name}.webp'


def page(cid, css, body, js=''):
    return f'''<!doctype html>
<html lang="es-CO">
<head><meta charset="UTF-8" /></head>
<body>
<template>
<style>
{FONTS}
#root{{position:absolute;inset:0;overflow:hidden}}
{COMMON}
{css}
</style>
<div id="root" data-composition-id="{cid}" data-width="1080" data-height="1920">
{body}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
{js}
window.__timelines["{cid}"] = tl;
</script>
</template>
</body>
</html>
'''

def deco(p, corners=('tl', 'tr'), spiders=(), bats=(), moon_at=None, fog=True):
    s = stars(p)
    if moon_at: s += moon(f'{p}-moon', *moon_at)
    s += ''.join(web(f'{p}-web{c}', c) for c in corners)
    s += ''.join(spider(f'{p}-sp{i}', x, d) for i, (x, d) in enumerate(spiders))
    s += ''.join(bat(f'{p}-bat{i}', *b) for i, b in enumerate(bats))
    if fog: s += f'<div id="{p}-fog" class="fog" style="bottom:-120px" data-layout-allow-overflow></div>'
    return s

def terror_head(p, n, title, top=150):
    return (f'<div id="{p}-chip" class="abs center" style="top:{top}px"><span class="chip t">Terror {n}</span></div>'
            f'<h2 id="{p}-title" class="abs center creep" style="top:{top+80}px;font-size:118px;color:#FF7A1A;text-shadow:0 6px 0 #4A1A00">{title}</h2>')

def spell_head(p, n, title, top=150):
    return (f'<div id="{p}-chip" class="abs center" style="top:{top}px"><span class="chip h">Hechizo {n}</span></div>'
            f'<h2 id="{p}-title" class="abs center disp" style="top:{top+78}px;font-size:104px;line-height:1;color:#FFF3E0">{title}</h2>')


FONTS += '''
@font-face{font-family:"Montserrat";font-style:normal;font-weight:700;src:url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:800;src:url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-style:normal;font-weight:500;src:url("assets/fonts/inter-latin-500-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-style:normal;font-weight:600;src:url("assets/fonts/inter-latin-600-normal.woff2") format("woff2")}
'''
COMMON += '''
.brand-bg{position:absolute;inset:0;background:radial-gradient(70% 40% at 50% 10%,rgba(255,193,7,.22),transparent 70%),linear-gradient(180deg,#FFF8E1 0%,#FFFDF5 55%,#FFFFFF 100%)}
.mh{font-family:"Montserrat",sans-serif;font-weight:800;letter-spacing:-.02em;color:#1F1F1F;line-height:1.06}
.mk{background:linear-gradient(transparent 58%,#FFC107 58%,#FFC107 90%,transparent 90%) no-repeat 0 0/100% 100%;padding:0 .06em}
.inter{font-family:"Inter",sans-serif}
.cal{position:absolute;border-radius:28px;background:#FFF3E0;color:#2A1208;text-align:center;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}
.cal .top{padding:20px 0;font:800 40px/1 "Montserrat",sans-serif;letter-spacing:.1em;color:#fff}
.cal .d{font:800 190px/1 "Montserrat",sans-serif;padding:26px 0 10px;letter-spacing:-.05em}
.cal .s{font:600 30px/1 "Inter",sans-serif;padding-bottom:30px;color:#7A5A40}
.candy{position:absolute;width:90px;height:46px}
.card-ok{position:absolute;padding:18px 24px;border-radius:20px;background:#FFF3E0;color:#1F1F1F;font:800 32px/1 "Montserrat",sans-serif;box-shadow:0 20px 40px -14px rgba(0,0,0,.6);white-space:nowrap}
.card-ok i{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#FFC107;margin-right:12px;vertical-align:-8px;font-style:normal}
.card-ok svg{width:26px;height:26px;fill:none;stroke:#1F1F1F;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.conf{position:absolute;width:18px;height:30px;border-radius:4px}
'''
TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

def candy(id_, x, y, c1, c2, rot=0, s=1.0):
    return (f'<svg id="{id_}" class="candy" style="left:{x}px;top:{y}px;width:{90*s:.0f}px;height:{46*s:.0f}px;transform:rotate({rot}deg)" viewBox="0 0 90 46" data-layout-allow-overflow>'
            f'<path d="M22 23 L2 6 L6 23 L2 40 Z" fill="{c2}"/><path d="M68 23 L88 6 L84 23 L88 40 Z" fill="{c2}"/>'
            f'<ellipse cx="45" cy="23" rx="25" ry="19" fill="{c1}"/><path d="M33 9 Q45 23 37 39 M48 5 Q58 23 50 41" stroke="{c2}" stroke-width="5" fill="none" opacity=".8"/></svg>')
CANDY_COLS = [('#FF7A1A', '#FFC107'), ('#7C4DFF', '#FF7A1A'), ('#FFC107', '#7C4DFF'), ('#E5484D', '#FFF3E0')]

def clock(id_, style, p):
    nums = ''.join(f'<text x="{100+72*math.sin(math.radians(a)):.1f}" y="{100-72*math.cos(math.radians(a))+9:.1f}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="24" fill="#2A1208">{n}</text>' for n, a in ((12, 0), (3, 90), (6, 180), (9, 270)))
    ticks = ''.join(f'<path d="M{100+86*math.sin(math.radians(a)):.1f} {100-86*math.cos(math.radians(a)):.1f} L{100+92*math.sin(math.radians(a)):.1f} {100-92*math.cos(math.radians(a)):.1f}" stroke="#8B5A2B" stroke-width="3" stroke-linecap="round"/>' for a in range(0, 360, 30))
    return (f'<svg id="{id_}" class="abs" style="{style}" viewBox="0 0 200 200" data-layout-allow-overflow>'
            f'<circle cx="100" cy="100" r="98" fill="#8B5A2B"/><circle cx="100" cy="100" r="90" fill="#FFF3E0"/>{ticks}{nums}'
            f'<g id="{p}-hh"><path d="M95 104 L100 50 L105 104 Z" fill="#2A1208"/></g>'
            f'<g id="{p}-mh"><path d="M97 106 L100 22 L103 106 Z" fill="#E5484D"/></g>'
            f'<circle cx="100" cy="100" r="8" fill="#2A1208"/></svg>')

def flower(id_, style):
    return f'<img id="{id_}" class="abs" style="{style}" src="assets/brand/flower.svg" alt="">'

def k(D, start, per):  # finite repeat count that fits in the scene
    return max(1, int((D - start - .2) / per) - 1)

def ambient(p, D, spiders=0, bats=0, fog=True, moon=False):
    js = f'tl.to(".{p}-st",{{opacity:.12,duration:.7,yoyo:true,repeat:{k(D, 0, .7)},ease:"sine.inOut",stagger:{{each:.18}}}},0);\n'
    js += f'tl.from(`[id^="{p}-web"]`,{{opacity:0,duration:.6,ease:"power2.out",stagger:.08}},0);\n'
    for i in range(spiders):
        js += (f'tl.from("#{p}-sp{i}",{{y:-700,duration:1.1,ease:"bounce.out"}},{0.15 + i*0.35:.2f});\n'
               f'tl.to("#{p}-sp{i}",{{y:-60,duration:.9,yoyo:true,repeat:{max(1, k(D, 1.3 + i*.35, .9))},ease:"sine.inOut"}},{1.3 + i*0.35:.2f});\n')
    for i in range(bats):
        d = -1 if i % 2 else 1
        js += (f'tl.fromTo("#{p}-bat{i}",{{x:{-500*d}}},{{x:{500*d},y:{-120 + 60*i},duration:{D:.2f},ease:"none"}},0);\n'
               f'tl.to("#{p}-bat{i}",{{scaleY:.35,duration:.14,yoyo:true,repeat:{int(D/.14) - 1},ease:"sine.inOut"}},0);\n')
    if fog: js += f'tl.fromTo("#{p}-fog",{{x:-80}},{{x:80,duration:{D:.2f},ease:"none"}},0);\n'
    if moon: js += f'tl.from("#{p}-moon",{{scale:.5,opacity:0,duration:1,ease:"power2.out"}},0.1);\n'
    return js

def bob(sel, D, start, amp=-20, per=.5, rot=0):
    extra = f',rotation:{rot}' if rot else ''
    return f'tl.to("{sel}",{{y:"+={amp}"{extra},duration:{per},yoyo:true,repeat:{k(D, start, per)},ease:"sine.inOut"}},{start});\n'

frames = {}

# ---------- 01 Octubre se despide ----------
D = DUR['01-medianoche']
frames['01-medianoche'] = ('f01-medianoche', '''
#f01-glow{left:190px;top:700px;width:700px;height:700px;background:rgba(255,122,26,.22)}
#f01-chip{top:150px}
#f01-title{top:240px;font-size:150px;color:#FF7A1A;text-shadow:0 7px 0 #4A1A00,0 0 70px rgba(255,122,26,.45)}
#f01-dig{top:1290px;font:800 92px/1 "Montserrat",sans-serif;color:#FFF3E0;letter-spacing:-.02em}
#f01-dig small{font-size:48px;margin-left:8px;color:#FFC9A0}
#f01-peek{left:0;right:0;bottom:-40px;height:440px}
#f01-peek img{position:absolute;bottom:0;filter:brightness(.55) drop-shadow(0 0 30px rgba(0,0,0,.6))}
''', deco('f01', ('tl', 'tr'), spiders=[(140, 300)], bats=[(120, 520, 140, -10), (800, 640, 110, 10)], moon_at=(700, 560, 260)) + f'''
<div id="f01-glow" class="glow" data-layout-allow-overflow></div>
<div id="f01-chip" class="abs center"><span class="chip t">31 de octubre</span></div>
<h1 id="f01-title" class="abs center creep">Octubre<br>se despide</h1>
{clock('f01-clock', 'left:290px;top:720px;width:500px;height:500px', 'f01')}
<p id="f01-dig" class="abs center">11:59<small>p. m.</small></p>
<div id="f01-peek" class="abs" data-layout-allow-overflow>
  <img id="f01-pk1" src="{chars('vampiro')}" style="left:-10px;width:300px" alt="">
  <img id="f01-pk2" src="{chars('momia')}" style="left:390px;width:300px;bottom:-60px" alt="">
  <img id="f01-pk3" src="{chars('fantasma')}" style="left:790px;width:280px;bottom:-30px" alt="">
</div>
''', ambient('f01', D, spiders=1, bats=2, moon=True) + f'''
tl.fromTo("#f01-mh",{{rotation:342}},{{rotation:354,svgOrigin:"100 100",duration:{D - .3:.2f},ease:"steps(3)"}},0);
tl.fromTo("#f01-hh",{{rotation:-1}},{{rotation:-0.5,svgOrigin:"100 100",duration:{D - .3:.2f},ease:"none"}},0);
tl.from("#f01-chip",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0.1);
tl.from("#f01-title",{{opacity:0,scale:1.6,duration:.6,ease:"back.out(1.6)"}},0.3);
tl.from("#f01-clock",{{scale:.3,opacity:0,rotation:-30,duration:.7,ease:"back.out(1.6)"}},0.6);
tl.from("#f01-dig",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},1.1);
tl.to("#f01-dig",{{opacity:.35,duration:.5,yoyo:true,repeat:{k(D, 1.6, .5)},ease:"steps(1)"}},1.6);
tl.from("#f01-peek img",{{y:420,duration:.55,ease:"back.out(1.7)",stagger:.15}},1.4);
tl.to("#f01-peek img",{{y:-20,duration:.45,yoyo:true,repeat:{k(D, 2.2, .45)},ease:"sine.inOut",stagger:.1}},2.2);
tl.fromTo("#f01-glow",{{scale:.85,opacity:.6}},{{scale:1.15,opacity:1,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
''')

# ---------- 02 Terrores vencidos ----------
D = DUR['02-terrores']
frames['02-terrores'] = ('f02-terrores', '''
#f02-glow{left:140px;top:760px;width:800px;height:800px;background:rgba(124,77,255,.22)}
#f02-chip{top:150px}
#f02-title{top:236px;font-size:140px;color:#FF7A1A;text-shadow:0 7px 0 #4A1A00}
#f02-bruja{left:30px;top:640px;width:480px}
#f02-vamp{left:590px;top:600px;width:440px}
#f02-momia{left:20px;top:1180px;width:500px}
#f02-ghost{left:640px;top:1130px;width:390px}
#f02-stamp{left:250px;top:1000px;width:580px;padding:22px 0;border:10px solid #25D366;border-radius:30px;color:#25D366;text-align:center;font:800 76px/1 "Montserrat",sans-serif;letter-spacing:.04em;background:rgba(18,8,32,.72)}
#f02-sub{top:1760px;font:700 50px/1 "Bricolage Grotesque",sans-serif;color:#FFDCC8}
''', deco('f02', ('tl', 'tr'), spiders=[(900, 160)], bats=[(80, 560, 110, -8)], fog=True) + f'''
<div id="f02-glow" class="glow" data-layout-allow-overflow></div>
<div id="f02-chip" class="abs center"><span class="chip t">Este mes</span></div>
<h2 id="f02-title" class="abs center creep">¡Terrores<br>vencidos!</h2>
<img id="f02-bruja" class="char" src="{chars('bruja-dormida')}" alt="">
<img id="f02-vamp" class="char" src="{chars('vampiro-bandera')}" alt="">
<img id="f02-momia" class="char" src="{chars('momia-desenrollada')}" alt="">
<img id="f02-ghost" class="char" src="{chars('fantasma-asustado')}" alt="">
<div id="f02-stamp" class="abs">¡VENCIDOS!</div>
<p id="f02-sub" class="abs center">No pudieron con ustedes</p>
''', ambient('f02', D, spiders=1, bats=1) + f'''
tl.from("#f02-chip",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0.1);
tl.from("#f02-title",{{opacity:0,scale:1.5,rotation:-4,duration:.5,ease:"back.out(1.6)"}},0.25);
tl.from("#f02-bruja",{{x:-600,duration:.55,ease:"power3.out"}},0.5);
tl.from("#f02-vamp",{{x:600,duration:.55,ease:"power3.out"}},0.75);
tl.from("#f02-momia",{{y:700,duration:.55,ease:"back.out(1.4)"}},1.0);
tl.from("#f02-ghost",{{x:600,y:-200,rotation:20,duration:.55,ease:"power3.out"}},1.25);
tl.to("#f02-bruja",{{scaleY:.96,transformOrigin:"50% 100%",duration:.8,yoyo:true,repeat:{k(D, 1.1, .8)},ease:"sine.inOut"}},1.1);
tl.to("#f02-vamp",{{rotation:-4,transformOrigin:"50% 100%",duration:.35,yoyo:true,repeat:{k(D, 1.3, .35)},ease:"sine.inOut"}},1.3);
tl.to("#f02-ghost",{{x:30,duration:.07,yoyo:true,repeat:{k(D, 1.9, .07)},ease:"none"}},1.9);
tl.fromTo("#f02-stamp",{{scale:3,opacity:0,rotation:-14}},{{scale:1,opacity:1,rotation:-8,duration:.35,ease:"power4.in"}},2.0);
tl.to("#f02-stamp",{{scale:1.04,duration:.4,yoyo:true,repeat:{k(D, 2.6, .4)},ease:"sine.inOut"}},2.6);
tl.from("#f02-sub",{{opacity:0,y:40,duration:.45,ease:"power3.out"}},2.5);
tl.fromTo("#f02-glow",{{scale:.85}},{{scale:1.15,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
''')

# ---------- 03 ¡Gracias! ----------
D = DUR['03-gracias']
SW = round(D * 0.42, 2)  # bow → wand swap
CANDIES = [(80, 560, 0, -20), (900, 600, 1, 25), (180, 1450, 2, 15), (860, 1380, 3, -30), (480, 520, 1, 10), (40, 1000, 0, 35), (960, 980, 2, -15)]
CARDS = [(40, 760, -10), (700, 1180, 8), (60, 1580, 6)]
frames['03-gracias'] = ('f03-gracias', '''
#f03-rays{left:-210px;top:350px;width:1500px;height:1500px;opacity:.45}
#f03-glow{left:160px;top:620px;width:760px;height:900px;background:rgba(255,193,7,.32)}
#f03-title{top:110px;font-size:200px;color:#FFC107;text-shadow:0 9px 0 #5A3A00,0 0 70px rgba(255,193,7,.55)}
#f03-sub{top:345px;font-size:58px;line-height:1.08;color:#FFF3E0;text-shadow:0 4px 20px rgba(18,8,32,.8)}
#f03-sub b{color:#FFC107}
#f03-bow{left:230px;top:600px;width:640px}
#f03-wand{left:270px;top:560px;width:560px}
''', deco('f03', ('tl', 'tr'), fog=False) + f'''
<svg id="f03-rays" class="abs" viewBox="-100 -100 200 200" data-layout-allow-overflow>{''.join(f'<path d="M0 0 L{100*math.cos(math.radians(a-4)):.1f} {100*math.sin(math.radians(a-4)):.1f} L{100*math.cos(math.radians(a+4)):.1f} {100*math.sin(math.radians(a+4)):.1f} Z" fill="rgba(255,214,90,.35)"/>' for a in range(0, 360, 24))}</svg>
<div id="f03-glow" class="glow" data-layout-allow-overflow></div>
<h1 id="f03-title" class="abs center creep">¡Gracias!</h1>
<h2 id="f03-sub" class="abs center disp">a cada contratista que<br>confió en <b>CuentaFácil</b></h2>
<img id="f03-bow" class="char" data-layout-allow-overflow src="{chars('mago-reverencia')}" alt="">
<img id="f03-wand" class="char" data-layout-allow-overflow src="{chars('mago-varita')}" alt="">
{''.join(candy(f'f03-c{i}', x, y, *CANDY_COLS[c], rot=r, s=1.2) for i, (x, y, c, r) in enumerate(CANDIES))}
{''.join(f'<div id="f03-ok{i}" class="card-ok" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><i>{TICK}</i>Cuenta lista</div>' for i, (x, y, r) in enumerate(CARDS))}
{spark('f03-k1', 820, 610, 90)}{spark('f03-k2', 760, 520, 60)}{spark('f03-k3', 900, 760, 70)}{spark('f03-k4', 150, 700, 60)}
''', ambient('f03', D, fog=False) + f'''
tl.from("#f03-rays",{{scale:.3,opacity:0,duration:.8,ease:"power2.out"}},0);
tl.to("#f03-rays",{{rotation:40,duration:{D:.2f},ease:"none"}},0);
tl.from("#f03-title",{{opacity:0,scale:3,duration:.55,ease:"back.out(1.5)"}},0.15);
tl.to("#f03-title",{{scale:1.06,duration:.45,yoyo:true,repeat:{k(D, .9, .45)},ease:"sine.inOut"}},0.9);
tl.from("#f03-sub",{{opacity:0,y:40,duration:.5,ease:"power3.out"}},0.6);
tl.from("#f03-bow",{{y:700,duration:.6,ease:"back.out(1.3)"}},0.3);
tl.to("#f03-bow",{{rotation:4,transformOrigin:"50% 100%",duration:.6,yoyo:true,repeat:1,ease:"sine.inOut"}},1.0);
tl.to("#f03-bow",{{opacity:0,scale:.9,transformOrigin:"50% 100%",duration:.2,ease:"power2.in"}},{SW});
tl.fromTo("#f03-wand",{{opacity:0,scale:.85,y:40}},{{opacity:1,scale:1,y:0,transformOrigin:"50% 100%",duration:.4,ease:"back.out(2)"}},{SW + .1});
tl.from(`[id^="f03-k"]`,{{scale:0,rotation:-180,duration:.45,ease:"back.out(3)",stagger:.08}},{SW + .2});
tl.to(`[id^="f03-k"]`,{{scale:.55,rotation:"+=45",duration:.35,yoyo:true,repeat:{k(D, SW + .8, .35)},ease:"sine.inOut",stagger:.06}},{SW + .8});
tl.fromTo(".candy",{{y:-900}},{{y:300,rotation:"+=220",duration:{D - .4:.2f},ease:"none",stagger:.25}},0.2);
tl.from(".card-ok",{{scale:0,opacity:0,rotation:-30,duration:.45,ease:"back.out(2)",stagger:.3}},{SW + .4});
tl.to(".card-ok",{{y:-24,duration:.6,yoyo:true,repeat:{k(D, SW + 1.4, .6)},ease:"sine.inOut",stagger:.15}},{SW + 1.4});
tl.fromTo("#f03-glow",{{scale:.8,opacity:.6}},{{scale:1.2,opacity:1,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
''')

# ---------- 04 Cuentas listas ----------
D = DUR['04-cuentas']
CONF = [(90, '#FFC107'), (220, '#7C4DFF'), (360, '#FF7A1A'), (500, '#FFC107'), (640, '#25D366'), (780, '#7C4DFF'), (920, '#FFC107'), (160, '#FF7A1A'), (430, '#25D366'), (700, '#FFC107'), (990, '#FF7A1A'), (300, '#FFC107')]
frames['04-cuentas'] = ('f04-cuentas', '''
#f04-glow{left:200px;top:500px;width:700px;height:700px;background:rgba(37,211,102,.16)}
#f04-title{top:120px;font-size:86px;line-height:1.02;color:#FFF3E0}
#f04-title b{color:#FFC107}
#f04-phone{left:70px;top:420px;width:520px;border-radius:46px;background:#0B141A;border:9px solid #1F1F1F;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.8)}
.f04-top{display:flex;align-items:center;gap:14px;padding:18px 20px;background:#1F2C34;color:#E9EDEF;font:700 28px/1 "Geist",sans-serif}
.f04-top img{width:52px;height:52px;border-radius:50%}
.f04-top small{display:block;font:500 20px/1.2 "Geist",sans-serif;color:#8696A0;margin-top:4px}
.f04-chat{padding:18px;display:flex;flex-direction:column;gap:12px}
.f04-m{max-width:88%;padding:13px 16px;border-radius:18px;font:500 25px/1.3 "Geist",sans-serif;color:#E9EDEF;background:#1F2C34;align-self:flex-start}
.f04-m.me{background:#005C4B;align-self:flex-end}
#f04-arrow{left:560px;top:690px;width:120px}
#f04-doc{left:660px;top:470px;width:370px;padding:28px 26px 30px;border-radius:24px;background:#FFF3E0;color:#2A1208;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
#f04-doc h4{font:800 30px/1.15 "Montserrat",sans-serif;margin-bottom:14px}
#f04-doc s{display:block;height:12px;border-radius:6px;background:#D9C8B4;margin-top:12px}
#f04-stamp{left:640px;top:820px;padding:16px 22px;border:7px solid #25D366;border-radius:20px;color:#1E8A4C;background:#FFF3E0;font:800 34px/1.05 "Montserrat",sans-serif;text-align:center;transform:rotate(-8deg)}
#f04-crew{left:20px;top:1290px;width:1040px}
''', deco('f04', ('tl', 'tr'), bats=[], fog=False) + f'''
<div id="f04-glow" class="glow" data-layout-allow-overflow></div>
<h2 id="f04-title" class="abs center disp">Cuentas listas,<br><b>sin afán y sin sustos</b></h2>
<div id="f04-phone" class="abs">
  <div class="f04-top"><img src="assets/brand/logo.webp" alt=""><div>Pascal · CuentaFácil<small>en línea</small></div></div>
  <div class="f04-chat">
    <div class="f04-m me" id="f04-m1">Hoy hice la jornada de vacunación 📸</div>
    <div class="f04-m" id="f04-m2">{CHECK}Anotado en tu obligación 2</div>
    <div class="f04-m me" id="f04-m3">🎤 Nota de voz · 0:31</div>
    <div class="f04-m" id="f04-m4">{CHECK}¡Tu cuenta de octubre está lista!</div>
  </div>
</div>
<svg id="f04-arrow" class="abs" viewBox="0 0 120 60"><path d="M6 30 L100 30 M78 10 L104 30 L78 50" stroke="#FFC107" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div id="f04-doc" class="abs"><h4>Informe de actividades · octubre</h4><s></s><s></s><s style="width:70%"></s><s></s><s style="width:55%"></s></div>
<div id="f04-stamp" class="abs">LISTA PARA<br>FIRMAR</div>
<img id="f04-crew" class="char" src="{chars('contratistas')}" alt="">
{''.join(f'<i id="f04-cf{i}" class="conf" style="left:{x}px;top:1180px;background:{c}"></i>' for i, (x, c) in enumerate(CONF))}
''', ambient('f04', D, fog=False) + f'''
tl.from("#f04-title",{{opacity:0,y:-50,duration:.5,ease:"power3.out"}},0.1);
tl.from("#f04-phone",{{x:-640,duration:.55,ease:"power3.out"}},0.3);
tl.from("#f04-m1, #f04-m2, #f04-m3, #f04-m4",{{opacity:0,y:30,scale:.85,duration:.32,ease:"back.out(2)",stagger:.38}},0.8);
tl.from("#f04-arrow",{{opacity:0,x:-40,duration:.35,ease:"power3.out"}},2.0);
tl.from("#f04-doc",{{opacity:0,scale:.6,rotation:8,duration:.45,ease:"back.out(1.8)"}},2.2);
tl.fromTo("#f04-stamp",{{scale:3,opacity:0}},{{scale:1,opacity:1,duration:.3,ease:"power4.in"}},2.8);
tl.from("#f04-crew",{{y:700,duration:.6,ease:"back.out(1.3)"}},1.2);
{bob("#f04-crew", D, 1.9, -18, .4)}
tl.fromTo(".conf",{{y:-250,rotation:0}},{{y:720,rotation:720,duration:{max(2.5, D - 1.4):.2f},ease:"none",stagger:.12}},1.2);
tl.to("#f04-arrow",{{x:16,duration:.3,yoyo:true,repeat:{k(D, 2.4, .3)},ease:"sine.inOut"}},2.4);
''')

# ---------- 05 Medianoche: noviembre ya empieza ----------
D = DUR['05-noviembre']
MID = 1.6  # the twelfth stroke
SMOKE = [(80, 1100, 420), (600, 1050, 460), (300, 1250, 560), (-60, 1400, 480), (700, 1420, 500), (380, 900, 380)]
frames['05-noviembre'] = ('f05-noviembre', '''
#f05-night{inset:0;background:radial-gradient(120% 80% at 50% 18%,#3A1D5E 0%,#22113A 45%,#120820 100%)}
#f05-flash{inset:0;background:#FFF6D6;opacity:0}
#f05-cal-nov{left:600px;top:150px;width:400px}
#f05-cal-nov .top{background:#FFC107;color:#1F1F1F}
#f05-cal-oct{left:600px;top:150px;width:400px}
#f05-cal-oct .top{background:#E5484D}
.f05-dong{position:absolute;font-size:96px;color:#FFC107;text-shadow:0 5px 0 #5A3A00}
.f05-smk{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(235,225,255,.9),rgba(235,225,255,0) 70%)}
#f05-flor{left:90px;top:520px;width:900px;height:900px;opacity:.16}
#f05-pascal{left:150px;top:640px;width:780px}
#f05-title{top:1690px}
#f05-title b{font-size:96px}
''', f'''
<div class="brand-bg"></div>
{flower('f05-flor', '')}
<div id="f05-night" class="abs">{deco('f05', ('tl',), bats=[(160, 700, 120, -8), (760, 540, 100, 10)], fog=False)}</div>
{clock('f05-clock', 'left:90px;top:150px;width:380px;height:380px', 'f05')}
<div id="f05-cal-nov" class="cal"><div class="top">NOVIEMBRE</div><div class="d">1</div><div class="s">¡arranca el mes!</div></div>
<div id="f05-cal-oct" class="cal"><div class="top">OCTUBRE</div><div class="d">31</div><div class="s">último día</div></div>
<p id="f05-d1" class="f05-dong creep" style="left:470px;top:150px">¡Dong!</p>
<p id="f05-d2" class="f05-dong creep" style="left:440px;top:330px">¡Dong!</p>
<p id="f05-d3" class="f05-dong creep" style="left:60px;top:560px">¡Dong!</p>
<img id="f05-pascal" class="char" data-layout-allow-overflow src="{chars('pascal-transforma')}" alt="">
{''.join(f'<div id="f05-s{i}" class="f05-smk" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px" data-layout-allow-overflow></div>' for i, (x, y, s) in enumerate(SMOKE))}
<h2 id="f05-title" class="abs center mh" style="font-size:80px">y <span class="mk">noviembre</span><br><b>ya empieza</b></h2>
<div id="f05-flash" class="abs"></div>
''', ambient('f05', D, bats=2, fog=False) + f'''
tl.fromTo("#f05-mh",{{rotation:354}},{{rotation:360,svgOrigin:"100 100",duration:{MID - .2:.2f},ease:"steps(2)"}},0);
tl.fromTo("#f05-hh",{{rotation:-0.5}},{{rotation:0,svgOrigin:"100 100",duration:{MID - .2:.2f},ease:"none"}},0);
tl.from("#f05-clock",{{scale:.4,opacity:0,duration:.45,ease:"back.out(1.8)"}},0);
tl.from("#f05-cal-oct",{{scale:.4,opacity:0,duration:.45,ease:"back.out(1.8)"}},0.15);
tl.from(".f05-dong",{{opacity:0,scale:2.4,duration:.25,ease:"back.out(2)",stagger:.45}},0.3);
tl.to(".f05-dong",{{opacity:0,duration:.3,stagger:.45}},0.75);
tl.to("#f05-clock",{{rotation:6,transformOrigin:"50% 50%",duration:.06,yoyo:true,repeat:11,ease:"none"}},{MID - .4:.2f});
tl.fromTo("#f05-flash",{{opacity:0}},{{opacity:1,duration:.12,ease:"none"}},{MID:.2f});
tl.to("#f05-flash",{{opacity:0,duration:.6,ease:"power1.out"}},{MID + .12:.2f});
tl.to("#f05-night",{{opacity:0,duration:.25,ease:"none"}},{MID + .05:.2f});
tl.to("#f05-cal-oct",{{rotation:-28,y:700,x:-160,transformOrigin:"0% 0%",duration:.7,ease:"power2.in"}},{MID + .2:.2f});
tl.to("#f05-cal-oct",{{opacity:0,duration:.3,ease:"none"}},{MID + .5:.2f});
tl.fromTo("#f05-cal-nov",{{opacity:0}},{{opacity:1,duration:.25,ease:"none"}},{MID + .45:.2f});
tl.from(".f05-smk",{{scale:.2,opacity:0,duration:.3,ease:"power2.out",stagger:.04}},{MID:.2f});
tl.to(".f05-smk",{{scale:1.9,opacity:0,duration:1.3,ease:"power1.out",stagger:.04}},{MID + .35:.2f});
tl.fromTo("#f05-pascal",{{opacity:0,scale:.3,y:200}},{{opacity:1,scale:1,y:0,transformOrigin:"50% 100%",duration:.6,ease:"back.out(1.6)"}},{MID + .15:.2f});
{bob("#f05-pascal", D, MID + 1.0, -14, .5)}
tl.to("#f05-flor",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#f05-flor",{{opacity:0,duration:.6}},{MID:.2f});
tl.from("#f05-title",{{opacity:0,y:60,duration:.5,ease:"power3.out"}},{MID + .7:.2f});
tl.fromTo("#f05-title .mk",{{backgroundSize:"0% 100%"}},{{backgroundSize:"100% 100%",duration:.8,ease:"power2.out"}},{MID + 1.1:.2f});
''')

# ---------- 06 Tu asistente en noviembre ----------
D = DUR['06-asistente']
STEPS = [('Cuéntame tu día', 'texto, foto o nota de voz por WhatsApp', 'M20.5 11.5a8.5 8.5 0 01-12.3 7.6L3.5 20.5l1.4-4.5a8.5 8.5 0 1115.6-4.5z'),
         ('Ordeno tus soportes', 'cada actividad, en su obligación', 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z'),
         ('Tu cuenta, lista', 'al cierre, para revisar y firmar', 'M5 12.5l4.5 4.5L19 7.5')]
frames['06-asistente'] = ('f06-asistente', '''
#f06-flor{left:300px;top:380px;width:1000px;height:1000px;opacity:.12}
#f06-title{top:130px;font-size:90px}
#f06-pascal{left:0px;top:560px;width:480px;filter:drop-shadow(0 30px 40px rgba(31,31,31,.25))}
.f06-step{position:absolute;left:470px;width:570px;display:flex;gap:22px;align-items:flex-start;padding:30px 28px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9,0 16px 40px rgba(31,31,31,.10)}
.f06-step i{flex:none;display:grid;place-items:center;width:84px;height:84px;border-radius:50%;background:#FFC107}
.f06-step svg{width:46px;height:46px;fill:none;stroke:#1F1F1F;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.f06-step b{display:block;font:800 42px/1.1 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.01em}
.f06-step span{display:block;margin-top:8px;font:500 30px/1.3 "Inter",sans-serif;color:#5C5C5C}
#f06-pill{left:470px;top:1620px;width:570px;text-align:center;padding:22px 0;border-radius:999px;background:#1F1F1F;color:#fff;font:700 36px/1 "Montserrat",sans-serif}
#f06-pill em{font-style:normal;color:#FFC107}
''', f'''
<div class="brand-bg"></div>
{flower('f06-flor', '')}
<h2 id="f06-title" class="abs center mh">Tu asistente<br>en <span class="mk">noviembre</span></h2>
<img id="f06-pascal" class="abs" src="{chars('pascal-celular')}" alt="">
{''.join(f'<div id="f06-st{i}" class="f06-step" style="top:{640 + i*300}px"><i><svg viewBox="0 0 24 24"><path d="{d}"/></svg></i><div><b>{t}</b><span>{s}</span></div></div>' for i, (t, s, d) in enumerate(STEPS))}
<div id="f06-pill" class="abs">El último día, <em>sin afán</em></div>
''', f'''
tl.to("#f06-flor",{{rotation:50,duration:{D:.2f},ease:"none"}},0);
tl.from("#f06-title",{{opacity:0,y:-50,duration:.5,ease:"power3.out"}},0.1);
tl.fromTo("#f06-title .mk",{{backgroundSize:"0% 100%"}},{{backgroundSize:"100% 100%",duration:.8,ease:"power2.out"}},0.5);
tl.from("#f06-pascal",{{x:-560,duration:.6,ease:"power3.out"}},0.3);
tl.to("#f06-pascal",{{rotation:2,transformOrigin:"50% 100%",duration:.7,yoyo:true,repeat:{k(D, 1.0, .7)},ease:"sine.inOut"}},1.0);
tl.from(".f06-step",{{opacity:0,x:120,duration:.5,ease:"power3.out",stagger:{min(1.2, (D - 3) / 3):.2f}}},0.9);
tl.from(".f06-step i",{{scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)",stagger:{min(1.2, (D - 3) / 3):.2f}}},1.1);
tl.from("#f06-pill",{{opacity:0,y:40,duration:.45,ease:"back.out(1.8)"}},{D - 1.6:.2f});
''')

# ---------- 07 Cierre ----------
D = DUR['07-cierre']
frames['07-cierre'] = ('f07-cierre', '''
#f07-flor{left:-260px;top:1100px;width:900px;height:900px;opacity:.13}
#f07-title{top:120px;font-size:82px}
#f07-qr{left:470px;top:500px;width:560px;padding:40px 40px 24px;border-radius:44px;background:#fff;text-align:center;box-shadow:inset 0 0 0 2px #E9E9E9,0 30px 60px -24px rgba(31,31,31,.3)}
#f07-qrc{position:relative;width:480px;height:480px}
#f07-qrc > img:first-child{display:block;width:100%;height:100%}
#f07-qrlogo{position:absolute;left:50%;top:50%;width:138px;height:138px;margin:-69px 0 0 -69px;border-radius:40px;box-shadow:0 0 0 10px #fff}
#f07-cap{margin-top:22px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#f07-brand{left:470px;top:1200px;width:560px;text-align:center}
#f07-brand b{display:block;font:800 78px/1 "Montserrat",sans-serif;letter-spacing:-.03em;color:#1F1F1F}
#f07-brand span{display:inline-flex;align-items:center;gap:14px;margin-top:18px;padding:12px 26px 12px 16px;border-radius:999px;background:#1F1F1F;font:700 40px/1 "Montserrat",sans-serif;color:#fff}
#f07-brand img{width:54px;height:54px}
#f07-brand i{font-style:normal;color:#FFC107}
#f07-pascal{left:10px;top:540px;width:420px;filter:drop-shadow(0 30px 40px rgba(31,31,31,.25))}
#f07-thanks{left:470px;width:560px;top:1420px;text-align:center;padding:24px 20px;border-radius:30px;background:#1F1F1F;color:#fff;font:800 40px/1.2 "Montserrat",sans-serif}
#f07-thanks em{font-style:normal;color:#FFC107}
#f07-pump{left:880px;top:1660px;width:150px}
''', f'''
<div class="brand-bg"></div>
{flower('f07-flor', '')}
<h2 id="f07-title" class="abs center mh">Empieza tu cuenta<br>de <span class="mk">noviembre</span></h2>
<img id="f07-pascal" class="abs" src="{chars('pascal-senala')}" alt="">
<div id="f07-qr" class="abs"><div id="f07-qrc"><img src="assets/brand/qr.svg" alt=""><img id="f07-qrlogo" src="assets/brand/logo.webp" alt=""></div><p id="f07-cap">Escanéame y empieza</p></div>
<div id="f07-brand" class="abs"><b>CuentaFácil</b><span><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">de Pascal<i>IA</i></em></span></div>
<p id="f07-thanks" class="abs">¡Gracias por <em>confiar</em><br>en Pascal!</p>
{candy('f07-pump', 880, 1660, '#FF7A1A', '#FFC107', rot=-12, s=1.7)}
''', f'''
tl.to("#f07-flor",{{rotation:45,duration:{D:.2f},ease:"none"}},0);
tl.from("#f07-title",{{opacity:0,y:-50,duration:.5,ease:"power3.out"}},0.1);
tl.fromTo("#f07-title .mk",{{backgroundSize:"0% 100%"}},{{backgroundSize:"100% 100%",duration:.8,ease:"power2.out"}},0.5);
tl.from("#f07-pascal",{{x:-520,duration:.6,ease:"power3.out"}},0.3);
tl.from("#f07-qr",{{scale:.4,opacity:0,rotation:-8,duration:.6,ease:"back.out(1.8)"}},0.6);
tl.to("#f07-qr",{{scale:1.03,duration:.5,yoyo:true,repeat:{k(D, 1.6, .5)},ease:"sine.inOut"}},1.6);
tl.from("#f07-brand",{{opacity:0,y:50,duration:.5,ease:"power3.out"}},1.1);
tl.from("#f07-thanks",{{opacity:0,y:50,scale:.9,duration:.5,ease:"back.out(1.8)"}},1.8);
tl.from("#f07-pump",{{opacity:0,scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)"}},2.3);
tl.to("#f07-pascal",{{rotation:3,transformOrigin:"50% 100%",duration:.5,yoyo:true,repeat:{k(D, 2.4, .5)},ease:"sine.inOut"}},2.4);
''')

for name, (cid, css, body, js) in frames.items():
    open(os.path.join(OUT, name + '.html'), 'w').write(page(cid, css, body, js))
print('wrote', len(frames))
