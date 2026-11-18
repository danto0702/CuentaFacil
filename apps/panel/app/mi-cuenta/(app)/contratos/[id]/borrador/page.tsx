import { notFound, redirect } from 'next/navigation';
import {
  listContracts,
  listDrafts,
  listNotes,
  PERIOD_STATUS,
  type PortalDraft,
  type PortalObligation,
  portalSession,
} from '@/lib/portal';
import { approveDraft, askPascal, saveDraftText } from '../../../../actions';
import { Flash, flashOf, type Search } from '../../../../parts';
import { AutoRefresh, Submit } from '../../../../ui';

/**
 * The report draft on the web (ADR-065): what Pascal wrote for each obligation, the contractor's own text where
 * they want it, approval and generation. The same rules as the chat: every obligation needs its text (or is left
 * out because it had no activity) before approving.
 */
const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

type State = 'ok' | 'missing' | 'omitted' | 'none';

function stateOf(d: PortalDraft | undefined): State {
  if (!d || d.status === 'pending') return 'none';
  if (d.status === 'not_applicable') return 'omitted';
  if (d.status === 'needs_input' || !d.text.trim()) return 'missing';
  return 'ok';
}

const PILL: Record<State, [string, string]> = {
  ok: ['ok', 'Con texto'],
  missing: ['warn', 'Falta el texto'],
  omitted: ['', 'Sin actividades: no va en el informe'],
  none: ['bad', 'Sin redactar'],
};

