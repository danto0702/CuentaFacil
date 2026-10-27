# Pascal voice-over cloned with VoxCPM2 (local CPU, no denoiser). Usage: python vo_voxcpm.py <ref.wav> <out_dir> tools/vo_lines.txt
# Reference audio (owner's voice, with consent) is NOT committed. PT must be the exact transcript of the reference clip.
# Post: lines 01-06 get the spooky chain (rubberband pitch .82 tempo .97 + lowshelf + aecho), 07-11 the clean chain; see BRIEF.md.
import sys, time, soundfile as sf
from voxcpm import VoxCPM
REF = sys.argv[1]; OUT = sys.argv[2]; lines = sys.argv[3]
PT = "Se trata del oro francés que aquí tenemos, cuchicheó el director. Hemos recibido ya varias advertencias de que quizás se llevase a cabo una tentativa para robárnoslo."
m = VoxCPM.from_pretrained(sys.argv[4] if len(sys.argv) > 4 else "openbmb/VoxCPM2", load_denoiser=False, optimize=False, device="cpu")
sr = m.tts_model.sample_rate
for line in open(lines, encoding="utf8").read().strip().splitlines():
    n, t = line.split("|", 1)
    t0 = time.time()
    kw = dict(text=t, prompt_wav_path=REF, prompt_text=PT)
    try:
        wav = m.generate(reference_wav_path=REF, **kw)
    except (TypeError, ValueError):
        wav = m.generate(**kw)
    sf.write(f"{OUT}/vo-{n}.wav", wav, sr); print(n, round(len(wav) / sr, 2), "s in", round(time.time() - t0, 1), flush=True)
