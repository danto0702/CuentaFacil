# Builds "MesaViva · la dopamina del Año Nuevo Chino": neon motion-graphics explainer (black, red/gold/green) on variable rewards,
# ending with the lesson for restaurants and the MesaViva CTA. Brands are named in text only; no third-party logos.
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

CHM = lambda t: f'<div class="chip3"><span style="background:#111;box-shadow:0 0 0 2px #FFC107,0 0 22px rgba(255,193,7,.55)"><img src="assets/brand/mesaviva-logo.webp" alt="" style="border-radius:10px">{t}</span></div>'
SX, SY, SW, SH = 0, 0, 0, 0
CLIPS = {}
NE = {'r': '#FF2E4D', 'g': '#FFC93C', 'v': '#2BFF88'}
def glow(c, r=26): return f'text-shadow:0 0 {r // 3}px {c},0 0 {r}px {c},0 0 {r * 2}px {c}'
EXTRA2 = EXTRA2 + f"""
.neo{{position:absolute;left:50px;right:50px;text-align:center;font:800 96px/1.02 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em;text-transform:uppercase}}
.neo .r{{color:{NE['r']};{glow(NE['r'])}}}
.neo .g{{color:{NE['g']};{glow(NE['g'])}}}
.neo .v{{color:{NE['v']};{glow(NE['v'])}}}
.emo{{position:absolute;font-size:110px;line-height:1;filter:drop-shadow(0 0 18px rgba(255,201,60,.6))}}
.badge{{position:absolute;width:380px;padding:30px 20px;border-radius:30px;text-align:center;font:800 46px/1.05 "Montserrat",sans-serif;color:#fff;background:#0E0E14}}
.cup{{position:absolute}}
.cpn{{position:absolute;padding:14px 22px;border-radius:14px;border:3px dashed {NE['g']};color:{NE['g']};background:rgba(255,201,60,.08);font:800 40px/1 "Montserrat",sans-serif;{glow(NE['g'], 12)}}}
.notif{{position:absolute;left:150px;right:150px;display:flex;align-items:center;gap:16px;padding:18px 22px;border-radius:22px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18);color:#fff;font:700 30px/1.2 "Inter",sans-serif}}
.notif b{{font-size:40px}}
.phn{{position:absolute;left:300px;top:440px;width:480px;height:900px;border-radius:60px;background:#121218;box-shadow:0 0 0 4px #2A2A33,0 0 60px rgba(255,46,77,.35)}}
.phn .scr{{position:absolute;left:16px;top:16px;right:16px;bottom:16px;border-radius:46px;background:#1B0A0E;overflow:hidden}}
.phn h4{{margin:70px 0 0;text-align:center;font:800 40px/1.1 "Montserrat",sans-serif;color:{NE['g']};{glow(NE['g'], 14)}}}
.env{{position:absolute;top:300px;width:120px;height:170px;border-radius:16px;background:linear-gradient(#E3122C,#A80D20);box-shadow:0 0 24px rgba(255,46,77,.6)}}
.env:before{{content:"";position:absolute;left:0;right:0;top:0;height:60px;border-radius:16px 16px 50% 50%;background:#C40F25;box-shadow:0 4px 0 rgba(0,0,0,.2)}}
.env:after{{content:"福";position:absolute;left:0;right:0;top:44px;text-align:center;font:800 44px/1 serif;color:{NE['g']}}}
.prize{{position:absolute;left:46px;right:46px;top:500px;padding:26px;border-radius:26px;text-align:center;background:#fff;color:#1F1F1F;font:800 42px/1.15 "Montserrat",sans-serif;box-shadow:0 0 40px rgba(255,201,60,.8)}}
.prize small{{display:block;margin-top:6px;font:700 26px/1.2 "Inter",sans-serif;color:#8A6100}}
.fing{{position:absolute;width:80px;height:80px;border-radius:50%;background:rgba(255,201,60,.55);box-shadow:0 0 0 8px rgba(255,201,60,.22)}}
.conf{{position:absolute;width:18px;height:30px;border-radius:5px}}
.slot{{position:absolute;left:190px;top:470px;width:700px;height:520px;border-radius:40px;background:#16080C;box-shadow:inset 0 0 0 6px {NE['r']},0 0 50px rgba(255,46,77,.55)}}
.slot .win{{position:absolute;left:50px;right:50px;top:140px;height:240px;display:flex;gap:20px}}
.slot .reel{{flex:1;border-radius:22px;background:#fff;overflow:hidden;position:relative}}
.slot .strip{{position:absolute;left:0;right:0;top:0;display:flex;flex-direction:column;align-items:center}}
.slot .strip span{{height:240px;display:grid;place-items:center;font-size:120px;line-height:1}}
.slot h5{{position:absolute;left:0;right:0;top:44px;text-align:center;font:800 54px/1 "Montserrat",sans-serif;color:{NE['g']};{glow(NE['g'], 14)};margin:0}}
.bar{{position:absolute;bottom:0;width:180px;border-radius:18px 18px 0 0}}
.bl{{position:absolute;width:260px;text-align:center;font:800 32px/1.1 "Montserrat",sans-serif;color:#fff}}
.store{{position:absolute;left:150px;top:440px;width:780px}}
.qr{{position:absolute;width:250px;height:250px;border-radius:20px;background:#fff;padding:18px;box-shadow:0 0 40px rgba(43,255,136,.6)}}
.qr i{{display:block;width:100%;height:100%;background:conic-gradient(#111 0 25%,#fff 0 50%,#111 0 75%,#fff 0) 0 0/40px 40px}}
.wheel{{position:absolute;border-radius:50%}}
.cmt{{position:absolute;left:150px;right:150px;top:1180px;display:flex;align-items:center;justify-content:center;gap:18px;padding:26px;border-radius:999px;background:#fff;color:#1F1F1F;font:800 52px/1 "Montserrat",sans-serif;box-shadow:0 0 50px rgba(255,201,60,.8)}}
.legal{{position:absolute;left:80px;right:80px;top:1440px;text-align:center;font:600 22px/1.3 "Inter",sans-serif;color:#9A9AA6}}
"""
def wheel(id_, size, labels=('🎁', '☕', '-20%', '🍰', '2x1', '⭐'), cls=''):
    cols = [NE['r'], NE['g'], NE['v'], NE['r'], NE['g'], NE['v']]
    n = len(labels); segs = []
    for i in range(n):
        a0, a1 = 2 * 3.14159 * i / n, 2 * 3.14159 * (i + 1) / n
        import math
        x0, y0, x1, y1 = 50 + 48 * math.sin(a0), 50 - 48 * math.cos(a0), 50 + 48 * math.sin(a1), 50 - 48 * math.cos(a1)
        am = (a0 + a1) / 2; tx, ty = 50 + 31 * math.sin(am), 50 - 31 * math.cos(am)
        segs.append(f'<path d="M50 50 L{x0:.2f} {y0:.2f} A48 48 0 0 1 {x1:.2f} {y1:.2f} Z" fill="{cols[i]}" stroke="#0B0B0F" stroke-width="1"/><text x="{tx:.1f}" y="{ty + 3:.1f}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="9" fill="#0B0B0F" transform="rotate({am * 57.3:.0f} {tx:.1f} {ty:.1f})">{labels[i]}</text>')
    return f'<svg id="{id_}" class="wheel {cls}" viewBox="0 0 100 100" style="width:{size}px;height:{size}px;filter:drop-shadow(0 0 24px rgba(255,201,60,.6))"><circle cx="50" cy="50" r="49.5" fill="#0B0B0F"/>{"".join(segs)}<circle cx="50" cy="50" r="7" fill="#fff"/></svg>'
