# Builds "¿Por qué tu firma es un garabato?": a general-information short (5 verified facts about signatures) with a hook,
# a retention promise ("el último dato…") and Pascal Sign only at the very end. Everything is drawn with code (no generated images).
# Facts (checked 2026-11-22): Mesopotamian cylinder seals rolled on clay as signature (4th millennium BCE); Latin firmare;
# signing with a cross; Charlemagne's signum manus (secretary wrote the letters, he drew the central part); Japanese hanko
# (still used, even for marriage registration); forgeries are drawn slowly and show tremor; Colombia, Ley 527 de 1999 (art. 7).
import os, json, re, subprocess, importlib.util, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('v1', os.path.join(ROOT, '..', 'pascal-sign', 'tools', 'build.py'))
v1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v1)
icon, page, chunks = v1.icon, v1.page, v1.chunks

VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|'); LINES[n] = shown

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.0, len(LINES[n]) / 16)

Y = '#FFC107'
# one cursive "garabato" used everywhere (viewBox 0 0 620 230); two sub-paths: the loops and the underline
SIG = ("M30 150 C60 60 120 40 110 120 C100 190 50 170 90 120 C130 70 170 160 200 120 C225 85 240 70 250 110 "
       "C260 150 280 160 300 120 C320 80 340 60 350 100 C360 140 330 170 380 130 C420 100 440 90 470 110 "
       "C500 130 520 100 560 80 M60 190 C200 175 380 185 590 165")

def sample(path, step=40):
    """Points along an absolute M/C path (cubic Béziers), one list per sub-path."""
    toks = re.findall(r'[MC]|-?\d+\.?\d*', path); subs = []; i = 0; cur = None
    while i < len(toks):
        if toks[i] == 'M':
            cur = (float(toks[i + 1]), float(toks[i + 2])); subs.append([cur]); i += 3
        elif toks[i] == 'C':
            i += 1
            while i < len(toks) and toks[i] not in 'MC':
                p1 = (float(toks[i]), float(toks[i + 1])); p2 = (float(toks[i + 2]), float(toks[i + 3])); p3 = (float(toks[i + 4]), float(toks[i + 5])); i += 6
                for k in range(1, step + 1):
                    t = k / step; a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; c = 3 * (1 - t) * t * t; d = t ** 3
                    subs[-1].append((a * cur[0] + b * p1[0] + c * p2[0] + d * p3[0], a * cur[1] + b * p1[1] + c * p2[1] + d * p3[1]))
                cur = p3
    return subs

def shaky(path, amp=2.6):
    """The same signature, drawn slowly: deterministic tremor perpendicular to the stroke plus small hesitations."""
    out = []
    for sub in sample(path, 26):
        pts = []
        for j, (x, y) in enumerate(sub):
            if 0 < j < len(sub) - 1:
                dx = sub[j + 1][0] - sub[j - 1][0]; dy = sub[j + 1][1] - sub[j - 1][1]; L = math.hypot(dx, dy) or 1
                w = amp * (math.sin(j * 1.9) + .6 * math.sin(j * 4.3 + 1.1) + .35 * math.sin(j * 7.7))
                x += -dy / L * w; y += dx / L * w
            pts.append(f'{x:.1f} {y:.1f}')
        out.append('M' + ' L'.join(pts))
    return ' '.join(out)

