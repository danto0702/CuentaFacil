# Builds "Reel 2 · La fuga de prospectos": the hidden cost of leaving leads on "seen" after hours vs. a 24/7 AI agent.
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
.badge{position:absolute;display:grid;place-items:center;border-radius:999px;background:#25D366;color:#fff;font:800 40px/1 "Montserrat",sans-serif;padding:10px 22px;box-shadow:0 10px 24px -8px rgba(0,0,0,.5)}
.clockbig{position:absolute;left:0;right:0;text-align:center;font:800 120px/1 "Montserrat",sans-serif;letter-spacing:-.03em}
'''
EXTRA2 = EXTRA + CHAT_CSS
CH2 = lambda: '<div class="chip3"><span><img src="assets/brand/flower.svg" alt="">Historia PascalIA</span></div>'
def chat(id_, style, msgs, who='Cliente nuevo', sub='en línea'):
    return (f'<div id="{id_}" class="wa" style="{style}"><div class="top"><i></i><div>{who}<small>{sub}</small></div></div><div class="body">'
            + ''.join(f'<div id="{mid}" class="m{" me" if me else ""}">{t}<small>{h}</small></div>' for mid, me, t, h in msgs) + '</div></div>')

S = []
S.append(('a01', 'td', .3, '''
#X-day{top:230px;color:#FFC107}
#X-sub{top:370px;font:700 46px/1 "Montserrat",sans-serif;color:#CFCFCF}
#X-ad{left:70px;top:520px;padding:16px 26px;border-radius:999px;background:#2A2A2A;color:#fff;font:800 32px/1 "Montserrat",sans-serif}
''', CH2() + '<p id="X-day" class="clockbig">11:07 p. m.</p><p id="X-sub" class="h">Sábado</p><div id="X-ad" class="abs" style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:40px;display:inline-block">'+icon("megaphone", "#FFC107")+'</span>Publicidad activa</div>'
 + chat('X-ph', 'left:200px;top:640px;width:680px', [('X-m1', False, 'Hola 👋 ¿Qué precio tiene? ¿Tienen cita para el lunes?', '11:07 p. m.')]),
 lambda D, s, d: f'''tl.from("#X-day",{{opacity:0,scale:1.4,duration:.4,ease:"back.out(1.6)"}},0);
tl.from("#X-sub",{{opacity:0,y:20,duration:.3}},.2);
tl.from("#X-ad",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},.4);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},{s + d * .4:.2f});
tl.from("#X-m1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .75:.2f});'''))
S.append(('a02', 'td', .5, '''
#X-t{top:240px;font-size:110px}
''', CH2() + '<h1 id="X-t" class="h w">Nadie le<br><span class="red">respondió</span></h1>'
 + chat('X-ph', 'left:200px;top:640px;width:680px', [('X-m1', False, 'Hola 👋 ¿Qué precio tiene? ¿Tienen cita para el lunes?', '11:07 p. m.'), ('X-m2', False, '¿Hola? 😕', 'domingo 9:40 a. m.')]),
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .6:.2f});
tl.to("#X-ph",{{x:8,duration:.06,yoyo:true,repeat:5,ease:"none"}},{s + d * .7:.2f});'''))
S.append(('a03', 'td', .35, '''
#X-day{top:220px;color:#fff}
#X-sub{top:350px;font:700 46px/1 "Montserrat",sans-serif;color:#CFCFCF}
#X-c{left:420px;height:900px}
#X-b{left:180px;top:620px}
#X-n{font-variant-numeric:tabular-nums}
.X-ic{position:absolute;width:120px;height:120px;border-radius:30px;background:#25D366;padding:26px}
''', CH2() + '<p id="X-day" class="clockbig">8:00 a. m.</p><p id="X-sub" class="h">Lunes</p>'
 + ''.join(f'<div class="X-ic" style="left:{x}px;top:{y}px">{icon("whatsapp", "#fff")}</div>' for x, y in [(80, 480), (860, 520), (120, 820), (840, 860)])
 + '<div id="X-b" class="badge"><span id="X-n">0</span>&nbsp;sin leer</div><img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-day",{{opacity:0,scale:1.4,duration:.4,ease:"back.out(1.6)"}},0);
tl.from("#X-sub",{{opacity:0,y:20,duration:.3}},.2);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.3);
tl.from(".X-ic",{{scale:0,rotation:-30,duration:.3,ease:"back.out(2.5)",stagger:.12}},{s + d * .4:.2f});
tl.from("#X-b",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .55:.2f});
const X_n={{v:0}};
tl.to(X_n,{{v:37,duration:1.2,ease:"power2.out",onUpdate:()=>{{document.querySelector("#X-n").textContent=Math.round(X_n.v);}}}},{s + d * .55:.2f});
tl.to("#X-c",{{x:8,duration:.07,yoyo:true,repeat:{k(D, s + d * .6, .07)},ease:"none"}},{s + d * .6:.2f});'''))
S.append(('a04', 'td', .45, '''
#X-t{top:200px;font-size:84px}
#X-ice{left:820px;top:500px;width:170px;height:170px;border-radius:50%;background:#38BDF8;display:grid;place-items:center;font:800 90px/1 "Montserrat",sans-serif;color:#fff}
''', CH2() + '<h1 id="X-t" class="h w">Ya es <span class="red">tarde</span></h1>'
 + chat('X-ph', 'left:120px;top:480px;width:700px', [('X-m1', False, 'Hola 👋 ¿Qué precio tiene? ¿Tienen cita para el lunes?', 'sábado 11:07 p. m.'), ('X-m2', True, '¡Hola! Disculpa la demora 🙏 El precio es…', 'lunes 8:15 a. m. <b>✓✓</b>'), ('X-m3', False, 'Gracias, ya conseguí en otro lado.', '8:16 a. m.')])
 + '<div id="X-ice" class="abs" style="font-size:34px">FRÍO</div>',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .4:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .1:.2f});
