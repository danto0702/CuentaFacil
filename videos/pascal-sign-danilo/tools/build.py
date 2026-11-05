# Builds the Pascal Sign reel with the owner on camera: animations in the top half synced to his words,
# his recording in a brand frame in the bottom half, word-by-word captions on the seam and a full-screen end card.
# Timings come from tools/palabras.json (Whisper word timestamps of assets/video/danilo.mp4, already cut by cortar.py).
import os, re, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('v1', os.path.join(ROOT, '..', 'pascal-sign', 'tools', 'build.py'))
v1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v1)
icon, sig, page, k = v1.icon, v1.sig, v1.page, v1.k

W = json.load(open(os.path.join(ROOT, 'tools', 'palabras.json')))
def ts(i): return W[i]['timestamp'][0]
def te(i): return W[i]['timestamp'][1] or W[i]['timestamp'][0] + .3
VID = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(ROOT, 'assets', 'video', 'danilo.mp4')]))
END_CARD = 3.6
TOTAL = round(VID + END_CARD, 2)

# ---------- captions: corrected words (audio untouched), grouped in short bursts ----------
FIX = {5: 'PascalIA.', 20: 'CuentaFácil', 21: None, 26: 'Ustedes', 27: 'son', 28: 'la', 37: 'nos', 38: 'dimos', 59: 'algo', 60: 'urgente', 61: None,
       71: 'Pascal Sign.', 79: 'PDF', 125: None, 147: 'Pascal', 148: 'Sign,', 149: 'tú', 153: 'tú', 157: 'Pruébala', 158: None}
words = []
for i, w in enumerate(W):
    t = FIX.get(i, w['text'].strip())
    if t is None: continue
    words.append((t, ts(i), te(i)))
groups = []; cur = []
for wd in words:
    if cur and sum(len(x[0]) for x in cur) + len(wd[0]) > 17:
        groups.append(cur); cur = []
    cur.append(wd)
    if len(cur) >= 4 or re.search(r'[.,?!:]$', wd[0]):
        groups.append(cur); cur = []
if cur: groups.append(cur)

EXTRA = '''
.top{position:absolute;left:0;right:0;top:0;height:960px;overflow:hidden}
.tl{position:absolute;inset:0;background:radial-gradient(80% 60% at 50% 20%,rgba(255,193,7,.30),transparent 70%),linear-gradient(180deg,#FFF8E1 0%,#FFFDF5 100%)}
.td{position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 30%,#2B2B2B 0%,#141414 70%)}
.ty{position:absolute;inset:0;background:#FFC107}
.hh{position:absolute;left:50px;right:50px;text-align:center;font-family:"Montserrat",sans-serif;font-weight:800;letter-spacing:-.02em;line-height:1.05}
.logoS{position:absolute;border-radius:22%;box-shadow:0 30px 60px -24px rgba(31,31,31,.5)}
.pill{display:inline-flex;align-items:center;gap:12px;padding:18px 28px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 3px #E9E9E9;font:800 36px/1 "Montserrat",sans-serif;color:#1F1F1F}
.pill .ic{width:42px;height:42px}
.tile{position:absolute;width:150px;height:150px;border-radius:36px;box-shadow:0 16px 34px -14px rgba(31,31,31,.4)}
.bub{position:absolute;padding:18px 24px;border-radius:24px;background:#005C4B;color:#E9EDEF;font:600 30px/1.2 "Inter",sans-serif;box-shadow:0 16px 30px -12px rgba(0,0,0,.6)}
.bub .sig{width:240px;background:#F1EEE6;border-radius:12px;display:block}
.pd{position:absolute;width:230px;height:300px;border-radius:14px;background:#FAFAF7;color:#1F1F1F;padding:18px;box-shadow:0 20px 40px -12px rgba(0,0,0,.7)}
.pd b{display:block;font:800 24px/1 "Montserrat",sans-serif;letter-spacing:.06em}
.pd s{display:block;height:10px;border-radius:5px;background:#DDD;margin-top:12px}
.pd .sig{position:absolute;left:20px;bottom:30px;width:180px}
'''

def topscene(cid, t0, t1, css, body, js):
    D = round(t1 - t0, 2)
    return cid, t0, D, page(cid, (EXTRA + css).replace('X-', f'{cid}-'), ('<div class="top">' + body + '</div>').replace('X-', f'{cid}-'), js(D).replace('X-', f'{cid}-'))

