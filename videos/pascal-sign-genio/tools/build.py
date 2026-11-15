# Builds "Pascal Sign · quedas como genio": the referral principle applied to Pascal Sign (emotional peak when the PDF is signed,
# before/after trophy, a 2-line WhatsApp message ready to screenshot) told with Camila and Valentina; ends on logo, QR and a share CTA.
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
.tabs span{{flex:1;padding:16px 6px;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 2px #E3E3E3;text-align:center;font:800 24px/1 "Montserrat",sans-serif;color:#1F1F1F}}
.tabs span.on{{background:{Y};box-shadow:none}}
.tmr{{position:absolute;left:0;right:0;text-align:center}}
.tmr span{{display:inline-flex;align-items:center;gap:12px;padding:18px 30px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 38px/1 "Montserrat",sans-serif}}
.tmr i{{width:44px;height:44px}}
.pk{{position:absolute;left:0;right:0;text-align:center;font:800 40px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:.08em}}
.ekg{{position:absolute;left:60px;width:960px;height:200px}}
.vs2{{position:absolute;width:440px;padding:30px 26px;border-radius:32px}}
.vs2 h3{{margin:0 0 18px;font:800 40px/1 "Montserrat",sans-serif}}
.vs2 p{{display:flex;align-items:center;gap:14px;margin:16px 0;font:700 32px/1.15 "Inter",sans-serif}}
.vs2 p i{{flex:none;width:58px;height:58px;border-radius:16px;padding:12px}}
.shr{{position:absolute;left:0;right:0;text-align:center}}
.shr span{{display:inline-flex;align-items:center;gap:12px;padding:22px 34px;border-radius:22px;background:#1F1F1F;color:#fff;font:800 36px/1 "Montserrat",sans-serif;box-shadow:0 16px 34px -12px rgba(0,0,0,.5)}}
.shot{{position:absolute;inset:0;background:#fff}}
.crn{{position:absolute;width:90px;height:90px;border:10px solid {Y}}}
.crown{{position:absolute;padding:14px 24px;border-radius:999px;background:{Y};color:#111;font:800 38px/1 "Montserrat",sans-serif;box-shadow:0 14px 30px -10px rgba(0,0,0,.4)}}
"""
STEP = lambda n, t: f'<div class="stepn"><span><b>{n}</b>{t}</span></div>'
EKG = '<svg viewBox="0 0 960 200"><path d="M0 120 H300 L330 120 L360 60 L390 170 L420 20 L450 190 L480 110 L510 120 H960" fill="none" stroke="#FFC107" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'
S = []
S.append(('p01', 'td', .4, """
#X-t{top:170px;font-size:80px}
#X-s1{top:450px}#X-s2{top:570px}#X-s3{top:690px}#X-s4{top:810px}
.X-x{position:absolute;left:80px;width:520px;height:8px;border-radius:4px;background:#E5484D}
#X-x1{top:487px}#X-x2{top:607px}#X-x3{top:727px}#X-x4{top:847px}
#X-c{left:640px;top:560px;height:930px}
""", '<h1 id="X-t" class="q">¿Todavía<br>firmas <em>así</em>?</h1>'
 + f'<div id="X-s1" class="stp2 X-s"><b>1</b><i>{icon("printer", Y)}</i>Imprimir</div><div id="X-s2" class="stp2 X-s"><b>2</b><i>{icon("pen", Y)}</i>Firmar a mano</div><div id="X-s3" class="stp2 X-s"><b>3</b><i>{icon("scan", Y)}</i>Escanear</div><div id="X-s4" class="stp2 X-s"><b>4</b><i>{icon("upload", Y)}</i>Volver a mandar</div>'
 + ''.join(f'<div id="X-x{i}" class="X-x" data-layout-allow-overlap></div>' for i in range(1, 5))
 + '<img id="X-c" class="char" src="assets/chars/camila-molesta.webp" alt="">',
 lambda D, s, d: f"""tl.from("#X-c",{{opacity:0,x:300,duration:.5,ease:"power3.out"}},.05);
tl.from(".X-s",{{opacity:0,x:-160,duration:.3,ease:"power3.out",stagger:{d * .14:.2f}}},{s:.2f});
tl.from("#X-t",{{opacity:0,scale:1.4,duration:.45,ease:"back.out(2)"}},{s + d * .7:.2f});
tl.from(".X-x",{{scaleX:0,transformOrigin:"0 50%",duration:.25,stagger:.12}},{s + d * .78:.2f});"""))
S.append(('p02', 'ty', .4, """
#X-t{top:150px;font-size:70px}
#X-ph{left:290px;top:360px;width:500px;height:980px}
#X-sg{width:62%;margin-top:6px}
#X-tm{top:1390px}
""", '<h1 id="X-t" class="qd">Firma desde<br>tu <em>celular</em></h1>'
 + '<div id="X-ph" class="mob2"><div class="sc"><div class="hdr"><img src="assets/brand/pascal-sign-logo.webp" alt="">Pascal Sign</div><div class="mp2"><div class="t">CUENTA DE COBRO</div><div class="ln"></div><div class="ln" style="width:72%"></div><div class="ln"></div><div class="ln" style="width:85%"></div><div class="ln" style="width:50%"></div>'
 + f'<div id="X-sg">{sig(0, "", "", "#1B2A6B", 7)}</div></div>'
 + '<div class="tabs"><span id="X-a1">✍️ Dedo</span><span id="X-a2">Aa Escrita</span><span id="X-a3">📷 Foto</span></div><div id="X-ok" class="sgok">✓ Firmado</div></div></div>'
 + f'<div id="X-tm" class="tmr"><span><i>{icon("clock", Y)}</i>En un minuto</span></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-ph",{{opacity:0,y:700,duration:.55,ease:"back.out(1.3)"}},.15);
tl.to("#X-a1",{{backgroundColor:"#FFC107",duration:.2}},{s + d * .35:.2f});
tl.to("#X-a1",{{backgroundColor:"#FFFFFF",duration:.2}},{s + d * .5:.2f});
tl.to("#X-a2",{{backgroundColor:"#FFC107",duration:.2}},{s + d * .5:.2f});
tl.to("#X-a2",{{backgroundColor:"#FFFFFF",duration:.2}},{s + d * .65:.2f});
tl.to("#X-a3",{{backgroundColor:"#FFC107",duration:.2}},{s + d * .65:.2f});
tl.from("#X-sg",{{clipPath:"inset(0 100% 0 0)",duration:.8,ease:"power1.inOut"}},{s + d * .35:.2f});
tl.from("#X-ok",{{opacity:0,scale:.5,duration:.35,ease:"back.out(2.5)"}},{s + d * .82:.2f});
tl.from("#X-tm",{{opacity:0,y:40,duration:.35,ease:"back.out(2)"}},{s + d * .86:.2f});"""))
S.append(('p03', 'qx', .5, """
#X-pk{top:250px}
#X-eg{top:300px}
#X-c{left:330px;top:560px;height:940px}
#X-b{left:120px;top:440px}
""", STEP(1, 'Pico emocional') + '<p id="X-pk" class="pk">EL SEGUNDO EXACTO</p>'
 + f'<div id="X-eg" class="ekg">{EKG}</div><img id="X-c" class="char" src="assets/chars/camila-feliz.webp" alt="">'
 + '<div id="X-b" class="bub l" data-layout-allow-overlap>¡Esto quedó increíble! 😍</div>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-c",{{opacity:0,y:300,scale:.9,duration:.5,ease:"back.out(1.6)"}},.1);
tl.from("#X-eg",{{clipPath:"inset(0 100% 0 0)",duration:{d * .45:.2f},ease:"none"}},{s:.2f});
tl.from("#X-pk",{{opacity:0,scale:.6,duration:.35,ease:"back.out(2)"}},{s + d * .25:.2f});
tl.from("#X-b",{{opacity:0,scale:.3,transformOrigin:"20% 100%",duration:.35,ease:"back.out(2.5)"}},{s + d * .55:.2f});
tl.to("#X-c",{{scale:1.04,duration:.25,yoyo:true,repeat:3,ease:"sine.inOut"}},{s + d * .6:.2f});"""))
S.append(('p04', 'tl', .4, """
#X-t{top:200px;font-size:72px}
#X-a{left:70px;top:430px;background:#ECECEC;color:#5C5C5C;transform:rotate(-2deg)}
#X-a h3{color:#5C5C5C}
#X-a i{background:#D6D6D6}
#X-b{left:570px;top:470px;background:#1F1F1F;color:#fff;box-shadow:0 0 0 5px #FFC107,0 30px 60px -20px rgba(0,0,0,.5);transform:rotate(2deg)}
#X-b h3{color:#FFC107}
#X-b i{background:#FFC107}
#X-sh{top:1250px}
""", STEP(2, 'Trofeo visual') + '<h1 id="X-t" class="qd">Tu <em>antes y después</em></h1>'
 + f'<div id="X-a" class="vs2"><h3>ANTES</h3><p><i>{icon("printer", "#5C5C5C")}</i>Impresora</p><p><i>{icon("scan", "#5C5C5C")}</i>Escáner</p><p><i>{icon("clock", "#5C5C5C")}</i>Carreras</p></div>'
 + f'<div id="X-b" class="vs2"><h3>AHORA</h3><p><i>{icon("devices", "#111")}</i>Tu celular</p><p><i>{icon("clock", "#111")}</i>Un minuto</p><p><i>{icon("check", "#111")}</i>Firmado</p></div>'
 + f'<div id="X-sh" class="shr"><span><i style="width:44px;height:44px;display:inline-block">{icon("upload", Y)}</i>Compartir PDF firmado</span></div>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-a",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .2:.2f});
tl.from("#X-a p",{{opacity:0,y:20,duration:.25,stagger:.15}},{s + d * .25:.2f});
tl.from("#X-b",{{opacity:0,x:300,scale:.8,duration:.5,ease:"back.out(1.6)"}},{s + d * .55:.2f});
tl.from("#X-b p",{{opacity:0,y:20,duration:.25,stagger:.15}},{s + d * .6:.2f});
tl.from("#X-sh",{{opacity:0,scale:.5,duration:.4,ease:"back.out(2.2)"}},{s + d * .85:.2f});"""))
S.append(('p05', 'tl', .5, """
#X-t{top:200px;font-size:60px}
#X-t s{text-decoration-thickness:8px;text-decoration-color:#E5484D}
#X-ch{left:120px;top:360px;width:840px;height:820px}
#X-ch .m{font-size:38px;line-height:1.3}
#X-ch .m small{font-size:22px}
#X-ch .top{font-size:34px}
#X-m2{box-shadow:0 0 0 5px #FFC107}
#X-n1{left:110px;top:350px;transform:none;border-right:0;border-bottom:0}
#X-n2{left:880px;top:350px;border-left:0;border-bottom:0}
#X-n3{left:110px;top:1110px;border-right:0;border-top:0}
#X-n4{left:880px;top:1110px;border-left:0;border-top:0}
#X-sv{top:1250px}
""", STEP(3, 'Cero fricción') + '<h1 id="X-t" class="qd"><s>«Búscalo en internet»</s></h1>'
 + chat('X-ch', '', [('X-m1', True, 'Mira cómo firmé la cuenta de cobro 👇', '8:15 <b>✓✓</b>'),
                     ('X-m2', True, '¿Sigues imprimiendo para firmar la cuenta de cobro? 🙈<br>Yo firmo desde el celular en un minuto 👉 <b>pascalia.lat/PascalSign</b>', '8:15 <b>✓✓</b>')], who='Valentina · compañera', sub='en línea')
 + ''.join(f'<div id="X-n{i}" class="crn X-cn" data-layout-allow-overlap></div>' for i in range(1, 5))
 + '<div id="X-sh2" class="shot" style="opacity:0"></div><div id="X-sv" class="sent"><span><b>📸</b>Tómale pantallazo y reenvíalo</span></div>',
 lambda D, s, d: f"""tl.from(".stepn",{{opacity:0,y:-30,duration:.3}},0);
tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},.1);
tl.from("#X-ch",{{opacity:0,y:300,duration:.5,ease:"power3.out"}},.25);
tl.from("#X-m1",{{opacity:0,y:30,duration:.3}},{s + d * .3:.2f});
tl.from("#X-m2",{{opacity:0,y:30,scale:.9,duration:.4,ease:"back.out(2)"}},{s + d * .45:.2f});
tl.from(".X-cn",{{opacity:0,scale:1.6,duration:.3,ease:"power3.out"}},{s + d * .8:.2f});
tl.fromTo("#X-sh2",{{opacity:.85}},{{opacity:0,duration:.4,ease:"power2.out"}},{s + d * .86:.2f});
tl.from("#X-sv",{{opacity:0,y:30,duration:.35,ease:"back.out(2)"}},{s + d * .88:.2f});"""))
S.append(('p06', 'ty', .5, """
#X-t{top:160px;font-size:66px}
#X-v1{left:30px;top:520px;height:900px}
#X-v2{left:40px;top:560px;height:860px}
#X-c{left:600px;top:500px;height:920px}
#X-cr{left:650px;top:420px}
#X-q{top:1410px;left:80px;right:80px;text-align:center;font:800 36px/1.2 "Montserrat",sans-serif;color:#1F1F1F}
""", '<h1 id="X-t" class="qd">Tú quedas<br>como la <em>genia</em></h1>'
 + '<img id="X-v1" class="char" src="assets/chars/valentina-papeles.webp" alt=""><img id="X-v2" class="char" src="assets/chars/valentina-relajada.webp" alt="" data-layout-allow-overlap>'
 + '<img id="X-c" class="char" src="assets/chars/camila-feliz.webp" alt=""><div id="X-cr" class="crown" data-layout-allow-overlap>👑 La genia</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-v1",{{opacity:0,x:-250,duration:.45,ease:"power3.out"}},.15);
tl.from("#X-c",{{opacity:0,x:250,duration:.45,ease:"power3.out"}},.25);
tl.to("#X-v1",{{opacity:0,scale:.9,duration:.35}},{s + d * .25:.2f});
tl.fromTo("#X-v2",{{opacity:0,scale:.9}},{{opacity:1,scale:1,duration:.4,ease:"back.out(1.8)"}},{s + d * .25:.2f});
tl.from("#X-cr",{{opacity:0,y:-80,scale:.4,duration:.4,ease:"back.out(2.5)"}},{s + d * .4:.2f});"""))
S.append(('p07', 'qx', 2.6, """
#X-fl{opacity:0}
#X-lg{left:390px;top:180px;width:300px;height:300px;border-radius:70px}
#X-t{top:520px;font-size:92px}
#X-s{top:650px;left:60px;right:60px;text-align:center;font:700 40px/1.25 "Inter",sans-serif;color:#E6E6E6}
#X-qr{left:390px;top:780px;width:300px;padding:20px 20px 12px;border-radius:28px;background:#fff;text-align:center}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:8px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-ak{top:1240px}
#X-ak span{font-size:32px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div><img id="X-lg" class="lg2" src="assets/brand/pascal-sign-logo.webp" alt="">'
 + '<h1 id="X-t" class="q">Pascal <em>Sign</em></h1>'
 + '<p id="X-s" class="abs">Firma desde el celular en un minuto</p>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalsign.svg" alt=""><b>Pruébalo gratis 7 días</b></div>'
 + '<div id="X-ak" class="ask"><span>📤 Mándaselo a quien siempre busca impresora</span></div><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:1}},{{opacity:0,duration:.6,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},0.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-lg",{{scale:3,opacity:0,rotation:-15,duration:.6,ease:"power3.out"}},0.05);
tl.from("#X-t",{{opacity:0,y:60,duration:.45,ease:"back.out(1.8)"}},.45);
tl.from("#X-s",{{opacity:0,y:30,duration:.35}},{s + d * .2:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .4:.2f});
tl.from("#X-ak",{{opacity:0,y:40,scale:.6,duration:.4,ease:"back.out(2)"}},{s + d * .7:.2f});
tl.to("#X-lg",{{scale:1.05,duration:.5,yoyo:true,repeat:{k(D, 1.2, .5)},ease:"sine.inOut"}},1.2);"""))


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
