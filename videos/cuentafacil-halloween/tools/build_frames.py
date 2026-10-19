# Generates the 11 scene sub-compositions (compositions/frames/NN-*.html) from one shared Halloween style.
import os, json, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(OUT, exist_ok=True)

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

# illustrated family/friends (flat figures, no real people)
PEOPLE = [('#8D5524', '#FF7A1A'), ('#E0AC69', '#7C4DFF'), ('#C68642', '#25D366'), ('#F1C27D', '#E5484D'), ('#A0522D', '#FFC107'), ('#FFDBAC', '#38BDF8')]
def person(cx, base, scale, skin, shirt, hair='#2B1A10', smile=True):
    s = scale
    m = f'<path d="M{cx-9*s:.0f} {base-150*s:.0f} Q{cx:.0f} {base-140*s:.0f} {cx+9*s:.0f} {base-150*s:.0f}" stroke="#3B1F0E" stroke-width="{3*s:.1f}" fill="none" stroke-linecap="round"/>' if smile else ''
    return (f'<rect x="{cx-38*s:.0f}" y="{base-110*s:.0f}" width="{76*s:.0f}" height="{110*s:.0f}" rx="{30*s:.0f}" fill="{shirt}"/>'
            f'<circle cx="{cx:.0f}" cy="{base-160*s:.0f}" r="{34*s:.0f}" fill="{skin}"/>'
            f'<path d="M{cx-34*s:.0f} {base-165*s:.0f} Q{cx:.0f} {base-215*s:.0f} {cx+34*s:.0f} {base-165*s:.0f} Q{cx:.0f} {base-185*s:.0f} {cx-34*s:.0f} {base-165*s:.0f}Z" fill="{hair}"/>'
            f'<circle cx="{cx-12*s:.0f}" cy="{base-163*s:.0f}" r="{4*s:.1f}" fill="#1B0F0A"/><circle cx="{cx+12*s:.0f}" cy="{base-163*s:.0f}" r="{4*s:.1f}" fill="#1B0F0A"/>{m}')

def family_photo(id_, style):
    figs = ''.join(person(70 + i * 72, 250, 0.62 if i % 2 else 0.78, *PEOPLE[i]) for i in range(5))
    return (f'<svg id="{id_}" class="abs" style="{style}" viewBox="0 0 440 300">'
            f'<rect x="6" y="6" width="428" height="288" rx="18" fill="#FFF3E0" stroke="#8B5A2B" stroke-width="12"/>'
            f'<rect x="22" y="22" width="396" height="256" rx="8" fill="#FFD9A0"/>'
            f'<circle cx="360" cy="70" r="30" fill="#FFF0B3"/>{figs}</svg>')

def table_scene(id_, style, full):
    # long table seen from the front; chairs empty or with people
    out = f'<svg id="{id_}" class="abs" style="{style}" viewBox="0 0 960 520">'
    xs = [120, 280, 440, 600, 760, 880]
    for i, x in enumerate(xs[:5]):
        cx = x + 40
        out += f'<rect x="{cx-50}" y="150" width="100" height="200" rx="16" fill="#5B3A1E"/>'
        if full:
            out += f'<g class="{id_}-p">{person(cx, 340, 1.05, *PEOPLE[i])}</g>'
    out += '<rect x="20" y="320" width="920" height="46" rx="14" fill="#8B5A2B"/><rect x="60" y="366" width="34" height="150" fill="#6B4320"/><rect x="866" y="366" width="34" height="150" fill="#6B4320"/>'
    # food and cups
    out += '<ellipse cx="300" cy="316" rx="70" ry="16" fill="#FFF3E0"/><circle cx="300" cy="298" r="26" fill="#FF7A1A"/><rect x="520" y="276" width="34" height="42" rx="6" fill="#FFF3E0"/><rect x="640" y="282" width="30" height="36" rx="6" fill="#FFC107"/><ellipse cx="760" cy="316" rx="60" ry="14" fill="#FFF3E0"/><path d="M720 312 Q760 270 800 312Z" fill="#E5484D"/>'
    return out + '</svg>'

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

frames = {}

