# Cuts one character out of a white-background sheet: birefnet-general on a crop, keeps the main component(s).
# Usage: python cutout.py <src> <x0> <y0> <x1> <y1> <out.webp> [min_frac]
import sys, numpy as np
from PIL import Image
from rembg import remove, new_session
from scipy import ndimage
src, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
min_frac = float(sys.argv[7]) if len(sys.argv) > 7 else 0.02
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
rgba = np.array(remove(im, session=new_session('birefnet-general')))
a = rgba[..., 3]
lab, n = ndimage.label(a > 40)
if n:
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * min_frac]
    rgba[..., 3] = np.where(np.isin(lab, keep), a, 0) * (ndimage.binary_dilation(np.isin(lab, keep), iterations=2))
ys, xs = np.nonzero(rgba[..., 3] > 8)
pad = 6
crop = rgba[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]
Image.fromarray(crop).save(out, 'WEBP', quality=92, method=6)
print(out, crop.shape[1], crop.shape[0], 'components', n)
