# Builds "Reel 3 · Comprar licencias no es implementar IA": the myth of buying chat licenses vs. role-based training and integration.
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

S = []
NEW_CSS = """
.lic{position:absolute;width:290px;padding:22px;border-radius:24px;background:#262626;box-shadow:inset 0 0 0 3px #3A3A3A;color:#fff;font:800 30px/1.1 "Montserrat",sans-serif}
.lic small{display:block;margin-top:8px;font:600 22px/1.2 "Inter",sans-serif;color:#BDBDBD}
.lic i{display:block;width:58px;height:58px;border-radius:16px;background:#FFC107;padding:12px;margin-bottom:14px}
.stamp{position:absolute;left:0;right:0;text-align:center}
.stamp span{display:inline-block;padding:20px 50px;border:12px solid #FF5A5A;border-radius:28px;color:#FF5A5A;font:800 170px/1 "Montserrat",sans-serif;letter-spacing:.04em;transform:rotate(-8deg)}
.bar{position:absolute;bottom:0;width:170px;border-radius:20px 20px 0 0;background:#FFC107}
.bl{position:absolute;width:220px;text-align:center;font:700 30px/1.1 "Montserrat",sans-serif;color:#CFCFCF}
.role{position:absolute;left:70px;width:640px;display:flex;align-items:center;gap:22px;padding:24px 28px;border-radius:28px;background:#fff;box-shadow:0 24px 50px -24px rgba(0,0,0,.5)}
.role i{flex:none;width:90px;height:90px;border-radius:24px;background:#FFC107;padding:20px}
.role b{display:block;font:800 40px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
.role small{display:block;margin-top:6px;font:600 27px/1.2 "Inter",sans-serif;color:#5C5C5C}
.gc{position:absolute;border-radius:30px;background:#fff;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}
.gc .top{display:flex;align-items:center;gap:14px;padding:20px 24px;background:#EDEDED;font:800 30px/1 "Montserrat",sans-serif;color:#1F1F1F}
.gc .top i{width:46px;height:46px;border-radius:50%;background:#9E9E9E;padding:10px}
.gc .body{padding:22px;display:flex;flex-direction:column;gap:16px}
.q{max-width:86%;padding:16px 20px;border-radius:20px;font:500 28px/1.3 "Inter",sans-serif}
.q.u{align-self:flex-end;background:#1F1F1F;color:#fff}
.q.a{align-self:flex-start;background:#F1F1F1;color:#1F1F1F}
.isl{position:absolute;display:flex;align-items:center;gap:12px;padding:16px 24px;border-radius:999px;background:#2A2A2A;color:#fff;font:800 32px/1 "Montserrat",sans-serif;box-shadow:inset 0 0 0 3px #FF5A5A}
.isl span{width:44px;height:44px;display:inline-block}
.pil{position:absolute;width:440px;padding:30px;border-radius:34px;background:#fff;text-align:center;box-shadow:0 24px 50px -24px rgba(31,31,31,.35)}
.pil i{display:block;margin:0 auto 18px;width:120px;height:120px;border-radius:50%;background:#FFC107;padding:28px}
.pil b{display:block;font:800 42px/1.08 "Montserrat",sans-serif;color:#1F1F1F}
.pil small{display:block;margin-top:10px;font:600 27px/1.25 "Inter",sans-serif;color:#5C5C5C}
.node{position:absolute;display:flex;align-items:center;gap:16px;padding:22px 26px;border-radius:26px;background:#fff;font:800 32px/1.1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -20px rgba(31,31,31,.4)}
.node i{flex:none;width:70px;height:70px;border-radius:20px;background:#FFC107;padding:15px}
.node.ok2 i{background:#25A55F}
.svc{position:absolute;left:70px;width:600px;display:flex;align-items:center;gap:22px;padding:24px 28px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
.svc i{flex:none;width:96px;height:96px;border-radius:50%;background:#1F1F1F;padding:22px}
.svc b{display:block;font:800 42px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
.svc small{display:block;margin-top:6px;font:600 26px/1.2 "Inter",sans-serif;color:#5C5C5C}
"""
EXTRA2 = EXTRA2 + NEW_CSS

