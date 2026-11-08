# Builds "Reel 5 · 3 ingredientes para que tu asistente de IA venda por WhatsApp": brand voice, live catalog/agenda, human handoff.
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

S = []
S.append(('d01', 'td', .4, """
#X-t{top:200px;font-size:68px}
#X-ph{left:90px;top:440px;width:900px}
#X-x{left:465px;top:1330px;width:150px;height:150px;border-radius:50%;background:#E5484D;display:grid;place-items:center;font:800 100px/1 "Montserrat",sans-serif;color:#fff}
""", CHT('Consejo PascalIA') + '<h1 id="X-t" class="h w">¿Bots que <span class="red">desesperan</span>?</h1>'
 + chat('X-ph', 'left:90px;top:440px;width:900px', [
   ('X-m1', True, '🤖 Marque 1 para ventas<br>Marque 2 para soporte<br>Marque 3 para facturación<br>…<br>Marque 9 para hablar con un humano', '10:02 a. m. <b>✓✓</b>'),
   ('X-m2', False, 'Quiero saber si tienen la talla M', '10:03 a. m.'),
   ('X-m3', True, '🤖 Opción no válida. Marque 1 para ventas…', '10:03 a. m. <b>✓✓</b>'),
   ('X-m4', False, '9', '10:03 a. m.'),
   ('X-m5', True, '🤖 Todos nuestros asesores están ocupados.', '10:04 a. m. <b>✓✓</b>')], 'Tienda Ejemplo', 'bot automático')
 + '<div id="X-x" class="abs">✕</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:900,opacity:0,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-m1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .05:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .35:.2f});
tl.from("#X-m3",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .5:.2f});
tl.from("#X-m4",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .62:.2f});
tl.from("#X-m5",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .74:.2f});
tl.from("#X-x",{{scale:0,rotation:-90,duration:.4,ease:"back.out(2.2)"}},{s + d * .86:.2f});"""))
ING = [('mic', 'Tu tono de voz', 'Habla como tu marca'), ('sync', 'Conexión en tiempo real', 'Catálogo y agenda al día'), ('people', 'Pase a un humano', 'En el momento justo')]
S.append(('d02', 'td', .4, """
#X-t{top:200px;font-size:74px}
#X-bw{left:390px;top:1130px;width:300px;height:300px}
""", CHT('Consejo PascalIA') + '<h1 id="X-t" class="h w">La receta: <span class="yy">3 ingredientes</span></h1>'
 + ''.join(f'<div class="ing X-i" style="top:{460 + i * 200}px"><i>{icon(ic)}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, t, sm) in enumerate(ING))
 + f'<div id="X-bw" class="abs" style="border-radius:50%;background:#FFC107;padding:70px">{icon("bowl")}</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .1:.2f});
tl.from("#X-bw",{{scale:0,rotation:-60,duration:.45,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from(".X-i",{{opacity:0,x:-400,duration:.35,ease:"back.out(1.5)",stagger:.25}},{s + d * .68:.2f});"""))
S.append(('d03', 'ty', .4, """
#X-t{top:180px;font-size:68px;left:200px;right:70px;text-align:left}
#X-n{left:70px;top:170px}
#X-a{top:470px;background:#2A2A2A;color:#BDBDBD}
#X-a p{color:#E0E0E0}
#X-b{top:850px;background:#fff;box-shadow:inset 0 0 0 4px #25A55F,0 24px 50px -24px rgba(31,31,31,.4)}
#X-b p{color:#1F1F1F}
#X-ta{left:90px;top:440px;background:#E5484D;color:#fff}
#X-tb{left:90px;top:820px;background:#25A55F;color:#fff}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHT('Ingrediente 1 · Tu tono') + '<h1 id="X-t" class="h g">Habla como<br><span class="mk">tu marca</span></h1><div id="X-n" class="num">1</div>'
 + '<div id="X-a" class="cmp"><p>Estimado usuario: su solicitud ha sido recibida. Será atendida en orden de llegada.</p></div><div id="X-ta" class="tag">Bot rígido</div>'
 + '<div id="X-b" class="cmp"><p>¡Hola, Laura! 😊 Claro que sí, esa chaqueta te va a encantar. ¿La quieres en negro o en beige?</p></div><div id="X-tb" class="tag">Con el tono de tu marca</div>'
 + '<div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},.1);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.15);
tl.from("#X-a",{{opacity:0,y:60,duration:.35}},{s + d * .2:.2f});
tl.from("#X-ta",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .25:.2f});
tl.to("#X-a",{{opacity:.55,duration:.3}},{s + d * .5:.2f});
tl.from("#X-b",{{opacity:0,y:80,scale:.9,duration:.4,ease:"back.out(1.7)"}},{s + d * .5:.2f});
tl.from("#X-tb",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .56:.2f});"""))
STOCK = [('Chaqueta · S · negro', '2'), ('Chaqueta · M · negro', '3'), ('Chaqueta · M · beige', '0')]
S.append(('d04', 'tl', .4, """
#X-t{top:180px;font-size:66px;left:200px;right:70px;text-align:left}
#X-n{left:70px;top:170px}
#X-cat{left:70px;top:420px;width:540px}
#X-ag{left:640px;top:420px;width:370px}
#X-sync{left:575px;top:685px;width:110px;height:110px;border-radius:50%;background:#25D366;padding:26px;box-shadow:0 12px 24px -10px rgba(0,0,0,.4)}
""", CHT('Ingrediente 2 · Tiempo real') + '<h1 id="X-t" class="h g">Datos reales,<br><span class="mk">al instante</span></h1><div id="X-n" class="num">2</div>'
 + '<div id="X-cat" class="card"><h3>Catálogo<em>EN VIVO</em></h3>' + ''.join(f'<p class="{"hit X-hit" if j == 1 else ""}"><span>{a}</span><b>{b}</b></p>' for j, (a, b) in enumerate(STOCK)) + '</div>'
 + '<div id="X-ag" class="card"><h3>Agenda</h3><p><span>Mar · 9:00</span><b>Libre</b></p><p><span>Mar · 10:30</span><span>Ocupado</span></p></div>'
 + f'<div id="X-sync" class="abs">{icon("sync", "#fff")}</div>'
 + chat('X-ph', 'left:110px;top:800px;width:860px', [
   ('X-m1', False, '¿Tienen la chaqueta en talla M, color negro?', '7:41 p. m.'),
   ('X-m2', True, '¡Sí! 🖤 Nos quedan 3 en talla M negra. ¿Te aparto una?', '7:41 p. m. <b>✓✓</b>')], 'Tu negocio', 'responde al instante'),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.1);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-m1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.from("#X-cat",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},{s + d * .5:.2f});
