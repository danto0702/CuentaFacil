# Builds "Tu página web tiene 50 milésimas": a general-information short (5 verified facts about websites) with a hook,
# a retention promise (the last fact costs the most clients) and Pascal Web (PascalIA web design) only at the end.
# Same format as videos/firma-garabato (reuses its CSS and helpers). Drawn with code; the end uses real frames of the
# La Niebla demo site built by Pascal Web (videos/pascal-web-niebla).
# Facts (checked 2026-11-22): first website by Tim Berners-Lee at CERN (1990/91, restored copy at info.cern.ch);
# Netcraft Dec 2025: 1,389 million sites; Lindgaard et al. 2006 (Carleton, Canada): visual appeal judged in 50 ms;
# Statcounter 2026: ~69–74% of web traffic in Colombia from mobile; Google 2016: 53% of mobile visits abandoned if >3 s;
# BrightLocal: 84% of consumers searched for a local business in the past 3 months.
import os, json, subprocess, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('fg', os.path.join(ROOT, '..', 'firma-garabato', 'tools', 'build.py'))
fg = importlib.util.module_from_spec(spec); spec.loader.exec_module(fg)
page, chunks, dchip = fg.page, fg.chunks, fg.dchip

VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = shown

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n]) / 16)

Y = '#FFC107'; RD = '#E5484D'; GR = '#25A55F'

def brw(id_, style, url, inner, cls=''):
    return (f'<div id="{id_}" class="brw {cls}" style="{style}"><div class="bt"><i></i><i></i><i></i><span>{url}</span></div>'
            f'<div class="bb">{inner}</div></div>')

