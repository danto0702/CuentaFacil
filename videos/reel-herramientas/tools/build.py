# Builds "Reel 7 · El síndrome del objeto brillante": five disconnected subscriptions vs. AI integrated into the existing workflow.
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
.app{position:absolute;width:300px;padding:22px;border-radius:26px;background:#262626;box-shadow:inset 0 0 0 3px #3A3A3A;color:#fff;font:800 30px/1.1 "Montserrat",sans-serif}
.app i{display:block;width:70px;height:70px;border-radius:20px;padding:15px;margin-bottom:14px}
.app small{display:block;margin-top:8px;font:600 22px/1.2 "Inter",sans-serif;color:#9BE3B5}
.shiny{position:absolute;left:240px;top:520px;width:600px;padding:34px;border-radius:36px;background:linear-gradient(135deg,#FFE27A,#FFC107);box-shadow:0 0 0 10px rgba(255,193,7,.25),0 0 120px rgba(255,193,7,.55);text-align:center}
.shiny b{display:block;font:800 52px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.shiny small{display:block;margin-top:10px;font:700 30px/1.2 "Inter",sans-serif;color:#1F1F1F}
.shiny em{display:inline-block;margin-bottom:16px;padding:8px 18px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 26px/1 "Montserrat",sans-serif;font-style:normal}
.btn{position:absolute;padding:22px 40px;border-radius:999px;background:#25A55F;color:#fff;font:800 36px/1 "Montserrat",sans-serif}
.spk{position:absolute;width:70px;height:70px}
.nd{position:absolute;width:210px;text-align:center;font:800 26px/1.15 "Montserrat",sans-serif;color:#fff}
.nd i{display:block;margin:0 auto 10px;width:120px;height:120px;border-radius:32px;padding:28px;box-shadow:0 14px 30px -12px rgba(0,0,0,.6)}
.frag{position:absolute;left:70px;width:600px;padding:22px 26px;border-radius:24px;background:#fff;box-shadow:0 20px 40px -20px rgba(0,0,0,.55)}
.frag h4{margin:0 0 10px;display:flex;align-items:center;gap:12px;font:800 26px/1 "Montserrat",sans-serif;color:#5C5C5C}
.frag h4 i{width:40px;height:40px;border-radius:12px;padding:8px}
.frag p{font:700 30px/1.25 "Inter",sans-serif;color:#1F1F1F}
.frag p u{text-decoration:none;color:#C62828}
.frag em{position:absolute;right:20px;top:18px;padding:8px 14px;border-radius:999px;background:#FDE7E7;color:#B42318;font:800 20px/1 "Montserrat",sans-serif;font-style:normal}
.tabs{position:absolute;left:40px;right:40px;display:flex;gap:6px}
.tab{flex:1;min-width:0;padding:16px 10px;border-radius:14px 14px 0 0;background:#3A3A3A;color:#BDBDBD;font:700 20px/1 "Inter",sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp{position:absolute;padding:14px 22px;border-radius:16px;background:#fff;color:#1F1F1F;font:800 32px/1 "Montserrat",sans-serif;box-shadow:0 14px 28px -12px rgba(0,0,0,.6)}
.step{position:absolute;left:150px;width:780px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:28px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35)}
.step i{flex:none;width:84px;height:84px;border-radius:24px;padding:19px;background:#EDEDED}
.step b{display:block;font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.step small{display:block;margin-top:6px;font:600 26px/1.2 "Inter",sans-serif;color:#5C5C5C}
.step.on{box-shadow:inset 0 0 0 4px #25A55F,0 20px 40px -20px rgba(31,31,31,.35)}
.svc{position:absolute;left:70px;width:600px;display:flex;align-items:center;gap:22px;padding:24px 28px;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.35)}
.svc i{flex:none;width:96px;height:96px;border-radius:50%;background:#1F1F1F;padding:22px}
.svc b{display:block;font:800 42px/1.05 "Montserrat",sans-serif;color:#1F1F1F}
.svc small{display:block;margin-top:6px;font:600 26px/1.2 "Inter",sans-serif;color:#5C5C5C}
"""
APPS = [('chat', 'Chat', '#38BDF8'), ('list-check', 'Tareas', '#A78BFA'), ('money', 'Facturación', '#25A55F'), ('people', 'Clientes (CRM)', '#F97316'), ('brain', 'IA', '#FFC107')]
POS5 = [(70, 470), (395, 470), (720, 470), (232, 720), (557, 720)]
S = []
S.append(('f01', 'td', .4, """
#X-t{top:200px;font-size:70px}
#X-lbl{top:1030px;font-size:60px}
""", CHT('Error común') + '<h1 id="X-t" class="h w"><span class="yy">5 plataformas</span> pagas</h1>'
 + ''.join(f'<div class="app X-a" style="left:{x}px;top:{y}px"><i style="background:{c}">{icon(ic, "#fff")}</i>{t}<small>✓ Suscripción activa</small></div>' for (ic, t, c), (x, y) in zip(APPS, POS5))
 + '<h2 id="X-lbl" class="h w">…y nadie <span class="red">encuentra nada</span></h2>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-a",{{opacity:0,scale:.4,y:60,duration:.3,ease:"back.out(2)",stagger:.18}},{s + d * .1:.2f});
tl.from("#X-lbl",{{opacity:0,y:30,duration:.35,ease:"back.out(1.8)"}},{s + d * .6:.2f});
tl.to(".X-a",{{rotation:(i)=>[-5,4,-3,6,-4][i],x:(i)=>[-10,8,-6,10,-8][i],duration:.3,ease:"power2.out"}},{s + d * .62:.2f});"""))
S.append(('f02', 'td', .4, """
#X-t{top:200px;font-size:64px}
#X-btn{left:330px;top:960px}
#X-cur{left:640px;top:1010px;width:90px;height:90px}
""", CHT('Error común') + '<h1 id="X-t" class="h w">El síndrome del<br><span class="yy">objeto brillante</span></h1>'
 + '<div id="X-sh" class="shiny"><em>¡NUEVA!</em><b>Súper App IA</b><small>Lo resuelve todo ✨</small></div>'
 + ''.join(f'<div class="spk X-sp" style="left:{x}px;top:{y}px">{icon("sparkle", "#FFC107")}</div>' for x, y in [(160, 470), (880, 500), (190, 820), (860, 820)])
 + '<div id="X-btn" class="btn">Suscribirme</div>'
 + '<svg id="X-cur" class="abs" viewBox="0 0 24 24"><path d="M4 2l15 10-7 1.5 4 7.5-3 1.5-4-7.5L4 20z" fill="#fff" stroke="#1F1F1F" stroke-width="1.4" stroke-linejoin="round"/></svg>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-sh",{{opacity:0,scale:.5,duration:.5,ease:"back.out(1.8)"}},{s + d * .3:.2f});
tl.from(".X-sp",{{scale:0,rotation:-90,duration:.35,ease:"back.out(2.5)",stagger:.1}},{s + d * .4:.2f});
tl.to(".X-sp",{{scale:1.25,duration:.4,yoyo:true,repeat:{k(D, s + d * .4 + .8, .4)},ease:"sine.inOut",stagger:.1}},{s + d * .4 + .8:.2f});
tl.from("#X-btn",{{opacity:0,y:40,duration:.3,ease:"back.out(2)"}},{s + d * .6:.2f});
tl.from("#X-cur",{{x:250,y:300,opacity:0,duration:.5,ease:"power2.out"}},{s + d * .7:.2f});
tl.to("#X-btn",{{scale:.92,duration:.1,yoyo:true,repeat:1}},{s + d * .7 + .55:.2f});"""))
NODES = [(435, 440), (790, 640), (660, 1010), (210, 1010), (80, 640)]
CENT = [(x + 105, y + 60) for x, y in NODES]
LINKS = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 2), (0, 3)]
S.append(('f03', 'td', .4, """
#X-t{top:200px;font-size:66px}
#X-ln{left:0;top:0;width:1080px;height:1920px}
""", CHT('Error común') + '<h1 id="X-t" class="h w">Ninguna <span class="red">se habla</span></h1>'
 + '<svg id="X-ln" class="abs" viewBox="0 0 1080 1920"><g fill="none" stroke="#FF5A5A" stroke-width="6" stroke-dasharray="14 14" stroke-linecap="round">'
 + ''.join(f'<path class="X-l" d="M{CENT[a][0]} {CENT[a][1]} L{CENT[b][0]} {CENT[b][1]}"/>' for a, b in LINKS) + '</g>'
 + ''.join(f'<g class="X-xx"><circle cx="{(CENT[a][0] + CENT[b][0]) / 2}" cy="{(CENT[a][1] + CENT[b][1]) / 2}" r="26" fill="#E5484D"/><path d="M{(CENT[a][0] + CENT[b][0]) / 2 - 10} {(CENT[a][1] + CENT[b][1]) / 2 - 10}l20 20M{(CENT[a][0] + CENT[b][0]) / 2 + 10} {(CENT[a][1] + CENT[b][1]) / 2 - 10}l-20 20" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>' for a, b in LINKS[:5]) + '</svg>'
 + ''.join(f'<div class="nd X-n" style="left:{x}px;top:{y}px"><i style="background:{c}">{icon(ic, "#fff")}</i>{t}</div>' for (ic, t, c), (x, y) in zip(APPS, NODES)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},{s + d * .7:.2f});
tl.from(".X-n",{{opacity:0,scale:.3,duration:.3,ease:"back.out(2.2)",stagger:{d * .13:.2f}}},{s:.2f});
tl.from(".X-l",{{opacity:0,duration:.3,stagger:.06}},{s + d * .7:.2f});
tl.from(".X-xx",{{opacity:0,scale:0,transformOrigin:"50% 50%",duration:.25,ease:"back.out(3)",stagger:.1}},{s + d * .75:.2f});"""))
FR = [('chat', '#38BDF8', 'App de chat', 'Laura · 312 •••', 'Sin empresa'), ('people', '#F97316', 'CRM', 'Laura Gómez · Empresa XYZ', 'Sin teléfono'), ('money', '#25A55F', 'Facturación', 'L. Gómez · NIT •••', 'Sin historial')]
S.append(('f04', 'td', .4, """
#X-t{top:190px;font-size:64px}
#X-q{left:760px;top:600px;font:800 300px/1 "Montserrat",sans-serif;color:#FFC107}
""", CHT('Error común') + '<h1 id="X-t" class="h w">Un cliente,<br><span class="yy">3 versiones</span></h1>'
 + ''.join(f'<div class="frag X-f" style="top:{450 + i * 210}px"><h4><i style="background:{c}">{icon(ic, "#fff")}</i>{t}</h4><p>{p}</p><em>{m}</em></div>' for i, (ic, c, t, p, m) in enumerate(FR))
 + '<div id="X-q" class="abs">?</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-f",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.5)",stagger:{d * .14:.2f}}},{s + d * .1:.2f});
tl.from(".X-f em",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)",stagger:.15}},{s + d * .65:.2f});
tl.from("#X-q",{{opacity:0,scale:0,rotation:-30,duration:.4,ease:"back.out(2)"}},{s + d * .75:.2f});"""))
TABS = ['Chat', 'Tareas', 'CRM', 'Facturas', 'IA', 'Correo', 'Excel', 'Drive', 'Chat', 'CRM']
S.append(('f05', 'td', .4, """
#X-t{top:190px;font-size:66px}
#X-tb{top:440px}
#X-win{left:40px;right:40px;top:494px;height:300px;border-radius:0 0 22px 22px;background:#F2F2F2}
#X-c{left:250px;height:820px}
""", CHT('Error común') + '<img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt=""><h1 id="X-t" class="h w">Fatiga de <span class="yy">pestañas</span></h1>'
 + '<div id="X-tb" class="tabs">' + ''.join(f'<div class="tab X-tab">{t}</div>' for t in TABS) + '</div><div id="X-win" class="abs"></div>'
 + ''.join(f'<div class="cp X-cp" style="left:{x}px;top:{y}px">{t}</div>' for t, x, y in [('Ctrl + C', 120, 860), ('Ctrl + V', 760, 900), ('Ctrl + C', 150, 1100), ('Ctrl + V', 740, 1140)]),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-tab",{{opacity:0,y:30,duration:.2,stagger:.08}},.2);
tl.from("#X-win",{{opacity:0,duration:.3}},.3);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.4);
""" + ''.join(f'tl.set(".X-tab:nth-child({m % 10 + 1})",{{background:"#FFC107",color:"#1F1F1F"}},{1.2 + m * .3:.2f});\ntl.set(".X-tab:nth-child({m % 10 + 1})",{{background:"#3A3A3A",color:"#BDBDBD"}},{1.48 + m * .3:.2f});\n' for m in range(int((D - 1.8) / .3))) + f"""tl.from(".X-cp",{{opacity:0,scale:.3,duration:.25,ease:"back.out(2.5)",stagger:.35}},{s + d * .4:.2f});
tl.to("#X-c",{{x:6,duration:.07,yoyo:true,repeat:{k(D, s + d * .7, .07)},ease:"none"}},{s + d * .7:.2f});"""))
S.append(('f06', 'ty', .45, """
#X-t{top:190px;font-size:64px}
#X-eq{left:70px;right:70px;top:420px;text-align:center;font:800 56px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
#X-eq b{color:#C62828}
#X-in{left:110px;right:110px;top:600px;padding:30px;border-radius:32px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 48px/1.15 "Montserrat",sans-serif}
#X-p{left:250px;height:760px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHT('La solución') + '<img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><h1 id="X-t" class="h g">El resultado <span class="mk">no se compra</span></h1>'
 + '<p id="X-eq" class="abs">Más herramientas <b>≠</b> más resultado</p><div id="X-in" class="abs">Integra la IA en el flujo que tu equipo ya usa</div><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-eq",{{opacity:0,y:30,duration:.35,ease:"back.out(1.8)"}},{s + d * .05:.2f});
tl.from("#X-p",{{y:700,duration:.5,ease:"back.out(1.2)"}},{s + d * .3:.2f});
tl.from("#X-in",{{opacity:0,scale:.7,duration:.45,ease:"back.out(1.8)"}},{s + d * .45:.2f});"""))
STEPS = [('whatsapp', 'Entra el pedido', 'Por WhatsApp'), ('sync', 'Llega al sistema', 'Sin copiar y pegar'), ('doc', 'Se factura', 'Automáticamente'), ('bell', 'Avisa al equipo', 'Con todo el contexto')]
S.append(('f07', 'tl', .45, """
#X-t{top:190px;font-size:68px}
#X-ln{left:0;top:0;width:1080px;height:1920px}
""", CHT('La solución') + '<h1 id="X-t" class="h g">Un solo <span class="mk">flujo</span></h1>'
 + '<svg id="X-ln" class="abs" viewBox="0 0 1080 1920"><path id="X-pl" d="M234 500 L234 1100" stroke="#25A55F" stroke-width="10" stroke-linecap="round" fill="none"/></svg>'
 + ''.join(f'<div id="X-s{i}" class="step X-st" style="top:{440 + i * 190}px"><i>{icon(ic, "#1F1F1F")}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, t, sm) in enumerate(STEPS)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-st",{{opacity:0,x:-200,duration:.3,ease:"back.out(1.6)",stagger:.15}},.2);
tl.fromTo("#X-pl",{{strokeDasharray:600,strokeDashoffset:600}},{{strokeDashoffset:0,duration:{d * .7:.2f},ease:"none"}},{s + d * .1:.2f});
""" + ''.join(f'tl.to("#X-s{i} i",{{background:"#25A55F",duration:.2}},{s + d * (.1 + i * .2):.2f});\ntl.to("#X-s{i}",{{boxShadow:"inset 0 0 0 4px #25A55F,0 20px 40px -20px rgba(31,31,31,.35)",duration:.2}},{s + d * (.1 + i * .2):.2f});\n' for i in range(4))))
SVC = [('compass', 'Consultoría', 'Revisamos tus procesos'), ('code', 'Desarrollo a la medida', 'Integramos tus herramientas'), ('sync', 'Todo conectado', 'Trabajan juntas, no en tu contra')]
S.append(('f08', 'tl', .45, """
#X-t{top:190px;font-size:68px}
#X-p{left:620px;height:900px}
""", CHT('PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">Un sistema <span class="mk">a tu medida</span></h1>'
 + ''.join(f'<div class="svc X-s" style="top:{440 + i * 200}px"><i>{icon(ic, "#FFC107")}</i><div><b>{t}</b><small>{sm}</small></div></div>' for i, (ic, t, sm) in enumerate(SVC)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-s",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)",stagger:{d * .22:.2f}}},{s + d * .15:.2f});"""))
S.append(('f09', 'tl', 2.4, """
#X-t{top:170px;font-size:62px}
#X-qr{left:560px;top:430px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 34px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:1000px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif}
#X-by{left:560px;top:1190px;width:460px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:54px;height:54px}
#X-p{left:10px;height:1000px}
""", CHT('PascalIA') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">Antes de otra suscripción,<br><span class="mk">hablemos</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-whatsapp.svg" alt=""><b>312 388 5012</b></div><div id="X-demo" class="abs">Diseñemos tu sistema</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/flower.svg" alt=""><em style="font-style:normal">Pascal<span style="color:#A87600">IA</span></em></div>',
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
