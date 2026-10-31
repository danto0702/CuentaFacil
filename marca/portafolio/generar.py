# Generates portafolio.html (A4, PascalIA identity) and prints it to PascalIA-portafolio.pdf with Playwright.
import os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.join(HERE, '..', 'kit-marca-pascalia')
SPRITE = open(os.path.join(KIT, 'iconos', 'iconos.svg')).read()
ICON = {m[1]: m[2] for m in re.finditer(r'<symbol id="([^"]+)" viewBox="0 0 24 24">(.*?)</symbol>', SPRITE, re.S)}
def ic(n, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICON[n]}</svg>'

def page(cls, inner, n=None):
    foot = (f'<footer class="pf"><span><img src="img/flor.svg" alt=""><em style="font-style:normal">Pascal<b>IA</b> · Ideas que hacen florecer tu organización</em></span><span>{n}</span></footer>' if n else '')
    return f'<section class="page {cls}">{inner}{foot}</section>'

def head(eyebrow, title):
    return f'<p class="eyebrow">{eyebrow}</p><h2 class="h2">{title}</h2>'

def product(logo, name, tag, desc, feats, who):
    if logo.startswith('icon:'):
        lg = f'<div class="plogo y">{ic(logo[5:])}</div>'
    elif logo == 'flor':
        lg = '<div class="plogo w"><img src="img/flor.svg" alt=""></div>'
    else:
        lg = f'<img class="plogo img" src="img/{logo}" alt="">'
    li = ''.join(f'<li>{f}</li>' for f in feats)
    return (f'<article class="prod">{lg}<div><h3>{name}</h3><p class="tag">{tag}</p><p class="desc">{desc}</p>'
            f'<ul class="checks">{li}</ul><p class="who">{ic("people", "ic sm")}{who}</p></div></article>')

