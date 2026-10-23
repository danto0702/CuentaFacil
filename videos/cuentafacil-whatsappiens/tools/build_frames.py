# Generates the 9 scene sub-compositions (compositions/frames/NN-*.html) for the nature-documentary parody.
import os, json, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(OUT, exist_ok=True)

LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2C60-2C7F,U+A720-A7FF'
FONTS = f'''
@font-face{{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin.woff2") format("woff2");unicode-range:{LATIN}}}
@font-face{{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin-ext.woff2") format("woff2");unicode-range:{EXT}}}
@font-face{{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin.woff2") format("woff2");unicode-range:{LATIN}}}
@font-face{{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin-ext.woff2") format("woff2");unicode-range:{EXT}}}
'''
COMMON = '''
#root{background:#0E2A1F;color:#FFF8EC}
.abs{position:absolute}
.disp{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;letter-spacing:-.035em}
.txt{font-family:"Geist",sans-serif}
.center{left:60px;right:60px;text-align:center}
.char{position:absolute;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
.bg{position:absolute;inset:0;width:1080px;height:1920px}
.vf{position:absolute;inset:0;pointer-events:none}
.vf i{position:absolute;width:90px;height:90px;border:6px solid rgba(255,255,255,.85)}
.vf .tl{left:46px;top:46px;border-right:0;border-bottom:0}.vf .tr{right:46px;top:46px;border-left:0;border-bottom:0}
.vf .bl{left:46px;bottom:46px;border-right:0;border-top:0}.vf .br{right:46px;bottom:46px;border-left:0;border-top:0}
.rec{position:absolute;left:80px;top:80px;display:flex;align-items:center;gap:14px;font:700 34px/1 "Geist",sans-serif;color:#fff;letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.rec b{width:24px;height:24px;border-radius:50%;background:#FF3B30}
.tc{position:absolute;right:80px;top:80px;font:600 32px/1 "Geist",sans-serif;color:#fff;letter-spacing:.06em;font-variant-numeric:tabular-nums;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.lt{position:absolute;left:70px;right:70px;padding:24px 30px 22px;background:rgba(10,24,18,.82);border-left:10px solid #FFC107;border-radius:6px}
.lt b{display:block;font:800 52px/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em;color:#fff}
.lt i{display:block;margin-top:8px;font:500 italic 34px/1.2 "Geist",sans-serif;color:#E8DCC2}
.sub{position:absolute;left:90px;right:90px;text-align:center;font:600 40px/1.3 "Geist",sans-serif;color:#fff;text-shadow:0 3px 10px rgba(0,0,0,.9),0 0 2px #000}
.grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;pointer-events:none}
.ok{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#25D366;vertical-align:-8px;margin-right:10px}
.ok svg{width:30px;height:30px;fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.spark{position:absolute}
.spark path{fill:#FFE27A}
'''
CHECK = '<span class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'
GRAIN = ('<svg class="grain" viewBox="0 0 1080 1920"><filter id="GID"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
         '<feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .9 0"/></filter><rect width="1080" height="1920" filter="url(#GID)"/></svg>')

def chars(n):
    return f'assets/chars/{n}.webp'

def viewfinder(p, tc='00:00:00:00'):
    return (f'<div class="vf"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>'
            f'<div class="rec"><b id="{p}-rec"></b>REC</div><div class="tc" id="{p}-tc">{tc}</div>' + GRAIN.replace('GID', f'{p}-gr'))

def leaf(x, y, s, rot, col):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0 C60 -40 160 -40 240 0 C160 40 60 40 0 0Z" fill="{col}"/>'
            f'<path d="M0 0 L230 0" stroke="rgba(0,0,0,.18)" stroke-width="4"/></g>')

