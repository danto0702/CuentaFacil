# Builds the Pascal Sign promo ("¿Dónde está tu firma?"): 10 scene sub-compositions timed to the voice lines,
# dark graphite for the problem, PascalIA yellow from "Hasta ahora". Captions follow the voice in a bottom bar.
import os, re, json, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = shown

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n]) / 16)

SPRITE = open(os.path.join(ROOT, '..', '..', 'marca', 'kit-marca-pascalia', 'iconos', 'iconos.svg')).read()
ICON = {m[1]: m[2] for m in re.finditer(r'<symbol id="([^"]+)" viewBox="0 0 24 24">(.*?)</symbol>', SPRITE, re.S)}
def icon(n, stroke='#1F1F1F', cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" style="stroke:{stroke}" aria-hidden="true">{ICON[n]}</svg>'

SIGS = [
    'M10 70 C30 20 50 20 45 60 C42 85 70 30 90 40 C110 50 95 80 120 60 C140 45 150 30 160 55 C170 80 190 40 210 45 C230 50 220 75 250 60 C270 50 290 35 300 50 M40 88 C120 98 220 92 290 80',
    'M15 60 C25 30 60 15 55 50 C50 80 30 85 40 60 C55 35 85 70 100 45 C115 25 125 70 140 50 C160 25 175 65 195 50 C215 35 230 55 250 45 M60 82 C140 72 220 77 280 67',
    'M20 50 C40 10 70 80 85 40 C95 15 110 60 125 45 C140 30 150 60 170 40 C185 25 200 70 225 45 C245 25 265 60 290 40 M30 78 C110 72 200 76 270 70',
]
def sig(i, cls='', style='', color='#1B2A6B', sw=5):
    return f'<svg class="sig {cls}" viewBox="0 0 310 100" style="{style}"><path d="{SIGS[i % 3]}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>'

FONTS = '''
@font-face{font-family:"Montserrat";font-weight:700;src:url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:"Montserrat";font-weight:800;src:url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-weight:500;src:url("assets/fonts/inter-latin-500-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url("assets/fonts/inter-latin-600-normal.woff2") format("woff2")}
'''
CSS = '''
#root{font-family:"Inter",sans-serif;color:#fff}
.abs{position:absolute}
.dark{position:absolute;inset:0;background:radial-gradient(90% 60% at 50% 30%,#2B2B2B 0%,#151515 60%,#0B0B0B 100%)}
.light{position:absolute;inset:0;background:radial-gradient(80% 45% at 50% 12%,rgba(255,193,7,.28),transparent 70%),linear-gradient(180deg,#FFF8E1 0%,#FFFDF5 55%,#FFFFFF 100%)}
.yel{position:absolute;inset:0;background:#FFC107}
.h{position:absolute;left:60px;right:60px;text-align:center;font-family:"Montserrat",sans-serif;font-weight:800;letter-spacing:-.02em;line-height:1.05}
.h.w{color:#fff}.h.g{color:#1F1F1F}
.mk{background:linear-gradient(transparent 58%,#FFC107 58%,#FFC107 90%,transparent 90%);padding:0 .06em}
.yy{color:#FFC107}
.red{color:#FF5A5A}
.ic{width:100%;height:100%;fill:none;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round}
.phone{position:absolute;border-radius:64px;background:#0E0E0E;border:12px solid #2A2A2A;box-shadow:0 40px 80px -30px rgba(0,0,0,.8),0 0 0 2px #444;overflow:hidden}
.phone.lite{border-color:#1F1F1F;box-shadow:0 40px 80px -30px rgba(31,31,31,.45)}
.scr{position:absolute;inset:0;overflow:hidden}
.wa-top{height:120px;background:#1F2C34;display:flex;align-items:flex-end;padding:0 26px 18px;gap:16px;color:#E9EDEF;font:700 34px/1 "Inter",sans-serif}
.wa-search{margin:22px 22px 0;height:76px;border-radius:40px;background:#202C33;display:flex;align-items:center;gap:16px;padding:0 26px;color:#E9EDEF;font:500 36px/1 "Inter",sans-serif}
.wa-search .ic{width:36px;height:36px}
.caret{display:inline-block;width:3px;height:40px;background:#25D366;margin-left:4px;vertical-align:middle}
.tile-sig{position:absolute;width:190px;height:150px;border-radius:14px;background:#F1EEE6;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.5)}
.tile-sig .sig{width:160px}
.doc{position:absolute;width:300px;height:400px;border-radius:18px;background:#FAFAF7;color:#1F1F1F;padding:26px;box-shadow:0 20px 40px -12px rgba(0,0,0,.7)}
.doc b{display:block;font:800 30px/1 "Montserrat",sans-serif;letter-spacing:.06em}
.doc s{display:block;height:12px;border-radius:6px;background:#DDD;margin-top:14px}
.doc .sig{position:absolute;left:30px;bottom:40px;width:220px}
.chip{display:inline-flex;align-items:center;gap:12px;padding:16px 30px;border-radius:999px;font:800 34px/1 "Montserrat",sans-serif}
.cap{position:absolute;left:70px;right:70px;bottom:250px;display:flex;justify-content:center}
.cap span{display:inline-block;max-width:940px;padding:18px 28px;border-radius:24px;background:rgba(15,15,15,.88);color:#fff;font:700 40px/1.25 "Montserrat",sans-serif;text-align:center;opacity:0}
.card{position:absolute;border-radius:36px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 30px 60px -24px rgba(31,31,31,.35);color:#1F1F1F}
.row{display:grid;grid-template-columns:160px 1fr 230px;gap:16px;align-items:center;padding:20px 28px;border-top:2px solid #EFEFEF;font:600 28px/1.2 "Inter",sans-serif}
.row b{font:800 28px/1 "Montserrat",sans-serif;color:#8A6100;text-align:right}
.row i{font-style:normal;color:#5C5C5C}
.char{position:absolute;filter:drop-shadow(0 26px 30px rgba(31,31,31,.3))}
'''
def page(cid, css, body, js):
    return f'''<!doctype html>
<html lang="es-CO">
<head><meta charset="UTF-8" /></head>
<body>
<template>
<style>
{FONTS}
#root{{position:absolute;inset:0;overflow:hidden}}
{CSS}
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

def chunks(text, limit=52):
    words = text.split(); out = []; cur = ''
    for w in words:
        if cur and len(cur) + 1 + len(w) > limit: out.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…:,]$', w) and len(cur) > limit * .45: out.append(cur); cur = ''
    if cur: out.append(cur)
    return out

def k(D, s, per): return max(1, int((D - s - .2) / per) - 1)

# ---------- scenes: (line id, background, extra tail, css, body, js(D, s, d)) ----------
S = []
# 1 · busca "firma"
S.append(('s01', 'dark', .25, '''
#X-t1{top:150px;font-size:58px}
#X-t2{top:230px;font-size:92px}
#X-ph{left:190px;top:520px;width:700px;height:1020px}
#X-typed{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:middle;width:0}
''', f'''
<p id="X-t1" class="h w">Haz esto ya:</p>
<h1 id="X-t2" class="h w">busca <span class="yy">"firma"</span><br>en tu WhatsApp</h1>
<div id="X-ph" class="phone"><div class="scr" style="background:#111B21">
  <div class="wa-top">WhatsApp</div>
  <div class="wa-search">{icon("search", "#8696A0")}<span id="X-typed">firma</span><i class="caret" id="X-caret"></i></div>
</div></div>
''', lambda D, s, d: f'''
tl.from("#X-t1",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t2",{{opacity:0,scale:1.3,duration:.45,ease:"back.out(1.6)"}},.15);
tl.from("#X-ph",{{y:900,duration:.6,ease:"power3.out"}},.3);
tl.to("#X-typed",{{width:110,duration:{min(1.4, d * .5):.2f},ease:"steps(5)"}},{s + d * .45:.2f});
tl.to("#X-caret",{{opacity:0,duration:.4,yoyo:true,repeat:{k(D, .6, .4)},ease:"steps(1)"}},.6);
'''))
# 2 · fotos de tu firma
TILES = [(40, 270, -6), (250, 250, 4), (460, 285, -3), (40, 460, 5), (250, 445, -5), (460, 470, 3), (40, 650, -4), (250, 640, 6), (460, 665, -2)]
S.append(('s02', 'dark', .3, '''
#X-t{top:140px;font-size:96px}
#X-ph{left:190px;top:420px;width:700px;height:1020px}
''', f'''
<h1 id="X-t" class="h w">¿Cuántas<br><span class="red">encontraste?</span></h1>
<div id="X-ph" class="phone"><div class="scr" style="background:#111B21">
  <div class="wa-top">WhatsApp</div>
  <div class="wa-search">{icon("search", "#8696A0")}<span>firma</span></div>
  {''.join(f'<div class="tile-sig X-tile" style="left:{x}px;top:{y}px;transform:rotate({r}deg)">{sig(i)}</div>' for i, (x, y, r) in enumerate(TILES))}
</div></div>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from(".X-tile",{{scale:0,opacity:0,duration:.25,ease:"back.out(2.5)",stagger:.12}},.2);
tl.to("#X-ph",{{scale:1.08,duration:{D:.2f},ease:"none"}},0);
'''))
# 3 · reutilizada
DOCS = [('ACTA', 60, 560, -8), ('CONTRATO', 720, 520, 7), ('RECIBO', 80, 1020, 6), ('PAGARÉ', 700, 1000, -6)]
S.append(('s03', 'dark', .3, '''
#X-t{top:150px;font-size:84px}
#X-src{left:290px;top:760px;width:500px;height:200px;border-radius:24px;background:#F1EEE6;display:grid;place-items:center;box-shadow:0 0 0 6px #FF5A5A,0 0 60px rgba(255,90,90,.5)}
#X-src .sig{width:420px}
#X-flash{inset:0;background:rgba(255,40,40,.25);opacity:0}
''', f'''
<h1 id="X-t" class="h w">Tu firma,<br><span class="red">reutilizada</span><br>sin permiso</h1>
{''.join(f'<div class="doc X-doc" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><b>{t}</b><s></s><s></s><s style="width:70%"></s><s></s>{sig(0, "X-cl")}</div>' for t, x, y, r in DOCS)}
<div id="X-src" class="abs">{sig(0)}</div>
<div id="X-flash" class="abs"></div>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-src",{{scale:.4,opacity:0,duration:.35,ease:"back.out(2)"}},.2);
tl.from(".X-doc",{{opacity:0,scale:.6,duration:.35,ease:"back.out(1.6)",stagger:.25}},.6);
tl.from(".X-cl",{{opacity:0,scale:2.2,duration:.25,ease:"power4.in",stagger:.25}},.9);
tl.to("#X-flash",{{opacity:1,duration:.15,yoyo:true,repeat:{k(D, 1.2, .5) // 2 * 2 + 1},repeatDelay:.35,ease:"none"}},1.2);
tl.to("#X-src",{{x:8,duration:.06,yoyo:true,repeat:{k(D, 1.2, .06)},ease:"none"}},1.2);
'''))
# 4 · esperar al computador
S.append(('s04', 'dark', .3, '''
#X-t{top:150px;font-size:84px}
#X-ph{left:110px;top:560px;width:460px;height:820px}
#X-notif{position:absolute;left:18px;right:18px;top:60px;padding:22px;border-radius:26px;background:#2A2A2A;color:#fff;font:600 28px/1.25 "Inter",sans-serif}
#X-notif b{display:block;color:#FF5A5A;font:800 26px/1 "Montserrat",sans-serif;margin-bottom:8px}
#X-hg{left:650px;top:600px;width:300px}
#X-pc{left:620px;top:1040px;width:360px;height:250px}
#X-pcl{left:620px;top:1300px;width:360px;text-align:center;font:700 34px/1.2 "Montserrat",sans-serif;color:#BDBDBD}
''', f'''
<h1 id="X-t" class="h w">¿Esperar al<br><span class="red">computador</span><br>para firmar?</h1>
<div id="X-ph" class="phone"><div class="scr" style="background:#1B1B1B"><div id="X-notif"><b>URGENTE</b>Firma este documento hoy, por favor 🙏</div></div></div>
<svg id="X-hg" class="abs" viewBox="0 0 200 300"><rect x="10" y="0" width="180" height="22" rx="8" fill="#8B5A2B"/><rect x="10" y="278" width="180" height="22" rx="8" fill="#8B5A2B"/><path d="M30 22 L170 22 C170 90 112 120 106 150 C112 180 170 210 170 278 L30 278 C30 210 88 180 94 150 C88 120 30 90 30 22 Z" fill="rgba(255,255,255,.08)" stroke="#EDE6FF" stroke-width="5"/><path d="M52 60 L148 60 C140 96 112 118 100 140 C88 118 60 96 52 60 Z" fill="#FFC107"/><path d="M48 272 L152 272 C150 248 120 236 100 220 C80 236 50 248 48 272 Z" fill="#FFC107"/></svg>
<div id="X-pc" class="abs">{icon("devices", "#8A8A8A")}</div>
<p id="X-pcl" class="abs">"Te lo firmo cuando<br>llegue al computador…"</p>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{x:-600,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-notif",{{y:-200,opacity:0,duration:.4,ease:"back.out(1.8)"}},.6);
tl.to("#X-notif",{{x:10,duration:.06,yoyo:true,repeat:9,ease:"none"}},1.0);
tl.from("#X-hg",{{opacity:0,scale:.5,duration:.4,ease:"back.out(1.8)"}},.8);
tl.to("#X-hg",{{rotation:180,transformOrigin:"50% 50%",duration:.6,ease:"power2.inOut",repeat:{k(D, 1.6, 1.4)},repeatDelay:.8}},1.6);
tl.from("#X-pc, #X-pcl",{{opacity:0,y:40,duration:.4,stagger:.15}},1.2);
'''))
# 5 · nadie tiene control
S.append(('s05', 'black', .5, '''
#X-t{top:640px;font-size:108px;line-height:1.05}
#X-t .w{display:inline-block;margin:0 .13em}
''', '''<h1 id="X-t" class="h w"><span class="w">Nadie</span> <span class="w">tiene</span><br><span class="w red">control</span><br><span class="w">sobre</span> <span class="w">sus</span><br><span class="w">firmas</span></h1>''',
lambda D, s, d: f'''
tl.from("#X-t .w",{{opacity:0,y:40,duration:.3,ease:"power3.out",stagger:{max(.08, d / 10):.2f}}},{s:.2f});
tl.to("#X-t",{{x:6,duration:.05,yoyo:true,repeat:7,ease:"none"}},{s + d * .6:.2f});
'''))
# 6 · hasta ahora (logo)
S.append(('s06', 'yel', .7, '''
#X-wipe{inset:0;background:#0B0B0B;transform-origin:50% 0%}
#X-logo{left:240px;top:520px;width:600px;height:600px;border-radius:120px;box-shadow:0 40px 80px -30px rgba(31,31,31,.6)}
#X-t{top:1220px;font-size:110px}
''', '''<img id="X-logo" class="abs" src="assets/brand/pascal-sign-logo.webp" alt=""><h1 id="X-t" class="h g">Hasta <span class="mk">ahora</span>.</h1><div id="X-wipe" class="abs"></div>''',
lambda D, s, d: f'''
tl.to("#X-wipe",{{scaleY:0,duration:.45,ease:"power3.inOut"}},0);
tl.from("#X-logo",{{scale:.2,rotation:-20,opacity:0,duration:.6,ease:"back.out(1.7)"}},.25);
tl.from("#X-t",{{opacity:0,y:50,duration:.4,ease:"power3.out"}},{s:.2f});
tl.to("#X-logo",{{scale:1.04,duration:.4,yoyo:true,repeat:{k(D, 1.0, .4)},ease:"sine.inOut"}},1.0);
'''))
# 7 · firmas a la mano
S.append(('s07', 'light', .35, '''
#X-t{top:130px;font-size:90px}
#X-ph{left:120px;top:440px;width:600px;height:1080px}
#X-pdf{position:absolute;left:34px;right:34px;top:70px;bottom:150px;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9;padding:34px;color:#1F1F1F}
#X-pdf b{display:block;font:800 30px/1 "Montserrat",sans-serif;margin-bottom:16px}
#X-pdf s{display:block;height:12px;border-radius:6px;background:#E5E5E5;margin-top:14px}
#X-pdf .sig{position:absolute;left:40px;bottom:130px;width:360px}
#X-line{position:absolute;left:40px;right:120px;bottom:120px;height:3px;background:#BDBDBD}
#X-btn{position:absolute;left:34px;right:34px;bottom:40px;height:90px;border-radius:45px;background:#FFC107;display:flex;align-items:center;justify-content:center;gap:12px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-btn .ic{width:40px;height:40px}
#X-dot{position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(255,193,7,.55);box-shadow:0 0 0 6px rgba(255,193,7,.25);left:70px;top:720px}
#X-p{left:690px;top:820px;height:1020px}
''', f'''
<h1 id="X-t" class="h g">Tus firmas <span class="mk">a la mano</span></h1>
<div id="X-ph" class="phone lite"><div class="scr" style="background:#F2EBD6"><div id="X-pdf"><b>Acta de entrega.pdf</b><s></s><s></s><s style="width:80%"></s><s></s><s style="width:60%"></s><div id="X-line"></div>{sig(1, "X-sig", "", "#1B2A6B", 6)}</div>
<div id="X-btn">{icon("check")}Listo</div></div><div id="X-dot"></div></div>
<img id="X-p" class="char" src="assets/chars/pascal-celular.webp" alt="">
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:900,duration:.55,ease:"power3.out"}},.15);
tl.from("#X-p",{{x:500,duration:.55,ease:"power3.out"}},.3);
tl.fromTo(".X-sig path",{{strokeDasharray:1400,strokeDashoffset:1400}},{{strokeDashoffset:0,duration:{min(2.2, d * .5):.2f},ease:"power1.inOut"}},{s + d * .25:.2f});
tl.fromTo("#X-dot",{{x:0,y:0}},{{x:330,y:-20,duration:{min(2.2, d * .5):.2f},ease:"power1.inOut"}},{s + d * .25:.2f});
tl.to("#X-dot",{{opacity:0,duration:.2}},{s + d * .25 + min(2.2, d * .5):.2f});
tl.from("#X-btn",{{scale:.8,opacity:.4,duration:.3,ease:"back.out(2)"}},{s + d * .25 + min(2.2, d * .5) + .1:.2f});
'''))
# 8 · solo en tu dispositivo
S.append(('s08', 'light', .35, '''
#X-t{top:130px;font-size:90px}
#X-ph{left:290px;top:520px;width:500px;height:880px}
#X-lock{position:absolute;left:150px;top:300px;width:200px;height:200px;border-radius:50%;background:#FFC107;padding:46px;box-shadow:0 0 0 18px rgba(255,193,7,.25)}
#X-card{left:330px;top:1000px;width:420px;height:150px;border-radius:24px;background:#fff;display:grid;place-items:center;box-shadow:0 20px 40px -14px rgba(31,31,31,.35)}
#X-card .sig{width:360px}
.X-no{position:absolute;width:190px;height:190px;border-radius:40px;background:#fff;padding:44px;box-shadow:0 16px 34px -14px rgba(31,31,31,.35)}
.X-no::after{content:"";position:absolute;left:-10px;right:-10px;top:50%;height:12px;margin-top:-6px;border-radius:6px;background:#E5484D;transform:rotate(-35deg)}
''', f'''
<h1 id="X-t" class="h g">Solo en tu<br><span class="mk">dispositivo</span></h1>
<div id="X-ph" class="phone lite"><div class="scr" style="background:#1F1F1F"><div id="X-lock">{icon("lock")}</div></div></div>
<div id="X-no1" class="X-no" style="left:50px;top:640px">{icon("chat")}</div>
<div id="X-no2" class="X-no" style="left:840px;top:640px">{icon("doc")}</div>
<div id="X-card" class="abs">{sig(2)}</div>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{scale:.6,opacity:0,duration:.45,ease:"back.out(1.6)"}},.15);
tl.from("#X-card",{{x:-700,duration:.45,ease:"power3.out"}},.4);
tl.to("#X-card",{{x:-70,y:-520,scale:.35,opacity:0,duration:.7,ease:"power2.in"}},{s + d * .25:.2f});
tl.from("#X-lock",{{scale:0,rotation:-60,duration:.45,ease:"back.out(2.5)"}},{s + d * .25 + .6:.2f});
tl.from("#X-no1",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from("#X-no2",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .75:.2f});
'''))
# 9 · detallado con consecutivo
ROWS = [('03/11/2026', 'Acta de entrega', 'DT-0042-2026'), ('31/10/2026', 'Informe de actividades', 'DT-0041-2026'), ('28/10/2026', 'Cuenta de cobro', 'DT-0040-2026'), ('24/10/2026', 'Contrato de servicios', 'DT-0039-2026'), ('20/10/2026', 'Constancia', 'DT-0038-2026')]
S.append(('s09', 'light', .45, '''
#X-t{top:120px;font-size:84px}
#X-rep{left:50px;top:470px;width:980px;overflow:hidden}
#X-rep h3{display:flex;align-items:center;gap:16px;padding:30px 28px 22px;font:800 38px/1 "Montserrat",sans-serif}
#X-rep h3 img{width:64px;height:64px;border-radius:16px}
.X-hd{display:grid;grid-template-columns:160px 1fr 230px;gap:16px;padding:14px 28px;background:#FFF8E1;font:800 22px/1 "Montserrat",sans-serif;letter-spacing:.08em;color:#8A6100}
#X-dl{left:300px;top:1300px;width:480px;height:110px;border-radius:55px;background:#1F1F1F;color:#fff;display:flex;align-items:center;justify-content:center;gap:16px;font:800 36px/1 "Montserrat",sans-serif}
#X-dl .ic{width:44px;height:44px;transform:rotate(180deg)}
''', f'''
<h1 id="X-t" class="h g">Tu historial,<br>con <span class="mk">consecutivo</span></h1>
<div id="X-rep" class="card"><h3><img src="assets/brand/pascal-sign-logo.webp" alt="">Mis firmas</h3>
<div class="X-hd"><span>FECHA</span><span>DOCUMENTO</span><span style="text-align:right">CONSECUTIVO</span></div>
{''.join(f'<div class="row X-row"><i>{a}</i><span>{b}</span><b>{c}</b></div>' for a, b, c in ROWS)}</div>
<div id="X-dl" class="abs">{icon("upload", "#FFC107")}Descargar</div>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-rep",{{y:120,opacity:0,duration:.45,ease:"power3.out"}},.15);
tl.from(".X-row",{{opacity:0,x:-80,duration:.3,ease:"power3.out",stagger:.18}},.5);
tl.from("#X-dl",{{scale:.5,opacity:0,duration:.35,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.to("#X-dl",{{scale:1.06,duration:.35,yoyo:true,repeat:{k(D, s + d * .4 + .4, .35)},ease:"sine.inOut"}},{s + d * .4 + .4:.2f});
tl.fromTo(".X-row b",{{backgroundColor:"rgba(255,193,7,0)"}},{{backgroundColor:"rgba(255,193,7,.35)",duration:.3,stagger:.12}},{s + d * .7:.2f});
'''))
# 10 · cierre
S.append(('s10', 'light', 2.2, '''
#X-t{top:110px;font-size:80px}
#X-p{left:-10px;top:760px;height:1100px}
#X-qr{left:450px;top:440px;width:580px;padding:40px 40px 26px;border-radius:44px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 30px 60px -24px rgba(31,31,31,.3)}
#X-qrc{position:relative;width:500px;height:500px}
#X-qrc > img:first-child{width:100%;height:100%;display:block}
#X-qrl{position:absolute;left:50%;top:50%;width:136px;height:136px;margin:-68px 0 0 -68px;border-radius:30px;box-shadow:0 0 0 10px #fff}
#X-cap{margin-top:20px;font:800 32px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-url{left:450px;top:1180px;width:580px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-trial{left:450px;top:1260px;width:580px;text-align:center}
#X-legal{left:440px;right:40px;bottom:90px;text-align:center;font:500 24px/1.3 "Inter",sans-serif;color:#5C5C5C}
''', f'''
<h1 id="X-t" class="h g">Recupera el control<br>de tu <span class="mk">firma</span></h1>
<img id="X-p" class="char" src="assets/chars/pascal-senala.webp" alt="">
<div id="X-qr" class="abs"><div id="X-qrc"><img src="assets/brand/qr-pascal-sign.svg" alt=""><img id="X-qrl" src="assets/brand/pascal-sign-logo.webp" alt=""></div><p id="X-cap">Escanéame y firma</p></div>
<p id="X-url" class="abs">pascalia.lat/PascalSign</p>
<div id="X-trial" class="abs"><span class="chip" style="background:#1F1F1F;color:#fff">Prueba <span class="yy">gratis</span> 7 días</span></div>
<p id="X-legal" class="abs">Firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012)</p>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.45,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-520,duration:.55,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.4,opacity:0,rotation:-8,duration:.6,ease:"back.out(1.8)"}},.4);
tl.from("#X-url",{{opacity:0,y:30,duration:.4}},.9);
tl.from("#X-trial",{{opacity:0,scale:.6,duration:.45,ease:"back.out(2.2)"}},{s + d * .55:.2f});
tl.to("#X-trial",{{scale:1.06,duration:.4,yoyo:true,repeat:{k(D, s + d * .55 + .5, .4)},ease:"sine.inOut"}},{s + d * .55 + .5:.2f});
tl.from("#X-legal",{{opacity:0,duration:.4}},1.2);
'''))

BG = {'dark': '<div class="dark"></div>', 'light': '<div class="light"></div>', 'yel': '<div class="yel"></div>', 'black': '<div class="abs" style="inset:0;background:#050505"></div>'}
LEAD = .3

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    t = 0.0; rows = []; timing = []
    for n, bg, tail, css, body, jsf in S:
        cid = f'f{n}'; d = round(dur(n), 2); s = LEAD; D = round(s + d + tail, 2)
        caps = ''; cj = ''
        parts = chunks(LINES[n]); tot = sum(len(p) for p in parts); c = s
        for j, part in enumerate(parts):
            pd = d * len(part) / tot
            caps += f'<div class="cap"><span id="{cid}-c{j}">{part}</span></div>'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:1}},{c:.2f});\n'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:0}},{min(D - .05, c + pd + (.3 if j == len(parts) - 1 else 0)):.2f});\n'
            c += pd
        X = cid
        html = page(cid, css.replace('X-', f'{X}-'), (BG[bg] + body.replace('X-', f'{X}-') + caps), jsf(D, s, d).replace('X-', f'{X}-') + cj)
        open(os.path.join(fr, f'{cid}.html'), 'w').write(html)
        rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{cid}.html" data-start="{t:.2f}" data-duration="{D:.2f}" data-track-index="1" data-width="1080" data-height="1920"></div>')
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{t + s:.2f}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
        timing.append({'id': n, 'start': round(t, 2), 'dur': D, 'vo': [round(t + s, 2), d], 'bg': bg})
        t = round(t + D, 2)
    if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
        rows.append(f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{t}" data-track-index="4" data-volume="0.5"></audio>')
    json.dump({'total': t, 'scenes': timing}, open(os.path.join(ROOT, 'tools', 'timing.json'), 'w'), indent=1)
    open(os.path.join(ROOT, 'index.html'), 'w').write(f'''<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0B0B0B; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{t}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
''')
    print('total', t)

if __name__ == '__main__':
    build()
