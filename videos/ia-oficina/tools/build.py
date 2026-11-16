# Builds "8 usos de la IA para tu oficina": explainer with the PascalIA character bank (Valentina, Andrés, Marcela, Julián,
# Camila, Hernando, Pascal) and the brand formats (prompt/result cards, WhatsApp chat, Excel bar, matrix, before/after, QR).
# Method stays implicit (peak, before/after, share CTA); "documentos", never "cuenta de cobro".
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
.ttl{{position:absolute;left:0;right:0;top:110px;text-align:center}}
.ttl span{{display:inline-block;padding:12px 26px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 30px/1 "Montserrat",sans-serif}}
.pit{{position:absolute;width:250px;height:230px;padding:24px;display:grid;place-items:center;text-align:center;font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 18px 30px -14px rgba(0,0,0,.4)}}
.board{{position:absolute;left:60px;right:60px;top:330px;height:620px;border-radius:26px;background:#fff;box-shadow:inset 0 0 0 10px #D9C7A3,0 30px 60px -30px rgba(0,0,0,.4)}}
.logoS{{position:absolute;padding:20px 34px;border-radius:26px;background:linear-gradient(135deg,#8B4A1E,#E0952A);color:#fff;font:800 64px/1 "Montserrat",sans-serif;box-shadow:0 20px 40px -14px rgba(0,0,0,.5)}}
.logoS i{{font-style:normal;color:#FFE08A}}
.gpt{{position:absolute;padding:12px 22px;border-radius:14px;background:#fff;color:#1F1F1F;font:800 34px/1 "Inter",sans-serif;box-shadow:0 0 0 4px #1F1F1F}}
.ban{{position:absolute;left:70px;right:70px;padding:24px 26px;border-radius:24px;text-align:center;font:800 44px/1.15 "Montserrat",sans-serif}}
.ban.red{{background:#E5484D;color:#fff}}.ban.grn{{background:#25A55F;color:#fff}}.ban.ylw{{background:{Y};color:#111}}.ban.bk2{{background:#1F1F1F;color:#fff}}
.shop{{position:absolute;left:190px;width:700px;height:330px;border-radius:24px;overflow:hidden;background:#3B2416;box-shadow:0 30px 60px -24px rgba(0,0,0,.5)}}
.shop .aw{{height:90px;background:repeating-linear-gradient(90deg,#E0952A 0 70px,#FFF4DC 70px 140px)}}
.shop b{{display:block;margin-top:46px;text-align:center;font:800 76px/1 "Montserrat",sans-serif;color:#FFE08A;letter-spacing:.04em}}
.shop small{{display:block;margin-top:14px;text-align:center;font:700 30px/1 "Inter",sans-serif;color:#E9D7C0}}
.sof{{position:absolute;display:flex;align-items:center;gap:16px;padding:12px 26px 12px 12px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 34px/1 "Montserrat",sans-serif}}
.sof i{{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#8B4A1E,#E0952A);font-style:normal;font-size:34px}}
.capa{{position:absolute;left:70px;right:70px;padding:34px 36px;border-radius:34px;background:#16161B;box-shadow:inset 0 0 0 4px {Y},0 0 60px rgba(255,193,7,.25)}}
.capa small{{display:block;font:800 32px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:.12em}}
.capa b{{display:block;margin-top:12px;font:800 92px/1 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.capa p{{margin-top:16px;font:600 36px/1.25 "Inter",sans-serif;color:#CFCFCF}}
.code{{position:absolute;left:70px;right:70px;padding:34px 36px;border-radius:26px;background:#0E1116;box-shadow:inset 0 0 0 2px #2A2F3A;font:600 38px/1.45 ui-monospace,Menlo,monospace;color:#E6EDF3}}
.code .k{{color:{Y}}}.code .c{{color:#7EE787}}
.code p{{margin:6px 0}}
.wrong{{position:absolute;left:0;right:0;text-align:center;font:800 150px/1 "Montserrat",sans-serif;color:#E5484D;text-shadow:0 10px 30px rgba(229,72,77,.35)}}
.man{{position:absolute;padding:28px 34px;border-radius:22px;background:#fff;box-shadow:inset 0 0 0 4px #25A55F,0 24px 50px -24px rgba(0,0,0,.4);font:700 36px/1.3 "Inter",sans-serif;color:#1F1F1F}}
.man b{{font:800 60px/1 "Montserrat",sans-serif;color:#1E7B45}}
.pipe{{position:absolute;width:250px;padding:20px 14px;border-radius:24px;background:#1C1C22;box-shadow:inset 0 0 0 2px #3A3A44;text-align:center;color:#fff;font:800 30px/1.15 "Montserrat",sans-serif}}
.pipe i{{display:block;margin:0 auto 10px;font-style:normal;font-size:60px;line-height:1}}
.arr{{position:absolute;font:800 70px/1 "Montserrat",sans-serif;color:{Y}}}
.chunk{{display:inline-block;width:48px;height:48px;margin:5px;border-radius:10px;background:{Y}}}
.vec{{position:absolute;left:70px;right:70px;text-align:center;font:700 30px/1.4 ui-monospace,Menlo,monospace;color:#7EE787}}
.node2{{position:absolute;width:260px;padding:22px 14px;border-radius:26px;background:#fff;text-align:center;color:#1F1F1F;font:800 34px/1.1 "Montserrat",sans-serif;box-shadow:0 20px 40px -20px rgba(0,0,0,.6)}}
.node2 i{{display:block;font-style:normal;font-size:64px;line-height:1;margin-bottom:10px}}
.wire{{position:absolute;height:10px;border-radius:5px;background:{Y};transform-origin:0 50%}}
.plug{{position:absolute;padding:20px 30px;border-radius:24px;background:{Y};color:#111;text-align:center;font:800 40px/1.1 "Montserrat",sans-serif;box-shadow:0 0 50px rgba(255,193,7,.5)}}
.plug small{{display:block;margin-top:6px;font:700 26px/1 "Inter",sans-serif}}
.act{{position:absolute;left:150px;right:150px;display:flex;align-items:center;gap:16px;padding:20px 26px;border-radius:22px;background:#fff;box-shadow:0 16px 30px -16px rgba(0,0,0,.4);font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F}}
.act i{{flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#25A55F;color:#fff;font-style:normal;font-size:34px}}
.tagx{{position:absolute;padding:14px 24px;border-radius:999px;font:800 34px/1 "Montserrat",sans-serif}}
.pay{{position:absolute;left:150px;right:150px;padding:30px;border-radius:24px;background:#fff;box-shadow:0 30px 60px -24px rgba(0,0,0,.6)}}
.pay h4{{margin:0 0 16px;font:800 34px/1 "Montserrat",sans-serif;color:#5C5C5C}}
.pay p{{display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid #EEE;font:700 34px/1 "Inter",sans-serif;color:#1F1F1F}}
.pay p b{{color:#B42318}}
.half{{position:absolute;top:360px;width:470px;height:1050px;border-radius:30px;padding:24px;text-align:center;color:#1F1F1F}}
.hfig{{height:560px;width:240px;margin:0 auto}}
.res{{display:inline-block;margin-top:18px;padding:18px 24px;border-radius:20px;font:800 34px/1.1 "Montserrat",sans-serif}}
.mail{{position:absolute;left:70px;right:70px;padding:30px 34px;border-radius:24px;background:#fff;box-shadow:0 30px 60px -24px rgba(0,0,0,.6);font:600 36px/1.4 "Inter",sans-serif;color:#1F1F1F}}
.mail h4{{margin:0 0 14px;font:700 26px/1.3 "Inter",sans-serif;color:#6B6B6B}}
.inj{{background:rgba(229,72,77,.18);color:#B42318;font-weight:800;border-radius:8px;padding:0 6px}}
.cntr{{position:absolute;left:0;right:0;text-align:center;font:800 170px/1 "Montserrat",sans-serif;color:#E5484D;font-variant-numeric:tabular-nums}}
.cntr small{{display:block;font:800 40px/1.2 "Montserrat",sans-serif;color:#fff}}
.flt{{position:absolute;left:70px;right:70px;padding:26px 30px;border-radius:24px;background:#fff;box-shadow:inset 0 0 0 4px #25A55F,0 20px 40px -20px rgba(0,0,0,.4)}}
.flt b{{display:block;font:800 40px/1.1 "Montserrat",sans-serif;color:#1E7B45}}
.flt p{{margin-top:10px;font:600 32px/1.3 "Inter",sans-serif;color:#1F1F1F}}
.clk{{position:absolute;left:0;right:0;text-align:center;font:800 120px/1 "Montserrat",sans-serif;color:#fff}}
.clk small{{display:block;font:700 36px/1 "Inter",sans-serif;color:#CFCFCF;margin-bottom:12px}}
.qbub{{position:absolute;padding:12px 18px;border-radius:18px;background:#1F2C34;color:#E9EDEF;font:600 26px/1 "Inter",sans-serif}}
.mdl{{position:absolute;width:420px;padding:26px;border-radius:28px;text-align:center}}
.mdl i{{display:block;font-style:normal;line-height:1;margin-bottom:12px}}
.mdl b{{display:block;font:800 36px/1.1 "Montserrat",sans-serif}}
.mdl small{{display:block;margin-top:10px;font:700 30px/1.1 "Inter",sans-serif}}
.bill{{position:absolute;left:0;right:0;text-align:center}}
.bill span{{display:inline-block;padding:20px 34px;border-radius:24px;font:800 48px/1 "Montserrat",sans-serif}}
.log{{position:absolute;left:70px;right:70px;padding:24px 28px;border-radius:24px;background:#0E1116;box-shadow:inset 0 0 0 2px #2A2F3A;font:600 32px/1.5 ui-monospace,Menlo,monospace;color:#E6EDF3}}
.log p{{margin:4px 0}}.log .k{{color:{Y}}}
.evb{{position:absolute;left:70px;right:70px}}
.evb b{{display:block;font:800 40px/1 "Montserrat",sans-serif;color:#fff;margin-bottom:14px}}
.evb .tr3{{height:70px;border-radius:20px;background:#2A2A33;overflow:hidden}}
.evb .fl3{{height:100%;width:100%;border-radius:20px;background:#25A55F;display:flex;align-items:center;justify-content:flex-end;padding-right:24px;font:800 36px/1 "Montserrat",sans-serif;color:#fff;transform-origin:0 50%}}
.blk{{position:absolute;left:250px;width:580px;height:104px;border-radius:18px;display:flex;align-items:center;gap:18px;padding:0 24px;font:800 36px/1 "Montserrat",sans-serif;color:#111;box-shadow:inset 0 -8px 0 rgba(0,0,0,.15),0 10px 20px -10px rgba(0,0,0,.5)}}
.blk span{{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#1F1F1F;color:#fff}}
.hat{{position:absolute;font-size:110px;line-height:1}}
.cal{{position:absolute;left:340px;width:400px;padding:0 0 30px;border-radius:30px;background:#fff;overflow:hidden;text-align:center;box-shadow:0 30px 60px -24px rgba(0,0,0,.6)}}
.cal h4{{margin:0;padding:20px;background:#E5484D;color:#fff;font:800 40px/1 "Montserrat",sans-serif}}
.cal b{{display:block;margin-top:24px;font:800 110px/1 "Montserrat",sans-serif;color:#1F1F1F}}
.cal small{{display:block;margin-top:10px;font:700 36px/1 "Inter",sans-serif;color:#5C5C5C}}
.diff{{position:absolute;left:70px;right:70px;padding:24px 28px;border-radius:22px;background:#0E1116;font:600 30px/1.5 ui-monospace,Menlo,monospace}}
.diff .dm{{color:#FF7B72}}.diff .dp{{color:#7EE787}}
.skip{{position:absolute;left:0;right:0;text-align:center}}
.skip span{{display:inline-block;padding:18px 28px;border-radius:999px;background:#E5484D;color:#fff;font:800 36px/1 "Montserrat",sans-serif}}
.big{{position:absolute;left:50px;right:50px;text-align:center;font:800 96px/1.05 "Montserrat",sans-serif;color:#fff;letter-spacing:-.02em}}
.big em{{font-style:normal;color:{Y}}}
.crk{{box-shadow:inset 0 0 0 6px #E5484D !important;background:#FFB4B4 !important}}
"""
# ---------------------------------------------------------------- characters drawn in code (SVG)
def _hair(style, c):
    if style == 'long':
        return f'<path d="M52 128 C44 50 90 30 120 32 C160 30 200 52 190 130 L196 250 C180 236 172 200 172 150 C150 110 92 108 70 150 C68 200 60 236 44 250 Z" fill="{c}"/>'
    if style == 'bun':
        return f'<circle cx="120" cy="40" r="30" fill="{c}"/><path d="M58 118 C56 64 90 44 120 44 C150 44 186 64 182 118 C170 92 150 80 120 80 C90 80 70 92 58 118 Z" fill="{c}"/><path d="M56 92 C80 70 160 70 184 92 L184 100 C160 82 80 82 56 100 Z" fill="#C0392B"/>'
    return f'<path d="M58 112 C54 60 92 42 122 44 C156 44 188 64 182 112 C172 86 150 76 120 76 C94 76 72 86 58 112 Z" fill="{c}"/>'
def person(skin='#E8B48A', shirt='#2F6FD6', pants='#26324A', hair='#3B2416', style='short', extra='', mood='smile'):
    mouth = {'smile': '<path d="M100 142 Q120 160 140 142" stroke="#5A2E1A" stroke-width="6" fill="none" stroke-linecap="round"/>',
             'o': '<ellipse cx="120" cy="148" rx="11" ry="14" fill="#5A2E1A"/>',
             'hmm': '<path d="M104 148 L136 144" stroke="#5A2E1A" stroke-width="6" stroke-linecap="round"/>'}[mood]
    return (f'<svg viewBox="0 0 240 560" style="width:100%;height:100%;overflow:visible">'
            f'<ellipse cx="120" cy="548" rx="80" ry="10" fill="rgba(0,0,0,.18)"/>'
            f'<rect x="80" y="360" width="34" height="175" rx="14" fill="{pants}"/><rect x="126" y="360" width="34" height="175" rx="14" fill="{pants}"/>'
            f'<ellipse cx="94" cy="538" rx="26" ry="12" fill="#222"/><ellipse cx="146" cy="538" rx="26" ry="12" fill="#222"/>'
            f'<rect x="30" y="205" width="34" height="150" rx="17" fill="{shirt}" transform="rotate(8 47 205)"/><rect x="176" y="205" width="34" height="150" rx="17" fill="{shirt}" transform="rotate(-8 193 205)"/>'
            f'<circle cx="36" cy="356" r="17" fill="{skin}"/><circle cx="204" cy="356" r="17" fill="{skin}"/>'
            f'<rect x="56" y="190" width="128" height="195" rx="42" fill="{shirt}"/>'
            f'<rect x="104" y="168" width="32" height="34" fill="{skin}"/>'
            + extra +
            f'<circle cx="120" cy="118" r="62" fill="{skin}"/>' + _hair(style, hair) +
            f'<circle cx="98" cy="118" r="7" fill="#2A1A10"/><circle cx="142" cy="118" r="7" fill="#2A1A10"/>' + mouth + '</svg>')
APRON = '<path d="M78 230 L162 230 L172 380 L68 380 Z" fill="#F2B705"/><path d="M84 230 L100 196 M156 230 L140 196" stroke="#F2B705" stroke-width="8"/><rect x="104" y="300" width="32" height="28" rx="4" fill="#fff" opacity=".85"/>'
BADGE = '<rect x="132" y="236" width="36" height="46" rx="6" fill="#fff"/><rect x="138" y="244" width="24" height="6" fill="#2F6FD6"/>'
BLAZER = '<path d="M56 230 C56 200 80 190 104 190 L120 260 L136 190 C160 190 184 200 184 230 L184 385 L56 385 Z" fill="#1F4E79"/><path d="M104 190 L120 260 L136 190 Z" fill="#F5F0E6"/>'
GLASSES = '<g fill="none" stroke="#2A1A10" stroke-width="5"><circle cx="98" cy="118" r="17"/><circle cx="142" cy="118" r="17"/><path d="M115 118 L125 118"/></g>'
PHONE = '<rect x="188" y="300" width="34" height="58" rx="7" fill="#1F1F1F"/><rect x="192" y="306" width="26" height="44" rx="4" fill="#8FD3FF"/>'
def robot(mood='ok'):
    eyes = ('<circle cx="118" cy="110" r="22" fill="#7FE7FF"/><circle cx="182" cy="110" r="22" fill="#7FE7FF"/><circle cx="118" cy="110" r="9" fill="#0B2A33"/><circle cx="182" cy="110" r="9" fill="#0B2A33"/>'
            if mood == 'ok' else
            '<g fill="none" stroke="#7FE7FF" stroke-width="5"><circle cx="118" cy="110" r="20"/><circle cx="118" cy="110" r="11"/><circle cx="182" cy="110" r="20"/><circle cx="182" cy="110" r="11"/></g>')
    mouth = '<path d="M126 148 Q150 164 174 148" stroke="#7FE7FF" stroke-width="6" fill="none" stroke-linecap="round"/>' if mood == 'ok' else '<path d="M126 156 Q150 142 174 156" stroke="#7FE7FF" stroke-width="6" fill="none" stroke-linecap="round"/>'
    keys = ''.join(f'<rect x="{112 + c * 28}" y="{238 + r * 28}" width="20" height="20" rx="4" fill="#E6E6E6"/>' for r in range(3) for c in range(3))
    return (f'<svg viewBox="0 0 300 440" style="width:100%;height:100%;overflow:visible">'
            f'<ellipse cx="150" cy="430" rx="90" ry="10" fill="rgba(0,0,0,.2)"/>'
            f'<line x1="150" y1="40" x2="150" y2="8" stroke="#6B7580" stroke-width="8"/><circle cx="150" cy="8" r="12" fill="#E5484D"/>'
            f'<rect x="102" y="345" width="30" height="70" rx="10" fill="#6B7580"/><rect x="168" y="345" width="30" height="70" rx="10" fill="#6B7580"/>'
            f'<rect x="34" y="210" width="34" height="110" rx="17" fill="#8A949E" transform="rotate(14 51 210)"/><rect x="232" y="210" width="34" height="110" rx="17" fill="#8A949E" transform="rotate(-14 249 210)"/>'
            f'<rect x="72" y="198" width="156" height="156" rx="26" fill="#9AA3AD"/>' + keys +
            f'<rect x="60" y="40" width="180" height="142" rx="32" fill="#9AA3AD"/><rect x="78" y="60" width="144" height="104" rx="22" fill="#1E2A33"/>' + eyes + mouth +
            f'<rect x="44" y="90" width="18" height="40" rx="8" fill="#6B7580"/><rect x="238" y="90" width="18" height="40" rx="8" fill="#6B7580"/></svg>')
FIG = {
    'marcela': (240 / 560, person(skin='#E8B48A', shirt='#F5F0E6', pants='#2B2B33', hair='#4A2A18', style='long', extra=BLAZER + GLASSES.replace('<g', '<g style="display:none"'), mood='smile')),
    'marcela-g': (240 / 560, person(skin='#E8B48A', shirt='#F5F0E6', pants='#2B2B33', hair='#4A2A18', style='long', extra=BLAZER, mood='smile')),
    'rosa': (240 / 560, person(skin='#C98E66', shirt='#F4F4F4', pants='#3A4A6B', hair='#2A1A10', style='bun', extra=APRON, mood='o')),
    'andres': (240 / 560, person(skin='#D9A07A', shirt='#2F6FD6', pants='#26324A', hair='#1F140C', style='short', extra=BADGE + PHONE, mood='hmm')),
    'bot': (300 / 440, robot('ok')),
    'bot-err': (300 / 440, robot('err')),
}
def fig(id_, name, extra_cls='', attrs=''):
    return f'<div id="{id_}" class="abs figc {extra_cls}" style="aspect-ratio:{FIG[name][0]:.4f}" {attrs}>{FIG[name][1]}</div>'

SOF = '<span class="sof" style="position:static"><i>☕</i>SofIA</span>'
def sofchat(id_, style, msgs):
    return chat(id_, style, msgs, who='Sofía · Café Lumbre', sub='asistente con IA')
def CAPA(id_, n, name, sub, top):
    return f'<div id="{id_}" class="capa" style="top:{top}px"><small>CAPA {n}</small><b>{name}</b><p>{sub}</p></div>'
LAY = [('System Prompt', '#FFC107'), ('RAG', '#FFD54F'), ('Herramientas', '#FFB300'), ('Accesos', '#FFE082'), ('Guardrails', '#FFCA28'), ('Caché', '#FFA000'), ('Router', '#FFD740'), ('Observabilidad', '#FFC400')]
def tower(id_, top, crack=()):
    h = ''
    for i, (nm, c) in enumerate(LAY):
        y = top + (7 - i) * 112
        h += f'<div id="{id_}{i + 1}" class="blk {id_}b{" crk" if i + 1 in crack else ""}" style="top:{y}px;background:{c}"><span>{i + 1}</span>{nm}</div>'
    return h
CH_IN = lambda s: f'tl.from("#X-ch",{{opacity:0,y:200,duration:.45,ease:"power3.out"}},{s:.2f});'
POP = lambda sel, t, extra='': f'tl.from("{sel}",{{opacity:0,scale:.4,duration:.35,ease:"back.out(2.2)"{extra}}},{t:.2f});'
UP = lambda sel, t: f'tl.from("{sel}",{{opacity:0,y:60,duration:.4,ease:"power3.out"}},{t:.2f});'
EXTRA2 = EXTRA2 + f"""
.uso{{position:absolute;left:0;right:0;top:130px;text-align:center}}
.uso span{{display:inline-flex;align-items:center;gap:14px;padding:12px 28px 12px 12px;border-radius:999px;background:#1F1F1F;color:#fff;font:800 32px/1 "Montserrat",sans-serif}}
.uso b{{display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:{Y};color:#111;font:800 32px/1 "Montserrat",sans-serif}}
.ut{{position:absolute;left:50px;right:50px;top:215px;text-align:center;font:800 84px/1.02 "Montserrat",sans-serif;color:#1F1F1F;letter-spacing:-.02em}}
.ut em{{font-style:normal;background:linear-gradient(transparent 58%,{Y} 58%,{Y} 92%,transparent 92%);padding:0 .06em}}
.pr{{position:absolute;left:70px;right:70px;padding:24px 28px 24px 28px;border-radius:24px;background:#16161B;color:#fff;font:600 34px/1.35 "Inter",sans-serif;box-shadow:0 20px 40px -20px rgba(0,0,0,.6)}}
.pr small{{display:block;margin-bottom:8px;font:800 24px/1 "Montserrat",sans-serif;color:{Y};letter-spacing:.1em}}
.out{{position:absolute;left:70px;right:70px;padding:26px 30px;border-radius:24px;background:#fff;color:#1F1F1F;font:600 32px/1.4 "Inter",sans-serif;box-shadow:inset 0 0 0 4px #25A55F,0 24px 50px -24px rgba(0,0,0,.4)}}
.out small{{display:block;margin-bottom:8px;font:800 24px/1 "Montserrat",sans-serif;color:#1E7B45;letter-spacing:.1em}}
.out li{{list-style:none;margin:8px 0}}
.out li:before{{content:"✓ ";color:#1E7B45;font-weight:800}}
.inm{{position:absolute;left:70px;right:70px;padding:22px 28px;border-radius:22px;background:#fff;color:#1F1F1F;font:600 30px/1.35 "Inter",sans-serif;box-shadow:inset 0 0 0 4px #F3B4B0,0 20px 40px -20px rgba(0,0,0,.4)}}
.inm b{{color:#B42318}}
.cnt2{{position:absolute;padding:16px 24px;border-radius:20px;background:#fff;color:#1F1F1F;font:800 38px/1 "Montserrat",sans-serif;box-shadow:0 16px 30px -14px rgba(0,0,0,.4)}}
.clk2{{position:absolute;padding:14px 22px;border-radius:18px;background:#1F1F1F;color:#fff;font:800 44px/1 "Montserrat",sans-serif}}
.dots{{position:absolute;left:90px;right:90px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px}}
.dots span{{display:flex;align-items:center;gap:14px;padding:22px 18px;border-radius:22px;background:#fff;font:800 36px/1.1 "Montserrat",sans-serif;color:#1F1F1F;box-shadow:0 14px 26px -14px rgba(0,0,0,.35)}}
.dots b{{flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:{Y};font:800 32px/1 "Montserrat",sans-serif}}
.mtx{{position:absolute;left:70px;right:70px;display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.mtx div{{padding:22px;border-radius:22px;min-height:190px;font:700 30px/1.25 "Inter",sans-serif;color:#1F1F1F}}
.mtx small{{display:block;margin-bottom:10px;font:800 22px/1.1 "Montserrat",sans-serif;letter-spacing:.06em}}
.xls{{position:absolute;left:70px;right:70px;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 24px 50px -24px rgba(0,0,0,.4)}}
.xls .fx{{display:flex;align-items:center;gap:14px;padding:16px 20px;background:#1E7B45;color:#fff;font:700 30px/1.2 ui-monospace,Menlo,monospace}}
.xls .fx i{{font-style:italic;font-weight:800;font-family:Georgia,serif}}
.xls p{{padding:20px 22px;font:600 30px/1.35 "Inter",sans-serif;color:#1F1F1F}}
.ln3{{text-decoration:line-through;text-decoration-color:#E5484D;text-decoration-thickness:4px;color:#8A8A8A}}
.rule{{position:absolute;left:70px;right:70px;padding:28px 30px;border-radius:28px;background:#fff;color:#1F1F1F;box-shadow:0 24px 50px -24px rgba(0,0,0,.6)}}
.rule small{{display:block;font:800 26px/1 "Montserrat",sans-serif;color:#B8860B;letter-spacing:.1em}}
.rule b{{display:block;margin-top:10px;font:800 46px/1.1 "Montserrat",sans-serif}}
.rule p{{margin-top:10px;font:600 32px/1.3 "Inter",sans-serif;color:#5C5C5C}}
.chips8{{position:absolute;left:70px;right:70px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px}}
.chips8 span{{padding:12px 18px;border-radius:999px;background:#1C1C22;box-shadow:inset 0 0 0 2px #3A3A44;color:#fff;font:700 28px/1 "Inter",sans-serif}}
.chips8 b{{color:{Y};margin-right:6px}}
"""
USO = lambda n, t: f'<div class="uso"><span><b>{n}</b>Uso {n}</span></div><h1 id="X-t" class="ut">{t}</h1>'
USO_IN = lambda: 'tl.from(".uso",{{opacity:0,y:-30,duration:.3}},0);tl.from("#X-t",{{opacity:0,y:-20,duration:.35,ease:"back.out(2)"}},.08);'.replace('{{', '{').replace('}}', '}')
def CHR(id_, name, css):
    return f'<img id="{id_}" class="char" src="assets/chars/{name}.webp" alt="" data-layout-allow-overlap>', f'#{id_}{{{{{css}}}}}'.replace('{{{{', '{').replace('}}}}', '}')
S = []
S.append(('o01', 'of', .3, """
#X-t{top:170px;font-size:80px}
#X-v{left:20px;top:560px;height:940px}
#X-rl{left:700px;top:330px;width:270px}
#X-ck{left:740px;top:620px}
#X-k1{left:560px;top:760px}#X-k2{left:610px;top:880px}#X-k3{left:580px;top:1000px}
""", '<h1 id="X-t" class="qd">Las <em>5:00 p. m.</em>…</h1>'
 + '<img id="X-v" class="char" src="assets/chars/valentina-papeles.webp" alt="">'
 + '<img id="X-rl" class="char" src="assets/chars/reloj.webp" alt="">'
 + '<div id="X-k1" class="cnt2 X-k">📧 40 correos</div><div id="X-k2" class="cnt2 X-k">📊 1 informe</div><div id="X-k3" class="cnt2 X-k">📝 1 acta</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-rl",{{opacity:0,scale:.4,rotation:-30,duration:.45,ease:"back.out(2)"}},.15);
tl.from("#X-v",{{opacity:0,x:-300,duration:.5,ease:"power3.out"}},.3);
tl.from(".X-k",{{opacity:0,x:200,duration:.35,ease:"back.out(2)",stagger:{d * .12:.2f}}},{s + d * .3:.2f});
tl.to("#X-v",{{x:6,duration:.07,yoyo:true,repeat:5}},{s + d * .85:.2f});"""))
S.append(('o02', 'ty', .3, """
#X-t{top:160px;font-size:78px}
#X-p{left:690px;top:640px;height:840px}
#X-dt{top:480px;left:50px;right:370px;grid-template-columns:repeat(2,1fr)}
""", '<h1 id="X-t" class="qd">8 usos de la IA<br>para tu <em>oficina</em></h1>'
 + '<img id="X-p" class="char" src="assets/chars/pascal-senala.webp" alt="">'
 + '<div id="X-dt" class="dots">' + ''.join(f'<span class="X-d"><b>{i + 1}</b>{t}</span>' for i, t in enumerate(['Correos', 'Resumir', 'Actas', 'Excel', 'Informes', 'Tu día', 'Corregir', 'Preguntas'])) + '</div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-p",{{opacity:0,x:300,duration:.5,ease:"power3.out"}},.2);
tl.from(".X-d",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)",stagger:{d * .06:.2f}}},{s + d * .45:.2f});"""))
S.append(('o03', 'tl', .3, """
#X-pr{top:380px}
#X-in{top:600px}
#X-ou{top:820px;right:300px}
#X-a{left:780px;top:960px;height:560px}
""", USO(1, 'Correos')
 + '<div id="X-in" class="inm">📧 <b>Cliente:</b> «¡Pésimo servicio! Mi pedido lleva una semana de retraso.»</div>'
 + '<div id="X-pr" class="pr"><small>TÚ LE PIDES</small>Respóndele con calma, en 3 líneas, y ofrécele una solución.</div>'
 + '<div id="X-ou" class="out"><small>BORRADOR</small>Hola, Sra. López: lamentamos el retraso. Su pedido ya salió con prioridad y le enviamos la guía hoy. Quedo atento. — Andrés</div>'
 + '<img id="X-a" class="char" src="assets/chars/andres-escribe.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-in",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .15:.2f});
tl.from("#X-pr",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},{s + d * .3:.2f});
tl.from("#X-a",{{opacity:0,x:200,duration:.45,ease:"power3.out"}},{s + d * .5:.2f});
tl.from("#X-ou",{{opacity:0,scale:.8,duration:.45,ease:"back.out(1.8)"}},{s + d * .75:.2f});"""))
S.append(('o04', 'tl', .3, """
#X-pp{left:90px;top:430px;width:300px}
#X-pg{left:110px;top:860px;transform:rotate(-4deg)}
#X-ar{left:420px;top:610px}
#X-ou{left:470px;right:50px;top:420px}
""", USO(2, 'Resumir')
 + '<img id="X-pp" class="char" src="assets/chars/papeles.webp" alt=""><div id="X-pg" class="cnt2">📄 40 páginas</div><p id="X-ar" class="arr" style="color:#1F1F1F">→</p>'
 + '<div id="X-ou" class="out"><small>5 PUNTOS CLAVE</small><ul>' + ''.join(f'<li class="X-l">{t}</li>' for t in ['Objetivo del contrato', 'Entregables por mes', 'Pagos y requisitos', 'Penalidades', 'Fechas: 1 dic · 15 ene · 30 mar']) + '</ul></div>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-pp",{{opacity:0,y:200,duration:.45,ease:"back.out(1.6)"}},.2);
{POP("#X-pg", s + d * .15)}
tl.from("#X-ar",{{opacity:0,x:-40,duration:.3}},{s + d * .35:.2f});
tl.from("#X-ou",{{opacity:0,x:200,duration:.4,ease:"power3.out"}},{s + d * .4:.2f});
tl.from(".X-l",{{opacity:0,x:-30,duration:.25,stagger:{d * .07:.2f}}},{s + d * .45:.2f});"""))
S.append(('o05', 'tl', .3, """
#X-nt{left:70px;right:480px;top:400px;padding:26px;border-radius:16px;background:#FFF3A6;transform:rotate(-3deg);font:700 30px/1.5 "Inter",sans-serif;color:#3A3A3A;box-shadow:0 18px 30px -14px rgba(0,0,0,.35)}
#X-v{left:720px;top:400px;height:600px}
#X-ou{top:1040px}
""", USO(3, 'Actas de reunión')
 + '<div id="X-nt" class="abs">notas: presupuesto ok?? · Juan revisa proveedor · lanzar en dic · ojo fecha informe</div>'
 + '<img id="X-v" class="char" src="assets/chars/valentina-notas.webp" alt="">'
 + '<div id="X-ou" class="out"><small>ACTA</small><b>Decisión:</b> presupuesto aprobado.<br><b>Responsable:</b> Juan · revisar proveedor.<br><b>Fecha:</b> lanzamiento en diciembre.</div>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-nt",{{opacity:0,rotation:-15,y:100,duration:.45,ease:"back.out(1.6)"}},{s + d * .1:.2f});
tl.from("#X-v",{{opacity:0,x:200,duration:.45,ease:"power3.out"}},{s + d * .2:.2f});
tl.from("#X-ou",{{opacity:0,y:100,duration:.45,ease:"back.out(1.6)"}},{s + d * .5:.2f});"""))
S.append(('o06', 'tl', .3, """
#X-pr{top:390px}
#X-xl{top:620px}
#X-m{left:740px;top:930px;height:580px}
""", USO(4, 'Excel')
 + '<div id="X-pr" class="pr"><small>TÚ LE PIDES</small>Necesito sumar las ventas de Bogotá en marzo.</div>'
 + '<div id="X-xl" class="xls"><div class="fx"><i>fx</i>=SUMAR.SI.CONJUNTO(C:C; A:A; "Bogotá"; B:B; "marzo")</div><p>💡 Suma la columna C cuando la ciudad (A) es Bogotá y el mes (B) es marzo.</p></div>'
 + '<img id="X-m" class="char" src="assets/chars/marcela-factura.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-pr",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},{s + d * .1:.2f});
tl.from("#X-xl",{{opacity:0,scale:.85,duration:.45,ease:"back.out(1.6)"}},{s + d * .4:.2f});
tl.from("#X-xl p",{{opacity:0,duration:.35}},{s + d * .7:.2f});
tl.from("#X-m",{{opacity:0,x:200,duration:.45,ease:"power3.out"}},{s + d * .6:.2f});"""))
BARS = ''.join(f'<div style="position:absolute;left:{40 + i * 70}px;bottom:30px;width:44px;height:{h}px;border-radius:8px 8px 0 0;background:{"#FFC107" if i == 4 else "#1F1F1F"}"></div>' for i, h in enumerate([60, 90, 75, 120, 160]))
S.append(('o07', 'tl', .3, """
#X-pr{top:380px}
#X-ou{top:600px;right:420px}
#X-ch2{left:690px;top:620px;width:330px;height:250px;border-radius:22px;background:#fff;box-shadow:0 20px 40px -20px rgba(0,0,0,.4)}
#X-m{left:600px;top:930px;height:580px}
""", USO(5, 'Informes')
 + '<div id="X-pr" class="pr"><small>TÚ LE PIDES</small>Con estos datos del mes, arma la estructura del informe.</div>'
 + '<div id="X-ou" class="out"><small>ESTRUCTURA</small>1. Resumen<br>2. Hallazgos<br>3. Próximos pasos</div>'
 + f'<div id="X-ch2" class="abs">{BARS}</div>'
 + '<img id="X-m" class="char" src="assets/chars/marcela-acuerdo.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-pr",{{opacity:0,y:40,duration:.4,ease:"power3.out"}},{s + d * .15:.2f});
tl.from("#X-ou",{{opacity:0,x:-200,duration:.4,ease:"power3.out"}},{s + d * .5:.2f});
tl.from("#X-ch2 div",{{scaleY:0,transformOrigin:"50% 100%",duration:.3,stagger:.08}},{s + d * .55:.2f});
tl.from("#X-m",{{opacity:0,y:200,duration:.45,ease:"power3.out"}},{s + d * .65:.2f});"""))
S.append(('o08', 'tl', .3, """
#X-mx{top:400px}
#X-j{left:780px;top:1000px;height:470px}
""", USO(6, 'Organizar tu día')
 + '<div id="X-mx" class="mtx">'
 + '<div class="X-q" style="background:#FFE3E3"><small style="color:#B42318">URGENTE E IMPORTANTE</small>Informe para gerencia</div>'
 + '<div class="X-q" style="background:#FFF3C4"><small style="color:#8A6100">IMPORTANTE</small>Preparar reunión del jueves</div>'
 + '<div class="X-q" style="background:#DCEBFF"><small style="color:#1D4E89">URGENTE</small>Responder al proveedor</div>'
 + '<div class="X-q" style="background:#EEEEEE"><small style="color:#5C5C5C">PUEDE ESPERAR</small>Ordenar carpetas</div></div>'
 + '<img id="X-j" class="char" src="assets/chars/julian-reloj.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""{USO_IN()}
tl.from(".X-q",{{opacity:0,scale:.6,duration:.35,ease:"back.out(2)",stagger:{d * .12:.2f}}},{s + d * .3:.2f});
tl.from("#X-j",{{opacity:0,y:200,duration:.45,ease:"power3.out"}},{s + d * .15:.2f});"""))
S.append(('o09', 'tl', .3, """
#X-a1{top:400px}
#X-a2{top:600px}
#X-a3{top:840px}
""", USO(7, 'Corregir y traducir')
 + '<div id="X-a1" class="inm" style="box-shadow:0 20px 40px -20px rgba(0,0,0,.4)"><span class="ln3">ola, le mando el informe q me pidio</span></div>'
 + '<div id="X-a2" class="out"><small>CORREGIDO Y FORMAL</small>Buenos días. Adjunto el informe que me solicitó.</div>'
 + '<div id="X-a3" class="out" style="box-shadow:inset 0 0 0 4px #2F6FD6,0 24px 50px -24px rgba(0,0,0,.4)"><small style="color:#1D4E89">EN INGLÉS 🇺🇸</small>Good morning. Please find attached the report you requested.</div>',
 lambda D, s, d: f"""{USO_IN()}
tl.from("#X-a1",{{opacity:0,x:-200,duration:.4}},{s + d * .1:.2f});
tl.from("#X-a2",{{opacity:0,y:60,duration:.4,ease:"back.out(1.6)"}},{s + d * .35:.2f});
tl.from("#X-a3",{{opacity:0,y:60,duration:.4,ease:"back.out(1.6)"}},{s + d * .7:.2f});"""))
S.append(('o10', 'ty', .3, """
#X-ch{left:120px;top:380px;width:840px;height:560px}
#X-ch .m{font-size:38px}
#X-c{left:60px;top:960px;height:560px}
#X-tg{left:520px;top:1050px;background:#1F1F1F;color:#FFC107}
""", USO(8, 'Preguntas frecuentes')
 + chat('X-ch', '', [('X-m1', True, '¿A qué hora abren el sábado? 🤔', '11:48 p. m. <b>✓✓</b>'), ('X-m2', False, '¡Hola! Los sábados abrimos de 8 a. m. a 1 p. m. 😊 ¿Te ayudo con algo más?', '11:48 p. m.')], who='Asistente de la empresa', sub='en línea')
 + '<img id="X-c" class="char" src="assets/chars/camila-feliz.webp" alt="" data-layout-allow-overlap><span id="X-tg" class="tagx">🌙 a cualquier hora</span>',
 lambda D, s, d: f"""{USO_IN()}
{CH_IN(.2)}
{UP("#X-m1", s + d * .3)}
tl.from("#X-m2",{{opacity:0,y:40,scale:.9,duration:.4,ease:"back.out(2)"}},{s + d * .55:.2f});
tl.from("#X-c",{{opacity:0,x:-200,duration:.45,ease:"power3.out"}},{s + d * .6:.2f});
{POP("#X-tg", s + d * .8)}"""))
S.append(('o11', 'td', .4, """
#X-t{top:150px;font-size:78px}
#X-r1{top:340px}
#X-r2{top:720px;right:330px}
#X-h1{left:740px;top:820px;height:680px}
#X-h2{left:730px;top:830px;height:670px}
""", '<h1 id="X-t" class="q">2 reglas de <em>oro</em></h1>'
 + '<div id="X-r1" class="rule"><small>REGLA 1</small><b>🔒 No pegues datos sensibles</b><p>Contraseñas, cédulas, datos de clientes… solo en herramientas que tu empresa controla.</p></div>'
 + '<div id="X-r2" class="rule"><small>REGLA 2</small><b>✍️ La IA hace el borrador.<br>Tú revisas.</b><p>Es un practicante muy rápido.</p></div>'
 + '<img id="X-h1" class="char" src="assets/chars/hernando-niega.webp" alt="" data-layout-allow-overlap><img id="X-h2" class="char" src="assets/chars/hernando-pulgar.webp" alt="" data-layout-allow-overlap>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,scale:1.3,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-r1",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .1:.2f});
tl.from("#X-h1",{{opacity:0,x:200,duration:.45,ease:"power3.out"}},{s + d * .2:.2f});
tl.from("#X-r2",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .55:.2f});
tl.to("#X-h1",{{opacity:0,duration:.3}},{s + d * .78:.2f});
tl.fromTo("#X-h2",{{opacity:0,scale:.9}},{{opacity:1,scale:1,duration:.4,ease:"back.out(2)"}},{s + d * .78:.2f});"""))
S.append(('o12', 'of', .5, """
#X-v{left:250px;top:700px;height:760px}
#X-ck{top:200px}
#X-g1{left:90px;top:370px}#X-g2{left:90px;top:480px}#X-g3{left:90px;top:590px}
#X-rl{left:780px;top:420px;width:200px}
#X-cl{left:800px;top:640px}
""", '<h1 id="X-ck" class="qd">¿Y <em>Valentina</em>?</h1>'
 + '<div id="X-g1" class="act X-cx" style="left:90px;right:auto"><i>✓</i>Correos respondidos</div><div id="X-g2" class="act X-cx" style="left:90px;right:auto"><i>✓</i>Acta enviada</div><div id="X-g3" class="act X-cx" style="left:90px;right:auto"><i>✓</i>Informe listo</div>'
 + '<img id="X-rl" class="char" src="assets/chars/reloj.webp" alt=""><div id="X-cl" class="clk2">5:30 p. m.</div>'
 + '<img id="X-v" class="char" src="assets/chars/valentina-relajada.webp" alt="">',
 lambda D, s, d: f"""tl.from("#X-ck",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from(".X-cx",{{opacity:0,x:-150,duration:.35,ease:"back.out(1.8)",stagger:{d * .14:.2f}}},{s + d * .15:.2f});
tl.from(["#X-rl","#X-cl"],{{opacity:0,scale:.5,duration:.4,ease:"back.out(2)"}},{s + d * .6:.2f});
tl.from("#X-v",{{opacity:0,y:300,duration:.5,ease:"back.out(1.4)"}},{s + d * .65:.2f});"""))
S.append(('o13', 'tl', .4, """
#X-t{top:180px;font-size:72px}
#X-a{left:50px;top:440px;background:#ECECEC;color:#5C5C5C;transform:rotate(-2deg)}
#X-a h3{color:#5C5C5C}
#X-a i{background:#D6D6D6}
#X-b{left:580px;top:470px;background:#1F1F1F;color:#fff;box-shadow:0 0 0 5px #FFC107,0 30px 60px -20px rgba(0,0,0,.5);transform:rotate(2deg)}
#X-b h3{color:#FFC107}
#X-b i{background:#FFC107}
""", '<h1 id="X-t" class="qd">De esto…<br><em>a esto</em></h1>'
 + f'<div id="X-a" class="vs2"><h3>ANTES</h3><p><i>{icon("clock", "#5C5C5C")}</i>La tarde entera</p><p><i>{icon("doc", "#5C5C5C")}</i>Todo a mano</p><p><i>{icon("alert", "#5C5C5C")}</i>Salir tarde</p></div>'
 + f'<div id="X-b" class="vs2"><h3>AHORA</h3><p><i>{icon("sparkle", "#111")}</i>La IA hace el borrador</p><p><i>{icon("brain", "#111")}</i>Tú pones el criterio</p><p><i>{icon("check", "#111")}</i>Sales a tiempo</p></div>',
 lambda D, s, d: f"""tl.from("#X-t",{{opacity:0,y:-30,duration:.4,ease:"back.out(2)"}},0);
tl.from("#X-a",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},{s + d * .05:.2f});
tl.from("#X-a p",{{opacity:0,y:20,duration:.25,stagger:.12}},{s + d * .1:.2f});
tl.from("#X-b",{{opacity:0,x:300,scale:.8,duration:.5,ease:"back.out(1.6)"}},{s + d * .45:.2f});
tl.from("#X-b p",{{opacity:0,y:20,duration:.25,stagger:.15}},{s + d * .5:.2f});"""))
S.append(('o14', 'qx', 2.6, """
#X-fl{opacity:0}
#X-q{top:150px;font-size:82px}
#X-g8{top:400px}
#X-qr{left:390px;top:640px;width:300px;padding:20px 20px 12px;border-radius:28px;background:#fff;text-align:center}
#X-qr img{width:100%;display:block}
#X-qr b{display:block;margin-top:8px;font:800 24px/1.1 "Montserrat",sans-serif;color:#1F1F1F}
#X-ak{top:1040px}
#X-ak span{font-size:34px}
#X-a2{top:1140px}
#X-a2 span{font-size:30px}
#X-pb{left:0;right:0;top:1250px;text-align:center;font:700 32px/1.3 "Inter",sans-serif;color:#CFCFCF}
#X-pb img{width:64px;height:64px;vertical-align:middle;margin-right:10px}
""", '<div id="X-rs" class="rays" style="opacity:0"></div><h1 id="X-q" class="big">¿Cuál vas a<br><em>probar primero</em>?</h1>'
 + '<div id="X-g8" class="chips8">' + ''.join(f'<span class="X-ch8"><b>{i + 1}</b>{t}</span>' for i, t in enumerate(['Correos', 'Resumir', 'Actas', 'Excel', 'Informes', 'Tu día', 'Corregir', 'Preguntas'])) + '</div>'
 + '<div id="X-qr" class="abs"><img src="assets/brand/qr-pascalia.svg" alt=""><b>Llévalo a tu equipo</b></div>'
 + '<div id="X-ak" class="ask"><span>💬 Cuéntamelo en los comentarios</span></div>'
 + '<div id="X-a2" class="ask"><span>📤 Mándaselo a quien todavía hace todo a mano</span></div>'
 + '<p id="X-pb" class="abs"><img src="assets/brand/flower.svg" alt="">PascalIA · pascalia.lat</p><div id="X-fl" class="flashw"></div>',
 lambda D, s, d: f"""tl.fromTo("#X-fl",{{opacity:.8}},{{opacity:0,duration:.5,ease:"power2.out"}},0);
tl.to("#X-rs",{{opacity:1,duration:.6}},0.1);tl.to("#X-rs",{{rotation:60,duration:{D:.2f},ease:"none"}},0);
tl.from("#X-q",{{opacity:0,scale:1.3,duration:.5,ease:"back.out(2)"}},.1);
tl.from(".X-ch8",{{opacity:0,scale:.4,duration:.25,ease:"back.out(2.5)",stagger:.08}},{s + d * .1:.2f});
tl.from("#X-qr",{{opacity:0,scale:.5,duration:.45,ease:"back.out(1.8)"}},{s + d * .4:.2f});
{POP("#X-ak", s + d * .25)}
{POP("#X-a2", s + d * .75)}
tl.from("#X-pb",{{opacity:0,y:30,duration:.4}},{s + d * .5:.2f});"""))


BG = {'of': '<img class="abs" src="assets/chars/oficina.webp" alt="" style="inset:0;width:100%;height:100%;object-fit:cover"><div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(255,253,245,.86),rgba(255,253,245,.6) 45%,rgba(255,253,245,.92))"></div>', 'qx': '<div class="abs" style="inset:0;background:#0A0A0D"></div><div class="abs" style="inset:0;background:radial-gradient(55% 32% at 50% 38%,rgba(255,193,7,.20),transparent 72%),radial-gradient(80% 50% at 50% 100%,rgba(255,193,7,.06),transparent 70%)"></div>', 'bk': '<div class="abs" style="inset:0;background:#000"></div>', 'nx': '<div class="abs" style="inset:0;background:#07070B"></div><div class="abs" style="inset:0;background:radial-gradient(60% 35% at 15% 20%,rgba(255,46,77,.18),transparent 70%),radial-gradient(55% 35% at 85% 75%,rgba(43,255,136,.13),transparent 70%),radial-gradient(70% 40% at 50% 50%,rgba(255,201,60,.08),transparent 75%)"></div>', 'tl': '<div class="light"></div>', 'td': '<div class="dark"></div>', 'ty': '<div class="light"></div><div class="abs" style="inset:0;background:radial-gradient(80% 50% at 50% 30%,rgba(255,193,7,.45),transparent 75%)"></div>'}
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