def jungle(p, mode='day'):
    sky = {'day': ('#FBD98B', '#F2A65A', '#E57A44'), 'night': ('#0B1530', '#1B2A4F', '#2C3D63'),
           'storm': ('#FF9A3C', '#D9482B', '#5C1A1B')}[mode]
    hill1, hill2, ground = (('#C7783E', '#8E5A2B', '#6E8B3D') if mode == 'day' else ('#22314F', '#18243C', '#1D3324') if mode == 'night'
                            else ('#7A2E1E', '#4E1D16', '#3B2A1A'))
    leaves = ''.join(leaf(*a) for a in [(-40, 1700, 1.6, -30, '#1E4D2B'), (-60, 1820, 1.4, -10, '#2E6B3A'), (1120, 1720, 1.6, 210, '#1E4D2B'),
                                        (1130, 1840, 1.3, 190, '#2E6B3A'), (-30, 220, 1.2, 25, '#173F24'), (1110, 260, 1.2, 160, '#173F24')])
    sun = ('<circle id="%s-sun" cx="760" cy="520" r="150" fill="#FFF1C4" opacity=".9"/>' % p) if mode == 'day' else \
          ('<circle id="%s-sun" cx="780" cy="420" r="110" fill="#F4EBD0"/><circle cx="740" cy="400" r="20" fill="rgba(0,0,0,.08)"/>' % p) if mode == 'night' else ''
    stars = ''.join(f'<circle cx="{x}" cy="{y}" r="3" fill="#fff" opacity=".7"/>' for x, y in [(120, 300), (300, 180), (520, 260), (900, 200), (980, 520), (200, 620), (620, 120)]) if mode == 'night' else ''
    return (f'<svg class="bg" id="{p}-bg" viewBox="0 0 1080 1920" data-layout-allow-overflow><defs><linearGradient id="{p}-sky" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{sky[0]}"/><stop offset=".55" stop-color="{sky[1]}"/><stop offset="1" stop-color="{sky[2]}"/></linearGradient></defs>'
            f'<rect width="1080" height="1920" fill="url(#{p}-sky)"/>{stars}{sun}'
            f'<path d="M0 1180 C200 1060 380 1120 560 1060 C760 990 900 1080 1080 1020 L1080 1920 L0 1920Z" fill="{hill1}"/>'
            f'<path d="M0 1300 C240 1220 420 1290 640 1230 C820 1180 960 1240 1080 1210 L1080 1920 L0 1920Z" fill="{hill2}"/>'
            f'<path d="M0 1460 C300 1420 700 1440 1080 1410 L1080 1920 L0 1920Z" fill="{ground}"/></svg>'
            f'<svg class="bg" id="{p}-fg" viewBox="0 0 1080 1920" data-layout-allow-overflow>{leaves}</svg>')

def spark(id_, x, y, s=60):
    return f'<svg id="{id_}" class="spark" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px" viewBox="0 0 24 24"><path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"/></svg>'

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

frames = {}

# ---------- 01 Title card ----------
BIRDS = ''.join(f'<path class="f01-bird" d="M{x} {y} q18 -16 36 0 q18 -16 36 0" stroke="#3B2414" stroke-width="5" fill="none" stroke-linecap="round"/>'
                for x, y in [(160, 560), (260, 500), (330, 600), (820, 700), (900, 640)])
frames['01-titulo'] = ('f01-titulo', '''
#f01-black{inset:0;background:#000}
#f01-k1{top:700px;font:700 40px/1 "Geist",sans-serif;letter-spacing:.5em;color:#FFF3D6;text-shadow:0 2px 12px rgba(0,0,0,.5)}
#f01-k2{top:760px;font-size:150px;line-height:.9;color:#FFF8EC;text-shadow:0 6px 30px rgba(60,20,0,.45)}
#f01-rule{left:340px;width:400px;top:1080px;height:8px;background:#FFC107;border-radius:4px}
#f01-k3{top:1120px;font:500 italic 44px/1.25 "Geist",sans-serif;color:#FFF3D6;text-shadow:0 2px 12px rgba(0,0,0,.6)}
#f01-sil{left:640px;top:1200px;width:300px;filter:brightness(0) opacity(.55)}
''', jungle('f01', 'day') + f'''
<svg class="bg" viewBox="0 0 1080 1920">{BIRDS}</svg>
<img id="f01-sil" class="abs" src="{chars('dino-susto')}" alt="">
<p id="f01-k1" class="abs center">DOCUMENTAL</p>
<h1 id="f01-k2" class="abs center disp">Planeta<br>Contratista</h1>
<div id="f01-rule" class="abs"></div>
<p id="f01-k3" class="abs center">Episodio 1:<br>La extinción del Wordosaurio</p>
{GRAIN.replace("GID", "f01-gr")}
<div id="f01-black" class="abs"></div>
''')

