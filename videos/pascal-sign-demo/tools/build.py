# Builds "Pascal Sign · así se firma de verdad": the real app walkthrough (tools/grabacion, mocked account API)
# inside a phone, with step titles, owner-voice narration, result inserts (signed PDF, evidence sheet,
# consolidated history) and an end card with the Pascal Sign QR. Everything lives on the root timeline.
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
A = 3.6                       # app video starts
E = round(A + APP, 2)         # app video ends
TOTAL = round(E + 7.2, 2)
# narration starts (absolute seconds); app-time marks come from tools/grabacion/record.js
M = json.load(open(os.path.join(ROOT, 'tools', 'grabacion', 'marks.json')))  # app-time step marks from the recording
VOSTART = {'n01': 0.15, 'n02': A + M['home'] + 0.1, 'n03': A + M['firmar'] + 0.05, 'n03b': A + M['imagen'] + 0.15, 'n04': A + M['datos'] + 0.05,
           'n05': A + M['usar'] + 0.1, 'n06': A + M['listo'] + 0.06, 'n07': A + M['cuenta'] + 0.09, 'n08': A + M['delegar'] + 0.09, 'n09': E + 0.6}
STEPS = [(M['home'], '1', 'Entra a la app'), (M['abrir'], '2', 'Abre tu PDF'), (M['firmar'], '3', 'Dibuja tu firma'),
         (M['imagen'], '3', 'O sube una imagen'), (M['foto'], '3', 'O tómale una foto'), (M['volver'], '3', 'Dibuja tu firma'),
         (M['datos'], '4', 'Nombre, objeto y radicado'), (M['usar'], '5', 'Arrástrala a su lugar'), (M['tamano'], '5', 'Ajusta el tamaño'),
         (M['listo'], '6', 'Guarda el PDF firmado'), (M['cuenta'], '7', 'Descarga el consolidado'), (M['delegar'], '8', 'Delega tu firma')]
R1 = (A + M['firmado'] - 0.05, A + M['firmado'] + 2.95)   # signed PDF + evidence insert
R2 = (A + M['historial'] + 0.44, A + M['historial'] + 3.09)    # consolidated history insert
PW, PH = 720, round(720 * 1726 / 1014)  # phone screen
PX, PY = (1080 - PW) // 2, 300

