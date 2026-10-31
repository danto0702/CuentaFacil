# Removes a flat white background by flood-filling near-white pixels connected to the border (keeps props the AI matting drops).
# Usage: python cutout_white.py <src> <out.webp> [threshold]
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, out = sys.argv[1], sys.argv[2]; th = int(sys.argv[3]) if len(sys.argv) > 3 else 244
rgb = np.array(Image.open(src).convert('RGB')).astype(int)
white = (rgb.min(2) >= th) & (rgb.max(2) - rgb.min(2) < 14)
lab, n = ndimage.label(white)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
bg = ndimage.binary_opening(bg, iterations=1)
a = Image.fromarray(np.where(bg, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.1))
im = Image.open(src).convert('RGB'); im.putalpha(a)
ys, xs = np.nonzero(np.array(a) > 8)
im.crop((xs.min() - 4, ys.min() - 4, xs.max() + 4, ys.max() + 4)).save(out, 'WEBP', quality=92, method=6)
print(out, xs.max() - xs.min(), ys.max() - ys.min())
