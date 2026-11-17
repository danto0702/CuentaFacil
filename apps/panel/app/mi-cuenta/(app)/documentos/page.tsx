import { redirect } from 'next/navigation';
import { listContracts, listPackages, moment, portalSession } from '@/lib/portal';
import { askPascal } from '../../actions';
import { Flash, flashOf, type Search } from '../../parts';
import { Submit } from '../../ui';

export default async function DocumentsPage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const flash = await flashOf(searchParams);
  const [contracts, packages] = await Promise.all([
    listContracts(session.sb),
    listPackages(session.sb, session.user.id),
  ]);
  return (
    <>
      <h1>Documentos</h1>
      <p className="pt-muted">
        Pascal genera tu informe de actividades, la cuenta de cobro y el borrador de supervisión, y te los
        envía por WhatsApp. Aquí descargas los paquetes de los últimos 30 días o pides que te los reenvíe.
      </p>
      <Flash {...flash} />

      <section className="pt-card">
        <h2>Paquetes para SECOP II</h2>
        {packages.length === 0 ? (
          <p className="pt-muted">No hay paquetes de los últimos 30 días.</p>
        ) : (
          <ul className="pt-list">
            {packages.map((p) => (
              <li key={`${p.name}-${p.createdAt}`} className="pt-spread">
                <span>
                  <strong>{p.name}</strong>
                  <br />
                  <span className="pt-muted">{p.createdAt ? moment(p.createdAt) : ''}</span>
                </span>
                {p.url && (
                  <a className="pt-btn small" href={p.url}>
                    Descargar
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {contracts.map((c) => {
        const delivered = c.periods.filter((p) => p.status === 'delivered').reverse();
        return (
          <section key={c.id} className="pt-card">
            <div className="pt-kicker">{c.entity}</div>
            <h2>Contrato {c.label}</h2>
            {c.current && (
              <div className="pt-spread" style={{ marginBottom: 12 }}>
                <span>
                  <strong>Cuenta en curso</strong>
                  <br />
                  <span className="pt-muted">{c.current.label}</span>
                </span>
                <form action={askPascal}>
                  <input type="hidden" name="text" value="generar" />
                  <input type="hidden" name="back" value="/documentos" />
                  <Submit className="pt-btn small" pending="Enviando…">
                    Generar
                  </Submit>
                </form>
              </div>
            )}
            {delivered.length === 0 ? (
              <p className="pt-muted">Aún no tienes cuentas entregadas en este contrato.</p>
            ) : (
              <ul className="pt-list">
                {delivered.map((p) => (
                  <li key={p.id} className="pt-spread">
                    <span>
                      {p.label}
                      <br />
                      <span className="pt-pill ok">Entregada</span>
                    </span>
                    <form action={askPascal}>
                      <input type="hidden" name="reply" value={`redo:${c.id}:${p.number}`} />
                      <input type="hidden" name="back" value="/documentos" />
                      <Submit className="pt-btn ghost small" pending="Enviando…">
                        Reenviar por WhatsApp
                      </Submit>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
