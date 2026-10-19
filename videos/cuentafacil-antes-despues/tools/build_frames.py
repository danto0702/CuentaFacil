# Generates the 8 scene sub-compositions (compositions/frames/NN-*.html) from one shared style.
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'compositions', 'frames'); os.makedirs(OUT, exist_ok=True)

FONTS = '''
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:500 800;src:url("assets/fonts/BricolageGrotesque-latin-ext.woff2") format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Geist";font-style:normal;font-weight:400 700;src:url("assets/fonts/Geist-latin-ext.woff2") format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2C60-2C7F,U+A720-A7FF}
'''
COMMON = '''
.i{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;display:inline-block;flex:none}
.abs{position:absolute}
.disp{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;letter-spacing:-.035em}
.txt{font-family:"Geist",sans-serif}
.center{left:70px;right:70px;text-align:center}
.glow{position:absolute;border-radius:50%;filter:blur(90px)}
.okbox{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:9px;background:#25D366;vertical-align:-7px;margin-right:8px}
.okbox svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.ghost{position:absolute;font-family:"Bricolage Grotesque",sans-serif;font-weight:800;letter-spacing:-.05em;white-space:nowrap;line-height:1}
'''
def ico(name, cls='i'):
    return f'<svg class="{cls}"><use href="assets/brand/iconos.svg#{name}"></use></svg>'
CHECK = '<span class="okbox"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'

def page(cid, css, body, js=''):
    return f'''<!doctype html>
<html lang="es-CO">
<head><meta charset="UTF-8" /></head>
<body>
<template>
<style>
{FONTS}
#root{{position:absolute;inset:0;overflow:hidden}}
{COMMON}
{css}
</style>
<div id="root" data-composition-id="{cid}" data-width="1080" data-height="1920">
{body}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
{js}
window.__timelines["{cid}"] = tl;
</script>
</template>
</body>
</html>
'''

frames = {}

# ---------- 01 Hook: Día 30 ----------
frames['01-hook'] = ('f01-hook', '''
#root{background:#232327;color:#F1EFEA}
#f01-ghost{left:-60px;top:1180px;font-size:520px;color:rgba(255,255,255,.04)}
#f01-glow{left:240px;top:260px;width:620px;height:620px;background:rgba(214,69,69,.20)}
#f01-clock{left:50%;top:300px;width:700px;margin-left:-350px;padding:42px 0 50px;border-radius:56px;background:#2F2F34;border:3px solid #3C3C42;text-align:center;box-shadow:0 40px 80px -40px rgba(0,0,0,.8)}
#f01-clock small{display:block;font:700 40px/1 "Geist",sans-serif;letter-spacing:.24em;color:#FF6B6B}
#f01-clock b{display:block;margin-top:18px;font:800 190px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.04em;font-variant-numeric:tabular-nums;white-space:nowrap}
#f01-clock b i{font-style:normal;font-size:70px;letter-spacing:0;margin-left:12px;color:#B9B6AE}
#f01-tag{left:70px;top:860px;font:700 44px/1 "Geist",sans-serif;letter-spacing:.18em;color:#9A978F}
.f01-line{left:70px;right:70px;font-size:112px;line-height:1.02}
#f01-l1{top:940px}
#f01-l2{top:1200px;color:#FF6B6B}
#f01-cursor{left:70px;top:1500px;width:8px;height:96px;background:#F1EFEA;opacity:.6}
''', '''
<div id="f01-glow" class="glow" data-layout-allow-overflow></div>
<div id="f01-clock" class="abs"><small>DÍA 30</small><b>11:47<i>p. m.</i></b></div>
<p id="f01-tag" class="abs">ASÍ ERA ANTES</p>
<h1 id="f01-l1" class="abs disp f01-line">Reconstruir el mes de memoria.</h1>
<h1 id="f01-l2" class="abs disp f01-line">Pelear con Word.</h1>
''')

# ---------- 02 Overwhelm ----------
def win(id_, x, y, w, title, inner, rot=0):
    return f'<div id="{id_}" class="abs win" style="left:{x}px;top:{y}px;width:{w}px;rotate:{rot}deg"><div class="wbar"><i></i><i></i><i></i><span>{title}</span></div><div class="wbody">{inner}</div></div>'
