import { redirect } from 'next/navigation';
import { portalSession } from '@/lib/portal';
import { askPascal, setPassword } from '../../actions';
import { Flash, flashOf, type Search, waLink } from '../../parts';
import { Submit } from '../../ui';

const BANK_TYPE: Record<string, string> = {
  ahorros: 'Ahorros',
  corriente: 'Corriente',
  deposito_electronico: 'Depósito electrónico',
};

export default async function ProfilePage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const flash = await flashOf(searchParams);
  const u = session.user;
  return (
    <>
      <h1>{session.acting ? `Datos de ${u.fullName.split(' ').slice(0, 3).join(' ')}` : 'Mis datos'}</h1>
      <Flash {...flash} />
      <section className="pt-card">
        <h2>{session.acting ? 'Datos para sus documentos' : 'Datos para tus documentos'}</h2>
        <dl className="pt-kv">
          <dt>Nombre</dt>
          <dd>{u.fullName}</dd>
          <dt>Documento</dt>
          <dd>
            {u.docType ?? 'CC'} ****{u.docLast4 ?? '----'}
            {u.docIssuedIn ? ` de ${u.docIssuedIn}` : ''}
          </dd>
          <dt>WhatsApp</dt>
          <dd>{u.phone.startsWith('+') ? `${u.phone.slice(0, 3)} ${u.phone.slice(3)}` : u.phone}</dd>
          <dt>Cuenta bancaria</dt>
          <dd>
            {u.bankName && u.bankLast4
              ? `${BANK_TYPE[u.bankType ?? ''] ?? ''} ${u.bankName} ****${u.bankLast4}`
              : 'Sin registrar'}
          </dd>
        </dl>
        <p className="pt-muted" style={{ marginTop: 12 }}>
          Por seguridad, tu cédula y tu cuenta bancaria se guardan cifradas y solo se muestran los últimos 4
          dígitos. Para cambiarlos, Pascal te pide el soporte por WhatsApp.
        </p>
        <div className="pt-row">
          <form action={askPascal}>
            <input type="hidden" name="text" value="cambiar mi cuenta bancaria" />
            <input type="hidden" name="back" value="/datos" />
            <Submit className="pt-btn ghost small" pending="Enviando…">
              Cambiar cuenta bancaria
            </Submit>
          </form>
          <a className="pt-btn ghost small" href={waLink('mis datos')} target="_blank" rel="noopener">
            Corregir otro dato por WhatsApp
          </a>
        </div>
      </section>

      {session.acting ? (
        <p className="pt-muted">
          Tu correo y tu contraseña de la cuenta web están en «Mis datos» de tus propias cuentas.
        </p>
      ) : (
        <section className="pt-card">
          <h2>Tu cuenta web</h2>
          <dl className="pt-kv" style={{ marginBottom: 12 }}>
            <dt>Correo</dt>
            <dd>{u.email}</dd>
          </dl>
          <details>
            <summary>Cambiar contraseña</summary>
            <form action={setPassword}>
              <input type="hidden" name="back" value="datos" />
              <label>
                Contraseña nueva (mínimo 8 caracteres)
                <input type="password" name="password" autoComplete="new-password" minLength={8} required />
              </label>
              <label>
                Repítela
                <input type="password" name="password2" autoComplete="new-password" minLength={8} required />
              </label>
              <Submit>Guardar contraseña</Submit>
            </form>
          </details>
        </section>
      )}
    </>
  );
}
