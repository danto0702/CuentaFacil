# Builds "El interrogatorio", the second Pascal Sign promo: a police-parody in an interrogation room, timed to the voices.
# Reuses the drawing helpers of the first Pascal Sign video (videos/pascal-sign/tools/build.py).
import os, re, sys, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('v1', os.path.join(ROOT, '..', 'pascal-sign', 'tools', 'build.py'))
v1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v1)
icon, sig, page, chunks, k = v1.icon, v1.sig, v1.page, v1.chunks, v1.k

VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = (who, shown)

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n][1]) / 16)

EXTRA = '''
.room{position:absolute;inset:0;background:url("assets/brand/sala.webp") center/cover}
.cone{position:absolute;left:190px;top:330px;width:700px;height:1300px;background:radial-gradient(50% 60% at 50% 0%,rgba(255,236,190,.28),transparent 70%);transform-origin:50% 0%;mix-blend-mode:screen;pointer-events:none}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.05) 30%,rgba(0,0,0,0) 60%,rgba(0,0,0,.35) 100%)}
.warm{position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 35%,rgba(255,193,7,.42),rgba(255,193,7,.12) 70%);mix-blend-mode:screen}
.ch{position:absolute;bottom:40px;filter:drop-shadow(0 24px 30px rgba(0,0,0,.6))}
.lab{display:block;font:800 22px/1 "Montserrat",sans-serif;letter-spacing:.1em;margin-bottom:8px;opacity:.8}
.cap span.D{background:rgba(70,52,30,.92)}
.cap span.C{background:rgba(25,55,95,.92)}
.cap span.P{background:#FFC107;color:#1F1F1F}
.pdoc{position:absolute;width:250px;height:330px;border-radius:14px;background:#FAFAF7;color:#1F1F1F;padding:20px;box-shadow:0 20px 40px -12px rgba(0,0,0,.75)}
.pdoc b{display:block;font:800 26px/1 "Montserrat",sans-serif;letter-spacing:.06em}
.pdoc s{display:block;height:10px;border-radius:5px;background:#DDD;margin-top:12px}
.pdoc .sig{position:absolute;left:24px;bottom:34px;width:190px}
.panel{position:absolute;left:60px;right:60px;top:300px;border-radius:40px;background:#fff;color:#1F1F1F;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);overflow:hidden}
.op{display:inline-flex;align-items:center;gap:12px;padding:16px 26px;border-radius:999px;background:#F4F4F4;font:800 32px/1 "Montserrat",sans-serif}
.op .ic{width:38px;height:38px}
.stamp{position:absolute;padding:18px 34px;border:10px solid #D7263D;border-radius:22px;color:#D7263D;font:800 78px/1 "Montserrat",sans-serif;letter-spacing:.04em;background:rgba(255,255,255,.08);text-shadow:0 0 1px #D7263D}
'''

def room(cone=True, warm=False):
    return '<div class="room"></div>' + ('<div class="cone X-cone"></div>' if cone else '') + '<div class="veil"></div>' + ('<div class="warm X-warm"></div>' if warm else '')

def ch(name, cls, style):
    return f'<img id="X-{cls}" class="ch" src="assets/chars/{name}.webp" style="{style}" alt="">'

DET = 'left:-30px;height:1130px'
CON = 'left:520px;height:840px'
PAS = 'right:10px;height:1000px'
DOCS = [('ACTA', 150, 440, -10), ('PAGARÉ', 415, 410, 4), ('CONTRATO', 680, 440, 9)]
def docs(extra=''):
    return ''.join(f'<div class="pdoc X-doc" id="X-d{i}" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><b>{t}</b><s></s><s></s><s style="width:70%"></s>{sig(0)}</div>' for i, (t, x, y, r) in enumerate(DOCS)) + extra

def sway(D):  # swinging lamp light, finite and seek-safe
    return f'tl.fromTo(".X-cone",{{rotation:-6}},{{rotation:6,duration:1.2,yoyo:true,repeat:{k(D, 0, 1.2)},ease:"sine.inOut"}},0);\n'

