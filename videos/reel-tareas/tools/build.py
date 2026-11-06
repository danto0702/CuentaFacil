# Builds "Reel 4 · 3 tareas que tu oficina puede delegar hoy a la IA": document extraction, request triage, data cross-checks; asks viewers to comment 1, 2 or 3.
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
.num{position:absolute;width:150px;height:150px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 96px/1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 18px 36px -14px rgba(0,0,0,.55)}
.tk3{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:26px;padding:26px 30px;border-radius:30px;background:#fff;box-shadow:0 24px 50px -24px rgba(0,0,0,.55)}
.tk3 .n{flex:none;width:100px;height:100px;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 58px/1 "Montserrat",sans-serif;color:#1F1F1F}
.tk3 b{display:block;font:800 44px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
.tk3 small{display:block;margin-top:6px;font:600 27px/1.2 "Inter",sans-serif;color:#5C5C5C}
.pg{position:absolute;width:300px;height:400px;border-radius:18px;background:#fff;padding:30px 26px;box-shadow:0 20px 40px -18px rgba(0,0,0,.6)}
.pg b{display:block;font:800 26px/1.1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:18px}
.pg i{display:block;height:14px;border-radius:7px;background:#DADADA;margin-bottom:16px}
.pg i.hl{background:#FFC107}
.grid{position:absolute;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 24px 50px -20px rgba(0,0,0,.55)}
.grid .hd{background:#1E7B45;color:#fff;font:800 28px/1 "Montserrat",sans-serif;padding:16px 20px}
.grid .r{display:grid;border-top:2px solid #E5E5E5;font:600 26px/1 "Inter",sans-serif;color:#1F1F1F}
.grid .r span{padding:16px 14px;border-left:2px solid #E5E5E5;white-space:nowrap;overflow:hidden}
.grid .r span:first-child{border-left:0}
.grid .r.th{background:#F2F7F4;font-weight:800}
.mail{position:absolute;left:110px;width:860px;display:flex;align-items:center;gap:20px;padding:20px 24px;border-radius:22px;background:#fff;box-shadow:0 16px 34px -16px rgba(0,0,0,.55)}
.mail i{flex:none;width:64px;height:64px;border-radius:50%;background:#E8E8E8;padding:14px}
.mail b{display:block;font:800 28px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.mail small{display:block;margin-top:4px;font:600 24px/1.2 "Inter",sans-serif;color:#5C5C5C}
.mail em{margin-left:auto;font:700 22px/1 "Inter",sans-serif;color:#757575;font-style:normal}
.bin{position:absolute;width:300px;padding:22px 16px;border-radius:26px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #F3E7BE,0 20px 40px -20px rgba(31,31,31,.35)}
.bin i{display:block;margin:0 auto 12px;width:80px;height:80px;border-radius:50%;background:#FFC107;padding:18px}
.bin b{display:block;font:800 30px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.bin small{display:block;margin-top:8px;font:800 26px/1 "Montserrat",sans-serif;color:#1E7B45}
.file{position:absolute;width:280px;padding:22px;border-radius:22px;background:#fff;box-shadow:0 20px 40px -18px rgba(0,0,0,.55);font:800 30px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.file i{display:block;width:70px;height:70px;border-radius:18px;background:#1E7B45;padding:15px;margin-bottom:14px}
.file small{display:block;margin-top:6px;font:600 22px/1 "Inter",sans-serif;color:#5C5C5C}
.rep{position:absolute;border-radius:30px;background:#fff;padding:28px 30px;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
.rep h3{margin:0 0 6px;font:800 40px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.rep .sub{font:600 24px/1.2 "Inter",sans-serif;color:#5C5C5C}
.opt{position:absolute;left:70px;width:620px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 20px 40px -20px rgba(31,31,31,.35)}
.opt .n{flex:none;width:92px;height:92px;border-radius:50%;background:#1F1F1F;display:grid;place-items:center;font:800 54px/1 "Montserrat",sans-serif;color:#FFC107}
.opt b{font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
"""

S = []
S.append(('c01', 'td', .35, """
#X-t{top:200px;font-size:76px}
#X-clk{left:110px;top:520px;width:420px;height:420px}
#X-q{left:560px;top:600px;width:440px;font:800 64px/1.1 "Montserrat",sans-serif;color:#fff}
#X-q b{color:#FFC107}
#X-c{left:520px;height:760px}
""", CHT('Pregunta PascalIA') + '<img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt=""><h1 id="X-t" class="h w">¿Cuántas <span class="yy">horas</span><br>a la semana?</h1>'
 + '<svg id="X-clk" class="abs" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#262626" stroke="#FFC107" stroke-width="10"/>'
 + ''.join(f'<rect x="97" y="18" width="6" height="16" rx="3" fill="#8A8A8A" transform="rotate({a} 100 100)"/>' for a in range(0, 360, 30))
 + '<rect id="X-hh" x="96" y="52" width="8" height="52" rx="4" fill="#fff"/><rect id="X-mh" x="97" y="30" width="6" height="74" rx="3" fill="#FFC107"/><circle cx="100" cy="100" r="9" fill="#FFC107"/></svg>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-clk",{{scale:0,rotation:-90,duration:.5,ease:"back.out(1.6)"}},.2);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.35);
tl.fromTo("#X-mh",{{rotation:0,svgOrigin:"100 100"}},{{rotation:{360 * 6},svgOrigin:"100 100",duration:{D - .6:.2f},ease:"none"}},.5);
tl.fromTo("#X-hh",{{rotation:0,svgOrigin:"100 100"}},{{rotation:180,svgOrigin:"100 100",duration:{D - .6:.2f},ease:"none"}},.5);"""))
T3 = [('Extraer datos', 'De documentos largos a tablas'), ('Clasificar y responder', 'Solicitudes frecuentes'), ('Cruzar bases de datos', 'Para informes de gestión')]
S.append(('c02', 'td', .4, """
#X-t{top:200px;font-size:76px}
""", CHT('Pregunta PascalIA') + '<h1 id="X-t" class="h w"><span class="yy">3 tareas</span> para<br>delegar hoy</h1>'
 + ''.join(f'<div class="tk3 X-k" style="top:{500 + i * 210}px"><span class="n">{i + 1}</span><div><b>{t}</b><small>{sm}</small></div></div>' for i, (t, sm) in enumerate(T3)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},0);
tl.from(".X-k",{{opacity:0,x:-400,duration:.38,ease:"back.out(1.5)",stagger:{d * .2:.2f}}},{s + d * .3:.2f});"""))
S.append(('c03', 'td', .35, """
#X-t{top:200px;font-size:70px}
#X-n{left:70px;top:180px;width:110px;height:110px;font-size:66px}
.X-pg{left:110px}
#X-xl{left:470px;top:560px;width:540px}
#X-xl .r{grid-template-columns:1fr 1fr}
#X-c{left:-60px;top:auto;height:720px}
""", CHT('Tarea 1 · Extraer datos') + '<img id="X-c" class="ch" src="assets/chars/contratista-nervioso.webp" alt="">'
 + '<h1 id="X-t" class="h w" style="left:200px;right:70px;text-align:left">Documentos<br><span class="yy">largos</span></h1><div id="X-n" class="num">1</div>'
 + ''.join(f'<div class="pg X-pg" style="top:{520 + i * 22}px;left:{110 + i * 22}px"><b>{t}</b>' + '<i></i>' * 9 + '</div>' for i, t in enumerate(['Factura', 'Informe', 'Contrato · 100 págs.']))
 + '<div id="X-xl" class="grid"><div class="hd">Excel · copiar a mano</div><div class="r th"><span>Dato</span><span>Valor</span></div>'
 + ''.join(f'<div class="r"><span>{a}</span><span class="X-v">{b}</span></div>' for a, b in [('Proveedor', '…'), ('Valor', '…'), ('Vence', '…'), ('Plazo', '…')]) + '</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.1);
tl.from(".X-pg",{{opacity:0,y:300,rotation:-6,duration:.4,ease:"back.out(1.4)",stagger:.25}},{s + d * .15:.2f});
tl.from("#X-xl",{{opacity:0,x:300,duration:.4,ease:"back.out(1.5)"}},{s + d * .6:.2f});
tl.from("#X-c",{{y:600,duration:.5,ease:"back.out(1.3)"}},{s + d * .7:.2f});
tl.to("#X-c",{{x:6,duration:.07,yoyo:true,repeat:{k(D, s + d * .85, .07)},ease:"none"}},{s + d * .85:.2f});"""))
ROWS = [('Proveedor', 'Insumos ABC'), ('Valor', '$ 4.250.000'), ('Vence', '30 nov. 2026'), ('Plazo', '6 meses')]
S.append(('c04', 'ty', .4, """
#X-t{top:190px;font-size:72px}
#X-pg{left:70px;top:520px}
#X-ar{left:400px;top:640px;width:120px;height:120px}
#X-xl{left:500px;top:520px;width:520px}
#X-xl .r{grid-template-columns:.9fr 1.1fr}
#X-ok{left:500px;top:960px;padding:16px 26px;border-radius:999px;background:#1E7B45;color:#fff;font:800 32px/1 "Montserrat",sans-serif}
#X-p{left:120px;height:760px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHT('Tarea 1 · Con IA') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt="">'
 + '<h1 id="X-t" class="h g">Del documento<br><span class="mk">a la tabla</span></h1>'
 + '<div id="X-pg" class="pg"><b>Contrato · 100 págs.</b>' + ''.join('<i class="X-hl"></i>' if j in (1, 4, 6, 8) else '<i></i>' for j in range(9)) + '</div>'
 + '<svg id="X-ar" class="abs" viewBox="0 0 24 24" fill="none" stroke="#1F1F1F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
 + '<div id="X-xl" class="grid"><div class="hd">Tabla lista</div><div class="r th"><span>Dato</span><span>Valor</span></div>'
 + ''.join(f'<div class="r X-r"><span>{a}</span><span>{b}</span></div>' for a, b in ROWS) + '</div>'
 + '<div id="X-ok" class="abs">✓ En segundos</div><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-pg",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},.3);
tl.from("#X-p",{{y:700,duration:.5,ease:"back.out(1.2)"}},.4);
tl.fromTo(".X-hl",{{background:"#DADADA"}},{{background:"#FFC107",duration:.2,stagger:.2}},{s + d * .2:.2f});
tl.from("#X-ar",{{opacity:0,x:-40,duration:.3}},{s + d * .45:.2f});
tl.from("#X-xl",{{opacity:0,scale:.7,duration:.4,ease:"back.out(1.7)"}},{s + d * .5:.2f});
tl.from(".X-r",{{opacity:0,x:40,duration:.22,stagger:.15}},{s + d * .6:.2f});
tl.from("#X-ok",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.2)"}},{s + d * .85:.2f});"""))
MAILS = [('¿Cómo pido un certificado laboral?', 'Talento humano'), ('¿En qué va mi solicitud?', 'Atención'), ('¿Cómo pido un certificado laboral?', 'Talento humano'), ('Necesito copia de mi factura', 'Facturación'), ('¿En qué va mi solicitud?', 'Atención')]
S.append(('c05', 'td', .35, """
#X-t{top:200px;font-size:70px;left:200px;right:70px;text-align:left}
#X-n{left:70px;top:180px;width:110px;height:110px;font-size:66px}
#X-cnt{left:760px;top:420px;padding:12px 24px;border-radius:999px;background:#E5484D;color:#fff;font:800 34px/1 "Montserrat",sans-serif}
""", CHT('Tarea 2 · Solicitudes') + '<h1 id="X-t" class="h w">Las mismas<br><span class="yy">preguntas</span></h1><div id="X-n" class="num">2</div>'
 + '<div id="X-cnt" class="abs">Bandeja · sin responder</div>'
 + ''.join(f'<div class="mail X-m" style="top:{500 + i * 135}px"><i>{icon("user", "#757575")}</i><div><b>{q}</b><small>Correo entrante</small></div><em>{h}</em></div>' for i, ((q, _), h) in enumerate(zip(MAILS, ['8:02', '8:05', '8:11', '8:20', '8:26']))),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.1);
tl.from(".X-m",{{opacity:0,y:-80,duration:.3,ease:"back.out(1.8)",stagger:{d * .14:.2f}}},{s + d * .1:.2f});
tl.from("#X-cnt",{{scale:0,duration:.3,ease:"back.out(2.5)"}},{s + d * .4:.2f});
tl.to("#X-cnt",{{scale:1.1,duration:.3,yoyo:true,repeat:{k(D, s + d * .5, .3)},ease:"sine.inOut"}},{s + d * .5:.2f});"""))
BINS = [('people', 'Talento humano'), ('chat', 'Atención'), ('money', 'Facturación')]
S.append(('c06', 'tl', .4, """
#X-t{top:190px;font-size:70px}
#X-in{left:240px;top:440px;width:600px}
#X-dr{left:70px;top:900px;width:940px;padding:26px 30px;border-radius:28px;background:#1F1F1F;color:#fff}
#X-dr b{display:block;font:800 30px/1 "Montserrat",sans-serif;color:#FFC107}
#X-dr p{margin-top:12px;font:500 28px/1.35 "Inter",sans-serif}
#X-dr small{display:inline-block;margin-top:16px;padding:10px 18px;border-radius:999px;background:#FFC107;color:#1F1F1F;font:800 24px/1 "Montserrat",sans-serif}
""", CHT('Tarea 2 · Con IA') + '<h1 id="X-t" class="h g">Clasifica, enruta<br>y <span class="mk">redacta</span></h1>'
 + '<div id="X-in" class="mail" style="left:240px;width:600px"><i>' + icon("user", "#757575") + '</i><div><b>¿Cómo pido un certificado laboral?</b><small>Nueva solicitud</small></div></div>'
 + ''.join(f'<div id="X-b{i}" class="bin X-b" style="left:{70 + i * 320}px;top:620px"><i>{icon(ic)}</i><b>{t}</b><small class="X-cn">✓</small></div>' for i, (ic, t) in enumerate(BINS))
 + '<div id="X-dr" class="abs"><b>Borrador de respuesta</b><p>Hola, puedes descargar tu certificado laboral desde el portal de empleados, en la opción «Mis documentos». ¿Te ayudo con algo más?</p><small>Tú revisas y envías</small></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-in",{{opacity:0,y:-80,duration:.35,ease:"back.out(1.8)"}},.2);
tl.from(".X-b",{{opacity:0,y:80,duration:.3,ease:"back.out(1.8)",stagger:.12}},{s + d * .1:.2f});
tl.to("#X-in",{{x:-170,y:180,scale:.4,opacity:0,duration:.5,ease:"power2.in"}},{s + d * .3:.2f});
tl.fromTo("#X-b0",{{boxShadow:"inset 0 0 0 3px #F3E7BE"}},{{boxShadow:"inset 0 0 0 6px #25A55F",duration:.2}},{s + d * .38:.2f});
tl.from(".X-cn",{{scale:0,duration:.25,ease:"back.out(3)",stagger:.15}},{s + d * .4:.2f});
tl.from("#X-dr",{{opacity:0,y:200,duration:.45,ease:"back.out(1.5)"}},{s + d * .55:.2f});"""))
FILES = [('Ventas.xlsx', '4.812 filas'), ('Cartera.xlsx', '3.290 filas'), ('Inventario.xlsx', '6.105 filas')]
S.append(('c07', 'td', .35, """
#X-t{top:200px;font-size:70px;left:200px;right:70px;text-align:left}
#X-n{left:70px;top:180px;width:110px;height:110px;font-size:66px}
#X-fx{left:70px;top:900px;width:940px;padding:22px 26px;border-radius:20px;background:#fff;font:600 32px/1.2 "Inter",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -20px rgba(0,0,0,.55)}
#X-fx b{font-weight:800;color:#1E7B45}
#X-err{left:70px;top:1040px;width:940px;display:flex;gap:16px}
#X-err span{flex:1;padding:16px;border-radius:16px;background:#3A1E1E;color:#FF8A8A;text-align:center;font:800 34px/1 "Montserrat",sans-serif}
""", CHT('Tarea 3 · Cruzar datos') + '<h1 id="X-t" class="h w">Una tarde de<br><span class="yy">BUSCARV</span></h1><div id="X-n" class="num">3</div>'
 + ''.join(f'<div class="file X-f" style="left:{70 + i * 330}px;top:500px"><i>{icon("list-check", "#fff")}</i>{f}<small>{r}</small></div>' for i, (f, r) in enumerate(FILES))
 + '<div id="X-fx" class="abs"><b>fx</b> =BUSCARV(A2;Cartera!A:F;4;FALSO)</div>'
 + '<div id="X-err" class="abs"><span>#N/A</span><span>#N/A</span><span>#¡REF!</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-n",{{scale:0,rotation:-120,duration:.4,ease:"back.out(2.2)"}},.1);
tl.from(".X-f",{{opacity:0,y:200,duration:.35,ease:"back.out(1.6)",stagger:.2}},{s + d * .25:.2f});
tl.from("#X-fx",{{opacity:0,y:40,duration:.35}},{s + d * .6:.2f});
tl.from("#X-err span",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)",stagger:.15}},{s + d * .75:.2f});"""))
S.append(('c08', 'tl', .4, """
#X-t{top:190px;font-size:70px}
#X-rep{left:70px;top:440px;width:640px}
#X-bars{display:flex;align-items:flex-end;gap:18px;height:240px;margin-top:22px;padding:0 6px;border-bottom:3px solid #E0E0E0}
#X-bars span{flex:1;border-radius:12px 12px 0 0;background:#FFC107}
#X-al{margin-top:22px;padding:16px 20px;border-radius:16px;background:#FFF3E0;font:700 27px/1.2 "Inter",sans-serif;color:#8A4B00;display:flex;gap:12px;align-items:center}
#X-al i{flex:none;width:44px;height:44px}
#X-ok{margin-top:16px;padding:16px 20px;border-radius:16px;background:#E8F5EC;font:700 27px/1.2 "Inter",sans-serif;color:#1E7B45}
#X-p{left:620px;height:900px}
""", CHT('Tarea 3 · Con IA') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">El informe,<br><span class="mk">listo para revisar</span></h1>'
 + '<div id="X-rep" class="rep"><h3>Informe de gestión</h3><p class="sub">Ventas + Cartera + Inventario</p><div id="X-bars">'
 + ''.join(f'<span class="X-bar" style="height:{h}%"></span>' for h in (55, 72, 48, 86, 66)) + '</div>'
 + f'<div id="X-al"><i>{icon("alert", "#C77700")}</i>Inconsistencias detectadas para revisar</div><div id="X-ok">✓ Datos cruzados</div></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-rep",{{opacity:0,x:-300,duration:.45,ease:"back.out(1.5)"}},.2);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.from(".X-bar",{{scaleY:0,transformOrigin:"50% 100%",duration:.35,ease:"back.out(1.6)",stagger:.1}},{s + d * .15:.2f});
tl.from("#X-ok",{{opacity:0,x:-40,duration:.3}},{s + d * .3:.2f});
tl.from("#X-al",{{opacity:0,scale:.7,duration:.35,ease:"back.out(2)"}},{s + d * .5:.2f});"""))
S.append(('c09', 'tl', 2.4, """
#X-t{top:170px;font-size:72px}
#X-cm{left:70px;top:1110px;width:620px;display:flex;align-items:center;gap:18px;padding:22px 26px;border-radius:28px;background:#1F1F1F;color:#FFC107;font:800 40px/1.1 "Montserrat",sans-serif}
#X-cm i{flex:none;width:64px;height:64px}
#X-by{left:70px;top:1250px;width:620px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:600px;height:960px}
""", CHT('Pregunta PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h g">¿Cuál te quita<br><span class="mk">más tiempo</span>?</h1>'
 + ''.join(f'<div class="opt X-o" style="top:{450 + i * 210}px"><span class="n">{i + 1}</span><b>{t}</b></div>' for i, (t, _) in enumerate(T3))
 + f'<div id="X-cm" class="abs"><i>{icon("chat", "#FFC107")}</i>Comenta 1, 2 o 3 👇</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-o",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)",stagger:.2}},{s + d * .3:.2f});
tl.to(".X-o",{{scale:1.04,duration:.25,yoyo:true,repeat:1,ease:"sine.inOut",stagger:{d * .08:.2f}}},{s + d * .65:.2f});
tl.from("#X-cm",{{opacity:0,y:40,duration:.35,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.to("#X-cm",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .55 + .4, .35)},ease:"sine.inOut"}},{s + d * .55 + .4:.2f});
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