# ---------- 01 Noche de terror ----------
frames['01-noche'] = ('f01-noche', '''
#f01-glow{left:140px;top:820px;width:800px;height:500px;background:rgba(255,122,26,.22)}
#f01-k1{top:560px;font-size:96px;color:#FFF3E0}
#f01-num{top:660px;font-size:420px;color:#FF7A1A;text-shadow:0 10px 0 #4A1A00,0 0 80px rgba(255,122,26,.5)}
#f01-k2{top:1060px;font-size:120px;color:#FF7A1A;text-shadow:0 6px 0 #4A1A00}
#f01-peek{left:0;right:0;bottom:-40px;height:470px}
#f01-peek img{position:absolute;bottom:0;filter:brightness(.55) drop-shadow(0 0 30px rgba(0,0,0,.6))}
#f01-flash{inset:0;background:#E8DDFF;opacity:0}
''', deco('f01', ('tl', 'tr'), spiders=[(150, 250), (860, 380)], bats=[(120, 380, 150, -10), (780, 520, 120, 12), (560, 300, 90, 4)], moon_at=(640, 110, 300)) + f'''
<div id="f01-glow" class="glow" data-layout-allow-overflow></div>
<p id="f01-k1" class="abs center creep">Los</p>
<p id="f01-num" class="abs center creep">5</p>
<h1 id="f01-k2" class="abs center creep">terrores del<br>contratista</h1>
<div id="f01-peek" class="abs" data-layout-allow-overflow>
  <img id="f01-pk1" src="{chars('vampiro')}" style="left:-20px;width:300px" alt="">
  <img id="f01-pk2" src="{chars('momia')}" style="left:230px;width:290px;bottom:-60px" alt="">
  <img id="f01-pk3" src="{chars('fantasma')}" style="left:470px;width:280px;bottom:-30px" alt="">
  <img id="f01-pk4" src="{chars('pirata')}" style="left:760px;width:320px;bottom:-50px" alt="">
</div>
<div id="f01-flash" class="abs"></div>
''')

# ---------- 02 Bruja del último día ----------
FLAME = 'M50 120 C10 100 8 60 30 30 C32 50 42 56 48 50 C40 30 52 10 70 0 C66 24 92 40 92 72 C92 100 74 120 50 120 Z'
frames['02-bruja'] = ('f02-bruja', f'''
#f02-glow{{left:180px;top:700px;width:720px;height:720px;background:rgba(229,72,77,.25)}}
#f02-cal{{left:90px;top:860px;width:430px;border-radius:30px;background:#FFF3E0;color:#2A1208;text-align:center;overflow:visible;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}}
#f02-cal .top{{background:#E5484D;color:#fff;border-radius:30px 30px 0 0;padding:22px 0;font:700 40px/1 "Geist",sans-serif;letter-spacing:.14em}}
#f02-cal .d{{font:800 120px/1 "Bricolage Grotesque",sans-serif;padding:30px 0 6px;letter-spacing:-.04em}}
#f02-cal .s{{font:600 34px/1 "Geist",sans-serif;padding-bottom:34px;color:#7A3A20}}
.f02-fl{{position:absolute;width:110px}}
.f02-fl path{{fill:#FF7A1A}}
.f02-fl path+path{{fill:#FFC107}}
#f02-clock{{left:110px;top:1430px;padding:22px 40px;border-radius:24px;background:#120820;border:3px solid #E5484D;font:800 78px/1 "Bricolage Grotesque",sans-serif;color:#FF6B6B;letter-spacing:-.02em}}
#f02-clock small{{font-size:40px;margin-left:10px}}
#f02-witch{{left:520px;top:720px;width:540px}}
''', deco('f02', ('tl', 'tr'), spiders=[(900, 120)], bats=[(80, 560, 130, -8), (820, 1450, 110, 10)], moon_at=(760, 400, 220)) + terror_head('f02', 1, 'La bruja del<br>último día') + f'''
<div id="f02-glow" class="glow" data-layout-allow-overflow></div>
<div id="f02-cal" class="abs" data-layout-allow-overflow>
  <div class="top">FECHA LÍMITE</div><div class="d">¡HOY!</div><div class="s">último día para entregar</div>
  <svg class="f02-fl" style="left:-40px;top:-118px" viewBox="0 0 100 120"><path d="{FLAME}"/><path d="{FLAME}" transform="translate(20 34) scale(.6)"/></svg>
  <svg class="f02-fl" style="left:150px;top:-150px;width:130px" viewBox="0 0 100 120"><path d="{FLAME}"/><path d="{FLAME}" transform="translate(20 34) scale(.6)"/></svg>
  <svg class="f02-fl" style="left:350px;top:-112px" viewBox="0 0 100 120"><path d="{FLAME}"/><path d="{FLAME}" transform="translate(20 34) scale(.6)"/></svg>
</div>
<div id="f02-clock" class="abs">11:59<small>p. m.</small></div>
<img id="f02-witch" class="char" src="{chars('bruja')}" alt="">
''')

