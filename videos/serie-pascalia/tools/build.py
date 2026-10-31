# Builds the three HyperFrames projects of the series "Explícaselo a la abuela" (ep1, ep2, ep3).
# Each beat is a sub-composition: porch background, a brand panel with the explanation, the grandma (left), Pascal (right)
# and speech-bubble captions timed to the voice lines. Timings come from the processed voice files (assets/audio/vo/).
import os, re, json, math, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, 'assets', 'audio', 'vo')
LINES = {}
for row in open(os.path.join(ROOT, 'tools', 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, _, shown = row.split('|')
    LINES[n] = (who, shown)

def dur(n):
    p = os.path.join(VO, f'{n}.wav')
    if os.path.exists(p):
        return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
    return max(1.2, len(LINES[n][1]) / 15)  # placeholder until the voice exists

# ---------- icons (brand sprite, stroke 1.85) ----------
SPRITE = open(os.path.join(os.path.dirname(ROOT), '..', 'marca', 'kit-marca-pascalia', 'iconos', 'iconos.svg')).read()
ICON = {m[1]: m[2] for m in re.finditer(r'<symbol id="([^"]+)" viewBox="0 0 24 24">(.*?)</symbol>', SPRITE, re.S)}
def icon(name, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICON[name]}</svg>'

FONTS = '''
@font-face{font-family:"Montserrat";font-weight:700;src:url("assets/fonts/montserrat-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:"Montserrat";font-weight:800;src:url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-weight:500;src:url("assets/fonts/inter-latin-500-normal.woff2") format("woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url("assets/fonts/inter-latin-600-normal.woff2") format("woff2")}
'''
CSS = '''
#root{background:#2A1A10;color:#1F1F1F;font-family:"Inter",sans-serif}
.abs{position:absolute}
.bg{position:absolute;inset:0;background:url("assets/brand/corredor.webp") center/cover}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(31,20,10,.55) 0%,rgba(31,20,10,.12) 22%,rgba(31,20,10,0) 45%,rgba(31,20,10,.18) 100%)}
.chip{position:absolute;left:50%;top:118px;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:14px 28px 14px 16px;border-radius:999px;background:#1F1F1F;color:#fff;font:700 32px/1 "Montserrat",sans-serif;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.chip img{width:44px;height:44px}
.chip b{color:#FFC107;font-weight:800}
.panel{position:absolute;left:50px;top:226px;width:980px;height:556px;border-radius:40px;background:#FFF8E1;box-shadow:inset 0 0 0 3px #F3E7BE,0 30px 60px -24px rgba(31,20,10,.6);overflow:hidden}
.panel .in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
.mh{font-family:"Montserrat",sans-serif;font-weight:800;letter-spacing:-.02em;line-height:1.06;color:#1F1F1F}
.mk{background:linear-gradient(transparent 58%,#FFC107 58%,#FFC107 90%,transparent 90%);padding:0 .06em}
.sub{font:600 36px/1.3 "Inter",sans-serif;color:#5C5C5C;margin-top:18px}
.ic{width:100%;height:100%;fill:none;stroke:#1F1F1F;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round}
.tile{display:grid;place-items:center;border-radius:28px;background:#fff;box-shadow:inset 0 0 0 2px #F3E7BE,0 10px 26px rgba(31,31,31,.10)}
.tile.y{background:#FFC107;box-shadow:none}
.pill{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9;font:600 30px/1 "Inter",sans-serif;color:#1F1F1F}
.pill i{width:12px;height:12px;border-radius:50%;background:#FFC107}
.char{position:absolute;bottom:20px;filter:drop-shadow(0 26px 30px rgba(31,20,10,.45));opacity:0}
.bub{position:absolute;max-width:640px;padding:22px 30px;border-radius:30px;font:700 40px/1.22 "Montserrat",sans-serif;letter-spacing:-.01em;opacity:0;box-shadow:0 16px 34px -12px rgba(31,20,10,.55)}
.bub.A{left:40px;bottom:900px;background:#fff;color:#1F1F1F;box-shadow:inset 0 0 0 4px #D9A21B,0 16px 34px -12px rgba(31,20,10,.55);border-bottom-left-radius:8px}
.bub.P{right:40px;bottom:980px;background:#FFC107;color:#1F1F1F;border-bottom-right-radius:8px}
.bub small{display:block;font:800 22px/1 "Montserrat",sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;opacity:.65}
'''

def page(cid, css, body, js):
    return f'''<!doctype html>
<html lang="es-CO">
<head><meta charset="UTF-8" /></head>
<body>
<template>
<style>
{FONTS}
#root{{position:absolute;inset:0;overflow:hidden}}
{CSS}
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

# ---------- characters ----------
A_H, P_H = 860, 940
SIZE = {}
from PIL import Image
for f in os.listdir(os.path.join(ROOT, 'assets', 'chars')):
    if f.endswith('.webp'):
        w, h = Image.open(os.path.join(ROOT, 'assets', 'chars', f)).size; SIZE[f[:-5]] = w / h

# ---------- inserts (panel content) ----------
def ins_title(lines, sub=''):
    t = '<br>'.join(lines)
    return f'<div class="in"><h2 class="mh it" style="font-size:96px">{t}</h2>{f"<p class=\'sub it\'>{sub}</p>" if sub else ""}</div>'

def ins_logo():
    return ('<div class="in"><img class="it" src="assets/brand/flower.svg" style="width:230px;height:230px" alt="">'
            '<h2 class="mh it" style="font-size:118px;margin-top:10px">Pascal<span style="color:#E0A800">IA</span></h2>'
            '<p class="sub it">Tecnología e inteligencia artificial</p></div>')

def ins_blaise():
    return ('<div class="in" style="flex-direction:row;gap:36px;justify-content:flex-start;padding:30px 44px">'
            '<div class="it" style="flex:none;width:380px;height:490px;border-radius:24px;background:radial-gradient(circle at 50% 40%,#F6E7C6,#E2C796);box-shadow:inset 0 0 0 8px #8B5A2B;overflow:hidden;display:grid;place-items:end center">'
            '<img src="assets/chars/blaise-pascal.webp" style="width:360px;filter:sepia(.35)" alt=""></div>'
            '<div style="text-align:left"><p class="it" style="font:800 30px/1 Montserrat,sans-serif;color:#8A6100;letter-spacing:.08em">1642 · 19 AÑOS</p>'
            '<h2 class="mh it" style="font-size:76px;margin-top:14px">Blaise<br>Pascal</h2>'
            '<p class="sub it" style="font-size:34px">Inventó la <b style="color:#1F1F1F">Pascalina</b>, una de las primeras calculadoras</p></div></div>')

def ins_icons(items, head):
    tiles = ''.join(f'<div class="it" style="display:grid;justify-items:center;gap:14px"><div class="tile y" style="width:150px;height:150px;padding:34px">{icon(i)}</div><b style="font:700 32px/1.1 Montserrat,sans-serif">{l}</b></div>' for i, l in items)
    return f'<div class="in"><h2 class="mh it" style="font-size:76px;margin-bottom:44px">{head}</h2><div style="display:flex;gap:56px">{tiles}</div></div>'

def ins_flower(text):
    return (f'<div class="in"><img class="it flor" src="assets/brand/flower.svg" style="width:300px;height:300px" alt="">'
            f'<h2 class="mh it" style="font-size:62px;margin-top:22px">{text}</h2></div>')

def contact_strip():
    return ('<div class="it" style="display:flex;align-items:center;gap:26px;margin-top:30px">'
            '<div style="width:190px;height:190px;padding:14px;border-radius:24px;background:#fff;box-shadow:inset 0 0 0 2px #E9E9E9"><img src="assets/brand/qr-whatsapp.svg" style="width:100%;height:100%" alt=""></div>'
            f'<div style="text-align:left"><p style="display:flex;align-items:center;gap:12px;font:700 32px/1 Montserrat,sans-serif;color:#5C5C5C"><span style="width:40px;height:40px;display:inline-block">{icon("whatsapp")}</span>Escríbenos</p>'
            '<p style="font:800 68px/1.05 Montserrat,sans-serif;letter-spacing:-.02em;margin-top:10px">312 388 5012</p>'
            '<p style="font:700 32px/1 Montserrat,sans-serif;color:#8A6100;margin-top:10px">pascalia.lat</p></div></div>')

def ins_next(title):
    return (f'<div class="in"><p class="it" style="font:800 28px/1 Montserrat,sans-serif;letter-spacing:.1em;color:#8A6100">PRÓXIMO EPISODIO</p>'
            f'<h2 class="mh it" style="font-size:70px;margin-top:14px">{title}</h2>{contact_strip()}</div>')

def ins_contact():
    return ('<div class="in"><div class="it" style="display:flex;align-items:center;gap:18px"><img src="assets/brand/flower.svg" style="width:96px;height:96px" alt="">'
            '<span class="mh" style="font-size:84px">Pascal<span style="color:#E0A800">IA</span></span></div>'
            f'<p class="sub it" style="margin-top:8px">Ideas que hacen florecer tu organización</p>{contact_strip()}</div>')

def ins_three(active=None):
    items = [('compass', 'Consultoría', 'Analiza · Conecta · Transforma'), ('code', 'Desarrollo', 'Automatiza · Integra · Escala'), ('sprout', 'Capacitación', 'Aprende · Aplica · Florece')]
    cards = ''.join(f'<div class="it" style="width:280px;padding:30px 20px;border-radius:30px;background:#fff;box-shadow:inset 0 0 0 2px #F3E7BE,0 12px 30px rgba(31,31,31,.1)">'
                    f'<div class="tile y" style="width:120px;height:120px;padding:28px;margin:0 auto 18px">{icon(ic)}</div>'
                    f'<b style="display:block;font:800 38px/1.1 Montserrat,sans-serif">{n}</b><span style="display:block;margin-top:10px;font:600 24px/1.3 Inter,sans-serif;color:#5C5C5C">{l}</span></div>' for ic, n, l in items)
    return f'<div class="in"><div style="display:flex;gap:26px">{cards}</div></div>'

def ins_service(ic, n, name, lema, chips):
    ch = ''.join(f'<span class="pill it"><i></i>{c}</span>' for c in chips)
    return (f'<div class="in"><div class="it" style="display:flex;align-items:center;gap:28px"><div class="tile y" style="width:150px;height:150px;padding:34px">{icon(ic)}</div>'
            f'<div style="text-align:left"><p style="font:800 26px/1 Montserrat,sans-serif;letter-spacing:.1em;color:#8A6100">{n}</p><h2 class="mh" style="font-size:86px;margin-top:8px">{name}</h2></div></div>'
            f'<p class="sub it" style="font-size:38px">{lema}</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:26px;max-width:880px">{ch}</div></div>')

def ins_grid(items, head):
    tiles = ''.join(f'<div class="it" style="display:grid;justify-items:center;gap:10px;width:200px"><div class="tile" style="width:112px;height:112px;padding:26px">{icon(i)}</div><b style="font:700 26px/1.15 Montserrat,sans-serif">{l}</b></div>' for i, l in items)
    return f'<div class="in"><h2 class="mh it" style="font-size:58px;margin-bottom:28px">{head}</h2><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:22px 18px;max-width:900px">{tiles}</div></div>'

def ins_product(logo, name, tag, chips):
    if logo.startswith('icon:'):
        lg = f'<div class="tile y" style="width:190px;height:190px;padding:44px">{icon(logo[5:])}</div>'
    elif logo == 'mesaviva':
        lg = '<div class="tile" style="width:190px;height:190px;padding:30px"><img src="assets/brand/flower.svg" style="width:100%;height:100%" alt=""></div>'
    else:
        lg = f'<img src="assets/brand/{logo}" style="width:190px;height:190px;border-radius:40px;box-shadow:0 12px 30px rgba(31,31,31,.18)" alt="">'
    ch = ''.join(f'<span class="pill it"><i></i>{c}</span>' for c in chips)
    return (f'<div class="in"><div class="it" style="display:flex;align-items:center;gap:30px">{lg}'
            f'<div style="text-align:left"><h2 class="mh" style="font-size:80px">{name}</h2><p class="sub" style="margin-top:10px;font-size:34px;max-width:560px">{tag}</p></div></div>'
            f'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:34px;max-width:900px">{ch}</div></div>')

# ---------- episodes ----------
EP = {
 'ep1': dict(title='¿Y eso qué es, mijo?', beats=[
    dict(ins=ins_title(['¿Eso', 'se <span class="mk">come</span>?']), lines=[('e1-01', 'tinto', 'explica')]),
    dict(ins=ins_logo(), lines=[('e1-02', 'tinto', 'explica')]),
    dict(ins=ins_title(['¿Y por qué', '<span class="mk">Pascal</span>?']), lines=[('e1-03', 'tinto', 'explica')]),
    dict(ins=ins_blaise(), lines=[('e1-04', 'tinto', 'explica'), ('e1-05', 'asombro', 'explica')]),
    dict(ins=ins_icons([('chat', 'WhatsApp'), ('doc', 'Documentos'), ('chart', 'Tableros')], 'Menos carga, <span class="mk">más tiempo</span>'), lines=[('e1-06', 'risa', 'explica')]),
    dict(ins=ins_flower('Empresas que evolucionan,<br>personas que <span class="mk">florecen</span>'), lines=[('e1-07', 'tinto', 'explica'), ('e1-08', 'tinto', 'tres')]),
    dict(ins=ins_title(['¿Y eso a mí', 'en qué me <span class="mk">sirve</span>?']), lines=[('e1-09', 'risa', 'explica')]),
    dict(ins=ins_next('Ep. 2 · ¿Y usted a qué<br>se <span class="mk">dedica</span>?'), lines=[('e1-10', 'guino', 'senala')], tail=3.2),
 ]),
 'ep2': dict(title='¿Y usted a qué se dedica?', beats=[
    dict(ins=ins_title(['Este aparato', 'me tiene <span class="mk">loca</span>']), lines=[('e2-01', 'celular', 'explica')]),
    dict(ins=ins_three(), lines=[('e2-02', 'tinto', 'tres')]),
    dict(ins=ins_service('compass', 'EL PENSAMIENTO PASCAL', 'Consultoría', 'Analiza · Conecta · Transforma', ['Diagnóstico de procesos', 'Transformación digital', 'Qué automatizar con IA']),
         lines=[('e2-03', 'tinto', 'lupa'), ('e2-04', 'risa', 'lupa'), ('e2-05', 'risa', 'explica')]),
    dict(ins=ins_grid([('whatsapp', 'WhatsApp con IA'), ('chart', 'Tableros'), ('doc', 'Documentos automáticos'), ('pin', 'Apps de campo'), ('calendar', 'Reservas'), ('qr', 'Códigos QR'), ('nfc', 'NFC')], 'Desarrollo <span class="mk">a la medida</span>'),
         lines=[('e2-06', 'asombro', 'explica')]),
    dict(ins=ins_title(['¿Brujería?', '¡Es <span class="mk">IA</span>!']), lines=[('e2-07', 'asombro', 'explica'), ('e2-08', 'tinto', 'explica')]),
    dict(ins=ins_service('sprout', 'EL FLORECIMIENTO', 'Capacitación', 'Aprende · Aplica · Florece', ['Empresarios', 'Empleados', 'Cualquier persona', 'Presencial o virtual']),
         lines=[('e2-09', 'tinto', 'explica')]),
    dict(ins=ins_flower('Analizamos · Desarrollamos ·<br><span class="mk">Capacitamos</span>'), lines=[('e2-10', 'risa', 'explica'), ('e2-11', 'guino', 'senala')]),
    dict(ins=ins_next('Ep. 3 · Muéstreme<br>lo que <span class="mk">tiene</span>'), lines=[('e2-12', 'tinto', 'explica'), ('e2-13', 'guino', 'maletin')], tail=3.2),
 ]),
 'ep3': dict(title='Muéstreme lo que tiene', beats=[
    dict(ins=ins_title(['¿Qué hay en', 'el <span class="mk">maletín</span>?']), lines=[('e3-01', 'tinto', 'maletin')]),
    dict(ins=ins_product('mesaviva', 'MesaViva', 'Tu restaurante, completo', ['Mesas y cocina', 'Domicilios', 'Factura electrónica', 'Pago por persona']), lines=[('e3-02', 'tinto', 'explica'), ('e3-03', 'risa', 'explica')]),
    dict(ins=ins_product('cuentafacil-logo.webp', 'CuentaFácil', 'Tu cuenta de cobro, por WhatsApp', ['Reporte diario', 'Soportes en orden', 'Cuenta lista']), lines=[('e3-04', 'tinto', 'celular'), ('e3-05', 'guino', 'celular')]),
    dict(ins=ins_product('fanatikos-img-fanatikos-360.webp', 'Fanátikos', 'Tu campeonato, como en las ligas grandes', ['Inscripciones', 'Planilla del árbitro', 'Tabla en vivo', 'Afiches']), lines=[('e3-06', 'tinto', 'explica'), ('e3-07', 'risa', 'explica')]),
    dict(ins=ins_product('flota-logo.webp', 'Flota', 'Tus vehículos, al día desde el celular', ['Salidas y llegadas', 'GPS y foto', 'Funciona sin señal']), lines=[('e3-08', 'tinto', 'senala'), ('e3-09', 'asombro', 'senala')]),
    dict(ins=ins_product('nana-dnt-logo.png', 'NANA DNT', 'Seguimiento nutricional infantil', ['Sector salud', 'Caso por caso', 'Menores de 5 años']), lines=[('e3-10', 'tinto', 'explica'), ('e3-11', 'asombro', 'explica')]),
    dict(ins=ins_product('icon:web', 'Páginas web', 'Tu página, desde cero', ['Dominio', 'Diseño', 'Mantenimiento', 'Menús digitales']), lines=[('e3-12', 'tinto', 'explica'), ('e3-13', 'celular', 'explica')]),
    dict(ins=ins_product('icon:nfc', 'NFC', 'Acerca el celular y listo', ['Carta', 'Pedidos', 'Promociones']), lines=[('e3-14', 'celular', 'celular'), ('e3-15', 'nfc', 'celular')]),
    dict(ins=ins_product('icon:target', 'Gamificación', 'Tu marca, convertida en juego', ['Retos', 'Puntos', 'Premios']), lines=[('e3-16', 'tinto', 'explica'), ('e3-17', 'risa', 'explica')]),
    dict(ins=ins_contact(), lines=[('e3-18', 'tinto', 'senala'), ('e3-19', 'guino', 'senala')], tail=2.4),
 ]),
}

HEAD, GAP, TAIL = 0.35, 0.3, 0.55

def chunks(text, limit=56):
    words = text.split(); out = []; cur = ''
    for w in words:
        if cur and len(cur) + 1 + len(w) > limit:
            out.append(cur); cur = w
        else:
            cur = (cur + ' ' + w).strip()
        if re.search(r'[.!?…:,]$', w) and len(cur) > limit * 0.5:
            out.append(cur); cur = ''
    if cur: out.append(cur)
    return out

def beat_html(ep, i, b, D, lt):
    cid = f'b{i+1:02d}'
    poses_a = sorted({l[1] for l in b['lines']}); poses_p = sorted({l[2] for l in b['lines']})
    imgs = ''.join(f'<img id="{cid}-a-{p}" class="char" src="assets/chars/abuela-{p}.webp" style="left:20px;height:{A_H}px" alt="">' for p in poses_a)
    imgs += ''.join(f'<img id="{cid}-p-{p}" class="char" src="assets/chars/pascal-{p}.webp" style="right:24px;height:{P_H}px" alt="">' for p in poses_p)
    bubs = ''; js = ''
    js += f'tl.from("#{cid}-panel",{{scale:.88,opacity:0,y:30,duration:.4,ease:"back.out(1.6)"}},0);\n'
    js += f'tl.from("#{cid}-panel .it",{{opacity:0,y:34,duration:.38,ease:"power3.out",stagger:.09}},0.18);\n'
    js += f'tl.to("#{cid}-panel .flor",{{rotation:60,duration:{D:.2f},ease:"none"}},0);\n' if 'class="it flor"' in b['ins'] else ''
    # character poses: first pose visible from 0, swap at each line start
    cur = {'a': None, 'p': None}
    for k, (n, pa, pp) in enumerate(b['lines']):
        t0 = 0 if k == 0 else lt[k][0]
        for side, pose in (('a', pa), ('p', pp)):
            if cur[side] != pose:
                if cur[side]: js += f'tl.set("#{cid}-{side}-{cur[side]}",{{opacity:0}},{t0:.2f});\n'
                js += f'tl.set("#{cid}-{side}-{pose}",{{opacity:1}},{t0:.2f});\n'
                cur[side] = pose
    for k, (n, pa, pp) in enumerate(b['lines']):
        who, shown = LINES[n]; s, d = lt[k]
        sp = f'#{cid}-{"a" if who == "A" else "p"}-{pa if who == "A" else pp}'
        js += f'tl.to("{sp}",{{y:-16,duration:.16,yoyo:true,repeat:1,ease:"sine.out"}},{s:.2f});\n'
        parts = chunks(shown); total = sum(len(p) for p in parts); t = s
        for j, part in enumerate(parts):
            pd = d * len(part) / total
            bid = f'{cid}-c{k}{j}'
            label = 'Abuela' if who == 'A' else 'Pascal'
            bubs += f'<div id="{bid}" class="bub {who}"><small>{label}</small>{part}</div>'
            js += f'tl.set("#{bid}",{{opacity:1}},{t:.2f});\n'
            if j == 0: js += f'tl.from("#{bid}",{{scale:.8,transformOrigin:"{"0% 100%" if who == "A" else "100% 100%"}",duration:.18,ease:"back.out(2.5)",immediateRender:false}},{t:.2f});\n'
            end = t + pd if (j < len(parts) - 1 or k < len(b['lines']) - 1) else min(D - .05, t + pd + .5)
            js += f'tl.set("#{bid}",{{opacity:0}},{end:.2f});\n'
            t += pd
    # gentle idle sway of both characters (finite, fits the beat)
    reps = max(1, int((D - .3) / 1.4) - 1)
    js += f'tl.to(".char",{{rotation:.8,transformOrigin:"50% 100%",duration:1.4,yoyo:true,repeat:{reps},ease:"sine.inOut"}},0.2);\n'
    body = (f'<div class="bg"></div><div class="veil"></div>'
            f'<div class="chip"><img src="assets/brand/flower.svg" alt=""><span>Pascal<b>IA</b> · {EPN[ep]}</span></div>'
            f'<div id="{cid}-panel" class="panel">{b["ins"]}</div>{imgs}{bubs}')
    return cid, page(cid, '', body, js)

EPN = {'ep1': 'Ep. 1', 'ep2': 'Ep. 2', 'ep3': 'Ep. 3'}

def build(ep):
    out = os.path.join(ROOT, ep); fr = os.path.join(out, 'compositions', 'frames'); os.makedirs(fr, exist_ok=True)
    # project files: assets are hard-linked from the shared folder
    a = os.path.join(out, 'assets')
    if os.path.exists(a): shutil.rmtree(a)
    subprocess.run(['cp', '-al', os.path.join(ROOT, 'assets'), a], check=True)
    shutil.rmtree(os.path.join(a, 'src'), ignore_errors=True)
    for f in ('package.json', 'hyperframes.json', 'CLAUDE.md', 'AGENTS.md', '.gitignore'):
        src = os.path.join(ROOT, 'tools', 'project', f)
        if os.path.exists(src): shutil.copy(src, out)
    json.dump({'id': f'pascalia-{ep}', 'name': f'pascalia-{ep}', 'createdAt': '2026-10-31T00:00:00.000Z'}, open(os.path.join(out, 'meta.json'), 'w'))
    t = 0.0; rows = []; vo = []; timing = []
    for i, b in enumerate(EP[ep]['beats']):
        lt = []; c = HEAD
        for n, *_ in b['lines']:
            d = dur(n); lt.append((round(c, 2), round(d, 2))); c += d + GAP
        D = round(c - GAP + b.get('tail', TAIL), 2)
        cid, html = beat_html(ep, i, b, D, lt)
        open(os.path.join(fr, f'{cid}.html'), 'w').write(html)
        rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{cid}.html" data-start="{t:.2f}" data-duration="{D:.2f}" data-track-index="1" data-width="1080" data-height="1920"></div>')
        for (n, *_), (s, d) in zip(b['lines'], lt):
            vo.append((n, round(t + s, 2), d))
        timing.append({'start': round(t, 2), 'dur': D, 'lines': [[n, round(t + s, 2), d] for (n, *_), (s, d) in zip(b['lines'], lt)]})
        t = round(t + D, 2)
    for n, s, d in vo:
        if os.path.exists(os.path.join(VO, f'{n}.wav')):
            rows.append(f'      <audio id="vo-{n}" src="assets/audio/vo/{n}.wav" data-start="{s}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
    if os.path.exists(os.path.join(a, 'audio', f'music-{ep}.wav')):
        rows.append(f'      <audio id="music" src="assets/audio/music-{ep}.wav" data-start="0" data-duration="{t}" data-track-index="4" data-volume="0.5"></audio>')
    json.dump({'total': t, 'beats': timing}, open(os.path.join(ROOT, 'tools', f'timing-{ep}.json'), 'w'), indent=1)
    html = f'''<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #2A1A10; }}
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
'''
    open(os.path.join(out, 'index.html'), 'w').write(html)
    print(ep, 'total', t, 'beats', len(EP[ep]['beats']))

if __name__ == '__main__':
    import sys
    for ep in (sys.argv[1:] or EP):
        build(ep)
