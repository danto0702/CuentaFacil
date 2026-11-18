# Builds "Pascal Web · La Niebla": promo for the web design service showing the real La Niebla demo site
# (pascalia-web /pascal-web/bistro/, recorded on a phone by tools/grabacion/record.cjs) with step titles,
# owner-voice narration (Fish Audio) synced to the recording marks, and an end card with the Pascal Web QR.
import os, json, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, _, _, shown = row.split('|'); LINES[n] = shown

def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
def vdur(n):
    p = os.path.join(VO, f'{n}.wav')
    return dur(p) if os.path.exists(p) else max(1.0, len(LINES[n]) / 15)
def chunks(text, limit=40):
    out, cur = [], ''
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    return out + [cur] if cur else out

APP = dur(os.path.join(ROOT, 'assets', 'video', 'app.mp4'))
M = json.load(open(os.path.join(ROOT, 'tools', 'grabacion', 'marks.json')))
A = round(vdur('w01') + 0.5, 2)       # recording starts after the hook line
E = round(A + APP, 2)
# narration: planned start per line, pushed later if the previous line is still talking
PLAN = [('w01', 0.15), ('w02', A + M['portada'] - 0.6), ('w03', A + M['menu'] + 0.1), ('w04', A + M['nosotros'] + 0.1), ('w05', A + M['inspiracion'] + 0.1),
        ('w06', A + M['reconocimientos'] + 0.1), ('w07', A + M['carta'] + 0.1), ('w08', A + M['reserva'] + 0.1), ('w09', E + 0.5)]
VOS = {}; last = 0
for n, t in PLAN:
    t = max(t, last + 0.2); VOS[n] = round(t, 2); last = t + vdur(n)
TOTAL = round(max(E + 2, VOS['w09'] + vdur('w09') + 1.6), 2)
STEPS = [(M['carga'], '1', 'Portada con identidad'), (M['menu'], '2', 'Menú e idiomas'), (M['nosotros'], '3', 'Tu historia, al bajar'),
         (M['galeria'], '4', 'Galería y movimiento'), (M['inspiracion'], '5', 'Inspiración, chef y equipo'), (M['reconocimientos'], '6', 'Premios, horarios y mapa'),
         (M['carta'], '7', 'La carta, sin PDF'), (M['reserva'], '8', 'Reservas paso a paso')]
PW, PH = 700, round(700 * 1726 / 1014)
PX, PY = (1080 - PW) // 2, 300
Y = '#FFC107'