# ---------- 02 Explorer ----------
frames['02-explorador'] = ('f02-explorador', '''
#f02-pascal{left:80px;top:860px;width:640px}
#f02-bush{left:-80px;top:1420px;width:1240px}
#f02-lt{top:1560px}
#f02-shh{left:620px;top:760px;font-size:120px;color:#fff;text-shadow:0 6px 20px rgba(0,0,0,.4)}
''', jungle('f02', 'day') + f'''
<img id="f02-pascal" class="char" src="{chars('pascal-binoculares')}" alt="">
<svg id="f02-bush" class="abs" viewBox="0 0 1240 520">
  <ellipse cx="200" cy="300" rx="300" ry="200" fill="#2E6B3A"/><ellipse cx="620" cy="330" rx="340" ry="200" fill="#1E4D2B"/>
  <ellipse cx="1040" cy="300" rx="300" ry="210" fill="#2E6B3A"/><ellipse cx="420" cy="420" rx="420" ry="160" fill="#173F24"/><ellipse cx="900" cy="440" rx="420" ry="150" fill="#173F24"/>
</svg>
<p id="f02-shh" class="abs disp">Shhh…</p>
<div id="f02-lt" class="lt"><b>Pascal</b><i>Explorador de PascalIA · asistente por WhatsApp</i></div>
{viewfinder('f02', '05:42:17')}
''')

# ---------- 03 Habitat ----------
frames['03-habitat'] = ('f03-habitat', '''
#f03-dino{left:110px;top:780px;width:860px}
#f03-clock{left:70px;top:430px;padding:22px 34px;border-radius:22px;background:rgba(10,15,30,.85);border:3px solid #FF6B6B;font:800 74px/1 "Bricolage Grotesque",sans-serif;color:#FF8A8A}
#f03-clock small{font-size:36px;margin-left:8px}
.f03-key{position:absolute;padding:16px 26px;border-radius:16px;background:#fff;color:#1F2A44;font:800 46px/1 "Geist",sans-serif;box-shadow:0 10px 0 #B8C2D6,0 20px 30px rgba(0,0,0,.4)}
#f03-lt{top:1560px}
#f03-mask{inset:0}
''', jungle('f03', 'night') + f'''
<div id="f03-clock" class="abs">11:58<small>p. m.</small></div>
<img id="f03-dino" class="char" src="{chars('dino-escritorio')}" alt="">
<div id="f03-k1" class="f03-key" style="left:620px;top:470px">Ctrl + C</div>
<div id="f03-k2" class="f03-key" style="left:700px;top:620px">Ctrl + V</div>
<div id="f03-lt" class="lt"><b>Wordosaurus officinalis</b><i>Especie en peligro de extinción</i></div>
<svg id="f03-mask" class="abs" viewBox="0 0 1080 1920"><defs><mask id="f03-m"><rect width="1080" height="1920" fill="#fff"/>
  <circle id="f03-c1" cx="360" cy="1060" r="330" fill="#000"/><circle id="f03-c2" cx="720" cy="1060" r="330" fill="#000"/></mask></defs>
  <rect width="1080" height="1920" fill="#000" mask="url(#f03-m)"/></svg>
{viewfinder('f03', '23:58:04')}
''')

# ---------- 04 Panic ----------
PDFS = [(80, 420, -18), (820, 380, 14), (40, 760, 10), (880, 760, -12), (120, 1120, -8), (870, 1360, 16), (440, 330, 6), (300, 560, -20), (700, 560, 18)]
def pdf(i, x, y, r):
    return (f'<div class="f04-pdf" id="f04-p{i}" style="left:{x}px;top:{y}px;transform:rotate({r}deg)">'
            f'<i>PDF</i><s></s><s></s><s style="width:60%"></s></div>')
