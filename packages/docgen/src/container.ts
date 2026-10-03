import JSZip from 'jszip';
import { NS, type PageSetup, sectPr } from './ooxml.js';

export interface PackageParts {
  /** Inner XML of <w:body>, without the final sectPr. */
  body: string;
  page: PageSetup;
  /** Inner XML of <w:hdr> (paragraphs/tables). */
  header?: string;
  footer?: string;
  defaultFont?: string;
  /** Half-points. */
  defaultSize?: number;
  title?: string;
}

const CONTENT_TYPES = (hasHeader: boolean, hasFooter: boolean) =>
  [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Default Extension="png" ContentType="image/png"/>',
    '<Default Extension="jpeg" ContentType="image/jpeg"/>',
    '<Default Extension="jpg" ContentType="image/jpeg"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    hasHeader
      ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
      : '',
    hasFooter
      ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
      : '',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '</Types>',
  ].join('');

const ROOT_RELS = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
  '</Relationships>',
].join('');

function styles(font: string, size: number): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    `<w:styles ${NS}>`,
    '<w:docDefaults><w:rPrDefault><w:rPr>',
    `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/>`,
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="es-CO" w:eastAsia="es-CO" w:bidi="ar-SA"/>`,
    '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>',
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>',
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>',
    '</w:styles>',
  ].join('');
}

const SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ${NS}><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

function core(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${title}</dc:title><dc:creator>CuentasBot</dc:creator></cp:coreProperties>`;
}

/** Builds a self-contained DOCX from generated parts. */
export async function buildDocx(parts: PackageParts): Promise<Buffer> {
  const zip = new JSZip();
  const hasHeader = parts.header !== undefined;
  const hasFooter = parts.footer !== undefined;
  zip.file('[Content_Types].xml', CONTENT_TYPES(hasHeader, hasFooter));
  zip.file('_rels/.rels', ROOT_RELS);
  const rels = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    hasHeader
      ? '<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
      : '',
    hasFooter
      ? '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
      : '',
    '</Relationships>',
  ].join('');
  zip.file('word/_rels/document.xml.rels', rels);
  zip.file('word/styles.xml', styles(parts.defaultFont ?? 'Arial', parts.defaultSize ?? 20));
  zip.file('word/settings.xml', SETTINGS);
  zip.file('docProps/core.xml', core(parts.title ?? 'Documento'));
  if (hasHeader)
    zip.file(
      'word/header1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${parts.header}</w:hdr>`,
    );
  if (hasFooter)
    zip.file(
      'word/footer1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}>${parts.footer}</w:ftr>`,
    );
  const refs = {
    ...(hasHeader ? { header: 'rIdHeader1' } : {}),
    ...(hasFooter ? { footer: 'rIdFooter1' } : {}),
  };
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${parts.body}${sectPr(parts.page, refs)}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * Reuses an entity's original DOCX (styles, header/footer with logos, page setup) and replaces only the body.
 * `headerPatch` can rewrite header parts (e.g. replace fixed text with tags).
 */
export async function rebodyDocx(
  base: Buffer,
  body: string,
  headerPatch?: (partName: string, xml: string) => string,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(base);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('word/document.xml not found in base DOCX');
  const doc = await docFile.async('string');
  const bodyStart = doc.indexOf('<w:body>');
  const lastSect = doc.lastIndexOf('<w:sectPr');
  if (bodyStart < 0 || lastSect < 0) throw new Error('Unexpected base DOCX structure');
  const tail = doc.slice(lastSect);
  zip.file('word/document.xml', `${doc.slice(0, bodyStart)}<w:body>${body}${tail}`);
  if (headerPatch) {
    for (const name of Object.keys(zip.files)) {
      if (/^word\/(header|footer)\d+\.xml$/.test(name)) {
        const xml = await zip.file(name)!.async('string');
        zip.file(name, headerPatch(name, xml));
      }
    }
  }
  // Drop media/embeddings no longer referenced by the body is unnecessary: Word ignores unreferenced parts.
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
