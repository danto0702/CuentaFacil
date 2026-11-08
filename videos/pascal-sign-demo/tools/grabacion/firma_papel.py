# Signature-on-paper assets for the recording: a photo to upload and a fake camera feed (y4m) of the same signature.
import math, numpy as np, subprocess
from PIL import Image, ImageDraw, ImageFilter
rng = np.random.default_rng(7)

def firma_pts(x0, y0, s):
    pts = []
    for i in range(0, 60):  # big C/P loop
        a = math.pi * (0.2 + 1.6 * i / 59); pts.append((x0 + s * (40 + 46 * math.cos(a)), y0 - s * (10 + 56 * math.sin(a))))
    x = pts[-1][0]
    for k, h in enumerate([18, 14, 70, 16, 12, 22, 60, 15, 13, 18, 12]):
        w = s * (26 if h > 40 else 22)
        for i in range(16):
            t = i / 15; pts.append((x + w * t + (s * 10 * math.sin(t * 2 * math.pi) if h > 40 else 0), y0 - s * h * math.sin(math.pi * t) * (0.9 + 0.2 * math.sin(k))))
        x += w
    tail = [(x + s * 30 * t, y0 - s * 30 * t * t) for t in np.linspace(0, 1, 12)]
    under = [(x0 + s * 20 + (x - x0) * t, y0 + s * (26 + 10 * math.sin(t * math.pi)) - s * 8 * t) for t in np.linspace(0, 1, 40)]
    return pts + tail, under

def paper(w, h, shade):
    base = np.ones((h, w, 3)) * np.array([238, 233, 220])
    yy, xx = np.mgrid[0:h, 0:w]
    base *= (1 - shade * ((xx / w) * 0.6 + (yy / h) * 0.4))[..., None]  # light falloff / shadow
    base += rng.normal(0, 3.5, (h, w, 1))
    return Image.fromarray(np.clip(base, 0, 255).astype('uint8'))

def draw_sig(img, x0, y0, s, ink=(28, 38, 110)):
    d = ImageDraw.Draw(img)
    for line in firma_pts(x0, y0, s):
        for (a, b), (c, e) in zip(line, line[1:]):
            d.line([a, b, c, e], fill=ink, width=max(3, int(5 * s)))
    return img.filter(ImageFilter.GaussianBlur(0.7))

# 1) photo of the signature (to upload)
im = paper(1400, 700, 0.22); im = draw_sig(im, 230, 430, 2.1); im = im.rotate(-2.5, resample=Image.BICUBIC, fillcolor=(200, 196, 186))
im.save('firma-foto.jpg', quality=90)
# 2) fake camera feed: 4:3, signature centred in the guide box, slight hand shake
W, H, N = 1280, 960, 60
frames = []
for f in range(N):
    dx, dy = 6 * math.sin(f / 9), 4 * math.cos(f / 7)
    im = paper(W, H, 0.3)
    im = draw_sig(im, 300 + dx, 560 + dy, 1.85)
    frames.append(np.asarray(im.convert('RGB')))
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '15', '-i', '-', '-pix_fmt', 'yuv420p', 'camara.y4m'], stdin=subprocess.PIPE)
for fr in frames: p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait(); print('ok')