tl.from("#X-m3",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from("#X-ice",{{scale:0,rotation:-90,duration:.4,ease:"back.out(2.2)"}},{s + d * .5:.2f});'''))
S.append(('a05', 'td', .5, '''
#X-t{top:170px;font-size:86px}
#X-fun{left:290px;top:520px;width:500px}
.X-cash{position:absolute;width:110px;height:64px;border-radius:12px;background:#25A55F;color:#fff;display:grid;place-items:center;font:800 34px/1 "Montserrat",sans-serif;box-shadow:0 8px 16px rgba(0,0,0,.4)}
#X-lbl{top:1130px;font-size:64px}
''', CH2() + '<h1 id="X-t" class="h w">El costo <span class="yy">oculto</span></h1>'
 + '<svg id="X-fun" class="abs" viewBox="0 0 500 520"><path d="M20 20 L480 20 L300 300 L300 480 L200 480 L200 300 Z" fill="#2A2A2A" stroke="#FFC107" stroke-width="8" stroke-linejoin="round"/><circle cx="120" cy="210" r="26" fill="#0B0B0B" stroke="#FF5A5A" stroke-width="6"/><circle cx="380" cy="210" r="26" fill="#0B0B0B" stroke="#FF5A5A" stroke-width="6"/><text x="250" y="110" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="40" fill="#fff">Publicidad</text></svg>'
 + ''.join(f'<div class="X-cash" style="left:{x}px;top:{y}px">$</div>' for x, y in [(400, 360), (520, 330), (460, 300)])
 + ''.join(f'<div class="X-leak" style="position:absolute;left:{x}px;top:700px;width:90px;height:52px;border-radius:10px;background:#25A55F;color:#fff;display:grid;place-items:center;font:800 30px Montserrat">$</div>' for x in (330, 650))
 + '<h2 id="X-lbl" class="h w">Clientes <span class="red">en visto</span> = plata perdida</h2>',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-fun",{{scale:.6,opacity:0,duration:.4,ease:"back.out(1.6)"}},.15);
tl.from(".X-cash",{{y:-500,opacity:0,duration:.5,ease:"power2.in",stagger:.2}},.4);
tl.fromTo(".X-leak",{{y:0,opacity:1}},{{y:600,x:"+=60",rotation:90,opacity:0,duration:1.2,ease:"power2.in",stagger:.3,repeat:{max(1, int((D - 1.5) / 1.5))},repeatDelay:.3}},1.0);
tl.from("#X-lbl",{{opacity:0,y:30,duration:.4,ease:"back.out(1.8)"}},{s + d * .55:.2f});'''))
S.append(('a06', 'ty', .35, '''
#X-t{top:200px;font-size:84px}
#X-ag{left:80px;top:520px;width:500px;padding:30px;border-radius:34px;background:#fff;box-shadow:0 24px 50px -24px rgba(31,31,31,.35)}
#X-ag b{display:flex;align-items:center;gap:14px;font:800 40px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-ag b i{width:70px;height:70px;border-radius:50%;background:#FFC107;padding:14px;flex:none}
#X-ag p{display:flex;align-items:center;gap:12px;margin-top:16px;font:700 30px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
#X-ag p span{width:36px;height:36px;border-radius:50%;background:#25A55F;padding:7px;flex:none}
#X-p{left:560px;height:1040px}
#X-flash{inset:0;background:#fff;opacity:0}
''', CH() + '<h1 id="X-t" class="h g">Un agente de IA<br><span style="background:#1F1F1F;color:#FFC107;padding:0 .2em;border-radius:14px">24/7</span></h1>'
 + f'<div id="X-ag" class="abs"><b><i>{icon("chat")}</i>Agente de tu negocio</b>' + ''.join(f'<p class="X-li"><span>{icon("check", "#fff")}</span>{t}</p>' for t in ['Tus precios', 'Tus horarios', 'Tus servicios', 'Tu agenda']) + '</div>'
 + '<img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f'''tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-p",{{x:600,duration:.6,ease:"power2.out"}},.2);
tl.from("#X-ag",{{opacity:0,scale:.8,duration:.4,ease:"back.out(1.8)"}},{s + d * .5:.2f});
tl.from(".X-li",{{opacity:0,x:-40,duration:.25,stagger:.18}},{s + d * .62:.2f});'''))
S.append(('a07', 'tl', .45, '''
#X-day{top:200px;color:#1F1F1F;font-size:96px}
#X-cal{left:600px;top:1180px;width:420px;padding:22px;border-radius:26px;background:#fff;box-shadow:inset 0 0 0 3px #25A55F,0 20px 40px -18px rgba(31,31,31,.35);font:800 32px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
#X-cal small{display:block;font:600 24px/1.2 "Inter",sans-serif;color:#1E7B45}
#X-sec{left:70px;top:1210px;padding:16px 26px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif}
''', CH() + '<p id="X-day" class="clockbig">Sábado 11:07 p. m.</p>'
 + chat('X-ph', 'left:140px;top:350px;width:800px', [('X-m1', False, 'Hola 👋 ¿Qué precio tiene? ¿Tienen cita para el lunes?', '11:07 p. m.'), ('X-m2', True, '¡Hola! 😊 La consulta cuesta $ 80.000. Atendemos de lunes a sábado, 8 a. m. a 6 p. m.', '11:07 p. m. <b>✓✓</b>'), ('X-m3', True, 'Tengo disponible el lunes a las 9:00 a. m. ¿Te la agendo?', '11:07 p. m. <b>✓✓</b>'), ('X-m4', False, '¡Sí, por favor!', '11:08 p. m.')], 'Tu negocio', 'responde al instante')
 + '<div id="X-sec" class="abs">En segundos</div><div id="X-cal" class="abs">Cita agendada<small>Lunes · 9:00 a. m.</small></div>',
 lambda D, s, d: f'''tl.from("#X-day",{{opacity:0,y:-30,duration:.35}},0);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.1);
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .28:.2f});
tl.from("#X-sec",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .3:.2f});
tl.from("#X-m3",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from("#X-m4",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .72:.2f});
tl.from("#X-cal",{{scale:0,rotation:-8,duration:.4,ease:"back.out(2.2)"}},{s + d * .82:.2f});'''))
CITAS = [('9:00', 'Consulta · confirmada'), ('10:30', 'Valoración · confirmada'), ('11:15', 'Consulta · confirmada'), ('2:00', 'Seguimiento · confirmada')]
S.append(('a08', 'tl', .45, '''
#X-t{top:190px;font-size:74px}
#X-ag{left:70px;top:430px;width:560px;border-radius:30px;background:#fff;overflow:hidden;box-shadow:0 24px 50px -24px rgba(31,31,31,.35)}
#X-ag h3{padding:20px 24px;background:#1F1F1F;color:#FFC107;font:800 32px/1 "Montserrat",sans-serif;margin:0}
#X-ag p{display:flex;gap:16px;align-items:center;padding:18px 24px;border-top:2px solid #EFEFEF;font:700 28px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
#X-ag p b{flex:none;width:96px;color:#1E7B45}
#X-c{left:600px;height:860px}
''', CH() + '<h1 id="X-t" class="h g">Lunes: <span class="mk">citas confirmadas</span></h1>'
 + '<div id="X-ag" class="abs"><h3>Agenda del lunes</h3>' + ''.join(f'<p class="X-r"><b>{h}</b>{t}</p>' for h, t in CITAS) + '</div><img id="X-c" class="ch" src="assets/chars/contratista-alivio.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-ag",{{opacity:0,x:-300,duration:.45,ease:"back.out(1.5)"}},.15);
tl.from(".X-r",{{opacity:0,x:-40,duration:.25,stagger:.2}},.4);
tl.from("#X-c",{{y:600,duration:.5,ease:"back.out(1.3)"}},{s + d * .4:.2f});'''))
S.append(('a09', 'tl', 2.2, '''
#X-t{top:180px;font-size:80px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:1000px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 42px/1.1 "Montserrat",sans-serif}
#X-by{left:560px;top:1160px;width:460px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:10px;height:1000px}
''', CH() + '<h1 id="X-t" class="h g">Que tu negocio<br>atienda <span class="mk">24/7</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-whatsapp.svg" alt=""><b>312 388 5012</b></div><div id="X-demo" class="abs">Pide tu demostración</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div><img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt="">',
 lambda D, s, d: f'''tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .35:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .45:.2f});
tl.to("#X-demo",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .45 + .4, .35)},ease:"sine.inOut"}},{s + d * .45 + .4:.2f});
tl.from("#X-by",{{opacity:0,duration:.35}},{s + d * .8:.2f});'''))

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
