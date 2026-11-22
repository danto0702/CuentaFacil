# Builds "¿Por qué todo se manda en PDF?": a general-information short (5 verified facts about PDF) with a hook,
# a retention promise (the last fact explains why editing a PDF is a nightmare) and PascalPDF Studio only at the end.
# Same format as videos/firma-garabato (reuses its CSS and helpers). Everything drawn with code.
# Facts (checked 2026-11-22): Adobe estimates >3 trillion PDFs (2023); John Warnock's Camelot paper (1990/1991);
# PDF = Portable Document Format; Reader was paid at first, then given away; ISO 32000-1 (2008); PDF/A (ISO 19005) for
# long-term archiving; PDF stores positioned text runs, not paragraphs, so edits don't reflow.
import os, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('fg', os.path.join(ROOT, '..', 'firma-garabato', 'tools', 'build.py'))
fg = importlib.util.module_from_spec(spec); spec.loader.exec_module(fg)
page, chunks, dchip, svg_sig, draw, icon = fg.page, fg.chunks, fg.dchip, fg.svg_sig, fg.draw, fg.icon

VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = shown

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n]) / 16)

Y = '#FFC107'; RD = '#E5484D'
def pdfi(id_, style='', cls=''):
    return f'<div id="{id_}" class="pdfi {cls}" style="{style}"><i></i><b>PDF</b></div>'

