import type { WritingStyle } from './domain.js';
import type { Deps, Outgoing } from './ports.js';

/** Code of a report the contractor made before, kept with their supports (ADR-046). */
export const PREVIOUS_REPORT = 'INFORME_ANTERIOR';
/** A file sent as previous report that turned out to be another document. */
export const DISCARDED = 'DESCARTADO';

export const STYLE_UPLOAD_TEXT =
  '📎 Envíame un informe de actividades que ya hayas hecho (PDF o Word) y lo uso como ejemplo de tu forma de escribir. Los hechos siempre salen de lo que me cuentes. Para salir escribe *menú*.';

/**
 * Reads a report the contractor sent as an example of how they write. An activity report is used at
 * once, with buttons to undo it if it was the wrong file; anything else is not used unless the
 * contractor says it is their report (`candidate`, kept in the conversation until they answer).
 */
export async function learnWritingStyle(
  deps: Pick<Deps, 'ai' | 'store'> & { warn?: Deps['warn'] },
  userId: string,
  file: { supportId: string; data: Buffer; mime: string; filename: string },
): Promise<{ out: Outgoing[]; candidate?: WritingStyle }> {
  let reading: Awaited<ReturnType<Deps['ai']['readPreviousReport']>>;
  try {
    reading = await deps.ai.readPreviousReport({ label: file.filename, data: file.data, mime: file.mime });
  } catch (e) {
    deps.warn?.('style.read_failed', { userId, error: String(e) });
    return {
      out: [
        {
          type: 'text',
          text: '📎 Guardé tu informe, pero no lo pude leer en este momento. Escribe *informe anterior* más tarde y envíamelo de nuevo.',
        },
      ],
    };
  }
  const style: WritingStyle = {
    supportId: file.supportId,
    summary: reading.summary,
    guide: reading.guide,
    examples: reading.examples,
  };
  if (!reading.isActivityReport || !reading.guide) {
    return {
      candidate: style,
      out: [
        {
          type: 'buttons',
          text: `🤔 Este documento no parece un informe de actividades: parece *${reading.summary}*. No lo usaré para redactar.`,
          buttons: [
            { id: 'style:keep', title: 'Sí es mi informe' },
            { id: 'style:other', title: 'Enviar otro' },
          ],
        },
      ],
    };
  }
  await deps.store.saveWritingStyle(userId, style);
  return {
    out: [
      {
        type: 'buttons',
        text: `📝 Leí tu informe anterior: *${reading.summary}*.\nDesde ahora redacto tus informes con tu forma de escribir; los hechos siempre salen de lo que me cuentes.\n\n¿Es el documento correcto?`,
        buttons: [
          { id: 'style:ok', title: 'Sí, es ese' },
          { id: 'style:wrong', title: 'No es ese' },
        ],
      },
    ],
  };
}