CUP = '<svg viewBox="0 0 200 260"><path d="M30 60 H170 L152 245 Q150 255 140 255 H60 Q50 255 48 245 Z" fill="#F4F1E8"/><rect x="38" y="120" width="124" height="70" rx="6" fill="#7A4A2A"/><rect x="18" y="40" width="164" height="26" rx="10" fill="#FFFFFF"/><rect x="40" y="26" width="120" height="18" rx="8" fill="#E9E5DA"/><path d="M70 20 C60 0 90 -4 80 -20 M105 20 C95 0 125 -4 115 -20 M140 20 C130 0 160 -4 150 -20" stroke="#ffffff" stroke-opacity=".5" stroke-width="5" fill="none"/></svg>'
BRAIN = f'<svg viewBox="0 0 240 200"><path d="M120 30 C90 5 40 15 38 55 C10 65 10 110 35 122 C25 160 70 185 100 165 C110 185 140 185 145 165 C175 185 215 160 205 122 C230 110 230 65 202 55 C200 15 150 5 120 30 Z" fill="none" stroke="{NE["r"]}" stroke-width="7" stroke-linejoin="round"/><path d="M120 30 V170 M75 60 C95 70 90 95 70 100 M165 60 C145 70 150 95 170 100 M70 135 C90 128 100 145 96 160 M170 135 C150 128 140 145 144 160" fill="none" stroke="{NE["r"]}" stroke-width="6" stroke-linecap="round"/></svg>'
S = []
S.append(('h01', 'nx', .25, """
#X-t{top:200px}
#X-sp{left:140px;top:560px;width:800px;height:800px}
#X-cup{left:390px;top:700px;width:300px}
#X-br{left:300px;top:760px;width:480px;opacity:0}
""", CHM('MesaViva')
 + '<svg id="X-sp" class="abs" viewBox="0 0 100 100">' + ''.join(f'<circle cx="50" cy="50" r="{r}" fill="none" stroke="{NE["r"] if i % 2 else NE["g"]}" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="{6 + i} {4 + i}"/>' for i, r in enumerate(range(8, 50, 6))) + '</svg>'
 + f'<div id="X-cup" class="cup">{CUP}</div><div id="X-br" class="cup">{BRAIN}</div>'
 + ''.join(f'<div class="emo X-s" style="left:{x}px;top:{y}px;font-size:{f}px">{e}</div>' for e, x, y, f in [('✨', 210, 760, 80), ('⚡', 800, 820, 90), ('✨', 820, 1140, 70), ('🧠', 160, 1120, 90)])
 + '<h1 id="X-t" class="neo">Starbucks<br>te está <span class="r">hipnotizando</span></h1>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.4,duration:.3,ease:"back.out(2)"}},0.05);
tl.fromTo("#X-sp",{{rotation:0,scale:.6,opacity:0}},{{rotation:200,scale:1.05,opacity:1,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-cup",{{y:500,duration:.4,ease:"back.out(1.5)"}},.15);
tl.to("#X-cup",{{scale:.2,rotation:180,opacity:0,duration:.4,ease:"power2.in"}},{s + d * .5:.2f});
tl.fromTo("#X-br",{{scale:.2,opacity:0}},{{scale:1,opacity:1,duration:.45,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from(".X-s",{{scale:0,duration:.25,ease:"back.out(3)",stagger:.08}},{s + d * .6:.2f});
tl.to("#X-br",{{scale:1.08,duration:.18,yoyo:true,repeat:{k(D, s + d * .75, .18)},ease:"sine.inOut"}},{s + d * .75:.2f});"""))
CPN = [('-30%', 120, 980, -10), ('2x1', 760, 1020, 8), ('🎁 Gratis', 140, 1250, 6), ('⚡ 1 hora', 700, 1290, -7)]
S.append(('h02', 'nx', .35, """
#X-t{top:190px;font-size:84px}
#X-a{left:80px;top:470px;box-shadow:inset 0 0 0 4px #2E7BFF,0 0 34px rgba(46,123,255,.6)}
#X-b{left:620px;top:470px;box-shadow:inset 0 0 0 4px #2BFF88,0 0 34px rgba(43,255,136,.6)}
#X-vs{left:470px;top:500px;font:800 90px/1 "Montserrat",sans-serif;color:#FFC93C;text-shadow:0 0 18px #FFC93C}
#X-cn{left:80px;top:700px;font:700 30px/1 "Inter",sans-serif;color:#9A9AA6}
#X-wh{left:390px;top:720px}
#X-n1{top:1450px}
""", CHM('MesaViva') + '<h1 id="X-t" class="neo"><span class="v">Luckin</span> vs <span class="g">Starbucks</span></h1>'
 + '<div id="X-a" class="badge">LUCKIN<br>COFFEE</div><div id="X-vs" class="abs">VS</div><div id="X-b" class="badge">STARBUCKS</div><p id="X-cn" class="abs">📍 China</p>'
 + wheel('X-wh', 300)
 + ''.join(f'<div class="cpn X-c" style="left:{x}px;top:{y}px;transform:rotate({r}deg)">{t}</div>' for t, x, y, r in CPN)
 + '<div id="X-n1" class="notif"><b>🔔</b><span>¿Y si me toca? Abre tu cupón sorpresa</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.3,ease:"back.out(2)"}},0);
tl.from("#X-a",{{x:-500,duration:.4,ease:"back.out(1.6)"}},.15);
tl.from("#X-b",{{x:500,duration:.4,ease:"back.out(1.6)"}},.15);
tl.from("#X-vs",{{scale:3,opacity:0,duration:.3,ease:"power4.in"}},.45);
tl.from("#X-cn",{{opacity:0,duration:.3}},.6);
tl.from("#X-wh",{{scale:0,duration:.4,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.to("#X-wh",{{rotation:1440,duration:{D - (s + d * .3) - .2:.2f},ease:"power2.out"}},{s + d * .3:.2f});
tl.from(".X-c",{{opacity:0,scale:.3,y:200,rotation:"+=40",duration:.35,ease:"back.out(2)",stagger:.15}},{s + d * .4:.2f});
tl.from("#X-n1",{{opacity:0,y:60,duration:.35,ease:"back.out(1.8)"}},{s + d * .78:.2f});"""))
S.append(('h03', 'nx', .45, """
#X-t{top:190px;font-size:76px}
#X-pin{left:70px;top:420px;font:800 36px/1 "Montserrat",sans-serif;color:#fff}
#X-e0{left:40px}#X-e1{left:164px}#X-e2{left:288px}
#X-fg{left:200px;top:480px}
""", CHM('MesaViva') + '<h1 id="X-t" class="neo">Starbucks <span class="r">copió</span><br>la fórmula</h1><p id="X-pin" class="abs">📍 Kuala Lumpur</p>'
 + '<div class="phn"><div class="scr"><h4>Elige tu sobre</h4>' + ''.join(f'<div id="X-e{i}" class="env X-e"></div>' for i in range(3))
 + ''.join(f'<div class="conf X-cf" style="left:{x}px;top:380px;background:{c}"></div>' for x, c in [(120, NE['r']), (170, NE['g']), (220, NE['v']), (260, NE['g']), (300, NE['r']), (340, NE['v'])])
 + '<div id="X-pz" class="prize"><span id="X-p0">☕ ¡Bebida gratis!</span><small>Premio sorpresa</small></div></div></div>'
 + '<div id="X-fg" class="fing"></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.3,duration:.3,ease:"back.out(2)"}},0);
tl.from("#X-pin",{{opacity:0,x:-80,duration:.3}},.2);
tl.from(".phn",{{y:1200,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-e",{{opacity:0,y:80,duration:.3,ease:"back.out(2)",stagger:.12}},{s + d * .2:.2f});
tl.fromTo("#X-fg",{{x:280,y:500,opacity:0}},{{x:330,y:360,opacity:1,duration:.5,ease:"power2.out"}},{s + d * .38:.2f});
tl.to("#X-e1",{{scale:1.15,duration:.15,yoyo:true,repeat:1}},{s + d * .45:.2f});
tl.to("#X-fg",{{opacity:0,duration:.2}},{s + d * .5:.2f});
tl.to(["#X-e0","#X-e2"],{{opacity:.25,duration:.25}},{s + d * .5:.2f});
tl.to("#X-e1",{{y:-60,rotation:-8,duration:.3}},{s + d * .52:.2f});
tl.fromTo(".X-cf",{{y:0,opacity:0}},{{y:(i)=>[-220,-300,-260,-320,-240,-280][i],x:(i)=>[-90,-40,10,40,80,120][i],rotation:(i)=>[200,-160,240,-200,180,-220][i],opacity:1,duration:.6,ease:"power2.out",stagger:.03}},{s + d * .55:.2f});
tl.to(".X-cf",{{y:"+=420",opacity:0,duration:.8,ease:"power2.in"}},{s + d * .55 + .6:.2f});
tl.from("#X-pz",{{opacity:0,scale:.4,duration:.4,ease:"back.out(2.2)"}},{s + d * .58:.2f});
tl.to("#X-p0",{{opacity:0,duration:.1}},{s + d * .78:.2f});tl.set("#X-p0",{{textContent:"💸 ¡20 % de descuento!"}},{s + d * .79:.2f});tl.to("#X-p0",{{opacity:1,duration:.1}},{s + d * .79:.2f});
tl.to("#X-p0",{{opacity:0,duration:.1}},{s + d * .9:.2f});tl.set("#X-p0",{{textContent:"🎁 ¡Sorpresa!"}},{s + d * .91:.2f});tl.to("#X-p0",{{opacity:1,duration:.1}},{s + d * .91:.2f});"""))
REELS = ['🍒', '⭐', '🍋', '7️⃣', '🍒', '⭐', '🍋', '🍒']
BARS = [('Compran más', 300, NE['r']), ('Recuerdan más', 400, NE['g']), ('Comparten más', 500, NE['v'])]
S.append(('h04', 'nx', .45, """
#X-t{top:180px;font-size:70px}
#X-br{left:300px;top:520px;width:480px;opacity:0}
#X-dp{top:960px;font-size:72px}
#X-ch{left:120px;top:880px;width:840px;height:520px}
""", CHM('MesaViva') + '<h1 id="X-t" class="neo">Recompensa variable<br>= <span class="r">tragamonedas</span></h1>'
 + '<div id="X-sl" class="slot"><h5>¿Y si me toca?</h5><div class="win">' + ''.join(f'<div class="reel"><div class="strip X-s{i}">' + ''.join(f'<span>{e}</span>' for e in REELS[i:] + REELS[:i]) + '</div></div>' for i in range(3)) + '</div></div>'
 + f'<div id="X-br" class="cup">{BRAIN}</div>'
 + ''.join(f'<div class="emo X-k" style="left:{x}px;top:{y}px;font-size:70px">⚡</div>' for x, y in [(240, 560), (790, 600), (260, 830), (770, 860)])
 + '<p id="X-dp" class="neo" style="font-size:60px"><span class="g">+ dopamina</span></p>'
 + '<div id="X-ch" class="abs">' + ''.join(f'<div class="bar X-b" style="left:{40 + i * 290}px;height:{h}px;background:{c};box-shadow:0 0 30px {c}"></div><p class="bl" style="left:{i * 290}px;top:{520 + 16}px">{t}</p>' for i, (t, h, c) in enumerate(BARS)) + '</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.3,ease:"back.out(2)"}},0);
tl.from("#X-sl",{{scale:.5,opacity:0,duration:.4,ease:"back.out(1.8)"}},.15);
""" + ''.join(f'tl.fromTo(".X-s{i}",{{y:0}},{{y:-1680,duration:{d * .3 + i * .3:.2f},ease:"power1.inOut"}},.4);\n' for i in range(3)) + f"""tl.to("#X-sl",{{scale:.2,opacity:0,rotation:-20,duration:.35,ease:"power2.in"}},{s + d * .45:.2f});
tl.fromTo("#X-br",{{scale:.3,opacity:0}},{{scale:1,opacity:1,duration:.4,ease:"back.out(2)"}},{s + d * .48:.2f});
tl.from(".X-k",{{scale:0,rotation:-30,duration:.25,ease:"back.out(3)",stagger:.08}},{s + d * .55:.2f});
tl.from("#X-dp",{{opacity:0,scale:.6,duration:.3,ease:"back.out(2)"}},{s + d * .62:.2f});
tl.to(["#X-br",".X-k","#X-dp"],{{y:-330,scale:.6,duration:.4,ease:"power2.inOut"}},{s + d * .78:.2f});
tl.from(".X-b",{{scaleY:0,transformOrigin:"50% 100%",duration:.35,ease:"back.out(1.6)",stagger:.12}},{s + d * .8:.2f});
tl.from("#X-ch .bl",{{opacity:0,duration:.25,stagger:.12}},{s + d * .82:.2f});"""))
STORE = f'<svg viewBox="0 0 780 600"><rect x="40" y="120" width="700" height="460" rx="20" fill="#14141B" stroke="{NE["v"]}" stroke-width="5"/><path d="M20 120 H760 L730 40 H50 Z" fill="{NE["r"]}"/>' + ''.join(f'<path d="M{50 + i * 85} 120 L{80 + i * 85} 40 H{122 + i * 85} L{92 + i * 85} 120 Z" fill="#fff" opacity=".85"/>' for i in range(8)) + f'<rect x="230" y="150" width="320" height="60" rx="12" fill="#0B0B0F" stroke="{NE["g"]}" stroke-width="3"/><text x="390" y="190" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="30" fill="{NE["g"]}">TU RESTAURANTE</text><rect x="100" y="430" width="580" height="22" rx="8" fill="#3A2A20"/><rect x="140" y="452" width="16" height="110" fill="#3A2A20"/><rect x="624" y="452" width="16" height="110" fill="#3A2A20"/><circle cx="160" cy="300" r="34" fill="#E8D2B8"/><rect x="118" y="336" width="84" height="100" rx="30" fill="{NE["r"]}"/></svg>'
S.append(('h05', 'nx', .45, """
#X-t{top:180px;font-size:72px}
#X-qr{left:610px;top:720px}
#X-wh{left:560px;top:670px;opacity:0}
#X-tag{left:0;right:0;top:1260px;text-align:center;font:800 64px/1 "Montserrat",sans-serif;color:#2BFF88;text-shadow:0 0 18px #2BFF88}
#X-no{left:120px;top:1000px;font:800 54px/1 "Montserrat",sans-serif;color:#FF2E4D;text-shadow:0 0 14px #FF2E4D}
""", CHM('MesaViva') + '<h1 id="X-t" class="neo">La lección para<br><span class="g">tu restaurante</span></h1>'
 + f'<div id="X-st" class="store">{STORE}</div><div id="X-no" class="abs">❌ -10 %</div><div id="X-qr" class="qr"><i></i></div>' + wheel('X-wh', 360)
 + '<p id="X-tag" class="abs">JUEGA Y GANA 🎉</p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.3,ease:"back.out(2)"}},0);
tl.from("#X-st",{{opacity:0,scale:.8,duration:.45,ease:"back.out(1.5)"}},.15);
tl.from("#X-no",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.2)"}},{s + d * .2:.2f});
tl.to("#X-no",{{opacity:0,x:-200,duration:.3}},{s + d * .45:.2f});
tl.from("#X-qr",{{scale:0,duration:.35,ease:"back.out(2.2)"}},{s + d * .4:.2f});
tl.to("#X-qr",{{scale:0,rotation:180,duration:.35,ease:"power2.in"}},{s + d * .62:.2f});
tl.fromTo("#X-wh",{{scale:0,opacity:0}},{{scale:1,opacity:1,duration:.4,ease:"back.out(2)"}},{s + d * .66:.2f});
tl.to("#X-wh",{{rotation:1080,duration:{D - (s + d * .66):.2f},ease:"power2.out"}},{s + d * .66:.2f});
tl.from("#X-tag",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.2)"}},{s + d * .74:.2f});"""))
S.append(('h06', 'nx', 2.4, """
#X-lg{left:390px;top:180px;width:300px;height:300px;border-radius:60px;box-shadow:0 0 0 4px #FFC93C,0 0 60px rgba(255,201,60,.7)}
#X-t{top:520px;font-size:96px}
#X-wh{left:390px;top:850px;width:300px}
#X-cm{top:1200px}
""", '<img id="X-lg" class="abs" src="assets/brand/mesaviva-logo.webp" alt=""><h1 id="X-t" class="neo">MesaViva<br><span class="g">juega y gana</span></h1>' + wheel('X-wh', 300)
 + '<div id="X-cm" class="cmt">💬 Comenta <span id="X-cw" style="color:#FF2E4D">CARTA</span></div>'
 + '<p class="legal">La ruleta de premios se activa conforme a la normativa de juegos promocionales.</p>',
 lambda D, s, d: f"""tl.from("#X-lg",{{scale:0,rotation:-20,duration:.45,ease:"back.out(2)"}},0.05);
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.35,ease:"back.out(2)"}},.2);
tl.from("#X-wh",{{scale:0,duration:.4,ease:"back.out(2)"}},.4);
tl.to("#X-wh",{{rotation:1440,duration:{D - .5:.2f},ease:"power2.out"}},.4);
tl.from("#X-cm",{{opacity:0,y:60,duration:.4,ease:"back.out(1.8)"}},{s + d * .55:.2f});
tl.to("#X-cw",{{opacity:.15,duration:.22,yoyo:true,repeat:{k(D, s + d * .6, .22)},ease:"steps(1)"}},{s + d * .6:.2f});
tl.to("#X-cm",{{scale:1.05,duration:.3,yoyo:true,repeat:{k(D, s + d * .6, .3)},ease:"sine.inOut"}},{s + d * .6:.2f});"""))

BG = {'nx': '<div class="abs" style="inset:0;background:#07070B"></div><div class="abs" style="inset:0;background:radial-gradient(60% 35% at 15% 20%,rgba(255,46,77,.18),transparent 70%),radial-gradient(55% 35% at 85% 75%,rgba(43,255,136,.13),transparent 70%),radial-gradient(70% 40% at 50% 50%,rgba(255,201,60,.08),transparent 75%)"></div>', 'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>', 'ty': '<div class="light"></div><div class="abs" style="inset:0;background:radial-gradient(80% 50% at 50% 30%,rgba(255,193,7,.45),transparent 75%)"></div>'}
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
            caps += f'<div class="cap"><span id="{cid}-c{j}" style="background:#FFC93C;color:#0B0B0F;box-shadow:0 0 24px rgba(255,201,60,.6)">{part}</span></div>'
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
