import { formatCOP } from '@cuentasbot/shared';
import { adminAvailable } from '@/lib/admin';
import { billingSettings, contractorOptions, listCashCodes, listCharges, showCode } from '@/lib/billing';
import { setBillingMode } from './actions';
import { CashCodeForm } from './code-form';

const STATUS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  free: 'Gratis (Aliado)',
  pilot: 'Piloto',
  cancelled: 'Anulado',
};
const METHOD: Record<string, string> = {
  wompi: 'Wompi',
  cash_code: 'Código en efectivo',
  free_grant: 'Cuenta gratis',
  pilot: 'Piloto',
};
const day = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

export default async function BillingPage() {
  if (!adminAvailable()) return <p className="muted">Disponible con Supabase configurado.</p>;
  const [settings, charges, codes, contractors] = await Promise.all([
    billingSettings(),
    listCharges(),
    listCashCodes(),
    contractorOptions(),
  ]);
  return (
    <>
      <h2>Cobros</h2>

      <div className="card">
        <h3>Modo de cobro</h3>
        <p className="muted">
          En <strong>piloto</strong> no se cobra nada. En <strong>cobro</strong>, antes de entregar cada
          informe Pascal usa una cuenta gratis del Aliado, un código en efectivo o el enlace de pago de Wompi;
          Cada contrato nuevo se activa cuando se paga su configuración.
        </p>
        <form action={setBillingMode} className="inline">
          <label>
            <input type="radio" name="mode" value="pilot" defaultChecked={settings.mode === 'pilot'} /> Piloto
          </label>
          <label>
            <input type="radio" name="mode" value="live" defaultChecked={settings.mode === 'live'} /> Cobro
          </label>
          <label>
            Configuración ${' '}
            <input
              name="setup"
              type="number"
              min="1"
              defaultValue={settings.prices.setup}
              style={{ width: 100 }}
            />
          </label>
          <label>
            Informe ${' '}
            <input
              name="report"
              type="number"
              min="1"
              defaultValue={settings.prices.report}
              style={{ width: 100 }}
            />
          </label>
          <button type="submit">Guardar</button>
        </form>
        <p>
          Modo actual:{' '}
          <span className={`pill ${settings.mode === 'live' ? 'delivered' : ''}`}>
            {settings.mode === 'live' ? 'Cobro' : 'Piloto'}
          </span>
        </p>
      </div>

      <div className="card">
        <h3>Código de pago en efectivo</h3>
        <p className="muted">
          Cuando un contratista te paga en efectivo, genera su código y envíaselo. Solo funciona en su
          conversación, por el valor indicado, una vez, y vence a los 30 días.
        </p>
        <CashCodeForm contractors={contractors} prices={settings.prices} />
        {codes.length > 0 && (
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Contratista</th>
                <th>Valor</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code}>
                  <td>
                    <code>{showCode(c.code)}</code>
                  </td>
                  <td>{c.contractor}</td>
                  <td>{formatCOP(c.amount)}</td>
                  <td>{day(c.expiresAt)}</td>
                  <td>
                    {c.usedAt
                      ? `Usado ${day(c.usedAt)}`
                      : new Date(c.expiresAt) < new Date()
                        ? 'Vencido'
                        : 'Disponible'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Cobros</h3>
        {charges.length === 0 ? (
          <p className="muted">Todavía no hay cobros.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contratista</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Medio</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.id}>
                  <td>{day(c.createdAt)}</td>
                  <td>{c.contractor}</td>
                  <td>
                    {c.product === 'setup' ? 'Configuración' : `Informe ${c.report ?? ''}`} · {c.contract}
                  </td>
                  <td>{formatCOP(c.amount)}</td>
                  <td>{STATUS[c.status] ?? c.status}</td>
                  <td>{c.method ? (METHOD[c.method] ?? c.method) : '—'}</td>
                  <td>
                    <code>{c.reference}</code>
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
