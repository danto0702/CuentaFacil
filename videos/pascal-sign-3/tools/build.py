# Builds "Pascal Sign · Tres formas de firmar": print-sign-scan vs. signing from the phone (finger, image, photo), local storage, signature log, 7-day trial.
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
EXTRA2 = EXTRA2 + """
.stp{position:absolute;width:210px;text-align:center;font:800 30px/1.1 "Montserrat",sans-serif;color:#9E9E9E}
.stp i{display:block;margin:0 auto 12px;width:130px;height:130px;border-radius:34px;background:#2A2A2A;padding:32px;box-shadow:inset 0 0 0 3px #3A3A3A}
.big{position:absolute;left:0;right:0;text-align:center;font:800 76px/1.1 "Montserrat",sans-serif;color:#FF5A5A}
.sc{position:absolute;width:300px;padding:16px 16px 10px;border-radius:18px;background:#F4F1E8;box-shadow:0 18px 36px -14px rgba(0,0,0,.6)}
.sc small{display:flex;align-items:center;gap:8px;margin-bottom:6px;font:800 22px/1 "Montserrat",sans-serif;color:#5C5C5C}
.sc small i{width:30px;height:30px}
.sc svg{width:100%;display:block}
.ph{position:absolute;width:440px;height:840px;border-radius:60px;background:#151515;padding:16px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
.ph .pscr{position:relative;width:100%;height:100%;border-radius:46px;background:#F7F7F7;overflow:hidden}
.ph .bar{display:flex;align-items:center;gap:12px;padding:44px 22px 18px;background:#1F1F1F;color:#FFC107;font:800 28px/1 "Montserrat",sans-serif}
.ph .bar img{width:44px;height:44px;border-radius:12px}
.ph .pdoc{margin:22px;padding:22px;border-radius:18px;background:#fff;box-shadow:0 6px 16px -8px rgba(0,0,0,.25)}
.ph .pdoc b{display:block;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:14px}
.ph .pdoc s{display:block;height:12px;border-radius:6px;background:#E3E3E3;margin-bottom:12px;text-decoration:none}
.ph .pad{position:relative;margin:0 22px;height:190px;border-radius:18px;border:3px dashed #BDBDBD;background:#fff}
.ph .pad svg{position:absolute;left:20px;right:20px;top:30px;width:calc(100% - 40px)}
.ph .pok{position:absolute;left:22px;right:22px;bottom:30px;padding:20px;border-radius:18px;background:#25A55F;color:#fff;text-align:center;font:800 30px/1 "Montserrat",sans-serif}
.tagw{position:absolute;padding:16px 26px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif;box-shadow:0 14px 28px -12px rgba(0,0,0,.5)}
.fing{position:absolute;width:90px;height:90px;border-radius:50%;background:rgba(255,193,7,.55);box-shadow:0 0 0 10px rgba(255,193,7,.25)}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px}
.gal div{aspect-ratio:1;border-radius:14px;background:#DADADA}
.gal div.pick{background:#fff;box-shadow:inset 0 0 0 5px #FFC107;display:grid;place-items:center;padding:8px}
.cam{position:absolute;inset:0;background:#2B2B2B}
.cam .paper{position:absolute;left:60px;right:60px;top:220px;height:300px;border-radius:12px;background:#EDE6D3;transform:rotate(-4deg);padding:70px 30px}
.cam .cr{position:absolute;width:60px;height:60px;border:6px solid #FFC107}
.cam .shut{position:absolute;left:50%;bottom:60px;width:110px;height:110px;margin-left:-55px;border-radius:50%;background:#fff;box-shadow:0 0 0 10px rgba(255,255,255,.35)}
.res{position:absolute;left:22px;right:22px;top:250px;padding:30px;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 4px #25A55F}
.res small{display:block;margin-top:12px;text-align:center;font:800 26px/1 "Montserrat",sans-serif;color:#1E7B45}
.nope{position:absolute;display:flex;align-items:center;gap:14px;padding:18px 26px;border-radius:24px;background:#fff;font:800 34px/1 "Montserrat",sans-serif;color:#6B6B6B;box-shadow:0 16px 32px -16px rgba(31,31,31,.4)}
.nope i{width:56px;height:56px;border-radius:14px;padding:12px;background:#BDBDBD}
.nope:after{content:"";position:absolute;left:14px;right:14px;top:50%;height:7px;border-radius:4px;background:#E5484D}
.reg{position:absolute;left:70px;right:70px;border-radius:30px;background:#fff;overflow:hidden;box-shadow:inset 0 0 0 3px #F3E7BE,0 24px 50px -24px rgba(31,31,31,.4)}
.reg h3{margin:0;display:flex;align-items:center;gap:14px;padding:22px 28px;background:#1F1F1F;color:#FFC107;font:800 34px/1 "Montserrat",sans-serif}
.reg h3 img{width:48px;height:48px;border-radius:12px}
.reg .sgn{padding:20px 28px 6px}
.reg .sgn svg{width:60%;display:block}
.reg p{display:flex;justify-content:space-between;gap:16px;padding:22px 28px;border-top:2px solid #EFEFEF;font:600 30px/1.2 "Inter",sans-serif;color:#5C5C5C}
.reg p b{color:#1F1F1F;font-weight:800;text-align:right}
.tbl{position:absolute;left:70px;width:640px;border-radius:26px;background:#fff;overflow:hidden;box-shadow:0 24px 50px -24px rgba(31,31,31,.4)}
.tbl .th{display:grid;grid-template-columns:1.1fr 1.6fr 1fr;padding:18px 22px;background:#1F1F1F;color:#FFC107;font:800 24px/1 "Montserrat",sans-serif}
.tbl .tr2{display:grid;grid-template-columns:1.1fr 1.6fr 1fr;padding:18px 22px;border-top:2px solid #EFEFEF;font:600 24px/1.2 "Inter",sans-serif;color:#1F1F1F}
.dl{position:absolute;left:70px;display:flex;align-items:center;gap:14px;padding:22px 30px;border-radius:999px;background:#25A55F;color:#fff;font:800 34px/1 "Montserrat",sans-serif;box-shadow:0 16px 32px -14px rgba(0,0,0,.4)}
.dl i{width:46px;height:46px}
"""
def phone(id_, style, inner):
    return f'<div id="{id_}" class="ph" style="{style}"><div class="pscr"><div class="bar"><img src="assets/brand/pascal-sign-logo.webp" alt="">Pascal Sign</div>{inner}</div></div>'