tl.from("#X-ag",{{opacity:0,x:300,duration:.4,ease:"back.out(1.5)"}},{s + d * .55:.2f});
tl.from("#X-sync",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .6:.2f});
tl.to("#X-sync",{{rotation:360,duration:1,repeat:{max(0, int((D - (s + d * .6) - .3) / 1) - 1)},ease:"none"}},{s + d * .6 + .3:.2f});
tl.fromTo(".X-hit",{{background:"#FFFFFF"}},{{background:"#FFE38A",duration:.3,yoyo:true,repeat:3}},{s + d * .7:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .82:.2f});"""))
S.append(('d05', 'tl', .4, """
#X-t{top:180px;font-size:66px;left:200px;right:70px;text-align:left}
#X-n{left:70px;top:170px}
#X-ho{left:70px;top:1000px;width:600px}
#X-c{left:620px;height:780px}
""", CHT('Ingrediente 3 · Pase a humano') + '<img id="X-c" class="ch" src="assets/chars/contratista-alivio.webp" alt=""><h1 id="X-t" class="h g">Sabe cuándo<br><span class="mk">pasar el chat</span></h1><div id="X-n" class="num">3</div>'
 + chat('X-ph', 'left:110px;top:420px;width:860px', [
   ('X-m1', False, 'Perfecto, la quiero. ¿Cómo pago? 🙌', '7:43 p. m.'),
   ('X-m2', True, '¡Genial! Te paso con Andrés, de nuestro equipo, para cerrar tu pedido 🤝', '7:43 p. m. <b>✓✓</b>')], 'Tu negocio', 'en línea')
 + '<div id="X-ho" class="ho"><b>Andrés · Asesor</b><small>Recibe el chat con todo el contexto</small><ul><li>Chaqueta talla M, negro</li><li>Una unidad apartada</li><li>Listo para pagar</li></ul></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.1);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-m1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .6:.2f});
tl.from("#X-ho",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},{s + d * .7:.2f});
tl.from("#X-ho li",{{opacity:0,x:-30,duration:.22,stagger:.15}},{s + d * .78:.2f});"""))
S.append(('d06', 'tl', .5, """
#X-t{top:190px;font-size:72px}
#X-a{left:70px;top:520px;background:#2A2A2A;color:#BDBDBD}
#X-a i{background:#E5484D}
#X-a b{color:#fff}
#X-b{left:570px;top:520px;background:#fff;color:#5C5C5C;box-shadow:inset 0 0 0 4px #25A55F,0 24px 50px -24px rgba(31,31,31,.35)}
#X-b i{background:#25A55F}
#X-b b{color:#1F1F1F}
#X-s{left:70px;top:520px;width:440px;height:330px}
#X-p{left:300px;height:760px}
""", CHT('Consejo PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><h1 id="X-t" class="h g">Habla con <span class="mk">tu negocio</span></h1>'
 + f'<div id="X-a" class="vs"><i>{icon("list-check", "#fff")}</i><b>Un menú</b><small>Marque 1, marque 2…</small></div>'
 + f'<div id="X-b" class="vs"><i>{icon("chat", "#fff")}</i><b>Una conversación</b><small>Tono, datos y un humano a tiempo</small></div>'
 + '<svg id="X-s" class="abs" viewBox="0 0 440 330"><path id="X-sl" d="M40 40 L400 290" stroke="#E5484D" stroke-width="16" stroke-linecap="round"/></svg>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-a",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},.2);
tl.fromTo("#X-sl",{{strokeDasharray:460,strokeDashoffset:460}},{{strokeDashoffset:0,duration:.35,ease:"power2.in"}},{s + d * .55:.2f});
tl.from("#X-b",{{opacity:0,x:300,duration:.4,ease:"back.out(1.5)"}},{s + d * .3:.2f});
tl.to("#X-b",{{scale:1.05,duration:.35,yoyo:true,repeat:1,ease:"sine.inOut"}},{s + d * .75:.2f});
tl.from("#X-p",{{y:700,duration:.5,ease:"back.out(1.2)"}},{s + d * .4:.2f});"""))
QS = ['¿Responde en segundos?', '¿Suena a tu marca?', '¿Conoce tu catálogo y agenda?', '¿Te pasa a un humano a tiempo?']
S.append(('d07', 'td', .5, """
#X-t{top:190px;font-size:70px}
#X-p{left:640px;height:860px}
.X-q{background:#fff}
.X-q i{box-shadow:inset 0 0 0 4px #1F1F1F}
""", CHT('Haz la prueba') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h w">Evalúa <span class="yy">tu chat</span> hoy</h1>'
 + ''.join(f'<div class="q5 X-q" style="top:{430 + i * 150}px;width:720px"><i></i>{q}</div>' for i, q in enumerate(QS)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-q",{{opacity:0,x:-300,duration:.32,ease:"back.out(1.6)",stagger:{d * .14:.2f}}},{s + d * .3:.2f});"""))
S.append(('d08', 'tl', 2.4, """
#X-t{top:170px;font-size:68px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:1000px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif}
#X-by{left:560px;top:1190px;width:460px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:10px;height:1000px}
""", CHT('Consejo PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">¿Cómo sonaría<br><span class="mk">tu asistente</span>?</h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalia.svg" alt=""><b>pascalia.lat</b></div><div id="X-demo" class="abs">Pide tu prueba con la voz de tu marca</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .2:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.to("#X-demo",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .4 + .4, .35)},ease:"sine.inOut"}},{s + d * .4 + .4:.2f});
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