# ---------- 03 Vampiro de las horas ----------
frames['03-vampiro'] = ('f03-vampiro', f'''
#f03-glow{{left:160px;top:720px;width:760px;height:760px;background:rgba(229,72,77,.22)}}
#f03-vamp{{left:420px;top:700px;width:600px}}
#f03-hg{{left:80px;top:880px;width:330px}}
#f03-straw{{left:300px;top:930px;width:330px}}
#f03-count{{left:70px;top:1500px;padding:24px 38px;border-radius:26px;background:#120820;border:3px solid #E5484D}}
#f03-count b{{display:block;font:800 120px/1 "Bricolage Grotesque",sans-serif;color:#FF6B6B;letter-spacing:-.04em}}
#f03-count span{{font:600 38px/1.2 "Geist",sans-serif;color:#FFDCC8}}
''', deco('f03', ('tl', 'tr'), spiders=[(140, 160)], bats=[(820, 560, 120, 8), (60, 640, 100, -12)]) + terror_head('f03', 2, 'El vampiro<br>de las horas') + f'''
<div id="f03-glow" class="glow" data-layout-allow-overflow></div>
<svg id="f03-hg" class="abs" viewBox="0 0 200 300">
  <rect x="10" y="0" width="180" height="22" rx="8" fill="#8B5A2B"/><rect x="10" y="278" width="180" height="22" rx="8" fill="#8B5A2B"/>
  <path d="M30 22 L170 22 C170 90 112 120 106 150 C112 180 170 210 170 278 L30 278 C30 210 88 180 94 150 C88 120 30 90 30 22 Z" fill="rgba(235,225,255,.18)" stroke="#EDE6FF" stroke-width="5"/>
  <path id="f03-sandtop" d="M52 60 L148 60 C140 96 112 118 100 140 C88 118 60 96 52 60 Z" fill="#FFC107"/>
  <path id="f03-sandbot" d="M48 272 L152 272 C150 248 120 236 100 220 C80 236 50 248 48 272 Z" fill="#FFC107"/>
</svg>
<svg id="f03-straw" class="abs" viewBox="0 0 330 120"><path d="M10 100 L200 40 L320 30" stroke="#E5484D" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M10 100 L200 40 L320 30" stroke="#fff" stroke-width="16" fill="none" stroke-dasharray="18 22" stroke-linecap="butt"/></svg>
<img id="f03-vamp" class="char" src="{chars('vampiro')}" alt="">
<div id="f03-count" class="abs"><b id="f03-num">−8 h</b><span>de trabajo, chupadas</span></div>
''')

# ---------- 04 Ladrón del domingo ----------
frames['04-ladron'] = ('f04-ladron', f'''
#f04-glow{{left:120px;top:640px;width:840px;height:600px;background:rgba(255,122,26,.18)}}
#f04-pirate{{left:430px;top:560px;width:560px}}
#f04-photo{{left:110px;top:640px;width:420px;transform:rotate(-10deg)}}
#f04-tbl{{left:60px;top:1230px;width:960px}}
#f04-empty{{top:1770px;font:600 44px/1 "Geist",sans-serif;color:#FFDCC8}}
''', deco('f04', ('tl', 'tr'), spiders=[(880, 200)], bats=[(100, 520, 110, -6)]) + terror_head('f04', 3, 'El ladrón<br>del domingo') + f'''
<div id="f04-glow" class="glow" data-layout-allow-overflow></div>
{table_scene('f04-tbl', '', False)}
{family_photo('f04-photo', '')}
<img id="f04-pirate" class="char" src="{chars('pirata')}" alt="">
<p id="f04-empty" class="abs center">Sin tiempo para tu familia ni tus amigos</p>
''')