pdf = lambda id_, x, y, name, rot: f'<div id="{id_}" class="abs pdf" style="left:{x}px;top:{y}px;rotate:{rot}deg"><span class="pdfi">PDF</span><span>{name}</span></div>'
frames['02-overwhelm'] = ('f02-overwhelm', '''
#root{background:#232327;color:#F1EFEA}
#f02-glow{left:200px;top:700px;width:700px;height:700px;background:rgba(214,69,69,.18)}
.win{border-radius:22px;background:#F4F2EE;color:#2A2A2E;box-shadow:0 30px 60px -24px rgba(0,0,0,.75);overflow:hidden}
.wbar{display:flex;align-items:center;gap:10px;padding:14px 18px;background:#D9D6CF;font:600 24px/1 "Geist",sans-serif;color:#55514B;white-space:nowrap}
.wbar i{width:16px;height:16px;border-radius:50%;background:#B5B1A8}
.wbar span{margin-left:8px;overflow:hidden;text-overflow:ellipsis}
.wbody{padding:22px 24px}
.lines i{display:block;height:14px;border-radius:7px;background:#D2CEC6;margin:12px 0}
.pdf{display:flex;align-items:center;gap:16px;padding:18px 24px;border-radius:20px;background:#F4F2EE;color:#2A2A2E;font:600 28px/1.1 "Geist",sans-serif;box-shadow:0 24px 50px -20px rgba(0,0,0,.7);white-space:nowrap}
.pdfi{display:grid;place-items:center;width:64px;height:76px;border-radius:12px;background:#C53030;color:#fff;font:800 20px/1 "Geist",sans-serif}
#f02-sticky{left:600px;top:250px;width:390px;padding:34px 30px;background:#FFE680;color:#3A3000;rotate:6deg;font:800 54px/1.05 "Bricolage Grotesque",sans-serif;box-shadow:0 30px 50px -24px rgba(0,0,0,.7)}
.sheet td{border:2px solid #D2CEC6;padding:10px 14px;font:600 24px/1 "Geist",sans-serif}
.sheet td.bad{background:#FFD9D9;color:#B32424}
#f02-stamp{left:50%;top:820px;width:900px;margin-left:-450px;text-align:center;padding:30px 0;border:14px solid #E14B4B;border-radius:28px;color:#E14B4B;font:800 170px/1 "Bricolage Grotesque",sans-serif;letter-spacing:.02em;rotate:-12deg;background:rgba(35,35,39,.55)}
#f02-q{left:70px;right:70px;top:1720px;text-align:center;font:700 52px/1.1 "Geist",sans-serif;color:#B9B6AE}
''', 
'<div id="f02-glow" class="glow" data-layout-allow-overflow></div>' +
win('f02-word', 70, 140, 600, 'Informe_final_v7_DEFINITIVO.docx', '<div class="lines"><i style="width:90%"></i><i style="width:70%"></i><i style="width:85%"></i><i style="width:60%"></i><i style="width:78%"></i></div>', -4) +
'<div id="f02-sticky" class="abs">¿Qué hice el día 12?</div>' +
win('f02-sheet', 520, 560, 500, 'planilla_PILA.xlsx', '<table class="sheet"><tr><td>IBC</td><td class="bad">No cuadra</td></tr><tr><td>Periodo</td><td>09/2026</td></tr></table>', 5) +
win('f02-doc', 60, 640, 420, 'certificado.jpg', '<img src="assets/real/documento-difuminado.jpg" style="display:block;width:100%;height:330px;object-fit:cover;border-radius:10px">', -6) +
pdf('f02-p1', 90, 1240, 'antecedentes.pdf', 4) + pdf('f02-p2', 560, 1300, 'afiliaciones.pdf', -5) +
pdf('f02-p3', 140, 1460, 'planilla.pdf', -3) + pdf('f02-p4', 600, 1500, 'informe_v8.pdf', 6) +
'<div id="f02-stamp" class="abs">DEVUELTA</div>' +
'<p id="f02-q" class="abs">Y la cuenta, devuelta otra vez.</p>')

