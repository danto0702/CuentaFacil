# Builds "Reel 8 · Automatizar sin saber programar": your job is the business rules; connectors + an external diagnosis do the rest. Asks for comments.
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
.ilu{position:absolute;right:40px;top:40px;padding:10px 18px;border-radius:999px;background:#1F1F1F;color:#fff;font:700 24px/1 "Inter",sans-serif}
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
.myth s{color:#6B6B6B;font-weight:700}
.tlb{position:absolute;left:70px;right:70px}
.tlb b{display:block;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:12px}
.tlb .tr{height:70px;border-radius:20px;background:#EDEDED;overflow:hidden}
.tlb .fl{height:100%;border-radius:20px;display:flex;align-items:center;padding-left:24px;font:800 32px/1 "Montserrat",sans-serif;color:#fff;white-space:nowrap}
.qq{position:absolute;left:70px;right:70px;text-align:center;padding:34px;border-radius:32px;font:800 56px/1.15 "Montserrat",sans-serif}
"""
ILU = '<div class="ilu">Historia ilustrativa</div>'

EXTRA2 = EXTRA2 + """
.code{position:absolute;padding:14px 22px;border-radius:16px;background:#2A1A1A;color:#FF8A8A;font:700 34px/1 "Courier New",monospace;box-shadow:inset 0 0 0 3px #4A2A2A}
.role{position:absolute;left:70px;width:600px;display:flex;align-items:center;gap:20px;padding:22px 26px;border-radius:26px;background:#fff;box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
.role i{flex:none;width:64px;height:64px;border-radius:50%;padding:14px}
.role b{font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.role.no b{color:#6B6B6B;text-decoration:line-through}
.stamp2{position:absolute;left:0;right:0;text-align:center}
.stamp2 span{display:inline-block;padding:16px 40px;border:10px solid #FF5A5A;border-radius:24px;color:#FF5A5A;font:800 96px/1 "Montserrat",sans-serif;letter-spacing:.06em;transform:rotate(-7deg)}
.tile{position:absolute;width:220px;padding:22px 10px;border-radius:30px;background:#fff;text-align:center;font:800 30px/1.1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -20px rgba(31,31,31,.4)}
.tile i{display:block;margin:0 auto 12px;width:100px;height:100px;border-radius:26px;padding:24px}
.hub{position:absolute;width:240px;height:240px;border-radius:50%;background:#1F1F1F;display:grid;place-items:center;text-align:center;color:#FFC107;font:800 30px/1.1 "Montserrat",sans-serif;box-shadow:0 0 0 16px rgba(255,193,7,.35)}
.hub i{display:block;margin:0 auto 8px;width:80px;height:80px}
.fl{position:absolute;left:70px;width:620px;display:flex;align-items:center;gap:20px;padding:22px 26px;border-radius:26px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35)}
.fl i{flex:none;width:80px;height:80px;border-radius:22px;padding:18px}
.fl b{display:block;font:800 34px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.fl small{display:block;margin-top:6px;font:600 25px/1.25 "Inter",sans-serif;color:#5C5C5C}
.arr{position:absolute;left:340px;width:80px;height:60px}
.bub{position:absolute;padding:28px 32px;border-radius:32px 32px 32px 6px;background:#fff;font:600 32px/1.35 "Inter",sans-serif;color:#1F1F1F;box-shadow:0 24px 50px -24px rgba(31,31,31,.4)}
.rule{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:20px;padding:22px 26px;border-radius:24px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 20px 40px -20px rgba(31,31,31,.35)}
.rule em{flex:none;width:200px;padding:12px 0;border-radius:14px;text-align:center;font:800 26px/1 "Montserrat",sans-serif;font-style:normal;color:#fff}
.rule b{font:700 32px/1.2 "Inter",sans-serif;color:#1F1F1F}
.half{position:absolute;top:420px;width:470px;padding:28px;border-radius:32px;text-align:center}
.half b{display:block;font:800 40px/1.1 "Montserrat",sans-serif}
.half small{display:block;margin-top:10px;font:700 28px/1.2 "Inter",sans-serif}
.chipT{position:absolute;display:flex;align-items:center;gap:12px;padding:16px 24px;border-radius:999px;background:#fff;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:inset 0 0 0 3px #F3E7BE,0 16px 30px -16px rgba(31,31,31,.4)}
.chipT i{width:46px;height:46px;border-radius:12px;padding:9px}
"""
TOOLS = [('list-check', 'Excel', '#1E7B45'), ('bell', 'Correo', '#D93025'), ('whatsapp', 'WhatsApp', '#25A55F'), ('people', 'CRM', '#F97316')]
S = []
S.append(('g01', 'td', .4, """
#X-t{top:200px;font-size:66px}
#X-c{left:520px;height:880px}
""", CHT('Pregunta PascalIA') + '<img id="X-c" class="ch" src="assets/chars/hernando-confundido.webp" alt=""><h1 id="X-t" class="h w">¿Automatizar<br>sin saber <span class="yy">programar</span>?</h1>'
 + ''.join(f'<div class="code X-cd" style="left:{x}px;top:{y}px">{t}</div>' for t, x, y in [('if (x) {', 80, 520), ('</div>', 150, 700), ('{ "api": … }', 70, 880), ('for (i=0;', 160, 1060), ('return null;', 90, 1240)]),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
tl.from(".X-cd",{{opacity:0,scale:.3,rotation:-15,duration:.3,ease:"back.out(2.2)",stagger:{d * .12:.2f}}},{s + d * .25:.2f});
tl.to(".X-cd",{{y:-14,duration:.5,yoyo:true,repeat:{k(D, s + d * .9, .5)},ease:"sine.inOut",stagger:.1}},{s + d * .9:.2f});"""))
ROLE_OK = ['Conocer a tus clientes', 'Saber tus reglas', 'Decidir prioridades']
S.append(('g02', 'td', .4, """
#X-t{top:200px;font-size:68px}
#X-c{left:640px;height:860px}
""", CHT('Pregunta PascalIA') + '<img id="X-c" class="ch" src="assets/chars/marcela-idea.webp" alt=""><h1 id="X-t" class="h w">Tu rol: <span class="yy">las reglas</span></h1>'
 + f'<div class="role no X-n" style="top:450px"><i style="background:#E5484D">{icon("code", "#fff")}</i><b>Escribir código</b></div>'
 + ''.join(f'<div class="role X-r" style="top:{620 + i * 160}px"><i style="background:#25A55F">{icon("check", "#fff")}</i><b>{t}</b></div>' for i, t in enumerate(ROLE_OK)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .45:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
tl.from("#X-n",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)"}},{s + d * .2:.2f});
tl.from(".X-r",{{opacity:0,x:-300,duration:.32,ease:"back.out(1.6)",stagger:.2}},{s + d * .55:.2f});"""))
S.append(('g03', 'td', .4, """
#X-t{top:200px;font-size:60px}
#X-st{top:420px}
#X-bd{left:110px;top:660px;width:420px;padding:30px;border-radius:30px;background:#2A2A2A;text-align:center;color:#BDBDBD;font:800 32px/1.15 "Montserrat",sans-serif}
#X-bd i{display:block;margin:0 auto 14px;width:120px;height:120px}
#X-ok{left:110px;top:1030px;width:600px;padding:26px 30px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 4px #25A55F;font:800 36px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
#X-c{left:600px;height:860px}
""", CHT('Mito') + '<img id="X-c" class="ch" src="assets/chars/hernando-niega.webp" alt=""><h1 id="X-t" class="h w">¿Un departamento<br>de <span class="yy">sistemas</span>?</h1>'
 + '<div id="X-st" class="stamp2"><span>MITO</span></div>'
 + f'<div id="X-bd" class="abs"><i>{icon("building", "#757575")}</i>Departamento de sistemas propio</div>'
 + '<div id="X-ok" class="abs">✓ Herramientas que ya existen</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-bd",{{opacity:0,scale:.6,duration:.4,ease:"back.out(1.8)"}},{s + d * .1:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .2:.2f});
tl.from("#X-st",{{opacity:0,scale:2.4,duration:.3,ease:"power4.in"}},{s + d * .4:.2f});
tl.to("#X-bd",{{opacity:.4,duration:.3}},{s + d * .45:.2f});
tl.from("#X-ok",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.6)"}},{s + d * .62:.2f});"""))
TP = [(80, 470), (780, 470), (80, 1000), (780, 1000)]
S.append(('g04', 'ty', .4, """
#X-t{top:190px;font-size:64px}
#X-hub{left:420px;top:700px}
#X-ln{left:0;top:0;width:1080px;height:1920px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHT('Conectores') + '<h1 id="X-t" class="h g">Une lo que <span class="mk">ya usas</span></h1>'
 + '<svg id="X-ln" class="abs" viewBox="0 0 1080 1920"><g fill="none" stroke="#1F1F1F" stroke-width="8" stroke-linecap="round" stroke-dasharray="4 18">'
 + ''.join(f'<path class="X-w" d="M{x + 110} {y + 110} L540 820"/>' for x, y in TP) + '</g></svg>'
 + ''.join(f'<div class="tile X-tl" style="left:{x}px;top:{y}px"><i style="background:{c}">{icon(ic, "#fff")}</i>{t}</div>' for (ic, t, c), (x, y) in zip(TOOLS, TP))
 + f'<div id="X-hub" class="hub"><div><i>{icon("sync", "#FFC107")}</i>Conector</div></div><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-hub",{{scale:0,duration:.45,ease:"back.out(2)"}},{s + d * .05:.2f});
tl.from(".X-tl",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)",stagger:{d * .1:.2f}}},{s + d * .3:.2f});
tl.from(".X-w",{{opacity:0,duration:.3,stagger:{d * .1:.2f}}},{s + d * .32:.2f});
tl.fromTo(".X-w",{{strokeDashoffset:0}},{{strokeDashoffset:-220,duration:{max(1, D - s - d * .7):.2f},ease:"none"}},{s + d * .7:.2f});
tl.to("#X-hub",{{rotation:360,duration:{max(1, D - s - d * .7):.2f},ease:"none"}},{s + d * .7:.2f});"""))
FLOW = [('bell', '#D93025', 'Llega un correo', 'Nuevo pedido · Cliente ABC'), ('list-check', '#1E7B45', 'Pasa solo a Excel', 'Fila nueva con los datos'), ('whatsapp', '#25A55F', 'Aviso por WhatsApp', '«Nuevo pedido para despachar»')]
S.append(('g05', 'tl', .4, """
#X-t{top:190px;font-size:66px}
#X-c{left:640px;height:860px}
""", CHT('Ejemplo') + '<img id="X-c" class="ch" src="assets/chars/valentina-feliz.webp" alt=""><h1 id="X-t" class="h g">Sin copiar <span class="mk">nada</span></h1>'
 + ''.join(f'<div id="X-f{i}" class="fl X-f" style="top:{450 + i * 230}px"><i style="background:{c}">{icon(ic, "#fff")}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, c, t, sm) in enumerate(FLOW))
 + ''.join(f'<svg class="arr X-a" style="top:{600 + i * 230}px" viewBox="0 0 24 18"><path d="M12 2v14M6 10l6 6 6-6" stroke="#1F1F1F" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' for i in range(2)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
""" + ''.join(f'tl.from("#X-f{i}",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)"}},{s + d * (.12 + i * .28):.2f});\n' for i in range(3)) + f"""tl.from(".X-a",{{opacity:0,y:-20,duration:.25,stagger:{d * .28:.2f}}},{s + d * .3:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .78:.2f});"""))
S.append(('g06', 'tl', .4, """
#X-t{top:190px;font-size:66px}
#X-b{left:70px;top:430px;width:640px}
#X-c{left:620px;height:900px}
#X-lp{left:120px;top:900px;width:300px;height:300px}
""", CHT('Diagnóstico') + '<img id="X-c" class="ch" src="assets/chars/marcela-acuerdo.webp" alt=""><h1 id="X-t" class="h g">Cuéntanos <span class="mk">tu operación</span></h1>'
 + '<div id="X-b" class="bub">«Cuando un cliente paga, alguien revisa el banco, le avisa a bodega y actualiza el Excel…»</div>'
 + '<img id="X-lp" class="abs" src="assets/objs/lupa.webp" alt="">',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-b",{{opacity:0,scale:.6,transformOrigin:"0% 100%",duration:.45,ease:"back.out(1.8)"}},{s + d * .45:.2f});
tl.from("#X-lp",{{opacity:0,scale:.4,rotation:-30,duration:.4,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.to("#X-lp",{{x:40,y:-20,rotation:8,duration:.6,yoyo:true,repeat:{k(D, s + d * .3 + .5, .6)},ease:"sine.inOut"}},{s + d * .3 + .5:.2f});"""))
RULES = [('CUANDO', '#1F1F1F', 'llega el pago al banco'), ('ENTONCES', '#25A55F', 'se avisa a bodega'), ('Y ADEMÁS', '#F97316', 'se actualiza el Excel')]
S.append(('g07', 'tl', .4, """
#X-t{top:190px;font-size:64px}
#X-p{left:560px;height:820px}
""", CHT('Flujo automático') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">Lo traducimos<br>en <span class="mk">reglas claras</span></h1>'
 + ''.join(f'<div class="rule X-r" style="top:{480 + i * 160}px"><em style="background:{c}">{w}</em><b>{t}</b></div>' for i, (w, c, t) in enumerate(RULES)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-r",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)",stagger:{d * .2:.2f}}},{s + d * .25:.2f});
tl.from("#X-p",{{y:600,duration:.5,ease:"back.out(1.3)"}},{s + d * .5:.2f});"""))
S.append(('g08', 'tl', .5, """
#X-t{top:190px;font-size:62px}
#X-a{left:70px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE}
#X-a b{color:#1F1F1F}
#X-a small{color:#5C5C5C}
#X-b{left:540px;background:#1F1F1F}
#X-b b{color:#FFC107}
#X-b small{color:#fff}
#X-h{left:60px;height:820px}
#X-p{left:560px;height:820px}
""", CHT('PascalIA') + '<img id="X-h" class="ch" src="assets/chars/hernando-pulgar.webp" alt=""><img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">El equipo <span class="mk">perfecto</span></h1>'
 + '<div id="X-a" class="half"><b>Tú</b><small>El conocimiento de tu negocio</small></div><div id="X-b" class="half"><b>Nosotros</b><small>La técnica</small></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-a",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.6)"}},{s:.2f});
tl.from("#X-h",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .1:.2f});
tl.from("#X-b",{{opacity:0,x:300,duration:.4,ease:"back.out(1.6)"}},{s + d * .5:.2f});
tl.from("#X-p",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .55:.2f});"""))
CHIPS = [('list-check', 'Excel', '#1E7B45', 70, 430), ('bell', 'Gmail', '#D93025', 400, 430), ('whatsapp', 'WhatsApp', '#25A55F', 70, 560), ('people', 'CRM', '#F97316', 460, 560)]
S.append(('g09', 'tl', 2.6, """
#X-t{top:170px;font-size:62px}
#X-cm{left:70px;top:720px;width:640px;display:flex;align-items:center;gap:18px;padding:24px 28px;border-radius:28px;background:#1F1F1F;color:#FFC107;font:800 38px/1.15 "Montserrat",sans-serif}
#X-cm i{flex:none;width:64px;height:64px}
#X-sub{left:70px;top:900px;width:640px;font:700 30px/1.3 "Inter",sans-serif;color:#1F1F1F}
#X-by{left:70px;top:1030px;width:640px;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:640px;height:960px}
""", CHT('Pregunta PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h g">¿Qué herramientas<br><span class="mk">usan hoy</span>?</h1>'
 + ''.join(f'<div class="chipT X-ch" style="left:{x}px;top:{y}px"><i style="background:{c}">{icon(ic, "#fff")}</i>{t}</div>' for ic, t, c, x, y in CHIPS)
 + f'<div id="X-cm" class="abs"><i>{icon("chat", "#FFC107")}</i>Cuéntamelo en los comentarios 👇</div>'
 + '<p id="X-sub" class="abs">Te respondo cómo podrías automatizarlas.</p>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-ch",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)",stagger:.15}},{s + d * .3:.2f});
tl.from("#X-cm",{{opacity:0,y:40,duration:.35,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.to("#X-cm",{{scale:1.04,duration:.35,yoyo:true,repeat:{k(D, s + d * .55 + .4, .35)},ease:"sine.inOut"}},{s + d * .55 + .4:.2f});
tl.from("#X-sub",{{opacity:0,y:20,duration:.35}},{s + d * .7:.2f});
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
