# Original soundtrack for "CuentaFacil · antes y después": tense D minor ticking (antes), then warm F major groove (después). 96 BPM. Writes assets/audio/music.wav (bed ducked under the voice + SFX).
import numpy as np, wave
SR = 44100; DUR = 49.2; N = int(SR * DUR); BEAT = 60 / 96
rng = np.random.default_rng(7)
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
S = [0, 4.5, 11.7, 16.7, 25.7, 31.7, 37.2, 42.7]
CUT = 11.7
# ---- ANTES (0 – 11.7): drone + accelerating clock ----
add(pad([38, 45, 50], CUT + 0.3), 0, 0.30); add(pad([62, 65], CUT + 0.3), 0, 0.09)
t = 0.0
while t < CUT - 0.2:
    rate = BEAT if t < 4.5 else (BEAT / 2 if t < 9 else BEAT / 4)
    add(tick(int(round(t / rate)) % 2 == 0), t, 0.06, pan=0.3); t += rate
for k in range(8): sfx(kick(), S[1] + 0.15 + k * 0.32, 0.22)                 # windows land
sfx(kick(), S[1] + 4.3, 0.75); sfx(noise_hit(0.5), S[1] + 4.3, 0.16)       # DEVUELTA stamp
sfx(whoosh(0.5), CUT - 0.45, 0.10)
# ---- DESPUÉS (11.7 – end): F major groove ----
CH = [[53,57,60,64],[57,60,64,67],[58,62,65,69],[60,64,67,71]]
ARP = [[65,69,72,76],[64,69,72,76],[65,70,74,77],[64,67,72,74]]
BASS = [41,45,46,48]
bar = 4 * BEAT; b = 0; t0 = CUT
END_GROOVE = 46.2
while t0 < END_GROOVE:
    c = b % 4
    add(pad(CH[c], bar + 0.4), t0, 0.20); add(pad([BASS[c]], bar), t0, 0.26)
    for k in range(8):
        add(pluck(ARP[c][[0,1,2,3,2,1,3,2][k]], 0.9), t0 + k * BEAT / 2, 0.14 if k % 2 == 0 else 0.10, pan=-0.3 if k % 2 else 0.3)
    for k in (0, 2): add(kick(), t0 + k * BEAT, 0.36)
    if 16.7 <= t0 < 42.7:
        for k in range(4): add(hat(), t0 + k * BEAT + BEAT / 2, 0.05, pan=0.4)
    t0 += bar; b += 1
add(pad([53, 57, 60, 67], DUR - END_GROOVE), END_GROOVE, 0.24); add(pad([41], DUR - END_GROOVE), END_GROOVE, 0.28)
add(pluck(77, 2.5), END_GROOVE, 0.14); add(bell(84, 3.0), END_GROOVE, 0.08)
sfx(bell(77, 2.2), CUT, 0.09); sfx(kick(), CUT, 0.5)                        # the cut
for x in S[3:]: sfx(whoosh(0.4), x - 0.3, 0.07)
for d in (1.1, 2.7, 3.1, 5.3): sfx(pop(76 + 12), S[3] + d, 0.10, pan=0.2)  # chat bubbles
sfx(pop(84), S[3] + 4.1, 0.12); sfx(tick(True), S[3] + 4.1, 0.25)           # tap
for k in range(12): sfx(tick(True), S[4] + 1.7 + k * 0.1, 0.10)              # count-up
for k in range(3): sfx(pop([72,76,79][k] + 12), S[4] + 3.1 + k * 0.35, 0.10)
sfx(tick(False), S[5] + 3.1, 0.35); sfx(pop(77 + 12), S[5] + 3.2, 0.10)     # Hazlo ya
for k in range(6): sfx(pop([72,74,76,77,79,81][k] + 12), S[6] + 0.6 + k * 0.22, 0.08)
sfx(whoosh(0.5), S[6] + 2.65, 0.08); sfx(bell(84, 2.0), S[6] + 3.35, 0.08)
sfx(kick(), S[6] + 4.0, 0.5)                                                  # stamp
sfx(bell(89, 2.2), S[7] + 0.8, 0.06); sfx(tick(False), S[7] + 3.0, 0.3)
# ---- duck the music bed under the voice ----
VO = {0: 1.984, 1: 5.995, 2: 3.861, 3: 5.952, 4: 4.16, 5: 2.944, 6: 4.053, 7: 1.984}
g = np.ones(N); ramp = int(0.15 * SR)
for k, d in VO.items():
    a = int((S[k] + 0.35) * SR); z = min(N, int((S[k] + 0.35 + d + 0.1) * SR))
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
