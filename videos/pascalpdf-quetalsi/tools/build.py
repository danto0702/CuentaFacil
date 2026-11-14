# Builds "PascalPDF Studio · ¿Y qué tal si…?": teaser of rhetorical questions, each showing a real PascalPDF / Pascal Sign feature
# without naming the product, a blackout ("Deja de imaginarlo") and the reveal with logo, features and QR.
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

CHQ = lambda: '<div class="chip3"><span style="background:#111;box-shadow:0 0 0 2px #FFC107,0 0 22px rgba(255,193,7,.45)"><b style="display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#FFC107;color:#111;font:800 28px/1 Montserrat">?</b>¿Y qué tal si…?</span></div>'
SX, SY, SW, SH = 0, 0, 0, 0
CLIPS = {}
Y = '#FFC107'
EXTRA2 = EXTRA2 + f"""
.q{{position:absolute;left:60px;right:60px;text-align:center;font:800 84px/1.04 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.q em{{font-style:normal;color:{Y};text-shadow:0 0 18px rgba(255,193,7,.6)}}
.pg{{position:absolute;background:#fff;border-radius:16px;box-shadow:0 30px 70px -20px rgba(0,0,0,.8)}}
.pg .t{{font:800 28px/1.2 "Montserrat",sans-serif;color:#1F1F1F;text-align:center}}
.pg .ln{{height:12px;border-radius:6px;background:#E3E3E3;margin:14px 0}}
.pg p{{font:500 30px/1.5 "Inter",sans-serif;color:#1F1F1F;margin:16px 0}}
.sel{{background:rgba(255,193,7,.45);border-radius:6px;padding:0 4px}}
.caret{{display:inline-block;width:4px;height:36px;background:#1F1F1F;vertical-align:-6px;margin-left:2px}}
.tool{{position:absolute;width:max-content;padding:14px 20px;border-radius:16px;background:#1C1C22;box-shadow:inset 0 0 0 2px #34343E;color:#fff;font:700 26px/1 "Inter",sans-serif;display:flex;align-items:center;gap:10px}}
.tool i{{width:34px;height:34px}}
.cnt{{position:absolute;left:0;right:0;text-align:center;font:800 150px/1 "Montserrat",sans-serif;color:{Y};text-shadow:0 0 30px rgba(255,193,7,.6);font-variant-numeric:tabular-nums}}
.cons{{position:absolute;padding:10px 16px;border-radius:10px;background:#fff;color:#1F1F1F;font:700 24px/1 ui-monospace,Menlo,monospace}}
.box{{position:absolute;border-radius:40px;background:#16161B;box-shadow:inset 0 0 0 3px {Y},0 0 60px rgba(255,193,7,.35);display:grid;place-items:center;font:800 150px/1 "Montserrat",sans-serif;color:{Y}}}
.who{{position:absolute;text-align:center;font:700 26px/1.2 "Inter",sans-serif;color:#CFCFCF}}
.who i{{display:block;margin:0 auto 10px;width:150px;height:200px}}
.lock{{position:absolute;width:150px;height:150px;border-radius:40px;background:{Y};padding:34px;box-shadow:0 0 40px rgba(255,193,7,.6)}}
.key{{position:absolute;font-size:80px;line-height:1;filter:drop-shadow(0 0 14px rgba(255,193,7,.7))}}
.hash{{position:absolute;left:150px;right:150px;padding:18px;border-radius:16px;background:#111;color:#9BE3B5;font:700 28px/1.3 ui-monospace,Menlo,monospace;text-align:center;box-shadow:inset 0 0 0 2px #2A2A33}}
.ok2{{position:absolute;left:150px;right:150px;padding:22px;border-radius:20px;text-align:center;font:800 40px/1.1 "Montserrat",sans-serif}}
.beam{{position:absolute;height:8px;border-radius:4px;background:linear-gradient(90deg,transparent,{Y},transparent);box-shadow:0 0 30px {Y}}}
.cloud{{position:absolute;width:260px;height:170px}}
.laptop{{position:absolute;width:700px;height:470px;border-radius:30px 30px 10px 10px;background:#16161B;box-shadow:inset 0 0 0 4px #3A3A44}}
.laptop:after{{content:"";position:absolute;left:-60px;right:-60px;bottom:-34px;height:34px;border-radius:0 0 26px 26px;background:#2A2A33}}
.dot{{position:absolute;width:26px;height:26px;border-radius:50%;background:{Y}}}
.flashw{{position:absolute;inset:0;background:#fff}}
.rays{{position:absolute;left:-460px;top:-60px;width:2000px;height:2000px;border-radius:50%;background:repeating-conic-gradient(rgba(255,193,7,.16) 0 6deg,transparent 6deg 18deg)}}
.feat{{display:inline-flex;align-items:center;gap:10px;margin:8px;padding:14px 20px;border-radius:999px;background:#1C1C22;box-shadow:inset 0 0 0 2px #3A3A44;color:#fff;font:700 28px/1 "Inter",sans-serif}}
.feat i{{width:30px;height:30px}}
"""
def doc(id_, x, y, w, title, inner):
    return f'<div id="{id_}" class="pg" style="left:{x}px;top:{y}px;width:{w}px;padding:40px 44px"><div class="t">{title}</div>{inner}</div>'
