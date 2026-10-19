# Pascal voice-over with a cloned voice (Chatterbox multilingual, MIT, local CPU; output carries the Perth watermark).
# Usage: python vo_clone.py <reference.wav> [line ids]  — reference audio is NOT committed; needs consent of the speaker.
# Lines come from tools/vo.sh; seeds that passed a Whisper check: 7 (all) and 11 for lines 06 and 08.
import torch, torchaudio as ta, sys
REF = sys.argv.pop(1)
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
import os; torch.manual_seed(int(os.environ.get("SEED","7")))
m=ChatterboxMultilingualTTS.from_pretrained(device="cpu")
L=dict(l.split("|",1) for l in open("tools/vo_lines.txt",encoding="utf8").read().strip().splitlines())
for n,t in L.items():
    if len(sys.argv)>1 and n not in sys.argv[1:]: continue
    w=m.generate(t,language_id="es",audio_prompt_path=REF,exaggeration=0.5,cfg_weight=0.5,temperature=0.7)
    ta.save(f"assets/audio/vo/raw-{n}.wav",w,m.sr); print(n,w.shape[-1]/m.sr,flush=True)
