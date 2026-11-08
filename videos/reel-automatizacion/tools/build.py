# Builds "Reel 1 · El filtro de los 3 criterios": how to pick the first task to automate with AI.
# One scene per voice line (Pascal, owner's cloned voice); reuses the drawing helpers of videos/pascal-sign/tools/build.py.
import os, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('v1', os.path.join(ROOT, '..', 'pascal-sign', 'tools', 'build.py'))
v1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v1)
icon, page, chunks, k = v1.icon, v1.page, v1.chunks, v1.k

VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = shown

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n]) / 16)

EXTRA = '''
.chip3{position:absolute;left:0;right:0;top:110px;text-align:center}
.chip3 span{display:inline-flex;align-items:center;gap:12px;padding:12px 26px 12px 14px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 30px/1 "Montserrat",sans-serif}
.chip3 img{width:40px;height:40px}
.crit{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:26px;padding:30px 34px;border-radius:34px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
.crit .n{flex:none;width:110px;height:110px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 62px/1 "Montserrat",sans-serif;color:#1F1F1F}
.crit b{display:block;font:800 52px/1.08 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.01em}
.crit small{display:block;margin-top:8px;font:600 30px/1.25 "Inter",sans-serif;color:#5C5C5C}
.ok{position:absolute;width:76px;height:76px;border-radius:50%;background:#25A55F;padding:16px;box-shadow:0 10px 20px -8px rgba(0,0,0,.4)}
.no{position:absolute;width:76px;height:76px;border-radius:50%;background:#E5484D;display:grid;place-items:center;color:#fff;font:800 48px/1 "Montserrat",sans-serif}
.ch{position:absolute;bottom:20px;filter:drop-shadow(0 26px 30px rgba(31,31,31,.3))}
.tk{position:absolute;padding:20px 26px;border-radius:22px;background:#fff;color:#1F1F1F;font:700 32px/1.15 "Montserrat",sans-serif;box-shadow:0 16px 34px -14px rgba(31,31,31,.35)}
.xl{position:absolute;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 24px 50px -20px rgba(31,31,31,.4)}
.xl .hd{background:#1E7B45;color:#fff;font:800 26px/1 "Montserrat",sans-serif;padding:14px 20px}
.xl .r{display:grid;grid-template-columns:1.25fr .6fr 1.25fr;border-top:2px solid #E5E5E5;font:600 24px/1 "Inter",sans-serif;color:#1F1F1F}
.xl .r span{padding:14px 16px;border-left:2px solid #E5E5E5}
.xl .r span:first-child{border-left:0}
'''
CH = lambda: '<div class="chip3"><span><img src="assets/brand/flower.svg" alt="">Consejo PascalIA</span></div>'