STEPS = [('printer', 'Imprime'), ('pen', 'Firma'), ('scan', 'Escanea'), ('upload', 'Envía')]
S = []
S.append(('k01', 'td', .4, """
#X-t{top:200px;font-size:64px}
#X-big{top:960px;left:70px;right:auto;width:540px;text-align:left;font-size:68px}
#X-c{left:620px;height:860px}
""", CHS('Así se firma hoy') + '<img id="X-c" class="ch" src="assets/chars/hernando-papeles.webp" alt=""><h1 id="X-t" class="h w">Firmar <span class="yy">a la antigua</span></h1>'
 + ''.join(f'<div id="X-s{i}" class="stp" style="left:{40 + (i % 2) * 260}px;top:{430 + (i // 2) * 270}px"><i>{icon(ic, "#BDBDBD")}</i>{t}</div>' for i, (ic, t) in enumerate(STEPS))
 + '<p id="X-big" class="big abs">Media mañana<br>perdida</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
""" + ''.join(f'tl.from("#X-s{i}",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)"}},{s + d * (.2 + i * .14):.2f});\ntl.to("#X-s{i}",{{color:"#FFC107",duration:.2}},{s + d * (.2 + i * .14):.2f});\n' for i in range(4)) + f"""tl.from("#X-big",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .8:.2f});"""))
SC = [('bell', 'Correo', 80, 440, -6), ('chat', 'Chat', 420, 470, 5), ('people', 'Chat grupal', 120, 760, 4), ('folder', 'Descargas', 450, 800, -5)]
S.append(('k02', 'td', .4, """
#X-t{top:200px;font-size:62px}
#X-cp{left:70px;width:600px;top:1000px;text-align:left;font:800 54px/1.1 "Montserrat",sans-serif;color:#FF5A5A}
#X-c{left:700px;height:780px}
""", CHS('El problema') + '<img id="X-c" class="ch" src="assets/chars/hernando-confundido.webp" alt=""><h1 id="X-t" class="h w">Tu firma, <span class="red">suelta</span></h1>'
 + ''.join(f'<div class="sc X-sc" style="left:{x}px;top:{y}px;transform:rotate({r}deg)"><small><i>{icon(ic, "#757575")}</i>{t}</small>{sig(0)}</div>' for ic, t, x, y, r in SC)
 + '<p id="X-cp" class="abs">Cualquiera la<br>puede copiar</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-sc",{{opacity:0,scale:.3,x:200,duration:.35,ease:"back.out(1.8)",stagger:{d * .12:.2f}}},{s + d * .1:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},{s + d * .3:.2f});
tl.from("#X-cp",{{opacity:0,y:30,duration:.35,ease:"back.out(1.8)"}},{s + d * .6:.2f});"""))
S.append(('k03', 'ty', .45, """
#X-t{top:190px;font-size:60px}
#X-tag{left:70px;top:1290px}
#X-fg{left:200px;top:790px}
#X-c{left:600px;height:820px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHS('Forma 1 · Con el dedo') + '<img id="X-c" class="ch" src="assets/chars/valentina-feliz.webp" alt=""><h1 id="X-t" class="h g">Desde el celular, <span class="mk">en segundos</span></h1>'
 + phone('X-ph', 'left:90px;top:380px', '<div class="pdoc"><b>Contrato.pdf</b><s></s><s></s><s style="width:70%"></s></div><div class="pad">' + sig(1, 'X-sg', '', '#1B2A6B', 6) + '</div><div id="X-ok" class="pok">✓ Firmado</div>')
 + '<div id="X-fg" class="fing"></div><div id="X-tag" class="tagw">Firma con el dedo</div><div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-c",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.fromTo(".X-sg path",{{strokeDasharray:1400,strokeDashoffset:1400}},{{strokeDashoffset:0,duration:{d * .4:.2f},ease:"none"}},{s + d * .35:.2f});
tl.fromTo("#X-fg",{{x:0,y:0,opacity:0}},{{keyframes:[{{opacity:1,duration:.1}},{{x:120,y:-30,duration:{d * .13:.2f}}},{{x:220,y:20,duration:{d * .13:.2f}}},{{x:300,y:-10,duration:{d * .14:.2f}}},{{opacity:0,duration:.15}}]}},{s + d * .35:.2f});
tl.from("#X-ok",{{opacity:0,scale:.6,duration:.3,ease:"back.out(2.2)"}},{s + d * .78:.2f});
tl.from("#X-tag",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .5:.2f});"""))
S.append(('k04', 'tl', .45, """
#X-t{top:190px;font-size:60px}
#X-tag{left:70px;top:1290px}
#X-c{left:580px;height:860px}
""", CHS('Forma 2 · Sube una imagen') + '<img id="X-c" class="ch" src="assets/chars/andres-muestra.webp" alt=""><h1 id="X-t" class="h g">Desde la calle, <span class="mk">también</span></h1>'
 + phone('X-ph', 'left:90px;top:380px', '<div class="pdoc" style="margin-bottom:0"><b>Elige tu firma</b></div><div class="gal">' + '<div></div>' * 4 + '<div id="X-pk" class="pick">' + sig(2, '', '', '#1B2A6B', 7) + '</div>' + '<div></div>' * 4 + '</div><div id="X-ok" class="pok">✓ Firma cargada</div>')
 + '<div id="X-tag" class="tagw">Sube la imagen de tu firma</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-c",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.fromTo("#X-pk",{{scale:1}},{{scale:1.15,duration:.25,yoyo:true,repeat:1,ease:"sine.inOut"}},{s + d * .45:.2f});
tl.from("#X-ok",{{opacity:0,scale:.6,duration:.3,ease:"back.out(2.2)"}},{s + d * .7:.2f});
tl.from("#X-tag",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .35:.2f});"""))
S.append(('k05', 'tl', .45, """
#X-t{top:190px;font-size:60px}
#X-tag{left:70px;top:1290px}
#X-c{left:600px;height:860px}
""", CHS('Forma 3 · Tómale una foto') + '<img id="X-c" class="ch" src="assets/chars/marcela-idea.webp" alt=""><h1 id="X-t" class="h g">¿Firma en papel? <span class="mk">Foto</span></h1>'
 + phone('X-ph', 'left:90px;top:380px', '<div id="X-cam" class="cam"><div class="paper">' + sig(0, '', '', '#2B2B6B', 6) + '</div>'
   + ''.join(f'<div class="cr" style="{p}"></div>' for p in ['left:40px;top:190px;border-right:0;border-bottom:0', 'right:40px;top:190px;border-left:0;border-bottom:0', 'left:40px;top:500px;border-right:0;border-top:0', 'right:40px;top:500px;border-left:0;border-top:0'])
   + '<div id="X-sh" class="shut"></div></div><div id="X-res" class="res">' + sig(0, '', '', '#1B2A6B', 6) + '<small>✓ Lista para usar</small></div><div id="X-fl" class="abs" style="inset:0;background:#fff;opacity:0"></div>')
 + '<div id="X-tag" class="tagw">Tómale una foto</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-c",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.from("#X-tag",{{opacity:0,x:-200,duration:.35,ease:"back.out(1.8)"}},{s + d * .25:.2f});
tl.to("#X-sh",{{scale:.85,duration:.1,yoyo:true,repeat:1}},{s + d * .5:.2f});
tl.fromTo("#X-fl",{{opacity:0}},{{keyframes:[{{opacity:.9,duration:.08}},{{opacity:0,duration:.3}}]}},{s + d * .52:.2f});
tl.set("#X-cam",{{opacity:0}},{s + d * .56:.2f});
tl.from("#X-res",{{opacity:0,scale:.7,duration:.35,ease:"back.out(2)"}},{s + d * .56:.2f});"""))
S.append(('k06', 'tl', .45, """
#X-t{top:190px;font-size:60px}
#X-ph{left:90px;top:380px}
#X-lk{left:180px;top:620px;width:260px;height:260px;border-radius:50%;background:#1F1F1F;padding:70px;box-shadow:0 0 0 18px rgba(255,193,7,.35)}
#X-lt{left:110px;right:auto;width:400px;top:960px;text-align:center;font:800 40px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
#X-n1{left:600px;top:560px}
#X-n2{left:600px;top:720px}
#X-p{left:600px;height:760px}
""", CHS('Privacidad') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">Solo en <span class="mk">tu dispositivo</span></h1>'
 + phone('X-ph', 'left:90px;top:380px', '') + f'<div id="X-lk" class="abs">{icon("lock", "#FFC107")}</div><p id="X-lt" class="abs">Tus firmas, solo tuyas</p>'
 + f'<div id="X-n1" class="nope"><i>{icon("chat", "#fff")}</i>Chat</div><div id="X-n2" class="nope"><i>{icon("bell", "#fff")}</i>Correo</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-lk",{{scale:0,rotation:-40,duration:.45,ease:"back.out(2)"}},{s + d * .15:.2f});
tl.from("#X-lt",{{opacity:0,y:20,duration:.35}},{s + d * .3:.2f});
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},{s + d * .1:.2f});
tl.from("#X-n1",{{opacity:0,x:200,duration:.35,ease:"back.out(1.8)"}},{s + d * .5:.2f});
tl.from("#X-n2",{{opacity:0,x:200,duration:.35,ease:"back.out(1.8)"}},{s + d * .72:.2f});"""))
REG = [('Fecha', '7 nov. 2026 · 10:42 a. m.'), ('Razón', 'Contrato de servicios'), ('Número único', 'PS-000183')]
S.append(('k07', 'tl', .45, """
#X-t{top:190px;font-size:60px}
#X-rg{top:420px}
""", CHS('Registro') + '<h1 id="X-t" class="h g">Cada firma, <span class="mk">registrada</span></h1>'
 + '<div id="X-rg" class="reg"><h3><img src="assets/brand/pascal-sign-logo.webp" alt="">Registro de firma</h3><div class="sgn">' + sig(1, '', '', '#1B2A6B', 6) + '</div>'
 + ''.join(f'<p id="X-r{i}"><span>{a}</span><b>{b}</b></p>' for i, (a, b) in enumerate(REG)) + '</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-rg",{{opacity:0,y:60,duration:.45,ease:"back.out(1.5)"}},.2);
""" + ''.join(f'tl.from("#X-r{i}",{{opacity:0,x:-60,duration:.3}},{s + d * (.2 + i * .25):.2f});\ntl.fromTo("#X-r{i}",{{background:"#FFF3C4"}},{{background:"#FFFFFF",duration:.8}},{s + d * (.2 + i * .25):.2f});\n' for i in range(3))))
ROWS = [('7 nov.', 'Contrato de servicios', 'PS-000183'), ('5 nov.', 'Acta de entrega', 'PS-000182'), ('2 nov.', 'Cuenta de cobro', 'PS-000181'), ('29 oct.', 'Autorización', 'PS-000180')]
S.append(('k08', 'tl', .45, """
#X-t{top:190px;font-size:62px}
#X-tb{top:430px}
#X-dl{top:900px}
#X-p{left:620px;height:900px}
""", CHS('Control total') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">Descarga <span class="mk">el detallado</span></h1>'
 + '<div id="X-tb" class="tbl"><div class="th"><span>Fecha</span><span>Razón</span><span>Número</span></div>' + ''.join(f'<div class="tr2 X-r"><span>{a}</span><span>{b}</span><span>{c}</span></div>' for a, b, c in ROWS) + '</div>'
 + f'<div id="X-dl" class="dl"><i>{icon("upload", "#fff")}</i>Descargar detallado</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-tb",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},.2);
tl.from(".X-r",{{opacity:0,x:-40,duration:.25,stagger:.15}},.5);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.from("#X-dl",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.to("#X-dl",{{scale:1.05,duration:.35,yoyo:true,repeat:{k(D, s + d * .4 + .45, .35)},ease:"sine.inOut"}},{s + d * .4 + .45:.2f});"""))
S.append(('k09', 'tl', 2.4, """
#X-t{top:170px;font-size:60px}
#X-qr{left:560px;top:420px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:14px;font:800 30px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:980px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 40px/1.1 "Montserrat",sans-serif}
#X-by{left:540px;top:1150px;width:500px;text-align:center;font:800 30px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:60px;height:60px;border-radius:14px}
#X-p{left:10px;height:1000px}
""", CHS('Pascal Sign') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h g">Deja de imprimir<br><span class="mk">para firmar</span></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascal-sign.svg" alt=""><b>Escanea y pruébalo</b></div><div id="X-demo" class="abs">7 días gratis</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/pascal-sign-logo.webp" alt=""><em style="font-style:normal">Pascal Sign · Pascal<span style="color:#A87600">IA</span></em></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:-500,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-qr",{{scale:.5,opacity:0,duration:.45,ease:"back.out(1.8)"}},{s + d * .25:.2f});
tl.from("#X-demo",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .4:.2f});
tl.to("#X-demo",{{scale:1.06,duration:.35,yoyo:true,repeat:{k(D, s + d * .4 + .4, .35)},ease:"sine.inOut"}},{s + d * .4 + .4:.2f});
tl.from("#X-by",{{opacity:0,duration:.35}},{s + d * .75:.2f});"""))

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