# ---------- 03 Pascal arrives ----------
frames['03-pascal'] = ('f03-pascal', '''
#root{background:#FFC107;color:#1F1F1F}
#f03-glow{left:420px;top:300px;width:800px;height:800px;background:rgba(255,248,225,.55)}
#f03-ghost{left:-40px;top:1460px;font-size:360px;color:rgba(31,31,31,.06)}
#f03-pascal{right:-30px;bottom:-20px;width:500px;filter:drop-shadow(0 40px 60px rgba(80,55,0,.45))}
#f03-pascal img{display:block;width:100%;border-radius:40px}
#f03-small{left:70px;top:330px;font:700 64px/1 "Geist",sans-serif;color:#4A3B00}
#f03-big{left:62px;top:400px;font-size:178px;line-height:.92}
#f03-sub{left:70px;top:640px;width:500px;font:600 50px/1.18 "Geist",sans-serif;color:#3A2E00}
#f03-chip{left:70px;top:920px;display:inline-flex;align-items:center;gap:16px;padding:22px 34px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 44px/1 "Bricolage Grotesque",sans-serif;white-space:nowrap}
#f03-chip .i{font-size:52px}
.f03-junk{display:flex;align-items:center;gap:12px;padding:16px 22px;border-radius:18px;background:#2F2F34;color:#B9B6AE;font:600 26px/1 "Geist",sans-serif;opacity:.85;white-space:nowrap}
#f03-j1{left:-120px;top:120px;rotate:-14deg}
#f03-j2{left:760px;top:140px;rotate:12deg}
#f03-j3{left:-90px;top:1660px;rotate:9deg}
''', f'''
<div id="f03-glow" class="glow" data-layout-allow-overflow></div>
<div id="f03-j1" class="abs f03-junk">{ico('doc')}informe_v8.docx</div>
<div id="f03-j2" class="abs f03-junk">{ico('alert')}IBC no cuadra</div>
<div id="f03-j3" class="abs f03-junk">{ico('folder')}antecedentes.pdf</div>
<p id="f03-small" class="abs">Ahora:</p>
<h1 id="f03-big" class="abs disp">Pascal.</h1>
<p id="f03-sub" class="abs">Tu asistente para la cuenta de cobro.</p>
<div id="f03-chip" class="abs">{ico('whatsapp')}Por WhatsApp</div>
<div id="f03-pascal" class="abs"><img src="assets/pascal/pascal-cuerpo.jpg" alt=""></div>
''')

# ---------- WhatsApp phone shared CSS ----------
PHONE = '''
.phone{position:absolute;left:50%;width:880px;margin-left:-440px;padding:16px;border-radius:72px;background:#111;box-shadow:0 60px 110px -50px rgba(31,31,31,.7)}
.ptop{display:flex;align-items:center;gap:18px;padding:26px 30px;border-radius:56px 56px 0 0;background:#1F2C34;color:#E9EDEF}
.ptop img{width:70px;height:70px;border-radius:50%}
.ptop b{font:600 36px/1.1 "Geist",sans-serif}
.ptop small{display:block;font:400 24px/1.2 "Geist",sans-serif;color:#8696A0}
.chat{position:relative;overflow:hidden;background:#0B141A;padding:24px 26px;display:flex;flex-direction:column;gap:14px}
.m{max-width:84%;padding:16px 20px 14px;border-radius:18px 18px 18px 6px;background:#202C33;color:#E9EDEF;font:400 31px/1.34 "Geist",sans-serif}
.m.me{align-self:flex-end;border-radius:18px 18px 6px 18px;background:#005C4B}
.m .t{display:block;text-align:right;font-size:20px;color:#B8C6C3;margin-top:4px}
.m img{display:block;width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:10px}
.btns{max-width:84%;margin-top:-12px;border-radius:0 0 18px 18px;background:#202C33;overflow:hidden}
.btn{display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;border-top:2px solid #2B3A43;color:#25D366;font:600 31px/1 "Geist",sans-serif;white-space:nowrap}
.btn.dim{color:#7C8A91}
.okbox{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:9px;background:#25D366;vertical-align:-7px;margin-right:8px}
.okbox svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.cal{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:8px;background:#E9EDEF;color:#1F2C34;vertical-align:-7px;margin-right:8px;font:800 16px/1 "Geist",sans-serif}
.pfoot{padding:14px 30px 26px;border-radius:0 0 56px 56px;background:#0B141A;color:#8696A0;font:500 22px/1 "Geist",sans-serif}
.tap{position:absolute;width:120px;height:120px;border-radius:50%;border:6px solid rgba(255,193,7,.95);background:rgba(255,193,7,.25)}
'''