def rel(t, t0): return round(t - t0, 2)
SC = []
# A · intro
a0, a1 = 0, ts(6)
SC.append(topscene('ta', a0, a1, '''
#X-f{left:390px;top:150px;width:300px;height:300px}
#X-w{top:480px;font-size:120px;color:#1F1F1F}
#X-s{top:640px;font:600 40px/1.2 "Inter",sans-serif;color:#5C5C5C;font-family:"Inter"}
''', '''<div class="tl"></div><img id="X-f" class="abs" src="assets/brand/flower.svg" alt=""><h1 id="X-w" class="hh">Pascal<span style="color:#A87600">IA</span></h1><p id="X-s" class="hh" style="font-weight:600">Ideas que hacen florecer tu organización</p>''',
 lambda D: f'''tl.from("#X-f",{{scale:0,rotation:-120,duration:.7,ease:"back.out(1.7)"}},.1);
tl.to("#X-f",{{rotation:40,duration:{D:.2f},ease:"none"}},.8);
tl.from("#X-w",{{opacity:0,y:40,duration:.45,ease:"back.out(1.8)"}},.4);
tl.from("#X-s",{{opacity:0,y:30,duration:.4}},.8);'''))
# B · gracias
b0, b1 = ts(6), ts(35)
LOGOS = [('cuentafacil-logo.webp', 140), ('fanatikos-img-fanatikos-360.webp', 340), ('flota-logo.webp', 590), ('nana-dnt-logo.png', 790)]
SC.append(topscene('tb', b0, b1, '''
#X-g{top:110px;font-size:150px;color:#1F1F1F}
#X-g2{top:300px;font:700 44px/1.2 "Montserrat",sans-serif;color:#5C5C5C}
#X-heart{left:430px;top:440px;width:220px;height:220px}
#X-last{top:690px;font-size:52px;color:#1F1F1F}
''', '<div class="tl"></div><h1 id="X-g" class="hh">¡Gracias!</h1><p id="X-g2" class="hh">a cada persona que confió en nosotros</p>'
 + ''.join(f'<img id="X-l{i}" class="tile X-tile" src="assets/brand/{f}" style="left:{x}px;top:450px" alt="">' for i, (f, x) in enumerate(LOGOS))
 + f'<div id="X-heart" class="abs">{icon("heart", "#E5484D")}</div><h2 id="X-last" class="hh">Ustedes son la razón<br>por la que <span class="mk">seguimos creando</span></h2>',
 lambda D: f'''tl.from("#X-g",{{opacity:0,scale:2.2,duration:.5,ease:"back.out(1.6)"}},.05);
tl.to("#X-g",{{scale:1.05,duration:.45,yoyo:true,repeat:{k(D, .7, .45)},ease:"sine.inOut"}},.7);
tl.from("#X-g2",{{opacity:0,y:30,duration:.4}},.5);
tl.from(".X-tile",{{opacity:0,y:60,scale:.6,duration:.4,ease:"back.out(2)",stagger:.15}},{rel(ts(19), b0):.2f});
tl.to(".X-tile",{{opacity:0,y:-40,duration:.3,stagger:.05}},{rel(ts(26), b0) - .3:.2f});
tl.fromTo("#X-heart",{{scale:0,opacity:0}},{{scale:1,opacity:1,duration:.4,ease:"back.out(2.5)"}},{rel(ts(26), b0):.2f});
tl.to("#X-heart",{{scale:1.15,duration:.3,yoyo:true,repeat:{k(D, rel(ts(26), b0) + .4, .3)},ease:"sine.inOut"}},{rel(ts(26), b0) + .4:.2f});
tl.from("#X-last",{{opacity:0,y:30,duration:.4}},{rel(ts(26), b0) + .2:.2f});'''))
# C · nadie tiene control
c0, c1 = ts(35), ts(50)
SC.append(topscene('tc', c0, c1, '''
#X-t{top:120px;font-size:84px;color:#fff}
#X-card{left:240px;top:430px;width:600px;height:240px;border-radius:26px;background:#F1EEE6;display:grid;place-items:center;box-shadow:0 0 0 8px #FF5A5A,0 0 80px rgba(255,90,90,.45)}
#X-card .sig{width:500px}
#X-x{left:470px;top:690px;width:140px;height:140px;border-radius:50%;background:#FF5A5A;padding:30px}
''', f'<div class="td"></div><h1 id="X-t" class="hh">Casi nadie tiene<br><span class="red">control</span> sobre su firma</h1><div id="X-card" class="abs">{sig(0)}</div><div id="X-x" class="abs">{icon("lock", "#fff")}</div>',
 lambda D: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},{rel(ts(42), c0):.2f});