pages = []
# 1 · Portada
pages.append(page('cover', f'''
<img class="cover-flor" src="img/flor.svg" alt="">
<div class="cover-in">
  <img class="cover-logo" src="img/logo-horizontal.svg" alt="PascalIA">
  <h1 class="display">Ideas que hacen <span class="mk">florecer</span> tu organización</h1>
  <p class="lead">Consultoría, desarrollo y capacitación en tecnología e inteligencia artificial, a la medida.</p>
  <p class="cover-tag">Portafolio de servicios y soluciones · 2026</p>
</div>
<img class="cover-pascal" src="img/pascal-senala.webp" alt="">
<div class="cover-band">Conocimiento · Tecnología · Personas · Resultados</div>
'''))
# 2 · Quiénes somos
pages.append(page('', f'''
{head('Quiénes somos', 'Pascal + <span class="mk">IA</span>')}
<p class="lead" style="margin-top:6mm">PascalIA es una empresa colombiana que crea soluciones de tecnología e inteligencia artificial a la medida para organizaciones y personas. Hablas directamente con quien construye la solución: soluciones que funcionan pronto y se adaptan a cada cliente.</p>
<div class="two">
  <div class="blaise-card"><img src="img/blaise-pascal.webp" alt="Blaise Pascal y la Pascalina"></div>
  <div>
    <p class="eyebrow">El origen del nombre</p>
    <h3 class="h3">Blaise Pascal (1623–1662)</h3>
    <p>Matemático, físico, inventor y filósofo: un <b>polímata</b> que conectó muchas disciplinas para resolver problemas complejos.</p>
    <div class="fact">{ic('sparkle')}<p><b>La Pascalina.</b> A los 19 años inventó una de las primeras calculadoras mecánicas de la historia para aliviar el trabajo de su padre, que pasaba noches sumando impuestos. Eso hacemos: herramientas que le quitan a las personas la carga operativa.</p></div>
    <div class="fact">{ic('brain')}<p><b>La polimatía.</b> Miramos cada problema desde varios ángulos (procesos, datos y personas) para entregar soluciones completas.</p></div>
  </div>
</div>
<div class="objetivo">
  <p class="eyebrow on-dark">Nuestro objetivo</p>
  <p class="obj">Llevar la tecnología y la inteligencia artificial a organizaciones y personas, para quitarles el trabajo pesado y dejarles tiempo para lo que importa: <span class="y">empresas que evolucionan, personas que florecen.</span></p>
</div>
''', 2))
# 3 · Símbolo, color y valores
SW = [('#FFC107', 'Amarillo PascalIA', 'Acción, energía, claridad', '#1F1F1F'), ('#1F1F1F', 'Grafito', 'Solidez y resultados', '#fff'), ('#FFF8E1', 'Crema', 'Calidez y cercanía', '#1F1F1F'), ('#E9E9E9', 'Gris claro', 'Orden y aire', '#1F1F1F')]
sw = ''.join(f'<div class="sw"><div style="background:{c};color:{t}">{c}</div><b>{n}</b><span>{d}</span></div>' for c, n, d, t in SW)
VAL = [('target', 'Innovación con propósito', 'Tecnología que resuelve algo real.'), ('heart', 'Soluciones humanas', 'Pensadas para quien las usa.'), ('sprout', 'Crecimiento sostenible', 'Que dure y que escale.'), ('book', 'Conocimiento sin límites', 'Lo que sabemos, lo compartimos.')]
val = ''.join(f'<div class="val"><div class="tile">{ic(i)}</div><b>{n}</b><span>{d}</span></div>' for i, n, d in VAL)
pages.append(page('', f'''
{head('Identidad', 'La flor de <span class="mk">PascalIA</span>')}
<div class="two" style="align-items:center;margin-top:6mm">
  <div class="flor-box"><img src="img/flor.svg" alt=""></div>
  <div>
    <p>Una flor es crecimiento, ramificación y florecimiento. Sus <b>seis pétalos</b> están unidos por venas que terminan en <b>nodos</b>, como una red neuronal: la naturaleza orgánica y las conexiones de la inteligencia artificial en un solo símbolo.</p>
    <p style="margin-top:4mm">Representa cómo la tecnología bien implementada hace <b>florecer</b> el potencial de una organización.</p>
    <p style="margin-top:4mm">El <b>amarillo</b> nos diferencia en un sector saturado de azul y negro: transmite energía, optimismo e innovación, y le quita el miedo al cambio a los equipos que aprenden.</p>
  </div>
</div>
<div class="logos">
  <div class="lg-l"><img src="img/logo-horizontal.svg" alt=""></div>
  <div class="lg-d"><img src="img/logo-horizontal-blanco.svg" alt=""></div>
</div>
<div class="sws">{sw}</div>
<p class="eyebrow" style="margin-top:8mm">Nuestros valores</p>
<div class="vals">{val}</div>
''', 3))
# 4 · Servicios
SERV = [
 ('compass', 'Consultoría', 'El Pensamiento Pascal', 'Analiza · Conecta · Transforma',
  'Diagnóstico de procesos y transformación digital. Encontramos los cuellos de botella cruzando procesos, datos y personas, y conectamos cada problema con la herramienta o la IA que lo puede resolver o automatizar.',
  ['Diagnóstico de procesos', 'Transformación digital', 'Hoja de ruta de automatización con IA']),
 ('code', 'Desarrollo', 'La Ingeniería Pascalia', 'Automatiza · Integra · Escala',
  'Construimos soluciones a la medida, integradas en portales digitales unificados, eficientes y exactos.',
  ['Chatbots y asistentes de WhatsApp con IA', 'Dashboards e indicadores', 'Creación y automatización de documentos', 'Apps de campo, CRM y sistemas de reservas', 'Tecnologías QR y NFC en los procesos']),
 ('sprout', 'Capacitación', 'El Florecimiento', 'Aprende · Aplica · Florece',
  'Formación presencial y virtual en herramientas de IA para empresarios, empleados, personal de oficina y cualquier persona que quiera aplicarlas en su trabajo, para que la tecnología se adopte con éxito y sin resistencia.',
  ['Presencial y virtual', 'Talleres prácticos', 'Empresas y público general']),
]
serv = ''.join(f'''<article class="serv"><div class="tile y big">{ic(i)}</div><div><p class="eyebrow">{c}</p><h3>{n}</h3><p class="lema">{l}</p><p>{d}</p>
<ul class="checks">{"".join(f"<li>{x}</li>" for x in b)}</ul></div></article>''' for i, n, c, l, d, b in SERV)
pages.append(page('', f'''
{head('Servicios', 'Tres formas de <span class="mk">crecer</span> contigo')}
<p class="lead" style="margin-top:4mm">Analizamos, desarrollamos y capacitamos, para que tu organización florezca.</p>
<div class="servs">{serv}</div>
''', 4))
# 5-6 · Productos
P1 = [
 product('flor', 'MesaViva', 'Tu restaurante, completo', 'Software para restaurantes que une la venta, la cocina y la experiencia del cliente.', ['POS y factura electrónica', 'Carta QR y pedidos por WhatsApp', 'Mesas, meseros y cocina', 'Mesa NFC y pago por persona', 'Domicilios y CRM'], 'Restaurantes y cadenas'),
 product('cuentafacil-logo.webp', 'CuentaFácil', 'Tu cuenta de cobro, por WhatsApp', 'Pascal acompaña a los contratistas por WhatsApp: cada día le cuentan lo que hicieron y al cierre reciben el informe y la cuenta de cobro listos para revisar y firmar.', ['Reporte diario con texto, foto o nota de voz', 'Actividades organizadas por obligación', 'Informe, cuenta de cobro y soportes', 'El contratista revisa y firma: Pascal nunca inventa'], 'Contratistas de prestación de servicios'),
 product('fanatikos-img-fanatikos-360.webp', 'Fanátikos', 'Tu campeonato, como en las ligas grandes', 'Gestión completa de campeonatos de fútbol aficionado y red para la hinchada.', ['Inscripción de equipos, árbitros y jugadores', 'Planilla del árbitro en el celular y acta en PDF firmada', 'Directores: jugadores, multas, sanciones y reclamaciones', 'Tabla en vivo, estadísticas y afiches para redes con patrocinadores'], 'Organizadores de campeonatos y ligas'),
 product('flota-logo.webp', 'Flota', 'Tus vehículos, al día desde el celular', 'Itinerario digital de vehículos y conductores para cualquier empresa con flota.', ['Salidas y llegadas con GPS y foto', 'Funciona sin señal', 'Checklist del vehículo', 'Planilla de tiempos lista para firma'], 'Empresas con flota de vehículos'),
]
P2 = [
 product('nana-dnt-logo.png', 'NANA DNT', 'Seguimiento nutricional infantil', 'Seguimiento nominal del riesgo y la desnutrición aguda en menores de 5 años para IPS de primer nivel.', ['Caso por caso', 'Menores de 5 años', 'Conforme a la normativa vigente del sector'], 'Sector salud: IPS, ESE y secretarías'),
 product('icon:web', 'Páginas web', 'Tu página, desde cero', 'Hacemos cualquier tipo de página web y nos especializamos en menús digitales. Visitamos al cliente, entendemos qué vende y qué necesita, y la implementamos.', ['Adquisición del dominio', 'Diseño a la medida', 'Mantenimiento', 'Menús digitales'], 'Comercios, restaurantes y empresas'),
 product('icon:nfc', 'Tecnología NFC', 'Acerca el celular y listo', 'Analizamos las necesidades del negocio e implementamos NFC: una tecnología rápida y atractiva para los clientes.', ['Carta y pedidos al instante', 'Promociones y fidelización', 'Integración con los procesos del negocio'], 'Comercios y restaurantes'),
 product('icon:target', 'Gamificación', 'Tu marca, convertida en juego', 'Llevamos dinámicas de juego a tu marca para hacerla más dinámica y que tus clientes vuelvan.', ['Retos', 'Puntos', 'Premios'], 'Marcas y comercios'),
]
pages.append(page('', f'''{head('Soluciones listas', 'Lo que tenemos <span class="mk">para ti</span>')}<div class="prods">{''.join(P1)}</div>''', 5))
pages.append(page('', f'''<div class="prods" style="margin-top:4mm">{''.join(P2)}</div>''', 6))
# 7 · Pascal y cómo trabajamos
STEPS = [('Conversamos', 'Nos cuentas qué te quita tiempo.'), ('Proponemos', 'Una solución con alcance claro.'), ('Construimos contigo', 'Avances cortos que puedes probar.'), ('Acompañamos', 'Capacitamos a tu equipo y seguimos cerca.')]
st = ''.join(f'<li><span><b>{a}.</b> {b}</span></li>' for a, b in STEPS)
pages.append(page('', f'''
{head('Pascal', 'Tu asistente <span class="mk">de confianza</span>')}
<div class="two" style="align-items:center;margin-top:4mm">
  <div class="pascal-box"><img src="img/pascal-celular.webp" alt="Pascal"></div>
  <div>
    <p>Pascal es la cara de PascalIA: el asistente que atiende por WhatsApp, organiza la información y redacta borradores, siempre con revisión humana.</p>
    <div class="fact">{ic('shield')}<p><b>La IA asiste, las personas deciden.</b> Todo borrador o sugerencia termina en revisión y aprobación de una persona.</p></div>
    <div class="fact">{ic('lock')}<p><b>Respeto por los datos.</b> La información se trata conforme a nuestra Política de tratamiento de datos.</p></div>
    <p class="eyebrow" style="margin-top:7mm">Cómo trabajamos</p>
    <ol class="steps">{st}</ol>
  </div>
</div>
''', 7))
# 8 · Contacto
pages.append(page('contact', f'''
<img class="contact-flor" src="img/flor.svg" alt="">
<div class="contact-in">
  <img src="img/logo-horizontal-blanco.svg" alt="PascalIA" style="width:120mm">
  <h2 class="h2" style="color:#fff;margin-top:12mm">Tu próxima idea puede <span class="y">florecer</span> este mes</h2>
  <p style="color:#D6D6D6;font-size:13pt;margin-top:5mm">Cuéntanos qué quieres resolver.</p>
  <div class="qr-row">
    <div class="qr"><img src="img/qr-whatsapp.svg" alt="QR de WhatsApp"></div>
    <div>
      <p class="c-l">{ic('whatsapp', 'ic w')}WhatsApp</p><p class="c-n">312 388 5012</p>
      <p class="c-l">{ic('web', 'ic w')}Sitio web</p><p class="c-v">pascalia.lat</p>
      <p class="c-l">{ic('chat', 'ic w')}Correo</p><p class="c-v">contacto@pascalia.lat</p>
    </div>
  </div>
</div>
<img class="contact-pascal" src="img/pascal-explica.webp" alt="">
'''))