# ---------- 05 Momias del papeleo ----------
DOCS = [('PDF', '#E5484D', 80, 700, -14), ('Planilla', '#25D366', 640, 640, 12), ('Soporte', '#7C4DFF', 760, 1520, -8), ('Firma', '#FF7A1A', 60, 1480, 10), ('Informe', '#38BDF8', 420, 560, 6)]
def doc(i, label, col, x, y, r):
    return (f'<div id="f05-d{i}" class="abs f05-doc" style="left:{x}px;top:{y}px;transform:rotate({r}deg)">'
            f'<i style="background:{col}">{label}</i><s></s><s></s><s style="width:60%"></s></div>')
frames['05-momias'] = ('f05-momias', '''
#f05-glow{left:140px;top:820px;width:800px;height:700px;background:rgba(235,225,255,.14)}
#f05-m1{left:90px;top:900px;width:520px}
#f05-m2{left:600px;top:1000px;width:400px}
.f05-doc{width:250px;padding:22px;border-radius:18px;background:#FFF3E0;box-shadow:0 20px 40px -14px rgba(0,0,0,.7)}
.f05-doc i{display:inline-block;padding:8px 16px;border-radius:10px;color:#fff;font:700 32px/1 "Geist",sans-serif;font-style:normal;margin-bottom:14px}
.f05-doc s{display:block;height:12px;border-radius:6px;background:#D9C8B4;margin-top:12px}
''', deco('f05', ('tl', 'tr'), spiders=[(160, 120), (900, 260)], bats=[(820, 1700, 100, 10)]) + terror_head('f05', 4, 'Las momias<br>del papeleo') + f'''
<div id="f05-glow" class="glow" data-layout-allow-overflow></div>
{''.join(doc(i, *d) for i, d in enumerate(DOCS))}
<img id="f05-m1" class="char" src="{chars('momia')}" alt="">
<img id="f05-m2" class="char" src="{chars('momia-redonda')}" alt="">
''')

# ---------- 06 Trabajo fantasma ----------
ACTS = ['Capacitación al personal', 'Visita de seguimiento', 'Informe de casos', 'Reunión de equipo', 'Jornada de salud']
frames['06-fantasma'] = ('f06-fantasma', f'''
#f06-glow{{left:120px;top:700px;width:840px;height:800px;background:rgba(200,180,255,.20)}}
#f06-ghost{{left:610px;top:640px;width:430px}}
#f06-list{{left:70px;top:620px;width:580px;padding:36px 38px;border-radius:30px;background:rgba(255,243,224,.96);color:#2A1208;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}}
#f06-list h3{{font:800 46px/1.1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em;margin-bottom:18px}}
.f06-it{{display:flex;align-items:center;gap:16px;padding:16px 0;border-top:2px dashed #E3D2BE;font:600 36px/1.2 "Geist",sans-serif}}
.f06-it i{{flex:none;width:30px;height:30px;border-radius:50%;background:#FF7A1A}}
#f06-vs{{left:60px;right:60px;top:1420px;display:flex;justify-content:center;gap:40px;text-align:center}}
#f06-vs div{{padding:26px 34px;border-radius:26px;background:#120820;border:3px solid #6B5B95;min-width:400px}}
#f06-vs b{{display:block;font:800 110px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.04em}}
#f06-vs span{{font:600 34px/1.2 "Geist",sans-serif;color:#E9DDFF}}
''', deco('f06', ('tl', 'tr'), spiders=[(880, 140)], bats=[(80, 1720, 110, -8)], moon_at=(90, 380, 160)) + terror_head('f06', 5, 'El trabajo<br>fantasma') + f'''
<div id="f06-glow" class="glow" data-layout-allow-overflow></div>
<div id="f06-list" class="abs"><h3>Lo que hiciste este mes</h3>{''.join(f'<div class="f06-it" id="f06-a{i}"><i></i>{a}</div>' for i, a in enumerate(ACTS))}</div>
<img id="f06-ghost" class="char" src="{chars('fantasma')}" alt="">
<div id="f06-vs" class="abs"><div><b style="color:#FFC107">20</b><span>actividades hechas</span></div><div><b style="color:#FF6B6B">5</b><span>en tu cuenta</span></div></div>
''')

