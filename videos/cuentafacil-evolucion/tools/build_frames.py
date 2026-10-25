# Generates the 5 scene sub-compositions (compositions/frames/NN-*.html) for "¿En qué etapa estás?".
import os, json
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
STROKE = '0 0 0 #111,4px 4px 0 #111,-4px 4px 0 #111,4px -4px 0 #111,-4px -4px 0 #111,0 6px 0 #111,0 -6px 0 #111,6px 0 0 #111,-6px 0 0 #111,0 12px 24px rgba(0,0,0,.35)'
COMMON = f'''
.abs{{position:absolute}}
.center{{left:50px;right:50px;text-align:center}}
.cap{{position:absolute;left:50px;right:50px;text-align:center;font:800 88px/1.32 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;color:#fff}}
.cap span{{background:#111;padding:2px 22px;border-radius:18px;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
.cap em{{font-style:normal;color:#FFD23F}}
.tag{{position:absolute;left:50%;transform:translateX(-50%);padding:14px 30px;border-radius:999px;background:#111;color:#FFD23F;font:800 40px/1 "Geist",sans-serif;letter-spacing:.14em;white-space:nowrap}}
.year{{position:absolute;left:50px;right:50px;text-align:center;font:700 46px/1 "Geist",sans-serif;color:#111;opacity:.75}}
.hero{{position:absolute;filter:drop-shadow(0 30px 30px rgba(0,0,0,.28))}}
.bar{{position:absolute;left:40px;right:40px;bottom:70px;height:150px;display:flex;gap:12px;align-items:flex-end}}
.bar div{{flex:1;height:150px;border-radius:22px;background:rgba(0,0,0,.18);display:grid;place-items:end center;overflow:hidden;position:relative;border:4px solid transparent}}
.bar div img{{height:136px;width:auto;margin-bottom:-4px}}
.bar div b{{position:absolute;left:10px;top:6px;font:800 30px/1 "Bricolage Grotesque";color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.6)}}
.bar div.on{{background:rgba(255,255,255,.9);border-color:#111}}
.bar div.on b{{color:#111;text-shadow:none}}
.ok{{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#25D366;vertical-align:-9px;margin-right:12px}}
.ok svg{{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}}
'''
CHECK = '<span class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'

def stage(n):
    return f'assets/chars/etapa{n}.webp'

def bar(p, on=()):
    return f'<div class="bar" id="{p}-bar">' + ''.join(
        f'<div id="{p}-b{i}"{" class=on" if i in on else ""}><b>{i}</b><img src="{stage(i)}" alt=""></div>' for i in range(1, 7)) + '</div>'

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

# ---------- 01 Hook ----------
frames['01-gancho'] = ('f01-gancho', '''
#root{background:radial-gradient(110% 70% at 50% 45%,#E8EEF7 0%,#9FB3CF 100%)}
#f01-hero{left:250px;top:640px;height:1040px}
#f01-c1{top:150px}
#f01-c2{top:420px;font-size:80px}
#f01-zz{left:780px;top:640px;font:800 80px/1 "Bricolage Grotesque";color:#111;opacity:.6}
''', f'''
<img id="f01-hero" class="hero" src="{stage(4)}" alt="">
<p id="f01-c1" class="cap"><span>La evolución del informe tardó <em>10.000 años…</em></span></p>
<p id="f01-c2" class="cap"><span>y tú sigues en la <em>etapa 4</em> 😬</span></p>
''')

# ---------- 02 Stages 1–5 + meteor ----------
ERAS = [('#CFC6B8', '#8E8577', 'Informe en piedra 🪨', 'Hace 10.000 años', 1060),
        ('#F2E4C4', '#C7A774', 'Informe a mano ✍️', 'Año 1850', 1000),
        ('#F6B26B', '#C9612C', 'Máquina de escribir', 'Año 1975', 1080),
        ('#BFD3EE', '#6E8DB8', 'Word a medianoche 🖥️', 'Año 2005', 1020),
        ('#2C3E66', '#141E36', 'Uniendo 14 PDF 😵', 'Año 2025', 1080)]