frames['04-panico'] = ('f04-panico', '''
#f04-dino{left:230px;top:620px;width:640px}
.f04-pdf{position:absolute;width:150px;padding:14px;border-radius:12px;background:#FFF8EC;box-shadow:0 14px 30px rgba(0,0,0,.45)}
.f04-pdf i{display:inline-block;padding:6px 12px;border-radius:8px;background:#E5484D;color:#fff;font:800 26px/1 "Geist",sans-serif;font-style:normal;margin-bottom:8px}
.f04-pdf s{display:block;height:9px;border-radius:5px;background:#D9C8B4;margin-top:9px}
#f04-count{right:80px;top:200px;padding:18px 28px;border-radius:20px;background:rgba(10,15,30,.85);border:3px solid #FFC107;text-align:center}
#f04-count b{display:block;font:800 92px/1 "Bricolage Grotesque",sans-serif;color:#FFC107;letter-spacing:-.04em}
#f04-count span{font:600 30px/1.2 "Geist",sans-serif;color:#fff}
#f04-note{left:700px;top:1160px;width:340px}
#f04-note p{font:700 36px/1.15 "Geist",sans-serif;color:#fff;text-shadow:0 3px 10px rgba(0,0,0,.9)}
#f04-sub{top:1560px}
''', jungle('f04', 'night') + ''.join(pdf(i, *a) for i, a in enumerate(PDFS)) + f'''
<img id="f04-dino" class="char" src="{chars('dino-panico')}" alt="">
<div id="f04-count" class="abs"><b id="f04-num">14</b><span>PDF por unir</span></div>
<div id="f04-note" class="abs"><svg width="140" height="80" viewBox="0 0 140 80" style="transform:scaleY(-1)"><path d="M130 10 C90 10 50 30 20 66" stroke="#FFC107" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M8 58 L20 70 L36 58" stroke="#FFC107" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><p>Bracitos:<br>demasiado cortos<br>para el teclado</p></div>
<p id="f04-sub" class="sub">Une PDF… copia firmas… y otra vez el formato.</p>
{viewfinder('f04', '23:59:31')}
''')

# ---------- 05 Meteor ----------
frames['05-meteoro'] = ('f05-meteoro', '''
#f05-dino{left:300px;top:960px;width:480px}
#f05-met{left:620px;top:140px;width:300px;height:300px}
#f05-met img{position:absolute;inset:0;width:100%;height:100%}
#f05-trail{position:absolute;left:150px;top:-330px;width:520px;height:520px;transform:rotate(0deg)}
#f05-flash{inset:0;background:#FFF6E0;opacity:0}
#f05-sub{top:1580px}
#f05-q{left:70px;top:200px;font-size:84px;text-align:left;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.6)}
''', jungle('f05', 'storm') + f'''
<p id="f05-q" class="abs disp">¿Qué es eso?</p>
<div id="f05-met" class="abs" data-layout-allow-overflow>
  <svg id="f05-trail" viewBox="0 0 520 520"><defs><linearGradient id="f05-g" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A" stop-opacity="0"/><stop offset=".6" stop-color="#FF9A3C"/><stop offset="1" stop-color="#FF5A1F"/></linearGradient></defs>
  <path d="M520 0 L140 470 Q120 500 90 470 L60 440 Q40 410 70 390 Z" fill="url(#f05-g)"/></svg>
  <img src="{chars('meteorito')}" alt="">
</div>
<img id="f05-dino" class="char" src="{chars('dino-susto')}" alt="">
<p id="f05-sub" class="sub">De pronto… algo se acerca desde el cielo.</p>
{viewfinder('f05', '00:00:07')}
<div id="f05-flash" class="abs"></div>
''')

# ---------- 06 Evolution ----------
STAGES = [('maquina', 'Máquina de escribir', 'Era del papel carbón', 90, 360, 360),
          ('crt', 'Informe en Word', 'Copiar, pegar, sufrir', 630, 640, 330),
          ('dino-gafas', 'Wordosaurio en transición', 'Descubre WhatsApp', 80, 940, 300),
          ('hamaca', 'Whatsappiens', 'Le cuenta su día a Pascal', 560, 1260, 470)]
def stage(i, n, t, s, x, y, w):
    side = 'left' if x < 400 else 'right'
    lx = x + w + 30 if side == 'left' else x - 400
    return (f'<img id="f06-s{i}" class="abs" src="{chars(n)}" style="left:{x}px;top:{y}px;width:{w}px;filter:drop-shadow(0 18px 24px rgba(80,50,20,.35))" alt="">'
            f'<div id="f06-l{i}" class="abs f06-lab" style="left:{lx}px;top:{y + 90}px;width:380px;text-align:{"left" if side=="left" else "right"}"><em>{i + 1}</em><b>{t}</b><span>{s}</span></div>')