def svg_sig(id_, d=SIG, color=Y, sw=9, style='', glow=True, vb='0 0 620 230'):
    f = f'filter:drop-shadow(0 0 14px {color}88);' if glow else ''
    return (f'<svg id="{id_}" class="gsig" viewBox="{vb}" style="{f}{style}"><path d="{d}" pathLength="1" stroke-dasharray="1" '
            f'stroke-dashoffset="1" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def draw(sel, at, dur_, ease='power1.inOut'):
    return f'tl.to("{sel} path",{{attr:{{"stroke-dashoffset":0}},duration:{dur_:.2f},ease:"{ease}"}},{at:.2f});'

def dchip(n, label):
    dots = ''.join(f'<i class="{"on" if j <= n else ""}"></i>' for j in range(1, 6))
    return f'<div id="X-dch" class="dch"><span><b>DATO {n}</b>{label}</span><em>{dots}</em></div>'

CSS = f"""
.gsig{{position:absolute;overflow:visible}}
.q{{position:absolute;left:60px;right:60px;text-align:center;font:800 84px/1.04 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.q em{{font-style:normal;color:{Y};text-shadow:0 0 22px rgba(255,193,7,.55)}}
.q.dkq{{color:#1F1F1F}}
.q.dkq em{{color:#1F1F1F;text-shadow:none;background:linear-gradient(transparent 58%,{Y} 58%,{Y} 92%,transparent 92%);padding:0 .06em}}
.dch{{position:absolute;left:0;right:0;top:110px;text-align:center}}
.dch span{{display:inline-flex;align-items:center;gap:16px;padding:12px 28px 12px 12px;border-radius:999px;background:#111;box-shadow:inset 0 0 0 2px #3A3A3A;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.dch b{{padding:10px 16px;border-radius:999px;background:{Y};color:#111;font:800 28px/1 "Montserrat",sans-serif}}
.dch em{{display:flex;justify-content:center;gap:10px;margin-top:14px}}
.dch em i{{width:46px;height:8px;border-radius:4px;background:rgba(255,255,255,.22)}}
.dch em i.on{{background:{Y};box-shadow:0 0 12px rgba(255,193,7,.6)}}
.pill{{position:absolute;left:0;right:0;text-align:center}}
.pill span{{display:inline-flex;align-items:center;gap:12px;padding:18px 32px;border-radius:999px;font:800 40px/1 "Montserrat",sans-serif}}
.pill.y span{{background:{Y};color:#111;box-shadow:0 14px 34px -10px rgba(255,193,7,.6)}}
.pill.w span{{background:#fff;color:#111}}
.pill.k span{{background:#111;color:#fff;box-shadow:inset 0 0 0 2px #3A3A3A}}
.qm{{position:absolute;font:800 150px/1 "Montserrat",sans-serif;color:rgba(255,193,7,.22)}}
.big{{position:absolute;left:0;right:0;text-align:center;font:800 230px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:-.04em;text-shadow:0 0 50px rgba(255,193,7,.45);font-variant-numeric:tabular-nums}}
.sub{{position:absolute;left:0;right:0;text-align:center;font:800 64px/1.1 "Montserrat",sans-serif;color:#fff}}
.tline{{position:absolute;left:130px;right:130px;height:8px;border-radius:4px;background:rgba(255,255,255,.18)}}
.tdot{{position:absolute;width:118px;height:118px;margin-left:-59px;border-radius:50%;background:#1A1A1A;box-shadow:inset 0 0 0 5px #4A4A4A;display:grid;place-items:center;font:800 54px/1 "Montserrat",sans-serif;color:#fff}}
.tdot.hot{{background:{Y};color:#111;box-shadow:0 0 0 8px rgba(255,193,7,.25),0 0 60px rgba(255,193,7,.7)}}
.note{{position:absolute;left:80px;right:80px;text-align:center;font:600 50px/1.3 "Inter",sans-serif;color:#E6E6E6}}
.note b{{color:{Y};font-weight:600}}
.tab{{position:absolute;left:130px;top:470px;width:820px;height:600px;border-radius:70px 90px 80px 60px;background:radial-gradient(90% 70% at 35% 30%,#E2B585,#B98656 70%,#9C6E43);box-shadow:inset 0 -18px 30px rgba(80,45,15,.45),inset 0 14px 24px rgba(255,235,200,.35),0 40px 70px -20px rgba(0,0,0,.7)}}
.wedge{{position:absolute;left:70px;right:70px;height:12px;border-radius:6px;background:rgba(100,60,25,.35)}}
.imp{{position:absolute;left:60px;top:200px;width:700px;height:230px;border-radius:16px;background:rgba(120,72,32,.28);box-shadow:inset 0 6px 12px rgba(70,38,12,.55),inset 0 -4px 8px rgba(255,230,190,.3);overflow:hidden}}
.imp svg{{position:absolute;left:0;top:0;width:700px;height:230px}}
.seal{{position:absolute;width:130px;height:290px;border-radius:30px/18px;background:linear-gradient(90deg,#3B2A22,#7A6253 30%,#A88E7C 48%,#6E5747 70%,#2E211B);box-shadow:0 30px 40px -12px rgba(0,0,0,.6)}}
.seal i{{position:absolute;inset:26px 0;background:repeating-linear-gradient(180deg,rgba(0,0,0,.28) 0 6px,transparent 6px 30px);background-size:100% 60px}}
.seal:before,.seal:after{{content:"";position:absolute;left:0;right:0;height:36px;border-radius:50%;background:#8C7564}}
.seal:before{{top:-14px;background:radial-gradient(#5A463A 22%,#9C8473 24%)}}
.seal:after{{bottom:-14px;background:#4A372D}}
.stone{{position:absolute;left:120px;right:120px;height:270px;border-radius:14px;background:linear-gradient(180deg,#EFE8DA,#D6CBB6);box-shadow:inset 0 0 0 8px #C9BCA3,0 30px 60px -20px rgba(0,0,0,.7);display:grid;place-items:center;font:700 150px/1 "Liberation Serif","DejaVu Serif",serif;letter-spacing:.12em;color:#4B3B2A;text-shadow:0 2px 0 rgba(255,255,255,.6),0 -2px 0 rgba(0,0,0,.25)}}
.lat{{position:absolute;left:0;right:0;text-align:center;font:700 40px/1 "Inter",sans-serif;color:#BFBFBF;letter-spacing:.2em}}
.arrow{{position:absolute;left:0;right:0;text-align:center;font:800 90px/1 "Montserrat",sans-serif;color:{Y}}}
.eq{{position:absolute;left:0;right:0;display:flex;justify-content:center;align-items:baseline;font:800 128px/1 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.eq .a{{display:inline-block;overflow:hidden;color:{Y};text-shadow:0 0 30px rgba(255,193,7,.6)}}
.parch{{position:absolute;border-radius:18px;background:linear-gradient(160deg,#F6E9C8,#E3CC98);box-shadow:inset 0 0 40px rgba(140,95,40,.35),0 30px 60px -20px rgba(0,0,0,.7);color:#5A3A1E}}
.parch .pl{{height:12px;border-radius:6px;background:rgba(110,70,30,.25);margin:20px 0}}
.parch .fl{{font:700 40px/1 "Liberation Serif","DejaVu Serif",serif;color:#5A3A1E}}
.crown{{position:absolute;left:0;right:0;text-align:center;font:800 86px/1 "Montserrat",sans-serif;color:#fff}}
.crown small{{display:block;margin-top:14px;font:700 40px/1 "Inter",sans-serif;color:#CFCFCF}}
.mono{{position:absolute;left:240px;top:470px;width:600px;height:600px}}
.who2{{position:absolute;top:1130px;width:440px;padding:24px 20px;border-radius:28px;text-align:center;font:800 36px/1.15 "Montserrat",sans-serif}}
.who2 small{{display:block;margin-top:8px;font:600 28px/1.2 "Inter",sans-serif}}
.sun{{position:absolute;left:240px;top:330px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,#E53935 0%,#C62828 60%,rgba(198,40,40,0) 72%);opacity:.55}}
.jdoc{{position:absolute;left:250px;top:440px;width:580px;height:760px;border-radius:14px;background:#FBFAF6;box-shadow:0 30px 60px -20px rgba(0,0,0,.75);padding:40px 44px}}
.jdoc h4{{margin:0 0 20px;text-align:center;font:400 72px/1 "WenQuanYi Zen Hei",sans-serif;color:#2B2B2B;letter-spacing:.2em}}
.jdoc .jl{{display:grid;grid-template-columns:110px 1fr;gap:12px;margin:18px 0}}
.jdoc .jl i{{height:46px;border-radius:6px;background:#F1E4E4;box-shadow:inset 0 0 0 2px #E2C1C1}}
.jdoc .jl s{{height:46px;border-bottom:3px solid #E2C1C1}}
.jbox{{position:absolute;right:60px;bottom:60px;width:180px;height:180px;border:3px dashed #D9A7A7;border-radius:10px}}
.himp{{position:absolute;right:79px;bottom:79px;width:142px;height:142px;border-radius:50%;border:9px solid #D32F2F;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#D32F2F;font:400 46px/1.02 "WenQuanYi Zen Hei",sans-serif;opacity:.92}}
.hanko{{position:absolute;width:150px;height:330px}}
.hanko .bd{{position:absolute;left:20px;right:20px;top:0;bottom:30px;border-radius:55px 55px 10px 10px;background:linear-gradient(90deg,#3E2414,#8A5A32 35%,#B98552 50%,#7A4C28 70%,#2F1B0F)}}
.hanko .ft{{position:absolute;left:0;right:0;bottom:0;height:52px;border-radius:12px;background:linear-gradient(90deg,#2A1A10,#5A3A22 50%,#2A1A10);box-shadow:inset 0 -10px 0 #C62828}}
.mini{{position:absolute;left:150px;width:780px;height:220px;border-radius:30px;background:#141414;box-shadow:inset 0 0 0 2px #2E2E2E}}
.mini .gsig{{left:60px;top:15px;width:520px;height:193px}}
.mini b{{position:absolute;right:30px;top:80px;font:800 40px/1 "Montserrat",sans-serif;color:{Y}}}
.cmp{{position:absolute;left:70px;right:70px;height:390px;border-radius:36px;background:#FBFAF6;box-shadow:0 30px 60px -24px rgba(0,0,0,.7);overflow:hidden}}
.cmp .lb{{position:absolute;left:30px;top:26px;padding:10px 20px;border-radius:999px;font:800 30px/1 "Montserrat",sans-serif;color:#fff}}
.cmp .ft{{position:absolute;left:30px;bottom:26px;font:800 38px/1 "Montserrat",sans-serif}}
.cmp .gsig{{left:150px;top:70px;width:640px;height:237px}}
.mag{{position:absolute;width:300px;height:300px;border-radius:50%;overflow:hidden;background:#FBFAF6;box-shadow:0 0 0 12px #2B2B2B,0 0 0 16px {Y},0 30px 60px -20px rgba(0,0,0,.8)}}
.mag:after{{content:"";position:absolute;left:236px;top:250px;width:30px;height:120px;border-radius:12px;background:#2B2B2B;transform:rotate(-40deg)}}
.mag svg{{position:absolute}}
.paper{{position:absolute;width:300px;height:380px}}
.paper i{{position:absolute;width:240px;height:310px;border-radius:14px;background:#fff;box-shadow:0 20px 40px -18px rgba(31,31,31,.5),inset 0 0 0 2px #E7E7E7}}
.xx{{position:absolute;width:120px;height:120px;border-radius:50%;background:#E5484D;display:grid;place-items:center;color:#fff;font:800 72px/1 "Montserrat",sans-serif;box-shadow:0 14px 30px -10px rgba(0,0,0,.5)}}
.phn{{position:absolute;border-radius:64px;background:#0E0E12;box-shadow:inset 0 0 0 12px #2A2A33,0 40px 80px -30px rgba(31,31,31,.6);overflow:hidden}}
.phn .sc{{position:absolute;inset:12px;border-radius:52px;background:#F4F4F6;padding:90px 26px 26px}}
.phn .nt{{position:absolute;left:50%;top:26px;width:120px;height:32px;margin-left:-60px;border-radius:20px;background:#000;z-index:2}}
.pg{{background:#fff;border-radius:16px;padding:26px;box-shadow:0 10px 24px -12px rgba(0,0,0,.35)}}
.pg .t{{font:800 24px/1.2 "Montserrat",sans-serif;color:#1F1F1F;text-align:center}}
.pg .ln{{height:12px;border-radius:6px;background:#E3E3E3;margin:16px 0}}
.law{{position:absolute;left:0;right:0;text-align:center}}
.law span{{display:inline-flex;align-items:center;gap:20px;padding:18px 34px 18px 18px;border-radius:26px;background:#1F1F1F;color:#fff;font:800 42px/1 "Montserrat",sans-serif;box-shadow:0 20px 40px -16px rgba(31,31,31,.5)}}
.law i{{display:block;width:72px;height:52px;border-radius:8px;background:linear-gradient(180deg,#FCD116 0 50%,#003893 50% 75%,#CE1126 75%)}}
.rays{{position:absolute;left:-460px;top:-260px;width:2000px;height:2000px;border-radius:50%;background:repeating-conic-gradient(rgba(255,193,7,.12) 0 6deg,transparent 6deg 18deg)}}
.lg{{position:absolute;left:380px;top:190px;width:320px;height:320px;border-radius:72px;box-shadow:0 0 0 5px {Y},0 0 90px rgba(255,193,7,.55)}}
.qr{{position:absolute;left:340px;top:760px;width:400px;padding:24px 24px 18px;border-radius:32px;background:#fff;text-align:center}}
.qr img{{width:100%;display:block}}
.qr b{{display:block;margin-top:10px;font:800 32px/1.1 "Montserrat",sans-serif;color:#1F1F1F}}
.qr small{{display:block;margin-top:6px;font:700 26px/1.1 "Inter",sans-serif;color:#8A6100}}
.flashw{{position:absolute;inset:0;background:#fff}}
"""

S = []
# 1 · hook: a scribble draws itself, then the question
S.append(('g01', 'dk', .3, """
#X-sv{left:80px;top:330px;width:920px;height:341px}
#X-t{top:790px;font-size:96px}
#X-p{top:1110px}
#X-q1{left:70px;top:190px;transform:rotate(-14deg)}
#X-q2{left:880px;top:1230px;transform:rotate(12deg)}
""", '<p id="X-q1" class="qm">?</p><p id="X-q2" class="qm">?</p>' + svg_sig('X-sv', sw=10)
 + '<h1 id="X-t" class="q">¿Por qué tu firma<br>es un <em>garabato</em>?</h1>'
 + '<p id="X-p" class="pill w"><span>…y vale como tu palabra</span></p>',
 lambda D, s, d: f"""{draw('#X-sv', .05, 1.3)}
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.45,ease:"power3.out"}},.35);
tl.to("#X-sv",{{scale:1.06,duration:.12,yoyo:true,repeat:3,ease:"sine.inOut"}},1.4);
tl.from(["#X-q1","#X-q2"],{{opacity:0,scale:0,duration:.4,ease:"back.out(2.5)",stagger:.15}},.6);
tl.from("#X-p",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .55:.2f});"""))

# 2 · 5,000 years + promise of the last fact
S.append(('g02', 'dk', .3, """
#X-n{top:300px}
#X-u{top:560px}
#X-ln{top:839px}
#X-k{top:1050px}
""", '<p id="X-n" class="big">+0</p><p id="X-u" class="sub">años de historia</p><div id="X-ln" class="tline"></div>'
 + ''.join(f'<div id="X-d{j}" class="tdot{" hot" if j == 5 else ""}" style="left:{130 + (j - 1) * 205}px;top:784px">{"?" if j == 5 else j}</div>' for j in range(1, 6))
 + '<p id="X-k" class="note">Y el <b>dato 5</b> te va a hacer mirar tu firma distinto 👀</p>',
 lambda D, s, d: f"""const X_n={{v:0}};
tl.to(X_n,{{v:5000,duration:1.3,ease:"power2.out",onUpdate:()=>{{document.querySelector("#X-n").textContent="+"+Math.round(X_n.v).toLocaleString("es-CO")}}}},{s:.2f});
tl.from("#X-u",{{opacity:0,y:30,duration:.35}},{s + .3:.2f});
tl.from("#X-ln",{{scaleX:0,transformOrigin:"0 50%",duration:.6,ease:"power2.out"}},{s + d * .4:.2f});
tl.from("#X-d1,#X-d2,#X-d3,#X-d4",{{opacity:0,scale:0,duration:.3,ease:"back.out(2.5)",stagger:.1}},{s + d * .45:.2f});
tl.from("#X-d5",{{opacity:0,scale:0,rotation:-90,duration:.45,ease:"back.out(2.5)"}},{s + d * .62:.2f});
tl.to("#X-d5",{{scale:1.15,duration:.25,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .75:.2f});
tl.from("#X-k",{{opacity:0,y:30,duration:.4,ease:"power2.out"}},{s + d * .55:.2f});"""))

# 3 · Mesopotamia: a cylinder seal rolls over clay and leaves its mark
MOTIF = ''.join(
    f'<g transform="translate({x},0)" fill="none" stroke="rgba(70,38,12,.75)" stroke-width="7" stroke-linecap="round">'
    '<circle cx="40" cy="60" r="16"/><path d="M40 76 V150 M40 100 L12 125 M40 100 L68 125 M40 150 L18 205 M40 150 L62 205"/>'
    '<path d="M110 40 l12 28 30 2 -24 18 9 30 -27 -17 -27 17 9 -30 -24 -18 30 -2z"/>'
    '<path d="M100 170 l18 -16 M128 196 l18 -16 M156 170 l18 -16"/></g>' for x in range(10, 700, 175))
S.append(('g03', 'clay', .3, """
#X-t{top:240px;font-size:80px}
#X-se{left:150px;top:640px}
#X-lb{top:1150px}
""", dchip(1, 'Mesopotamia') + '<h1 id="X-t" class="q">Hace <em>+5.000</em> años</h1>'
 + '<div id="X-tb" class="tab"><div class="wedge" style="top:80px"></div><div class="wedge" style="top:120px;right:240px"></div>'
 + f'<div id="X-im" class="imp"><svg viewBox="0 0 700 230">{MOTIF}</svg></div>'
 + '<div class="wedge" style="top:480px;right:160px"></div><div class="wedge" style="top:520px;right:330px"></div></div>'
 + '<div id="X-se" class="seal"><i id="X-st"></i></div>'
 + '<p id="X-lb" class="pill y"><span>Esa marca = su firma</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-tb",{{opacity:0,y:200,duration:.5,ease:"power3.out"}},.1);
tl.from("#X-se",{{opacity:0,y:-400,duration:.45,ease:"power3.in"}},{s + d * .25:.2f});
tl.fromTo("#X-im",{{clipPath:"inset(0 100% 0 0)"}},{{clipPath:"inset(0 0% 0 0)",duration:{d * .4:.2f},ease:"none"}},{s + d * .33:.2f});
tl.to("#X-se",{{x:700,duration:{d * .4:.2f},ease:"none"}},{s + d * .33:.2f});
tl.to("#X-st",{{backgroundPositionY:"-420px",duration:{d * .4:.2f},ease:"none"}},{s + d * .33:.2f});
tl.to("#X-se",{{opacity:0,y:-200,duration:.35,ease:"power2.in"}},{s + d * .76:.2f});
tl.from("#X-lb",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .78:.2f});"""))

# 4 · firmare → dar firmeza → firmar = afirmar
S.append(('g04', 'dk', .3, """
#X-la{top:300px}
#X-st{top:360px}
#X-ar{top:675px}
#X-df{top:790px}
#X-eq{top:1050px}
#X-a{width:0}
""", dchip(2, 'La palabra') + '<p id="X-la" class="lat">LATÍN</p><div id="X-st" class="stone">FIRMARE</div>'
 + '<p id="X-ar" class="arrow">↓</p><h1 id="X-df" class="q">dar <em>firmeza</em></h1>'
 + '<p id="X-eq" class="eq"><span id="X-a" class="a">A</span><span>FIRMAR</span></p>',
 lambda D, s, d: f"""tl.from("#X-la",{{opacity:0,duration:.3}},.05);
tl.from("#X-st",{{opacity:0,scale:.7,duration:.5,ease:"back.out(1.8)"}},.1);
tl.from("#X-ar",{{opacity:0,y:-40,duration:.3}},{s + d * .3:.2f});
tl.from("#X-df",{{opacity:0,y:30,scale:.8,duration:.4,ease:"back.out(2)"}},{s + d * .35:.2f});
tl.from("#X-eq",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},{s + d * .55:.2f});
tl.to("#X-a",{{width:104,duration:.45,ease:"back.out(2)"}},{s + d * .78:.2f});"""))

# 5 · the cross, then Charlemagne's monogram: secretary's letters, his central lozenge
L5 = 'font-family:Liberation Serif,DejaVu Serif,serif;font-weight:700;font-size:118px;fill:#E9D9B5'
MONO = (f'<svg viewBox="0 0 600 600" class="mono" id="X-mo">'
        '<g id="X-ar2" stroke="#8C6A40" stroke-width="10" stroke-linecap="round"><path d="M300 120 V230 M300 370 V480 M120 300 H230 M370 300 H480"/></g>'
        f'<g id="X-lt"><text x="300" y="112" text-anchor="middle" style="{L5}">R</text><text x="300" y="566" text-anchor="middle" style="{L5}">L</text>'
        f'<text x="62" y="342" text-anchor="middle" style="{L5}">K</text><text x="540" y="342" text-anchor="middle" style="{L5}">S</text></g>'
        f'<path id="X-rh" d="M300 215 L385 300 L300 385 L215 300 Z" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="{Y}" stroke-width="14" stroke-linejoin="round" style="filter:drop-shadow(0 0 16px {Y})"/>'
        f'<text id="X-ao" x="300" y="322" text-anchor="middle" style="font:800 56px Montserrat,sans-serif;fill:{Y}">AOV</text></svg>')
S.append(('g05', 'parchd', .35, """
#X-pa{left:140px;top:330px;width:800px;height:560px;padding:50px 60px}
#X-x{left:250px;top:620px;width:260px;height:200px}
#X-xt{left:560px;top:690px;transform:rotate(-4deg)}
#X-cw{top:290px}
#X-w1{left:70px;background:#3A2A1C;color:#E9D9B5}
#X-w2{left:570px;background:#FFC107;color:#111}
#X-w2 small{color:#3A2A1C}
#X-w1 small{color:#BFA982}
""", dchip(3, 'Edad Media')
 + '<div id="X-pa" class="parch"><p class="fl">Escritura de venta</p><div class="pl"></div><div class="pl" style="width:80%"></div><div class="pl" style="width:65%"></div><p class="fl" style="margin-top:60px">Firma:</p></div>'
 + svg_sig('X-x', d='M30 30 L230 170 M230 30 L30 170', color='#5A3A1E', sw=16, glow=False, vb='0 0 260 200')
 + '<p id="X-xt" class="pill k"><span style="font-size:34px">✕ = su firma</span></p>'
 + '<div id="X-cw" class="crown">👑 Carlomagno<small>emperador de media Europa</small></div>' + MONO
 + '<div id="X-w1" class="who2">✍️ Un secretario<small>escribía las letras</small></div>'
 + '<div id="X-w2" class="who2">👑 Él<small>solo trazaba el centro</small></div>',
 lambda D, s, d: f"""tl.from("#X-pa",{{opacity:0,y:200,rotation:-4,duration:.5,ease:"power3.out"}},.05);
{draw('#X-x', s + d * .1, .6)}
tl.from("#X-xt",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.2)"}},{s + d * .2:.2f});
tl.to(["#X-pa","#X-x","#X-xt"],{{opacity:0,y:-120,scale:.85,duration:.45,ease:"power2.in"}},{s + d * .33:.2f});
tl.from("#X-cw",{{opacity:0,y:-40,duration:.45,ease:"back.out(2)"}},{s + d * .37:.2f});
tl.from("#X-mo",{{opacity:0,scale:.8,duration:.45,ease:"power3.out"}},{s + d * .42:.2f});
tl.from("#X-lt text",{{opacity:0,scale:.4,transformOrigin:"50% 50%",duration:.3,ease:"back.out(2.5)",stagger:.12}},{s + d * .6:.2f});
tl.from("#X-w1",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .62:.2f});
tl.to("#X-rh",{{attr:{{"stroke-dashoffset":0}},duration:.8,ease:"power1.inOut"}},{s + d * .8:.2f});
tl.from("#X-ao",{{opacity:0,duration:.3}},{s + d * .86:.2f});
tl.from("#X-w2",{{opacity:0,x:200,duration:.4,ease:"power3.out"}},{s + d * .82:.2f});"""))

# 6 · Japan: hanko instead of a signature, even for marriage
S.append(('g06', 'jp', .3, """
#X-t{top:240px;font-size:76px}
#X-hk{left:705px;top:-420px}
#X-ring{top:1250px}
""", dchip(4, 'Japón') + '<div class="sun"></div><h1 id="X-t" class="q">No firman: <em>sellan</em></h1>'
 + '<div id="X-dc" class="jdoc"><h4>婚姻届</h4>' + '<div class="jl"><i></i><s></s></div>' * 5 + '<div class="jbox"></div><div id="X-im" class="himp"><span>山</span><span>田</span></div></div>'
 + '<div id="X-hk" class="hanko"><div class="bd"></div><div class="ft"></div></div>'
 + '<p id="X-ring" class="pill y"><span>💍 Hasta para casarse</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-dc",{{opacity:0,y:300,duration:.5,ease:"power3.out"}},.1);
tl.to("#X-hk",{{y:1240,duration:.35,ease:"power3.in"}},{s + d * .3:.2f});
tl.to("#X-dc",{{y:10,duration:.08,yoyo:true,repeat:1}},{s + d * .3 + .35:.2f});
tl.from("#X-im",{{opacity:0,scale:1.25,duration:.2}},{s + d * .3 + .35:.2f});
tl.to("#X-hk",{{y:600,opacity:0,duration:.5,ease:"power2.out"}},{s + d * .3 + .6:.2f});
tl.from("#X-ring",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .68:.2f});"""))

