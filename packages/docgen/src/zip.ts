import JSZip from 'jszip';

export interface ZipEntry {
  /** Path inside the ZIP, e.g. "CUENTAS SEPTIEMBRE 2026/DOCUMENTOS A CARGAR/INFORME.pdf". */
  path: string;
  data: Buffer;
}

/**
 * Builds the delivery ZIP. If it exceeds `maxBytes` (WhatsApp document limit), entries are split
 * into several ZIPs ("parte 1 de N"), never splitting a single file.
 */
export async function buildZips(entries: ZipEntry[], maxBytes: number): Promise<Buffer[]> {
  const make = async (items: ZipEntry[]) => {
    const zip = new JSZip();
    for (const e of items) zip.file(e.path, e.data);
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  };
  const whole = await make(entries);
  if (whole.length <= maxBytes) return [whole];

  const parts: ZipEntry[][] = [];
  let current: ZipEntry[] = [];
  let size = 0;
  for (const e of entries) {
    if (e.data.length > maxBytes) throw new Error(`El archivo ${e.path} supera el tamaño máximo permitido`);
    if (size + e.data.length > maxBytes && current.length) {
      parts.push(current);
      current = [];
      size = 0;
    }
    current.push(e);
    size += e.data.length;
  }
  if (current.length) parts.push(current);
  return Promise.all(parts.map(make));
}
