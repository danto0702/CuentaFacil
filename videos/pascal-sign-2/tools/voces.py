# Voices for "El interrogatorio" with VoxCPM2: P = owner's cloned voice (consent given); D (detective) and C (contratista) are
# synthetic voices designed from a text description, then reused as references so each character sounds the same in every line.
# Usage: python voces.py <pascal_ref.wav> <out_dir> [ids...]
import sys, os, time, soundfile as sf
from voxcpm import VoxCPM
PREF, OUT = sys.argv[1:3]; ONLY = set(sys.argv[3:])
DESIGN = {
  'D': ('hombre colombiano de cincuenta y cinco años, voz grave, ronca y autoritaria, detective de película policíaca, habla despacio y con suspenso',
        'A ver, señor, siéntese. Aquí las preguntas las hago yo, ¿me entendió?'),
  'C': ('hombre colombiano de treinta años, voz nerviosa y un poco aguda, habla rápido y angustiado',
        '¡Le juro que yo no sé nada! Yo solo vine a entregar unos papeles.'),
}
PT = {'P': 'Se trata del oro francés que aquí tenemos, cuchicheó el director. Hemos recibido ya varias advertencias de que quizás se llevase a cabo una tentativa para robárnoslo.'}
REF = {'P': PREF}
m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu")
sr = m.tts_model.sample_rate
for who, (ctrl, text) in DESIGN.items():
    path = os.path.join(OUT, f'ref-{who}.wav')
    if not os.path.exists(path):
        sf.write(path, m.generate(text=f'({ctrl}){text}'), sr)
    REF[who] = path; PT[who] = text
for line in open(os.path.join(os.path.dirname(__file__), 'lineas.txt'), encoding='utf8').read().strip().splitlines():
    n, who, tts, _ = line.split('|')
    if ONLY and n not in ONLY: continue
    t0 = time.time()
    wav = m.generate(text=tts, prompt_wav_path=REF[who], prompt_text=PT[who], reference_wav_path=REF[who])
    sf.write(os.path.join(OUT, f'{n}.wav'), wav, sr); print(n, who, round(len(wav) / sr, 2), 's in', round(time.time() - t0, 1), flush=True)
