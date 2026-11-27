# Carrusel 4:5 (1080x1350) de Pascal Sign: agradecimiento (514 firmas, 10 usuarios) + cómo funciona la app.
# Los textos de funcionamiento salen de la página real de la app (pascalia-web/PascalSign/index.html).
# Uso: python3 generar.py  → laminas/NN.html y, con Playwright, NN.jpg
import os, subprocess, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'firma-garabato', 'tools'))
SIG = ("M30 150 C60 60 120 40 110 120 C100 190 50 170 90 120 C130 70 170 160 200 120 C225 85 240 70 250 110 "
       "C260 150 280 160 300 120 C320 80 340 60 350 100 C360 140 330 170 380 130 C420 100 440 90 470 110 "
       "C500 130 520 100 560 80 M60 190 C200 175 380 185 590 165")
def sig(color='#1B2A6B', w=8, style=''):
    return f'<svg viewBox="0 0 620 230" style="{style}"><path d="{SIG}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/></svg>'
N = 9
CSS = """
@font-face{font-family:"Montserrat";font-weight:800;src:url("../../assets/fonts/montserrat-latin-800-normal.woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url("../../assets/fonts/inter-latin-600-normal.woff2")}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#0A0A0D;font-family:Inter,sans-serif;color:#fff;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(60% 34% at 50% 50%,rgba(255,193,7,.22),transparent 72%)}
.rays{position:absolute;left:-460px;top:-300px;width:2000px;height:2000px;border-radius:50%;background:repeating-conic-gradient(rgba(255,193,7,.05) 0 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(closest-side,#000 30%,transparent 75%)}
.top{position:absolute;left:60px;right:60px;top:56px;display:flex;align-items:center;justify-content:space-between}
.top .br{display:flex;align-items:center;gap:14px;font:800 30px/1 Montserrat}
.top .br img{width:56px;height:56px;border-radius:14px}
.top .pg{font:800 26px/1 Montserrat;color:#8A8A94}
.kick{position:absolute;left:0;right:0;top:170px;text-align:center}
.kick span{display:inline-flex;align-items:center;gap:12px;padding:12px 26px 12px 12px;border-radius:999px;background:#16161B;box-shadow:inset 0 0 0 2px #3A3A44;font:800 30px/1 Montserrat}
.kick b{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#FFC107;color:#111;font:800 26px/1 Montserrat}
h1{position:absolute;left:60px;right:60px;top:250px;text-align:center;font:800 76px/1.05 Montserrat;letter-spacing:-.025em}
h1 em{font-style:normal;color:#FFC107;text-shadow:0 0 26px rgba(255,193,7,.45)}
.sub{position:absolute;left:90px;right:90px;text-align:center;font:600 36px/1.35 Inter;color:#D9D9DE}
.dots{position:absolute;left:0;right:0;bottom:56px;display:flex;justify-content:center;gap:10px}
.dots i{width:40px;height:8px;border-radius:4px;background:rgba(255,255,255,.2)}
.dots i.on{background:#FFC107}
.swipe{position:absolute;right:60px;bottom:40px;font:800 28px/1 Montserrat;color:#FFC107}
.phn{position:absolute;left:300px;width:480px;height:720px;border-radius:64px;background:#0E0E12;box-shadow:inset 0 0 0 12px #2A2A33,0 0 0 4px #FFC107,0 0 80px rgba(255,193,7,.35),0 40px 80px -30px rgba(0,0,0,.9);overflow:hidden}
.phn .sc{position:absolute;inset:12px;border-radius:52px;background:#FFF8E1;padding:80px 26px 26px;color:#1F1F1F}
.phn .nt{position:absolute;left:50%;top:26px;width:120px;height:32px;margin-left:-60px;border-radius:20px;background:#000;z-index:2}
.hdr{display:flex;align-items:center;gap:12px;font:800 26px/1 Montserrat;margin-bottom:18px}
.hdr img{width:44px;height:44px;border-radius:12px}
.opt{display:flex;align-items:center;gap:16px;padding:18px;border-radius:20px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9;margin-bottom:14px;font:800 26px/1.1 Montserrat}
.opt i{flex:none;width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font-size:32px;font-style:normal}
.opt small{display:block;margin-top:4px;font:600 19px/1.2 Inter;color:#5C5C5C}
.opt.hot{box-shadow:inset 0 0 0 4px #FFC107}
.pgw{background:#fff;border-radius:10px;padding:22px;box-shadow:0 10px 24px -12px rgba(0,0,0,.35)}
.pgw .t{font:800 22px/1.2 Montserrat;text-align:center;margin-bottom:6px}
.pgw .ln{height:11px;border-radius:6px;background:#E3E3E3;margin:13px 0}
.place{position:relative;margin-top:16px;height:120px;border-radius:12px;outline:3px dashed #FFB300;background:rgba(255,193,7,.12)}
.place svg{position:absolute;left:8px;top:4px;width:300px;height:111px}
.asa{position:absolute;right:-14px;bottom:-14px;width:34px;height:34px;border-radius:50%;background:#FFC107;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.stamp{margin-top:6px;font:600 15px/1.2 ui-monospace,Menlo,monospace;color:#555}
.btn{margin-top:18px;padding:18px;border-radius:999px;background:#FFC107;text-align:center;font:800 26px/1 Montserrat;color:#1F1F1F}
.btn.dk{background:#1F1F1F;color:#fff}
.hand{position:absolute;font-size:110px;line-height:1;filter:drop-shadow(0 10px 20px rgba(0,0,0,.6))}
.list{position:absolute;left:80px;right:80px;display:grid;gap:22px}
.it{display:flex;align-items:center;gap:26px;padding:34px 32px;border-radius:32px;background:#16161B;box-shadow:inset 0 0 0 2px #2E2E36}
.it b{flex:none;display:grid;place-items:center;width:84px;height:84px;border-radius:50%;background:#FFC107;color:#111;font:800 44px/1 Montserrat}
.it p{font:800 38px/1.2 Montserrat}
.it small{display:block;margin-top:8px;font:600 27px/1.3 Inter;color:#BFBFC6}
.sigs{position:absolute;left:80px;right:80px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.sg{height:300px;border-radius:30px;background:#fff;color:#1F1F1F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;box-shadow:0 24px 50px -24px rgba(0,0,0,.8)}
.sg svg{width:100%;height:90px}
.sg span{font:800 30px/1 Montserrat}
.sg em{font:400 64px/1 "Liberation Serif","DejaVu Serif",serif;font-style:italic;color:#1B2A6B}
.lock{position:absolute;left:0;right:0;text-align:center}
.lock span{display:inline-flex;align-items:center;gap:16px;padding:20px 34px;border-radius:999px;background:#FFC107;color:#111;font:800 36px/1 Montserrat}
.row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9;margin-bottom:12px;font:800 23px/1.1 Montserrat}
.row small{display:block;margin-top:4px;font:600 17px/1.2 Inter;color:#5C5C5C}
.st{flex:none;padding:8px 14px;border-radius:999px;font:800 18px/1 Montserrat}
.ok{background:#DCFCE7;color:#166534}.wait{background:#FEF3C7;color:#8A6100}
.card2{position:absolute;top:470px;width:440px;height:330px;border-radius:44px;background:#16161B;box-shadow:inset 0 0 0 3px rgba(255,193,7,.45);text-align:center;padding-top:40px}
.card2 .n{font:800 190px/1 Montserrat;letter-spacing:-.04em;color:#FFC107;text-shadow:0 0 40px rgba(255,193,7,.45)}
.card2 .l{margin-top:14px;font:800 54px/1 Montserrat}
.qrb{position:absolute;left:390px;top:560px;width:300px;padding:20px 20px 14px;border-radius:30px;background:#fff;text-align:center}
.qrb img{width:100%;display:block}
.qrb b{display:block;margin-top:8px;font:800 21px/1.1 Montserrat;color:#1F1F1F;white-space:nowrap}
.legal{position:absolute;left:90px;right:90px;bottom:120px;text-align:center;font:600 24px/1.35 Inter;color:#8A8A94}
"""
LOGO = '../../assets/brand/pascal-sign-logo.webp'
def frame(i, body, swipe=True):
    dots = ''.join(f'<i class="{"on" if j == i else ""}"></i>' for j in range(1, N + 1))
    return (f'<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="glow"></div><div class="rays"></div>'
            f'<div class="top"><div class="br"><img src="{LOGO}" alt="">Pascal Sign</div><div class="pg">{i}/{N}</div></div>'
            f'{body}<div class="dots">{dots}</div>' + ('<div class="swipe">Desliza →</div>' if swipe else '') + '</body></html>')
