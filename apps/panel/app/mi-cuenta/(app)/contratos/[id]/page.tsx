import { compareIso } from '@cuentasbot/shared';
import { notFound, redirect } from 'next/navigation';
import {
  listContracts,
  listNotes,
  PERIOD_STATUS,
  type PortalNote,
  type PortalObligation,
  portalSession,
  shortDate,
  todayBogota,
} from '@/lib/portal';
import {
  addActivity,
  addPhotos,
  copyPreviousActivities,
  deleteActivity,
  removePhoto,
  updateActivity,
} from '../../../actions';
import { Flash, flashOf, type Search } from '../../../parts';
import { PhotoInput, Submit } from '../../../ui';

const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export default async function ContractPage({
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
  const prev = contract.periods.find((p) => p.number === period.number - 1);
  const [notes, prevNotes] = await Promise.all([
    listNotes(session.sb, contract.id, period),
    prev && period.status !== 'delivered' ? listNotes(session.sb, contract.id, prev) : Promise.resolve([]),
  ]);
  const obligationLabel = (id: string | null) => {
    const o = contract.obligations.find((x) => x.id === id);
    return o ? (o.kind === 'general' ? `General ${o.number}` : `Obligación ${o.number}`) : 'Sin obligación';
  };
  const locked = period.status === 'delivered';
  const back = `/contratos/${contract.id}?p=${period.number}`;
  const today = todayBogota();
  const defaultDate =
    compareIso(today, period.from) < 0 ? period.from : compareIso(today, period.to) > 0 ? period.to : today;
  const specific = contract.obligations.filter((o) => o.kind === 'specific');
  const general = contract.obligations.filter((o) => o.kind === 'general');
  const byObligation = (o: PortalObligation) =>
    notes.filter((n) => n.obligationId === o.id || n.extraIds.includes(o.id));
  const noPhoto = notes.filter((n) => n.photos.length === 0).length;
  const unassigned = notes.filter(
    (n) => !n.obligationId || !contract.obligations.some((o) => o.id === n.obligationId),
  );

  return (
    <>
      <p className="pt-muted">
        <a href="/">← Inicio</a>
      </p>
      <div className="pt-kicker">{contract.entity}</div>
      <h1>Contrato {contract.label}</h1>
      <Flash {...flash} />

      <form className="pt-card pt-row" method="get" action={`/contratos/${contract.id}`}>
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

      {locked ? (
        <div className="pt-note">
          Esta cuenta ya fue entregada: sus actividades quedan como se enviaron. Si necesitas los documentos
          otra vez, pídelos en <a href="/documentos">Documentos</a>.
        </div>
      ) : (
        <details className="pt-card" open={notes.length === 0}>
          <summary>＋ Agregar una actividad</summary>
          <form action={addActivity}>
            <input type="hidden" name="contractId" value={contract.id} />
            <label>
              Fecha
              <input
                type="date"
                name="date"
                defaultValue={defaultDate}
                min={period.from}
                max={period.to}
                required
              />
            </label>
            <ObligationSelect label="Obligación" obligations={contract.obligations} />
            <label>
              ¿Qué hiciste?
              <textarea
                name="text"
                placeholder="Ej.: Realicé seguimiento a la notificación semanal de eventos de las UPGD de Ábrego."
              />
            </label>
            <Extras obligations={contract.obligations} selected={[]} />
            <PhotoInput label="Fotos (opcional)" />
            <Submit>Guardar actividad</Submit>
          </form>
        </details>
      )}

      {!locked && prev && prevNotes.length > 0 && (
        <details className="pt-card" id="copiar">
          <summary>📋 Copiar actividades del informe anterior ({prevNotes.length})</summary>
          <p className="pt-muted">
            Marca las que también hiciste este mes. Se copian con el mismo texto y obligación, en el mismo día
            contado desde el inicio de esta cuenta. Las fotos no se copian: agrega las de este mes.
          </p>
          <form action={copyPreviousActivities}>
            <input type="hidden" name="contractId" value={contract.id} />
            <input type="hidden" name="p" value={period.number} />
            <div className="pt-extras" style={{ maxHeight: 360 }}>
              {prevNotes
                .filter((n) => !n.photoOnly && n.text.trim())
                .map((n) => (
                  <label key={n.id} className="pt-check">
                    <input type="checkbox" name="note" value={n.id} defaultChecked />
                    <span>
                      <strong>
                        {shortDate(n.date)} · {obligationLabel(n.obligationId)}
                      </strong>
                      <br />
                      {clip(n.text, 220)}
                    </span>
                  </label>
                ))}
            </div>
            <Submit pending="Copiando…" confirm="¿Copiar las actividades marcadas a esta cuenta?">
              Copiar a este informe
            </Submit>
          </form>
        </details>
      )}

      <section className="pt-card">
        <div className="pt-spread">
          <h2>Actividades de la cuenta</h2>
          <span className="pt-muted">
            {notes.length} registradas
            {notes.length > 0 && (
              <>
                {' · '}
                <span className={`pt-pill ${noPhoto ? 'warn' : 'ok'}`}>
                  📷 {notes.length - noPhoto} de {notes.length} con foto
                </span>
              </>
            )}
          </span>
        </div>
        {specific.map((o) => (
          <div key={o.id} className="pt-obl">
            <div className="pt-obl-title">
              Obligación {o.number}{' '}
              {byObligation(o).length === 0 ? (
                <span className="pt-pill warn">Sin actividad</span>
              ) : (
                byObligation(o).some((n) => n.photos.length === 0) && (
                  <span className="pt-pill warn">
                    {byObligation(o).filter((n) => n.photos.length === 0).length} sin foto
                  </span>
                )
              )}
              <small>{clip(o.text, 220)}</small>
            </div>
            {byObligation(o).map((n) => (
              <Activity
                key={`${o.id}-${n.id}`}
                note={n}
                main={n.obligationId === o.id}
                obligations={contract.obligations}
                contractId={contract.id}
                back={back}
                locked={locked}
                period={period}
              />
            ))}
          </div>
        ))}
        {general.some((o) => byObligation(o).length > 0) &&
          general.map((o) =>
            byObligation(o).length ? (
              <div key={o.id} className="pt-obl">
                <div className="pt-obl-title">
                  Obligación general {o.number}
                  <small>{clip(o.text, 220)}</small>
                </div>
                {byObligation(o).map((n) => (
                  <Activity
                    key={`${o.id}-${n.id}`}
                    note={n}
                    main={n.obligationId === o.id}
                    obligations={contract.obligations}
                    contractId={contract.id}
                    back={back}
                    locked={locked}
                    period={period}
                  />
                ))}
              </div>
            ) : null,
          )}
        {unassigned.length > 0 && (
          <div className="pt-obl">
            <div className="pt-obl-title">
              Sin obligación <span className="pt-pill bad">Asígnala</span>
            </div>
            {unassigned.map((n) => (
              <Activity
                key={n.id}
                note={n}
                main
                obligations={contract.obligations}
                contractId={contract.id}
                back={back}
                locked={locked}
                period={period}
              />
            ))}
          </div>
        )}
      </section>

      {!locked && (
        <section className="pt-card">
          <h3>¿Listo para cerrar la cuenta?</h3>
          <p className="pt-muted">
            Revisa el borrador del informe aquí mismo: corrige lo que quieras, apruébalo y genera los
            documentos.
          </p>
          <div className="pt-row">
            <a className="pt-btn" href={`/contratos/${contract.id}/borrador?p=${period.number}`}>
              Revisar el borrador
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function ObligationSelect({
  label,
  obligations,
  value,
}: {
  label: string;
  obligations: PortalObligation[];
  value?: string | null;
}) {
  return (
    <label>
      {label}
      <select name="obligationId" defaultValue={value ?? ''} required>
        <option value="" disabled>
          Elige la obligación
        </option>
        {obligations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.kind === 'general' ? `General ${o.number}` : `${o.number}`}. {clip(o.text, 90)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Extras({ obligations, selected }: { obligations: PortalObligation[]; selected: string[] }) {
  return (
    <details>
      <summary className="pt-muted">¿También cuenta para otras obligaciones?</summary>
      <div className="pt-extras">
        {obligations.map((o) => (
          <label key={o.id} className="pt-check">
            <input type="checkbox" name="extra" value={o.id} defaultChecked={selected.includes(o.id)} />
            <span>
              {o.kind === 'general' ? `General ${o.number}` : o.number}. {clip(o.text, 110)}
            </span>
          </label>
        ))}
      </div>
    </details>
  );
}

function Activity({
  note,
  main,
  obligations,
  contractId,
  back,
  locked,
  period,
}: {
  note: PortalNote;
  main: boolean;
  obligations: PortalObligation[];
  contractId: string;
  back: string;
  locked: boolean;
  period: { from: string; to: string };
}) {
  const also = obligations.filter(
    (o) => note.extraIds.includes(o.id) || (!main && o.id === note.obligationId),
  );
  return (
    <article className="pt-act">
      <div className="pt-spread">
        <span className="pt-act-date">
          {shortDate(note.date)}{' '}
          {note.photos.length ? (
            <span className="pt-pill ok">
              📷 {note.photos.length} {note.photos.length === 1 ? 'foto' : 'fotos'}
            </span>
          ) : (
            <span className="pt-pill warn">Sin foto</span>
          )}
        </span>
        {also.length > 0 && (
          <span className="pt-muted">
            {main ? 'También en' : 'Principal en'}: {also.map((o) => o.number).join(', ')}
          </span>
        )}
      </div>
      <p className="pt-act-text">{note.photoOnly ? <em>Solo fotos (sin descripción)</em> : note.text}</p>
      {note.photos.length > 0 && (
        <div className="pt-photos">
          {note.photos.map((ph) => (
            <div key={ph.id} className="pt-photo">
              {ph.url && (
                <a href={ph.url} target="_blank" rel="noopener">
                  {/* biome-ignore lint/performance/noImgElement: signed Storage URLs, no image optimizer */}
                  <img src={ph.url} alt="Evidencia" loading="lazy" />
                </a>
              )}
              {!locked && (
                <form action={removePhoto}>
                  <input type="hidden" name="photoId" value={ph.id} />
                  <input type="hidden" name="back" value={back} />
                  <Submit className="" pending="…" confirm="¿Quitar esta foto?">
                    ×
                  </Submit>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
      {!locked && main && (
        <details>
          <summary>Editar</summary>
          <form action={updateActivity}>
            <input type="hidden" name="noteId" value={note.id} />
            <input type="hidden" name="contractId" value={contractId} />
            <label>
              Fecha
              <input
                type="date"
                name="date"
                defaultValue={note.date}
                min={period.from}
                max={period.to}
                required
              />
            </label>
            <ObligationSelect
              label="Obligación principal"
              obligations={obligations}
              value={note.obligationId}
            />
            <label>
              Actividad
              <textarea name="text" defaultValue={note.photoOnly ? '' : note.text} />
            </label>
            <Extras obligations={obligations} selected={note.extraIds} />
            <Submit>Guardar cambios</Submit>
          </form>
          <hr className="pt-hr" />
          <form action={addPhotos} className="pt-row">
            <input type="hidden" name="noteId" value={note.id} />
            <input type="hidden" name="back" value={back} />
            <PhotoInput required style={{ flex: 1, minWidth: 200 }} />
            <Submit className="pt-btn ghost small" pending="Subiendo…">
              Agregar fotos
            </Submit>
          </form>
          <hr className="pt-hr" />
          <form action={deleteActivity}>
            <input type="hidden" name="noteId" value={note.id} />
            <input type="hidden" name="back" value={back} />
            <Submit
              className="pt-btn danger small"
              pending="Borrando…"
              confirm="¿Borrar esta actividad y sus fotos? No se puede deshacer."
            >
              Borrar actividad
            </Submit>
          </form>
        </details>
      )}
    </article>
  );
}