# ---------- 07 ¡Abracadabra! Pascal ----------
SMOKE = [(60, 1300, 380), (620, 1260, 420), (300, 1440, 520), (-80, 1560, 460), (700, 1580, 480)]
frames['07-pascal'] = ('f07-pascal', f'''
#f07-flash{{inset:0;background:#FFF6D6;opacity:0}}
#f07-rays{{left:-210px;top:300px;width:1500px;height:1500px;opacity:.5}}
#f07-glow{{left:140px;top:560px;width:800px;height:900px;background:rgba(255,193,7,.32)}}
#f07-pascal-img{{left:190px;top:540px;width:700px}}
.f07-smk{{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(235,225,255,.85),rgba(235,225,255,0) 70%)}}
#f07-abra{{top:110px;font-size:140px;color:#FFC107;text-shadow:0 7px 0 #5A3A00,0 0 60px rgba(255,193,7,.6)}}
#f07-name{{top:290px;font-size:80px;line-height:1.02;text-shadow:0 4px 20px rgba(18,8,32,.8)}}
#f07-name b{{color:#FFC107}}
''', deco('f07', ('tl', 'tr'), bats=[], fog=False) + f'''
<svg id="f07-rays" class="abs" viewBox="-100 -100 200 200" data-layout-allow-overflow>{''.join(f'<path d="M0 0 L{100*math.cos(math.radians(a-4)):.1f} {100*math.sin(math.radians(a-4)):.1f} L{100*math.cos(math.radians(a+4)):.1f} {100*math.sin(math.radians(a+4)):.1f} Z" fill="rgba(255,214,90,.35)"/>' for a in range(0, 360, 24))}</svg>
<div id="f07-glow" class="glow" data-layout-allow-overflow></div>
<img id="f07-pascal-img" class="char" data-layout-allow-overflow src="{chars('pascal')}" alt="">
{''.join(f'<div id="f07-s{i}" class="f07-smk" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px" data-layout-allow-overflow></div>' for i, (x, y, s) in enumerate(SMOKE))}
{spark('f07-k1', 120, 640, 90)}{spark('f07-k2', 880, 560, 70)}{spark('f07-k3', 860, 1040, 100)}{spark('f07-k4', 90, 1100, 60)}{spark('f07-k5', 500, 470, 50)}
<h2 id="f07-abra" class="abs center creep">¡Abracadabra!</h2>
<h3 id="f07-name" class="abs center disp">Pascal, el mago de<br>tu <b>cuenta de cobro</b></h3>
<div id="f07-flash" class="abs"></div>
''')

# ---------- 08 Hechizo 1: tu cuenta, lista ----------
frames['08-cuenta'] = ('f08-cuenta', f'''
#f08-glow{{left:300px;top:640px;width:700px;height:800px;background:rgba(37,211,102,.18)}}
#f08-phone{{left:330px;top:540px;width:690px;border-radius:56px;background:#0B141A;border:10px solid #1F1F1F;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.8)}}
.f08-top{{display:flex;align-items:center;gap:18px;padding:22px 26px;background:#1F2C34;color:#E9EDEF;font:700 34px/1 "Geist",sans-serif}}
.f08-top img{{width:64px;height:64px;border-radius:50%}}
.f08-top small{{display:block;font:500 24px/1.2 "Geist",sans-serif;color:#8696A0;margin-top:4px}}
.f08-chat{{padding:22px 22px 26px;display:flex;flex-direction:column;gap:14px}}
.f08-m{{max-width:86%;padding:16px 20px;border-radius:20px;font:500 31px/1.3 "Geist",sans-serif;color:#E9EDEF;background:#1F2C34;align-self:flex-start}}
.f08-m.me{{background:#005C4B;align-self:flex-end}}
#f08-wiz{{left:-40px;top:900px;width:470px}}
#f08-trail{{left:280px;top:820px;width:200px}}
#f08-folder{{left:360px;top:1500px;width:620px;padding:28px 34px;border-radius:28px;background:#FFC107;color:#1F1405;display:flex;align-items:center;gap:22px;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}}
#f08-folder svg{{width:110px;height:90px;flex:none}}
#f08-folder b{{display:block;font:800 52px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em}}
#f08-folder span{{font:600 30px/1.3 "Geist",sans-serif}}
''', deco('f08', ('tl',), bats=[], fog=False) + spell_head('f08', 1, 'Tu cuenta, lista') + f'''
<div id="f08-glow" class="glow" data-layout-allow-overflow></div>
<div id="f08-phone" class="abs">
  <div class="f08-top"><img src="assets/brand/logo.webp" alt=""><div>Pascal · CuentaFácil<small>en línea</small></div></div>
  <div class="f08-chat">
    <div class="f08-m me" id="f08-m1">Hoy hice la capacitación al personal 📸</div>
    <div class="f08-m" id="f08-m2">{CHECK}Anotado en tu obligación 3</div>
    <div class="f08-m me" id="f08-m3">🎤 Nota de voz · 0:24</div>
    <div class="f08-m" id="f08-m4">{CHECK}Anotado en tu obligación 5</div>
  </div>
</div>
<img id="f08-wiz" class="char" data-layout-allow-overflow src="{chars('pascal')}" alt="">
{spark('f08-k1', 230, 1290, 64)}{spark('f08-k2', 268, 1200, 46)}{spark('f08-k3', 300, 1120, 36)}
<div id="f08-folder" class="abs"><svg viewBox="0 0 110 90"><path d="M4 14 Q4 6 12 6 L42 6 L52 18 L98 18 Q106 18 106 26 L106 80 Q106 86 98 86 L12 86 Q4 86 4 80 Z" fill="#1F1405"/><path d="M34 52 L48 66 L76 38" stroke="#FFC107" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>Cuenta lista</b><span>todas tus actividades, en su obligación</span></div></div>
''')