# ---------- 04 Chat ----------
frames['04-chat'] = ('f04-chat', '''
#root{background:#FFFDF7;color:#1F1F1F}
#f04-glow{left:-200px;top:900px;width:800px;height:800px;background:rgba(255,193,7,.25)}
#f04-head{top:110px;font-size:92px;line-height:1.02}
#f04-head em{font-style:normal;background:linear-gradient(transparent 62%,#FFC107 62%);padding:0 6px}
#f04-phone{top:390px}
#f04-chat{height:1180px}
#f04-tap{left:370px;top:1120px}
''' + PHONE, f'''
<div id="f04-glow" class="glow" data-layout-allow-overflow></div>
<h2 id="f04-head" class="abs disp center">Me cuentas tu día. <em>Yo lo anoto.</em></h2>
<div id="f04-phone" class="phone">
  <div class="ptop"><img src="assets/brand/logo.webp" alt=""><div><b>Pascal · CuentaFacil</b><small>en línea</small></div></div>
  <div id="f04-chat" class="chat">
    <div class="m me"><img src="assets/real/foto-reunion-difuminada.jpg" alt="">Se realizó capacitación sobre Misión Médica y DIH al personal sanitario durante el mes de octubre<span class="t">10:08 ✓✓</span></div>
    <div class="m">¿A cuál contrato corresponde?<span class="t">10:08</span></div>
    <div class="btns"><div class="btn">0456 Salud Pública</div><div class="btn dim">0123 Equipos Básicos</div><div class="btn dim">Ambos</div></div>
    <div class="m">{CHECK}Anotado en octubre de 2026 con 1 foto en la obligación 11: «Capacitación y seguimiento al personal sobre la ruta en Misión Médica.»<span style="display:block;margin-top:10px"><span class="cal">30</span>Informe 01 DE 01 (2 al 31 de octubre de 2026)</span><span class="t">10:08</span></div>
  </div>
  <p class="pfoot">Ejemplo ilustrativo · datos ficticios</p>
</div>
<div id="f04-tap" class="tap abs"></div>
''')