CSS = fg.CSS + f"""
.pdfi{{position:absolute;width:120px;height:150px;border-radius:12px 34px 12px 12px;background:#fff;box-shadow:0 14px 30px -12px rgba(0,0,0,.7)}}
.pdfi i{{position:absolute;right:0;top:0;width:34px;height:34px;border-radius:0 12px 0 12px;background:#E3E3E3}}
.pdfi b{{position:absolute;left:-10px;bottom:22px;padding:8px 12px;border-radius:8px;background:{RD};color:#fff;font:800 30px/1 "Montserrat",sans-serif}}
.cnt{{position:absolute;left:0;right:0;text-align:center;font:800 112px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:-.03em;text-shadow:0 0 40px rgba(255,193,7,.45);font-variant-numeric:tabular-nums}}
.crt{{position:absolute;width:400px;height:420px}}
.crt .mn{{position:absolute;left:0;right:0;top:0;height:330px;border-radius:30px;background:linear-gradient(180deg,#E8E1CF,#CFC6AE);box-shadow:inset 0 -10px 0 rgba(0,0,0,.08),0 24px 40px -20px rgba(0,0,0,.7)}}
.crt .sc{{position:absolute;left:34px;right:34px;top:30px;height:240px;border-radius:18px;background:#F7F7F2;box-shadow:inset 0 0 0 6px #3A3A3A;padding:26px 28px;overflow:hidden}}
.crt .ft{{position:absolute;left:120px;right:120px;top:330px;height:40px;background:#BDB49C}}
.crt .bs{{position:absolute;left:60px;right:60px;top:370px;height:30px;border-radius:10px;background:#CFC6AE}}
.crt h5{{margin:0 0 12px;font:800 32px/1 "Montserrat",sans-serif;color:#1F1F1F}}
.crt p{{margin:0;font:600 22px/1.4 "Inter",sans-serif;color:#3A3A3A}}
.crt.bad h5{{font:700 40px/1 "DejaVu Serif",serif;letter-spacing:.3em;color:#7A2E2E;transform:rotate(-3deg)}}
.crt.bad p{{font:400 26px/1.1 "DejaVu Sans Mono",monospace;color:#7A2E2E;letter-spacing:.2em;word-break:break-all}}
.crt.bad .sc{{background:#F2EDE4}}
.acr{{position:absolute;left:150px;display:flex;align-items:baseline;gap:4px;font:800 120px/1 "Montserrat",sans-serif;color:{Y}}}
.acr span{{font:800 64px/1 "Montserrat",sans-serif;color:#fff}}
.dev{{position:absolute;top:1000px;width:280px;text-align:center}}
.dev .bx{{margin:0 auto;border-radius:20px;background:#fff;box-shadow:0 20px 40px -18px rgba(0,0,0,.7);padding:18px}}
.dev .bx s{{display:block;height:10px;border-radius:5px;background:#E3E3E3;margin:10px 0}}
.dev .bx b{{display:block;height:16px;width:60%;border-radius:5px;background:#1F1F1F;margin:0 auto 12px}}
.dev em{{display:inline-block;margin-top:16px;padding:8px 16px;border-radius:999px;background:#25A55F;color:#fff;font:800 26px/1 "Montserrat",sans-serif;font-style:normal}}
.box{{position:absolute;left:290px;top:420px;width:500px;height:500px;border-radius:50px;background:#1A1A1F;box-shadow:inset 0 0 0 4px #3A3A44,0 30px 60px -20px rgba(0,0,0,.8);display:grid;place-items:center}}
.box .pdfi{{position:relative;width:200px;height:250px}}
.box .pdfi b{{font-size:48px;bottom:36px}}
.tagp{{position:absolute;left:640px;top:360px;padding:18px 28px;border-radius:16px;background:#fff;color:#1F1F1F;font:800 60px/1 "Montserrat",sans-serif;transform:rotate(12deg);box-shadow:0 20px 40px -14px rgba(0,0,0,.7)}}
.tagp:before{{content:"";position:absolute;left:-18px;top:50%;width:24px;height:24px;margin-top:-12px;border-radius:50%;background:#1A1A1F;box-shadow:inset 0 0 0 5px #fff}}
.free{{position:absolute;left:180px;top:560px;padding:20px 40px;border:12px solid #25A55F;border-radius:24px;color:#25A55F;background:rgba(10,10,13,.85);font:800 120px/1 "Montserrat",sans-serif;transform:rotate(-12deg)}}
.ppl{{position:absolute;left:0;right:0;top:1030px;text-align:center;font-size:66px;line-height:1.15;letter-spacing:6px}}
.iso{{position:absolute;left:190px;top:330px;width:700px;padding:36px;border-radius:36px;background:#16161B;box-shadow:inset 0 0 0 3px {Y},0 0 60px rgba(255,193,7,.25);text-align:center}}
.iso b{{display:block;white-space:nowrap;font:800 84px/1 "Montserrat",sans-serif;color:#fff}}
.iso small{{display:block;margin-top:12px;font:700 36px/1.2 "Inter",sans-serif;color:{Y}}}
.vault{{position:absolute;left:150px;top:760px;width:780px;height:420px;border-radius:40px;background:#16161B;box-shadow:inset 0 0 0 3px #3A3A44;display:flex;align-items:center;gap:40px;padding:0 50px}}
.vault .pdfi{{position:relative;flex:none;width:170px;height:212px}}
.vault .pdfi b{{font-size:34px;bottom:30px}}
.yr{{font:800 110px/1 "Montserrat",sans-serif;color:{Y};font-variant-numeric:tabular-nums}}
.yr small{{display:block;margin-top:10px;font:700 34px/1.2 "Inter",sans-serif;color:#CFCFCF}}
.sheet{{position:absolute;left:90px;top:400px;width:900px;height:900px;border-radius:20px;background:#fff;box-shadow:0 30px 70px -20px rgba(0,0,0,.8)}}
.sheet .gd{{position:absolute;inset:0;border-radius:20px;background-image:linear-gradient(rgba(229,72,77,.18) 2px,transparent 2px),linear-gradient(90deg,rgba(229,72,77,.18) 2px,transparent 2px);background-size:60px 60px;opacity:0}}
.run{{position:absolute;font:600 44px/1 "Inter",sans-serif;color:#1F1F1F;white-space:nowrap}}
.run.hl{{outline:3px dashed {RD};outline-offset:6px;border-radius:4px}}
.xy{{position:absolute;padding:6px 10px;border-radius:8px;background:{RD};color:#fff;font:700 22px/1 ui-monospace,Menlo,monospace;white-space:nowrap}}
.okw{{position:absolute;left:0;right:0;top:1180px;text-align:center}}
.okw span{{display:inline-flex;align-items:center;gap:12px;padding:18px 32px;border-radius:999px;background:#25A55F;color:#fff;font:800 40px/1 "Montserrat",sans-serif}}
.tag2{{position:absolute;padding:10px 20px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}}
.cur{{display:inline-block;width:4px;height:46px;background:#1F1F1F;vertical-align:-8px}}
"""

