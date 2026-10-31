# Original background music for the series "Explícaselo a la abuela": a warm, light groove per episode with pops on every
# beat change, sparkles on the product cards and a closing bell. Usage: python music.py ep1|ep2|ep3 → assets/audio/music-<ep>.wav
import numpy as np, wave, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPI = sys.argv[1]
T = json.load(open(os.path.join(ROOT, 'tools', f'timing-{EPI}.json')))
DUR = T['total']; S = [b['start'] for b in T['beats']]
SR = 44100; N = int(SR * DUR); BPM = 104; BEAT = 60 / BPM
rng = np.random.default_rng({'ep1': 11, 'ep2': 12, 'ep3': 13}[EPI])
L = np.zeros(N); R = np.zeros(N)
SL = np.zeros(N); SR_ = np.zeros(N)
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

def organ(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 5.5 * t)
    for m in ms:
        f = hz(m)
        for h, a in ((1, 1), (2, .5), (3, .3), (4, .18), (6, .08), (8, .05)):
            s += a * np.sin(2 * np.pi * f * h * t)
    fade = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.25)
    return s * trem * fade / (len(ms) * 2.2)
def pizz(m, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.04) + 0.2*np.sin(2*np.pi*3*f*t)*np.exp(-t/0.02)
    return s * env(n, 0.003, 0.12)
def theremin(notes, t0):
    # notes: list of (midi, beats); continuous glide with vibrato
    total = sum(b for _, b in notes) * BEAT; n = int(total * SR)
    f = np.zeros(n); i = 0
    for m, b in notes:
        k = int(b * BEAT * SR); f[i:i + k] = hz(m); i += k
    f = onepole(f, 6, 1)
    t = np.arange(n) / SR
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    s *= np.minimum(1, t / 0.2) * np.minimum(1, (total - t) / 0.4)
    add(s, t0, 0.10, pan=0.25)
def thunder(dur=2.6):
    n = int(dur * SR); t = np.arange(n) / SR
    x = onepole(rng.standard_normal(n), 180)
    crack = onepole(rng.standard_normal(n), 2500) * np.exp(-t / 0.08)
    e = np.minimum(1, t / 0.02) * np.exp(-t / 0.9) * (1 + 0.5 * np.sin(2 * np.pi * 3 * t))
    x = x / np.max(np.abs(x)) * e + crack / np.max(np.abs(crack)) * 0.5
    return x
def boing(m=55, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + 0.6 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.2))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.18)
def sparkle(t0, base=84, n=8, step=0.05, gain=0.07):
    for k in range(n): sfx(bell(base + [0, 4, 7, 12, 16, 19, 24, 28][k % 8], 1.2), t0 + k * step, gain, pan=-0.5 + k / n)


def groove(t0, end, shift=0, kick_gain=0.34):
    CH = [[53, 57, 60, 64], [58, 62, 65, 69], [55, 58, 62, 65], [60, 64, 67, 70]]
    ARP = [[65, 69, 72, 77], [65, 70, 74, 77], [62, 67, 70, 74], [64, 67, 72, 76]]
    BASS = [41, 46, 43, 48]
    bar = 4 * BEAT; c = 0
    while t0 < end - 0.2:
        add(pad([m + shift for m in CH[c % 4]], bar + 0.4), t0, 0.18); add(pad([BASS[c % 4] + shift], bar), t0, 0.22)
        for k in range(8):
            tt = t0 + k * BEAT / 2
            if tt >= end: break
            add(pluck(ARP[c % 4][[0, 1, 2, 3, 2, 1, 3, 2][k]] + shift, 0.7), tt, 0.13 if k % 2 == 0 else 0.09, pan=-0.3 if k % 2 else 0.3)
            add(pizz(BASS[c % 4] + shift + (12 if k % 2 else 0)), tt, 0.16)
        for k in (0, 2):
            if t0 + k * BEAT < end: add(kick(), t0 + k * BEAT, kick_gain)
        for k in range(4):
            if t0 + k * BEAT + BEAT / 2 < end: add(hat(), t0 + k * BEAT + BEAT / 2, 0.05, pan=0.4)
        t0 += bar; c += 1


SHIFT = {'ep1': 0, 'ep2': 2, 'ep3': -2}[EPI]
END = DUR - 2.0
groove(0.15, END, shift=SHIFT, kick_gain=0.22)
add(pad([m + SHIFT for m in (53, 57, 60, 65)], DUR - END), END, 0.2); add(pad([41 + SHIFT], DUR - END), END, 0.24); add(bell(89 + SHIFT, 3.0), END, 0.07)
for k, s in enumerate(S[1:]):
    sfx(whoosh(0.45), s - 0.2, 0.05, pan=(-1) ** k * 0.4); sfx(pop(79 + (k % 3) * 2 + SHIFT), s + 0.05, 0.09)
if EPI == 'ep3':
    for s in S[1:-1]: sparkle(s + 0.15, 88 + SHIFT, 5, 0.05, 0.05)
sparkle(S[-1] + 0.2, 86 + SHIFT, 8, 0.05, 0.07)
g = np.ones(N); ramp = int(0.15 * SR)
for b in T['beats']:
    for _, s0, d in b['lines']:
        a = int(s0 * SR); z = min(N, int((s0 + d + 0.1) * SR)); g[a:z] = 0.34
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
with wave.open(os.path.join(ROOT, 'assets', 'audio', f'music-{EPI}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', mix.shape)