# ---------- 05 Contrato ----------
frames['05-contrato'] = ('f05-contrato', '''
#root{background:#FFFDF7;color:#1F1F1F}
#f05-glow{right:-200px;top:200px;width:800px;height:800px;background:rgba(255,193,7,.25)}
#f05-head{top:110px;font-size:92px;line-height:1.02}
#f05-card{left:70px;right:70px;top:380px;padding:44px 46px;border-radius:44px;background:#202C33;color:#E9EDEF;box-shadow:0 50px 90px -46px rgba(31,31,31,.7)}
#f05-card h3{font:700 40px/1.2 "Geist",sans-serif;margin:0 0 22px}
#f05-card li{list-style:none;font:400 32px/1.45 "Geist",sans-serif;color:#D1D7DB}
#f05-card li b{color:#E9EDEF;font-weight:600}
#f05-card ul{margin:0;padding:0}
#f05-count{left:70px;top:1010px;display:flex;align-items:flex-end;gap:26px}
#f05-num{font-size:300px;line-height:.82;color:#1F1F1F;font-variant-numeric:tabular-nums}
#f05-num-l{font:700 52px/1.1 "Geist",sans-serif;color:#55514B;padding-bottom:20px}
.f05-chk{left:70px;right:70px;display:flex;align-items:center;gap:26px;padding:28px 34px;border-radius:30px;background:#fff;box-shadow:0 24px 44px -26px rgba(31,31,31,.45);font:700 46px/1 "Bricolage Grotesque",sans-serif}
.f05-chk .okbox{width:64px;height:64px;border-radius:18px;margin:0}
.f05-chk .okbox svg{width:44px;height:44px}
.f05-chk small{margin-left:auto;font:600 28px/1 "Geist",sans-serif;color:#1D8F4E}
#f05-c1{top:1320px}#f05-c2{top:1480px}#f05-c3{top:1640px}
''', f'''
<div id="f05-glow" class="glow" data-layout-allow-overflow></div>
<h2 id="f05-head" class="abs disp center">Leo tu contrato. Reviso tus soportes.</h2>
<div id="f05-card" class="abs">
  <h3>📋 Esto es lo que leí de tus documentos:</h3>
  <ul>
    <li>• Contrato: <b>CPS-0456-2026</b></li>
    <li>• Entidad: <b>ESE de ejemplo</b></li>
    <li>• Objeto: <b>Servicios profesionales en salud pública</b></li>
    <li>• Plazo: <b>1 mes, hasta el 31/10/2026</b></li>
    <li>• Obligaciones específicas: <b>15</b></li>
  </ul>
</div>
<div id="f05-count" class="abs"><span id="f05-num" class="disp">15</span><span id="f05-num-l"><span style="display:block">obligaciones</span><span style="display:block">organizadas</span></span></div>
<div id="f05-c1" class="abs f05-chk">{CHECK}Planilla PILA<small>periodo e IBC</small></div>
<div id="f05-c2" class="abs f05-chk">{CHECK}Antecedentes<small>vigentes</small></div>
<div id="f05-c3" class="abs f05-chk">{CHECK}Afiliaciones<small>EPS · pensión · ARL</small></div>
''')

# ---------- 06 Split ----------
frames['06-split'] = ('f06-split', '''
#root{background:#FFFDF7}
#f06-top{left:0;right:0;top:0;height:960px;background:#232327;color:#F1EFEA;overflow:hidden}
#f06-bot{left:0;right:0;top:960px;height:960px;background:#FFC107;color:#1F1F1F;overflow:hidden}
.f06-label{left:70px;top:70px;padding:14px 28px;border-radius:999px;font:800 40px/1 "Geist",sans-serif;letter-spacing:.16em}
#f06-lt{background:#3A3A40;color:#FF6B6B}
#f06-lb{background:#1F1F1F;color:#FFC107}
#f06-clock{right:70px;top:60px;font:800 96px/1 "Bricolage Grotesque",sans-serif;color:#FF6B6B;font-variant-numeric:tabular-nums}
#f06-clock i{font-style:normal;font-size:40px;margin-left:8px;color:#B9B6AE}
.f06-f{display:flex;align-items:center;gap:14px;padding:16px 22px;border-radius:18px;background:#F4F2EE;color:#2A2A2E;font:600 28px/1 "Geist",sans-serif;white-space:nowrap;box-shadow:0 20px 40px -20px rgba(0,0,0,.7)}
.f06-f .pdfi{display:grid;place-items:center;width:52px;height:62px;border-radius:10px;background:#C53030;color:#fff;font:800 17px/1 "Geist",sans-serif}
.f06-f .w{background:#2B579A}
#f06-ht{left:70px;right:70px;top:740px;font-size:84px;line-height:1.02}
#f06-hb{left:70px;right:70px;top:100px;font-size:84px;line-height:1.02;padding-top:90px}
#f06-bubble{left:70px;top:420px;width:620px;padding:30px 34px;border-radius:30px 30px 8px 30px;background:#005C4B;color:#E9EDEF;font:500 48px/1.2 "Geist",sans-serif}
#f06-btn{left:70px;top:470px;display:inline-flex;align-items:center;gap:18px;padding:30px 48px;border-radius:999px;background:#1F1F1F;color:#FFC107;font:800 60px/1 "Bricolage Grotesque",sans-serif;box-shadow:0 26px 40px -22px rgba(0,0,0,.6)}
#f06-gen{left:70px;top:660px;font:600 36px/1.2 "Geist",sans-serif;color:#3A2E00}
#f06-vs{left:50%;top:900px;width:120px;height:120px;margin-left:-60px;border-radius:50%;background:#FFFDF7;display:grid;place-items:center;font:800 44px/1 "Bricolage Grotesque",sans-serif;color:#1F1F1F;box-shadow:0 10px 30px rgba(0,0,0,.35)}
''', f'''
<div id="f06-top" class="abs">
  <div id="f06-lt" class="abs f06-label">ANTES</div>
  <div id="f06-clock" class="abs">2:13<i>a. m.</i></div>
  <div class="abs f06-f" style="left:70px;top:220px;rotate:-5deg"><span class="pdfi w">DOC</span>informe_v9.docx</div>
  <div class="abs f06-f" style="left:560px;top:250px;rotate:4deg"><span class="pdfi">PDF</span>planilla.pdf</div>
  <div class="abs f06-f" style="left:110px;top:400px;rotate:3deg"><span class="pdfi">PDF</span>antecedentes.pdf</div>
  <div class="abs f06-f" style="left:600px;top:430px;rotate:-6deg"><span class="pdfi">PDF</span>afiliaciones.pdf</div>
  <div class="abs f06-f" style="left:80px;top:570px;rotate:-2deg"><span class="pdfi">PDF</span>unido_final.pdf</div>
  <div class="abs f06-f" style="left:560px;top:600px;rotate:5deg"><span class="pdfi">PDF</span>supervision.pdf</div>
  <h3 id="f06-ht" class="abs disp">Toda la noche.</h3>
</div>
<div id="f06-bot" class="abs">
  <div id="f06-lb" class="abs f06-label">CON PASCAL</div>
  <h3 id="f06-hb" class="abs disp">Un mensaje.</h3>
  <div id="f06-btn" class="abs">{ico('check')}Hazlo ya</div>
  <p id="f06-gen" class="abs">⏳ Estoy generando tus documentos…</p>
</div>
<div id="f06-vs" class="abs">VS</div>
''')

