import { formatCOP } from '@cuentasbot/shared';
import { redirect } from 'next/navigation';
import { billing, listCharges, moment, portalSession } from '@/lib/portal';
import { wompiConfigured } from '@/lib/wompi';
import { payOnline, sendTransferReceipt } from '../../actions';
import { Flash, flashOf, type Search } from '../../parts';
import { Submit } from '../../ui';

const STATUS: Record<string, [string, string]> = {
  pending: ['Pendiente', 'warn'],
  paid: ['Pagado', 'ok'],
  free: ['Gratis (Aliado)', 'ok'],
  pilot: ['Sin costo (piloto)', 'ok'],
};
const METHOD: Record<string, string> = {
  wompi: 'pago en línea',
  cash_code: 'código en efectivo',
  free_grant: 'cuenta gratis',
  pilot: 'piloto',
  transfer: 'transferencia',
};

export default async function PaymentsPage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const flash = await flashOf(searchParams);
  const [charges, info] = await Promise.all([listCharges(session.sb), billing(session.sb)]);
  const online = wompiConfigured();
  const t = info.transfer;
  return (
    <>
      <h1>Pagos</h1>
      <p className="pt-muted">
        La configuración de cada contrato y cada informe se pagan antes de recibir los documentos. Puedes
        pagar en línea (tarjeta, PSE, Nequi, QR o botón Bancolombia){t ? ' o por transferencia' : ''}.
      </p>
      <Flash {...flash} />
      {charges.length === 0 && <div className="pt-card">No tienes cobros.</div>}
      {charges.map((c) => {
        const [label, tone] = STATUS[c.status] ?? [c.status, ''];
        const pending = c.status === 'pending';
        return (
          <section key={c.id} className="pt-card">
            <div className="pt-spread">
              <span>
                <strong>{c.concept}</strong>
                <br />
                <span className="pt-muted">
                  {moment(c.createdAt)} · Ref. {c.reference}
                  {c.method ? ` · ${METHOD[c.method] ?? c.method}` : ''}
                </span>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span className="pt-big" style={{ fontSize: 20 }}>
                  {formatCOP(c.amount)}
                </span>
                <br />
                <span className={`pt-pill ${pending && c.transferSentAt ? 'info' : tone}`}>
                  {pending && c.transferSentAt ? 'Transferencia en verificación' : label}
                </span>
              </span>
            </div>
            {pending && !c.transferSentAt && (
              <>
                <hr className="pt-hr" />
                <div className="pt-row">
                  {online && (
                    <form action={payOnline}>
                      <input type="hidden" name="chargeId" value={c.id} />
                      <Submit className="pt-btn" pending="Abriendo…">
                        Pagar en línea
                      </Submit>
                    </form>
                  )}
                </div>
                {t && (
                  <details style={{ marginTop: 12 }}>
                    <summary>Pagar por transferencia</summary>
                    <dl className="pt-kv">
                      <dt>Banco</dt>
                      <dd>{t.bank}</dd>
                      <dt>Cuenta de {t.accountType}</dt>
                      <dd>{t.accountNumber}</dd>
                      <dt>A nombre de</dt>
                      <dd>
                        {t.holder}
                        {t.holderDoc ? ` (${t.holderDoc})` : ''}
                      </dd>
                      <dt>Valor</dt>
                      <dd>{formatCOP(c.amount)}</dd>
                      <dt>Referencia</dt>
                      <dd>{c.reference} (escríbela en la descripción)</dd>
                    </dl>
                    <form action={sendTransferReceipt} style={{ marginTop: 12 }}>
                      <input type="hidden" name="chargeId" value={c.id} />
                      <label>
                        Comprobante (foto o PDF)
                        <input type="file" name="file" accept="application/pdf,image/*" required />
                      </label>
                      <Submit pending="Enviando…">Enviar comprobante</Submit>
                    </form>
                  </details>
                )}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
