import { dataSource } from '@/lib/data';

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
  const byStatus = Object.entries(
    accounts.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {}),
  );
  return (
    <>
      <h2>Inicio</h2>
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