# ---------- 07 Entrega ----------
files = [('PDF','INFORME OCTUBRE 2026.pdf','229 kB'),('PDF','INFORME DE SUPERVISIÓN OCTUBRE 2026.pdf','152 kB'),('PDF','ANTECEDENTES.pdf','566 kB'),('PDF','AFILIACIONES.pdf','573 kB'),('PDF','PLANILLA OCTUBRE 2026.pdf','394 kB'),('W','INFORME OCTUBRE 2026.docx','157 kB')]
rows = ''.join(f'<div class="f07-file" id="f07-r{i}"><span class="fi {"w" if k=="W" else ""}">{"W" if k=="W" else "PDF"}</span><span class="fn">{n}<small>{s} · {"DOCX" if k=="W" else "PDF"}</small></span></div>' for i,(k,n,s) in enumerate(files))
frames['07-entrega'] = ('f07-entrega', '''
#root{background:#0B141A;color:#E9EDEF}
#f07-glow{left:140px;top:1250px;width:800px;height:800px;background:rgba(37,211,102,.14)}
#f07-head{top:100px;font-size:84px;line-height:1.02;color:#F4F1EA}
#f07-gen{left:70px;right:70px;top:330px;padding:24px 30px;border-radius:22px;background:#202C33;font:500 36px/1.2 "Geist",sans-serif}
#f07-list{left:70px;right:250px;top:460px;display:flex;flex-direction:column;gap:16px}
.f07-file{display:flex;align-items:center;gap:22px;padding:22px 24px;border-radius:22px;background:#202C33}
.fi{display:grid;place-items:center;flex:none;width:64px;height:76px;border-radius:12px;background:#C53030;color:#fff;font:800 20px/1 "Geist",sans-serif}
.fi.w{background:#2B579A;font-size:34px}
.fn{font:600 30px/1.2 "Geist",sans-serif}
.fn small{display:block;font:400 24px/1.3 "Geist",sans-serif;color:#8696A0;margin-top:4px}
#f07-zip{right:60px;top:880px;width:170px;height:200px;border-radius:26px;background:#FFC107;color:#1F1F1F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:800 34px/1 "Geist",sans-serif;box-shadow:0 26px 50px -20px rgba(255,193,7,.5)}
#f07-zip .i{font-size:80px}
#f07-stamp{left:50%;top:1560px;width:900px;margin-left:-450px;padding:34px 0;border-radius:40px;background:#FFC107;color:#1F1F1F;text-align:center;font:800 92px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;rotate:-3deg}
''', f'''
<div id="f07-glow" class="glow" data-layout-allow-overflow></div>
<h2 id="f07-head" class="abs disp center">Tus documentos, listos.</h2>
<div id="f07-gen" class="abs">⏳ Estoy generando tus documentos, dame un momento…</div>
<div id="f07-list" class="abs">{rows}</div>
<div id="f07-zip" class="abs">{ico('zip')}ZIP</div>
<div id="f07-stamp" class="abs">Tú firmas, tú decides.</div>
''')

