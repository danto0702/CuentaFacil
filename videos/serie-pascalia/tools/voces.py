# Generates every dialogue line with VoxCPM2: P = owner's cloned voice (consent given), A = designed synthetic grandma voice.
# Usage: python voces.py <pascal_ref.wav> <abuela_ref.wav> <out_dir> [ids...]   (reference audio is not committed)
import sys, os, time, soundfile as sf
from voxcpm import VoxCPM
PREF, AREF, OUT = sys.argv[1:4]; ONLY = set(sys.argv[4:])
PT = {"P": "Se trata del oro francés que aquí tenemos, cuchicheó el director. Hemos recibido ya varias advertencias de que quizás se llevase a cabo una tentativa para robárnoslo.",
      "A": "¡Ay, mijo, venga pa'cá! ¿Y eso de PascalIA qué es? ¿Eso se come o qué?"}
REF = {"P": PREF, "A": AREF}
m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu")
sr = m.tts_model.sample_rate
for line in open(os.path.join(os.path.dirname(__file__), "lineas.txt"), encoding="utf8").read().strip().splitlines():
    n, who, tts, _ = line.split("|")
    if ONLY and n not in ONLY: continue
    t0 = time.time()
    wav = m.generate(text=tts, prompt_wav_path=REF[who], prompt_text=PT[who], reference_wav_path=REF[who])
    sf.write(os.path.join(OUT, f"{n}.wav"), wav, sr); print(n, who, round(len(wav) / sr, 2), "s in", round(time.time() - t0, 1), flush=True)
