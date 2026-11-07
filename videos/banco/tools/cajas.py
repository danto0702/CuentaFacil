# Finds each figure on a white-background sheet: non-white mask, dilated so a figure's parts merge, one box per component.
# Usage: python cajas.py <sheet.jpg> [dilate_px] [min_area_frac]  -> prints "x0 y0 x1 y1" per figure, top-to-bottom, left-to-right
import sys, numpy as np
from PIL import Image
from scipy import ndimage
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
dil = int(sys.argv[2]) if len(sys.argv) > 2 else 40
mfrac = float(sys.argv[3]) if len(sys.argv) > 3 else 0.01
m = (255 * 3 - im.sum(2)) > 45
m = ndimage.binary_dilation(m, iterations=dil)
lab, n = ndimage.label(m)
H, W = m.shape
out = []
for sl in ndimage.find_objects(lab):
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    if (y1 - y0) * (x1 - x0) < mfrac * H * W: continue
    out.append((max(0, x0 - 10), max(0, y0 - 10), min(W, x1 + 10), min(H, y1 + 10)))
out.sort(key=lambda b: (round(b[1] / (H / 6)), b[0]))
for b in out: print(*b)
