# Original soundtrack for "¿En qué etapa estás?": punchy 120 BPM beat with a whoosh on every stage, a riser into the meteor, the impact, then a bright WhatsApp-green groove. Writes assets/audio/music.wav (bed ducked under the voice + SFX bus).
import numpy as np, wave, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
S = T['start']; DUR = round(S[-1] + T['dur'][-1], 3)
SR = 44100; N = int(SR * DUR); BPM = 120; BEAT = 60 / BPM
rng = np.random.default_rng(47)
L = np.zeros(N); R = np.zeros(N)
SL = np.zeros(N); SR_ = np.zeros(N)  # SFX bus (not ducked)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)
def env(n, a, d):  # attack (s), exponential decay time constant (s)
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def lowpass(x, k):  # moving-average smoothing (cheap low-pass)
    return np.convolve(x, np.ones(k) / k, mode='same')
def onepole(x, fc, passes=2):  # smooth IIR low-pass without side lobes
    a = np.exp(-2 * np.pi * fc / SR); y = np.asarray(x, float)
    for _ in range(passes):
        out = np.empty_like(y); acc = 0.0
        for i, v in enumerate(y):
            acc = (1 - a) * v + a * acc; out[i] = acc
        y = out
    return y
def pluck(m, dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.25*np.sin(2*np.pi*4*f*t)*np.exp(-t/0.05) + 0.12*np.sin(2*np.pi*2*f*t)
    return s * env(n, 0.004, 0.28)
def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-0.06, 0.06):
            f = hz(m + det)
            for h, a in ((1, 1), (2, .35), (3, .15), (4, .07)):
                s += a * np.sin(2*np.pi*f*h*t + rng.uniform(0, 6.28))
    fade = np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.6)
    return s * fade / (len(ms) * 2)
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t / 0.03)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.002, 0.11)
def hat():
    n = int(0.08 * SR); x = rng.standard_normal(n)
    x = onepole(x - onepole(x, 6000, 1), 12000, 1)
    return x * env(n, 0.001, 0.02)
def pop(m):
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + 0.5 * np.exp(-t / 0.012))
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.002, 0.06)
def bell(m, dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m); s = np.zeros(n)
    for r, a, d in ((1, 1, 1.2), (2.0, .4, .7), (3.01, .2, .4), (4.2, .12, .25)):
        s += a * np.sin(2*np.pi*f*r*t) * np.exp(-t/d)
    return s * np.minimum(1, t / 0.003)
def whoosh(dur, rise=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = onepole(rng.standard_normal(n), 900)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return x / np.max(np.abs(x)) * e

def tick(hi=True):
    n = int(0.03 * SR); x = rng.standard_normal(n)
    x = onepole(x - onepole(x, 1800 if hi else 900, 1), 5000, 2)
    return x * env(n, 0.0005, 0.008)
def noise_hit(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return onepole(rng.standard_normal(n), 3000) * np.exp(-t / (dur / 3))


def sfx(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    SL[i:j] += s * np.sqrt((1 - pan) / 2); SR_[i:j] += s * np.sqrt((1 + pan) / 2)
def tick(hi=True):
    n = int(0.03 * SR); x = rng.standard_normal(n)
    x = onepole(x - onepole(x, 1800 if hi else 900, 1), 5000, 2)
    return x * env(n, 0.0005, 0.008)
def noise_hit(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return onepole(rng.standard_normal(n), 3000) * np.exp(-t / (dur / 3))


def marimba(m, dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*4*f*t)*np.exp(-t/0.03) + 0.15*np.sin(2*np.pi*10*f*t)*np.exp(-t/0.01)
    return s * env(n, 0.002, 0.22)
def drum(lo=True):
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = (90 if lo else 160) * (1 + 0.8 * np.exp(-t / 0.02))
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.002, 0.09 if lo else 0.06)
def shaker():
    n = int(0.06 * SR); x = rng.standard_normal(n)
    x = x - onepole(x, 4000, 1)
    return x * env(n, 0.004, 0.015)
def bird(t0, base=2600):
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = base * (1 + 0.25 * np.sin(2 * np.pi * 18 * t)) * (1 + 0.3 * t / 0.18)
    sfx(np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.01, 0.06), t0, 0.035, pan=0.6)
def boom(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    lo = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t / 0.15)) / SR) * np.exp(-t / 0.8)
    x = onepole(rng.standard_normal(n), 400) * np.exp(-t / 0.5)
    return lo + x / np.max(np.abs(x)) * 0.6