LIC = [(70, 470), (395, 470), (720, 470), (70, 700), (395, 700), (720, 700)]
S.append(('b01', 'td', .3, """
#X-t{top:220px;font-size:72px}
#X-ann{left:120px;top:1000px;width:840px;padding:30px 34px;border-radius:30px;background:#FFC107;color:#1F1F1F;text-align:center;font:800 54px/1.1 "Montserrat",sans-serif;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
.X-conf{position:absolute;width:22px;height:34px;border-radius:6px}
""", CH2() + '<h1 id="X-t" class="h w">Compraste <span class="yy">licencias</span></h1>'
 + ''.join(f'<div class="lic X-lic" style="left:{x}px;top:{y}px"><i>{icon("chat")}</i>Chat IA<small>Licencia activa</small></div>' for x, y in LIC)
 + '<div id="X-ann" class="abs">«¡Ya tenemos IA!» 🎉</div>'
 + ''.join(f'<div class="X-conf" style="left:{x}px;top:960px;background:{c}"></div>' for x, c in [(160, '#FFC107'), (300, '#25A55F'), (470, '#38BDF8'), (620, '#FF5A5A'), (780, '#FFC107'), (900, '#25A55F')]),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-lic",{{opacity:0,scale:.4,y:60,duration:.32,ease:"back.out(2)",stagger:.16}},.3);
tl.from("#X-ann",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .62:.2f});
tl.fromTo(".X-conf",{{y:0,opacity:0}},{{y:-260,x:"+=40",rotation:200,opacity:1,duration:.7,ease:"power2.out",stagger:.05}},{s + d * .66:.2f});
tl.to(".X-conf",{{y:300,opacity:0,duration:.9,ease:"power2.in",stagger:.05}},{s + d * .66 + .7:.2f});"""))
S.append(('b02', 'td', .5, """
#X-st{top:330px}
#X-t{top:720px;font-size:84px}
#X-eq{top:1000px;font:800 56px/1.15 "Montserrat",sans-serif;color:#fff;left:70px;right:70px;text-align:center}
#X-eq b{color:#FF5A5A}
""", CH2() + '<div id="X-st" class="stamp"><span>ERROR</span></div>'
 + '<h1 id="X-t" class="h w">Acceso <span class="red">≠</span> implementación</h1>'
 + '<p id="X-eq" class="abs">Dar una herramienta<br><b>no es</b> implementar IA</p>',
 lambda D, s, d: f"""tl.from("#X-st",{{opacity:0,scale:2.6,duration:.3,ease:"power4.in"}},{s:.2f});
tl.to("#X-st",{{x:10,duration:.05,yoyo:true,repeat:5,ease:"none"}},{s + .3:.2f});
tl.from("#X-t",{{opacity:0,y:30,duration:.35,ease:"back.out(1.8)"}},{s + d * .35:.2f});
tl.from("#X-eq",{{opacity:0,y:30,duration:.35}},{s + d * .55:.2f});"""))
S.append(('b03', 'td', .45, """
#X-t{top:200px;font-size:72px}
#X-ch{left:130px;top:420px;width:820px;height:520px;border-bottom:4px solid #4A4A4A}
#X-b1{left:55px;height:500px}
#X-b2{left:325px;height:500px}
#X-b3{left:595px;height:500px}
#X-l1{left:30px;top:970px}
#X-l2{left:300px;top:970px}
#X-l3{left:570px;top:970px}
#X-pw{left:190px;top:1060px;width:700px;padding:28px;border-radius:28px;background:#fff;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
#X-pw b{display:block;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-pw p{margin-top:16px;padding:16px 20px;border-radius:14px;background:#F1F1F1;font:600 32px/1 "Inter",sans-serif;color:#1F1F1F;letter-spacing:.2em}
#X-pw small{display:block;margin-top:14px;font:600 26px/1 "Inter",sans-serif;color:#C62828}
""", CH2() + '<h1 id="X-t" class="h w">¿Quién la <span class="yy">sigue usando</span>?</h1>'
 + '<div id="X-ch" class="abs"><div id="X-b1" class="bar"></div><div id="X-b2" class="bar"></div><div id="X-b3" class="bar"></div></div>'
 + '<p id="X-l1" class="bl" style="left:160px">Semana 1</p><p id="X-l2" class="bl" style="left:430px">Mes 1</p><p id="X-l3" class="bl" style="left:700px">Mes 3</p>'
 + '<div id="X-pw" class="abs"><b>Iniciar sesión · Chat IA</b><p>Contraseña: ••••••</p><small>¿Olvidaste tu contraseña?</small></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-b1",{{scaleY:0,transformOrigin:"50% 100%",duration:.45,ease:"back.out(1.4)"}},{s + d * .05:.2f});
tl.from("#X-l1",{{opacity:0,duration:.3}},{s + d * .05:.2f});
tl.fromTo("#X-b2",{{height:500}},{{height:180,duration:.6,ease:"power2.inOut"}},{s + d * .3:.2f});
tl.from("#X-l2",{{opacity:0,duration:.3}},{s + d * .3:.2f});
tl.fromTo("#X-b3",{{height:500}},{{height:24,background:"#FF5A5A",duration:.7,ease:"power2.inOut"}},{s + d * .52:.2f});
tl.from("#X-l3",{{opacity:0,duration:.3}},{s + d * .52:.2f});
tl.from("#X-pw",{{opacity:0,y:200,duration:.45,ease:"back.out(1.5)"}},{s + d * .72:.2f});
tl.to("#X-pw",{{x:10,duration:.06,yoyo:true,repeat:5,ease:"none"}},{s + d * .85:.2f});"""))
ROLES = [('chart', 'Contabilidad', 'Conciliar y armar informes'), ('megaphone', 'Ventas', 'Responder y cerrar negocios'), ('people', 'Talento humano', 'Seleccionar y formar')]
S.append(('b04', 'td', .45, """
#X-t{top:190px;font-size:70px}
#X-c{left:640px;height:820px}
""", CH2() + '<img id="X-c" class="ch" src="assets/chars/contratista-nervioso.webp" alt=""><h1 id="X-t" class="h w">Nadie les enseñó<br><span class="yy">según su rol</span></h1>'
 + ''.join(f'<div class="role X-r" style="top:{440 + i * 190}px"><i>{icon(ic)}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, t, sm) in enumerate(ROLES)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.25);
tl.from(".X-r",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)",stagger:.35}},{s + d * .5:.2f});"""))
S.append(('b05', 'td', .45, """
#X-t{top:190px;font-size:72px}
#X-gc{left:110px;top:400px;width:860px}
#X-i1{left:70px;top:1010px}
#X-i2{left:400px;top:1010px}
#X-i3{left:720px;top:1010px}
""", CH2() + '<h1 id="X-t" class="h w">Un chat <span class="red">genérico</span></h1>'
 + f'<div id="X-gc" class="gc"><div class="top"><i>{icon("chat", "#fff")}</i>Chat genérico</div><div class="body">'
 + '<div id="X-q1" class="q u">¿Cuánto inventario me queda de la referencia 204?</div>'
 + '<div id="X-q2" class="q a">No tengo acceso a esa información. ¿Podrías darme más contexto? 🤔</div>'
 + '<div id="X-q3" class="q u">Otra vez te explico todo… 😩</div></div></div>'
 + ''.join(f'<div id="X-i{j + 1}" class="isl"><span>{icon(ic, "#fff")}</span>{t}</div>' for j, (ic, t) in enumerate([('people', 'Clientes'), ('box', 'Inventario'), ('route', 'Procesos')])),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-gc",{{y:900,opacity:0,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-q1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},.6);
tl.from(".isl",{{opacity:0,y:60,duration:.3,ease:"back.out(2)",stagger:.25}},{s + d * .15:.2f});
tl.from("#X-q2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .45:.2f});
tl.to(".isl",{{opacity:.35,duration:.4}},{s + d * .5:.2f});
tl.from("#X-q3",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .72:.2f});"""))
S.append(('b06', 'ty', .45, """
#X-t{top:190px;font-size:78px}
#X-p1{left:70px;top:470px}
#X-p2{left:570px;top:470px}
#X-plus{left:0;right:0;top:600px;text-align:center;font:800 90px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-p{left:250px;height:720px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CH() + '<h1 id="X-t" class="h g">IA <span class="mk">de verdad</span></h1>'
 + f'<div id="X-p1" class="pil"><i>{icon("cap")}</i><b>Formación por rol</b><small>Cada equipo, con lo que necesita</small></div>'
 + f'<div id="X-p2" class="pil"><i>{icon("sync")}</i><b>Integración</b><small>Con tus datos y tus flujos</small></div>'
 + '<p id="X-plus" class="abs">+</p><img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-p",{{y:700,duration:.6,ease:"power2.out"}},.3);
tl.from("#X-p1",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.6)"}},{s + d * .35:.2f});
tl.from("#X-plus",{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .55:.2f});
tl.from("#X-p2",{{opacity:0,x:300,duration:.4,ease:"back.out(1.6)"}},{s + d * .62:.2f});"""))
S.append(('b07', 'tl', .45, """
#X-t{top:190px;font-size:76px}
#X-src{left:330px;top:400px}
#X-hub{left:400px;top:600px;width:280px;height:280px;border-radius:50%;background:#1F1F1F;display:grid;place-items:center;box-shadow:0 0 0 18px rgba(255,193,7,.35)}
#X-hub b{font:800 64px/1 "Montserrat",sans-serif;color:#FFC107}
#X-ln{left:0;top:0;width:1080px;height:1920px}
#X-o1{left:60px;top:1000px}
#X-o2{left:560px;top:1000px}
#X-o3{left:290px;top:1180px}
""", CH() + '<h1 id="X-t" class="h g">Integrada <span class="mk">a tu operación</span></h1>'
 + '<svg id="X-ln" class="abs" viewBox="0 0 1080 1920"><g fill="none" stroke="#1F1F1F" stroke-width="8" stroke-linecap="round"><path class="X-w" d="M540 500 L540 600"/><path class="X-w" d="M480 860 L280 1000"/><path class="X-w" d="M600 860 L780 1000"/><path class="X-w" d="M540 880 L540 1180"/></g></svg>'
 + f'<div id="X-src" class="node"><i>{icon("folder")}</i>Tus datos</div>'
 + '<div id="X-hub" class="abs"><b>IA</b></div>'
 + f'<div id="X-o1" class="node ok2"><i>{icon("doc", "#fff")}</i>Informe listo</div>'
 + f'<div id="X-o2" class="node ok2"><i>{icon("chat", "#fff")}</i>Cliente atendido</div>'
 + f'<div id="X-o3" class="node ok2"><i>{icon("bell", "#fff")}</i>Dato a tiempo</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-src",{{opacity:0,y:-60,duration:.35,ease:"back.out(2)"}},.2);
tl.from("#X-hub",{{scale:0,duration:.45,ease:"back.out(2)"}},.4);
tl.to("#X-hub",{{scale:1.06,duration:.4,yoyo:true,repeat:{k(D, .9, .4)},ease:"sine.inOut"}},.9);
tl.fromTo(".X-w",{{strokeDasharray:400,strokeDashoffset:400}},{{strokeDashoffset:0,duration:.4,stagger:.15}},{s:.2f});
tl.from("#X-o1",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2)"}},{s + d * .12:.2f});
tl.from("#X-o2",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.from("#X-o3",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2)"}},{s + d * .65:.2f});"""))
SVC = [('compass', 'Consultoría', 'Diagnóstico y plan de IA'), ('cap', 'Capacitación por roles', 'Presencial y virtual'), ('code', 'Desarrollo a la medida', 'Soluciones propias integradas')]
S.append(('b08', 'tl', .45, """
#X-t{top:190px;font-size:70px}
#X-p{left:620px;height:900px}
""", CH() + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">Tu <span class="mk">aliado estratégico</span></h1>'
 + ''.join(f'<div class="svc X-s" style="top:{440 + i * 200}px"><i>{icon(ic, "#FFC107")}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, t, sm) in enumerate(SVC)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-s",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)",stagger:{d * .17:.2f}}},{s + d * .4:.2f});"""))
S.append(('b09', 'tl', 2.2, """
#X-t{top:180px;font-size:72px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:1000px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 40px/1.1 "Montserrat",sans-serif}
#X-by{left:560px;top:1180px;width:460px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:10px;height:1000px}
""", CH() + '<h1 id="X-t" class="h g">Antes de otra licencia,<br><span class="mk">hablemos</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalia.svg" alt=""><b>pascalia.lat</b></div><div id="X-demo" class="abs">Diseñemos tu plan de IA</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div><img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt="">',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .3:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .45:.2f});
tl.to("#X-demo",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .45 + .4, .35)},ease:"sine.inOut"}},{s + d * .45 + .4:.2f});
tl.from("#X-by",{{opacity:0,duration:.35}},{s + d * .8:.2f});"""))

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