S = []
# 1 · hook
S.append(('r01', 'td', .3, '''
#X-t{top:220px;font-size:96px}
#X-q{left:140px;top:640px;width:300px;height:300px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 200px/1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 0 0 30px rgba(255,193,7,.18)}
#X-ia{left:620px;top:560px;padding:20px 34px;border-radius:26px;background:#fff;color:#1F1F1F;font:800 80px/1 "Montserrat",sans-serif}
#X-c{left:520px;height:960px}
''', CH() + '<h1 id="X-t" class="h w">¿IA en tu trabajo?<br><span class="yy">¿Por dónde empiezo?</span></h1><div id="X-q" class="abs">?</div><div id="X-ia" class="abs">IA</div><img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},0);
tl.from("#X-c",{{y:600,duration:.5,ease:"back.out(1.4)"}},.1);
tl.from("#X-q",{{scale:0,rotation:-90,duration:.45,ease:"back.out(2.2)"}},.4);
tl.to("#X-q",{{rotation:12,duration:.25,yoyo:true,repeat:{k(D, .9, .25)},ease:"sine.inOut"}},.9);
tl.from("#X-ia",{{scale:0,duration:.35,ease:"back.out(2.5)"}},.7);
tl.to("#X-c",{{x:8,duration:.07,yoyo:true,repeat:{k(D, 1.0, .07)},ease:"none"}},1.0);'''))
# 2 · empieza pequeño
S.append(('r02', 'tl', .35, '''
#X-t{top:200px;font-size:82px}
#X-big{left:80px;top:520px;width:420px;height:560px;border-radius:30px;background:#E9E9E9;display:grid;place-items:center;text-align:center;font:800 44px/1.1 "Montserrat",sans-serif;color:#5C5C5C;padding:30px}
#X-x{left:120px;top:770px;width:340px;height:16px;border-radius:8px;background:#E5484D;transform:rotate(-30deg)}
#X-small{left:180px;top:1130px;width:280px;padding:24px;border-radius:24px;background:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -16px rgba(255,179,0,.7)}
#X-f{left:110px;top:-40px;width:860px;text-align:center;font:800 46px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-p{left:560px;height:1000px}
''', CH() + '<h1 id="X-t" class="h g">Empieza <span class="mk">pequeño</span></h1><div id="X-big" class="abs">Proyecto<br>gigante<br>de IA</div><div id="X-x" class="abs"></div><div id="X-small" class="abs">Una tarea pequeña</div><img id="X-p" class="ch" src="assets/chars/pascal-tres.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-big",{{scale:.6,opacity:0,duration:.4,ease:"back.out(1.6)"}},.2);
tl.from("#X-x",{{scaleX:0,duration:.3,ease:"power3.out"}},{s + d * .2:.2f});
tl.to("#X-big",{{opacity:.45,scale:.92,duration:.3}},{s + d * .25:.2f});
tl.from("#X-small",{{scale:0,rotation:-10,duration:.45,ease:"back.out(2.5)"}},{s + d * .38:.2f});
tl.to("#X-small",{{scale:1.06,duration:.35,yoyo:true,repeat:{k(D, s + d * .38 + .5, .35)},ease:"sine.inOut"}},{s + d * .38 + .5:.2f});
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},{s + d * .62:.2f});'''))
# 3-5 · los tres criterios (se acumulan)
CRITS = [('Más de 5 minutos', 'Te quita tiempo cada vez', 'clock'), ('Se repite a diario', 'Todos los días o varias veces', 'calendar'), ('Sigue reglas fijas', 'Sin criterio humano', 'list-check')]
def crit_cards(upto, top=420):
    return ''.join(f'<div id="X-k{i}" class="crit" style="top:{top + i * 210}px"><div class="n">{i + 1}</div><div><b>{t}</b><small>{s_}</small></div></div>' for i, (t, s_, _) in enumerate(CRITS[:upto + 1]))
