import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/** Letter size in points; images are fitted inside with a margin. */
const PAGE = { width: 612, height: 792, margin: 28 };

export interface PdfSource {
  /** PDF bytes, or an image (JPEG/PNG/WebP/HEIC when libvips supports it). */
  data: Buffer;
  mime: string;
}

/**
 * Normalizes an image for a PDF page: applies EXIF orientation, downsizes to ~150 dpi on letter size
 * and re-encodes as JPEG to keep bundles small.
 */
export async function normalizeImage(data: Buffer, quality = 75): Promise<Buffer> {
  return sharp(data)
    .rotate()
    .resize({ width: 1275, height: 1650, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

async function appendImage(doc: PDFDocument, data: Buffer, quality: number): Promise<void> {
  const jpg = await normalizeImage(data, quality);
  const img = await doc.embedJpg(jpg);
  const maxW = PAGE.width - PAGE.margin * 2;
  const maxH = PAGE.height - PAGE.margin * 2;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  const page = doc.addPage([PAGE.width, PAGE.height]);
  page.drawImage(img, { x: (PAGE.width - w) / 2, y: PAGE.height - PAGE.margin - h, width: w, height: h });
}

/** Merges PDFs and images, in the given order, into one PDF (ANTECEDENTES.pdf, AFILIACIONES.pdf). */
export async function mergeToPdf(
  sources: PdfSource[],
  opts: { imageQuality?: number } = {},
): Promise<Buffer> {
  const out = await PDFDocument.create();
  for (const src of sources) {
    if (src.mime === 'application/pdf') {
      const doc = await PDFDocument.load(src.data, { ignoreEncryption: true });
      const pages = await out.copyPages(doc, doc.getPageIndices());
      for (const p of pages) out.addPage(p);
    } else if (src.mime.startsWith('image/')) {
      await appendImage(out, src.data, opts.imageQuality ?? 75);
    } else {
      throw new Error(`Tipo de archivo no soportado para PDF: ${src.mime}`);
    }
  }
  return Buffer.from(await out.save({ useObjectStreams: true }));
}

export async function pdfPageCount(pdf: Buffer): Promise<number> {
  return (await PDFDocument.load(pdf, { ignoreEncryption: true })).getPageCount();
}