frames['06-evolucion'] = ('f06-evolucion', '''
#root{background:#F3E6CC}
#f06-paper{inset:0;background:radial-gradient(120% 80% at 50% 30%,#FBF3E2 0%,#EBD9B4 100%)}
#f06-title{top:110px;font-size:92px;line-height:.95;color:#3B2414}
#f06-title b{color:#1E8A4C}
#f06-path{left:0;top:0;width:1080px;height:1920px}
.f06-lab em{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#3B2414;color:#FBF3E2;font:800 30px/1 "Bricolage Grotesque";font-style:normal;margin-bottom:10px}
.f06-lab b{display:block;font:800 44px/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em;color:#3B2414}
.f06-lab span{display:block;margin-top:6px;font:500 italic 32px/1.2 "Geist",sans-serif;color:#6B4A2B}
#f06-l3 b{color:#1E8A4C}
#f06-new{left:520px;top:1760px;padding:14px 26px;border-radius:999px;background:#25D366;color:#fff;font:800 36px/1 "Geist",sans-serif}
''', '<div id="f06-paper" class="abs"></div>' + '''
<svg id="f06-path" class="abs" viewBox="0 0 1080 1920"><path id="f06-line" d="M260 760 C520 760 700 600 800 900 C860 1080 300 920 260 1220 C230 1420 600 1360 780 1500" stroke="#B08A5A" stroke-width="8" stroke-dasharray="20 18" fill="none" stroke-linecap="round"/></svg>
<h2 id="f06-title" class="abs center disp">La evolución<br>del <b>informe</b></h2>
''' + ''.join(stage(i, *a) for i, a in enumerate(STAGES)) + '''
<div id="f06-new" class="abs">¡Nueva especie!</div>
''' + GRAIN.replace('GID', 'f06-gr'))

# ---------- 07 Whatsappiens ----------
frames['07-whatsappiens'] = ('f07-whatsappiens', '''
#f07-hamaca{left:160px;top:1040px;width:820px}
#f07-palm1{left:60px;top:780px;width:60px;height:900px;background:linear-gradient(90deg,#7A5230,#A47448);border-radius:30px;transform:rotate(-4deg)}
#f07-palm2{left:960px;top:760px;width:60px;height:920px;background:linear-gradient(90deg,#7A5230,#A47448);border-radius:30px;transform:rotate(5deg)}
.f07-m{position:absolute;max-width:640px;padding:20px 26px;border-radius:26px;font:500 36px/1.3 "Geist",sans-serif;color:#E9EDEF;background:#1F2C34;box-shadow:0 14px 30px rgba(0,0,0,.35)}
.f07-m.me{background:#005C4B}
#f07-lt{top:1600px}
''', jungle('f07', 'day') + f'''
<div id="f07-palm1" class="abs"></div><div id="f07-palm2" class="abs"></div>
<img id="f07-hamaca" class="char" src="{chars('hamaca')}" alt="">
<div id="f07-m1" class="f07-m me" style="right:80px;top:300px">🎤 Nota de voz · 0:18</div>
<div id="f07-m2" class="f07-m me" style="right:80px;top:410px">📸 Hoy hice la jornada de vacunación</div>
<div id="f07-m3" class="f07-m" style="left:80px;top:560px">{CHECK}Anotado en tu obligación 2</div>
<div id="f07-m4" class="f07-m" style="left:80px;top:700px">📄 <b>Tu informe está listo</b> para revisar y firmar</div>
<div id="f07-lt" class="lt"><b>Homo whatsappiens</b><i>Especie en expansión · hábitat: WhatsApp</i></div>
{viewfinder('f07', '10:14:52')}
''')

# ---------- 08 Free time ----------
CONF = ''.join(f'<rect class="f08-cf" x="{x}" y="{y}" width="18" height="30" rx="4" fill="{c}" transform="rotate({r} {x} {y})"/>'
               for x, y, r, c in [(140, 380, 20, '#FFC107'), (260, 300, -30, '#25D366'), (420, 360, 40, '#FF7A1A'), (600, 280, -10, '#38BDF8'),
                                  (760, 360, 30, '#FFC107'), (920, 300, -40, '#E5484D'), (200, 520, 60, '#38BDF8'), (880, 520, -20, '#25D366'),
                                  (520, 460, 15, '#E5484D'), (680, 520, -50, '#FFC107')])