S = []
S.append(('i01', .3, '#X-t{top:150px;font-size:96px}', room() + f'''
<h1 id="X-t" class="h w">¿Usted<br><span class="red">firmó</span> esto?</h1>
{ch("contratista-nervioso", "c", CON)}{ch("detective-golpe", "d", DET)}
<div class="pdoc" id="X-paper" style="left:415px;top:420px;transform:rotate(-6deg)"><b>PAGARÉ</b><s></s><s></s><s style="width:70%"></s>{sig(0)}</div>
''', lambda D, s, d: sway(D) + f'''
tl.from("#X-d",{{x:-500,duration:.45,ease:"power3.out"}},0);
tl.from("#X-c",{{opacity:0,duration:.4}},0);
tl.from("#X-paper",{{y:-600,rotation:-40,duration:.35,ease:"power4.in"}},.25);
tl.to("#X-root-shake",{{}},0);
tl.from("#X-t",{{opacity:0,scale:1.6,duration:.35,ease:"back.out(1.6)"}},{s:.2f});
'''))
S.append(('i02', .3, '#X-zoom{position:absolute;inset:0;transform-origin:70% 70%}', '<div id="X-zoom">' + room() + f'''
{ch("contratista-nervioso", "c", CON)}{ch("detective-golpe", "d", DET)}
<div class="pdoc" style="left:415px;top:420px;transform:rotate(-6deg)"><b>PAGARÉ</b><s></s><s></s><s style="width:70%"></s>{sig(0)}</div></div>
''', lambda D, s, d: sway(D) + f'''
tl.fromTo("#X-zoom",{{scale:1}},{{scale:1.18,duration:{D:.2f},ease:"power1.inOut"}},0);
tl.to("#X-c",{{x:6,duration:.08,yoyo:true,repeat:{k(D, .4, .08)},ease:"none"}},.4);
'''))
S.append(('i03', .35, '#X-t{top:150px;font-size:80px}', room() + f'''
<h1 id="X-t" class="h w">¿Cuál firmó…<br><span class="red">y cuál no?</span></h1>
{ch("contratista-nervioso", "c", CON)}{ch("detective-senala", "d", DET)}{docs()}
''', lambda D, s, d: sway(D) + f'''
tl.from("#X-d0",{{y:-900,rotation:-50,duration:.35,ease:"power4.in"}},{s + d * .15:.2f});
tl.from("#X-d1",{{y:-900,rotation:40,duration:.35,ease:"power4.in"}},{s + d * .3:.2f});
tl.from("#X-d2",{{y:-900,rotation:-30,duration:.35,ease:"power4.in"}},{s + d * .45:.2f});
tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},{s + d * .6:.2f});
'''))
S.append(('i04', .35, '#X-t{top:150px;font-size:76px}', room() + f'''
<h1 id="X-t" class="h w">"¡Mi firma la tiene<br><span class="red">medio mundo</span>!"</h1>
{ch("contratista-desespero", "c", "left:470px;height:860px")}{ch("detective-senala", "d", DET)}{docs()}
''', lambda D, s, d: sway(D) + f'''
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.35,ease:"back.out(1.6)"}},{s:.2f});
tl.to("#X-c",{{rotation:-3,transformOrigin:"50% 100%",duration:.18,yoyo:true,repeat:{k(D, s, .18)},ease:"sine.inOut"}},{s:.2f});
'''))
S.append(('i05', .5, '#X-t{top:700px;font-size:100px}', '<div class="abs" style="inset:0;background:#050505"></div><h1 id="X-t" class="h w">¿Podrías decir<br>qué <span class="yy">firmaste</span>…<br>y qué <span class="red">no</span>?</h1>',
 lambda D, s, d: f'tl.from("#X-t",{{opacity:0,y:40,duration:.5,ease:"power3.out"}},{s:.2f});\n'))