CSS = fg.CSS + f"""
.tag2{{position:absolute;padding:10px 20px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}}
.brw{{position:absolute;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.75)}}
.brw .bt{{display:flex;align-items:center;gap:10px;height:56px;padding:0 18px;background:#E9E9EC}}
.brw .bt i{{width:16px;height:16px;border-radius:50%;background:#C9C9CF}}
.brw .bt i:nth-child(1){{background:#FF5F57}}.brw .bt i:nth-child(2){{background:#FEBC2E}}.brw .bt i:nth-child(3){{background:#28C840}}
.brw .bt span{{flex:1;margin-left:10px;padding:8px 16px;border-radius:999px;background:#fff;font:600 22px/1 "Inter",sans-serif;color:#5C5C5C;white-space:nowrap;overflow:hidden}}
.brw .bb{{position:relative;padding:28px}}
.old .bb{{font:400 30px/1.35 "Liberation Serif","DejaVu Serif",serif;color:#000;background:#fff}}
.old h3{{margin:0 0 16px;font:700 48px/1.1 "Liberation Serif","DejaVu Serif",serif}}
.old a{{color:#0000EE;text-decoration:underline}}
.watch{{position:absolute;left:290px;top:300px;width:500px;height:500px;border-radius:50%;background:#16161B;box-shadow:inset 0 0 0 14px #2A2A33,0 0 0 6px {Y},0 0 90px rgba(255,193,7,.45)}}
.watch:before{{content:"";position:absolute;left:220px;top:-56px;width:60px;height:56px;border-radius:12px 12px 0 0;background:#2A2A33}}
.watch b{{position:absolute;left:0;right:0;top:170px;text-align:center;font:800 150px/1 "Montserrat",sans-serif;color:{Y};font-variant-numeric:tabular-nums;text-shadow:0 0 30px rgba(255,193,7,.6)}}
.watch small{{position:absolute;left:0;right:0;top:340px;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:#CFCFCF}}
.hand{{position:absolute;left:246px;top:60px;width:8px;height:190px;border-radius:4px;background:{RD};transform-origin:4px 190px}}
.eye{{position:absolute;left:0;right:0;top:880px;text-align:center;font-size:150px;line-height:1}}
.flash{{position:absolute;left:190px;top:560px;width:700px;height:520px}}
.mini{{position:absolute;width:150px;height:105px;border-radius:12px;background:#22222A;box-shadow:inset 0 22px 0 #33333D}}
.mini.me{{background:{Y};box-shadow:inset 0 22px 0 #E0A800,0 0 40px rgba(255,193,7,.7)}}
.cnt2{{position:absolute;left:0;right:0;text-align:center;font:800 120px/1 "Montserrat",sans-serif;color:{Y};text-shadow:0 0 40px rgba(255,193,7,.45);font-variant-numeric:tabular-nums}}
.rate{{position:absolute;display:flex;gap:30px;left:0;right:0;justify-content:center}}
.rate span{{display:grid;place-items:center;width:170px;height:170px;border-radius:50%;font-size:90px;background:#16161B;box-shadow:inset 0 0 0 4px #3A3A44}}
.rate span.on{{background:{GR};box-shadow:0 0 50px rgba(37,165,95,.6)}}
.ms{{position:absolute;left:0;right:0;text-align:center}}
.ms span{{display:inline-flex;align-items:center;gap:14px;padding:16px 30px;border-radius:999px;background:{RD};color:#fff;font:800 46px/1 "Montserrat",sans-serif}}
.grid10{{position:absolute;left:110px;right:110px;display:grid;grid-template-columns:repeat(5,1fr);gap:26px 20px}}
.grid10 div{{height:200px;border-radius:30px;display:grid;place-items:center;font-size:110px;background:#16161B;box-shadow:inset 0 0 0 3px #2E2E36}}
.grid10 div.ph{{background:rgba(255,193,7,.16);box-shadow:inset 0 0 0 4px {Y}}}
.load{{position:absolute;left:130px;right:130px;height:60px;border-radius:30px;background:#1F1F25;box-shadow:inset 0 0 0 3px #2E2E36;overflow:hidden}}
.load i{{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,{Y},#FF8A00);transform-origin:0 50%}}
.secs{{position:absolute;left:0;right:0;text-align:center;font:800 150px/1 "Montserrat",sans-serif;color:#fff;font-variant-numeric:tabular-nums}}
.ppl{{position:absolute;left:130px;right:130px;display:grid;grid-template-columns:repeat(5,1fr);gap:18px;font-size:96px;text-align:center}}
.srch{{position:absolute;left:90px;right:90px;top:400px;height:110px;border-radius:55px;background:#fff;display:flex;align-items:center;gap:22px;padding:0 34px;font:600 42px/1 "Inter",sans-serif;color:#1F1F1F;box-shadow:0 20px 40px -16px rgba(0,0,0,.7)}}
.srch i{{width:50px;height:50px;flex:none}}
.cur{{display:inline-block;width:4px;height:46px;background:#1F1F1F;vertical-align:-8px;margin-left:2px}}
.res{{position:absolute;left:90px;right:90px;padding:24px 30px;border-radius:26px;background:#fff;box-shadow:0 20px 40px -18px rgba(0,0,0,.7);display:flex;align-items:center;gap:24px}}
.res i{{flex:none;width:90px;height:90px;border-radius:20px;background:#E3E3E3}}
.res b{{display:block;font:800 38px/1.1 "Montserrat",sans-serif;color:#1F1F1F}}
.res small{{display:block;margin-top:6px;font:600 28px/1.2 "Inter",sans-serif;color:#8A6100}}
.res.me{{background:#2A2A2A;box-shadow:inset 0 0 0 3px {RD}}}
.res.me b{{color:#9A9A9A}}.res.me small{{color:{RD}}}
.phn{{position:absolute;border-radius:60px;background:#0E0E12;box-shadow:inset 0 0 0 12px #2A2A33,0 40px 80px -30px rgba(0,0,0,.8);overflow:hidden}}
.phn img{{position:absolute;left:12px;top:12px;right:12px;bottom:12px;width:calc(100% - 24px);height:calc(100% - 24px);object-fit:cover;object-position:50% 0;border-radius:48px}}
.ck{{position:absolute;left:600px;display:flex;align-items:center;gap:16px;font:800 40px/1.1 "Montserrat",sans-serif;color:#fff}}
.ck b{{display:grid;place-items:center;width:62px;height:62px;border-radius:50%;background:{GR};color:#fff;font-size:38px;flex:none}}
.brand{{position:absolute;left:0;right:0;top:150px;text-align:center}}
.brand span{{display:inline-flex;align-items:center;gap:16px;padding:16px 32px 16px 16px;border-radius:999px;background:#fff;color:#111;font:800 44px/1 "Montserrat",sans-serif}}
.brand img{{width:64px;height:64px}}
.qrw{{position:absolute;left:390px;top:990px;width:300px;padding:18px 18px 12px;border-radius:28px;background:#fff;text-align:center}}
.qrw img{{width:100%;display:block}}
.qrw b{{display:block;margin-top:6px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}}
"""