CSS = f'''
@font-face{{font-family:"Montserrat";font-weight:700;src:url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2")}}
@font-face{{font-family:"Montserrat";font-weight:800;src:url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2")}}
@font-face{{font-family:"Inter";font-weight:500;src:url("assets/fonts/inter-latin-500-normal.woff2") format("woff2")}}
@font-face{{font-family:"Inter";font-weight:600;src:url("assets/fonts/inter-latin-600-normal.woff2") format("woff2")}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1080px; height:1920px; overflow:hidden; background:#FFF8E1; }}
#root {{ position:relative; width:100%; height:100%; overflow:hidden; }}
.abs {{ position:absolute; }}
#bg {{ position:absolute; inset:0; background:radial-gradient(70% 45% at 50% 30%,#FFE58A 0%,#FFF3C4 45%,#FFF8E1 80%); }}
.chip {{ position:absolute; left:0; right:0; top:96px; text-align:center; }}
.chip span {{ display:inline-flex; align-items:center; gap:12px; padding:12px 26px 12px 14px; border-radius:999px; background:#1F1F1F; color:#fff; font:800 30px/1 "Montserrat",sans-serif; }}
.chip img {{ width:42px; height:42px; border-radius:10px; }}
#intro-t {{ left:60px; right:60px; top:330px; text-align:center; font:800 104px/1.04 "Montserrat",sans-serif; color:#1F1F1F; letter-spacing:-.02em; }}
#intro-t em {{ font-style:normal; background:linear-gradient(transparent 62%,#FFC107 62%); }}
#intro-s {{ left:80px; right:80px; top:600px; text-align:center; font:600 40px/1.3 "Inter",sans-serif; color:#5C5C5C; }}
#intro-logo {{ left:390px; top:760px; width:300px; height:300px; border-radius:66px; box-shadow:0 30px 60px -24px rgba(31,31,31,.45); }}
#intro-p {{ left:300px; bottom:0; height:760px; filter:drop-shadow(0 26px 30px rgba(31,31,31,.3)); }}
#step {{ left:60px; right:60px; top:170px; height:110px; display:flex; align-items:center; justify-content:center; gap:20px; }}
#step b {{ flex:none; width:84px; height:84px; border-radius:50%; background:#FFC107; display:grid; place-items:center; font:800 48px/1 "Montserrat",sans-serif; color:#1F1F1F; box-shadow:0 10px 22px -10px rgba(0,0,0,.4); }}
.st {{ position:absolute; left:0; right:0; top:0; height:110px; display:flex; align-items:center; justify-content:center; gap:20px; opacity:0; }}
.st span {{ font:800 54px/1.05 "Montserrat",sans-serif; color:#1F1F1F; letter-spacing:-.01em; }}
#phone {{ left:{PX - 16}px; top:{PY - 16}px; width:{PW + 32}px; height:{PH + 32}px; border-radius:76px; background:#151515; padding:16px; box-shadow:0 50px 90px -40px rgba(31,31,31,.65),inset 0 0 0 3px #2B2B2B; }}
#scr {{ position:relative; width:{PW}px; height:{PH}px; border-radius:60px; overflow:hidden; background:#fff; }}
#scr video {{ position:absolute; left:0; top:0; width:{PW}px; height:{PH}px; object-fit:cover; }}
#dim {{ position:absolute; inset:0; background:rgba(31,31,31,.72); opacity:0; }}
.pg {{ position:absolute; background:#fff; border-radius:10px; box-shadow:0 30px 60px -20px rgba(0,0,0,.6); }}
.lab {{ position:absolute; left:60px; right:60px; text-align:center; font:800 44px/1.15 "Montserrat",sans-serif; color:#fff; }}
.lab small {{ display:block; margin-top:10px; font:600 28px/1.3 "Inter",sans-serif; color:#FFE58A; }}
.cap {{ position:absolute; left:60px; right:60px; top:1612px; text-align:center; }}
.cap span {{ display:inline-block; padding:12px 24px; border-radius:18px; background:#1F1F1F; color:#fff; font:800 36px/1.25 "Montserrat",sans-serif; opacity:0; white-space:nowrap; }}
#end-t {{ left:60px; right:60px; top:200px; text-align:center; font:800 84px/1.05 "Montserrat",sans-serif; color:#1F1F1F; }}
#end-t em {{ font-style:normal; background:linear-gradient(transparent 62%,#FFC107 62%); }}
#qr {{ left:560px; top:470px; width:460px; padding:28px 28px 20px; border-radius:36px; background:#fff; text-align:center; box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35); }}
#qr img {{ width:100%; display:block; }}
#qr b {{ display:block; margin-top:14px; font:800 30px/1 "Montserrat",sans-serif; color:#1F1F1F; }}
#demo {{ left:560px; top:1030px; width:460px; padding:24px; border-radius:28px; background:#1F1F1F; color:#FFC107; text-align:center; font:800 42px/1.1 "Montserrat",sans-serif; }}
#by {{ left:540px; top:1190px; width:500px; display:flex; justify-content:center; align-items:center; gap:12px; font:800 32px/1 "Montserrat",sans-serif; color:#1F1F1F; }}
#by img {{ width:60px; height:60px; border-radius:14px; }}
#end-p {{ left:10px; bottom:0; height:1000px; filter:drop-shadow(0 26px 30px rgba(31,31,31,.3)); }}
'''