S.append(('i06', .6, '''
#X-logo{left:330px;top:300px;width:420px;height:420px;border-radius:84px;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
#X-flash{inset:0;background:#FFC107;opacity:0}
''', room(cone=False, warm=True) + f'''
{ch("contratista-nervioso", "c", "left:300px;height:840px")}{ch("detective-golpe", "d", DET)}{ch("pascal-entra", "p", PAS)}
<img id="X-logo" class="abs" src="assets/brand/pascal-sign-logo.webp" alt=""><div id="X-flash" class="abs"></div>
''', lambda D, s, d: f'''
tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.5,ease:"power2.out"}},0);
tl.from(".X-warm",{{opacity:0,duration:.6}},0);
tl.from("#X-logo",{{scale:.2,rotation:-20,opacity:0,duration:.55,ease:"back.out(1.8)"}},.15);
tl.from("#X-p",{{x:600,duration:.7,ease:"power2.out"}},.25);
tl.to("#X-p",{{y:-10,duration:.18,yoyo:true,repeat:3,ease:"sine.inOut"}},.25);
'''))
S.append(('i07', .4, '''
#X-pn{top:250px;padding:34px 30px 40px;text-align:center}
#X-pn h3{font:800 50px/1.1 "Montserrat",sans-serif}
#X-ops{display:flex;justify-content:center;gap:16px;margin-top:26px}
#X-lockrow{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:30px;font:800 36px/1 "Montserrat",sans-serif}
#X-lock{width:80px;height:80px;border-radius:50%;background:#FFC107;padding:18px}
''', room(cone=False, warm=True) + f'''
<div id="X-pn" class="panel"><h3>Firma desde el celular</h3>
<div id="X-ops"><span id="X-o1" class="op">{icon("pen")}Dedo</span><span id="X-o2" class="op">{icon("upload")}Imagen</span><span id="X-o3" class="op">{icon("camera")}Foto</span></div>
<div id="X-lockrow"><span id="X-lock">{icon("lock")}</span>Solo en tu dispositivo</div></div>
{ch("contratista-nervioso", "c", "left:40px;height:840px")}{ch("pascal-muestra", "p", "right:40px;height:1040px")}
''', lambda D, s, d: f'''
tl.from("#X-pn",{{scale:.85,opacity:0,y:40,duration:.45,ease:"back.out(1.6)"}},0);
tl.from("#X-p",{{x:300,opacity:0,duration:.5,ease:"power3.out"}},0);
tl.to("#X-o1",{{backgroundColor:"#FFC107",scale:1.08,duration:.2}},{s + d * .3:.2f});
tl.to("#X-o1",{{scale:1,duration:.2}},{s + d * .4:.2f});
tl.to("#X-o2",{{backgroundColor:"#FFC107",scale:1.08,duration:.2}},{s + d * .4:.2f});
tl.to("#X-o2",{{scale:1,duration:.2}},{s + d * .5:.2f});
tl.to("#X-o3",{{backgroundColor:"#FFC107",scale:1.08,duration:.2}},{s + d * .5:.2f});
tl.to("#X-o3",{{scale:1,duration:.2}},{s + d * .6:.2f});
tl.from("#X-lockrow",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .66:.2f});
tl.from("#X-lock",{{rotation:-90,scale:0,duration:.4,ease:"back.out(2.5)"}},{s + d * .66:.2f});
'''))
ROWS = [('03/11/2026', 'Entrega de equipos', 'DT-0042-2026'), ('31/10/2026', 'Informe mensual', 'DT-0041-2026'), ('28/10/2026', 'Cuenta de cobro', 'DT-0040-2026')]
S.append(('i08', .45, '''
#X-pn{top:240px}
#X-pn h3{display:flex;align-items:center;gap:14px;padding:26px 28px 18px;font:800 36px/1 "Montserrat",sans-serif}
#X-pn h3 img{width:56px;height:56px;border-radius:14px}
.X-hd{display:grid;grid-template-columns:170px 1fr 240px;gap:14px;padding:12px 28px;background:#FFF8E1;font:800 20px/1 "Montserrat",sans-serif;letter-spacing:.08em;color:#8A6100}
#X-pn .row{grid-template-columns:170px 1fr 240px;padding:16px 28px;font-size:26px}
#X-miss{display:flex;align-items:center;gap:14px;padding:20px 28px;background:#FDECEA;color:#B3261E;font:800 30px/1.1 "Montserrat",sans-serif}
#X-miss .ic{width:40px;height:40px}
''', room(cone=False, warm=True) + f'''
<div id="X-pn" class="panel"><h3><img src="assets/brand/pascal-sign-logo.webp" alt="">Mis firmas</h3>
<div class="X-hd"><span>FECHA</span><span>RAZÓN</span><span style="text-align:right">Nº ÚNICO</span></div>
{''.join(f'<div class="row X-row"><i>{a}</i><span>{b}</span><b>{c}</b></div>' for a, b, c in ROWS)}
<div id="X-miss">{icon("alert", "#B3261E")}Pagaré: no está en el historial</div></div>
{ch("detective-celular", "d", "left:10px;height:1060px")}{ch("pascal-muestra", "p", "right:30px;height:1040px")}
''', lambda D, s, d: f'''
tl.from("#X-pn",{{y:60,opacity:0,duration:.45,ease:"power3.out"}},0);
tl.from(".X-row",{{opacity:0,x:-60,duration:.3,stagger:.15}},.3);
tl.from("#X-miss",{{opacity:0,scale:.8,duration:.35,ease:"back.out(2.2)"}},{s + d * .62:.2f});
tl.to("#X-miss",{{x:8,duration:.06,yoyo:true,repeat:7,ease:"none"}},{s + d * .62 + .35:.2f});
'''))
S.append(('i09', .6, '''
#X-st{left:150px;top:470px;transform:rotate(-10deg)}
#X-t{top:180px;font-size:72px}
''', room(cone=False, warm=True) + f'''
{ch("contratista-alivio", "c", "left:470px;height:860px")}{ch("detective-sello", "d", DET)}
<div class="pdoc" style="left:415px;top:360px;transform:rotate(-4deg)"><b>PAGARÉ</b><s></s><s></s><s style="width:70%"></s>{sig(0)}</div>
<div id="X-st" class="stamp">CASO CERRADO</div>
''', lambda D, s, d: f'''
tl.from("#X-d",{{x:-300,duration:.4,ease:"power3.out"}},0);
tl.fromTo("#X-st",{{scale:3.2,opacity:0}},{{scale:1,opacity:1,duration:.28,ease:"power4.in"}},{s + .1:.2f});
tl.to("#X-c",{{y:-12,duration:.3,yoyo:true,repeat:1,ease:"sine.inOut"}},{s + .5:.2f});
'''))
S.append(('i10', 2.2, '''
#X-t{top:110px;font-size:82px}
#X-p{left:0px;top:760px;height:1100px}
#X-qr{left:450px;top:440px;width:580px;padding:40px 40px 26px;border-radius:44px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 30px 60px -24px rgba(31,31,31,.3)}
#X-qrc{position:relative;width:500px;height:500px}
#X-qrc > img:first-child{width:100%;height:100%;display:block}
#X-qrl{position:absolute;left:50%;top:50%;width:136px;height:136px;margin:-68px 0 0 -68px;border-radius:30px;box-shadow:0 0 0 10px #fff}
#X-cap{margin-top:20px;font:800 32px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-url{left:450px;top:1180px;width:580px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-trial{left:450px;top:1260px;width:580px;text-align:center}
#X-legal{left:440px;right:40px;bottom:90px;text-align:center;font:500 24px/1.3 "Inter",sans-serif;color:#5C5C5C}
''', '<div class="light"></div>' + '''
<h1 id="X-t" class="h g">Que nadie<br><span class="mk">hable por ti</span></h1>
<img id="X-p" class="char" src="assets/chars/pascal-muestra.webp" alt="">
<div id="X-qr" class="abs"><div id="X-qrc"><img src="assets/brand/qr-pascal-sign.svg" alt=""><img id="X-qrl" src="assets/brand/pascal-sign-logo.webp" alt=""></div><p id="X-cap">Escanéame y firma</p></div>
<p id="X-url" class="abs">pascalia.lat/PascalSign</p>
<div id="X-trial" class="abs"><span class="chip" style="background:#1F1F1F;color:#fff">Prueba <span class="yy">gratis</span> 7 días</span></div>
<p id="X-legal" class="abs">Firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012)</p>
''', lambda D, s, d: f'''
tl.from("#X-t",{{opacity:0,y:-40,duration:.45,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-520,duration:.55,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.4,opacity:0,rotation:-8,duration:.6,ease:"back.out(1.8)"}},.4);
tl.from("#X-url",{{opacity:0,y:30,duration:.4}},.9);
tl.from("#X-trial",{{opacity:0,scale:.6,duration:.45,ease:"back.out(2.2)"}},{s + d * .7:.2f});
tl.from("#X-legal",{{opacity:0,duration:.4}},1.2);
'''))