# paragraph runs used in p07–p09: (text, x, y) inside the 900×900 sheet
RUNS = [('Por medio del presente', 70, 90), ('documento hago constar', 70, 160), ('que el contratista', 70, 230),
        ('cumplió con las', 70, 300), ('obligaciones pactadas', 70, 370), ('durante el periodo.', 70, 440)]
def sheet(id_, runs, labels=False, extra=''):
    h = f'<div id="{id_}" class="sheet"><div id="{id_}-gd" class="gd"></div>'
    for j, (t, x, y) in enumerate(runs):
        h += f'<span id="{id_}-r{j}" class="run" style="left:{x}px;top:{y}px">{t}</span>'
        if labels:
            h += f'<span id="{id_}-x{j}" class="xy" style="left:640px;top:{y + 8}px" data-layout-allow-overlap>x:{x} y:{y}</span>'
    return h + extra + '</div>'

S = []
S.append(('p01', 'dk', .3, """
#X-n{top:330px}
#X-u{top:490px}
#X-t{top:1040px;font-size:88px}
""", '<p id="X-n" class="cnt">+0,0 billones</p><p id="X-u" class="sub">de PDF en el mundo</p>'
 + ''.join(pdfi(f'X-f{j}', f'left:{60 + (j % 6) * 165}px;top:{640 + (j // 6) * 190}px;transform:rotate({(-8, 5, -3, 7, -6, 4)[j % 6]}deg)') for j in range(12))
 + '<h1 id="X-t" class="q">¿Por qué todo se<br>manda en <em>PDF</em>?</h1>',
 lambda D, s, d: f"""const X_n={{v:0}};
tl.to(X_n,{{v:3,duration:1.4,ease:"power2.out",onUpdate:()=>{{const v=X_n.v;document.querySelector("#X-n").textContent=v>=2.995?"+3 billones":"+"+v.toFixed(1).replace(".",",")+" billones"}}}},.05);
tl.from("#X-u",{{opacity:0,y:30,duration:.35}},.3);
tl.from("[id^='X-f']",{{opacity:0,y:-500,rotation:40,duration:.45,ease:"bounce.out",stagger:.06}},.2);
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.45,ease:"power3.out"}},{s + d * .5:.2f});"""))