S = []
S.append(('q01', 'qx', .35, """
#X-t{top:190px}
#X-d{transform:rotate(-2deg)}
""", CHQ() + '<h1 id="X-t" class="q">¿Y qué tal si<br>pudieras <em>corregir</em><br>un PDF…?</h1>'
 + doc('X-d', 150, 640, 780, 'CUENTA DE COBRO', '<div class="ln"></div><p>Periodo: noviembre de <span id="X-w" class="sel">2025</span><span id="X-c" class="caret"></span></p><div class="ln"></div><div class="ln" style="width:70%"></div><p>Valor: <b>$ 3.500.000</b></p><div class="ln" style="width:55%"></div>')
 + f'<div class="tool" style="left:610px;top:560px"><i>{icon("pen", Y)}</i>Editar texto</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.25,duration:.35,ease:"back.out(2)"}},0.05);
tl.from("#X-d",{{opacity:0,y:400,rotation:6,duration:.5,ease:"power3.out"}},.3);
tl.from(".tool",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.5)"}},{s + d * .35:.2f});
tl.to("#X-c",{{opacity:0,duration:.01,yoyo:true,repeat:{max(1, int(D / .45))},repeatDelay:.44}},0);
tl.to("#X-w",{{background:"rgba(255,193,7,.9)",duration:.2}},{s + d * .45:.2f});
tl.set("#X-w",{{textContent:"2"}},{s + d * .58:.2f});tl.set("#X-w",{{textContent:"20"}},{s + d * .62:.2f});tl.set("#X-w",{{textContent:"202"}},{s + d * .66:.2f});tl.set("#X-w",{{textContent:"2026",background:"rgba(43,255,136,.35)"}},{s + d * .7:.2f});"""))
S.append(('q02', 'qx', .35, """
#X-t{top:190px;font-size:76px}
#X-n{top:1040px}
#X-st{left:330px;top:560px;width:420px;height:420px;border-radius:50%;border:12px solid #FFC107;display:grid;place-items:center;text-align:center;font:800 54px/1.05 "Montserrat",sans-serif;color:#FFC107;transform:rotate(-14deg);background:rgba(17,17,17,.6)}
""", CHQ() + '<h1 id="X-t" class="q">¿Firmar <em>100</em><br>como si fuera <em>1</em>?</h1>'
 + ''.join(doc(f'X-p{i}', 240 + i * 14, 540 + i * 12, 600, 'DOCUMENTO' if i == 5 else '&nbsp;', '<div class="ln"></div><div class="ln"></div><div class="ln" style="width:60%"></div>').replace('class="pg"', 'class="pg X-p"') for i in range(6))
 + '<div id="X-st" class="abs" data-layout-allow-overlap>FIRMADO<br><small style="font-size:30px">×100</small></div>'
 + '<p id="X-n" class="cnt"><span id="X-k">1</span><small style="font-size:56px"> / 100</small></p>'
 + ''.join(f'<div class="cons X-cs" style="left:{x}px;top:{y}px">CP-{n:04d}-2026</div>' for n, x, y in [(1, 90, 1250), (37, 420, 1310), (100, 740, 1250)]),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.35,ease:"back.out(2)"}},0);
tl.from(".X-p",{{opacity:0,y:300,duration:.3,ease:"power3.out",stagger:.08}},.2);
tl.from("#X-st",{{opacity:0,scale:3,duration:.3,ease:"power4.in"}},{s + d * .35:.2f});
tl.to(".X-p",{{x:6,duration:.05,yoyo:true,repeat:5}},{s + d * .35 + .3:.2f});
const X_n={{v:1}};
tl.from("#X-n",{{opacity:0,duration:.2}},{s + d * .35:.2f});
tl.to(X_n,{{v:100,duration:{d * .35:.2f},ease:"power2.out",onUpdate:()=>{{document.querySelector("#X-k").textContent=Math.round(X_n.v);}}}},{s + d * .38:.2f});
tl.from(".X-cs",{{opacity:0,y:40,duration:.3,ease:"back.out(2)",stagger:.15}},{s + d * .75:.2f});"""))
PERSON = '<svg viewBox="0 0 150 200"><circle cx="75" cy="55" r="40" fill="#3A3A44"/><path d="M15 200 C15 130 135 130 135 200 Z" fill="#3A3A44"/></svg>'
S.append(('q03', 'qx', .4, """
#X-t{top:180px;font-size:72px}
#X-a{left:80px;top:760px}
#X-b{left:850px;top:760px}
#X-dc{left:250px;top:560px;width:250px;padding:26px 24px}
#X-lk{left:465px;top:760px}
#X-ky{left:300px;top:1000px}
#X-ln{left:250px;top:830px;width:580px;height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,#FFC107 0 18px,transparent 18px 32px)}
#X-tg{left:0;right:0;top:1150px;text-align:center;font:700 36px/1.2 "Inter",sans-serif;color:#fff}
""", CHQ() + '<h1 id="X-t" class="q">¿Pedir una firma<br>y que viaje <em>cifrada</em>?</h1>'
 + f'<div id="X-a" class="who"><i>{PERSON}</i>Tú</div><div id="X-b" class="who"><i>{PERSON}</i>Quien firma</div>'
 + doc('X-dc', 0, 0, 250, 'PDF', '<div class="ln"></div><div class="ln" style="width:70%"></div>').replace('style="left:0px;top:0px;width:250px;padding:40px 44px"', '')
 + f'<div id="X-ln" class="abs"></div><div id="X-lk" class="lock">{icon("lock", "#111")}</div><div id="X-ky" class="key">🔑</div>'
 + '<p id="X-tg" class="abs">La llave va solo en el enlace que tú compartes</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.35,ease:"back.out(2)"}},0);
tl.from(["#X-a","#X-b"],{{opacity:0,y:80,duration:.35,stagger:.15}},.2);
tl.from("#X-dc",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .1:.2f});
tl.to("#X-dc",{{x:230,y:200,scale:.3,opacity:0,duration:.45,ease:"power2.in"}},{s + d * .4:.2f});
tl.from("#X-lk",{{scale:0,rotation:-30,duration:.35,ease:"back.out(2.5)"}},{s + d * .42:.2f});
tl.from("#X-ln",{{scaleX:0,transformOrigin:"0 50%",duration:.5}},{s + d * .55:.2f});
tl.to("#X-lk",{{x:340,duration:.6,ease:"power2.inOut"}},{s + d * .6:.2f});
tl.fromTo("#X-ky",{{opacity:0,x:-120}},{{opacity:1,x:600,duration:.9,ease:"power2.inOut"}},{s + d * .7:.2f});
tl.from("#X-tg",{{opacity:0,y:30,duration:.35}},{s + d * .78:.2f});"""))
S.append(('q04', 'qx', .4, """
#X-t{top:180px;font-size:72px}
#X-d{transform:rotate(1deg)}
#X-bm{left:140px;width:800px;top:560px}
#X-h{top:1180px}
#X-ok{top:1280px;background:#DCFCE7;color:#166534}
""", CHQ() + '<h1 id="X-t" class="q">¿Y saber que nadie<br>cambió <em>ni una coma</em>?</h1>'
 + doc('X-d', 190, 520, 700, 'ACTA DE ENTREGA', '<div class="ln"></div><div class="ln"></div><div class="ln" style="width:72%"></div><div class="ln"></div><div class="ln" style="width:45%"></div>' + f'<div style="margin-top:20px;width:55%">{sig(1, "", "", "#1B2A6B", 6)}</div>')
 + '<div id="X-bm" class="beam"></div><div id="X-h" class="hash">huella: a3f91c7e2b40d58e…</div><div id="X-ok" class="ok2">✓ Sin cambios desde la firma</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.35,ease:"back.out(2)"}},0);
tl.from("#X-d",{{opacity:0,y:300,duration:.45,ease:"power3.out"}},.2);
tl.fromTo("#X-bm",{{y:0,opacity:0}},{{keyframes:[{{opacity:1,duration:.1}},{{y:560,duration:{d * .3:.2f},ease:"none"}},{{y:0,duration:{d * .25:.2f},ease:"none"}},{{opacity:0,duration:.15}}]}},{s + d * .2:.2f});
tl.from("#X-h",{{opacity:0,scale:.8,duration:.3}},{s + d * .5:.2f});
tl.from("#X-ok",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.2)"}},{s + d * .8:.2f});"""))
TOOLS = [('doc', 'Unir', 90, 470), ('route', 'Dividir', 660, 450), ('box', 'Comprimir', 110, 640), ('lock', 'Proteger', 690, 620), ('sparkle', 'Marca de agua', 330, 540), ('pen', 'Editar', 120, 1180), ('search', 'Comparar', 700, 1160), ('file-check', 'Verificar', 380, 1250), ('sync', 'Rotar', 760, 900), ('chat', 'Comentar', 80, 900)]
S.append(('q05', 'qx', .4, """
#X-t{top:170px;font-size:70px}
#X-bx{left:390px;top:760px;width:300px;height:300px}
""", CHQ() + '<h1 id="X-t" class="q">¿Todo en un<br><em>solo lugar</em>?</h1>'
 + ''.join(f'<div class="tool X-tl" style="left:{x}px;top:{y}px"><i>{icon(ic, Y)}</i>{t}</div>' for ic, t, x, y in TOOLS)
 + '<div id="X-bx" class="box">?</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.35,ease:"back.out(2)"}},0);
tl.from(".X-tl",{{opacity:0,scale:.3,duration:.25,ease:"back.out(2.5)",stagger:{d * .05:.2f}}},{s:.2f});
tl.from("#X-bx",{{scale:0,duration:.4,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.to(".X-tl",{{x:(i)=>[{",".join(str(470 - t[2]) for t in TOOLS)}][i],y:(i)=>[{",".join(str(880 - t[3]) for t in TOOLS)}][i],scale:.2,opacity:0,duration:.5,ease:"power2.in",stagger:.04}},{s + d * .65:.2f});
tl.to("#X-bx",{{scale:1.12,duration:.15,yoyo:true,repeat:5,ease:"sine.inOut"}},{s + d * .8:.2f});"""))
CLOUD = '<svg viewBox="0 0 260 170"><path d="M60 150 C20 150 10 100 45 88 C40 45 95 30 115 60 C130 20 200 25 205 75 C250 78 255 150 205 150 Z" fill="#2A2A33" stroke="#4A4A55" stroke-width="5"/><path d="M95 70 L165 130 M165 70 L95 130" stroke="#FF5A5A" stroke-width="12" stroke-linecap="round"/></svg>'
S.append(('q06', 'qx', .4, """
#X-t{top:170px;font-size:70px}
#X-lp{left:190px;top:700px}
#X-dc{left:390px;top:760px;width:300px;padding:24px}
#X-cl{left:410px;top:470px}
#X-tg{left:0;right:0;top:1260px;text-align:center;font:800 44px/1.2 "Montserrat",sans-serif;color:#FFC107}
""", CHQ() + '<h1 id="X-t" class="q">¿Y si todo pasara<br><em>en tu navegador</em>?</h1>'
 + '<div id="X-lp" class="laptop"></div>' + doc('X-dc', 0, 0, 300, 'PDF', f'<div class="ln"></div><div class="ln" style="width:70%"></div><div style="width:70%;margin-top:10px">{sig(2, "", "", "#1B2A6B", 7)}</div>').replace('style="left:0px;top:0px;width:300px;padding:40px 44px"', '')
 + f'<div id="X-cl" class="cloud">{CLOUD}</div><p id="X-tg" class="abs">Sin subir tus documentos</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.35,ease:"back.out(2)"}},0);
tl.from("#X-lp",{{opacity:0,y:200,duration:.45,ease:"power3.out"}},.2);
tl.from("#X-dc",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2)"}},{s + d * .2:.2f});
tl.from("#X-cl",{{opacity:0,y:-80,duration:.35}},{s + d * .5:.2f});
tl.to("#X-dc",{{y:-40,duration:.25,yoyo:true,repeat:1,ease:"power2.out"}},{s + d * .55:.2f});
tl.to("#X-cl",{{x:8,duration:.06,yoyo:true,repeat:5}},{s + d * .62:.2f});
tl.from("#X-tg",{{opacity:0,scale:.6,duration:.35,ease:"back.out(2)"}},{s + d * .72:.2f});"""))
S.append(('q07', 'bk', .9, """
#X-t{top:820px;font-size:92px}
#X-d0{left:470px;top:1060px}#X-d1{left:527px;top:1060px}#X-d2{left:584px;top:1060px}
""", '<h1 id="X-t" class="q">Deja de<br><em>imaginarlo.</em></h1>' + ''.join(f'<div id="X-d{i}" class="dot X-dt"></div>' for i in range(3)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.6,duration:.6,ease:"power3.out"}},{s:.2f});
tl.from(".X-dt",{{opacity:0,scale:0,duration:.2,stagger:.2}},{s + d + .05:.2f});
tl.to("#X-t",{{scale:1.08,duration:{max(.3, D - s - .6):.2f},ease:"none"}},{s + .6:.2f});"""))
FEATS = [('pen', 'Edita'), ('doc', 'Firma'), ('lock', 'Protege'), ('hash', 'Consecutivo'), ('people', 'Delega'), ('file-check', 'Verifica')]
S.append(('q08', 'qx', 2.6, """
#X-fl{opacity:0}
#X-rs{opacity:.0}
#X-lg{left:365px;top:200px;width:350px;height:350px;border-radius:80px;box-shadow:0 0 0 4px #FFC107,0 0 90px rgba(255,193,7,.6)}
#X-t{top:590px;font-size:96px}
#X-s{top:810px;left:60px;right:60px;text-align:center;font:700 40px/1.2 "Inter",sans-serif;color:#CFCFCF}
#X-ps{left:0;right:0;top:890px;text-align:center}
#X-ps span{display:inline-flex;align-items:center;gap:14px;padding:14px 26px;border-radius:999px;background:#FFC107;color:#111;font:800 36px/1 "Montserrat",sans-serif}
#X-ps img{width:56px;height:56px;border-radius:14px}
#X-ft{left:40px;right:40px;top:1000px;text-align:center}
#X-qr{left:390px;top:1150px;width:300px;padding:20px 20px 12px;border-radius:28px;background:#fff;text-align:center}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:8px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
""", '<div id="X-rs" class="rays"></div><img id="X-lg" class="abs" src="assets/brand/pascalpdf-logo.png" alt=""><h1 id="X-t" class="q">PascalPDF <em>Studio</em></h1>'
 + '<p id="X-s" class="abs">Edita, firma y protege tus PDF</p>'
 + '<div id="X-ps" class="abs"><span><img src="assets/brand/pascal-sign-logo.webp" alt="">con Pascal Sign adentro</span></div>'
 + '<div id="X-ft" class="abs">' + ''.join(f'<span class="feat X-f"><i>{icon(ic, Y)}</i>{t}</span>' for ic, t in FEATS) + '</div>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalpdf.svg" alt=""><b>Pruébalo gratis</b></div><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.6,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},0.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-lg",{{scale:3,opacity:0,rotation:-15,duration:.6,ease:"power3.out"}},0.05);
tl.from("#X-t",{{opacity:0,y:60,duration:.45,ease:"back.out(1.8)"}},.45);
tl.from("#X-s",{{opacity:0,y:30,duration:.35}},{s + d * .3:.2f});
tl.from("#X-ps",{{opacity:0,scale:.5,duration:.4,ease:"back.out(2.2)"}},{s + d * .5:.2f});
tl.from(".X-f",{{opacity:0,y:30,scale:.6,duration:.25,ease:"back.out(2.5)",stagger:.08}},{s + d * .55:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .8:.2f});
tl.to("#X-lg",{{scale:1.04,duration:.5,yoyo:true,repeat:{k(D, 1.2, .5)},ease:"sine.inOut"}},1.2);"""))

BG = {'qx': '<div class="abs" style="inset:0;background:#0A0A0D"></div><div class="abs" style="inset:0;background:radial-gradient(55% 32% at 50% 38%,rgba(255,193,7,.20),transparent 72%),radial-gradient(80% 50% at 50% 100%,rgba(255,193,7,.06),transparent 70%)"></div>', 'bk': '<div class="abs" style="inset:0;background:#000"></div>', 'nx': '<div class="abs" style="inset:0;background:#07070B"></div><div class="abs" style="inset:0;background:radial-gradient(60% 35% at 15% 20%,rgba(255,46,77,.18),transparent 70%),radial-gradient(55% 35% at 85% 75%,rgba(43,255,136,.13),transparent 70%),radial-gradient(70% 40% at 50% 50%,rgba(255,201,60,.08),transparent 75%)"></div>', 'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>', 'ty': '<div class="light"></div><div class="abs" style="inset:0;background:radial-gradient(80% 50% at 50% 30%,rgba(255,193,7,.45),transparent 75%)"></div>'}
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
            caps += f'<div class="cap"><span id="{cid}-c{j}" style="background:#FFC107;color:#0B0B0F;box-shadow:0 0 24px rgba(255,193,7,.45)">{part}</span></div>'
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
    if VIDS: rows.append(f'      <div id="vwin" style="position:absolute;left:{SX}px;top:{SY}px;width:{SW}px;height:{SH}px;overflow:hidden;border-radius:50px">' + ''.join(VIDS) + '</div>')
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