LEAD = .3
LABEL = {'D': 'DETECTIVE', 'C': 'CONTRATISTA', 'P': 'PASCAL'}

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    t = 0.0; rows = []; timing = []
    for n, tail, css, body, jsf in S:
        cid = f'f{n}'; d = round(dur(n), 2); s = LEAD; D = round(s + d + tail, 2)
        who, shown = LINES[n]
        caps = ''; cj = ''
        parts = chunks(shown); tot = sum(len(p) for p in parts); c = s
        for j, part in enumerate(parts):
            pd = d * len(part) / tot
            caps += f'<div class="cap"><span id="{cid}-c{j}" class="{who}"><i class="lab">{LABEL[who]}</i>{part}</span></div>'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:1}},{c:.2f});\n'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:0}},{min(D - .05, c + pd + (.3 if j == len(parts) - 1 else 0)):.2f});\n'
            c += pd
        js = jsf(D, s, d).replace('tl.to("#X-root-shake",{{}},0);\n', '').replace('tl.to("#X-root-shake",{},0);\n', '')
        html = page(cid, (EXTRA + css).replace('X-', f'{cid}-'), body.replace('X-', f'{cid}-') + caps, js.replace('X-', f'{cid}-') + cj)
        html = html.replace('.lab{display:block', '.cap .lab{font-style:normal;display:block')
        open(os.path.join(fr, f'{cid}.html'), 'w').write(html)
        rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{cid}.html" data-start="{t:.2f}" data-duration="{D:.2f}" data-track-index="1" data-width="1080" data-height="1920"></div>')
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{t + s:.2f}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
        timing.append({'id': n, 'start': round(t, 2), 'dur': D, 'vo': [round(t + s, 2), d]})
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