FIRST = ('<h3>World Wide Web</h3>The WorldWideWeb (W3) is a wide-area <a>hypermedia</a> information retrieval initiative aiming to give '
         'universal access to a large universe of documents.<br><br>Everything there is online about W3 is linked directly or indirectly to this document, '
         'including an <a>executive summary</a> of the project, <a>Mailing lists</a>, <a>Policy</a>…')
NICE = '<div style="height:150px;border-radius:16px;background:linear-gradient(135deg,#FFC107,#FF8A00)"></div><div style="height:22px;width:70%;margin:22px 0 12px;border-radius:8px;background:#1F1F1F"></div><div style="height:14px;border-radius:7px;background:#E3E3E3"></div><div style="height:14px;width:80%;margin-top:12px;border-radius:7px;background:#E3E3E3"></div>'

S = []
S.append(('w01', 'dk', .3, """
#X-fl{opacity:0}
#X-ey{top:900px}
""", '<div id="X-wt" class="watch"><div id="X-hd" class="hand"></div><b id="X-n">0,00</b><small>segundos</small></div>'
 + '<p id="X-ey" class="eye">👁️</p>'
 + '<p id="X-pp" class="pill y" style="top:1120px"><span>Menos que un parpadeo</span></p>'
 + brw('X-fl', 'left:190px;top:420px;width:700px;height:560px', 'tunegocio.com', NICE),
 lambda D, s, d: f"""const X_n={{v:0}};
tl.from("#X-wt",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},0);
tl.to(X_n,{{v:.05,duration:.6,ease:"none",onUpdate:()=>{{document.querySelector("#X-n").textContent=X_n.v.toFixed(2).replace(".",",")}}}},.25);
tl.to("#X-hd",{{rotation:18,duration:.6,ease:"none"}},.25);
tl.set("#X-fl",{{opacity:1}},.5);tl.set("#X-fl",{{opacity:0}},.6);
tl.to("#X-wt",{{scale:1.08,duration:.12,yoyo:true,repeat:3}},.9);
tl.from("#X-ey",{{opacity:0,scale:.4,duration:.35,ease:"back.out(2.5)"}},{s + d * .6:.2f});
tl.to("#X-ey",{{scaleY:.08,duration:.08,yoyo:true,repeat:1}},{s + d * .78:.2f});
tl.from("#X-pp",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .7:.2f});"""))

