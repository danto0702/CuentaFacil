import { formatCOP } from '@cuentasbot/shared';
import { redirect } from 'next/navigation';
import { listContracts, PERIOD_STATUS, type PortalPeriod, portalSession, todayBogota } from '@/lib/portal';
import { Flash, flashOf, type Search } from '../../parts';

/** Every report of every contract by its number: open its activities or its draft (the portal's report menu). */
const PILL: Record<string, string> = {
  delivered: 'ok',
  approved: 'ok',
  draft_review: 'info',
  blocked_payment: 'warn',
};

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const flash = await flashOf(searchParams);
  const contracts = await listContracts(session.sb);
  const today = todayBogota();
  const started = (p: PortalPeriod) => p.from <= today;

  return (
    <>
      <h1>{session.acting ? 'Sus informes' : 'Mis informes'}</h1>
      <p className="pt-muted">
        Escoge el informe por su número para ver o editar sus actividades y su borrador.
      </p>
      <Flash {...flash} />
      {contracts.length === 0 && <div className="pt-card">Aún no hay contratos configurados.</div>}
      {contracts.map((c) => (
        <section key={c.id} className="pt-card">
          <div className="pt-kicker">{c.entity}</div>
          <h2>Contrato {c.label}</h2>
          <ul className="pt-list pt-reports">
            {[...c.periods]
              .sort((a, b) => b.number - a.number)
              .map((p) => {
                const open = p.status !== 'delivered' && p.status !== 'generating';
                const current = c.current?.id === p.id;
                return (
                  <li key={p.id} className={current ? 'current' : ''}>
                    <div className="pt-spread">
                      <div>
                        <strong>{p.label.split(' · ')[0]}</strong>
                        {current && <span className="pt-pill info pt-ml">En curso</span>}
                        <div className="pt-muted">
                          {p.label.split(' · ')[1]} · {formatCOP(p.amount)}
                        </div>
                      </div>
                      <span className={`pt-pill ${PILL[p.status] ?? ''}`}>
                        {started(p) ? (PERIOD_STATUS[p.status] ?? p.status) : 'Aún no empieza'}
                      </span>
                    </div>
                    {started(p) && (
                      <div className="pt-row" style={{ marginTop: 8 }}>
                        <a className="pt-btn small" href={`/contratos/${c.id}?p=${p.number}`}>
                          {open ? 'Actividades' : 'Ver actividades'}
                        </a>
                        <a className="pt-btn ghost small" href={`/contratos/${c.id}/borrador?p=${p.number}`}>
                          {open ? 'Borrador' : 'Ver borrador'}
                        </a>
                        {!open && (
                          <a className="pt-btn ghost small" href="/documentos">
                            Documentos
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}
