import Link from 'next/link';
import { adminAvailable, listInstitutionRequests } from '@/lib/admin';
import { listOpenTickets } from '@/lib/billing';
import { dataSource } from '@/lib/data';
import { closeTicket } from './cobros/actions';

const STATUS: Record<string, string> = {
  scheduled: 'Programadas',
  collecting: 'Recolectando',
  ready_to_draft: 'Listas para redactar',
  draft_review: 'En revisión',
  approved: 'Aprobadas',
  generating: 'Generando',
  delivered: 'Entregadas',
  blocked_payment: 'Bloqueadas por pago',
};

export default async function Dashboard() {
  const ds = dataSource();
  const [accounts, contractors, entities] = await Promise.all([
    ds.listAccounts(),
    ds.listContractors(),
    ds.listEntities(),
  ]);
  const newRequests = adminAvailable()
    ? (await listInstitutionRequests()).filter((r) => r.status === 'pending').length
    : 0;
  const tickets = adminAvailable() ? await listOpenTickets() : [];
  const byStatus = Object.entries(
    accounts.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {}),
  );
  return (
    <>
      <h2>Inicio</h2>
      {tickets.length > 0 && (
        <div className="card">
          <h3>🙋 Contratistas que pidieron hablar con una persona</h3>
          <table>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.contractor}
                    <div className="muted">
                      {t.phone.startsWith('+') ? (
                        <a href={`https://wa.me/${t.phone.slice(1)}`}>{t.phone}</a>
                      ) : (
                        'Usuario de WhatsApp sin número visible: respóndele desde el número de Pascal'
                      )}
                    </div>
                  </td>
                  <td>{t.subject}</td>
                  <td className="muted">
                    {new Date(t.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                  </td>
                  <td>
                    <form action={closeTicket}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit">Atendido</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid">
        <div className="card">
          <div className="stat">{contractors.length}</div>
          <div className="muted">Contratistas</div>
        </div>
        <div className="card">
          <div className="stat">{entities.length}</div>
          <div className="muted">Entidades</div>
        </div>
        <div className="card">
          <div className="stat">{newRequests}</div>
          <div className="muted">
            <Link href="/solicitudes">Solicitudes de instituciones nuevas</Link>
          </div>
        </div>
        <div className="card">
          <div className="stat">{accounts.length}</div>
          <div className="muted">Cuentas (todos los periodos)</div>
        </div>
      </div>
      <div className="card">
        <h3>Cuentas por estado</h3>
        <table>
          <tbody>
            {byStatus.map(([s, n]) => (
              <tr key={s}>
                <td>{STATUS[s] ?? s}</td>
                <td>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          Ingresos, costos de IA y WhatsApp, y la cola de errores llegan en las fases 1 y 3.
        </p>
      </div>
    </>
  );
}