S.append(('w02', 'dk', .3, """
#X-t{top:300px;font-size:82px}
#X-ln{top:719px}
#X-k{top:930px}
""", '<h1 id="X-t" class="q"><em>5</em> datos sobre<br>las páginas web</h1><div id="X-ln" class="tline"></div>'
 + ''.join(f'<div id="X-d{j}" class="tdot{" hot" if j == 5 else ""}" style="left:{130 + (j - 1) * 205}px;top:664px">{"💸" if j == 5 else j}</div>' for j in range(1, 6))
 + '<p id="X-k" class="note">El <b>dato 5</b> es el que más clientes le hace perder a un negocio</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-ln",{{scaleX:0,transformOrigin:"0 50%",duration:.5,ease:"power2.out"}},{s + d * .1:.2f});
tl.from(["#X-d1","#X-d2","#X-d3","#X-d4"],{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)",stagger:.1}},{s + d * .15:.2f});
tl.from("#X-d5",{{opacity:0,scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)"}},{s + d * .5:.2f});
tl.to("#X-d5",{{scale:1.15,duration:.25,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .65:.2f});
tl.from("#X-k",{{opacity:0,y:30,duration:.4,ease:"power2.out"}},{s + d * .5:.2f});"""))

S.append(('w03', 'dk', .3, """
#X-t{top:240px;font-size:74px}
#X-b{left:90px;top:440px;width:900px}
#X-cr{left:110px;top:1150px;background:#16161B;color:#fff;box-shadow:inset 0 0 0 2px #3A3A44}
#X-ur{top:1150px;left:auto}
""", dchip(1, 'La primera') + '<h1 id="X-t" class="q">Hace <em>+30 años</em></h1>'
 + brw('X-b', '', 'info.cern.ch', FIRST, 'old')
 + '<span id="X-cr" class="tag2">🔬 Tim Berners-Lee · CERN</span><p id="X-ur" class="pill y" style="left:560px;right:auto"><span style="font-size:32px">Aún se puede visitar</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-b",{{opacity:0,y:200,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-cr",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .1:.2f});
tl.to("#X-b a",{{backgroundColor:"rgba(255,193,7,.55)",duration:.2,stagger:.1}},{s + d * .5:.2f});
tl.from("#X-ur",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .78:.2f});"""))

MINIS = ''.join(f'<div class="mini{" me" if (c, r) == (2, 3) else ""}" id="X-g{r}{c}" style="left:{90 + c * 185}px;top:{620 + r * 135}px"></div>' for r in range(6) for c in range(5))
S.append(('w04', 'dk', .3, """
#X-n{top:300px}
#X-u{top:440px}
#X-me{left:520px;top:1035px}
""", '<p id="X-n" class="cnt2">0</p><p id="X-u" class="sub">sitios web en el mundo</p>' + MINIS
 + '<span id="X-me" class="tag2" style="background:#fff;color:#111" data-layout-allow-overlap>← tu página</span>',
 lambda D, s, d: f"""const X_n={{v:0}};
tl.to(X_n,{{v:1300,duration:1.4,ease:"power2.out",onUpdate:()=>{{const v=Math.round(X_n.v);document.querySelector("#X-n").textContent="+"+v.toLocaleString("es-CO")+" M"}}}},{s:.2f});
tl.from("#X-u",{{opacity:0,y:30,duration:.35}},{s + .3:.2f});
tl.from("[id^='X-g']",{{opacity:0,scale:0,duration:.25,ease:"back.out(2)",stagger:{{each:.03,from:"center"}}}},{s + .2:.2f});
tl.from("#X-me",{{opacity:0,x:60,duration:.4,ease:"back.out(2)"}},{s + d * .6:.2f});
tl.to("#X-g32",{{scale:1.15,duration:.25,yoyo:true,repeat:3}},{s + d * .62:.2f});"""))

S.append(('w05', 'dk', .3, """
#X-t{top:240px;font-size:72px}
#X-fl{opacity:0}
#X-ms{top:1040px}
#X-rt{top:820px}
#X-sr{top:1170px}
""", dchip(2, 'El estudio') + '<h1 id="X-t" class="q">Les mostraron páginas<br>por <em>un instante</em></h1>'
 + brw('X-fl', 'left:240px;top:450px;width:600px;height:330px', 'pagina.com', NICE)
 + '<p id="X-rt" class="rate"><span id="X-up">👍</span><span id="X-dn">👎</span></p>'
 + '<p id="X-ms" class="ms"><span>⏱️ 50 milisegundos</span></p>'
 + '<p id="X-sr" class="lat" style="letter-spacing:.04em;font-size:32px">Carleton University (Canadá) · 2006</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.set("#X-fl",{{opacity:1}},{s + d * .4:.2f});tl.set("#X-fl",{{opacity:0}},{s + d * .4 + .1:.2f});
tl.set("#X-fl",{{opacity:1}},{s + d * .55:.2f});tl.set("#X-fl",{{opacity:0}},{s + d * .55 + .1:.2f});
tl.from("#X-rt",{{opacity:0,y:60,duration:.4,ease:"back.out(2)"}},{s + d * .6:.2f});
tl.set("#X-up",{{className:"on"}},{s + d * .75:.2f});
tl.from("#X-ms",{{opacity:0,scale:.5,duration:.4,ease:"back.out(2.2)"}},{s + d * .45:.2f});
tl.from("#X-sr",{{opacity:0,duration:.4}},{s + d * .5:.2f});"""))

S.append(('w06', 'dk', .3, """
#X-t{top:240px;font-size:74px}
#X-gd{top:520px}
#X-co{top:1030px}
""", dchip(3, 'Colombia') + '<h1 id="X-t" class="q"><em>7 de cada 10</em><br>desde el celular</h1>'
 + '<div id="X-gd" class="grid10">' + ''.join(f'<div id="X-p{j}" class="{"ph" if j < 7 else ""}">{"📱" if j < 7 else "💻"}</div>' for j in range(10)) + '</div>'
 + '<p id="X-co" class="pill k"><span>Si no se ve bien en el celular… 🙈</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("[id^='X-p']",{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)",stagger:.08}},{s + d * .15:.2f});
tl.from("#X-co",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .6:.2f});"""))

S.append(('w07', 'dk', .3, """
#X-t{top:240px;font-size:74px}
#X-sc{top:440px}
#X-ld{top:640px}
#X-pp{top:780px}
#X-g{top:1170px}
""", dchip(4, 'La espera') + '<h1 id="X-t" class="q">Más de <em>3 segundos</em>…</h1>'
 + '<p id="X-sc" class="secs"><span id="X-n">0,0</span> s</p><div id="X-ld" class="load"><i id="X-bar"></i></div>'
 + '<div id="X-pp" class="ppl">' + ''.join(f'<span id="X-h{j}">🧑</span>' for j in range(10)) + '</div>'
 + '<p id="X-g" class="pill y"><span>👋 Más de la mitad se va · Google</span></p>',
 None))
# (w07 animation is defined below to keep the f-strings readable)
def w07(D, s, d):
    js = f"""const X_n={{v:0}};
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-pp span",{{opacity:0,y:30,duration:.25,stagger:.04}},.15);
tl.fromTo("#X-bar",{{scaleX:0}},{{scaleX:.85,duration:{d * .55:.2f},ease:"power1.out"}},{s:.2f});
tl.to(X_n,{{v:3.4,duration:{d * .55:.2f},ease:"none",onUpdate:()=>{{document.querySelector("#X-n").textContent=X_n.v.toFixed(1).replace(".",",")}}}},{s:.2f});
"""
    for k, j in enumerate((1, 3, 4, 6, 8, 9)):
        js += f'tl.to("#X-h{j}",{{opacity:.12,y:-40,duration:.3}},{s + d * (.5 + k * .05):.2f});\n'
    js += f'tl.from("#X-g",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .72:.2f});'
    return js
S[-1] = S[-1][:5] + (w07,)

S.append(('w08', 'dk', .3, """
#X-t{top:240px;font-size:68px}
#X-r1{top:560px}#X-r2{top:740px}#X-r3{top:920px}
#X-st{top:1130px}
""", dchip(5, 'Los clientes') + '<h1 id="X-t" class="q"><em>8 de cada 10</em> buscan<br>negocios en internet</h1>'
 + '<div id="X-se" class="srch">🔍<span id="X-q">restaurante cerca de mí</span><span class="cur" id="X-cu"></span></div>'
 + '<div id="X-r1" class="res"><i></i><div><b>Restaurante El Vecino</b><small>★★★★★ · Ver página</small></div></div>'
 + '<div id="X-r2" class="res"><i></i><div><b>Asadero La Esquina</b><small>★★★★☆ · Ver página</small></div></div>'
 + '<div id="X-r3" class="res me"><i style="background:#3A3A3A"></i><div><b>Tu negocio</b><small>✕ No aparece</small></div></div>'
 + '<p id="X-st" class="pill w"><span>…y encuentran a tu competencia</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-se",{{opacity:0,y:-60,duration:.4,ease:"back.out(2)"}},{s + d * .15:.2f});
tl.from("#X-q",{{clipPath:"inset(0 100% 0 0)",duration:1.1,ease:"steps(22)"}},{s + d * .2:.2f});
tl.to("#X-cu",{{opacity:0,duration:.01,yoyo:true,repeat:{max(1, int(D / .45))},repeatDelay:.44}},0);
tl.from(["#X-r1","#X-r2"],{{opacity:0,y:60,duration:.35,ease:"power3.out",stagger:.15}},{s + d * .55:.2f});
tl.from("#X-r3",{{opacity:0,y:60,duration:.35,ease:"power3.out"}},{s + d * .7:.2f});
tl.to("#X-r3",{{x:12,duration:.06,yoyo:true,repeat:5}},{s + d * .75:.2f});
tl.from("#X-st",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .8:.2f});"""))

S.append(('w09', 'dk', .3, """
#X-t{top:200px;font-size:84px}
#X-ph{left:120px;top:440px;width:430px;height:880px}
#X-k1{top:620px}#X-k2{top:780px}#X-k3{top:940px}
""", '<h1 id="X-t" class="q">Tu <em>vitrina</em></h1><div id="X-ph" class="phn"><img src="assets/img/portada.jpg" alt=""></div>'
 + '<p id="X-k1" class="ck"><b>✓</b>Se ve bien</p><p id="X-k2" class="ck"><b>✓</b>Carga rápido</p><p id="X-k3" class="ck"><b>✓</b>Funciona<br>en el celular</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-ph",{{opacity:0,y:400,duration:.5,ease:"back.out(1.4)"}},.1);
tl.from("#X-k1",{{opacity:0,x:80,duration:.35,ease:"back.out(2)"}},{s + d * .1:.2f});
tl.from("#X-k2",{{opacity:0,x:80,duration:.35,ease:"back.out(2)"}},{s + d * .28:.2f});
tl.from("#X-k3",{{opacity:0,x:80,duration:.35,ease:"back.out(2)"}},{s + d * .45:.2f});"""))

S.append(('w10', 'qx', 2.4, """
#X-fl{opacity:0}
#X-t{top:290px;font-size:62px}
#X-p1{left:90px;top:520px;width:270px;height:500px;transform:rotate(-8deg)}
#X-p2{left:395px;top:470px;width:290px;height:540px;box-shadow:inset 0 0 0 12px #2A2A33,0 0 0 5px #FFC107,0 0 80px rgba(255,193,7,.5)}
#X-p3{left:720px;top:520px;width:270px;height:500px;transform:rotate(8deg)}
#X-qr{top:1060px}
#X-ak{top:1440px}
#X-ak span{font-size:32px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div>'
 + '<p id="X-br" class="brand"><span><img src="assets/brand/flower.svg" alt="">Pascal Web · de PascalIA</span></p>'
 + '<h1 id="X-t" class="q">Diseñamos la página<br>de tu <em>negocio</em></h1>'
 + '<div id="X-p1" class="phn"><img src="assets/img/carta.jpg" alt=""></div><div id="X-p2" class="phn"><img src="assets/img/portada.jpg" alt=""></div><div id="X-p3" class="phn"><img src="assets/img/hora.jpg" alt=""></div>'
 + '<div id="X-qr" class="qrw" style="top:1060px"><img src="assets/brand/qr-pascalweb.svg" alt=""><b>Pide la tuya</b></div>'
 + '<p id="X-ak" class="pill w"><span>📤 Mándaselo a quien todavía no tiene página</span></p><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.5,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-br",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},.2);
tl.from("#X-p2",{{opacity:0,y:300,duration:.5,ease:"back.out(1.4)"}},{s + d * .1:.2f});
tl.from("#X-p1",{{opacity:0,x:-300,duration:.5,ease:"back.out(1.4)"}},{s + d * .2:.2f});
tl.from("#X-p3",{{opacity:0,x:300,duration:.5,ease:"back.out(1.4)"}},{s + d * .3:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .45:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .7:.2f});
tl.to("#X-ak",{{scale:1.05,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .85:.2f});"""))

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
        bottom = 200 if n == 'w10' else 290
        html = html.replace('.cap{position:absolute;left:70px;right:70px;bottom:250px;', f'.cap{{position:absolute;left:70px;right:70px;bottom:{bottom}px;')
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