tl.from("#X-card",{{scale:.5,opacity:0,duration:.4,ease:"back.out(1.8)"}},.15);
tl.to("#X-card",{{x:10,duration:.05,yoyo:true,repeat:{k(D, rel(ts(46), c0), .05)},ease:"none"}},{rel(ts(46), c0):.2f});
tl.from("#X-x",{{scale:0,rotation:-90,duration:.35,ease:"back.out(2.5)"}},{rel(ts(46), c0):.2f});'''))
# D · WhatsApp, reutilizamos, computador
d0, d1 = ts(50), ts(68)
SC.append(topscene('td', d0, d1, '''
#X-t1{top:90px;font-size:66px;color:#fff}
#X-hg{left:620px;top:330px;width:200px}
#X-pc{left:280px;top:360px;width:260px;height:200px}
#X-t3{top:640px;font-size:54px;color:#fff}
''', '<div class="td"></div>'
 + f'<h2 id="X-t1" class="hh">La mandamos por <span style="color:#25D366">WhatsApp</span></h2>'
 + ''.join(f'<div class="bub X-b" style="left:{x}px;top:{y}px">{sig(i)}</div>' for i, (x, y) in enumerate([(90, 250), (560, 330), (220, 520)]))
 + ''.join(f'<div class="pd X-p" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><b>{t}</b><s></s><s></s><s style="width:70%"></s>{sig(0)}</div>' for t, x, y, r in [('ACTA', 120, 260, -8), ('CONTRATO', 425, 230, 3), ('RECIBO', 730, 260, 8)])
 + f'<svg id="X-hg" class="abs" viewBox="0 0 200 300"><rect x="10" y="0" width="180" height="22" rx="8" fill="#8B5A2B"/><rect x="10" y="278" width="180" height="22" rx="8" fill="#8B5A2B"/><path d="M30 22 L170 22 C170 90 112 120 106 150 C112 180 170 210 170 278 L30 278 C30 210 88 180 94 150 C88 120 30 90 30 22 Z" fill="rgba(255,255,255,.08)" stroke="#EDE6FF" stroke-width="5"/><path d="M52 60 L148 60 C140 96 112 118 100 140 C88 118 60 96 52 60 Z" fill="#FFC107"/><path d="M48 272 L152 272 C150 248 120 236 100 220 C80 236 50 248 48 272 Z" fill="#FFC107"/></svg>'
 + f'<div id="X-pc" class="abs">{icon("devices", "#9A9A9A")}</div><h2 id="X-t3" class="hh">¿Esperar al <span class="red">computador</span>?</h2>',
 lambda D: f'''tl.from("#X-t1",{{opacity:0,y:-30,duration:.35}},0);
tl.from(".X-b",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)",stagger:.2}},.1);
tl.to(".X-b",{{opacity:0,duration:.2}},{rel(ts(54), d0):.2f});
tl.fromTo("#X-t1",{{opacity:1}},{{opacity:0,duration:.2,immediateRender:false}},{rel(ts(54), d0):.2f});
tl.from(".X-p",{{opacity:0,y:-500,rotation:30,duration:.3,ease:"power4.in",stagger:.18}},{rel(ts(54), d0):.2f});
tl.to(".X-p",{{opacity:0,duration:.2}},{rel(ts(57), d0) + .4:.2f});
tl.from("#X-hg, #X-pc",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2)",stagger:.15}},{rel(ts(57), d0) + .5:.2f});
tl.to("#X-hg",{{rotation:180,transformOrigin:"50% 50%",duration:.6,ease:"power2.inOut"}},{rel(ts(63), d0):.2f});
tl.from("#X-t3",{{opacity:0,y:30,duration:.35,ease:"back.out(1.8)"}},{rel(ts(57), d0) + .6:.2f});'''))
# E · creamos Pascal Sign
e0, e1 = ts(68), ts(72)
SC.append(topscene('te', e0, e1, '''
#X-logo{left:330px;top:120px;width:420px;height:420px}
#X-t{top:600px;font-size:80px;color:#1F1F1F}
#X-flash{inset:0;background:#fff;opacity:0}
''', '<div class="ty"></div><img id="X-logo" class="logoS" src="assets/brand/pascal-sign-logo.webp" alt=""><h1 id="X-t" class="hh">Por eso creamos<br><b>Pascal Sign</b></h1><div id="X-flash" class="abs"></div>',
 lambda D: f'''tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-logo",{{scale:.2,rotation:-25,opacity:0,duration:.55,ease:"back.out(1.8)"}},.1);
tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},.35);
tl.to("#X-logo",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, 1.0, .35)},ease:"sine.inOut"}},1.0);'''))
# F · cómo funciona
f0, f1 = ts(72), ts(99)
SC.append(topscene('tf', f0, f1, '''
#X-t{top:60px;font-size:66px;color:#1F1F1F}
#X-ph{left:90px;top:180px;width:400px;height:720px;border-radius:50px;background:#1F1F1F;padding:12px;box-shadow:0 30px 60px -24px rgba(31,31,31,.5)}
#X-scr{position:absolute;inset:12px;border-radius:38px;background:#F2EBD6;overflow:hidden}
#X-pdf{position:absolute;left:22px;right:22px;top:40px;bottom:30px;border-radius:14px;background:#fff;padding:24px;color:#1F1F1F}
#X-pdf b{display:block;font:800 24px/1 "Montserrat",sans-serif;margin-bottom:12px}
#X-pdf s{display:block;height:10px;border-radius:5px;background:#E5E5E5;margin-top:12px}
#X-pdf .sig{position:absolute;left:26px;bottom:60px;width:300px}
#X-ops{position:absolute;left:530px;top:250px;display:grid;gap:26px}
''', f'''<div class="tl"></div><h2 id="X-t" class="hh">¿Cómo <span class="mk">funciona</span>?</h2>
<div id="X-ph" class="abs"><div id="X-scr"><div id="X-pdf"><b>Documento.pdf</b><s></s><s></s><s style="width:80%"></s><s></s><s style="width:60%"></s>{sig(1, "X-sg", "", "#1B2A6B", 6)}</div></div></div>
<div id="X-ops"><span id="X-o0" class="pill">{icon("doc")}Abre tu PDF</span><span id="X-o1" class="pill">{icon("pen")}Con el dedo</span><span id="X-o2" class="pill">{icon("upload")}Con imagen</span><span id="X-o3" class="pill">{icon("camera")}Con foto</span></div>''',
 lambda D: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:700,duration:.5,ease:"power3.out"}},.1);
tl.from(".pill",{{opacity:0,x:120,duration:.35,ease:"back.out(1.8)",stagger:.08}},.3);
''' + ''.join(f'''tl.to("#X-o{j}",{{backgroundColor:"#FFC107",boxShadow:"inset 0 0 0 3px #FFC107",scale:1.08,duration:.2}},{rel(ts(i), f0):.2f});
tl.to("#X-o{j}",{{scale:1,duration:.2}},{rel(ts(i), f0) + .5:.2f});
''' for j, i in enumerate((77, 84, 89, 93))) + f'''tl.fromTo(".X-sg path",{{strokeDasharray:1400,strokeDashoffset:1400}},{{strokeDashoffset:0,duration:1.4,ease:"power1.inOut"}},{rel(ts(84), f0):.2f});'''))
# G · solo en tu dispositivo
g0, g1 = ts(99), ts(115)
SC.append(topscene('tg', g0, g1, '''
#X-t{top:80px;font-size:76px;color:#1F1F1F}
#X-lock{left:410px;top:300px;width:260px;height:260px;border-radius:50%;background:#FFC107;padding:62px;box-shadow:0 0 0 24px rgba(255,193,7,.25)}
.X-no{position:absolute;top:620px;width:170px;height:170px;border-radius:40px;background:#fff;padding:40px;box-shadow:0 16px 34px -14px rgba(31,31,31,.35)}
.X-no::after{content:"";position:absolute;left:-10px;right:-10px;top:50%;height:12px;margin-top:-6px;border-radius:6px;background:#E5484D;transform:rotate(-35deg)}
''', f'<div class="tl"></div><h2 id="X-t" class="hh">Solo en tu <span class="mk">dispositivo</span></h2><div id="X-lock" class="abs">{icon("lock")}</div><div id="X-n1" class="X-no" style="left:250px">{icon("doc")}</div><div id="X-n2" class="X-no" style="left:660px">{icon("chat")}</div>',
 lambda D: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},{rel(ts(103), g0):.2f});
