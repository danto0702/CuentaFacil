# Writes index.html: scene hosts + voice-over + music. Timings in tools/timing.json.
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
names = ['01-medianoche', '02-terrores', '03-gracias', '04-cuentas', '05-noviembre', '06-asistente', '07-cierre']
total = round(T['start'][-1] + T['dur'][-1], 3)
rows = []
for i, n in enumerate(names):
    cid = 'f' + n.replace('-', '-', 1)
    cid = f'f{n[:2]}-{n[3:]}'
    rows.append(f'      <div id="{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{n}.html" data-start="{T["start"][i]}" data-duration="{T["dur"][i]}" data-track-index="1" data-width="1080" data-height="1920"></div>')
for i, (s, d) in enumerate(T.get('vo', [])):
    rows.append(f'      <audio id="vo-{i+1:02d}" src="assets/audio/vo/vo-{i+1:02d}.wav" data-start="{s}" data-duration="{d}" data-track-index="3" data-volume="1"></audio>')
if os.path.exists(os.path.join(ROOT, 'assets', 'audio', 'music.wav')):
    rows.append(f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{total}" data-track-index="4" data-volume="0.6"></audio>')
html = f'''<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #120820; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1080" data-height="1920">
{chr(10).join(rows)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w').write(html)
print('total', total)
