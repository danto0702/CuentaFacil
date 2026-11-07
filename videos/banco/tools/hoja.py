# Contact sheet of every cutout in the bank (checkerboard behind transparency), labelled by file name.
# Usage: python hoja.py <out.jpg>
import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'personajes', '*.webp'))) + sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'objetos', '*.webp')))
C, CW, CH = 8, 240, 300
rows = (len(files) + C - 1) // C
sheet = Image.new('RGB', (C * CW, rows * CH), '#ffffff')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = (i % C) * CW, (i // C) * CH
    for yy in range(0, CH - 30, 20):
        for xx in range(0, CW, 20):
            if (xx // 20 + yy // 20) % 2: d.rectangle([x + xx, y + yy, x + xx + 19, y + yy + 19], fill='#E6E6E6')
    im = Image.open(f).convert('RGBA'); im.thumbnail((CW - 10, CH - 40))
    sheet.paste(im, (x + (CW - im.width) // 2, y + 5 + (CH - 40 - im.height) // 2), im)
    d.text((x + 6, y + CH - 26), os.path.basename(f)[:-5], fill='#000')
sheet.save(sys.argv[1], quality=85)
print(len(files), 'cutouts')
