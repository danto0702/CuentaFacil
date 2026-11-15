# Builds "Referidos en circuito cerrado": the 3-step referral method (right moment, trophy, ready message)
# told with Andrés and Marcela, tied to real Pascal Sign / PascalPDF Studio features, ending on both logos, QR and a comment CTA.
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
STEP = lambda n, t: f'<div class="stepn"><span><b>{n}</b>{t}</span></div>'
S = []
S.append(('r01', 'tl', .4, """
#X-t{top:150px;font-size:74px}
#X-a{left:20px;top:560px;height:900px}
#X-m{left:650px;top:590px;height:870px}
#X-b{left:560px;top:450px}
#X-s{top:1150px}
""", '<h1 id="X-t" class="qd">«Si conoces a alguien,<br><em>me avisas</em>»</h1>'
 + '<img id="X-a" class="char" src="assets/chars/andres-acuerdo.webp" alt=""><img id="X-m" class="char" src="assets/chars/marcela-acuerdo.webp" alt="">'
 + '<div id="X-b" class="bub r" data-layout-allow-overlap>¡Claro que sí!</div><div id="X-s" class="stp" data-layout-allow-overlap>Nunca te va a avisar</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-a",{{opacity:0,x:-300,duration:.5,ease:"power3.out"}},.15);
tl.from("#X-m",{{opacity:0,x:300,duration:.5,ease:"power3.out"}},.3);
tl.from("#X-b",{{opacity:0,scale:.3,transformOrigin:"80% 100%",duration:.35,ease:"back.out(2.5)"}},{s + d * .5:.2f});
tl.from("#X-s",{{opacity:0,scale:2.6,duration:.3,ease:"power4.in"}},{s + d * .78:.2f});"""))
S.append(('r02', 'td', .4, """
#X-t{top:150px;font-size:78px}
#X-c1{top:430px}#X-c2{top:640px}#X-c3{top:850px}
#X-c2{background:#DCEBFF}
#X-a{left:640px;top:1010px;height:500px}
""", '<h1 id="X-t" class="q">Punto <em>muerto</em></h1>'
 + f'<div id="X-c1" class="ing"><i>{icon("check")}</i><div><b>La entrega se acaba</b><small>Proyecto terminado, cliente feliz</small></div></div>'
 + f'<div id="X-c2" class="ing"><i style="background:#8AB6F0">{icon("clock")}</i><div><b>La relación se enfría</b><small>Pasan las semanas y nadie escribe</small></div></div>'
 + f'<div id="X-c3" class="ing"><i style="background:#D9D9D9">{icon("search")}</i><div><b>Vuelves a cero</b><small>A buscar clientes fríos otra vez</small></div></div>'
 + '<img id="X-a" class="char" src="assets/chars/andres-llamada.webp" alt="" data-layout-allow-overlap><div id="X-cold" class="cold"></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-c1",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .12:.2f});
tl.from("#X-c2",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .3:.2f});
tl.from("#X-cold",{{opacity:0,duration:{d * .4:.2f}}},{s + d * .3:.2f});
tl.from("#X-c3",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .55:.2f});
tl.from("#X-a",{{opacity:0,y:200,duration:.45,ease:"power3.out"}},{s + d * .62:.2f});"""))
S.append(('r03', 'qx', .4, """
#X-t{top:150px;font-size:76px}
#X-rg{left:220px;top:600px;width:640px;height:640px}
#X-ob{left:220px;top:600px}
#X-n1{left:415px;top:470px}
#X-n2{left:720px;top:1060px}
#X-n3{left:110px;top:1060px}
#X-md{top:860px}
""", '<h1 id="X-t" class="q">Un circuito<br><em>cerrado</em></h1>'
 + '<div id="X-rg" class="ring"></div><div id="X-ob" class="orb"><i></i></div>'
 + f'<div id="X-n1" class="node X-n"><i>{icon("check", Y)}</i>Entrega</div><div id="X-n2" class="node X-n"><i>{icon("chat", Y)}</i>Referido</div><div id="X-n3" class="node X-n"><i>{icon("user", Y)}</i>Cliente nuevo</div>'
 + '<p id="X-md" class="mid">3<small>pasos</small></p>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-rg",{{opacity:0,scale:.3,rotation:-90,duration:.6,ease:"power3.out"}},.25);
tl.from(".X-n",{{opacity:0,scale:.4,duration:.35,ease:"back.out(2.2)",stagger:{d * .12:.2f}}},{s + d * .15:.2f});
tl.from("#X-ob",{{opacity:0,duration:.3}},{s + d * .2:.2f});
tl.to("#X-ob",{{rotation:720,duration:{D - s - d * .2:.2f},ease:"none"}},{s + d * .2:.2f});
tl.from("#X-md",{{opacity:0,scale:.3,duration:.4,ease:"back.out(2.5)"}},{s + d * .8:.2f});"""))
S.append(('r04', 'ty', .4, """
#X-t{top:200px;font-size:70px}
#X-m{left:10px;top:600px;height:860px}
#X-b{left:40px;top:470px}
#X-ph{left:580px;top:520px;width:430px;height:840px}
#X-sg{width:60%;margin-top:8px}
#X-ok{opacity:1}
#X-pl{left:0;right:0;top:1400px;text-align:center}
""", STEP(1, 'El momento exacto') + '<h1 id="X-t" class="qd">Cuando dice<br>«<em>quedó increíble</em>»</h1>'
 + '<img id="X-m" class="char" src="assets/chars/marcela-celebra.webp" alt="">'
 + '<div id="X-b" class="bub l" data-layout-allow-overlap>¡Esto quedó increíble! 😍</div>'
 + '<div id="X-ph" class="mob2" data-layout-allow-overlap><div class="sc"><div class="hdr"><img src="assets/brand/pascal-sign-logo.webp" alt="">Pascal Sign</div><div class="mp2"><div class="t">ACTA DE ENTREGA</div><div class="ln"></div><div class="ln" style="width:72%"></div><div class="ln"></div><div class="ln" style="width:50%"></div>'
 + f'<div id="X-sg">{sig(1, "", "", "#1B2A6B", 7)}</div></div><div id="X-ok" class="sgok">✓ Firmado</div></div></div>'
 + '<p id="X-pl" class="abs"><span class="pl2" style="background:#25A55F;color:#fff">✓ Ahora</span><span class="pl2" style="background:#fff;color:#B42318;box-shadow:inset 0 0 0 3px #F3B4B0"><s>En 3 semanas</s></span></p>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-m",{{opacity:0,x:-260,duration:.5,ease:"power3.out"}},.2);
tl.from("#X-b",{{opacity:0,scale:.3,transformOrigin:"20% 100%",duration:.35,ease:"back.out(2.5)"}},{s + d * .2:.2f});
tl.from("#X-ph",{{opacity:0,y:600,rotation:8,duration:.55,ease:"back.out(1.4)"}},{s + d * .4:.2f});
tl.from("#X-sg",{{clipPath:"inset(0 100% 0 0)",duration:.7,ease:"power1.inOut"}},{s + d * .55:.2f});
tl.from("#X-ok",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.5)"}},{s + d * .68:.2f});
tl.from("#X-pl .pl2",{{opacity:0,y:40,duration:.3,ease:"back.out(2)",stagger:.25}},{s + d * .8:.2f});"""))
S.append(('r05', 'tl', .4, """
#X-t{top:200px;font-size:72px}
#X-ba{left:90px;top:420px;width:900px;height:620px}
#X-c1{left:70px;top:1110px}
#X-c2{left:330px;top:1220px}
#X-c3{left:110px;top:1340px}
#X-j{left:760px;top:1060px;height:440px}
""", STEP(2, 'Dale un trofeo') + '<h1 id="X-t" class="qd">Un <em>antes y después</em></h1>'
 + '<div id="X-ba" class="ba"><img class="bf" src="assets/chars/tienda.webp" alt=""><span class="lb" style="left:24px;background:#1F1F1F;color:#fff">ANTES</span>'
 + '<img id="X-af" class="af" src="assets/chars/tienda.webp" alt=""><span id="X-la" class="lb" style="right:24px;background:#FFC107;color:#111">DESPUÉS</span><div id="X-hd" class="hd"></div></div>'
 + '<div id="X-c1" class="cmt">❤️ <b>48</b> me gusta</div><div id="X-c2" class="cmt">¡Qué lindo quedó! 😍</div><div id="X-c3" class="cmt hit"><b>¿Quién te lo hizo?</b> 👀</div>'
 + '<img id="X-j" class="char" src="assets/chars/julian-trofeo.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-ba",{{opacity:0,scale:.85,duration:.45,ease:"power3.out"}},.25);
tl.fromTo("#X-af",{{clipPath:"inset(0 0 0 100%)"}},{{clipPath:"inset(0 0 0 50%)",duration:.9,ease:"power2.inOut"}},{s + d * .15:.2f});
tl.fromTo("#X-hd",{{x:450}},{{x:0,duration:.9,ease:"power2.inOut"}},{s + d * .15:.2f});
tl.from("#X-la",{{opacity:0,scale:.5,duration:.3,ease:"back.out(2)"}},{s + d * .3:.2f});
tl.from("#X-j",{{opacity:0,y:200,duration:.45,ease:"back.out(1.6)"}},{s + d * .45:.2f});
tl.from(["#X-c1","#X-c2","#X-c3"],{{opacity:0,y:40,scale:.6,duration:.3,ease:"back.out(2.2)",stagger:{d * .1:.2f}}},{s + d * .55:.2f});"""))
S.append(('r06', 'qx', .4, """
#X-lg{left:150px;top:150px;width:120px;height:120px;border-radius:30px}
#X-t{top:165px;left:290px;right:60px;text-align:left;font-size:66px}
#X-s1{top:350px}#X-s2{top:450px}#X-s3{top:550px}
#X-pd{left:250px;top:690px;width:580px}
#X-fc{top:1400px}
""", '<img id="X-lg" class="abs" src="assets/brand/pascalpdf-logo.png" alt=""><h1 id="X-t" class="q">PascalPDF<br><em>Studio</em></h1>'
 + f'<div id="X-s1" class="stp2 X-s"><b>1</b><i>{icon("camera", Y)}</i>Imágenes a PDF</div><div id="X-s2" class="stp2 X-s"><b>2</b><i>{icon("sparkle", Y)}</i>Marca de agua con tu nombre</div><div id="X-s3" class="stp2 X-s"><b>3</b><i>{icon("zip", Y)}</i>Comprimir para WhatsApp</div>'
 + '<div id="X-pd" class="pdfc"><div class="t">Remodelación · Tienda de Marcela</div><div class="im"><img style="filter:grayscale(1) brightness(.55)" src="assets/chars/tienda.webp" alt=""><span>ANTES</span></div><div class="im"><img src="assets/chars/tienda.webp" alt=""><span style="background:#FFC107;color:#111">DESPUÉS</span></div><div id="X-wm" class="wm">ANDRÉS · REMODELA</div></div>'
 + '<div id="X-fc" class="fchip"><span>✓ antes-y-despues.pdf · listo para WhatsApp</span></div>',
 lambda D, s, d: f"""tl.from("#X-lg",{{opacity:0,scale:.3,rotation:-20,duration:.45,ease:"back.out(2)"}},0);
tl.from("#X-t",{{opacity:0,x:60,duration:.4}},.15);
tl.from("#X-s1",{{opacity:0,x:-120,duration:.35,ease:"power3.out"}},{s + d * .25:.2f});
tl.from("#X-pd",{{opacity:0,y:300,scale:.8,duration:.5,ease:"back.out(1.5)"}},{s + d * .3:.2f});
tl.from("#X-s2",{{opacity:0,x:-120,duration:.35,ease:"power3.out"}},{s + d * .5:.2f});
tl.from("#X-wm",{{opacity:0,scale:1.8,duration:.4,ease:"power3.out"}},{s + d * .55:.2f});
tl.from("#X-s3",{{opacity:0,x:-120,duration:.35,ease:"power3.out"}},{s + d * .72:.2f});
tl.to("#X-pd",{{scale:.9,duration:.25,yoyo:true,repeat:1,ease:"power2.inOut"}},{s + d * .76:.2f});
tl.from("#X-fc",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.2)"}},{s + d * .86:.2f});"""))
S.append(('r07', 'tl', .4, """
#X-t{top:200px;font-size:64px}
#X-t s{text-decoration-thickness:8px;text-decoration-color:#E5484D}
#X-ch{left:120px;top:380px;width:840px;height:1000px}
#X-fw{left:640px;top:1110px}
#X-se{top:1410px}
""", STEP(3, 'Cero fricción') + '<h1 id="X-t" class="qd"><s>«Pásale mi número»</s></h1>'
 + chat('X-ch', '', [('X-m1', True, '<span class="pdfm" style="display:flex;align-items:center;gap:14px"><i style="flex:none;width:56px;height:64px;border-radius:8px;background:#E5484D;color:#fff;display:grid;place-items:center;font:800 16px/1 Montserrat">PDF</i>antes-y-despues.pdf</span>', '10:42 <b>✓✓</b>'),
                        ('X-m2', True, 'Te dejo este mensaje listo, por si alguien te pregunta 👇', '10:42 <b>✓✓</b>'),
                        ('X-m3', True, '<b>¿Buscas quién te renueve el local?</b> Andrés hizo el mío, mira el antes y después 👆 Su WhatsApp: <b>[tu número]</b>', '10:43 <b>✓✓</b>')], who='Marcela · Tienda', sub='en línea')
 + '<div id="X-fw" class="fwd" data-layout-allow-overlap>↪ Reenviar</div><div id="X-se" class="sent"><span><b>✓</b>Reenviado a «Emprendedores del barrio»</span></div>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-ch",{{opacity:0,y:300,duration:.5,ease:"power3.out"}},.25);
tl.from("#X-m1",{{opacity:0,y:30,duration:.3}},{s + d * .3:.2f});
tl.from("#X-m2",{{opacity:0,y:30,duration:.3}},{s + d * .4:.2f});
tl.from("#X-m3",{{opacity:0,y:30,scale:.9,duration:.35,ease:"back.out(2)"}},{s + d * .5:.2f});
tl.from("#X-fw",{{opacity:0,scale:.4,duration:.3,ease:"back.out(2.5)"}},{s + d * .75:.2f});
tl.to("#X-fw",{{scale:.85,duration:.12,yoyo:true,repeat:1}},{s + d * .83:.2f});
tl.from("#X-se",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .87:.2f});"""))
S.append(('r08', 'qx', .5, """
#X-k1{top:250px}#X-k2{top:460px}#X-k3{top:670px}
#X-t{top:960px;font-size:76px}
""", '<div id="X-k1" class="crit X-k"><div class="n">1</div><div><b>Momento correcto</b><small>Cuando dice «quedó increíble»</small></div></div>'
 + '<div id="X-k2" class="crit X-k"><div class="n">2</div><div><b>Trofeo para presumir</b><small>Su antes y después</small></div></div>'
 + '<div id="X-k3" class="crit X-k"><div class="n">3</div><div><b>Mensaje listo</b><small>Dos líneas para reenviar</small></div></div>'
 + '<h1 id="X-t" class="q">La entrega no es<br>el final.<br><em>Es el inicio.</em></h1>',
 lambda D, s, d: f"""tl.from(".X-k",{{opacity:0,x:-200,duration:.35,ease:"power3.out",stagger:{d * .14:.2f}}},{s:.2f});
tl.from("#X-t",{{opacity:0,scale:1.3,duration:.5,ease:"power3.out"}},{s + d * .55:.2f});
tl.to(".X-k",{{scale:.96,duration:.3,yoyo:true,repeat:1,stagger:.08}},{s + d * .55:.2f});"""))
S.append(('r09', 'qx', 2.6, """
#X-fl{opacity:0}
#X-l1{left:170px;top:190px}
#X-l2{left:660px;top:190px}
#X-pl{top:255px}
#X-t{top:500px;font-size:74px}
#X-s{top:700px;left:60px;right:60px;text-align:center;font:700 38px/1.25 "Inter",sans-serif;color:#E6E6E6}
#X-qr{left:390px;top:840px;width:300px;padding:20px 20px 12px;border-radius:28px;background:#fff;text-align:center}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:8px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-ak{top:1300px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div><img id="X-l1" class="lg2" src="assets/brand/pascal-sign-logo.webp" alt=""><p id="X-pl" class="plus">+</p><img id="X-l2" class="lg2" src="assets/brand/pascalpdf-logo.png" alt="">'
 + '<h1 id="X-t" class="q">Pascal Sign<br>+ PascalPDF <em>Studio</em></h1>'
 + '<p id="X-s" class="abs">Firma, arma tu trofeo y compártelo<br>desde el celular</p>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalpdf.svg" alt=""><b>Pruébalo gratis 7 días</b></div>'
 + f'<div id="X-ak" class="ask"><span>💬 Comenta <b>REFERIDO</b> y te paso la plantilla</span></div><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.6,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},0.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-l1",{{opacity:0,x:-200,rotation:-20,duration:.5,ease:"back.out(1.6)"}},0.05);
tl.from("#X-l2",{{opacity:0,x:200,rotation:20,duration:.5,ease:"back.out(1.6)"}},0.15);
tl.from("#X-pl",{{opacity:0,scale:0,duration:.35,ease:"back.out(3)"}},.45);
tl.from("#X-t",{{opacity:0,y:60,duration:.45,ease:"back.out(1.8)"}},.5);
tl.from("#X-s",{{opacity:0,y:30,duration:.35}},{s + d * .25:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .5:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .8:.2f});
tl.to(["#X-l1","#X-l2"],{{scale:1.05,duration:.5,yoyo:true,repeat:{k(D, 1.2, .5)},ease:"sine.inOut"}},1.2);"""))


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