def build():
    rows, js = [], []
    T = lambda s: f'{s:.2f}'
    # background + intro + steps + phone + inserts + captions + end card, all inside one full-length clip
    body = []
    body.append('<div id="bg"></div>')
    body.append('<div id="chip" class="chip"><span><img src="assets/brand/pascal-sign-logo.webp" alt="">Pascal Sign · en acción</span></div>')
    body.append('<h1 id="intro-t" class="abs">Así se firma,<br><em>de verdad</em></h1><p id="intro-s" class="abs">La app real, paso a paso</p>')
    body.append('<img id="intro-logo" class="abs" src="assets/brand/pascal-sign-logo.webp" alt=""><img id="intro-p" class="abs" src="assets/chars/pascal-senala.webp" alt="">')
    body.append('<div id="step" class="abs">' + ''.join(f'<div id="st{i}" class="st"><b>{n}</b><span>{t}</span></div>' for i, (_, n, t) in enumerate(STEPS)) + '</div>')
    body.append(f'<div id="phone" class="abs"><div id="scr"><video id="app" class="clip" src="assets/video/app.mp4" data-start="{T(A)}" data-duration="{T(APP)}" data-track-index="2" muted playsinline data-layout-allow-overflow></video><div id="dim"></div></div></div>')
    # insert 1: signed page + evidence sheet
    body.append(f'<img id="r1a" class="pg" src="assets/resultado/firmado.png" alt="" style="left:{PX + 40}px;top:{PY + 210}px;width:380px">')
    body.append(f'<img id="r1b" class="pg" src="assets/resultado/evidencia.png" alt="" style="left:{PX + 300}px;top:{PY + 280}px;width:380px">')
    body.append(f'<p id="r1l" class="lab" style="top:{PY + 860}px">Tu PDF firmado<small>con nombre, fecha, consecutivo y hoja de evidencia</small></p>')
    # insert 2: consolidated history
    body.append(f'<img id="r2a" class="pg" src="assets/resultado/consolidado.png" alt="" style="left:{PX + 20}px;top:{PY + 300}px;width:{PW - 40}px">')
    body.append(f'<p id="r2l" class="lab" style="top:{PY + 900}px">Consolidado de firmas<small>en PDF, Excel (CSV) o TXT</small></p>')
    # captions
    for n, st in VOSTART.items():
        if n in ('n01', 'n09'): continue  # title and end card already say it on screen
        d = vdur(n); parts = chunks(LINES[n]); tot = sum(len(p) for p in parts); c = st
        for j, part in enumerate(parts):
            pd = d * len(part) / tot; cid = f'c-{n}-{j}'
            body.append(f'<div class="cap"><span id="{cid}">{part}</span></div>')
            js.append(f'tl.set("#{cid}",{{opacity:1}},{T(c)});tl.set("#{cid}",{{opacity:0}},{T(c + pd + (.25 if j == len(parts) - 1 else 0))});')
            c += pd
    # end card
    body.append('<h2 id="end-t" class="abs">Firma desde<br>tu celular, <em>hoy</em></h2>')
    body.append('<div id="qr" class="abs"><img src="assets/brand/qr-pascal-sign.svg" alt=""><b>Escanea y pruébalo</b></div><div id="demo" class="abs">7 días gratis</div>')
    body.append('<div id="by" class="abs"><img src="assets/brand/pascal-sign-logo.webp" alt=""><em style="font-style:normal">Pascal Sign · Pascal<span style="color:#A87600">IA</span></em></div>')
    body.append('<img id="end-p" class="abs" src="assets/chars/pascal-celular.webp" alt="">')

    # ---- motion
    js.append('tl.from("#chip",{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"},0.05);')
    js.append('tl.from("#intro-t",{opacity:0,y:40,duration:.5,ease:"back.out(1.6)"},0.15);')
    js.append('tl.from("#intro-s",{opacity:0,y:20,duration:.4},0.5);')
    js.append('tl.from("#intro-logo",{opacity:0,scale:.4,rotation:-12,duration:.55,ease:"back.out(1.8)"},0.7);')
    js.append('tl.from("#intro-p",{y:800,duration:.6,ease:"back.out(1.2)"},0.9);')
    js.append(f'tl.to(["#intro-t","#intro-s","#intro-logo"],{{opacity:0,y:-60,duration:.4,ease:"power2.in",stagger:.05}},{T(A - 0.55)});')
    js.append(f'tl.to("#intro-p",{{x:600,opacity:0,duration:.45,ease:"power2.in"}},{T(A - 0.55)});')
    js.append(f'tl.fromTo("#phone",{{y:1800,opacity:0}},{{y:0,opacity:1,duration:.7,ease:"power3.out"}},{T(A - 0.45)});')
    js.append(f'tl.set("#chip span",{{}},0);')
    for i, (s, _, _) in enumerate(STEPS):
        t = A + s if i else A + 0.1
        js.append(f'tl.fromTo("#st{i}",{{opacity:0,y:24}},{{opacity:1,y:0,duration:.35,ease:"back.out(1.8)"}},{T(t)});')
        end = (A + STEPS[i + 1][0]) if i + 1 < len(STEPS) else E
        js.append(f'tl.to("#st{i}",{{opacity:0,y:-20,duration:.25}},{T(end - 0.2)});')
    # inserts
    for a, b, els, lab in [(R1[0], R1[1], ['#r1a', '#r1b'], '#r1l'), (R2[0], R2[1], ['#r2a'], '#r2l')]:
        js.append(f'tl.to("#dim",{{opacity:1,duration:.3}},{T(a)});tl.to("#dim",{{opacity:0,duration:.3}},{T(b)});')
        js.append(f'tl.fromTo({json.dumps(els)},{{opacity:0,scale:.6,y:80}},{{opacity:1,scale:1,y:0,rotation:(i)=>[-4,5][i]||0,duration:.45,ease:"back.out(1.6)",stagger:.12}},{T(a + .1)});')
        js.append(f'tl.fromTo("{lab}",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.35}},{T(a + .35)});')
        js.append(f'tl.to({json.dumps(els + [lab])},{{opacity:0,y:-40,duration:.3,ease:"power2.in"}},{T(b - .05)});')
    # end card
    js.append(f'tl.to("#phone",{{y:1800,duration:.6,ease:"power2.in"}},{T(E - 0.1)});tl.set("#phone",{{opacity:0}},{T(E + .55)});')
    js.append(f'tl.fromTo("#end-t",{{opacity:0,y:-30}},{{opacity:1,y:0,duration:.45,ease:"back.out(1.8)"}},{T(E + .3)});')
    js.append(f'tl.fromTo("#end-p",{{x:-500}},{{x:0,duration:.5,ease:"power3.out"}},{T(E + .35)});')
    js.append(f'tl.fromTo("#qr",{{opacity:0,scale:.5}},{{opacity:1,scale:1,duration:.45,ease:"back.out(1.8)"}},{T(E + .6)});')
    js.append(f'tl.fromTo("#demo",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.35,ease:"back.out(2)"}},{T(E + 1.0)});')
    js.append(f'tl.to("#demo",{{scale:1.06,duration:.35,yoyo:true,repeat:{max(1, int((TOTAL - E - 1.6) / .35) - 1)},ease:"sine.inOut"}},{T(E + 1.4)});')
    js.append(f'tl.fromTo("#by",{{opacity:0}},{{opacity:1,duration:.35}},{T(E + 1.3)});')
    js.append(f'tl.set(["#end-t","#end-p","#qr","#demo","#by"],{{opacity:0}},0);tl.set(["#end-t","#end-p","#qr","#demo","#by"],{{opacity:1}},{T(E + .29)});')

    rows.append(f'      <div id="scene" class="clip" data-start="0" data-duration="{T(TOTAL)}" data-track-index="1" style="position:absolute;inset:0">{"".join(body)}</div>')
    timing = []
    for n, st in VOSTART.items():
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{T(st)}" data-duration="{vdur(n):.2f}" data-track-index="3" data-volume="1"></audio>')
        timing.append({'id': n, 'start': round(st - .3, 2), 'dur': round(vdur(n), 2), 'vo': [round(st, 2), round(vdur(n), 2)]})
    if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
        rows.append(f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{T(TOTAL)}" data-track-index="4" data-volume="0.4"></audio>')
    json.dump({'total': TOTAL, 'scenes': timing, 'video': E, 'speech': [s['vo'] for s in timing], 'logo': A + 21.9}, open(os.path.join(ROOT, 'tools', 'timing.json'), 'w'), indent=1)
    open(os.path.join(ROOT, 'index.html'), 'w').write(f'''<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>{CSS}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{T(TOTAL)}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join(js)}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
''')
    # overlap check for narration
    st = sorted(VOSTART.items(), key=lambda x: x[1])
    for (a, sa), (b, sb) in zip(st, st[1:]):
        if sa + vdur(a) > sb - 0.1: print(f'WARN {a} ends {sa + vdur(a):.2f} > {b} starts {sb:.2f}')
    print('total', TOTAL, 'app', APP)

if __name__ == '__main__':
    build()
