import { adminAvailable, listAllies } from '@/lib/admin';
import { markBonusPaid } from '../entidades/actions';

export default async function AlliesPage() {
  if (!adminAvailable()) return <p className="muted">Disponible con Supabase configurado.</p>;
  const allies = await listAllies();
  const pending = allies.filter((a) => a.bonusStatus === 'pending');
  return (
    <>
      <h2>Programa de Aliados</h2>
      <p className="muted">
        El Aliado es la primera persona que trae una institución nueva. Sube un nivel por mes cuando sus
        referidos pagan 10 × (nivel + 1) cuentas en ese mes (una por persona); cada nivel le da una cuenta
        gratis y el nivel 10 lo hace Aliado Premium con un premio de $500.000 por transferencia (bonificación
        por referidos, con su cuenta de cobro). Los niveles se calculan solos el primer día de cada mes.
      </p>

      {pending.length > 0 && (
        <div className="card">
          <h3>Premios por pagar</h3>
          {pending.map((a) => (
            <form key={a.id} action={markBonusPaid} className="inline" style={{ marginBottom: 8 }}>
              <input type="hidden" name="id" value={a.id} />
              <span>
                <strong>{a.contractor}</strong> ({a.code}, {a.institution}) · $500.000
              </span>
              <input name="reference" placeholder="Referencia de la transferencia" required />
              <button type="submit">Marcar pagado</button>
            </form>
          ))}
        </div>
      )}

      <div className="card">
        {allies.length === 0 ? (
          <p className="muted">Todavía no hay Aliados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Aliado</th>
                <th>Institución</th>
                <th>Código</th>
                <th>Nivel</th>
                <th>Referidos</th>
                <th>Cuentas gratis</th>
                <th>Premio</th>
              </tr>
            </thead>
            <tbody>
              {allies.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.contractor}
                    <div className="muted">{a.phone}</div>
                  </td>
                  <td>{a.institution}</td>
                  <td>
                    <code>{a.code}</code>
                  </td>
                  <td>
                    {a.level} / 10 {a.premium && <span className="pill delivered">Premium</span>}
                    {a.lastLevelAt && (
                      <div className="muted">
                        último:{' '}
                        {new Date(a.lastLevelAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </div>
                    )}
                  </td>
                  <td>{a.referrals}</td>
                  <td>{a.freeReports}</td>
                  <td>
                    {a.bonusStatus === 'paid'
                      ? `Pagado (${a.bonusReference})`
                      : a.bonusStatus === 'pending'
                        ? 'Por pagar'
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
