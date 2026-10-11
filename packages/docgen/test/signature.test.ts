import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { cleanSignature } from '../src/signature.js';

/** A phone-like photo: sheet on a table, shadow gradient, a fold line and a dark signature stroke. */
async function photo(): Promise<Buffer> {
  const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f2ee"/><stop offset="1" stop-color="#bdbab4"/></linearGradient></defs>
    <rect width="1200" height="900" fill="#a8a29a"/>
    <polygon points="130,90 1090,70 1120,830 100,860" fill="url(#g)"/>
    <line x1="150" y1="520" x2="1090" y2="380" stroke="#c9c6c0" stroke-width="14"/>
    <path d="M320 480 C 380 390, 420 570, 480 450 S 570 390, 600 480 L 860 450" stroke="#2a2a3a" stroke-width="6" fill="none"/>
  </svg>`;
  return sharp(Buffer.from(svg)).blur(1).jpeg({ quality: 80 }).toBuffer();
}

describe('cleanSignature', () => {
  it('keeps only the ink on white, opaque and cropped to the strokes', async () => {
    const out = await cleanSignature(await photo());
    expect(out).not.toBeNull();
    const { data, info } = await sharp(out!).raw().toBuffer({ resolveWithObject: true });
    // Opaque RGB: semi-transparent images print as a hatched pattern in some PDF viewers.
    expect(info.channels).toBe(3);
    // Cropped around the stroke (≈ 540 × 120 px in the photo), not the whole sheet.
    expect(info.width).toBeGreaterThan(450);
    expect(info.width).toBeLessThan(700);
    expect(info.height).toBeLessThan(220);
    // Mostly white: the paper, the shadow, the fold and the table are gone.
    let opaque = 0;
    for (let i = 0; i < data.length; i += 3) if (data[i]! < 128) opaque++;
    expect(opaque / (info.width * info.height)).toBeLessThan(0.15);
    expect(opaque).toBeGreaterThan(1000);
  });

  it('turns a signature photographed sideways back to horizontal', async () => {
    const sideways = await sharp(await photo())
      .rotate(90)
      .jpeg()
      .toBuffer();
    const out = await cleanSignature(sideways);
    const meta = await sharp(out!).metadata();
    expect(meta.width!).toBeGreaterThan(meta.height!);
  });

  it('handles images with transparency (PNG with alpha) without striping or stretching', async () => {
    const png = await sharp(await photo())
      .ensureAlpha()
      .png()
      .toBuffer();
    const fromJpeg = await sharp((await cleanSignature(await photo()))!).metadata();
    const fromPng = await sharp((await cleanSignature(png))!).metadata();
    expect(Math.abs(fromPng.width! - fromJpeg.width!)).toBeLessThan(20);
    expect(Math.abs(fromPng.height! - fromJpeg.height!)).toBeLessThan(20);
  });

  it('returns null when there is no ink', async () => {
    const blank = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#f2f0ec' } })
      .jpeg()
      .toBuffer();
    expect(await cleanSignature(blank)).toBeNull();
  });
});
