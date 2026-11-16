# Voces de los videos con Fish Audio (TTS en la nube), clonando al instante la voz del dueño (consentimiento dado).
# Las referencias son clips ya publicados de la voz del dueño (REFS); no se crea ningún modelo en la cuenta.
# La clave de la API la inyecta el proxy de la sesión (secreto de red para api.fish.audio): aquí va un marcador.
# Uso: python voces_fish.py <proyecto> <carpeta_salida> [ids...]   — lee <proyecto>/tools/lineas.txt (id|P|texto_tts|texto_visible)
# Requiere: pip install httpx ormsgpack
import os, sys, time, httpx, ormsgpack
AQUI = os.path.dirname(os.path.abspath(__file__))
REFS = [
    ("../referidos-pascal/assets/audio/vo/r02.wav", "Ahí queda un punto muerto: la entrega se acaba, la relación se enfría, y te toca volver a buscar clientes fríos desde cero."),
    ("../referidos-pascal/assets/audio/vo/r05.wav", "Dos: dale un trofeo. Un antes y después de su resultado. La gente no recomienda para ayudarte a ti: recomienda porque queda bien frente a sus contactos."),
]
proyecto, salida = sys.argv[1], sys.argv[2]; solo = set(sys.argv[3:])
os.makedirs(salida, exist_ok=True)
refs = [{"audio": open(os.path.join(AQUI, a), "rb").read(), "text": t} for a, t in REFS]
for fila in open(os.path.join(proyecto, "tools", "lineas.txt"), encoding="utf8").read().strip().splitlines():
    n, quien, tts, _ = fila.split("|")
    if solo and n not in solo: continue
    t0 = time.time()
    cuerpo = {"text": tts, "format": "wav", "normalize": True, "latency": "normal", "references": refs}
    r = httpx.post("https://api.fish.audio/v1/tts", content=ormsgpack.packb(cuerpo), timeout=300,
                   headers={"Authorization": "Bearer proxy-injected", "content-type": "application/msgpack", "model": "s1"})
    if r.status_code != 200:
        print(n, "ERROR", r.status_code, r.text[:200], flush=True); continue
    open(os.path.join(salida, f"{n}.wav"), "wb").write(r.content)
    print(n, "ok", round(time.time() - t0, 1), "s", flush=True)
