# Builds "Reel 6 · El gerente que creía que la IA era para multinacionales": an illustrative (not real-client) story from fear to a first small tool.
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
CH = lambda: '<div class="chip3"><span><img src="assets/brand/flower.svg" alt="">La realidad PascalIA</span></div>'

CHAT_CSS = '''
.wa{position:absolute;border-radius:40px;background:#0B141A;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);border:10px solid #1F1F1F}
.wa .top{display:flex;align-items:center;gap:14px;padding:20px 22px;background:#1F2C34;color:#E9EDEF;font:700 30px/1 "Inter",sans-serif}
.wa .top i{width:52px;height:52px;border-radius:50%;background:#6B7C85;flex:none}
.wa .top small{display:block;font:500 22px/1.2 "Inter",sans-serif;color:#8696A0;margin-top:4px}
.wa .body{padding:20px;display:flex;flex-direction:column;gap:14px}
.m{max-width:88%;padding:14px 18px;border-radius:18px;font:500 28px/1.3 "Inter",sans-serif;color:#E9EDEF;background:#1F2C34;align-self:flex-start}
.m.me{background:#005C4B;align-self:flex-end}
.m small{display:block;text-align:right;font-size:18px;color:#8696A0;margin-top:4px}
.m small b{color:#53BDEB;font-weight:600}
.m.me small{color:#CFE9E2}
.m.me small b{color:#A8E6FF}
.badge{position:absolute;display:grid;place-items:center;border-radius:999px;background:#25D366;color:#fff;font:800 40px/1 "Montserrat",sans-serif;padding:10px 22px;box-shadow:0 10px 24px -8px rgba(0,0,0,.5)}
.clockbig{position:absolute;left:0;right:0;text-align:center;font:800 120px/1 "Montserrat",sans-serif;letter-spacing:-.03em}
'''
EXTRA2 = EXTRA + CHAT_CSS
CH2 = lambda: '<div class="chip3"><span><img src="assets/brand/flower.svg" alt="">Mito vs. realidad</span></div>'
def chat(id_, style, msgs, who='Cliente nuevo', sub='en línea'):
    return (f'<div id="{id_}" class="wa" style="{style}"><div class="top"><i></i><div>{who}<small>{sub}</small></div></div><div class="body">'
            + ''.join(f'<div id="{mid}" class="m{" me" if me else ""}">{t}<small>{h}</small></div>' for mid, me, t, h in msgs) + '</div></div>')

CHT = lambda t: f'<div class="chip3"><span><img src="assets/brand/flower.svg" alt="">{t}</span></div>'
EXTRA2 = EXTRA2 + """
.num{position:absolute;width:110px;height:110px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 66px/1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 18px 36px -14px rgba(0,0,0,.45)}
.ing{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:26px;padding:24px 30px;border-radius:30px;background:#fff;box-shadow:0 24px 50px -24px rgba(0,0,0,.55)}
.ing i{flex:none;width:96px;height:96px;border-radius:50%;background:#FFC107;padding:22px}
.ing b{display:block;font:800 44px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
.ing small{display:block;margin-top:6px;font:600 27px/1.2 "Inter",sans-serif;color:#5C5C5C}
.tag{position:absolute;padding:12px 22px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}
.cmp{position:absolute;left:70px;right:70px;padding:24px 28px;border-radius:28px}
.cmp p{font:500 32px/1.35 "Inter",sans-serif}
.card{position:absolute;border-radius:28px;background:#fff;overflow:hidden;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.4)}
.card h3{margin:0;padding:18px 24px;background:#1F1F1F;color:#FFC107;font:800 30px/1 "Montserrat",sans-serif;display:flex;align-items:center;gap:12px}
.card h3 em{margin-left:auto;font:800 20px/1 "Montserrat",sans-serif;font-style:normal;color:#1F1F1F;background:#25D366;padding:8px 12px;border-radius:999px}
.card p{display:flex;justify-content:space-between;gap:12px;padding:16px 24px;border-top:2px solid #EFEFEF;font:700 28px/1.2 "Inter",sans-serif;color:#1F1F1F}
.card p.hit{background:#FFF6D6}
.card p.hit b{color:#14522E}
.card p b{color:#1E7B45}
.ho{position:absolute;padding:24px 28px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 3px #25A55F,0 24px 50px -24px rgba(31,31,31,.4)}
.ho b{display:block;font:800 34px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.ho small{display:block;margin-top:4px;font:600 24px/1.2 "Inter",sans-serif;color:#1E7B45}
.ho li{list-style:none;margin-top:12px;font:600 26px/1.25 "Inter",sans-serif;color:#1F1F1F}
.ho li:before{content:"✓ ";color:#1E7B45;font-weight:800}
.vs{position:absolute;width:440px;padding:30px 24px;border-radius:32px;text-align:center}
.vs i{display:block;margin:0 auto 16px;width:110px;height:110px;border-radius:50%;padding:26px}
.vs b{display:block;font:800 44px/1.05 "Montserrat",sans-serif}
.vs small{display:block;margin-top:10px;font:600 26px/1.25 "Inter",sans-serif}
.q5{position:absolute;left:70px;width:640px;display:flex;align-items:center;gap:20px;padding:20px 24px;border-radius:24px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35);font:700 32px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
.q5 i{flex:none;width:52px;height:52px;border-radius:12px;box-shadow:inset 0 0 0 4px #1F1F1F}
"""