S.append(('r03', 'tl', .4, '''
#X-t{top:200px;font-size:76px}
#X-clk{left:690px;top:1040px;width:300px;height:300px}
#X-p{left:30px;height:860px}
''', CH() + '<h1 id="X-t" class="h g">El filtro de las <span class="mk">3 preguntas</span></h1>' + crit_cards(0) + '''
<svg id="X-clk" class="abs" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#1F1F1F" stroke-width="8"/><path id="X-arc" d="M100 100 L100 14 A86 86 0 0 1 174.5 57 Z" fill="#FFC107"/><g id="X-hand"><path d="M96 100 L100 22 L104 100 Z" fill="#1F1F1F"/></g><circle cx="100" cy="100" r="9" fill="#1F1F1F"/><text x="100" y="150" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="30" fill="#1F1F1F">+5 min</text></svg>
<img id="X-p" class="ch" src="assets/chars/pascal-explica.webp" alt="">''',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-k0",{{x:-900,duration:.45,ease:"back.out(1.4)"}},{s + .1:.2f});
tl.from("#X-clk",{{scale:0,duration:.4,ease:"back.out(2)"}},{s + .4:.2f});
tl.fromTo("#X-hand",{{rotation:0}},{{rotation:360,svgOrigin:"100 100",duration:{max(1.0, D - s - .8):.2f},ease:"none"}},{s + .6:.2f});
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);'''))
S.append(('r04', 'tl', .4, '''
#X-t{top:200px;font-size:76px}
#X-cal{left:560px;top:1060px;width:440px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
#X-cal div{height:84px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 3px #E9E9E9;display:grid;place-items:center;font:800 26px/1 "Montserrat",sans-serif;color:#5C5C5C}
#X-cal div.on{background:#FFC107;box-shadow:none;color:#1F1F1F}
#X-p{left:30px;height:860px}
''', CH() + '<h1 id="X-t" class="h g">El filtro de las <span class="mk">3 preguntas</span></h1>' + crit_cards(1)
 + '<div id="X-cal" class="abs">' + ''.join(f'<div class="X-d">{d_}</div>' for d_ in ['L', 'M', 'M', 'J', 'V']) + '</div><img id="X-p" class="ch" src="assets/chars/pascal-tres.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-k1",{{x:900,duration:.45,ease:"back.out(1.4)"}},{s + .1:.2f});
tl.from("#X-cal",{{opacity:0,y:40,duration:.35}},{s + .3:.2f});
tl.to(".X-d",{{backgroundColor:"#FFC107",color:"#1F1F1F",boxShadow:"inset 0 0 0 0px #E9E9E9",duration:.15,stagger:{min(.35, (d - .6) / 5):.2f}}},{s + .5:.2f});'''))
S.append(('r05', 'tl', .45, '''
#X-t{top:200px;font-size:76px}
#X-yes{left:560px;top:1080px;width:460px}
#X-no{left:560px;top:1250px;width:460px;background:#FDECEA}
#X-oky{left:960px;top:1060px}
#X-nok{left:960px;top:1232px}
#X-p{left:30px;height:860px}
''', CH() + '<h1 id="X-t" class="h g">El filtro de las <span class="mk">3 preguntas</span></h1>' + crit_cards(2)
 + f'<div id="X-yes" class="tk">Copiar → pegar<br><small style="font:600 24px Inter;color:#5C5C5C">siempre igual</small></div><div id="X-oky" class="ok">{icon("check", "#fff")}</div>'
 + '<div id="X-no" class="tk">Negociar con un cliente<br><small style="font:600 24px Inter;color:#5C5C5C">necesita tu criterio</small></div><div id="X-nok" class="no">×</div><img id="X-p" class="ch" src="assets/chars/pascal-lupa.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-k2",{{x:-900,duration:.45,ease:"back.out(1.4)"}},{s + .1:.2f});
tl.from("#X-p",{{opacity:0,duration:.3}},0);
tl.from("#X-yes",{{opacity:0,x:200,duration:.35,ease:"back.out(1.8)"}},{s + d * .35:.2f});
tl.from("#X-oky",{{scale:0,duration:.3,ease:"back.out(3)"}},{s + d * .5:.2f});
tl.from("#X-no",{{opacity:0,x:200,duration:.35,ease:"back.out(1.8)"}},{s + d * .7:.2f});
tl.from("#X-nok",{{scale:0,duration:.3,ease:"back.out(3)"}},{s + d * .82:.2f});
tl.to("#X-no",{{x:12,duration:.06,yoyo:true,repeat:5,ease:"none"}},{s + d * .82:.2f});'''))
# 6 · ejemplo PDF / correo → Excel
ROWS = [('Proveedor A', '0045', '$ 820.000'), ('Proveedor B', '0046', '$ 1.240.000'), ('Proveedor C', '0047', '$ 365.000'), ('Proveedor D', '0048', '$ 2.010.000')]
S.append(('r06', 'tl', .5, '''
#X-t{top:200px;font-size:72px}
#X-pdf{left:80px;top:420px;width:200px;height:200px;border-radius:30px;background:#E5484D;padding:44px}
#X-mail{left:80px;top:660px;width:200px;height:200px;border-radius:30px;background:#38BDF8;padding:44px}
#X-arr{left:320px;top:560px;width:140px}
#X-xl{left:480px;top:420px;width:540px}
.X-ck{position:absolute;top:1010px;display:flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 30px/1 "Montserrat",sans-serif}
.X-ck i{width:40px;height:40px;border-radius:50%;background:#25A55F;padding:8px;font-style:normal}
#X-first{left:60px;right:60px;top:1130px;text-align:center;font:800 64px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
#X-p{right:10px;height:720px}
''', CH() + '<h1 id="X-t" class="h g">Ejemplo <span class="mk">real</span></h1>'
 + f'<div id="X-pdf" class="abs">{icon("doc", "#fff")}</div><div id="X-mail" class="abs">{icon("chat", "#fff")}</div>'
 + '<svg id="X-arr" class="abs" viewBox="0 0 140 60"><path d="M6 30 L120 30 M96 10 L124 30 L96 50" stroke="#1F1F1F" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
 + '<div id="X-xl" class="xl"><div class="hd">Excel · Facturas</div>' + ''.join(f'<div class="r X-row"><span>{a}</span><span>{b}</span><span>{c}</span></div>' for a, b, c in ROWS) + '</div>'
 + ''.join(f'<div id="X-ch{i}" class="X-ck" style="left:{x}px"><i>{icon("check", "#fff")}</i>{t}</div>' for i, (t, x) in enumerate([('+5 min', 70), ('Diario', 380), ('Reglas fijas', 650)]))
 + '<h2 id="X-first" class="abs">¡Tu primera<br><span class="mk">automatización</span>!</h2>',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-pdf",{{scale:0,rotation:-20,duration:.4,ease:"back.out(2)"}},{s + d * .1:.2f});
tl.from("#X-mail",{{scale:0,rotation:20,duration:.4,ease:"back.out(2)"}},{s + d * .2:.2f});
tl.from("#X-arr",{{opacity:0,x:-40,duration:.35}},{s + d * .3:.2f});
tl.from("#X-xl",{{opacity:0,scale:.8,duration:.4,ease:"back.out(1.6)"}},{s + d * .33:.2f});
tl.from(".X-row",{{opacity:0,x:-40,duration:.25,stagger:.2}},{s + d * .38:.2f});
tl.from("#X-ch0",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .55:.2f});
tl.from("#X-ch1",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .63:.2f});
tl.from("#X-ch2",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .72:.2f});
tl.from("#X-first",{{opacity:0,scale:1.4,duration:.4,ease:"back.out(1.8)"}},{s + d * .82:.2f});'''))
# 7 · 5 min = 20 h
S.append(('r07', 'td', .5, '''
#X-a{top:380px;font-size:120px}
#X-eq{top:560px;font-size:90px}
#X-b{top:700px;font-size:220px}
#X-sub{top:960px;font:700 44px/1.2 "Montserrat",sans-serif;color:#CFCFCF}
''', CH() + '<p id="X-a" class="h w">5 min al día</p><p id="X-eq" class="h yy">=</p><p id="X-b" class="h yy"><span id="X-num">0</span> h</p><p id="X-sub" class="h">al año, en una sola tarea</p>',
 lambda D, s, d: f'''tl.from("#X-a",{{opacity:0,y:-40,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-eq",{{opacity:0,scale:.3,duration:.3}},{s + d * .35:.2f});
const X_n={{v:0}};
tl.to(X_n,{{v:20,duration:1.0,ease:"power2.out",onUpdate:()=>{{document.querySelector("#X-num").textContent="+"+Math.round(X_n.v);}}}},{s + d * .4:.2f});
tl.from("#X-b",{{scale:.5,opacity:0,duration:.4,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.from("#X-sub",{{opacity:0,y:30,duration:.35}},{s + d * .6:.2f});'''))
# 8 · CTA
S.append(('r08', 'tl', 2.2, '''
#X-t{top:190px;font-size:78px}
#X-save{left:60px;top:400px;width:560px;padding:30px 30px 34px;border-radius:34px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
#X-save h3{display:flex;align-items:center;gap:12px;font:800 38px/1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:16px}
#X-save h3 .ic{width:44px;height:44px}
#X-save p{display:flex;align-items:center;gap:14px;font:700 32px/1.2 "Montserrat",sans-serif;color:#1F1F1F;margin-top:14px}
#X-save p i{flex:none;width:44px;height:44px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font-style:normal;font:800 26px/1 "Montserrat",sans-serif}
#X-qr{left:660px;top:400px;width:360px;padding:24px 24px 18px;border-radius:34px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:12px;font:800 28px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-qr small{display:block;margin-top:6px;font:800 30px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-diag{left:660px;top:880px;width:360px;padding:18px;border-radius:24px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 32px/1.1 "Montserrat",sans-serif}
#X-p{left:20px;height:880px}
''', CH() + '<h1 id="X-t" class="h g">Guarda esta <span class="mk">guía</span></h1>'
 + f'<div id="X-save" class="abs"><h3>{icon("check")}¿Tu tarea cumple?</h3>' + ''.join(f'<p class="X-li"><i>{i + 1}</i>{t}</p>' for i, (t, _, _) in enumerate(CRITS)) + '</div>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalia.svg" alt=""><b>Visítanos</b><small>pascalia.lat</small></div><div id="X-diag" class="abs">Pide tu diagnóstico</div>'
 + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-save",{{opacity:0,x:-200,duration:.45,ease:"back.out(1.6)"}},.15);
tl.from(".X-li",{{opacity:0,x:-40,duration:.3,stagger:.15}},.4);
tl.from("#X-p",{{y:500,duration:.5,ease:"back.out(1.4)"}},.3);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .55:.2f});
tl.from("#X-diag",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .7:.2f});
tl.to("#X-diag",{{scale:1.06,duration:.35,yoyo:true,repeat:{k(D, s + d * .7 + .4, .35)},ease:"sine.inOut"}},{s + d * .7 + .4:.2f});'''))

BG = {'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>'}
LEAD = .3

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    t = 0.0; rows = []; timing = []
    for n, bg, tail, css, body, jsf in S:
        cid = f'f{n}'; d = round(dur(n), 2); s = LEAD; D = round(s + d + tail, 2)
        caps = ''; cj = ''
        parts = chunks(LINES[n], 44); tot = sum(len(p) for p in parts); c = s
        for j, part in enumerate(parts):
            pd = d * len(part) / tot
            caps += f'<div class="cap"><span id="{cid}-c{j}" style="background:#FFC107;color:#1F1F1F">{part}</span></div>'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:1}},{c:.2f});\n'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:0}},{min(D - .05, c + pd + (.3 if j == len(parts) - 1 else 0)):.2f});\n'
            c += pd
        X = cid
        js = jsf(D, s, d).replace('X_n', f'{X.replace("-", "_")}_n')
        html = page(cid, (EXTRA + css).replace('X-', f'{X}-'), BG[bg] + body.replace('X-', f'{X}-') + caps, js.replace('X-', f'{X}-') + cj)
        html = html.replace('.cap{position:absolute;left:70px;right:70px;bottom:250px;', '.cap{position:absolute;left:70px;right:70px;bottom:300px;')
        open(os.path.join(fr, f'{cid}.html'), 'w').write(html)
        rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{cid}.html" data-start="{t:.2f}" data-duration="{D:.2f}" data-track-index="1" data-width="1080" data-height="1920"></div>')
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{t + s:.2f}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
        timing.append({'id': n, 'start': round(t, 2), 'dur': D, 'vo': [round(t + s, 2), d]})
        t = round(t + D, 2)
    if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
        rows.append(f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{t}" data-track-index="4" data-volume="0.45"></audio>')
    json.dump({'total': t, 'scenes': timing, 'video': t, 'speech': [s_['vo'] for s_ in timing]}, open(os.path.join(ROOT, 'tools', 'timing.json'), 'w'), indent=1)
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