frames['08-vida'] = ('f08-vida', '''
#f08-duo{left:120px;top:700px;width:840px}
#f08-k{top:330px;font-size:108px;line-height:.95;color:#3B2414}
#f08-k b{color:#1E6B3A}
''', jungle('f08', 'day') + f'''
<svg class="bg" viewBox="0 0 1080 1920">{CONF}</svg>
<h2 id="f08-k" class="abs center disp">Y le sobra<br><b>tiempo para vivir</b></h2>
<img id="f08-duo" class="char" src="{chars('chocalas')}" alt="">
{spark('f08-s1', 120, 760, 70)}{spark('f08-s2', 900, 820, 60)}{spark('f08-s3', 540, 640, 50)}
''')

# ---------- 09 Close ----------
frames['09-cierre'] = ('f09-cierre', '''
#root{background:radial-gradient(120% 80% at 50% 10%,#1E4D2B 0%,#0E2A1F 70%)}
#f09-q{top:110px;font-size:84px;line-height:1.02}
#f09-q .d{color:#9BE15D}#f09-q .w{color:#25D366}
#f09-vs{left:0;right:0;top:400px;display:flex;justify-content:center;gap:40px}
#f09-vs div{width:300px;padding:20px 0;border-radius:28px;text-align:center;font:800 40px/1.1 "Bricolage Grotesque",sans-serif}
#f09-a{background:rgba(255,255,255,.08);color:#C9E4B5;border:3px solid #6E8B3D}
#f09-b{background:#25D366;color:#0E2A1F}
#f09-vs span{display:block;font-size:76px;margin-bottom:6px}
#f09-pascal{left:-20px;top:960px;width:470px}
#f09-qr{left:470px;top:700px;width:560px;padding:44px 44px 26px;border-radius:50px;background:#fff;text-align:center;box-shadow:0 0 0 10px rgba(255,193,7,.3),0 0 90px rgba(255,193,7,.25)}
#f09-qrc{position:relative;width:472px;height:472px}
#f09-qrc > img:first-child{display:block;width:100%;height:100%}
#f09-qrlogo{position:absolute;left:50%;top:50%;width:138px;height:138px;margin:-69px 0 0 -69px;border-radius:40px;box-shadow:0 0 0 10px #fff}
#f09-cap{margin-top:26px;font:800 34px/1 "Bricolage Grotesque",sans-serif;color:#1F1F1F}
#f09-ev{left:470px;top:1380px;width:560px;text-align:center}
#f09-ev p{font:800 54px/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;color:#FFF8EC}
#f09-ev p b{color:#FFC107}
#f09-ev span{display:inline-flex;align-items:center;gap:12px;margin-top:20px;font:600 36px/1 "Geist",sans-serif;color:#E8DCC2}
#f09-ev img{width:48px;height:48px}
#f09-ev i{font-style:normal;color:#FFC107}
#f09-com{left:470px;top:1660px;width:560px;padding:20px 0;border-radius:24px;background:rgba(255,255,255,.1);text-align:center;font:700 38px/1.2 "Geist",sans-serif;color:#fff}
''', f'''
<h2 id="f09-q" class="abs center disp">¿Y tú qué eres?</h2>
<div id="f09-vs" class="abs"><div id="f09-a"><span>🦖</span>Wordosaurio</div><div id="f09-b"><span>📱</span>Whatsappiens</div></div>
<img id="f09-pascal" class="char" src="{chars('pascal-senala')}" alt="" data-layout-allow-overflow>
<div id="f09-qr" class="abs"><div id="f09-qrc"><img src="assets/brand/qr.svg" alt=""><img id="f09-qrlogo" src="assets/brand/logo.webp" alt=""></div><p id="f09-cap">Escanéame y evoluciona</p></div>
<div id="f09-ev" class="abs"><p>Evoluciona con<br><b>CuentaFácil</b></p><span><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">de Pascal<i>IA</i></em></span></div>
<div id="f09-com" class="abs">Comenta 🦖 o 📱 #Whatsappiens</div>
''')

MJ = os.path.join(ROOT, 'tools', 'motion.json')
JS = json.load(open(MJ)) if os.path.exists(MJ) else {}
for name, (cid, css, body) in frames.items():
    open(os.path.join(OUT, name + '.html'), 'w').write(page(cid, css, body, JS.get(name, '')))
print('wrote', len(frames))