EXTRA2 = EXTRA2 + """
.ilu{position:absolute;right:40px;top:40px;padding:8px 16px;border-radius:999px;background:rgba(0,0,0,.35);color:#fff;font:700 20px/1 "Inter",sans-serif}
.quote{position:absolute;left:70px;right:70px;padding:40px 44px;border-radius:34px;background:#fff;box-shadow:0 30px 60px -24px rgba(0,0,0,.6)}
.quote b{display:block;font:800 52px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
.quote small{display:block;margin-top:16px;font:600 28px/1 "Inter",sans-serif;color:#757575}
.quote:before{content:"“";position:absolute;left:30px;top:-70px;font:800 200px/1 "Montserrat",sans-serif;color:#FFC107}
.bld{position:absolute;text-align:center;font:800 30px/1.1 "Montserrat",sans-serif;color:#fff}
.bld i{display:block;margin:0 auto 14px;border-radius:30px;background:#2A2A2A;box-shadow:inset 0 0 0 3px #3A3A3A}
.qm{position:absolute;font:800 140px/1 "Montserrat",sans-serif;color:#FFC107}
.fear{position:absolute;left:70px;width:640px;display:flex;align-items:center;gap:22px;padding:24px 28px;border-radius:28px;background:#2A2A2A;box-shadow:inset 0 0 0 3px #3A3A3A}
.fear i{flex:none;width:84px;height:84px;border-radius:50%;background:#3A3A3A;padding:20px}
.fear b{font:800 38px/1.1 "Montserrat",sans-serif;color:#fff}
.tool{position:absolute;left:70px;width:600px;padding:30px;border-radius:34px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
.tool h3{display:flex;align-items:center;gap:16px;margin:0 0 10px;font:800 40px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.tool h3 i{flex:none;width:80px;height:80px;border-radius:22px;background:#FFC107;padding:18px}
.tool p{display:flex;align-items:center;gap:14px;margin-top:16px;font:700 32px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
.tool p span{flex:none;width:42px;height:42px;border-radius:50%;background:#25A55F;padding:9px}
.myth{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:20px;padding:22px 28px;border-radius:28px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35)}
.myth .x{flex:none;width:70px;height:70px;border-radius:50%;background:#E5484D;display:grid;place-items:center;color:#fff;font:800 40px/1 "Montserrat",sans-serif}
.myth .ok{position:static;flex:none;width:70px;height:70px;border-radius:50%;background:#25A55F;padding:15px;box-shadow:none}
.myth b{font:800 36px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
.myth s{color:#9E9E9E;font-weight:700}
.tlb{position:absolute;left:70px;right:70px}
.tlb b{display:block;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:12px}
.tlb .tr{height:70px;border-radius:20px;background:#EDEDED;overflow:hidden}
.tlb .fl{height:100%;border-radius:20px;display:flex;align-items:center;padding-left:24px;font:800 32px/1 "Montserrat",sans-serif;color:#fff;white-space:nowrap}
.qq{position:absolute;left:70px;right:70px;text-align:center;padding:34px;border-radius:32px;font:800 56px/1.15 "Montserrat",sans-serif}
"""
ILU = '<div class="ilu">Historia ilustrativa</div>'