tl.from("#X-lock",{{scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)"}},.1);
tl.from("#X-n1",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)"}},{rel(ts(110), g0):.2f});
tl.from("#X-n2",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)"}},{rel(ts(114), g0) - .2:.2f});'''))
# H · registro
h0, h1 = ts(115), ts(141)
ROWS = [('05/11/2026', 'Entrega de equipos', 'DS-0042-2026'), ('31/10/2026', 'Informe mensual', 'DS-0041-2026'), ('28/10/2026', 'Cuenta de cobro', 'DS-0040-2026')]
SC.append(topscene('th', h0, h1, '''
#X-t{top:60px;font-size:68px;color:#1F1F1F}
#X-rep{left:50px;top:200px;width:980px}
#X-rep h3{display:flex;align-items:center;gap:14px;padding:24px 28px 16px;font:800 34px/1 "Montserrat",sans-serif;margin:0}
#X-rep h3 img{width:54px;height:54px;border-radius:14px}
.X-hd{display:grid;grid-template-columns:180px 1fr 250px;gap:16px;padding:12px 28px;background:#FFF8E1;font:800 22px/1 "Montserrat",sans-serif;letter-spacing:.08em;color:#8A6100}
#X-rep .row{grid-template-columns:180px 1fr 250px;font-size:27px}
.X-c{border-radius:10px;padding:6px 8px;margin:-6px -8px}
#X-dl{left:310px;top:720px;width:460px;height:100px;border-radius:50px;background:#1F1F1F;color:#fff;display:flex;align-items:center;justify-content:center;gap:14px;font:800 34px/1 "Montserrat",sans-serif}
#X-dl .ic{width:40px;height:40px;transform:rotate(180deg)}
''', f'''<div class="tl"></div><h2 id="X-t" class="hh">Cada firma, <span class="mk">registrada</span></h2>
<div id="X-rep" class="card"><h3><img src="assets/brand/pascal-sign-logo.webp" alt="">Mis firmas</h3>
<div class="X-hd"><span>FECHA</span><span>RAZÓN</span><span style="text-align:right">Nº ÚNICO</span></div>
{''.join(f'<div class="row X-row"><i class="X-c X-cf">{a}</i><span class="X-c X-cr">{b}</span><b class="X-c X-cn">{c}</b></div>' for a, b, c in ROWS)}</div>
<div id="X-dl" class="abs">{icon("upload", "#FFC107")}Descargar historial</div>''',
 lambda D: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-rep",{{y:80,opacity:0,duration:.45,ease:"power3.out"}},.1);
tl.from(".X-row",{{opacity:0,x:-60,duration:.3,stagger:.15}},.4);
tl.fromTo(".X-cf",{{backgroundColor:"rgba(255,193,7,0)"}},{{backgroundColor:"rgba(255,193,7,.5)",duration:.25}},{rel(ts(122), h0):.2f});
tl.fromTo(".X-cr",{{backgroundColor:"rgba(255,193,7,0)"}},{{backgroundColor:"rgba(255,193,7,.5)",duration:.25}},{rel(ts(124), h0):.2f});
tl.fromTo(".X-cn",{{backgroundColor:"rgba(255,193,7,0)"}},{{backgroundColor:"rgba(255,193,7,.5)",duration:.25}},{rel(ts(132), h0):.2f});
tl.from("#X-dl",{{scale:.5,opacity:0,duration:.35,ease:"back.out(2)"}},{rel(ts(136), h0):.2f});
tl.to("#X-dl",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, rel(ts(136), h0) + .4, .35)},ease:"sine.inOut"}},{rel(ts(136), h0) + .4:.2f});'''))
# I · tu firma es tu palabra
i0, i1 = ts(141), ts(157)
SC.append(topscene('ti', i0, i1, '''
#X-t1{top:180px;font-size:104px;color:#1F1F1F}
#X-t2{top:520px;font-size:78px;color:#1F1F1F}
#X-f{left:-120px;top:420px;width:620px;height:620px;opacity:.12}
''', '<div class="tl"></div><img id="X-f" class="abs" src="assets/brand/flower.svg" alt=""><h1 id="X-t1" class="hh">Tu firma es<br><span class="mk">tu palabra</span></h1><h2 id="X-t2" class="hh">Tú tienes el <span style="background:#1F1F1F;color:#FFC107;padding:0 .2em;border-radius:14px">control</span></h2>',
 lambda D: f'''tl.from("#X-t1",{{opacity:0,scale:1.4,duration:.45,ease:"back.out(1.6)"}},0);