def kick(n, t): return f'<p class="kick"><span><b>{n}</b>{t}</span></p>'
PHONE = lambda top, inner, h=720: f'<div class="phn" style="top:{top}px;height:{h}px"><div class="nt"></div><div class="sc">{inner}</div></div>'
HDR = f'<div class="hdr"><img src="{LOGO}" alt="">Pascal Sign</div>'
DOC = '<div class="pgw"><div class="t">CONTRATO</div><div class="ln"></div><div class="ln" style="width:75%"></div><div class="ln"></div><div class="ln" style="width:55%"></div>'

L = []
# 1 · gracias
L.append(frame(1, '<p class="kick" style="top:160px"><span style="padding:12px 26px">¡LLEGAMOS! 🎉</span></p>'
  '<h1 style="top:250px;font-size:88px">Gracias por<br><em>tu confianza</em></h1>'
  '<div class="card2" style="left:80px"><div class="n">514</div><div class="l">firmas</div></div>'
  '<div class="card2" style="left:560px"><div class="n">10</div><div class="l">usuarios</div></div>'
  '<p class="sub" style="top:850px">Cada firma es un documento que nos confiaste.</p>'
  '<p class="lock" style="top:1010px"><span>¿Aún no la usas? Así funciona 👉</span></p>'))
# 2 · 3 pasos
L.append(frame(2, '<h1 style="top:170px">Firma tus PDF<br>desde el <em>celular</em></h1>'
  '<div class="list" style="top:500px;gap:40px">'
  '<div class="it"><b>1</b><p>Abre el documento<small>PDF o Word, desde archivos, correo o WhatsApp</small></p></div>'
  '<div class="it"><b>2</b><p>Toca «Firmar»<small>y arrastra tu firma a su lugar</small></p></div>'
  '<div class="it"><b>3</b><p>Comparte o guarda<small>el PDF firmado, listo para enviar</small></p></div></div>'))