S = []
S.append(('e01', 'td', .4, """
#X-q{top:400px}
#X-big{left:110px;top:900px}
#X-big i{width:200px;height:300px;padding:50px}
#X-sm{left:430px;top:1050px}
#X-sm i{width:150px;height:150px;padding:34px}
#X-c{left:620px;height:820px}
""", CHT('Historia PascalIA') + ILU + '<img id="X-c" class="ch" src="assets/chars/contratista-nervioso.webp" alt="">'
 + '<div id="X-q" class="quote"><b>La IA es para las multinacionales… no para una empresa como la mía.</b><small>— Lo que piensan muchos gerentes</small></div>'
 + f'<div id="X-big" class="bld"><i>{icon("building", "#FFC107")}</i>Multinacional</div><div id="X-sm" class="bld"><i>{icon("store", "#BDBDBD")}</i>Mi empresa</div>',
 lambda D, s, d: f"""tl.from("#X-q",{{opacity:0,scale:.85,y:40,duration:.45,ease:"back.out(1.6)"}},.1);
tl.from("#X-big",{{opacity:0,y:200,duration:.45,ease:"back.out(1.4)"}},{s + d * .4:.2f});
tl.from("#X-sm",{{opacity:0,y:120,duration:.4,ease:"back.out(1.6)"}},{s + d * .65:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .5:.2f});"""))
S.append(('e02', 'td', .4, """
#X-t{top:220px;font-size:76px}
#X-c{left:250px;height:900px}
""", CHT('Historia PascalIA') + ILU + '<img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt="">'
 + '<h1 id="X-t" class="h w">Lo desconocido<br><span class="yy">da miedo</span></h1>'
 + ''.join(f'<div class="qm X-qm" style="left:{x}px;top:{y}px;font-size:{f}px">?</div>' for x, y, f in [(120, 560, 150), (840, 520, 120), (200, 860, 100), (860, 840, 160), (520, 470, 90)]),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .45:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
tl.from(".X-qm",{{opacity:0,scale:0,rotation:-40,duration:.35,ease:"back.out(2.5)",stagger:.2}},{s + d * .55:.2f});
tl.to(".X-qm",{{y:-20,duration:.6,yoyo:true,repeat:{k(D, s + d * .55 + 1.2, .6)},ease:"sine.inOut",stagger:.1}},{s + d * .55 + 1.2:.2f});"""))
FEARS = [('money', '¿Cuánto me va a costar?'), ('code', '¿Tengo que contratar ingenieros?'), ('people', '¿Y si mi equipo no la sabe usar?')]
S.append(('e03', 'td', .4, """
#X-t{top:200px;font-size:70px}
#X-c{left:640px;height:820px}
""", CHT('Historia PascalIA') + ILU + '<img id="X-c" class="ch" src="assets/chars/contratista-nervioso.webp" alt=""><h1 id="X-t" class="h w">Las <span class="yy">dudas</span> de siempre</h1>'
 + ''.join(f'<div class="fear X-f" style="top:{460 + i * 180}px"><i>{icon(ic, "#FFC107")}</i><b>{t}</b></div>' for i, (ic, t) in enumerate(FEARS)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
tl.from(".X-f",{{opacity:0,x:-400,duration:.35,ease:"back.out(1.5)",stagger:{d * .3:.2f}}},{s:.2f});"""))
S.append(('e04', 'ty', .4, """
#X-t{top:200px;font-size:72px}
#X-tl{top:460px}
#X-p{left:620px;height:900px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHT('El primer paso') + ILU.replace('rgba(0,0,0,.35)', '#1F1F1F') + '<img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><h1 id="X-t" class="h g">Empezar <span class="mk">pequeño</span></h1>'
 + f'<div id="X-tl" class="tool"><h3><i>{icon("doc")}</i>Asistente de cotizaciones</h3>'
 + ''.join(f'<p class="X-li"><span>{icon("check", "#fff")}</span>{t}</p>' for t in ['Una sola herramienta', 'Sencilla', 'De bajo costo', 'Para la tarea que más se repite']) + '</div>'
 + '<div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-p",{{x:600,duration:.6,ease:"power2.out"}},.3);
tl.from("#X-tl",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},{s + d * .25:.2f});
tl.from(".X-li",{{opacity:0,x:-40,duration:.25,stagger:{d * .12:.2f}}},{s + d * .35:.2f});"""))
MYTHS = [('Cambiar sus sistemas', 'Funciona con lo que ya usa'), ('Contratar ingenieros', 'Lo acompañamos nosotros'), ('Meses de capacitación', 'Lo aprenden en una sesión')]
S.append(('e05', 'tl', .4, """
#X-t{top:190px;font-size:72px}
""", CHT('El primer paso') + ILU.replace('rgba(0,0,0,.35)', '#1F1F1F') + '<h1 id="X-t" class="h g">Sin <span class="mk">complicaciones</span></h1>'
 + ''.join(f'<div class="myth X-m" style="top:{440 + i * 330}px"><span class="x">✕</span><b><s>{a}</s></b></div><div class="myth X-k" style="top:{580 + i * 330}px;box-shadow:inset 0 0 0 4px #25A55F,0 20px 40px -20px rgba(31,31,31,.35)"><span class="ok">{icon("check", "#fff")}</span><b>{b}</b></div>' for i, (a, b) in enumerate(MYTHS)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-m",{{opacity:0,x:-300,duration:.3,ease:"back.out(1.6)",stagger:{d * .27:.2f}}},{s:.2f});
tl.from(".X-k",{{opacity:0,x:300,duration:.3,ease:"back.out(1.6)",stagger:{d * .27:.2f}}},{s + d * .12:.2f});"""))
S.append(('e06', 'tl', .5, """
#X-t{top:190px;font-size:70px}
#X-a{top:470px}
#X-b{top:640px}
#X-a .fl{width:100%;background:#9E9E9E}
#X-b .fl{width:26%;background:#25A55F}
#X-doc{left:70px;top:860px;width:520px;padding:26px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 3px #25A55F,0 24px 50px -24px rgba(31,31,31,.35)}
#X-doc b{display:block;font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-doc small{display:block;margin-top:8px;font:700 28px/1 "Inter",sans-serif;color:#1E7B45}
#X-c{left:600px;height:780px}
""", CHT('El impacto') + ILU.replace('rgba(0,0,0,.35)', '#1F1F1F') + '<img id="X-c" class="ch" src="assets/chars/contratista-alivio.webp" alt=""><h1 id="X-t" class="h g">Entregas <span class="mk">más rápidas</span></h1>'
 + '<div id="X-a" class="tlb"><b>Antes</b><div class="tr"><div class="fl">Días</div></div></div>'
 + '<div id="X-b" class="tlb"><b>Ahora</b><div class="tr"><div class="fl">El mismo día</div></div></div>'
 + '<div id="X-doc" class="abs"><b>Cotización enviada ✓</b><small>Mismo día de la solicitud</small></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-a",{{opacity:0,duration:.3}},{s + d * .1:.2f});
tl.from("#X-a .fl",{{width:0,duration:.9,ease:"power1.inOut"}},{s + d * .1:.2f});
tl.from("#X-b",{{opacity:0,duration:.3}},{s + d * .55:.2f});
tl.from("#X-b .fl",{{width:0,duration:.4,ease:"power3.out"}},{s + d * .55:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .6:.2f});
tl.from("#X-doc",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .75:.2f});"""))
S.append(('e07', 'tl', .5, """
#X-t{top:190px;font-size:70px}
#X-o{top:500px;background:#EDEDED;color:#9E9E9E}
#X-n{top:820px;background:#1F1F1F;color:#FFC107}
#X-ln{left:140px;top:560px;width:800px;height:12px;border-radius:6px;background:#E5484D;transform-origin:0 50%}
""", CHT('El cambio') + ILU.replace('rgba(0,0,0,.35)', '#1F1F1F') + '<h1 id="X-t" class="h g">Cambia <span class="mk">la pregunta</span></h1>'
 + '<div id="X-o" class="qq">¿La IA es para mí?</div><div id="X-ln" class="abs"></div><div id="X-n" class="qq">¿Qué más podemos hacer?</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-o",{{opacity:0,y:40,duration:.35}},{s + d * .2:.2f});
tl.from("#X-ln",{{scaleX:0,duration:.35,ease:"power2.in"}},{s + d * .5:.2f});
tl.from("#X-n",{{opacity:0,scale:.6,duration:.45,ease:"back.out(2)"}},{s + d * .62:.2f});
tl.to("#X-n",{{scale:1.04,duration:.4,yoyo:true,repeat:{k(D, s + d * .62 + .5, .4)},ease:"sine.inOut"}},{s + d * .62 + .5:.2f});"""))
S.append(('e08', 'tl', .45, """
#X-t{top:190px;font-size:68px}
#X-big{left:90px;top:520px}
#X-sm{left:380px;top:620px}
.X-b i{background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 20px 40px -20px rgba(31,31,31,.35)}
#X-big i{width:220px;height:320px;padding:56px}
#X-sm i{width:220px;height:220px;padding:50px}
.X-b{color:#1F1F1F}
#X-p{left:600px;height:900px}
""", CHT('PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">La IA es para quien<br><span class="mk">da el primer paso</span></h1>'
 + f'<div id="X-big" class="bld X-b"><i>{icon("building")}</i>Grandes</div><div id="X-sm" class="bld X-b"><i>{icon("store")}</i>Pymes</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .45:.2f});
tl.from("#X-big",{{opacity:0,y:150,duration:.4,ease:"back.out(1.5)"}},.2);
tl.from("#X-sm",{{opacity:0,y:150,duration:.4,ease:"back.out(1.5)"}},{s + d * .2:.2f});
tl.to("#X-sm",{{scale:1.12,duration:.35,yoyo:true,repeat:1,ease:"sine.inOut"}},{s + d * .65:.2f});
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.3);"""))
S.append(('e09', 'tl', 2.4, """
#X-t{top:170px;font-size:66px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:1000px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif}
#X-sub{left:560px;top:1150px;width:460px;text-align:center;font:700 28px/1.3 "Inter",sans-serif;color:#1F1F1F}
#X-by{left:560px;top:1250px;width:460px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:10px;height:1000px}
""", CHT('PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">Agenda tu<br><span class="mk">sesión exploratoria</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-whatsapp.svg" alt=""><b>312 388 5012</b></div><div id="X-demo" class="abs">Sin compromiso</div><p id="X-sub" class="abs">Sin tecnicismos. Solo una conversación sobre tu negocio.</p>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .2:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .45:.2f});
tl.to("#X-demo",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .45 + .4, .35)},ease:"sine.inOut"}},{s + d * .45 + .4:.2f});
tl.from("#X-sub",{{opacity:0,y:20,duration:.35}},{s + d * .6:.2f});
tl.from("#X-by",{{opacity:0,duration:.35}},{s + d * .85:.2f});"""))

BG = {'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>', 'ty': '<div class="light"></div><div class="abs" style="inset:0;background:radial-gradient(80% 50% at 50% 30%,rgba(255,193,7,.45),transparent 75%)"></div>'}
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
        html = page(cid, (EXTRA2 + css).replace('X-', f'{X}-'), BG[bg] + body.replace('X-', f'{X}-') + caps, js.replace('X-', f'{X}-') + cj)
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
