# Builds "Pascal Sign · 3 errores al firmar" (8-piece retention structure): hook, intro, 3 bodies with 2 open loops, CTA.
# Bodies 2 and 3 show real app footage (assets/video/app.mp4, recorded in videos/pascal-sign-demo) inside a phone.
# One scene per voice line (Pascal, owner's cloned voice); reuses the drawing helpers of videos/pascal-sign/tools/build.py.
import os, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('v1', os.path.join(ROOT, '..', 'pascal-sign', 'tools', 'build.py'))
v1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v1)
icon, page, chunks, k, sig = v1.icon, v1.page, v1.chunks, v1.k, v1.sig

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

CHS = lambda t: f'<div class="chip3"><span><img src="assets/brand/pascal-sign-logo.webp" alt="" style="border-radius:10px">{t}</span></div>'
SX, SY, SW, SH = 300, 560, 480, 817   # phone screen where the real footage plays (root-level video)
EXTRA2 = EXTRA2 + f"""
.bez{{position:absolute;left:{SX - 14}px;top:{SY - 14}px;width:{SW + 28}px;height:{SH + 28}px;border-radius:62px;background:#151515;box-shadow:0 40px 80px -30px rgba(0,0,0,.55),inset 0 0 0 3px #2B2B2B}}
.bez i{{position:absolute;left:14px;top:14px;right:14px;bottom:14px;border-radius:50px;background:#F4F1E8}}
.sc{{position:absolute;width:300px;padding:16px 16px 10px;border-radius:18px;background:#F4F1E8;box-shadow:0 18px 36px -14px rgba(0,0,0,.6)}}
.sc small{{display:flex;align-items:center;gap:8px;margin-bottom:6px;font:800 22px/1 "Montserrat",sans-serif;color:#5C5C5C}}
.sc small i{{width:30px;height:30px}}
.sc svg{{width:100%;display:block}}
.big{{position:absolute;left:70px;right:70px;text-align:center;font:800 92px/1.04 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.big em{{font-style:normal;color:#FFC107}}
.err{{position:absolute;left:70px;top:190px;display:flex;align-items:center;gap:18px}}
.err b{{flex:none;width:96px;height:96px;border-radius:50%;background:#E5484D;display:grid;place-items:center;font:800 56px/1 "Montserrat",sans-serif;color:#fff}}
.err span{{font:800 50px/1.08 "Montserrat",sans-serif;color:#fff;max-width:760px}}
.err.lt span{{color:#1F1F1F}}
.three{{position:absolute;left:70px;right:70px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:26px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35)}}
.three b{{flex:none;width:80px;height:80px;border-radius:50%;background:#E5484D;display:grid;place-items:center;font:800 46px/1 "Montserrat",sans-serif;color:#fff}}
.three span{{font:800 40px/1.1 "Montserrat",sans-serif;color:#1F1F1F}}
.three.lock{{filter:blur(9px)}}
.stp{{position:absolute;width:210px;text-align:center;font:800 30px/1.1 "Montserrat",sans-serif;color:#9E9E9E}}
.stp i{{display:block;margin:0 auto 12px;width:120px;height:120px;border-radius:32px;background:#2A2A2A;padding:30px;box-shadow:inset 0 0 0 3px #3A3A3A}}
.slash{{position:absolute;height:12px;border-radius:6px;background:#E5484D;transform-origin:0 50%}}
.tagw{{position:absolute;padding:16px 26px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif;box-shadow:0 14px 28px -12px rgba(0,0,0,.5)}}
.reg{{position:absolute;left:90px;right:90px;border-radius:30px;background:#fff;overflow:hidden;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.4)}}
.reg h3{{margin:0;display:flex;align-items:center;gap:14px;padding:22px 28px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif}}
.reg h3 img{{width:48px;height:48px;border-radius:12px}}
.reg p{{display:flex;justify-content:space-between;gap:16px;padding:20px 28px;border-top:2px solid #EFEFEF;font:600 30px/1.2 "Inter",sans-serif;color:#5C5C5C}}
.reg p b{{color:#1F1F1F;font-weight:800;text-align:right}}
.qm{{position:absolute;font:800 150px/1 "Montserrat",sans-serif;color:#E5484D}}
"""
SC = [('bell', 'Correo', 90, 470, -6), ('chat', 'Chat', 690, 450, 5), ('people', 'Chat grupal', 110, 800, 4), ('folder', 'Descargas', 680, 830, -5)]
S = []
S.append(('e01', 'td', .25, """
#X-t{top:240px}
#X-c{left:380px;height:820px}
""", CHS('Pascal Sign') + '<img id="X-c" class="ch" src="assets/chars/camila-molesta.webp" alt="">'
 + ''.join(f'<div class="sc X-sc" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><small><i>{icon(ic, "#757575")}</i>{t}</small>{sig(i)}</div>' for i, (ic, t, x, y, r) in enumerate(SC))
 + '<h1 id="X-t" class="big">Tu firma está en<br><em>más chats</em> de los que crees</h1>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.25,duration:.3,ease:"back.out(1.8)"}},0.05);
tl.from(".X-sc",{{opacity:0,scale:.3,duration:.25,ease:"back.out(2)",stagger:.12}},.2);
tl.from("#X-c",{{y:700,duration:.45,ease:"back.out(1.3)"}},.3);
tl.to(".X-sc",{{y:-14,duration:.4,yoyo:true,repeat:{k(D, .9, .4)},ease:"sine.inOut",stagger:.08}},.9);"""))
S.append(('e02', 'tl', .35, """
#X-t{top:200px;font-size:72px}
#X-p{left:640px;height:860px}
""", CHS('3 errores') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">3 errores<br>al <span class="mk">firmar</span></h1>'
 + ''.join(f'<div class="three X-e{"" if i == 0 else " lock"}" style="top:{470 + i * 160}px;right:420px"><b>{i + 1}</b><span>{t}</span></div>' for i, t in enumerate(['Foto por chat', 'Imprimir y escanear', '¿Qué firmaste?'])),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.15);
tl.from(".X-e",{{opacity:0,x:-300,duration:.3,ease:"back.out(1.6)",stagger:.2}},{s + d * .25:.2f});"""))
S.append(('e03', 'td', .4, """
#X-doc{left:600px;top:760px;width:400px;padding:30px;border-radius:16px;background:#fff;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
#X-doc b{display:block;font:800 26px/1.15 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:14px}
#X-doc s{display:block;height:11px;border-radius:6px;background:#E3E3E3;margin-bottom:12px;text-decoration:none}
#X-pz{position:absolute;left:640px;top:1000px;width:300px}
#X-cp{left:610px;top:1180px;font-size:34px}
#X-qm{left:900px;top:620px}
""", CHS('Error 1') + '<div class="err"><b>1</b><span>La foto de tu firma, por chat</span></div>'
 + ''.join(f'<div class="sc X-sc" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><small><i>{icon(ic, "#757575")}</i>{t}</small>{sig(0)}</div>' for ic, t, x, y, r in [('chat', 'Chat', 80, 430, -4), ('bell', 'Correo', 100, 740, 5), ('folder', 'Descargas', 90, 1040, -3)])
 + '<div id="X-doc" class="abs"><b>Documento que nunca viste</b><s></s><s></s><s style="width:70%"></s><s></s><s style="width:50%"></s></div>'
 + f'<div id="X-pz">{sig(0)}</div><div id="X-cp" class="tagw">Copiar · pegar</div><div id="X-qm" class="qm">?</div>',
 lambda D, s, d: f"""tl.from(".err",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-sc",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2)",stagger:{d * .1:.2f}}},{s + d * .12:.2f});
tl.from("#X-doc",{{opacity:0,x:300,duration:.4,ease:"back.out(1.5)"}},{s + d * .55:.2f});
tl.fromTo("#X-pz",{{x:-520,y:-560,opacity:0,scale:.8}},{{x:0,y:0,opacity:1,scale:1,duration:.7,ease:"power2.inOut"}},{s + d * .68:.2f});
tl.from("#X-cp",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2.2)"}},{s + d * .7:.2f});
tl.from("#X-qm",{{opacity:0,scale:0,rotation:-40,duration:.35,ease:"back.out(2.5)"}},{s + d * .85:.2f});"""))
S.append(('e04', 'td', .35, """
#X-t{top:640px;font-size:84px}
""", CHS('Pascal Sign') + '<h1 id="X-t" class="big">Pero ese no es<br>el que <em>más te cuesta</em>…</h1>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},0.1);
tl.to("#X-t",{{scale:1.06,duration:{D - .6:.2f},ease:"none"}},.5);"""))
STEPS = [('printer', 'Imprime'), ('pen', 'Firma'), ('scan', 'Escanea')]
S.append(('e05', 'td', .6, """
#X-c{left:620px;height:860px}
#X-sl{left:80px;top:690px;width:820px}
#X-mm{left:70px;top:950px;font:800 60px/1.1 "Montserrat",sans-serif;color:#FF5A5A}
#X-tg{left:70px;top:1420px}
""", CHS('Error 2') + '<div class="err"><b>2</b><span>Imprimir, firmar y escanear</span></div>'
 + '<img id="X-c" class="ch" src="assets/chars/hernando-papeles.webp" alt="">'
 + ''.join(f'<div class="stp X-st" style="left:{70 + i * 220}px;top:540px"><i>{icon(ic, "#BDBDBD")}</i>{t}</div>' for i, (ic, t) in enumerate(STEPS))
 + '<div id="X-sl" class="slash"></div><p id="X-mm" class="abs">Media mañana<br>perdida</p>'
 + '<div id="X-bz" class="bez"><i></i></div><div id="X-tg" class="tagw">Firmado en segundos</div>',
 lambda D, s, d: f"""tl.from(".err",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-st",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)",stagger:.22}},{s + d * .05:.2f});