eras = ''.join(f'<div id="f02-bg{i}" class="abs" style="inset:0;background:radial-gradient(110% 70% at 50% 45%,{a} 0%,{b} 100%)"></div>' for i, (a, b, *_) in enumerate(ERAS))
heroes = ''.join(f'<div class="abs" style="left:0;right:0;top:{1720 - h}px;display:flex;justify-content:center"><img id="f02-h{i}" class="hero" src="{stage(i + 1)}" style="position:relative;height:{h}px" alt=""></div>' for i, (*_, h) in enumerate(ERAS))
caps = ''.join(f'<div id="f02-t{i}" class="tag" style="top:150px">ETAPA {i + 1}</div><p id="f02-c{i}" class="cap" style="top:250px"><span>{c}</span></p>'
               f'<p id="f02-y{i}" class="year" style="top:{480 if len(c) < 20 else 560}px;{"color:#fff" if i == 4 else ""}">{y}</p>' for i, (_, _, c, y, _) in enumerate(ERAS))
frames['02-etapas'] = ('f02-etapas', '''
#f02-dino{right:-40px;top:1080px;width:330px;opacity:0}
[id^="f02-h"],[id^="f02-t"],[id^="f02-c"],[id^="f02-y"],#f02-then{opacity:0}
#f02-dlab{opacity:0;right:40px;top:1010px;padding:10px 18px;border-radius:14px;background:#111;color:#9BE15D;font:800 30px/1 "Geist",sans-serif}
#f02-met{left:700px;top:-300px;width:320px;height:320px}
#f02-met img{width:100%;height:100%}
#f02-then{top:760px}
#f02-flash{inset:0;background:#fff;opacity:0}
''', eras + heroes + f'''
<img id="f02-dino" class="hero" src="assets/chars/dino-panico.webp" alt="">
<div id="f02-dlab" class="abs">🦖 rama extinta</div>
''' + caps + f'''
<p id="f02-then" class="cap"><span>Y entonces…</span></p>
<div id="f02-met" class="abs" data-layout-allow-overflow><img src="assets/chars/meteorito.webp" alt=""></div>
{bar('f02')}
<div id="f02-flash" class="abs"></div>
''')

# ---------- 03 Whatsappiens ----------
frames['03-whatsappiens'] = ('f03-whatsappiens', '''
#root{background:radial-gradient(110% 70% at 50% 40%,#DCF8C6 0%,#25D366 100%)}
#f03-hw{left:0;right:0;top:600px;display:flex;justify-content:center}
#f03-hero{position:relative;height:1120px}
#f03-t{top:150px;background:#111;color:#25D366}
#f03-c{top:250px}
.f03-m{position:absolute;max-width:600px;padding:20px 26px;border-radius:26px;font:600 36px/1.3 "Geist",sans-serif;color:#111;background:#fff;box-shadow:0 14px 30px rgba(0,0,0,.25)}
.f03-m.me{background:#D9FDD3}
#f03-sub{top:480px;color:#0B3D20}
#f03-white{inset:0;background:#fff}
''', f'''
<div id="f03-t" class="tag">ETAPA 6</div>
<p id="f03-c" class="cap"><span>El <em>Whatsappiens</em> 📱</span></p>
<p id="f03-sub" class="year">Le cuenta su día a Pascal por WhatsApp</p>
<div id="f03-hw" class="abs"><img id="f03-hero" class="hero" src="{stage(6)}" alt=""></div>
<div id="f03-m1" class="f03-m me" style="right:60px;top:620px">🎤 Nota de voz · 0:15</div>
<div id="f03-m2" class="f03-m" style="left:60px;top:860px">{CHECK}Anotado en tu obligación 3</div>
<div id="f03-m3" class="f03-m" style="left:60px;top:1080px">📄 <b>Tu informe está listo</b></div>
{bar('f03', on=(1, 2, 3, 4, 5, 6))}
<div id="f03-white" class="abs"></div>
''')

