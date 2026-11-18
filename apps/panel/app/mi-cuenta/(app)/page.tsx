import { formatCOP } from '@cuentasbot/shared';
import { redirect } from 'next/navigation';
import {
  INTERNAL_SUPPORTS,
  listCharges,
  listContracts,
  listNotes,
  listSupports,
  listSupportTypes,
  PERIOD_STATUS,
  portalSession,
  todayBogota,
  validUntil,
} from '@/lib/portal';
import { Flash, flashOf, type Search, waLink } from '../parts';

export default async function HomePage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const { sb, user } = session;
  const flash = await flashOf(searchParams);
  const [contracts, charges, types, supports] = await Promise.all([
    listContracts(sb),
    listCharges(sb),
    listSupportTypes(sb),
    listSupports(sb),
  ]);
  const pending = charges.filter((c) => c.status === 'pending');
  const today = todayBogota();
  // Certificates that must be renewed every report and are missing or expired today.
  const due = types.filter((t) => {
    if (INTERNAL_SUPPORTS.has(t.code) || t.code === 'PILA' || t.stage === 'after_signature' || !t.maxAgeDays)
      return false;
    const last = supports.find((s) => s.code === t.code);
    const until = last ? validUntil(t, last) : null;
    return !until || until < today;
  });
  const progress = await Promise.all(
    contracts.map(async (c) => {
      if (!c.current) return { notes: 0, missing: 0 };
      const notes = await listNotes(sb, c.id, c.current);
      const specific = c.obligations.filter((o) => o.kind === 'specific');
      const covered = new Set(notes.flatMap((n) => [n.obligationId, ...n.extraIds]));
      return { notes: notes.length, missing: specific.filter((o) => !covered.has(o.id)).length };
    }),
  );

  return (
    <>
      {session.acting ? (
        <>
          <h1>Cuentas de {user.fullName.split(' ').slice(0, 3).join(' ')}</h1>
          <p className="pt-muted">
            Trabajas con sus cuentas porque te autorizó. Lo que registres o cambies aquí queda en sus cuentas,
            y Pascal te responde a ti por WhatsApp.
          </p>
        </>
      ) : (
        <>
          <h1>Hola, {(session.me?.fullName ?? user.fullName).split(' ')[0]} 👋</h1>
          <p className="pt-muted">
            Aquí ves y corriges lo mismo que le cuentas a Pascal en WhatsApp. Lo que cambies aquí, él lo tiene
            en cuenta en tu próximo borrador.
          </p>
        </>
      )}
      <Flash {...flash} />

      {pending.length > 0 && (
        <div className="pt-note">
          <strong>
            Tienes {pending.length === 1 ? 'un pago pendiente' : `${pending.length} pagos pendientes`}
          </strong>{' '}
          por {formatCOP(pending.reduce((a, c) => a + c.amount, 0))}. <a href="/pagos">Ver pagos</a>
        </div>
      )}
      {due.length > 0 && (
        <div className="pt-note">
          <strong>Soportes por renovar:</strong> {due.map((t) => t.label).join(', ')}.{' '}
          <a href="/soportes">Cargarlos</a>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="pt-card">
          <h2>
            {session.acting ? 'Aún no tiene contratos configurados' : 'Aún no tienes contratos configurados'}
          </h2>
          <p>
            {session.acting
              ? 'Escríbele a Pascal por WhatsApp «cambiar persona», elige esta persona y envíale su contrato de SECOP y el clausulado.'
              : 'Envíale a Pascal por WhatsApp tu contrato de SECOP y el clausulado para empezar.'}
          </p>
          <a className="pt-btn pt-wa" href={waLink('Hola Pascal')} target="_blank" rel="noopener">
            Abrir WhatsApp
          </a>
        </div>
      )}

      <div className="pt-grid pt-grid-2">
        {contracts.map((c, i) => {
          const p = c.current;
          const pr = progress[i]!;
          return (
            <section key={c.id} className="pt-card">
              <div className="pt-kicker">{c.entity}</div>
              <h2>Contrato {c.label}</h2>
              {p ? (
                <>
                  <div className="pt-spread">
                    <p style={{ margin: 0 }}>{p.label}</p>
                    <span className={`pt-pill ${p.status === 'blocked_payment' ? 'warn' : 'info'}`}>
                      {PERIOD_STATUS[p.status] ?? p.status}
                    </span>
                  </div>
                  <hr className="pt-hr" />
                  <div className="pt-row" style={{ gap: 18 }}>
                    <div>
                      <div className="pt-big">{pr.notes}</div>
                      <div className="pt-muted">actividades</div>
                    </div>
                    <div>
                      <div
                        className="pt-big"
                        style={{ color: pr.missing ? 'var(--pt-warn)' : 'var(--pt-ok)' }}
                      >
                        {pr.missing}
                      </div>
                      <div className="pt-muted">obligaciones sin actividad</div>
                    </div>
                    <div>
                      <div className="pt-big">{formatCOP(p.amount)}</div>
                      <div className="pt-muted">valor de la cuenta</div>
                    </div>
                  </div>
                  <hr className="pt-hr" />
                  <div className="pt-row">
                    <a className="pt-btn" href={`/contratos/${c.id}`}>
                      Ver y editar actividades
                    </a>
                    <a className="pt-btn ghost" href={`/contratos/${c.id}/borrador?p=${p.number}`}>
                      {p.status === 'approved' ? 'Generar documentos' : 'Revisar el borrador'}
                    </a>
                    <a className="pt-btn ghost" href="/informes">
                      Otro informe
                    </a>
                  </div>
                </>
              ) : (
                <p className="pt-muted">No tienes cuentas pendientes en este contrato.</p>
              )}
            </section>
          );
        })}
      </div>
      <p className="pt-muted">Hoy es {today.split('-').reverse().join('/')}.</p>
    </>
  );
}
