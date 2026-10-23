import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminAvailable, getContractorDetail } from '@/lib/admin';
import { deleteGeneralObligations, deleteObligation, sendStaffMessage } from '../actions';

export default async function ContractorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { id } = await params;
  const { msg } = await searchParams;
  if (!adminAvailable()) return <p className="muted">Disponible con Supabase configurado.</p>;
  const c = await getContractorDetail(id);
  if (!c) notFound();
  return (
    <>
      <p>
        <Link href="/contratistas">← Contratistas</Link>
      </p>
      <h2>{c.name}</h2>
      <p className="muted">
        {c.phone} · Cédula expedida en:{' '}
        {c.docIssuedIn || <em>falta (Pascal lo pregunta en el próximo mensaje)</em>}
      </p>
      {msg && <div className="banner">{msg}</div>}

      <StaffMessage userId={c.id} lastInboundAt={c.lastInboundAt} />

      {c.contracts.length === 0 && <p className="muted">Sin contratos configurados.</p>}
      {c.contracts.map((k) => {
        const generals = k.obligations.filter((o) => o.kind === 'general').length;
        return (
          <div className="card" key={k.id}>
            <h3>
              {k.number} · {k.entity}
            </h3>
            <p className="muted">
              Del {k.startDate} al {k.endDate} · {k.obligations.length} obligaciones
            </p>
            {generals > 0 && (
              <form action={deleteGeneralObligations} className="inline" style={{ marginBottom: 10 }}>
                <input type="hidden" name="userId" value={c.id} />
                <input type="hidden" name="contractId" value={k.id} />
                <span className="muted">
                  Este contrato tiene {generals} obligaciones generales (G1, G2…), que no van en los informes.
                </span>
                <button type="submit" className="secondary">
                  Quitar las {generals} generales
                </button>
              </form>
            )}
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Obligación</th>
                  <th>Actividades</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {k.obligations.map((o) => (
                  <tr key={o.id}>
                    <td>{o.kind === 'general' ? `G${o.number}` : o.number}</td>
                    <td>{o.text}</td>
                    <td>
                      {o.activities
                        ? `${o.activities} actividad${o.activities === 1 ? '' : 'es'}`
                        : o.uses
                          ? 'En uso'
                          : '—'}
                    </td>
                    <td>
                      {o.uses === 0 && (
                        <form action={deleteObligation}>
                          <input type="hidden" name="userId" value={c.id} />
                          <input type="hidden" name="contractId" value={k.id} />
                          <input type="hidden" name="id" value={o.id} />
                          <button type="submit" className="secondary">
                            Quitar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

const WINDOW_MS = 24 * 3600_000;
const bogota = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** Write as Pascal (ADR-057): free text inside the 24-hour window, otherwise behind the notice template. */
function StaffMessage({ userId, lastInboundAt }: { userId: string; lastInboundAt: string | null }) {
  const closesAt = lastInboundAt ? new Date(lastInboundAt).getTime() + WINDOW_MS : 0;
  const open = closesAt > Date.now();
  return (
    <div className="card">
      <h3>Escribir en su conversación con Pascal</h3>
      <p className="muted">
        {open
          ? `Le llega de inmediato: escribió por última vez hace menos de 24 horas (puedes escribirle libremente hasta el ${bogota.format(closesAt)}).`
          : 'Pasaron más de 24 horas desde su último mensaje: Pascal le envía el aviso «Tengo listo un mensaje del equipo de CuentaFácil · Ver ahora» y tu mensaje le llega cuando lo toque o cuando vuelva a escribir.'}{' '}
        Sale firmado como «👤 Equipo CuentaFácil».
      </p>
      <form action={sendStaffMessage} className="stack">
        <input type="hidden" name="userId" value={userId} />
        <label>
          Mensaje
          <textarea name="text" rows={4} maxLength={1500} required />
        </label>
        <button type="submit">Enviar por Pascal</button>
      </form>
    </div>
  );
}
