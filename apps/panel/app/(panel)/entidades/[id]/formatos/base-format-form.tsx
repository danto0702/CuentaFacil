'use client';
import { useActionState } from 'react';
import { type BaseFormatState, uploadBaseFormat } from './actions';

const LABELS = { activity_report: 'Informe de actividades', supervision_report: 'Informe de supervisión' };

/** Upload form for one original format, with visible progress: phones take a while to send the file. */
export function BaseFormatForm({
  entityId,
  kind,
}: {
  entityId: string;
  kind: 'activity_report' | 'supervision_report';
}) {
  const [state, action, pending] = useActionState<BaseFormatState, FormData>(uploadBaseFormat, {});
  return (
    <form action={action} className="inline" style={{ marginBottom: 8 }}>
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="kind" value={kind} />
      <span style={{ minWidth: 190 }}>{LABELS[kind]}</span>
      <input type="file" name="file" accept=".docx" required disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Subir'}
      </button>
      {pending && <span className="muted">No cierres ni cambies de página hasta que termine.</span>}
      {!pending && state.ok && <span className="tag-ok">{state.ok}</span>}
      {!pending && state.error && <span className="tag-bad">{state.error}</span>}
    </form>
  );
}