# 7 · the scribble: done from memory, fast, the same every time
S.append(('g07', 'dk', .3, """
#X-t{top:250px;font-size:80px}
#X-r1{top:480px}#X-r2{top:740px}#X-r3{top:1000px}
#X-tg{top:1290px}
""", dchip(5, 'El garabato') + '<h1 id="X-t" class="q">No tiene que <em>leerse</em></h1>'
 + ''.join(f'<div id="X-r{j}" class="mini">{svg_sig(f"X-g{j}", sw=11, glow=False)}<b>0,5 s</b></div>' for j in (1, 2, 3))
 + '<p id="X-tg" class="pill y"><span>⚡ De memoria · rápido · sin pensar</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-r1,#X-r2,#X-r3",{{opacity:0,x:-120,duration:.35,ease:"power3.out",stagger:.1}},.15);
{draw('#X-g1', s + d * .3, .5, 'power2.inOut')}
{draw('#X-g2', s + d * .45, .5, 'power2.inOut')}
{draw('#X-g3', s + d * .6, .5, 'power2.inOut')}
tl.from("#X-tg",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .7:.2f});"""))

# 8 · original (fast, fluid) vs copy (slow, trembling) + magnifier
SH = shaky(SIG)
S.append(('g08', 'dk', .35, """
#X-t{top:200px;font-size:66px}
#X-o{top:400px}
#X-f{top:850px}
#X-mg{left:690px;top:1000px}
#X-mg svg{left:-450px;top:-210px;width:1860px;height:690px}
""", '<h1 id="X-t" class="q">¿Cómo se delata<br>una firma <em>falsa</em>?</h1>'
 + f'<div id="X-o" class="cmp"><span class="lb" style="background:#25A55F">ORIGINAL</span>{svg_sig("X-so", color="#1B2A6B", sw=8, glow=False)}<span class="ft" style="color:#1E7B45">⚡ Rápida y fluida</span></div>'
 + f'<div id="X-f" class="cmp"><span class="lb" style="background:#E5484D">COPIA</span>{svg_sig("X-sf", d=SH, color="#1B2A6B", sw=7, glow=False)}<span class="ft" style="color:#B42318">🐢 Lenta y temblorosa</span></div>'
 + f'<div id="X-mg" class="mag" data-layout-allow-overlap><svg viewBox="0 0 620 230"><path d="{SH}" fill="none" stroke="#1B2A6B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from(["#X-o","#X-f"],{{opacity:0,y:120,duration:.4,ease:"power3.out",stagger:.12}},.1);
{draw('#X-so', s + d * .05, .55, 'power2.inOut')}
tl.to("#X-sf path",{{attr:{{"stroke-dashoffset":0}},duration:{d * .55:.2f},ease:"steps(40)"}},{s + d * .3:.2f});
tl.from("#X-mg",{{opacity:0,scale:.3,duration:.45,ease:"back.out(1.8)"}},{s + d * .72:.2f});"""))

