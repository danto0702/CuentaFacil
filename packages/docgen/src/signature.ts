import sharp from 'sharp';

/**
 * Turns a phone photo of a signature into a clean signature: only the ink, on a transparent background,
 * cropped to the strokes. Paper color, shadows and folds go away because each pixel is compared with its
 * local background (a heavy blur), not with a fixed threshold. Returns null if no ink is found.
 */
export async function cleanSignature(photo: Buffer): Promise<Buffer | null> {
  // Work at a bounded size; EXIF rotation applied.
  const base = sharp(photo)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true });
  const { data: gray, info } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Small enough to follow shadows and folds, large enough not to follow the strokes themselves.
  const blurSigma = Math.max(4, Math.round(Math.max(w, h) / 60));
  const bg = await sharp(gray, { raw: { width: w, height: h, channels: 1 } })
    .blur(blurSigma)
    .raw()
    .toBuffer();

  // Paper brightness (90th percentile): strokes must be clearly darker than the paper in absolute terms,
  // which leaves out the table around the sheet, fold shadows and paper edges.
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < w * h; i++) hist[gray[i]!]!++;
  let acc = 0;
  let paper = 255;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v]!;
    if (acc >= w * h * 0.1) {
      paper = v;
      break;
    }
  }
  const darkEnough = paper * 0.68;

  // Ink strength 0..1: how much darker than the local paper the pixel is.
  const ink = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const b = Math.max(bg[i]!, 1);
    const ratio = gray[i]! / b;
    // Paper ≈ 1; pen strokes ≲ 0.8; folds and paper edges are faint (little absolute contrast).
    const contrast = b - gray[i]!;
    ink[i] =
      contrast < 22 || gray[i]! > darkEnough + 25
        ? 0
        : ratio >= 0.86
          ? 0
          : ratio <= 0.6
            ? 1
            : (0.86 - ratio) / 0.26;
  }

  const kept = keepSignatureStrokes(ink, gray, darkEnough, w, h);
  if (!kept) return null;
  const { box } = kept;

  // Dark ink color on transparent background, cropped with a small margin.
  const pad = Math.round(Math.max(box.x1 - box.x0, box.y1 - box.y0) * 0.04) + 4;
  const x0 = Math.max(0, box.x0 - pad);
  const y0 = Math.max(0, box.y0 - pad);
  const x1 = Math.min(w - 1, box.x1 + pad);
  const y1 = Math.min(h - 1, box.y1 + pad);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y + y0) * w + (x + x0);
      const a = kept.mask[i] ? ink[i]! : 0;
      const o = (y * cw + x) * 4;
      out[o] = 20;
      out[o + 1] = 30;
      out[o + 2] = 70;
      out[o + 3] = Math.round(Math.min(1, a * 1.3) * 255);
    }
  }
  return sharp(out, { raw: { width: cw, height: ch, channels: 4 } })
    .png()
    .toBuffer();
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Keeps the strokes that form the signature: connected ink regions that do not touch the photo border
 * (paper edges, table, fingers) and are not tiny specks. Returns the mask and its bounding box.
 */
function keepSignatureStrokes(
  ink: Float32Array,
  gray: Buffer,
  darkEnough: number,
  w: number,
  h: number,
): { mask: Uint8Array; box: Box } | null {
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) on[i] = ink[i]! > 0.35 && gray[i]! <= darkEnough ? 1 : 0;
  const label = new Int32Array(w * h).fill(-1);
  const comps: { pixels: number[]; border: boolean; box: Box }[] = [];
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!on[start] || label[start] !== -1) continue;
    const id = comps.length;
    const comp = { pixels: [] as number[], border: false, box: { x0: w, y0: h, x1: 0, y1: 0 } };
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      comp.pixels.push(i);
      const x = i % w;
      const y = (i - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) comp.border = true;
      if (x < comp.box.x0) comp.box.x0 = x;
      if (x > comp.box.x1) comp.box.x1 = x;
      if (y < comp.box.y0) comp.box.y0 = y;
      if (y > comp.box.y1) comp.box.y1 = y;
      // 8-connected, with a 1-pixel gap allowed so a stroke split by noise stays one piece.
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (on[n] && label[n] === -1) {
            label[n] = id;
            stack.push(n);
          }
        }
      }
    }
    comps.push(comp);
  }
  const minPixels = Math.max(12, Math.round(w * h * 0.00004));
  const keep = comps.filter((c) => !c.border && c.pixels.length >= minPixels);
  if (!keep.length) return null;

  // The signature is the biggest cluster; drop far-away leftovers (smudges, marks on the paper).
  const main = keep.reduce((a, b) => (b.pixels.length > a.pixels.length ? b : a));
  const reach = Math.max(main.box.x1 - main.box.x0, main.box.y1 - main.box.y0) * 0.25 + 10;
  const near = keep.filter(
    (c) =>
      c.box.x0 <= main.box.x1 + reach &&
      c.box.x1 >= main.box.x0 - reach &&
      c.box.y0 <= main.box.y1 + reach &&
      c.box.y1 >= main.box.y0 - reach,
  );
  const mask = new Uint8Array(w * h);
  const box: Box = { x0: w, y0: h, x1: 0, y1: 0 };
  for (const c of near) {
    for (const i of c.pixels) mask[i] = 1;
    box.x0 = Math.min(box.x0, c.box.x0);
    box.y0 = Math.min(box.y0, c.box.y0);
    box.x1 = Math.max(box.x1, c.box.x1);
    box.y1 = Math.max(box.y1, c.box.y1);
  }
  // Include the soft edges around kept strokes.
  const grown = new Uint8Array(mask);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!mask[i] && (mask[i - 1] || mask[i + 1] || mask[i - w] || mask[i + w])) grown[i] = 1;
    }
  return { mask: grown, box };
}