# 3 · paso 1
L.append(frame(3, kick(1, 'Abre el documento') + '<h1>Desde donde <em>te llegó</em></h1>'
  + PHONE(450, HDR + '<div class="opt hot"><i style="background:#FFC107">📄</i><div>Abrir documento<small>PDF o Word</small></div></div>'
  '<div class="opt"><i style="background:#DCFCE7">💬</i><div>WhatsApp</div></div><div class="opt"><i style="background:#E0E7FF">✉️</i><div>Correo</div></div>'
  '<div class="opt"><i style="background:#F3F4F6">📁</i><div>Archivos</div></div>')))
# 4 · paso 2
L.append(frame(4, kick(2, 'Firma') + '<h1>Arrastra tu firma<br>a <em>su lugar</em></h1>'
  + PHONE(470, HDR + DOC + f'<div class="place">{sig()}<div class="asa"></div></div><p class="stamp">Firmado electrónicamente · 2026-11-27 10:24</p></div>', 700)
  + '<p class="hand" style="left:690px;top:930px">👆</p>'))
# 5 · paso 3
L.append(frame(5, kick(3, 'Comparte') + '<h1>Listo para <em>enviar</em></h1>'
  + PHONE(450, HDR + DOC + f'<div style="margin-top:14px">{sig(style="width:280px;height:104px")}</div><p class="stamp">Firmado electrónicamente</p></div>'
  '<div class="btn">Compartir por WhatsApp</div><div class="btn dk">Guardar PDF</div>', 720)))
# 6 · mis firmas
L.append(frame(6, kick('✍️', 'Mis firmas') + '<h1>Crea tu firma <em>una vez</em></h1>'
  '<p class="sub" style="top:440px">Y la próxima vez firmas en dos toques.</p>'
  f'<div class="sigs" style="top:560px"><div class="sg">{sig()}<span>Dibujada</span></div>'
  '<div class="sg"><em>Ana R.</em><span>Escrita</span></div>'
  f'<div class="sg">{sig("#2B2B2B", 10)}<span>De una foto</span></div></div>'
  '<p class="lock" style="top:920px"><span>🔒 Cifradas, solo en tu celular</span></p>'
  '<p class="sub" style="top:1040px;font-size:30px">Puedes borrarlas cuando quieras.</p>'))
# 7 · pedir firma
L.append(frame(7, kick('🤝', 'Pedir firma') + '<h1>¿Necesitas la firma<br>de <em>otra persona</em>?</h1>'
  '<div class="list" style="top:470px;gap:18px">'
  '<div class="it" style="padding:22px 28px"><b>1</b><p style="font-size:32px">Toca en la hoja dónde debe firmar</p></div>'
  '<div class="it" style="padding:22px 28px"><b>2</b><p style="font-size:32px">Comparte el enlace por WhatsApp o correo</p></div>'
  '<div class="it" style="padding:22px 28px"><b>3</b><p style="font-size:32px">Firma desde su celular, sin instalar nada</p></div>'
  '<div class="it" style="padding:22px 28px"><b>4</b><p style="font-size:32px">Te avisamos y descargas el PDF firmado</p></div></div>'))
# 8 · mis solicitudes
L.append(frame(8, kick('📋', 'Mis solicitudes') + '<h1>Mira quién firmó<br>y <em>quién falta</em></h1>'
  + PHONE(470, HDR + '<div class="row"><div>Contrato de arriendo<small>2 de 2 firmas</small></div><span class="st ok">✓ Firmado</span></div>'
  '<div class="row"><div>Acta de entrega<small>1 de 2 firmas</small></div><span class="st wait">⏳ Falta 1</span></div>'
  '<div class="row"><div>Autorización<small>0 de 1 firmas</small></div><span class="st wait">⏳ Pendiente</span></div>'
  '<div class="btn dk" style="font-size:22px">Volver a compartir el enlace</div>', 680)))
# 9 · cierre
L.append(frame(9, '<h1 style="top:180px">Pruébalo <em>gratis</em><br>7 días</h1>'
  '<p class="sub" style="top:430px">Sin instalar nada: ábrela en el navegador o instálala como app.</p>'
  '<div class="qrb"><img src="../../assets/brand/qr-pascalsign.svg" alt=""><b>pascalia.lat/PascalSign</b></div>'
  '<p class="lock" style="top:1010px"><span style="font-size:30px">📤 Compártelo con quien aún imprime para firmar</span></p>'
  '<p class="legal">Firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012). No es firma digital certificada.</p>', swipe=False))

od = os.path.join(AQUI, 'laminas'); os.makedirs(od, exist_ok=True)
for i, h in enumerate(L, 1):
    open(os.path.join(od, f'{i:02d}.html'), 'w').write(h)
print(len(L), 'láminas')