# 9 · today, no paper: Colombia recognizes signatures in electronic documents since 1999
S.append(('g09', 'lt', .3, """
#X-t{top:210px;font-size:78px}
#X-pp{left:110px;top:560px}
#X-xx{left:270px;top:820px}
#X-ph{left:520px;top:440px;width:440px;height:760px}
#X-sg{position:relative;width:100%;height:130px;margin-top:10px}
#X-lw{top:1290px}
""", '<h1 id="X-t" class="q dkq">Hoy ya ni<br>necesitas <em>papel</em></h1>'
 + '<div id="X-pp" class="paper"><i style="left:40px;top:40px;transform:rotate(8deg)"></i><i style="left:20px;top:20px;transform:rotate(-4deg)"></i><i style="left:0;top:0"></i></div>'
 + '<div id="X-xx" class="xx">✕</div>'
 + '<div id="X-ph" class="phn"><div class="nt"></div><div class="sc"><div class="pg"><div class="t">DOCUMENTO</div><div class="ln"></div><div class="ln" style="width:70%"></div><div class="ln"></div><div class="ln" style="width:55%"></div>'
 + svg_sig('X-sg', color='#1B2A6B', sw=9, glow=False, style='position:relative;left:0;top:0') + '</div></div></div>'
 + '<p id="X-lw" class="law"><span><i></i>Colombia · Ley 527 de 1999</span></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.05);
tl.from("#X-pp",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},.15);
tl.from("#X-xx",{{opacity:0,scale:0,rotation:-90,duration:.35,ease:"back.out(2.5)"}},{s + d * .2:.2f});
tl.to("#X-pp",{{opacity:.35,duration:.3}},{s + d * .25:.2f});
tl.from("#X-ph",{{opacity:0,y:400,duration:.5,ease:"back.out(1.4)"}},{s + d * .25:.2f});
{draw('#X-sg', s + d * .45, .7)}
tl.from("#X-lw",{{opacity:0,y:40,scale:.6,duration:.45,ease:"back.out(2)"}},{s + d * .6:.2f});"""))

# 10 · end card: Pascal Sign + share prompt
S.append(('g10', 'qx', 2.4, """
#X-fl{opacity:0}
#X-t{top:570px;font-size:66px}
#X-ak{top:1250px}
#X-ak span{font-size:34px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div><img id="X-lg" class="lg" src="assets/brand/pascal-sign-logo.webp" alt="">'
 + '<h1 id="X-t" class="q">Firma desde tu <em>celular</em><br>con tu firma de siempre</h1>'
 + '<div id="X-qr" class="qr"><img src="assets/brand/qr-pascalsign.svg" alt=""><b>Pruébalo gratis 7 días</b><small>pascalia.lat/PascalSign</small></div>'
 + '<p id="X-ak" class="pill w"><span>📤 Mándaselo a quien firma con un garabato</span></p><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.5,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-lg",{{opacity:0,scale:.4,rotation:-12,duration:.55,ease:"back.out(1.8)"}},.1);
tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{s + d * .1:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .35:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .7:.2f});
tl.to("#X-ak",{{scale:1.05,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .85:.2f});"""))

BG = {
    'dk': '<div class="abs" style="inset:0;background:#0A0A0D"></div><div class="abs" style="inset:0;background:radial-gradient(60% 34% at 50% 34%,rgba(255,193,7,.16),transparent 72%)"></div>',
    'qx': '<div class="abs" style="inset:0;background:#0A0A0D"></div><div class="abs" style="inset:0;background:radial-gradient(55% 32% at 50% 30%,rgba(255,193,7,.22),transparent 72%)"></div>',
    'clay': '<div class="abs" style="inset:0;background:radial-gradient(80% 55% at 50% 40%,#5A3A22,#2A1A10 75%)"></div>',
    'parchd': '<div class="abs" style="inset:0;background:radial-gradient(80% 55% at 50% 40%,#3A2A1C,#140E09 78%)"></div>',
    'jp': '<div class="abs" style="inset:0;background:#120B0B"></div>',
    'lt': '<div class="light"></div>',
}
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