CSS = f'''
@font-face{{font-family:"Montserrat";font-weight:700;src:url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2")}}
@font-face{{font-family:"Montserrat";font-weight:800;src:url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2")}}
@font-face{{font-family:"Inter";font-weight:500;src:url("assets/fonts/inter-latin-500-normal.woff2") format("woff2")}}
@font-face{{font-family:"Inter";font-weight:600;src:url("assets/fonts/inter-latin-600-normal.woff2") format("woff2")}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1080px; height:1920px; overflow:hidden; background:#0A0A0D; }}
#root {{ position:relative; width:100%; height:100%; overflow:hidden; color:#fff; }}
.abs {{ position:absolute; }}
#bg {{ position:absolute; inset:0; background:radial-gradient(60% 38% at 50% 48%,rgba(255,193,7,.22),transparent 72%),radial-gradient(90% 40% at 50% 0%,rgba(255,193,7,.08),transparent 70%),#0A0A0D; }}
#rays {{ position:absolute; left:-460px; top:-40px; width:2000px; height:2000px; border-radius:50%; background:repeating-conic-gradient(rgba(255,193,7,.06) 0 6deg,transparent 6deg 18deg); -webkit-mask:radial-gradient(closest-side,#000 30%,transparent 75%); }}
.chip {{ position:absolute; left:0; right:0; top:96px; text-align:center; }}
.chip span {{ display:inline-flex; align-items:center; gap:12px; padding:12px 26px 12px 14px; border-radius:999px; background:#fff; color:#111; font:800 30px/1 "Montserrat",sans-serif; }}
.chip img {{ width:42px; height:42px; }}
#intro-t {{ left:50px; right:50px; top:520px; text-align:center; font:800 108px/1.03 "Montserrat",sans-serif; letter-spacing:-.03em; }}
#intro-t em {{ font-style:normal; color:{Y}; text-shadow:0 0 30px rgba(255,193,7,.6); }}
#intro-l {{ left:240px; top:1100px; width:600px; }}
#step {{ left:40px; right:40px; top:170px; height:100px; display:flex; align-items:center; justify-content:center; gap:18px; }}
#step b {{ display:grid; place-items:center; width:74px; height:74px; border-radius:50%; background:{Y}; color:#111; font:800 42px/1 "Montserrat",sans-serif; }}
#step span {{ font:800 52px/1.05 "Montserrat",sans-serif; color:#fff; }}
.st {{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:18px; opacity:0; }}
#phone {{ left:{PX - 16}px; top:{PY - 16}px; width:{PW + 32}px; height:{PH + 32}px; border-radius:76px; background:#16161B; box-shadow:inset 0 0 0 4px #2E2E36,0 0 0 3px {Y},0 0 90px rgba(255,193,7,.35),0 50px 90px -30px rgba(0,0,0,.9); }}
#scr {{ left:{PX}px; top:{PY}px; width:{PW}px; height:{PH}px; border-radius:62px; overflow:hidden; background:#000; }}
#scr video {{ width:100%; height:100%; object-fit:cover; display:block; }}
#url {{ left:{PX + 150}px; top:{PY - 64}px; width:{PW - 300}px; text-align:center; font:600 26px/1 "Inter",sans-serif; color:#CFCFCF; }}
.cap {{ position:absolute; left:60px; right:60px; bottom:120px; text-align:center; }}
.cap span {{ display:inline-block; padding:14px 24px; border-radius:20px; background:{Y}; color:#0B0B0F; font:800 40px/1.25 "Montserrat",sans-serif; box-shadow:0 0 24px rgba(255,193,7,.45); opacity:0; }}
#end {{ position:absolute; inset:0; opacity:0; }}
#end .t {{ position:absolute; left:50px; right:50px; top:200px; text-align:center; font:800 104px/1 "Montserrat",sans-serif; letter-spacing:-.03em; }}
#end .t em {{ font-style:normal; color:{Y}; }}
#end .s {{ position:absolute; left:60px; right:60px; top:440px; text-align:center; font:700 42px/1.3 "Inter",sans-serif; color:#E6E6E6; }}
#end .f {{ position:absolute; left:60px; right:60px; top:620px; display:flex; flex-wrap:wrap; justify-content:center; gap:14px; }}
#end .f span {{ padding:16px 24px; border-radius:999px; background:#1C1C22; box-shadow:inset 0 0 0 2px #3A3A44; font:700 32px/1 "Inter",sans-serif; }}
#end .f b {{ color:{Y}; margin-right:8px; }}
#end .qr {{ position:absolute; left:380px; top:860px; width:320px; padding:20px 20px 12px; border-radius:28px; background:#fff; text-align:center; }}
#end .qr img {{ width:100%; display:block; }}
#end .qr b {{ display:block; margin-top:8px; font:800 26px/1.1 "Montserrat",sans-serif; color:#1F1F1F; }}
#end .ak {{ position:absolute; left:0; right:0; top:1290px; text-align:center; }}
#end .ak span {{ display:inline-block; padding:18px 30px; border-radius:999px; background:#fff; color:#111; font:800 34px/1 "Montserrat",sans-serif; }}
#end .pb {{ position:absolute; left:0; right:0; top:1400px; text-align:center; font:700 32px/1 "Inter",sans-serif; color:#CFCFCF; }}
#end .pb img {{ width:60px; vertical-align:middle; margin-right:10px; }}
'''

