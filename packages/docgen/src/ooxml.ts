/**
 * Minimal WordprocessingML builder used to author entity templates in code.
 * It only covers what the report formats need: paragraphs, runs, tables, page setup.
 */

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Half-points, as in OOXML (22 = 11 pt). */
  size?: number;
  font?: string;
  color?: string;
}

export interface ParaOpts extends RunOpts {
  align?: 'left' | 'center' | 'right' | 'both';
  spacingAfter?: number;
  spacingBefore?: number;
  keepNext?: boolean;
  pageBreakBefore?: boolean;
}

export type Run = string | { text: string; opts?: RunOpts };

function rPr(o: RunOpts = {}): string {
  const parts: string[] = [];
  if (o.font) parts.push(`<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>`);
  if (o.bold) parts.push('<w:b/><w:bCs/>');
  if (o.italic) parts.push('<w:i/><w:iCs/>');
  if (o.underline) parts.push('<w:u w:val="single"/>');
  if (o.color) parts.push(`<w:color w:val="${o.color}"/>`);
  if (o.size) parts.push(`<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>`);
  return parts.length ? `<w:rPr>${parts.join('')}</w:rPr>` : '';
}

export function run(text: string, opts: RunOpts = {}): string {
  // Keep each template command inside a single run so the engine never sees it split.
  return `<w:r>${rPr(opts)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

export function p(content: Run | Run[], opts: ParaOpts = {}): string {
  const runs = (Array.isArray(content) ? content : [content])
    .map((r) => (typeof r === 'string' ? run(r, opts) : run(r.text, { ...opts, ...r.opts })))
    .join('');
  const ppr: string[] = [];
  if (opts.keepNext) ppr.push('<w:keepNext/>');
  if (opts.pageBreakBefore) ppr.push('<w:pageBreakBefore/>');
  ppr.push(`<w:spacing w:before="${opts.spacingBefore ?? 0}" w:after="${opts.spacingAfter ?? 60}"/>`);
  if (opts.align) ppr.push(`<w:jc w:val="${opts.align}"/>`);
  ppr.push(rPr(opts).replace('<w:rPr>', '<w:rPr>'));
  return `<w:p><w:pPr>${ppr.join('')}</w:pPr>${runs}</w:p>`;
}

/** A paragraph holding only a template command (FOR/END-FOR/IF/END-IF); the engine removes it. */
export function cmd(code: string, opts: RunOpts = {}): string {
  return p(`{{${code}}}`, { ...opts, spacingAfter: 0 });
}

export interface CellOpts {
  /** Width in twips (1/20 pt). */
  width: number;
  span?: number;
  fill?: string;
  vAlign?: 'top' | 'center' | 'bottom';
  borders?: boolean;
  vMerge?: 'restart' | 'continue';
}

export function cell(content: string | string[], opts: CellOpts): string {
  const tcPr: string[] = [`<w:tcW w:w="${opts.width}" w:type="dxa"/>`];
  if (opts.span && opts.span > 1) tcPr.push(`<w:gridSpan w:val="${opts.span}"/>`);
  if (opts.vMerge) tcPr.push(opts.vMerge === 'restart' ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>');
  if (opts.borders === false) {
    tcPr.push(
      '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>',
    );
  }
  if (opts.fill) tcPr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>`);
  tcPr.push(`<w:vAlign w:val="${opts.vAlign ?? 'center'}"/>`);
  const body = Array.isArray(content) ? content.join('') : content;
  return `<w:tc><w:tcPr>${tcPr.join('')}</w:tcPr>${body || p('')}</w:tc>`;
}

export function row(cells: string[], opts: { header?: boolean; cantSplit?: boolean } = {}): string {
  const trPr: string[] = [];
  if (opts.header) trPr.push('<w:tblHeader/>');
  if (opts.cantSplit) trPr.push('<w:cantSplit/>');
  return `<w:tr>${trPr.length ? `<w:trPr>${trPr.join('')}</w:trPr>` : ''}${cells.join('')}</w:tr>`;
}

/** A table row that only carries a loop/conditional command; the engine drops it. */
export function cmdRow(code: string, totalWidth: number, gridCols: number): string {
  return row([cell(cmd(code), { width: totalWidth, span: gridCols })]);
}

export function table(gridWidths: number[], rows: string[], opts: { borders?: boolean } = {}): string {
  const total = gridWidths.reduce((a, b) => a + b, 0);
  const border = opts.borders === false ? 'nil' : 'single';
  const b = (side: string) => `<w:${side} w:val="${border}" w:sz="4" w:space="0" w:color="000000"/>`;
  return [
    '<w:tbl><w:tblPr>',
    `<w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="center"/>`,
    `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b).join('')}</w:tblBorders>`,
    '<w:tblLayout w:type="fixed"/>',
    '<w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar>',
    '</w:tblPr><w:tblGrid>',
    gridWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join(''),
    '</w:tblGrid>',
    rows.join(''),
    '</w:tbl>',
  ].join('');
}

export interface PageSetup {
  width: number;
  height: number;
  margins: { top: number; right: number; bottom: number; left: number; header: number; footer: number };
}

/** Colombian "oficio" page (8.5 × 13 in) used by HRNO formats. */
export const OFICIO: PageSetup = {
  width: 12240,
  height: 18720,
  margins: { top: 1417, right: 1701, bottom: 1417, left: 1701, header: 708, footer: 708 },
};

export function usableWidth(page: PageSetup): number {
  return page.width - page.margins.left - page.margins.right;
}

export const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

export function sectPr(page: PageSetup, refs: { header?: string; footer?: string } = {}): string {
  const m = page.margins;
  return [
    '<w:sectPr>',
    refs.header ? `<w:headerReference w:type="default" r:id="${refs.header}"/>` : '',
    refs.footer ? `<w:footerReference w:type="default" r:id="${refs.footer}"/>` : '',
    `<w:pgSz w:w="${page.width}" w:h="${page.height}"/>`,
    `<w:pgMar w:top="${m.top}" w:right="${m.right}" w:bottom="${m.bottom}" w:left="${m.left}" w:header="${m.header}" w:footer="${m.footer}" w:gutter="0"/>`,
    '</w:sectPr>',
  ].join('');
}
