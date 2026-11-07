# Builds "CuentaFácil · Sin sustos de último día": month-end panic vs. daily WhatsApp reports, supports review, draft approval and a ZIP for SECOP.
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

CHC = lambda t: f'<div class="chip3"><span><img src="assets/brand/cuentafacil-logo.webp" alt="" style="border-radius:10px">{t}</span></div>'
EXTRA2 = EXTRA2 + """
.cfcal{position:absolute;width:300px;border-radius:30px;background:#fff;overflow:hidden;text-align:center;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
.cfcal b{display:block;padding:14px;background:#E5484D;color:#fff;font:800 32px/1 "Montserrat",sans-serif}
.cfcal span{display:block;padding:16px 0 22px;font:800 150px/1 "Montserrat",sans-serif;color:#1F1F1F}
.cfthink{position:absolute;padding:26px 32px;border-radius:40px;background:#fff;font:800 40px/1.15 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -20px rgba(0,0,0,.6)}
.cfthink:after{content:"";position:absolute;right:60px;bottom:-34px;width:36px;height:36px;border-radius:50%;background:#fff}
.cfitem{position:absolute;left:70px;width:620px;display:flex;align-items:center;gap:18px;padding:20px 24px;border-radius:24px;background:#2A2A2A;box-shadow:inset 0 0 0 3px #3A3A3A;font:800 34px/1.1 "Montserrat",sans-serif;color:#fff}
.cfitem i{flex:none;width:60px;height:60px;border-radius:16px;background:#3A3A3A;padding:13px}
.cfstamp{position:absolute;left:0;right:0;text-align:center}
.cfstamp span{display:inline-block;padding:14px 34px;border:9px solid #FF5A5A;border-radius:22px;color:#FF5A5A;font:800 72px/1 "Montserrat",sans-serif;transform:rotate(-7deg);background:rgba(11,11,11,.6)}
.vn{display:flex;align-items:center;gap:14px}
.vn em{font-style:normal;width:44px;height:44px;border-radius:50%;background:#E9EDEF;color:#005C4B;display:grid;place-items:center;font-size:20px}
.vn i{display:flex;align-items:center;gap:4px;height:40px}
.vn i s{display:block;width:6px;border-radius:3px;background:#CFE9E2;text-decoration:none}
.obl{position:absolute;left:70px;right:70px;padding:22px 26px;border-radius:26px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE,0 20px 40px -20px rgba(31,31,31,.35)}
.obl h4{margin:0 0 14px;font:800 30px/1.15 "Montserrat",sans-serif;color:#1F1F1F}
.obl h4 em{font-style:normal;color:#A87600}
.obl .ac{display:inline-block;margin:0 10px 10px 0;padding:10px 18px;border-radius:999px;background:#F2F7F4;color:#1E7B45;font:700 25px/1.1 "Inter",sans-serif}
.cfbadge{position:absolute;left:70px;right:70px;padding:22px;border-radius:24px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 36px/1.2 "Montserrat",sans-serif}
.sup{position:absolute;left:70px;width:640px;display:flex;align-items:center;gap:20px;padding:22px 26px;border-radius:26px;background:#fff;box-shadow:0 20px 40px -20px rgba(31,31,31,.35)}
.sup i{flex:none;width:76px;height:76px;border-radius:22px;background:#FFC107;padding:17px}
.sup b{display:block;font:800 32px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.sup small{display:block;margin-top:6px;font:700 25px/1.2 "Inter",sans-serif;color:#1E7B45}
.sup .ck{margin-left:auto;flex:none;width:58px;height:58px;border-radius:50%;background:#25A55F;padding:13px}
.dcard{position:absolute;width:300px;padding:22px;border-radius:20px;background:#fff;box-shadow:0 20px 40px -18px rgba(31,31,31,.45)}
.dcard b{display:block;font:800 26px/1.15 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:12px}
.dcard s{display:block;height:11px;border-radius:6px;background:#E3E3E3;margin-bottom:10px;text-decoration:none}
.dcard em{display:inline-block;margin-top:6px;padding:8px 14px;border-radius:999px;background:#FFF3C4;color:#8A5A00;font:800 20px/1 "Montserrat",sans-serif;font-style:normal}
.zipc{position:absolute;left:290px;top:520px;width:500px;padding:36px;border-radius:40px;background:#fff;text-align:center;box-shadow:inset 0 0 0 4px #25A55F,0 30px 60px -24px rgba(31,31,31,.4)}
.zipc i{display:block;margin:0 auto 18px;width:150px;height:150px;border-radius:40px;background:#FFC107;padding:36px}
.zipc b{display:block;font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
.zipc small{display:block;margin-top:10px;font:700 26px/1.2 "Inter",sans-serif;color:#5C5C5C}
.zf{position:absolute;padding:14px 22px;border-radius:16px;background:#fff;font:700 25px/1 "Inter",sans-serif;color:#1F1F1F;box-shadow:0 12px 24px -12px rgba(31,31,31,.4)}
.secop{position:absolute;left:190px;right:190px;top:1080px;padding:24px;border-radius:999px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif}
.pr{position:absolute;left:70px;width:620px;padding:30px;border-radius:32px}
.pr b{display:block;font:800 44px/1.1 "Montserrat",sans-serif}
.pr small{display:block;margin-top:10px;font:700 28px/1.3 "Inter",sans-serif}
"""
S = []
S.append(('m01', 'td', .4, """
#X-cal{left:80px;top:430px}
#X-clk{left:420px;top:450px;font:800 96px/1 "Montserrat",sans-serif;color:#FFC107}
#X-clk small{display:block;margin-top:10px;font:700 34px/1 "Inter",sans-serif;color:#CFCFCF}
#X-th{left:70px;top:800px;width:560px}
#X-c{left:520px;height:880px}
""", CHC('CuentaFácil') + '<img id="X-c" class="ch" src="assets/chars/contratista-desespero.webp" alt="">'
 + '<div id="X-cal" class="cfcal"><b>Noviembre</b><span>30</span></div><div id="X-clk" class="abs">11:00<small>p. m. · último día</small></div>'
 + '<div id="X-th" class="cfthink">¿Qué hice el día 4? 😰</div>',
 lambda D, s, d: f"""tl.from("#X-cal",{{opacity:0,scale:.5,rotation:-10,duration:.4,ease:"back.out(1.8)"}},{s:.2f});
tl.from("#X-clk",{{opacity:0,x:200,duration:.4,ease:"back.out(1.8)"}},{s + d * .2:.2f});
tl.from("#X-c",{{y:700,duration:.5,ease:"back.out(1.3)"}},.2);
tl.from("#X-th",{{opacity:0,scale:.5,transformOrigin:"80% 100%",duration:.4,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.to("#X-c",{{x:6,duration:.07,yoyo:true,repeat:{k(D, s + d * .7, .07)},ease:"none"}},{s + d * .7:.2f});"""))
ITEMS = [('doc', 'Informe de actividades'), ('money', 'Cuenta de cobro'), ('pulse', 'Planilla de seguridad social'), ('shield', 'Antecedentes'), ('file-check', 'Certificados de afiliación')]
S.append(('m02', 'td', .4, """
#X-t{top:200px;font-size:64px}
#X-st{top:1230px}
#X-pp{left:720px;top:600px;width:300px}
""", CHC('CuentaFácil') + '<h1 id="X-t" class="h w">Todo <span class="red">para mañana</span></h1>'
 + ''.join(f'<div class="cfitem X-i" style="top:{420 + i * 150}px"><i>{icon(ic, "#FFC107")}</i>{t}</div>' for i, (ic, t) in enumerate(ITEMS))
 + '<img id="X-pp" class="abs" src="assets/objs/papeles.webp" alt=""><div id="X-st" class="cfstamp"><span>¡AFÁN!</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-i",{{opacity:0,x:-300,duration:.3,ease:"back.out(1.6)",stagger:{d * .13:.2f}}},{s + d * .05:.2f});
tl.from("#X-pp",{{opacity:0,y:300,duration:.45,ease:"back.out(1.4)"}},{s + d * .3:.2f});
tl.to("#X-pp",{{rotation:4,duration:.15,yoyo:true,repeat:{k(D, s + d * .5, .15)},ease:"sine.inOut"}},{s + d * .5:.2f});
tl.from("#X-st",{{opacity:0,scale:2.4,duration:.3,ease:"power4.in"}},{s + d * .8:.2f});"""))
VN = '<span class="vn"><em>▶</em><i>' + ''.join(f'<s style="height:{h}px"></s>' for h in (10, 22, 30, 16, 34, 24, 12, 28, 36, 18, 26, 14, 30, 20, 10)) + '</i>0:18</span>'
S.append(('m03', 'ty', .45, """
#X-t{top:190px;font-size:62px}
#X-p{left:600px;height:820px}
#X-flash{inset:0;background:#fff;opacity:0}
""", CHC('Reporte diario') + '<img id="X-p" class="ch" src="assets/chars/pascal-celular.webp" alt=""><h1 id="X-t" class="h g">Cada día, <span class="mk">por WhatsApp</span></h1>'
 + chat('X-ph', 'left:70px;top:400px;width:700px', [
   ('X-m1', True, 'Hoy hice 3 visitas de seguimiento y actualicé la base de datos 📋', '5:42 p. m. <b>✓✓</b>'),
   ('X-m2', True, VN, '5:44 p. m. <b>✓✓</b>'),
   ('X-m3', False, '¡Anotado! 🙌 Lo registro en tus obligaciones 2 y 4. ¿Algo más por hoy?', '5:44 p. m.')], 'Pascal · CuentaFácil', 'en línea')
 + '<div id="X-flash" class="abs"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-flash",{{opacity:1}},{{opacity:0,duration:.4}},0);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(1.6)"}},.1);
tl.from("#X-ph",{{y:900,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.3);
tl.from("#X-m1",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .72:.2f});
tl.from("#X-m3",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .9:.2f});"""))
OBL = [('Obligación 2', 'Realizar seguimiento a los usuarios asignados', ['3 visitas de seguimiento', 'Llamadas de control']), ('Obligación 4', 'Mantener actualizada la información', ['Base de datos actualizada'])]
S.append(('m04', 'tl', .45, """
#X-t{top:190px;font-size:62px}
#X-o0{top:420px}
#X-o1{top:720px}
#X-bd{top:990px}
""", CHC('Tus obligaciones') + '<h1 id="X-t" class="h g">Ordenado <span class="mk">por obligación</span></h1>'
 + ''.join(f'<div id="X-o{i}" class="obl"><h4><em>{a}</em> · {b}</h4>' + ''.join(f'<span class="ac X-ac">✓ {c}</span>' for c in cs) + '</div>' for i, (a, b, cs) in enumerate(OBL))
 + '<div id="X-bd" class="cfbadge">Nada inventado: solo lo que tú le cuentas</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-o0",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},.2);
tl.from("#X-o1",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.5)"}},.4);
tl.from(".X-ac",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)",stagger:{d * .12:.2f}}},{s + d * .15:.2f});
tl.from("#X-bd",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{s + d * .6:.2f});"""))
SUP = [('pulse', 'Planilla de seguridad social', 'Periodo y pago revisados'), ('shield', 'Antecedentes', 'Vigentes'), ('file-check', 'Certificados de afiliación', 'EPS, ARL y pensión')]
S.append(('m05', 'tl', .45, """
#X-t{top:190px;font-size:62px}
#X-p{left:640px;height:860px}
""", CHC('Cierre del mes') + '<img id="X-p" class="ch" src="assets/chars/pascal-senala.webp" alt=""><h1 id="X-t" class="h g">Tus soportes, <span class="mk">revisados</span></h1>'
 + ''.join(f'<div id="X-s{i}" class="sup"><i>{icon(ic)}</i><div><b>{t}</b><small>{sm}</small></div><span class="ck X-ck">{icon("check", "#fff")}</span></div>'.replace('class="sup"', f'class="sup" style="top:{430 + i * 190}px"') for i, (ic, t, sm) in enumerate(SUP)),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},.2);
""" + ''.join(f'tl.from("#X-s{i}",{{opacity:0,x:-300,duration:.35,ease:"back.out(1.6)"}},{s + d * (.15 + i * .2):.2f});\n' for i in range(3)) + f"""tl.from(".X-ck",{{scale:0,duration:.3,ease:"back.out(3)",stagger:.25}},{s + d * .82:.2f});"""))
S.append(('m06', 'tl', .45, """
#X-t{top:190px;font-size:62px}
#X-d1{left:90px;top:420px;transform:rotate(-4deg)}
#X-d2{left:410px;top:440px;transform:rotate(3deg)}
#X-c{left:620px;height:820px}
""", CHC('Tú apruebas') + '<img id="X-c" class="ch" src="assets/chars/contratista-alivio.webp" alt=""><h1 id="X-t" class="h g">Revisas <span class="mk">y apruebas</span></h1>'
 + '<div id="X-d1" class="dcard"><b>Informe de actividades</b><s></s><s></s><s style="width:70%"></s><em>BORRADOR</em></div>'
 + '<div id="X-d2" class="dcard"><b>Cuenta de cobro</b><s></s><s style="width:80%"></s><s></s><em>BORRADOR</em></div>'
 + chat('X-ph', 'left:70px;top:820px;width:640px', [
   ('X-m1', False, 'Tu informe y tu cuenta de cobro están listos. ¿Los revisas? 📄', '6:10 p. m.'),
   ('X-m2', True, '¡Revisado! Aprobado ✅', '6:15 p. m. <b>✓✓</b>')], 'Pascal · CuentaFácil', 'en línea'),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-d1",{{opacity:0,y:200,duration:.4,ease:"back.out(1.5)"}},{s + d * .1:.2f});
tl.from("#X-d2",{{opacity:0,y:200,duration:.4,ease:"back.out(1.5)"}},{s + d * .25:.2f});
tl.from("#X-ph",{{y:700,opacity:0,duration:.45,ease:"power3.out"}},{s + d * .4:.2f});
tl.from("#X-m2",{{opacity:0,scale:.7,duration:.3,ease:"back.out(2)"}},{s + d * .78:.2f});
tl.from("#X-c",{{x:500,duration:.5,ease:"power3.out"}},{s + d * .5:.2f});"""))
ZF = [('Informe.pdf', 90, 440), ('Cuenta de cobro.pdf', 700, 460), ('Planilla.pdf', 60, 900), ('Antecedentes.pdf', 720, 920)]
S.append(('m07', 'tl', .5, """
#X-t{top:190px;font-size:62px}
""", CHC('Listo') + '<h1 id="X-t" class="h g">Todo en <span class="mk">un solo archivo</span></h1>'
 + ''.join(f'<div class="zf X-f" style="left:{x}px;top:{y}px">📄 {t}</div>' for t, x, y in ZF)
 + f'<div id="X-z" class="zipc"><i>{icon("zip")}</i><b>Cuenta de noviembre.zip</b><small>Informe, cuenta de cobro y soportes</small></div>'
 + '<div id="X-sc" class="secop">Listo para cargar en el SECOP</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from(".X-f",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2)",stagger:.12}},.2);
tl.to(".X-f",{{x:(i)=>[300,-220,320,-240][i],y:(i)=>[200,180,-160,-180][i],scale:.3,opacity:0,duration:.5,ease:"power2.in",stagger:.08}},{s + d * .25:.2f});
tl.from("#X-z",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .4:.2f});
tl.from("#X-sc",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{s + d * .7:.2f});"""))
S.append(('m08', 'tl', .5, """
#X-t{top:190px;font-size:62px}
#X-a{top:430px;background:#1F1F1F}
#X-a b{color:#FFC107}
#X-a small{color:#fff}
#X-b{top:720px;background:#fff;box-shadow:inset 0 0 0 3px #F3E7BE}
#X-b b{color:#1F1F1F}
#X-b small{color:#5C5C5C}
#X-p{left:640px;height:880px}
""", CHC('CuentaFácil') + '<img id="X-p" class="ch" src="assets/chars/pascal-muestra.webp" alt=""><h1 id="X-t" class="h g">Tú firmas, <span class="mk">tú decides</span></h1>'
 + '<div id="X-a" class="pr"><b>Tú</b><small>Eres responsable de lo que firmas y apruebas cada documento.</small></div>'
 + '<div id="X-b" class="pr"><b>Pascal</b><small>Organiza, calcula, redacta borradores y te quita el afán.</small></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.35,ease:"back.out(1.8)"}},0);
tl.from("#X-a",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.6)"}},{s:.2f});
tl.from("#X-b",{{opacity:0,x:-300,duration:.4,ease:"back.out(1.6)"}},{s + d * .55:.2f});
tl.from("#X-p",{{x:500,duration:.5,ease:"power3.out"}},{s + d * .5:.2f});"""))
S.append(('m09', 'tl', 2.4, """
#X-t{top:170px;font-size:60px}
#X-qr{left:560px;top:420px;width:460px;padding:28px 28px 20px;border-radius:36px;background:#fff;text-align:center;box-shadow:inset 0 0 0 3px #E9E9E9,0 24px 50px -24px rgba(31,31,31,.35)}
#X-qrc{position:relative;width:404px;height:404px}
#X-qrc > img:first-child{display:block;width:100%;height:100%}
#X-ql{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:30px;box-shadow:0 0 0 8px #fff}
#X-qr b{display:block;margin-top:14px;font:800 30px/1 "Montserrat",sans-serif;color:#1F1F1F}
#X-demo{left:560px;top:980px;width:460px;padding:24px;border-radius:28px;background:#1F1F1F;color:#FFC107;text-align:center;font:800 38px/1.1 "Montserrat",sans-serif}
#X-by{left:540px;top:1150px;width:500px;text-align:center;font:800 32px/1 "Montserrat",sans-serif;color:#1F1F1F;display:flex;justify-content:center;align-items:center;gap:12px}
#X-by img{width:60px;height:60px;border-radius:14px}
#X-p{left:10px;height:1000px}
""", CHC('CuentaFácil') + '<img id="X-p" class="ch" src="assets/chars/pascal-entra.webp" alt=""><h1 id="X-t" class="h g">Sin sustos de<br><span class="mk">último día</span></h1>'
 + '<div id="X-qr" class="abs"><div id="X-qrc"><img src="assets/brand/qr-cuentafacil.svg" alt=""><img id="X-ql" src="assets/brand/cuentafacil-logo.webp" alt=""></div><b>Escanea y empieza hoy</b></div><div id="X-demo" class="abs">Tu cuenta de cobro, lista</div>'
 + '<div id="X-by" class="abs"><img src="assets/brand/cuentafacil-logo.webp" alt=""><em style="font-style:normal">CuentaFácil · Pascal<span style="color:#A87600">IA</span></em></div>',
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