def build():
    steps = ''.join(f'<div class="st" id="st{i}"><b>{n}</b><span>{t}</span></div>' for i, (_, n, t) in enumerate(STEPS))
    caps = ''; cj = ''; k = 0
    for n, t0 in VOS.items():
        d = vdur(n); parts = chunks(LINES[n], 38); tot = sum(len(p) for p in parts); c = t0
        for j, part in enumerate(parts):
            pd = d * len(part) / tot
            caps += f'<div class="cap"><span id="c{k}">{part}</span></div>'
            cj += f'tl.set("#c{k}",{{opacity:1}},{c:.2f});tl.set("#c{k}",{{opacity:0}},{c + pd + (.25 if j == len(parts) - 1 else 0):.2f});\n'
            c += pd; k += 1
    sj = ''
    for i, (t, _, _) in enumerate(STEPS):
        a = A + t; b = A + STEPS[i + 1][0] if i + 1 < len(STEPS) else E
        sj += f'tl.fromTo("#st{i}",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.3,ease:"back.out(2)"}},{a:.2f});tl.to("#st{i}",{{opacity:0,y:-20,duration:.2}},{b - .2:.2f});\n'
    audio = ''.join(f'<audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{t:.2f}" data-duration="{vdur(n):.2f}" data-track-index="3" data-volume="1"></audio>' for n, t in VOS.items())
    if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
        audio += f'<audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-volume="0.4"></audio>'
    feats = ''.join(f'<span class="ft"><b>✓</b>{t}</span>' for t in ['Dominio y hosting', 'WhatsApp y Google Maps', 'Reservas en línea', 'Políticas y cookies', 'Ajustes cada mes'])
    html = f'''<!doctype html>
<html lang="es-CO">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" /><script src="assets/vendor/gsap.min.js"></script><style>{CSS}</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
<div id="bg"></div><div id="rays"></div>
<div class="chip"><span><img src="assets/brand/flower.svg" alt="">Pascal Web · de PascalIA</span></div>
<h1 id="intro-t" class="abs">¿Tu restaurante tiene una página que <em>dé hambre</em>?</h1>
<img id="intro-l" class="abs" src="assets/brand/logo-letras.webp" alt="">
<div id="step" class="abs">{steps}</div>
<div id="phone" class="abs"></div>
<p id="url" class="abs">🔒 laniebla.co</p>
<div id="scr" class="abs"><video id="app" class="clip" src="assets/video/app.mp4" data-start="{A}" data-duration="{APP:.2f}" data-media-start="0" data-track-index="2" muted playsinline></video></div>
<div id="end"><h2 class="t">Pascal <em>Web</em></h2><p class="s">Diseñamos, creamos y mantenemos<br>la página de tu negocio</p><div class="f">{feats}</div>
<div class="qr"><img src="assets/brand/qr-pascalweb.svg" alt=""><b>Mira los ejemplos</b></div>
<div class="ak"><span>📤 Mándaselo a tu amigo con restaurante</span></div><p class="pb"><img src="assets/brand/flower.svg" alt="">PascalIA · pascalia.lat</p></div>
{caps}
{audio}
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
tl.to("#rays",{{rotation:50,duration:{TOTAL},ease:"none"}},0);
tl.from("#intro-t",{{opacity:0,scale:1.25,duration:.5,ease:"back.out(1.8)"}},.1);
tl.from("#intro-l",{{opacity:0,y:60,duration:.5,ease:"power3.out"}},.9);
tl.to(["#intro-t","#intro-l"],{{opacity:0,y:-80,duration:.4,ease:"power2.in"}},{A - .45:.2f});
tl.from(["#phone","#scr","#url"],{{opacity:0,y:300,scale:.85,duration:.6,ease:"back.out(1.3)"}},{A - .5:.2f});
{sj}
tl.to(["#phone","#scr","#url"],{{opacity:0,scale:.8,y:200,duration:.5,ease:"power2.in"}},{E - .1:.2f});
tl.to("#end",{{opacity:1,duration:.4}},{E + .2:.2f});
tl.from("#end .t",{{opacity:0,scale:1.4,duration:.5,ease:"back.out(2)"}},{E + .3:.2f});
tl.from("#end .s",{{opacity:0,y:30,duration:.4}},{E + .8:.2f});
tl.from("#end .ft",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2.4)",stagger:.15}},{VOS['w09'] + 3.5:.2f});
tl.from("#end .qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{VOS['w09'] + 7:.2f});
tl.from("#end .ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{VOS['w09'] + 11:.2f});
tl.from("#end .pb",{{opacity:0,y:20,duration:.4}},{VOS['w09'] + 8:.2f});
{cj}
window.__timelines["main"] = tl;
</script>
</body>
</html>'''
    open(os.path.join(ROOT, 'index.html'), 'w').write(html)
    scenes = [{'id': n, 'start': t, 'dur': vdur(n), 'vo': [t, vdur(n)]} for n, t in VOS.items()]
    json.dump({'total': TOTAL, 'scenes': scenes, 'video': TOTAL, 'speech': [s['vo'] for s in scenes]}, open(os.path.join(ROOT, 'tools', 'timing.json'), 'w'), indent=1)
    print('total', TOTAL, 'app', round(APP, 2), VOS)

if __name__ == '__main__':
    build()