S.append(('p02', 'dk', .3, """
#X-t{top:300px;font-size:82px}
#X-ln{top:719px}
#X-k{top:930px}
""", '<h1 id="X-t" class="q"><em>5</em> datos<br>sobre el PDF</h1><div id="X-ln" class="tline"></div>'
 + ''.join(f'<div id="X-d{j}" class="tdot{" hot" if j == 5 else ""}" style="left:{130 + (j - 1) * 205}px;top:664px">{"😩" if j == 5 else j}</div>' for j in range(1, 6))
 + '<p id="X-k" class="note">El <b>dato 5</b> explica por qué editar un PDF es una pesadilla</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-ln",{{scaleX:0,transformOrigin:"0 50%",duration:.5,ease:"power2.out"}},{s + d * .1:.2f});
tl.from(["#X-d1","#X-d2","#X-d3","#X-d4"],{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)",stagger:.1}},{s + d * .15:.2f});
tl.from("#X-d5",{{opacity:0,scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)"}},{s + d * .45:.2f});
tl.to("#X-d5",{{scale:1.15,duration:.25,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .6:.2f});
tl.from("#X-k",{{opacity:0,y:30,duration:.4,ease:"power2.out"}},{s + d * .45:.2f});"""))

DOC_OK = '<h5>CONTRATO</h5><p>Por medio del presente documento hago constar…</p>'
S.append(('p03', 'dk', .3, """
#X-t{top:240px;font-size:76px}
#X-m1{left:90px;top:480px}
#X-m2{left:590px;top:480px}
#X-ne{left:205px;top:930px;background:#25A55F;color:#fff}
#X-nb{left:690px;top:930px;background:#E5484D;color:#fff}
#X-cm{top:1130px}
""", dchip(1, 'Los años 90') + '<h1 id="X-t" class="q">El mismo archivo…<br><em>dos resultados</em></h1>'
 + f'<div id="X-m1" class="crt"><div class="mn"></div><div class="sc">{DOC_OK}</div><div class="ft"></div><div class="bs"></div></div>'
 + '<div id="X-m2" class="crt bad"><div class="mn"></div><div class="sc"><h5>C0NTR@T0</h5><p>P#r m3d1o d∃l pr€s€nte d0cum…</p></div><div class="ft"></div><div class="bs"></div></div>'
 + '<span id="X-ne" class="tag2 tagx">Computador A</span><span id="X-nb" class="tag2 tagx">Computador B 😱</span>'
 + '<p id="X-cm" class="pill y"><span>🏰 Proyecto Camelot · John Warnock (Adobe)</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from(["#X-m1","#X-ne"],{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .25:.2f});
tl.from(["#X-m2","#X-nb"],{{opacity:0,x:300,duration:.45,ease:"power3.out"}},{s + d * .35:.2f});
tl.to("#X-m2",{{x:10,duration:.06,yoyo:true,repeat:7}},{s + d * .5:.2f});
tl.from("#X-cm",{{opacity:0,y:40,scale:.6,duration:.45,ease:"back.out(2)"}},{s + d * .75:.2f});"""))

DEV = lambda id_, x, w, h, lab: (f'<div id="{id_}" class="dev" style="left:{x}px"><div class="bx" style="width:{w}px;height:{h}px"><b></b><s></s><s style="width:80%"></s><s></s><s style="width:60%"></s></div><em>✓ {lab}</em></div>')
S.append(('p04', 'dk', .3, """
#X-a1{top:300px}#X-a2{top:480px}#X-a3{top:660px}
#X-es{top:860px}
.tag2{position:absolute;padding:10px 20px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}
""", dchip(2, 'El nombre')
 + '<p id="X-a1" class="acr">P<span>ortable</span></p><p id="X-a2" class="acr">D<span>ocument</span></p><p id="X-a3" class="acr">F<span>ormat</span></p>'
 + '<p id="X-es" class="lat" style="color:#E6E6E6;letter-spacing:.06em">= formato de documento portátil</p>'
 + DEV('X-v1', 60, 240, 180, 'Pantalla') + DEV('X-v2', 400, 150, 260, 'Celular') + DEV('X-v3', 740, 200, 260, 'Impresora'),
 lambda D, s, d: f"""tl.from(["#X-a1","#X-a2","#X-a3"],{{opacity:0,x:-200,duration:.4,ease:"back.out(1.8)",stagger:.18}},{s:.2f});
tl.from("#X-es",{{opacity:0,y:20,duration:.35}},{s + d * .3:.2f});
tl.from(["#X-v1","#X-v2","#X-v3"],{{opacity:0,y:120,scale:.8,duration:.4,ease:"back.out(1.8)",stagger:.15}},{s + d * .45:.2f});"""))

S.append(('p05', 'dk', .3, """
#X-t{top:240px;font-size:74px}
#X-fr{opacity:1}
""", dchip(3, 'El truco') + '<h1 id="X-t" class="q">El lector… <em>se cobraba</em></h1>'
 + '<div id="X-bx" class="box">' + pdfi('X-pf') + '</div><div id="X-tg" class="tagp">$ 💸</div>'
 + '<div id="X-fr" class="free" data-layout-allow-overlap>GRATIS</div><p id="X-pp" class="ppl">👩‍💼🧑‍🎓👨‍🔧👩‍⚕️🧑‍💻<br>👨‍🌾👩‍🏫🧑‍⚖️👨‍🍳👩‍🔬</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-bx",{{opacity:0,scale:.7,duration:.45,ease:"back.out(1.8)"}},.15);
tl.from("#X-tg",{{opacity:0,y:-200,rotation:-40,duration:.5,ease:"bounce.out"}},{s + d * .15:.2f});
tl.to("#X-tg",{{opacity:0,y:300,rotation:60,duration:.4,ease:"power2.in"}},{s + d * .42:.2f});
tl.from("#X-fr",{{opacity:0,scale:2.6,duration:.3,ease:"power4.in"}},{s + d * .45:.2f});
tl.from("#X-pp",{{opacity:0,y:60,scale:.6,duration:.5,ease:"back.out(1.8)"}},{s + d * .72:.2f});"""))

S.append(('p06', 'dk', .3, """
#X-y0{opacity:1}
""", dchip(4, 'Para siempre') + '<div id="X-is" class="iso"><b>🌎 ISO 32000</b><small>Estándar internacional · 2008</small></div>'
 + '<div id="X-va" class="vault">' + pdfi('X-pa').replace('<b>PDF</b>', '<b>PDF/A</b>') + '<p id="X-yr" class="yr"><span id="X-y0">2026</span><small>se podrá abrir dentro de décadas</small></p></div>',
 lambda D, s, d: f"""const X_n={{v:2026}};
tl.from("#X-is",{{opacity:0,y:-60,scale:.8,duration:.45,ease:"back.out(1.8)"}},{s:.2f});
tl.from("#X-va",{{opacity:0,y:200,duration:.5,ease:"power3.out"}},{s + d * .4:.2f});
tl.to(X_n,{{v:2076,duration:{d * .35:.2f},ease:"power1.in",onUpdate:()=>{{document.querySelector("#X-y0").textContent=Math.round(X_n.v)}}}},{s + d * .55:.2f});"""))

S.append(('p07', 'lt', .3, """
#X-t{top:200px;font-size:70px}
#X-sh{top:420px}
""", dchip(5, 'La pesadilla') + '<h1 id="X-t" class="q dkq">No guarda párrafos:<br>guarda <em>posiciones</em></h1>' + sheet('X-sh', RUNS, labels=True),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-sh",{{opacity:0,y:200,duration:.5,ease:"power3.out"}},.1);
tl.to("#X-sh-gd",{{opacity:1,duration:.5}},{s + d * .4:.2f});
""" + ''.join(f'tl.set("#X-sh-r{j}",{{className:"run hl"}},{s + d * (.45 + j * .07):.2f});tl.from("#X-sh-x{j}",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)"}},{s + d * (.45 + j * .07):.2f});\n' for j in range(6))))

# p08: one word gets longer and the rest of the line is not pushed: it overlaps and breaks
BROKEN = RUNS
S.append(('p08', 'lt', .3, """
#X-t{top:200px;font-size:72px}
#X-sh{top:420px}
#X-nw{left:70px;top:230px;color:#B42318;background:rgba(229,72,77,.12)}
#X-rest{left:226px;top:230px}
#X-x{left:860px;top:330px}
""", '<h1 id="X-t" class="q dkq">Cambias una palabra…<br>y se <em>descuadra</em></h1>'
 + sheet('X-sh', [r for j, r in enumerate(BROKEN) if j != 2], extra='<span id="X-nw" class="run" data-layout-allow-overlap>que la empresa contratista</span><span id="X-rest" class="run" data-layout-allow-overlap>contratista</span><div id="X-x" class="xx">✕</div>'),
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.set("#X-nw",{{textContent:"que el "}},0);
tl.set("#X-nw",{{textContent:"que la e"}},{s + d * .2:.2f});tl.set("#X-nw",{{textContent:"que la empr"}},{s + d * .26:.2f});
tl.set("#X-nw",{{textContent:"que la empresa"}},{s + d * .32:.2f});tl.set("#X-nw",{{textContent:"que la empresa contr"}},{s + d * .38:.2f});
tl.set("#X-nw",{{textContent:"que la empresa contratista"}},{s + d * .44:.2f});
tl.to("#X-rest",{{rotation:4,y:6,duration:.2}},{s + d * .46:.2f});
tl.to("#X-sh-r2",{{x:24,rotation:-3,duration:.3}},{s + d * .5:.2f});tl.to("#X-sh-r3",{{x:-18,rotation:2,duration:.3}},{s + d * .54:.2f});tl.to("#X-sh-r4",{{x:30,rotation:-2,duration:.3}},{s + d * .58:.2f});
tl.from("#X-x",{{opacity:0,scale:0,rotation:-90,duration:.35,ease:"back.out(2.5)"}},{s + d * .6:.2f});
tl.to("#X-sh",{{x:12,duration:.06,yoyo:true,repeat:7}},{s + d * .62:.2f});"""))

# p09: reconstructed paragraph, edited like Word
FIXED = [('Por medio del presente', 70, 90), ('documento hago constar', 70, 160), ('que la empresa contratista', 70, 230),
         ('cumplió con las obligaciones', 70, 300), ('pactadas durante el periodo.', 70, 370)]
S.append(('p09', 'lt', .3, """
#X-t{top:200px;font-size:72px}
#X-sh{top:420px}
#X-r2{background:rgba(43,255,136,.3);border-radius:6px}
""", '<h1 id="X-t" class="q dkq">Como si fuera<br>un <em>Word</em></h1>'
 + sheet('X-sh', FIXED, extra='<span class="cur" id="X-cu" style="position:absolute;left:640px;top:228px"></span>')
 + '<p id="X-ok" class="okw"><span>✓ El texto se reacomoda solo</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-sh",{{opacity:0,scale:.95,duration:.4,ease:"power3.out"}},.1);
tl.from(["#X-sh-r3","#X-sh-r4"],{{x:-40,opacity:.3,duration:.5,ease:"back.out(2)",stagger:.1}},{s + d * .3:.2f});
tl.to("#X-cu",{{opacity:0,duration:.01,yoyo:true,repeat:{max(1, int(D / .45))},repeatDelay:.44}},0);
tl.from("#X-ok",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .55:.2f});"""))

S.append(('p10', 'qx', 2.4, """
#X-fl{opacity:0}
#X-t{top:570px;font-size:64px}
#X-qr{top:770px}
#X-ak{top:1250px}
#X-ak span{font-size:34px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div><img id="X-lg" class="lg" src="assets/brand/pascalpdf-logo.png" alt="">'
 + '<h1 id="X-t" class="q">Edita y firma tus PDF<br>desde el <em>celular</em></h1>'
 + '<div id="X-qr" class="qr"><img src="assets/brand/qr-pascalpdf.svg" alt=""><b>PascalPDF Studio</b><small>Pruébalo gratis · de PascalIA</small></div>'
 + '<p id="X-ak" class="pill w"><span>📤 Mándaselo a quien pide «¿me lo pasas en Word?»</span></p><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.5,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-lg",{{opacity:0,scale:.4,rotation:-12,duration:.55,ease:"back.out(1.8)"}},.1);
tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{s + d * .1:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .3:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .65:.2f});
tl.to("#X-ak",{{scale:1.05,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .8:.2f});"""))

BG = fg.BG
LEAD = .2

def build():
    fr = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    t = 0.0; rows = []; timing = []
    for n, bg, tail, css, body, jsf in S:
        cid = f'f{n}'; d = round(dur(n), 2); s = LEAD; D = round(s + d + tail, 2)
        caps = ''; cj = ''
        parts = chunks(LINES[n], 40); tot = sum(len(p) for p in parts); c = s
        for j, part in enumerate(parts):
            pd = d * len(part) / tot
            caps += f'<div class="cap"><span id="{cid}-c{j}" style="background:#FFC107;color:#0B0B0F;box-shadow:0 0 24px rgba(255,193,7,.45)">{part}</span></div>'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:1}},{c:.2f});\n'
            cj += f'tl.set("#{cid}-c{j}",{{opacity:0}},{min(D - .05, c + pd + (.3 if j == len(parts) - 1 else 0)):.2f});\n'
            c += pd
        X = cid
        js = jsf(D, s, d).replace('X_n', f'{X}_n')
        html = page(cid, (CSS + css).replace('X-', f'{X}-'), BG[bg] + body.replace('X-', f'{X}-') + caps, js.replace('X-', f'{X}-') + cj)
        html = html.replace('.cap{position:absolute;left:70px;right:70px;bottom:250px;', '.cap{position:absolute;left:70px;right:70px;bottom:290px;')
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