CSS = '''
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#fff}
body{font:400 11pt/1.55 "Inter",sans-serif;color:#1F1F1F;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:210mm;height:297mm;padding:18mm 17mm 20mm;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
p{margin:0}
.eyebrow{font:700 8.5pt/1 "Montserrat",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8A6100;margin-bottom:3mm}
.eyebrow.on-dark{color:#FFC107}
.h2{font:800 30pt/1.08 "Montserrat",sans-serif;letter-spacing:-.02em;margin:0}
.h3{font:800 17pt/1.15 "Montserrat",sans-serif;margin:0 0 3mm}
.display{font:800 38pt/1.04 "Montserrat",sans-serif;letter-spacing:-.025em;margin:10mm 0 0;max-width:150mm}
.lead{font-size:13pt;color:#5C5C5C;max-width:165mm}
.mk{background:linear-gradient(transparent 58%,#FFC107 58%,#FFC107 90%,transparent 90%);padding:0 .06em}
.y{color:#FFC107}
.ic{width:100%;height:100%;fill:none;stroke:#1F1F1F;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round}
.ic.sm{width:4.4mm;height:4.4mm;flex:none}
.ic.w{stroke:#FFC107;width:5mm;height:5mm}
.tile{width:13mm;height:13mm;padding:3mm;border-radius:4mm;background:#FFF8E1;box-shadow:inset 0 0 0 .3mm #F3E7BE;flex:none}
.tile.y{background:#FFC107;box-shadow:none}
.tile.big{width:18mm;height:18mm;padding:4mm;border-radius:5mm}
.two{display:grid;grid-template-columns:72mm 1fr;gap:9mm;margin-top:8mm}
.fact{display:flex;gap:3mm;align-items:flex-start;margin-top:4mm;padding:3.5mm 4mm;border-radius:4mm;background:#FFF8E1;box-shadow:inset 0 0 0 .3mm #F3E7BE;font-size:10pt}
.fact .ic{width:5mm;height:5mm;flex:none;margin-top:.6mm;stroke:#8A6100}
.checks{list-style:none;margin:3mm 0 0;padding:0;display:grid;gap:1.6mm;font-size:9.5pt}
.checks li{position:relative;padding-left:6mm}
.checks li::before{content:"";position:absolute;left:0;top:.9mm;width:3.8mm;height:3.8mm;border-radius:50%;background:#FFC107 no-repeat center/2.6mm url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231F1F1F' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E")}
.pf{position:absolute;left:17mm;right:17mm;bottom:9mm;display:flex;justify-content:space-between;font:600 7.5pt/1 "Montserrat",sans-serif;color:#5C5C5C;border-top:.3mm solid #E9E9E9;padding-top:3mm}
.pf span{display:flex;align-items:center;gap:2mm}
.pf img{width:4mm;height:4mm}
.pf b{color:#8A6100}
/* cover */
.cover{background:radial-gradient(70% 45% at 50% 8%,rgba(255,193,7,.22),transparent 70%),linear-gradient(180deg,#FFF8E1,#FFFDF5 60%,#fff);padding-top:26mm}
.cover-flor{position:absolute;width:190mm;right:-50mm;top:30mm;opacity:.13}
.cover-logo{width:95mm}
.cover-in{position:relative}
.cover-in .lead{margin-top:7mm;max-width:118mm}
.cover-tag{margin-top:10mm;display:inline-block;padding:3mm 6mm;border-radius:99mm;background:#1F1F1F;color:#fff;font:700 10pt/1 "Montserrat",sans-serif}
.cover-pascal{position:absolute;right:16mm;bottom:22mm;height:150mm;filter:drop-shadow(0 6mm 8mm rgba(31,31,31,.25))}
.cover-band{position:absolute;left:0;right:0;bottom:0;padding:6mm 17mm;background:#FFC107;font:800 12pt/1 "Montserrat",sans-serif;letter-spacing:.02em}
/* about */
.blaise-card{height:96mm;border-radius:6mm;background:radial-gradient(circle at 50% 40%,#F6E7C6,#E2C796);box-shadow:inset 0 0 0 1.6mm #8B5A2B;display:grid;place-items:end center;overflow:hidden}
.blaise-card img{width:66mm;filter:sepia(.3)}
.objetivo{margin-top:9mm;padding:8mm 9mm;border-radius:6mm;background:#1F1F1F;color:#fff}
.obj{font:700 14pt/1.35 "Montserrat",sans-serif}
/* identity */
.flor-box{height:72mm;border-radius:6mm;background:#FFF8E1;display:grid;place-items:center;box-shadow:inset 0 0 0 .3mm #F3E7BE}
.flor-box img{width:56mm}
.logos{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:8mm}
.logos div{height:30mm;border-radius:5mm;display:grid;place-items:center}
.logos img{height:13mm}
.lg-l{background:#fff;box-shadow:inset 0 0 0 .3mm #E9E9E9}
.lg-d{background:#1F1F1F}
.sws{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:5mm}
.sw div{height:17mm;border-radius:4mm;display:flex;align-items:flex-end;padding:2mm 3mm;font:700 8pt/1 "Montserrat",sans-serif;box-shadow:inset 0 0 0 .3mm #E9E9E9}
.sw b{display:block;margin-top:2mm;font:700 9pt/1.2 "Montserrat",sans-serif}
.sw span{font-size:8.5pt;color:#5C5C5C}
.vals{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
.val{padding:4mm;border-radius:4mm;box-shadow:inset 0 0 0 .3mm #E9E9E9}
.val .tile{margin-bottom:3mm}
.val b{display:block;font:700 9.5pt/1.2 "Montserrat",sans-serif}
.val span{font-size:8.5pt;color:#5C5C5C}
/* services */
.servs{display:grid;gap:5mm;margin-top:7mm}
.serv{display:grid;grid-template-columns:18mm 1fr;gap:6mm;padding:6mm;border-radius:6mm;box-shadow:inset 0 0 0 .3mm #E9E9E9,0 2mm 6mm rgba(31,31,31,.06);font-size:10pt}
.serv h3{font:800 18pt/1.1 "Montserrat",sans-serif;margin:0}
.serv .lema{font:700 10pt/1.3 "Montserrat",sans-serif;color:#5C5C5C;margin:1.5mm 0 2.5mm}
.serv .checks{grid-template-columns:1fr 1fr;column-gap:5mm}
/* products */
.prods{display:grid;gap:3.6mm;margin-top:5mm}
.prod{display:grid;grid-template-columns:22mm 1fr;gap:5mm;padding:4.6mm 5mm;border-radius:6mm;box-shadow:inset 0 0 0 .3mm #E9E9E9,0 2mm 6mm rgba(31,31,31,.06)}
.plogo{width:22mm;height:22mm;border-radius:5.5mm}
.plogo.img{object-fit:cover;box-shadow:0 1.5mm 4mm rgba(31,31,31,.18)}
.plogo.y{background:#FFC107;padding:5mm}
.plogo.w{background:#FFF8E1;padding:4mm;box-shadow:inset 0 0 0 .3mm #F3E7BE}
.plogo.w img{width:100%;height:100%}
.prod h3{font:800 16pt/1.1 "Montserrat",sans-serif;margin:0}
.prod .tag{font:700 10pt/1.3 "Montserrat",sans-serif;color:#8A6100;margin-top:1mm}
.prod .desc{font-size:9.2pt;line-height:1.45;margin-top:1.5mm}
.prod .checks{grid-template-columns:1fr 1fr;column-gap:5mm;row-gap:1.2mm;font-size:8.7pt;margin-top:2.2mm}
.prod .who{display:flex;align-items:center;gap:2mm;margin-top:2.4mm;font:600 8.5pt/1 "Montserrat",sans-serif;color:#5C5C5C}
/* pascal */
.pascal-box{height:150mm;border-radius:6mm;background:radial-gradient(circle at 50% 30%,#FFE9A8,#FFF8E1 70%);display:grid;place-items:end center;overflow:hidden}
.pascal-box img{height:140mm}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:3mm;counter-reset:s;font-size:10pt}
.steps li{counter-increment:s;display:grid;grid-template-columns:8mm 1fr;align-items:start;gap:3mm}
.steps li::before{content:counter(s);width:8mm;height:8mm;border-radius:50%;background:#FFC107;display:grid;place-items:center;font:800 9pt/1 "Montserrat",sans-serif}
/* contact */
.contact{background:#1F1F1F;color:#fff;padding-top:30mm}
.contact-flor{position:absolute;width:170mm;right:-40mm;top:-30mm;opacity:.12}
.contact-in{position:relative}
.qr-row{display:flex;gap:9mm;align-items:center;margin-top:14mm}
.qr{width:52mm;height:52mm;padding:5mm;border-radius:6mm;background:#fff}
.qr img{width:100%;height:100%}
.c-l{display:flex;align-items:center;gap:2.5mm;font:700 9pt/1 "Montserrat",sans-serif;color:#CFCFCF;margin-top:4mm}
.c-l:first-child{margin-top:0}
.c-n{font:800 26pt/1.1 "Montserrat",sans-serif;letter-spacing:-.02em;margin-top:1.5mm}
.c-v{font:700 14pt/1.2 "Montserrat",sans-serif;margin-top:1.5mm;color:#FFC107}
.contact-pascal{position:absolute;right:12mm;bottom:0;height:120mm}
'''
html = f'''<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><title>PascalIA · Portafolio 2026</title>
<link rel="stylesheet" href="../kit-marca-pascalia/css/fuentes.css"><style>{CSS}</style></head><body>{''.join(pages)}</body></html>'''
open(os.path.join(HERE, 'portafolio.html'), 'w').write(html)
js = f'''const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://{os.path.join(HERE, 'portafolio.html')}', {{ waitUntil: 'networkidle' }}); await p.evaluate(() => document.fonts.ready);
await p.pdf({{ path: '{os.path.join(HERE, 'PascalIA-portafolio.pdf')}', format: 'A4', printBackground: true, preferCSSPageSize: true }});
await b.close(); }})();'''
subprocess.run(['node', '-e', js], check=True)
print('ok')