def clap():
    n = int(0.12 * SR); x = rng.standard_normal(n)
    x = onepole(x - onepole(x, 900, 1), 6000, 1)
    e = np.zeros(n)
    for d in (0, 0.011, 0.022): e[int(d * SR):] += np.exp(-np.arange(n - int(d * SR)) / SR / 0.02)
    return x * e / 3
def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 200 * 2 ** (3 * t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + onepole(rng.standard_normal(n), 2500) * 0.6
    return s * (t / dur) ** 2

ST = S[1]; STEP = 2.0; MET = S[1] + 5 * STEP; WH = S[2]
CHM = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]   # Am F G Em (tension), then bright
CHB = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]   # C G Am F
HOOK = [69, 72, 76, 72, 74, 72, 69, 67]
def bar_at(t0, ch, bright):
    add(pad(ch, 4 * BEAT + 0.3), t0, 0.12 if bright else 0.10)
    add(pad([ch[0] - 12], 4 * BEAT), t0, 0.22)
    for k in range(4):
        add(kick(), t0 + k * BEAT, 0.34)
        if k % 2: add(clap(), t0 + k * BEAT, 0.20, pan=0.1)
        add(hat(), t0 + k * BEAT + BEAT / 2, 0.06, pan=0.4)
    if bright:
        for k in range(8): add(marimba(HOOK[k] + 12, 0.5), t0 + k * BEAT / 2, 0.10, pan=-0.2 if k % 2 else 0.2)
t0 = 0.0; c = 0
while t0 < MET - 0.05:
    bar_at(t0, CHM[c % 4], False); t0 += 4 * BEAT; c += 1
t0 = WH - 0.05; c = 0
while t0 < DUR - 2.0:
    bar_at(t0, CHB[c % 4], True); t0 += 4 * BEAT; c += 1
add(pad([60, 64, 67, 72], 2.4), DUR - 2.4, 0.18); add(bell(84, 2.4), DUR - 2.4, 0.08)
sfx(kick(), 0.85, 0.5); sfx(noise_hit(0.4), 0.85, 0.12)                       # "etapa 4" punch
for i in range(5):
    sfx(whoosh(0.45), ST + i * STEP - 0.3, 0.16, pan=-0.5)                       # stage swipe
    sfx(pop(72 + i * 2), ST + i * STEP + 0.1, 0.10)
sfx(riser(1.6), MET - 0.2, 0.20); sfx(kick(), MET + 1.65, 0.7); sfx(noise_hit(1.2), MET + 1.65, 0.3)
for i, d in enumerate((0.8, 1.45, 2.1)): sfx(pop(84 + (i % 2) * 3), WH + d, 0.12)  # chat bubbles
for k in range(6): sfx(pop(76 + k * 2), S[3] + 0.4 + k * 0.07, 0.07)             # lineup numbers
sfx(bell(88, 1.6), S[3] + 1.0, 0.09)
for k in range(6): sfx(pop(72 + k * 2), S[4] + 0.25 + k * 0.07, 0.07)
# ---- duck the music bed under the voice ----
g = np.ones(N); ramp = int(0.15 * SR)
for s0, d in T['vo']:
    a = int(s0 * SR); z = min(N, int((s0 + d + 0.1) * SR))
    g[a:z] = 0.42
g = np.convolve(g, np.ones(ramp) / ramp, mode="same")
L *= g; R *= g; L += SL; R += SR_
# Small room reverb (FFT convolution with a decaying noise tail)
ir_n = int(1.6 * SR); t = np.arange(ir_n) / SR
for ch in (L, R):
    ir = lowpass(rng.standard_normal(ir_n), 3) * np.exp(-t / 0.35); ir[0] = 0
    wet = np.fft.irfft(np.fft.rfft(ch, 2 * N) * np.fft.rfft(ir, 2 * N))[:N]
    ch += wet * 0.035
mix = np.stack([L, R], 1)
mix[:int(0.02*SR)] *= np.linspace(0, 1, int(0.02*SR))[:, None]
fo = int(1.0 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.1) / np.tanh(1.1) * 0.89
with wave.open('assets/audio/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', mix.shape)