# ---------- 08 CTA ----------
frames['08-cta'] = ('f08-cta', '''
#root{background:#1F1F1F;color:#F4F1EA}
#f08-glow{left:140px;top:420px;width:800px;height:800px;background:rgba(255,193,7,.16)}
#f08-av{left:50%;top:110px;width:220px;height:220px;margin-left:-110px;border-radius:50%;object-fit:cover;object-position:50% 30%;border:9px solid #FFC107}
#f08-k{top:370px;font-size:100px;line-height:1.02}
#f08-k b{color:#FFC107}
#f08-qr{left:50%;top:640px;width:640px;margin-left:-320px;padding:70px 70px 30px;border-radius:60px;background:#fff;text-align:center;box-shadow:0 0 0 10px rgba(255,193,7,.25)}
#f08-qrc{position:relative;width:500px;height:500px}
#f08-qrc > img:first-child{display:block;width:100%;height:100%}
#f08-qrlogo{position:absolute;left:50%;top:50%;width:146px;height:146px;margin:-73px 0 0 -73px;border-radius:42px;box-shadow:0 0 0 10px #fff}
#f08-cap{margin-top:50px;font:800 34px/1 "Bricolage Grotesque",sans-serif;color:#1F1F1F}
#f08-cta{left:50%;top:1420px;width:740px;margin-left:-370px;display:flex;align-items:center;justify-content:center;gap:22px;padding:36px 0;border-radius:999px;background:#FFC107;color:#1F1F1F;font:700 50px/1 "Geist",sans-serif}
#f08-cta .i{font-size:60px}
#f08-url{top:1610px;font:600 42px/1 "Geist",sans-serif;color:#C9C4BA}
#f08-brand{left:0;right:0;top:1740px;display:flex;justify-content:center;align-items:center;gap:18px;color:#C9C4BA;font:500 30px/1 "Geist",sans-serif}
#f08-brand img{width:56px;height:56px;border-radius:14px}
#f08-brand b{color:#FFC107}
''', f'''
<div id="f08-glow" class="glow" data-layout-allow-overflow></div>
<img id="f08-av" class="abs" src="assets/pascal/pascal-rostro.jpg" alt="">
<h2 id="f08-k" class="abs disp center">Escríbeme y <b>empecemos hoy.</b></h2>
<div id="f08-qr" class="abs"><div id="f08-qrc"><img src="assets/brand/qr.svg" alt=""><img id="f08-qrlogo" src="assets/brand/logo.webp" alt=""></div><p id="f08-cap">Escanéame y empieza</p></div>
<div id="f08-cta" class="abs">{ico('whatsapp')}Empezar por WhatsApp</div>
<p id="f08-url" class="abs center">pascalia.lat/cuentafacil</p>
<div id="f08-brand" class="abs"><img src="assets/brand/flower.svg" alt=""><span>CuentaFacil · de Pascal<b>IA</b></span></div>
''')

JS = json.load(open(os.path.join(ROOT, 'tools', 'motion.json')))
for name,(cid,css,body) in frames.items():
    open(os.path.join(OUT, name + '.html'), 'w').write(page(cid, css, body, JS.get(name, '')))
print('wrote', len(frames))