# ---------- 09 Hechizo 2: menos estrés ----------
frames['09-estres'] = ('f09-estres', f'''
#f09-glow{{left:140px;top:700px;width:800px;height:700px;background:rgba(37,211,102,.16)}}
#f09-gauge{{left:140px;top:560px;width:800px}}
#f09-lab{{top:1040px;font:800 64px/1 "Bricolage Grotesque",sans-serif;color:#25D366;letter-spacing:-.02em}}
#f09-vamp{{left:560px;top:1180px;width:430px}}
#f09-hg{{left:150px;top:1260px;width:260px}}
#f09-wiz{{left:-30px;top:1250px;width:300px}}
#f09-cal{{left:90px;top:1180px;width:360px;padding:26px 0;border-radius:26px;background:#FFF3E0;color:#2A1208;text-align:center;box-shadow:0 24px 50px -20px rgba(0,0,0,.7)}}
#f09-cal b{{display:block;font:800 52px/1 "Bricolage Grotesque",sans-serif;color:#1E8A4C}}
#f09-cal span{{font:600 30px/1.3 "Geist",sans-serif}}
''', deco('f09', ('tl', 'tr'), bats=[], fog=True) + spell_head('f09', 2, 'Menos estrés') + f'''
<div id="f09-glow" class="glow" data-layout-allow-overflow></div>
<svg id="f09-gauge" class="abs" viewBox="0 0 800 470">
  <path d="M100 420 A300 300 0 0 1 233 171" stroke="#25D366" stroke-width="70" fill="none"/>
  <path d="M233 171 A300 300 0 0 1 567 171" stroke="#FFC107" stroke-width="70" fill="none"/>
  <path d="M567 171 A300 300 0 0 1 700 420" stroke="#E5484D" stroke-width="70" fill="none"/>
  <g id="f09-needle" style="transform-origin:400px 420px;transform:rotate(-62deg)"><path d="M392 420 L400 160 L408 420 Z" fill="#FFF3E0"/></g>
  <circle cx="400" cy="420" r="34" fill="#FFF3E0"/>
  <text x="110" y="452" font-family="Geist" font-weight="700" font-size="30" fill="#BFF5D3">calma</text>
  <text x="600" y="452" font-family="Geist" font-weight="700" font-size="30" fill="#FFC9CB">pánico</text>
</svg>
<p id="f09-lab" class="abs center">Estrés: bajito</p>
<div id="f09-cal" class="abs"><b>Último día</b><span>sin afán, sin fuego</span></div>
<img id="f09-vamp" class="char" src="{chars('vampiro')}" alt="">
<div id="f09-back" class="abs" style="left:520px;top:1620px;padding:18px 28px;border-radius:20px;background:#120820;border:3px solid #25D366;font:800 54px/1 'Bricolage Grotesque',sans-serif;color:#25D366">+8 h de vuelta</div>
''')