tl.to("#X-f",{{rotation:50,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-t2",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{rel(ts(152), i0):.2f});'''))
# J · prueba gratis (top half)
j0, j1 = ts(157), VID
SC.append(topscene('tj', j0, j1, '''
#X-qr{left:90px;top:150px;width:420px;height:420px;padding:26px;border-radius:36px;background:#fff;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -20px rgba(31,31,31,.35)}
#X-qrc{position:relative;width:100%;height:100%}
#X-qrc > img:first-child{width:100%;height:100%}
#X-qrl{position:absolute;left:50%;top:50%;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:24px;box-shadow:0 0 0 8px #fff}
#X-r{position:absolute;left:560px;top:190px;width:460px}
#X-r b{display:block;font:800 74px/1.02 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.02em}
#X-r span{display:inline-block;margin-top:24px;padding:16px 26px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif}
#X-r p{margin-top:24px;font:800 34px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
''', '<div class="tl"></div><div id="X-qr" class="abs"><div id="X-qrc"><img src="assets/brand/qr-pascal-sign.svg" alt=""><img id="X-qrl" src="assets/brand/pascal-sign-logo.webp" alt=""></div></div><div id="X-r"><b>Pruébala<br>gratis</b><span>7 días</span><p>pascalia.lat/<br>PascalSign</p></div>',
 lambda D: '''tl.from("#X-qr",{scale:.4,opacity:0,rotation:-8,duration:.5,ease:"back.out(1.8)"},0);
tl.from("#X-r > *",{opacity:0,x:60,duration:.35,ease:"back.out(1.8)",stagger:.15},.2);'''))

def frame_comp():  # bottom-half brand frame behind the video
    css = '''
#bf-bg{position:absolute;left:0;right:0;top:960px;bottom:0;background:linear-gradient(180deg,#1A1A1A,#0F0F0F)}
#bf-f{position:absolute;width:520px;height:520px;left:-160px;bottom:-140px;opacity:.10}
#bf-f2{position:absolute;width:420px;height:420px;right:-150px;top:1000px;opacity:.08}
#bf-ring{position:absolute;left:174px;top:994px;width:732px;height:892px;border-radius:40px;box-shadow:0 0 0 6px #FFC107,0 30px 60px -20px rgba(0,0,0,.8)}
#bf-name{position:absolute;left:200px;top:1720px;display:flex;flex-direction:column;gap:6px}
#bf-name b{display:inline-block;padding:12px 22px;border-radius:14px;background:#FFC107;color:#1F1F1F;font:800 40px/1 "Montserrat",sans-serif;width:max-content}
#bf-name span{display:inline-block;padding:10px 20px;border-radius:12px;background:#1F1F1F;color:#fff;font:700 28px/1 "Montserrat",sans-serif;width:max-content}
'''
    body = '<div id="bf-bg"></div><img id="bf-f" src="assets/brand/flower.svg" alt=""><img id="bf-f2" src="assets/brand/flower.svg" alt=""><div id="bf-ring"></div>'
    js = f'tl.to("#bf-f",{{rotation:90,duration:{VID:.2f},ease:"none"}},0);\ntl.to("#bf-f2",{{rotation:-90,duration:{VID:.2f},ease:"none"}},0);\n'
    return page('bframe', css, body, js)

def name_comp():  # lower third over the video
    css = '''
#nm{position:absolute;left:200px;top:1700px;display:flex;flex-direction:column;gap:8px}
#nm b{display:inline-block;padding:12px 22px;border-radius:14px;background:#FFC107;color:#1F1F1F;font:800 42px/1 "Montserrat",sans-serif;width:max-content}
#nm span{display:inline-block;padding:10px 20px;border-radius:12px;background:#1F1F1F;color:#fff;font:700 28px/1 "Montserrat",sans-serif;width:max-content}
'''
    body = '<div id="nm"><b>Danilo</b><span>Creador de PascalIA</span></div>'
    js = 'tl.from("#nm > *",{x:-400,opacity:0,duration:.45,ease:"power3.out",stagger:.12},.3);\ntl.to("#nm > *",{x:-400,opacity:0,duration:.35,ease:"power2.in",stagger:.08},4.0);\n'
    return page('lname', css, body, js)

def captions_comp():
    css = '''
.cg{position:absolute;left:20px;right:20px;top:875px;display:flex;justify-content:center;flex-wrap:nowrap;gap:0 12px;opacity:0;white-space:nowrap}
.cg span{display:inline-block;padding:10px 18px;border-radius:18px;font:800 58px/1.05 "Montserrat",sans-serif;color:#fff;background:#1F1F1F;letter-spacing:-.01em;box-shadow:0 12px 26px -10px rgba(0,0,0,.6)}
.cg span.on{background:#FFC107;color:#1F1F1F}
'''
    body = ''; js = ''
    for gi, g in enumerate(groups):
        g0 = g[0][1]; g1 = groups[gi + 1][0][1] if gi + 1 < len(groups) else min(VID, g[-1][2] + .4)
        body += f'<div class="cg" id="cg{gi}">' + ''.join(f'<span id="cw{gi}-{wi}">{w[0]}</span>' for wi, w in enumerate(g)) + '</div>'
        js += f'tl.set("#cg{gi}",{{opacity:1}},{g0:.2f});\n'
        js += f'tl.from("#cg{gi}",{{scale:.85,y:14,duration:.14,ease:"back.out(2.5)",immediateRender:false}},{g0:.2f});\n'
        js += f'tl.set("#cg{gi}",{{opacity:0}},{max(g0 + .1, g1 - .02):.2f});\n'
        for wi, w in enumerate(g):
            js += f'tl.set("#cw{gi}-{wi}",{{backgroundColor:"#FFC107",color:"#1F1F1F"}},{w[1]:.2f});\n'
            nxt = g[wi + 1][1] if wi + 1 < len(g) else g1
            js += f'tl.set("#cw{gi}-{wi}",{{backgroundColor:"#1F1F1F",color:"#FFFFFF"}},{max(w[1] + .05, nxt):.2f});\n'
    return page('caps', css, body, js)

def endcard_comp():
    css = '''
#ec-bg{position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 15%,rgba(255,193,7,.32),transparent 70%),linear-gradient(180deg,#FFF8E1,#FFFFFF)}
#ec-logo{position:absolute;left:390px;top:160px;width:300px;height:300px;border-radius:66px;box-shadow:0 30px 60px -24px rgba(31,31,31,.45)}
#ec-t{position:absolute;left:60px;right:60px;top:520px;text-align:center;font:800 84px/1.05 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.02em}
#ec-qr{position:absolute;left:270px;top:780px;width:540px;padding:34px 34px 22px;border-radius:44px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 30px 60px -24px rgba(31,31,31,.3)}
#ec-qrc{position:relative;width:472px;height:472px}
#ec-qrc > img:first-child{width:100%;height:100%;display:block}
#ec-qrl{position:absolute;left:50%;top:50%;width:126px;height:126px;margin:-63px 0 0 -63px;border-radius:28px;box-shadow:0 0 0 10px #fff}
#ec-url{margin-top:18px;font:800 36px/1 "Montserrat",sans-serif;color:#1F1F1F}
#ec-trial{position:absolute;left:0;right:0;top:1460px;text-align:center}
#ec-trial span{display:inline-block;padding:20px 36px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 44px/1 "Montserrat",sans-serif}
#ec-trial i{font-style:normal;color:#FFC107}
#ec-by{position:absolute;left:0;right:0;top:1600px;display:flex;justify-content:center;align-items:center;gap:14px;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F}
#ec-by img{width:56px;height:56px}
#ec-legal{position:absolute;left:60px;right:60px;bottom:90px;text-align:center;font:500 26px/1.3 "Inter",sans-serif;color:#5C5C5C}
'''
    body = ('<div id="ec-bg"></div><img id="ec-logo" src="assets/brand/pascal-sign-logo.webp" alt=""><h1 id="ec-t">Recupera el control<br>de tu <span class="mk">firma</span></h1>'
            '<div id="ec-qr"><div id="ec-qrc"><img src="assets/brand/qr-pascal-sign.svg" alt=""><img id="ec-qrl" src="assets/brand/pascal-sign-logo.webp" alt=""></div><p id="ec-url">pascalia.lat/PascalSign</p></div>'
            '<div id="ec-trial"><span>Prueba <i>gratis</i> 7 días</span></div><div id="ec-by"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">de Pascal<span style="color:#A87600">IA</span></em></div>'
            '<p id="ec-legal">Firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012)</p>')
    js = '''tl.from("#ec-bg",{opacity:0,duration:.3},0);
tl.from("#ec-logo",{scale:.3,rotation:-20,opacity:0,duration:.5,ease:"back.out(1.8)"},.1);
tl.from("#ec-t",{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"},.3);
tl.from("#ec-qr",{scale:.5,opacity:0,duration:.5,ease:"back.out(1.8)"},.5);
tl.from("#ec-trial, #ec-by",{opacity:0,y:30,duration:.4,stagger:.15},.8);
tl.from("#ec-legal",{opacity:0,duration:.4},1.0);
'''
    return page('endcard', css, body, js)

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    rows = []
    open(os.path.join(fr, 'bframe.html'), 'w').write(frame_comp())
    rows.append(f'      <div id="bframe" class="clip" data-composition-id="bframe" data-composition-src="compositions/frames/bframe.html" data-start="0" data-duration="{VID:.2f}" data-track-index="0" data-width="1080" data-height="1920"></div>')
    rows.append(f'      <div id="vwin" style="position:absolute;left:180px;top:1000px;width:720px;height:880px;overflow:hidden;border-radius:36px"><video id="danilo" class="clip" src="assets/video/danilo.mp4" data-start="0" data-duration="{VID:.2f}" data-track-index="2" data-has-audio="true" data-volume="1" data-layout-allow-overflow style="position:absolute;left:0;top:-140px;width:720px;height:1280px;object-fit:cover"></video></div>')
    for cid, t0, D, html in SC:
        open(os.path.join(fr, f'{cid}.html'), 'w').write(html)
        rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{cid}.html" data-start="{t0:.2f}" data-duration="{D:.2f}" data-track-index="1" data-width="1080" data-height="1920"></div>')
    open(os.path.join(fr, 'lname.html'), 'w').write(name_comp())
    rows.append('      <div id="lname" class="clip" data-composition-id="lname" data-composition-src="compositions/frames/lname.html" data-start="0" data-duration="5" data-track-index="5" data-width="1080" data-height="1920"></div>')
    open(os.path.join(fr, 'caps.html'), 'w').write(captions_comp())
    rows.append(f'      <div id="caps" class="clip" data-composition-id="caps" data-composition-src="compositions/frames/caps.html" data-start="0" data-duration="{VID:.2f}" data-track-index="6" data-width="1080" data-height="1920"></div>')
    open(os.path.join(fr, 'endcard.html'), 'w').write(endcard_comp())
    rows.append(f'      <div id="endcard" class="clip" data-composition-id="endcard" data-composition-src="compositions/frames/endcard.html" data-start="{VID:.2f}" data-duration="{END_CARD}" data-track-index="7" data-width="1080" data-height="1920"></div>')
    if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
        rows.append(f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-volume="0.35"></audio>')
    json.dump({'total': TOTAL, 'video': VID, 'scenes': [{'id': c, 'start': t0, 'dur': D} for c, t0, D, _ in SC], 'speech': [[w[1], w[2]] for w in words]}, open(os.path.join(ROOT, 'tools', 'timing.json'), 'w'), indent=1)
    open(os.path.join(ROOT, 'index.html'), 'w').write(f'''<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0F0F0F; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
''')
    print('total', TOTAL, 'scenes', len(SC), 'caption groups', len(groups))

if __name__ == '__main__':
    build()
