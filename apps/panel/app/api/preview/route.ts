import {
  buildTemplateContext,
  docxToPdf,
  renderDocx,
  syntheticAccount,
  TemplateRenderError,
} from '@cuentasbot/docgen';
import { isStaffRequest } from '@/lib/auth';
import { dataSource } from '@/lib/data';

export const runtime = 'nodejs';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Fills an uploaded format with a fictitious account plus the entity's variable defaults. */
export async function POST(req: Request) {
  if (!(await isStaffRequest())) return new Response('No autorizado', { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  const entityId = String(form.get('entityId') ?? '');
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.docx')) {
    return new Response('Sube un archivo .docx', { status: 400 });
  }
  const vars = await dataSource().listVariables(entityId);
  const ctx = await buildTemplateContext(await syntheticAccount({ period: 'full' }));
  ctx.var = Object.fromEntries(vars.map((v) => [v.key, v.defaultValue || `[${v.label}]`]));
  try {
    const docx = await renderDocx(Buffer.from(await file.arrayBuffer()), ctx);
    const base = file.name.replace(/\.docx$/i, '');
    if (form.get('pdf')) {
      const pdf = await docxToPdf(docx);
      return new Response(new Uint8Array(pdf), {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${base}_vista_previa.pdf"`,
        },
      });
    }
    return new Response(new Uint8Array(docx), {
      headers: {
        'content-type': DOCX,
        'content-disposition': `attachment; filename="${base}_vista_previa.docx"`,
      },
    });
  } catch (e) {
    const msg =
      e instanceof TemplateRenderError ? e.details.join('\n') : e instanceof Error ? e.message : String(e);
    return new Response(`No se pudo llenar el formato:\n${msg}`, {
      status: 422,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}