# ---------- 10 Hechizo 3: más tiempo en familia ----------
frames['10-familia'] = ('f10-familia', f'''
#f10-glow{{left:100px;top:900px;width:880px;height:700px;background:rgba(255,193,7,.22)}}
#f10-tbl{{left:60px;top:960px;width:960px}}
#f10-photo{{left:600px;top:560px;width:340px;transform:rotate(8deg)}}
#f10-pirate{{left:60px;top:500px;width:420px}}
#f10-witch{{left:-30px;top:1460px;width:300px}}
#f10-ghost{{left:270px;top:1520px;width:250px}}
#f10-mummy{{left:520px;top:1500px;width:260px}}
#f10-vamp{{left:790px;top:1470px;width:280px}}
''', deco('f10', ('tl', 'tr'), bats=[], fog=False) + spell_head('f10', 3, 'Más tiempo<br>en familia', 120) + f'''
<div id="f10-glow" class="glow" data-layout-allow-overflow></div>
{table_scene('f10-tbl', '', True)}
<img id="f10-pirate" class="char" src="{chars('pirata')}" alt="">
{family_photo('f10-photo', '')}
<img id="f10-witch" class="char" data-layout-allow-overflow src="{chars('bruja')}" alt="">
<img id="f10-ghost" class="char" src="{chars('fantasma')}" alt="">
<img id="f10-mummy" class="char" src="{chars('momia-redonda')}" alt="">
<img id="f10-vamp" class="char" src="{chars('vampiro')}" alt="">
''')

# ---------- 11 Cierre ----------
frames['11-cierre'] = ('f11-cierre', f'''
#f11-glow{{left:240px;top:480px;width:600px;height:700px;background:rgba(255,193,7,.25)}}
#f11-wiz{{left:-40px;top:880px;width:520px}}
#f11-k{{top:120px;font-size:84px;line-height:1.02}}
#f11-k b{{color:#FFC107}}
#f11-qr{{left:470px;top:560px;width:560px;padding:44px 44px 26px;border-radius:50px;background:#fff;text-align:center;box-shadow:0 0 0 10px rgba(255,193,7,.3),0 0 90px rgba(255,193,7,.35)}}
#f11-qrc{{position:relative;width:472px;height:472px}}
#f11-qrc > img:first-child{{display:block;width:100%;height:100%}}
#f11-qrlogo{{position:absolute;left:50%;top:50%;width:138px;height:138px;margin:-69px 0 0 -69px;border-radius:40px;box-shadow:0 0 0 10px #fff}}
#f11-cap{{margin-top:26px;font:800 34px/1 "Bricolage Grotesque",sans-serif;color:#1F1F1F}}
#f11-brand{{left:470px;top:1250px;width:560px;text-align:center}}
#f11-brand b{{display:block;font:800 76px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.04em;color:#FFF3E0}}
#f11-brand span{{display:inline-flex;align-items:center;gap:14px;margin-top:16px;font:600 40px/1 "Geist",sans-serif;color:#FFDCC8}}
#f11-brand img{{width:52px;height:52px}}
#f11-brand i{{font-style:normal;color:#FFC107}}
#f11-happy{{left:470px;width:560px;top:1440px;text-align:center;font-size:88px;color:#FF7A1A;text-shadow:0 6px 0 #4A1A00}}
''', deco('f11', ('tl', 'tr', 'bl', 'br'), spiders=[(560, 300), (980, 180), (40, 420)], bats=[(860, 1460, 110, 8)], fog=True) + f'''
<div id="f11-glow" class="glow" data-layout-allow-overflow></div>
<h2 id="f11-k" class="abs center disp">Pascal, el mago de<br>tu <b>cuenta de cobro</b></h2>
<img id="f11-wiz" class="char" data-layout-allow-overflow src="{chars('pascal')}" alt="">
<div id="f11-qr" class="abs"><div id="f11-qrc"><img src="assets/brand/qr.svg" alt=""><img id="f11-qrlogo" src="assets/brand/logo.webp" alt=""></div><p id="f11-cap">Escanéame y empieza</p></div>
<div id="f11-brand" class="abs"><b>CuentaFácil</b><span><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">de Pascal<i>IA</i></em></span></div>
<p id="f11-happy" class="abs creep">¡Feliz Halloween sin sustos!</p>
''')

MJ = os.path.join(ROOT, 'tools', 'motion.json')
JS = json.load(open(MJ)) if os.path.exists(MJ) else {}
for name, (cid, css, body) in frames.items():
    open(os.path.join(OUT, name + '.html'), 'w').write(page(cid, css, body, JS.get(name, '')))
print('wrote', len(frames))
