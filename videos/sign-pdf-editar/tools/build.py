# Builds "Pascal Sign + PascalPDF Studio · corrígelo y fírmalo": a document arrives with an error; Camila fixes it in PascalPDF Studio
# and signs it there (Pascal Sign inside, same saved signatures); implicit peak, before/after and a 2-line message to forward.
# The method stays implicit on screen and in the voice (no step names); always "documentos", never "cuenta de cobro".
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
EXTRA2 = EXTRA2 + f"""
.qd{{position:absolute;left:60px;right:60px;text-align:center;font:800 78px/1.05 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.02em}}
.qd em{{font-style:normal;background:linear-gradient(transparent 58%,{Y} 58%,{Y} 92%,transparent 92%);padding:0 .06em}}
.stepn{{position:absolute;left:0;right:0;top:110px;text-align:center}}
.stepn span{{display:inline-flex;align-items:center;gap:14px;padding:12px 28px 12px 12px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.stepn b{{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:{Y};color:#111;font:800 32px/1 "Montserrat",sans-serif}}
.bub{{position:absolute;padding:22px 30px;border-radius:30px;background:#fff;color:#1F1F1F;font:800 40px/1.1 "Montserrat",sans-serif;box-shadow:0 20px 40px -16px rgba(31,31,31,.4)}}
.bub:after{{content:"";position:absolute;bottom:-22px;width:0;height:0;border:22px solid transparent;border-top-color:#fff;border-bottom:0}}
.bub.l:after{{left:60px}}.bub.r:after{{right:60px}}
.stp{{position:absolute;left:90px;right:90px;padding:26px;border-radius:24px;border:8px solid #E5484D;color:#E5484D;background:rgba(255,255,255,.92);text-align:center;font:800 60px/1 "Montserrat",sans-serif;transform:rotate(-6deg)}}
.cold{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(120,180,255,.0),rgba(120,180,255,.28))}}
.node{{position:absolute;width:250px;padding:20px 16px;border-radius:26px;background:#16161B;box-shadow:inset 0 0 0 3px {Y},0 0 40px rgba(255,193,7,.3);text-align:center;color:#fff;font:800 32px/1.1 "Montserrat",sans-serif}}
.node i{{display:block;margin:0 auto 10px;width:60px;height:60px}}
.ring{{position:absolute;border-radius:50%;border:8px dashed rgba(255,193,7,.55)}}
.orb{{position:absolute;width:640px;height:640px}}
.orb i{{position:absolute;left:296px;top:-24px;width:48px;height:48px;border-radius:50%;background:{Y};box-shadow:0 0 30px {Y}}}
.mid{{position:absolute;left:0;right:0;text-align:center;font:800 70px/1 "Montserrat",sans-serif;color:{Y}}}
.mid small{{display:block;margin-top:8px;font:700 32px/1 "Inter",sans-serif;color:#CFCFCF}}
.mob2{{position:absolute;border-radius:64px;background:#0E0E12;box-shadow:inset 0 0 0 12px #2A2A33,0 40px 80px -30px rgba(31,31,31,.6);overflow:hidden}}
.mob2 .sc{{position:absolute;inset:12px;border-radius:52px;background:#F4F4F6;padding:80px 26px 26px}}
.mob2 .hdr{{display:flex;align-items:center;gap:12px;font:800 28px/1 "Montserrat",sans-serif;color:#1F1F1F;margin-bottom:20px}}
.mob2 .hdr img{{width:48px;height:48px;border-radius:12px}}
.mp2{{background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 24px -12px rgba(0,0,0,.35)}}
.mp2 .t{{font:800 24px/1.2 "Montserrat",sans-serif;color:#1F1F1F;text-align:center}}
.mp2 .ln{{height:12px;margin:16px 0;border-radius:6px;background:#E3E3E3}}
.sgok{{margin-top:22px;padding:18px;border-radius:18px;background:#25A55F;color:#fff;text-align:center;font:800 30px/1 "Montserrat",sans-serif}}
.pl2{{display:inline-flex;align-items:center;gap:10px;margin:0 10px;padding:18px 28px;border-radius:999px;font:800 34px/1 "Montserrat",sans-serif}}
.ba{{position:absolute;border-radius:30px;overflow:hidden;box-shadow:0 30px 60px -24px rgba(31,31,31,.55);background:#222}}
.ba img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%}}
.ba .bf{{filter:grayscale(1) brightness(.55) contrast(.85)}}
.ba .af{{clip-path:inset(0 0 0 50%)}}
.ba .lb{{position:absolute;top:24px;padding:10px 20px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}}
.ba .hd{{position:absolute;top:0;bottom:0;left:50%;width:8px;margin-left:-4px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,.4)}}
.ba .hd:after{{content:"⇆";position:absolute;top:50%;left:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;background:#fff;display:grid;place-items:center;font:800 40px/1 "Inter",sans-serif;color:#1F1F1F}}
.cmt{{position:absolute;padding:16px 22px;border-radius:22px;background:#fff;color:#1F1F1F;font:700 30px/1.15 "Inter",sans-serif;box-shadow:0 16px 30px -14px rgba(31,31,31,.4)}}
.cmt b{{font-weight:800}}
.cmt.hit{{box-shadow:inset 0 0 0 4px {Y},0 16px 30px -14px rgba(31,31,31,.4)}}
.stp2{{position:absolute;left:90px;display:flex;align-items:center;gap:16px;padding:18px 26px;border-radius:20px;background:#1C1C22;box-shadow:inset 0 0 0 2px #3A3A44;color:#fff;font:700 34px/1 "Inter",sans-serif}}
.stp2 i{{width:44px;height:44px}}
.stp2 b{{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:{Y};color:#111;font:800 26px/1 "Montserrat",sans-serif}}
.pdfc{{position:absolute;border-radius:18px;background:#fff;padding:26px;box-shadow:0 30px 70px -20px rgba(0,0,0,.8);overflow:hidden}}
.pdfc .t{{font:800 28px/1.1 "Montserrat",sans-serif;color:#1F1F1F;text-align:center;margin-bottom:16px}}
.pdfc .im{{position:relative;height:300px;border-radius:12px;overflow:hidden;margin-bottom:14px}}
.pdfc .im img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%}}
.pdfc .im span{{position:absolute;left:12px;top:12px;padding:6px 12px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 20px/1 "Montserrat",sans-serif}}
.wm{{position:absolute;left:-40px;right:-40px;top:46%;text-align:center;transform:rotate(-24deg);font:800 54px/1 "Montserrat",sans-serif;color:rgba(255,193,7,.55);letter-spacing:.04em}}
.fchip{{position:absolute;left:0;right:0;text-align:center}}
.fchip span{{display:inline-flex;align-items:center;gap:12px;padding:16px 26px;border-radius:999px;background:#25A55F;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.m.pdfm{{display:flex;align-items:center;gap:14px}}
.m.pdfm i{{flex:none;width:56px;height:64px;border-radius:8px;background:#E5484D;color:#fff;display:grid;place-items:center;font:800 16px/1 "Montserrat",sans-serif}}
.m.tpl{{box-shadow:0 0 0 4px {Y};background:#0B5345}}
.fwd{{position:absolute;padding:16px 26px;border-radius:999px;background:{Y};color:#111;font:800 32px/1 "Montserrat",sans-serif;box-shadow:0 14px 30px -10px rgba(0,0,0,.5)}}
.sent{{position:absolute;left:0;right:0;text-align:center}}
.sent span{{display:inline-flex;align-items:center;gap:12px;padding:16px 26px;border-radius:999px;background:#1F1F1F;color:#fff;font:700 30px/1 "Inter",sans-serif}}
.sent b{{color:#25D366}}
.lg2{{position:absolute;width:250px;height:250px;border-radius:60px;box-shadow:0 0 0 4px {Y},0 0 70px rgba(255,193,7,.5)}}
.plus{{position:absolute;left:0;right:0;text-align:center;font:800 90px/1 "Montserrat",sans-serif;color:{Y}}}
.ask{{position:absolute;left:0;right:0;text-align:center}}
.ask span{{display:inline-flex;align-items:center;gap:14px;padding:18px 30px;border-radius:999px;background:#fff;color:#111;font:800 38px/1 "Montserrat",sans-serif}}
.ask b{{color:#111;background:{Y};padding:6px 14px;border-radius:12px}}
"""
EXTRA2 = EXTRA2 + f"""
.tabs{{display:flex;gap:10px;margin-top:20px}}
.tabs span{{flex:1;white-space:nowrap;padding:16px 4px;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 2px #E3E3E3;text-align:center;font:800 22px/1 "Montserrat",sans-serif;color:#1F1F1F}}
.tabs span.on{{background:{Y};box-shadow:none}}
.tmr{{position:absolute;left:0;right:0;text-align:center}}
.tmr span{{display:inline-flex;align-items:center;gap:12px;padding:18px 30px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 38px/1 "Montserrat",sans-serif}}
.tmr i{{width:44px;height:44px}}
.pk{{position:absolute;left:0;right:0;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:.08em}}
.ekg{{position:absolute;left:60px;width:960px;height:200px}}
.vs2{{position:absolute;width:450px;padding:36px 30px;border-radius:32px}}
.vs2 h3{{margin:0 0 22px;font:800 54px/1 "Montserrat",sans-serif}}
.vs2 p{{display:flex;align-items:center;gap:16px;margin:22px 0;font:700 40px/1.15 "Inter",sans-serif}}
.vs2 p i{{flex:none;width:70px;height:70px;border-radius:18px;padding:14px}}
.shr{{position:absolute;left:0;right:0;text-align:center}}
.shr span{{display:inline-flex;align-items:center;gap:12px;padding:22px 34px;border-radius:22px;background:#1F1F1F;color:#fff;font:800 36px/1 "Montserrat",sans-serif;box-shadow:0 16px 34px -12px rgba(0,0,0,.5)}}
.shot{{position:absolute;inset:0;background:#fff}}
.crn{{position:absolute;width:90px;height:90px;border:10px solid {Y}}}
.crown{{position:absolute;padding:14px 24px;border-radius:999px;background:{Y};color:#111;font:800 38px/1 "Montserrat",sans-serif;box-shadow:0 14px 30px -10px rgba(0,0,0,.4)}}
"""
EXTRA2 = EXTRA2 + f"""
.dc{{position:absolute;border-radius:18px;background:#fff;padding:34px 34px 30px;box-shadow:0 30px 60px -24px rgba(0,0,0,.6)}}
.dc .t{{font:800 28px/1.2 "Montserrat",sans-serif;color:#1F1F1F;text-align:center;margin-bottom:8px}}
.dc .ln,.mp2 .ln{{height:12px;margin:16px 0;border-radius:6px;background:#E3E3E3}}
.dc p,.mp2 p{{font:600 28px/1.35 "Inter",sans-serif;color:#1F1F1F;margin:14px 0}}
.bad{{color:#B42318;text-decoration:underline wavy #E5484D 3px;text-underline-offset:6px}}
.xb{{position:absolute;width:84px;height:84px;border-radius:50%;background:#E5484D;color:#fff;display:grid;place-items:center;font:800 50px/1 "Montserrat",sans-serif;box-shadow:0 12px 26px -8px rgba(0,0,0,.5)}}
.app{{position:absolute;width:300px;text-align:center}}
.app img{{display:block;width:240px;height:240px;margin:0 auto 18px;border-radius:56px;box-shadow:0 24px 50px -20px rgba(31,31,31,.5)}}
.app span{{display:inline-block;padding:14px 22px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.app.hot img{{box-shadow:0 0 0 6px {Y},0 0 60px rgba(255,193,7,.6)}}
.app.hot span{{background:{Y};color:#111}}
.pls{{position:absolute;left:0;right:0;text-align:center;font:800 110px/1 "Montserrat",sans-serif;color:#1F1F1F}}
.tb2{{display:flex;gap:10px;margin:0 0 16px}}
.tb2 i{{flex:1;height:58px;border-radius:14px;background:#1C1C22;padding:12px}}
.tb2 i.on{{background:{Y}}}
.sel2{{background:rgba(255,193,7,.45);border-radius:6px;padding:0 4px}}
.car2{{display:inline-block;width:4px;height:30px;background:#1F1F1F;vertical-align:-5px;margin-left:2px}}
.addt{{margin-top:12px;padding:10px 14px;border:3px dashed {Y};border-radius:10px;font:700 26px/1.2 "Inter",sans-serif;color:#1F1F1F}}
.sigs{{display:flex;gap:12px;margin-top:16px}}
.sigs div{{flex:1;height:96px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 2px #E3E3E3;padding:10px}}
.sigs div.on{{box-shadow:inset 0 0 0 4px {Y}}}
.sigs svg{{width:100%;height:100%}}
.lbl{{font:800 22px/1 "Montserrat",sans-serif;color:#5C5C5C;margin-top:18px}}
.inside{{position:absolute;left:0;right:0;text-align:center}}
.inside span{{display:inline-flex;align-items:center;gap:14px;padding:14px 26px 14px 14px;border-radius:999px;background:{Y};color:#111;font:800 34px/1 "Montserrat",sans-serif}}
.inside img{{width:58px;height:58px;border-radius:14px}}
.chk{{position:absolute;left:0;right:0;text-align:center}}
.chk span{{display:inline-flex;align-items:center;gap:10px;margin:0 8px;padding:16px 24px;border-radius:999px;background:#25A55F;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.tag2{{position:absolute;padding:10px 20px;border-radius:999px;font:800 28px/1 "Montserrat",sans-serif}}
.stamp2{{position:absolute;padding:12px 22px;border:6px solid #25A55F;border-radius:14px;color:#25A55F;font:800 34px/1 "Montserrat",sans-serif;transform:rotate(-10deg);background:rgba(255,255,255,.9)}}
.app2{{position:absolute;width:420px;text-align:center}}
.app2 img{{display:block;width:230px;height:230px;margin:0 auto 16px;border-radius:56px;box-shadow:0 0 0 4px {Y},0 0 60px rgba(255,193,7,.5)}}
.app2 b{{display:block;font:800 40px/1.1 "Montserrat",sans-serif;color:#fff}}
.app2 small{{display:block;margin-top:8px;font:700 30px/1.1 "Inter",sans-serif;color:{Y}}}
"""
DOCX = lambda fecha, extra='': f'<div class="t">CONTRATO DE SERVICIOS</div><div class="ln"></div><div class="ln" style="width:75%"></div><p>Fecha: {fecha}</p><div class="ln"></div><div class="ln" style="width:55%"></div>{extra}'
S = []
S.append(('e01', 'td', .4, """
#X-t{top:170px;font-size:78px}
#X-d{left:60px;top:470px;width:560px;transform:rotate(-3deg)}
#X-xb{left:560px;top:430px}
#X-cm{left:620px;top:560px;height:930px}
""", '<h1 id="X-t" class="q">¿Y si viene<br>con un <em>error</em>?</h1>'
 + '<div id="X-d" class="dc">' + DOCX('<span id="X-bd">15 de noviembre de 2025</span>') + '</div><div id="X-xb" class="xb" data-layout-allow-overlap>✕</div>'
 + '<img id="X-cm" class="char" src="assets/chars/camila-duda.webp" alt="">',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-d",{{opacity:0,y:300,rotation:6,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-cm",{{opacity:0,x:300,duration:.5,ease:"power3.out"}},.3);
tl.set("#X-bd",{{className:"bad"}},{s + d * .55:.2f});
tl.from("#X-xb",{{opacity:0,scale:0,rotation:-90,duration:.35,ease:"back.out(2.5)"}},{s + d * .58:.2f});
tl.to("#X-d",{{x:8,duration:.06,yoyo:true,repeat:5}},{s + d * .6:.2f});"""))
S.append(('e02', 'ty', .4, """
#X-t{top:190px;font-size:72px}
#X-a1{left:110px;top:560px}
#X-a2{left:670px;top:560px}
#X-pl{top:680px}
""", '<h1 id="X-t" class="qd">¿Solo firmar…<br>o también <em>corregir</em>?</h1>'
 + '<div id="X-a1" class="app"><img src="assets/brand/pascal-sign-logo.webp" alt=""><span>Firmar</span></div>'
 + '<p id="X-pl" class="pls">+</p>'
 + '<div id="X-a2" class="app hot"><img src="assets/brand/pascalpdf-logo.png" alt=""><span>Corregir y firmar</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-a1",{{opacity:0,scale:.4,duration:.45,ease:"back.out(2)"}},{s + d * .05:.2f});
tl.from("#X-pl",{{opacity:0,scale:0,duration:.3,ease:"back.out(3)"}},{s + d * .5:.2f});
tl.from("#X-a2",{{opacity:0,scale:.3,rotation:-12,duration:.5,ease:"back.out(2)"}},{s + d * .62:.2f});
tl.to("#X-a2",{{scale:1.06,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .75:.2f});"""))
PHONE_HDR = '<div class="hdr"><img src="assets/brand/pascalpdf-logo.png" alt="">PascalPDF Studio</div>'
S.append(('e03', 'qx', .4, """
#X-t{top:160px;font-size:74px}
#X-ph{left:280px;top:370px;width:520px;height:980px}
#X-ad{opacity:1}
""", '<h1 id="X-t" class="q">Edítalo como<br>un <em>Word</em></h1>'
 + '<div id="X-ph" class="mob2"><div class="sc">' + PHONE_HDR
 + f'<div class="tb2"><i id="X-i1">{icon("pen", Y)}</i><i>{icon("doc", Y)}</i><i id="X-i3">{icon("plus", Y)}</i><i>{icon("sparkle", Y)}</i></div>'
 + '<div class="mp2">' + DOCX('15 de noviembre de <span id="X-w" class="sel2">2025</span><span id="X-cr" class="car2"></span>', '<div id="X-ad" class="addt">Anexo: cronograma de entregas</div>') + '</div></div></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-ph",{{opacity:0,y:700,duration:.55,ease:"back.out(1.3)"}},.15);
tl.to("#X-cr",{{opacity:0,duration:.01,yoyo:true,repeat:{max(1, int(D / .45))},repeatDelay:.44}},0);
tl.to("#X-i1",{{backgroundColor:"#FFC107",duration:.2}},{s + d * .2:.2f});
tl.to("#X-w",{{backgroundColor:"rgba(255,193,7,.9)",duration:.2}},{s + d * .3:.2f});
tl.set("#X-w",{{textContent:"2"}},{s + d * .42:.2f});tl.set("#X-w",{{textContent:"20"}},{s + d * .45:.2f});tl.set("#X-w",{{textContent:"202"}},{s + d * .48:.2f});tl.set("#X-w",{{textContent:"2026",backgroundColor:"rgba(43,255,136,.35)"}},{s + d * .51:.2f});
tl.to("#X-i1",{{backgroundColor:"#1C1C22",duration:.2}},{s + d * .6:.2f});
tl.to("#X-i3",{{backgroundColor:"#FFC107",duration:.2}},{s + d * .6:.2f});
tl.from("#X-ad",{{opacity:0,scale:.6,duration:.35,ease:"back.out(2.2)"}},{s + d * .66:.2f});"""))
S.append(('e04', 'qx', .4, """
#X-t{top:160px;font-size:74px}
#X-ph{left:280px;top:370px;width:520px;height:980px}
#X-sg{width:58%;margin-top:4px}
#X-in{top:1390px}
""", '<h1 id="X-t" class="q">Y fírmalo<br><em>ahí mismo</em></h1>'
 + '<div id="X-ph" class="mob2"><div class="sc">' + PHONE_HDR
 + '<div class="mp2">' + DOCX('15 de noviembre de <span style="background:rgba(43,255,136,.35);border-radius:6px;padding:0 4px">2026</span>', f'<div id="X-sg">{sig(1, "", "", "#1B2A6B", 7)}</div>') + '</div>'
 + f'<p class="lbl">MIS FIRMAS</p><div class="sigs"><div id="X-s1">{sig(1, "", "", "#1B2A6B", 6)}</div><div>{sig(2, "", "", "#1B2A6B", 6)}</div></div></div></div>'
 + '<div id="X-in" class="inside"><span><img src="assets/brand/pascal-sign-logo.webp" alt="">Pascal Sign está adentro</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-ph",{{opacity:0,scale:.9,duration:.4,ease:"power3.out"}},.1);
tl.to("#X-s1",{{boxShadow:"inset 0 0 0 5px #FFC107",duration:.2}},{s + d * .35:.2f});
tl.from("#X-sg",{{clipPath:"inset(0 100% 0 0)",duration:.7,ease:"power1.inOut"}},{s + d * .45:.2f});
tl.from("#X-in",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2.2)"}},{s + d * .2:.2f});"""))
S.append(('e05', 'ty', .5, """
#X-cm{left:330px;top:540px;height:940px}
#X-b{left:110px;top:400px}
#X-ck{top:190px}
""", '<p id="X-ck" class="chk"><span>✓ Corregido</span><span>✓ Firmado</span><span>✓ Enviado</span></p>'
 + '<img id="X-cm" class="char" src="assets/chars/camila-feliz.webp" alt=""><div id="X-b" class="bub l" data-layout-allow-overlap>¡Quedó perfecto! 😍</div>',
 lambda D, s, d: f"""tl.from("#X-cm",{{opacity:0,y:300,scale:.9,duration:.5,ease:"back.out(1.6)"}},.05);
tl.from("#X-ck span",{{opacity:0,y:-40,scale:.5,duration:.3,ease:"back.out(2.5)",stagger:{d * .14:.2f}}},{s:.2f});
tl.from("#X-b",{{opacity:0,scale:.3,transformOrigin:"20% 100%",duration:.35,ease:"back.out(2.5)"}},{s + d * .55:.2f});
tl.to("#X-cm",{{scale:1.04,duration:.25,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .6:.2f});"""))
S.append(('e06', 'tl', .4, """
#X-t{top:180px;font-size:74px}
#X-d1{left:40px;top:470px;width:480px;transform:rotate(-3deg);filter:saturate(.6)}
#X-d2{left:560px;top:500px;width:480px;transform:rotate(2deg);box-shadow:0 0 0 5px #FFC107,0 30px 60px -24px rgba(0,0,0,.5)}
#X-g1{left:60px;top:420px;background:#1F1F1F;color:#fff}
#X-g2{left:860px;top:450px;background:#FFC107;color:#111}
#X-sg2{width:70%;margin-top:4px}
#X-st{left:720px;top:1010px}
""", '<h1 id="X-t" class="qd">De esto…<br><em>a esto</em></h1>'
 + '<div id="X-d1" class="dc">' + DOCX('<span class="bad">15 de noviembre de 2025</span>', '<p style="color:#9A9A9A">Firma: ____________</p>') + '</div>'
 + '<div id="X-d2" class="dc">' + DOCX('15 de noviembre de 2026', f'<div id="X-sg2">{sig(1, "", "", "#1B2A6B", 7)}</div>') + '</div>'
 + '<span id="X-g1" class="tag2" data-layout-allow-overlap>ANTES</span><span id="X-g2" class="tag2" data-layout-allow-overlap>AHORA</span><div id="X-st" class="stamp2" data-layout-allow-overlap>✓ FIRMADO</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from(["#X-d1","#X-g1"],{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .05:.2f});
tl.from(["#X-d2","#X-g2"],{{opacity:0,x:300,scale:.85,duration:.5,ease:"back.out(1.6)"}},{s + d * .45:.2f});
tl.from("#X-st",{{opacity:0,scale:2.4,duration:.3,ease:"power4.in"}},{s + d * .75:.2f});"""))
S.append(('e07', 'tl', .5, """
#X-t{top:190px;font-size:66px}
#X-ch{left:120px;top:360px;width:840px;height:720px}
#X-ch .m{font-size:40px;line-height:1.3}
#X-ch .m small{font-size:22px}
#X-ch .top{font-size:34px}
#X-m2{box-shadow:0 0 0 5px #FFC107}
#X-n1{left:100px;top:340px;border-right:0;border-bottom:0}
#X-n2{left:890px;top:340px;border-left:0;border-bottom:0}
#X-n3{left:100px;top:1010px;border-right:0;border-top:0}
#X-n4{left:890px;top:1010px;border-left:0;border-top:0}
#X-hn{left:760px;top:1080px;height:440px}
""", '<h1 id="X-t" class="qd">«¿Me <em>enseñas</em>?»</h1>'
 + chat('X-ch', '', [('X-m1', False, '¿Cómo corregiste el PDF tan rápido? 😮', '9:02'),
                     ('X-m2', True, '¿Te toca corregir un PDF antes de firmarlo? 🙈<br>Yo lo edito y lo firmo desde el celular 👉 <b>pascalia.lat/PascalPDF_Studio</b>', '9:02 <b>✓✓</b>')], who='Hernando · compañero', sub='en línea')
 + ''.join(f'<div id="X-n{i}" class="crn X-cn" data-layout-allow-overlap></div>' for i in range(1, 5))
 + '<img id="X-hn" class="char" src="assets/chars/hernando-pulgar.webp" alt="" data-layout-allow-overlap><div id="X-sh2" class="shot" style="opacity:0"></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-ch",{{opacity:0,y:300,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-m1",{{opacity:0,y:30,duration:.3}},{s + d * .15:.2f});
tl.from("#X-m2",{{opacity:0,y:30,scale:.9,duration:.4,ease:"back.out(2)"}},{s + d * .5:.2f});
tl.from(".X-cn",{{opacity:0,scale:1.6,duration:.3,ease:"power3.out"}},{s + d * .8:.2f});
tl.fromTo("#X-sh2",{{opacity:.85}},{{opacity:0,duration:.4,ease:"power2.out"}},{s + d * .86:.2f});
tl.from("#X-hn",{{opacity:0,y:200,duration:.45,ease:"back.out(1.6)"}},{s + d * .9:.2f});"""))
S.append(('e08', 'qx', 2.6, """
#X-fl{opacity:0}
#X-a1{left:90px;top:170px}
#X-a2{left:570px;top:170px}
#X-t{top:640px;font-size:52px;left:40px;right:40px}
#X-qr{left:390px;top:760px;width:300px;padding:20px 20px 12px;border-radius:28px;background:#fff;text-align:center}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:8px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-ak{top:1200px}
#X-ak span{font-size:30px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div>'
 + '<div id="X-a1" class="app2"><img src="assets/brand/pascal-sign-logo.webp" alt=""><b>Pascal Sign</b><small>para firmar</small></div>'
 + '<div id="X-a2" class="app2"><img src="assets/brand/pascalpdf-logo.png" alt=""><b>PascalPDF Studio</b><small>para editar y firmar</small></div>'
 + '<h1 id="X-t" class="q">Los dos, de <em>PascalIA</em></h1>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalpdf.svg" alt=""><b>Pruébalo gratis 7 días</b></div>'
 + '<div id="X-ak" class="ask"><span>📤 Mándaselo a quien siempre pide «¿me corriges el PDF?»</span></div><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.6,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},0.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-a1",{{opacity:0,x:-200,duration:.5,ease:"back.out(1.6)"}},{s:.2f});
tl.from("#X-a2",{{opacity:0,x:200,duration:.5,ease:"back.out(1.6)"}},{s + d * .15:.2f});
tl.from("#X-t",{{opacity:0,y:40,duration:.4,ease:"back.out(1.8)"}},{s + d * .3:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .5:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .78:.2f});"""))


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