# ---------- 04 Lineup ----------
frames['04-linea'] = ('f04-linea', '''
#root{background:radial-gradient(110% 70% at 50% 50%,#FFFDF6 0%,#F1E3C2 100%)}
#f04-title{top:260px;font-size:110px;line-height:.95}
#f04-line{left:0;top:700px;width:1080px}
#f04-ring{left:898px;top:815px;width:176px;height:480px;border-radius:40px;border:8px solid #25D366;box-shadow:0 0 40px rgba(37,211,102,.6)}
#f04-nums{left:0;right:0;top:1330px;display:flex;justify-content:space-around;padding:0 40px}
#f04-nums b{display:grid;place-items:center;width:88px;height:88px;border-radius:50%;background:#111;color:#FFD23F;font:800 46px/1 "Bricolage Grotesque"}
#f04-nums b:last-child{background:#25D366;color:#111}
#f04-sub{top:1480px;font:700 50px/1.2 "Geist",sans-serif;color:#111}
''', '''
<p id="f04-title" class="cap"><span>La evolución<br>del <em>informe</em></span></p>
<img id="f04-line" class="abs" src="assets/chars/linea-completa.png" alt="">
<div id="f04-ring" class="abs"></div>
<div id="f04-nums" class="abs"><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b></div>
<p id="f04-sub" class="abs center">Ya nadie hace su informe en Word</p>
''')

# ---------- 05 Close ----------
frames['05-cierre'] = ('f05-cierre', '''
#root{background:radial-gradient(120% 80% at 50% 10%,#1E4D2B 0%,#0E2A1F 70%)}
#f05-q{top:120px;font-size:100px}
#f05-row{left:30px;right:30px;top:440px;display:flex;gap:10px}
#f05-row div{flex:1;height:250px;border-radius:24px;background:rgba(255,255,255,.1);display:grid;place-items:end center;overflow:hidden;position:relative}
#f05-row img{height:230px;width:auto;margin-bottom:-6px}
#f05-row b{position:absolute;left:10px;top:8px;font:800 40px/1 "Bricolage Grotesque";color:#FFD23F}
#f05-row div:last-child{background:#25D366}
#f05-row div:last-child b{color:#111}
#f05-com{top:740px;font:800 64px/1.1 "Bricolage Grotesque",sans-serif;color:#fff}
#f05-com em{font-style:normal;color:#FFD23F}
#f05-qr{left:50%;top:900px;width:520px;margin-left:-260px;padding:40px 40px 22px;border-radius:46px;background:#fff;text-align:center;box-shadow:0 0 0 10px rgba(37,211,102,.35)}
#f05-qrc{position:relative;width:440px;height:440px}
#f05-qrc > img:first-child{display:block;width:100%;height:100%}
#f05-qrlogo{position:absolute;left:50%;top:50%;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:36px;box-shadow:0 0 0 10px #fff}
#f05-cap{margin-top:22px;font:800 32px/1 "Bricolage Grotesque",sans-serif;color:#1F1F1F}
#f05-brand{top:1560px;font:800 64px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;color:#fff}
#f05-brand em{font-style:normal;color:#25D366}
#f05-by{top:1650px;display:flex;justify-content:center;align-items:center;gap:12px;font:600 38px/1 "Geist",sans-serif;color:#E8DCC2}
#f05-by img{width:46px;height:46px}
#f05-by i{font-style:normal;color:#FFD23F}
''', '<p id="f05-q" class="cap"><span>¿En qué etapa<br>estás <em>tú</em>?</span></p><div id="f05-row" class="abs">' + ''.join(
    f'<div id="f05-r{i}"><b>{i}</b><img src="{stage(i)}" alt=""></div>' for i in range(1, 7)) + '''</div>
<p id="f05-com" class="abs center">Comenta tu número <em>👇</em></p>
<div id="f05-qr" class="abs"><div id="f05-qrc"><img src="assets/brand/qr.svg" alt=""><img id="f05-qrlogo" src="assets/brand/logo.webp" alt=""></div><p id="f05-cap">Evoluciona a la etapa 6</p></div>
<p id="f05-brand" class="abs center">Cuenta<em>Fácil</em></p>
<div id="f05-by" class="abs center"><img src="assets/brand/flower.svg" alt=""><span>de Pascal<i>IA</i></span></div>
''')

MJ = os.path.join(ROOT, 'tools', 'motion.json')
JS = json.load(open(MJ)) if os.path.exists(MJ) else {}
for name, (cid, css, body) in frames.items():
    open(os.path.join(OUT, name + '.html'), 'w').write(page(cid, css, body, JS.get(name, '')))
print('wrote', len(frames))