export default async function DraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const { id } = await params;
  const sp = await searchParams;
  const flash = await flashOf(searchParams);
  const contract = (await listContracts(session.sb)).find((c) => c.id === id);
  if (!contract) notFound();
  const wanted = Number(Array.isArray(sp.p) ? sp.p[0] : sp.p);
  const period =
    contract.periods.find((p) => p.number === wanted) ?? contract.current ?? contract.periods.at(-1);
  if (!period) notFound();
  const [drafts, notes] = await Promise.all([
    listDrafts(session.sb, period.id),
    listNotes(session.sb, contract.id, period),
  ]);
  const closed = period.status === 'delivered' || period.status === 'generating';
  const approved = period.status === 'approved';
  const asked = Boolean(flash.ok && /Pascal/.test(flash.ok));
  const back = `/contratos/${contract.id}/borrador?p=${period.number}`;
  const draftOf = (o: PortalObligation) => drafts.find((d) => d.obligationId === o.id);
  const states = contract.obligations.map((o) => stateOf(draftOf(o)));
  const pending = states.filter((s) => s === 'missing' || s === 'none').length;
  const undrafted = states.filter((s) => s === 'none').length;
  const withText = states.filter((s) => s === 'ok').length;
  const notesOf = (o: PortalObligation) =>
    notes.filter((n) => n.obligationId === o.id || n.extraIds.includes(o.id)).length;
  const whose = session.acting ? `de ${session.user.fullName.split(' ').slice(0, 3).join(' ')}` : '';

  return (
    <>
      {asked && <AutoRefresh seconds={8} />}
      <p className="pt-muted">
        <a href={`/contratos/${contract.id}?p=${period.number}`}>← Actividades del contrato</a>
      </p>
      <div className="pt-kicker">
        {contract.entity} · Contrato {contract.label}
      </div>
      <h1>Borrador del informe {whose}</h1>
      <div className="pt-spread" style={{ marginBottom: 12 }}>
        <span>{period.label}</span>
        <span className={`pt-pill ${approved ? 'ok' : closed ? '' : 'info'}`}>
          {PERIOD_STATUS[period.status] ?? period.status}
        </span>
      </div>
      <Flash {...flash} />

      <form className="pt-card pt-row" method="get" action={`/contratos/${contract.id}/borrador`}>
        <label style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
          Cuenta
          <select name="p" defaultValue={period.number}>
            {contract.periods.map((p) => (
              <option key={p.id} value={p.number}>
                {p.label} — {PERIOD_STATUS[p.status] ?? p.status}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="pt-btn ghost" style={{ alignSelf: 'flex-end' }}>
          Ver
        </button>
      </form>

      {closed ? (
        <div className="pt-note">
          Esta cuenta ya se generó: el borrador queda como se aprobó. Tus documentos están en{' '}
          <a href="/documentos">Documentos</a>.
        </div>
      ) : (
        <section className="pt-card pt-progress">
          <div className="pt-steps-bar">
            <Step done={notes.length > 0} n={1} label="Actividades" />
            <Step done={drafts.length > 0 && undrafted === 0} n={2} label="Borrador" />
            <Step done={approved} n={3} label="Aprobación" />
            <Step done={false} n={4} label="Documentos" />
          </div>
          <p style={{ marginTop: 12 }}>
            {drafts.length === 0
              ? 'Pascal aún no ha redactado esta cuenta. Pídeselo: redacta cada obligación con las actividades que registraste.'
              : approved
                ? 'El borrador está aprobado. Genera los documentos: Pascal te los envía por WhatsApp y quedan en Documentos.'
                : pending
                  ? `${withText} de ${contract.obligations.length} obligaciones tienen texto. Completa ${pending === 1 ? 'la que falta' : `las ${pending} que faltan`} y aprueba el borrador.`
                  : 'Revisa el texto de cada obligación. Si todo está bien, apruébalo.'}
          </p>
          <div className="pt-row">
            {approved ? (
              <form action={askPascal}>
                <input type="hidden" name="text" value="generar" />
                <input type="hidden" name="contractId" value={contract.id} />
                <input type="hidden" name="back" value={back} />
                <Submit className="pt-btn" pending="Enviando…">
                  📄 Generar documentos
                </Submit>
              </form>
            ) : pending > 0 ? null : (
              <form action={approveDraft}>
                <input type="hidden" name="contractId" value={contract.id} />
                <input type="hidden" name="p" value={period.number} />
                <Submit
                  className="pt-btn"
                  pending="Aprobando…"
                  confirm="¿Apruebas el borrador completo? Después puedes generar los documentos."
                >
                  ✅ Aprobar borrador
                </Submit>
              </form>
            )}
            {(drafts.length === 0 || pending > 0) && (
              <form action={askPascal}>
                <input type="hidden" name="text" value="ver borrador" />
                <input type="hidden" name="contractId" value={contract.id} />
                <input type="hidden" name="back" value={back} />
                <Submit className="pt-btn ghost" pending="Enviando…">
                  ✍️ {drafts.length === 0 ? 'Pedirle a Pascal que redacte' : 'Que Pascal redacte lo pendiente'}
                </Submit>
              </form>
            )}
          </div>
          {asked && (
            <p className="pt-muted" style={{ marginTop: 10 }}>
              Esta página se actualiza sola mientras Pascal trabaja. Si te hace una pregunta (por ejemplo, las
              metas del mes), respóndela en WhatsApp.
            </p>
          )}
        </section>
      )}

      {contract.obligations.map((o, i) => {
        const d = draftOf(o);
        const st = states[i]!;
        const [pill, label] = PILL[st];
        const count = notesOf(o);
        return (
          <section key={o.id} id={`o-${o.id}`} className={`pt-card pt-draft ${st}`}>
            <div className="pt-spread">
              <h3 style={{ margin: 0 }}>
                {o.kind === 'general' ? 'Obligación general' : 'Obligación'} {o.number}
              </h3>
              <span className={`pt-pill ${pill}`}>{d?.own && st === 'ok' ? 'Escrito por ti' : label}</span>
            </div>
            <p className="pt-muted" style={{ marginTop: 4 }}>
              {clip(o.text, 260)}
            </p>
            {st === 'ok' && (
              <div className="pt-draft-text">
                {d!.text.split('\n\n').map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            )}
            {st === 'missing' && (
              <p className="pt-warn-text">
                {count
                  ? 'Pascal no pudo redactar esta obligación con lo que registraste. Escribe el texto o agrega una actividad más clara.'
                  : 'No hay actividades para esta obligación. Agrega una actividad o escribe el texto tú mismo.'}
              </p>
            )}
            <p className="pt-muted" style={{ marginBottom: 8 }}>
              {count === 0
                ? 'Sin actividades registradas'
                : `${count} ${count === 1 ? 'actividad' : 'actividades'}`}{' '}
              · <a href={`/contratos/${contract.id}?p=${period.number}`}>ver actividades</a>
            </p>
            {!closed && (
              <details open={st === 'missing'}>
                <summary>{st === 'ok' ? '✏️ Editar el texto' : '✏️ Escribir el texto'}</summary>
                <form action={saveDraftText}>
                  <input type="hidden" name="contractId" value={contract.id} />
                  <input type="hidden" name="p" value={period.number} />
                  <input type="hidden" name="obligationId" value={o.id} />
                  <label>
                    Texto para el informe
                    <textarea
                      name="text"
                      rows={6}
                      defaultValue={st === 'ok' ? d!.text : ''}
                      placeholder="Ej.: Realicé el seguimiento semanal a la notificación de eventos de las UPGD del municipio."
                      required
                      minLength={10}
                      maxLength={6000}
                    />
                  </label>
                  <p className="pt-muted">
                    Deja una línea en blanco entre párrafos. Lo que escribas aquí queda tal cual en el
                    informe.
                  </p>
                  <Submit>Guardar texto</Submit>
                </form>
              </details>
            )}
          </section>
        );
      })}
    </>
  );
}

function Step({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className={`pt-step ${done ? 'done' : ''}`}>
      <span>{done ? '✓' : n}</span>
      {label}
    </div>
  );
}