tl.from("#X-sl",{{scaleX:0,duration:.35,ease:"power2.in"}},{s + d * .2:.2f});
tl.from("#X-c",{{y:700,duration:.45,ease:"back.out(1.3)"}},{s + d * .15:.2f});
tl.from("#X-mm",{{opacity:0,y:30,duration:.35}},{s + d * .2:.2f});
tl.to([".X-st","#X-sl","#X-mm","#X-c"],{{opacity:0,y:-60,duration:.3,ease:"power2.in"}},{s + d * .34:.2f});
tl.fromTo("#X-bz",{{opacity:0,y:900}},{{opacity:1,y:0,duration:.45,ease:"power3.out"}},{s + d * .33:.2f});
tl.from("#X-tg",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .88:.2f});"""))
S.append(('e06', 'td', .35, """
#X-t{top:600px;font-size:80px}
""", CHS('Pascal Sign') + '<h1 id="X-t" class="big">Y el error 3 te puede<br>meter en un <em style="color:#FF5A5A">problema</em><br>de verdad…</h1>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:.8,duration:.4,ease:"back.out(1.8)"}},0.1);
tl.to("#X-t",{{x:6,duration:.06,yoyo:true,repeat:5,ease:"none"}},{s + d * .7:.2f});"""))
REG = [('Fecha', '8 nov. 2026 · 10:23 a. m.'), ('Objeto', 'Cuenta de cobro'), ('Radicado', 'RAD-2026-131'), ('Consecutivo', 'CP-0006-2026')]
S.append(('e07', 'tl', .6, """
#X-c{left:580px;height:820px}
#X-q1{left:110px;top:520px}
#X-q2{left:330px;top:720px;font-size:110px}
#X-rg{top:430px}
#X-tg{left:70px;top:1420px}
""", CHS('Error 3') + '<div class="err lt"><b>3</b><span>No saber qué firmaste</span></div>'
 + '<img id="X-c" class="ch" src="assets/chars/marcela-factura.webp" alt=""><div id="X-q1" class="qm">?</div><div id="X-q2" class="qm">?</div>'
 + '<div id="X-rg" class="reg"><h3><img src="assets/brand/pascal-sign-logo.webp" alt="">Registro de firma</h3>' + ''.join(f'<p class="X-r"><span>{a}</span><b>{b}</b></p>' for a, b in REG) + '</div>'
 + '<div id="X-bz" class="bez"><i></i></div><div id="X-tg" class="tagw">Tú decides quién y hasta cuándo</div>',
 lambda D, s, d: f"""tl.from(".err",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{y:700,duration:.45,ease:"back.out(1.3)"}},.15);
tl.from(["#X-q1","#X-q2"],{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)",stagger:.2}},{s + d * .04:.2f});
tl.to(["#X-c","#X-q1","#X-q2"],{{opacity:0,x:-80,duration:.3}},{s + d * .16:.2f});
tl.from("#X-rg",{{opacity:0,y:80,duration:.4,ease:"back.out(1.5)"}},{s + d * .17:.2f});
tl.from(".X-r",{{opacity:0,x:-40,duration:.25,stagger:{d * .06:.2f}}},{s + d * .2:.2f});
tl.to("#X-rg",{{opacity:0,y:-60,duration:.3}},{s + d * .45:.2f});
tl.fromTo("#X-bz",{{opacity:0,y:900}},{{opacity:1,y:0,duration:.45,ease:"power3.out"}},{s + d * .44:.2f});
tl.from("#X-tg",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .75:.2f});"""))
S.append(('e08', 'tl', 2.4, """
#X-t{top:170px;font-size:64px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 28px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:990px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 42px/1.1 "Montserrat",sans-serif}
#X-by{left:540px;top:1150px;width:500px;text-align:center;font:800 32px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:60px;height:60px;border-radius:14px}
#X-p{left:10px;height:1000px}
""", CHS('Pascal Sign') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h g">Firma sin <span class="mk">errores</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascal-sign.svg" alt=""><b>pascalia.lat/PascalSign</b></div><div id="X-demo" class="abs">7 días gratis</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/pascal-sign-logo.webp" alt=""><em style="font-style:normal">Pascal Sign · Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .2:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .5:.2f});
tl.to("#X-demo",{{scale:1.06,duration:.35,yoyo:true,repeat:{k(D, s + d * .5 + .4, .35)},ease:"sine.inOut"}},{s + d * .5 + .4:.2f});
tl.from("#X-by",{{opacity:0,duration:.35}},{s + d * .75:.2f});"""))
# real footage in the phone: scene -> [(start fraction of the line, end fraction or None = scene end, source second)]
MARKS = json.load(open(os.path.join(ROOT, 'tools', 'marks-app.json')))
CLIPS = {'e05': [(.38, .62, MARKS['dibujar'] + .1), (.62, .82, MARKS['foto'] + .55), (.82, None, MARKS['acomodar'] + .1)],
         'e07': [(.47, .62, MARKS['historial'] - 2.0), (.62, None, MARKS['delegar'] + .2)]}

BG = {'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>', 'ty': '<div class="light"></div><div class="abs" style="inset:0;background:radial-gradient(80% 50% at 50% 30%,rgba(255,193,7,.45),transparent 75%)"></div>'}
LEAD = .3

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    t = 0.0; rows = []; timing = []; VIDS = []
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
        for a, b, src in CLIPS.get(n, []):
            st = t + s + d * a; en = (t + s + d * b) if b is not None else t + D
            VIDS.append(f'<video id="v-{n}-{len(VIDS)}" class="clip" src="assets/video/app.mp4" data-start="{st:.2f}" data-duration="{en - st:.2f}" data-media-start="{src:.2f}" data-track-index="2" muted playsinline data-layout-allow-overflow style="position:absolute;left:0;top:0;width:{SW}px;height:{SH}px;object-fit:cover"></video>')
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{t + s:.2f}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
        timing.append({'id': n, 'start': round(t, 2), 'dur': D, 'vo': [round(t + s, 2), d]})
        t = round(t + D, 2)
    rows.append(f'      <div id="vwin" style="position:absolute;left:{SX}px;top:{SY}px;width:{SW}px;height:{SH}px;overflow:hidden;border-radius:50px">' + ''.join(VIDS) + '</div>')
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
