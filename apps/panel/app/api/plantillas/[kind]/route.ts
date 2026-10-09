import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '@cuentasbot/docgen';
import { isStaffRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isStaffRequest())) return new Response('No autorizado', { status: 401 });
  const { kind } = await params;
  const build =
    kind === 'activity_report'
      ? buildHrnoActivityTemplate
      : kind === 'supervision_report'
        ? buildHrnoSupervisionTemplate
        : null;
  if (!build) return new Response('Formato no encontrado', { status: 404 });
  const name =
    kind === 'activity_report'
      ? 'PLANTILLA_Informe_Actividades_HRNO.docx'
      : 'PLANTILLA_Informe_Supervision_HRNO.docx';
  return new Response(new Uint8Array(await build()), {
    headers: { 'content-type': DOCX, 'content-disposition': `attachment; filename="${name}"` },
  });
}
