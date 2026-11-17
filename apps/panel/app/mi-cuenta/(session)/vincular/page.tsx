import { redirect } from 'next/navigation';
import { portalSession } from '@/lib/portal';
import { signOut } from '../../actions';
import { Narrow, waLink } from '../../parts';
import { AutoRefresh } from '../../ui';

export default async function LinkPage() {
  const session = await portalSession();
  if (!session) redirect('/ingresar');
  if (session.user) redirect('/');
  const { data: code, error } = await session.sb.rpc('portal_link_code');
  const message = `VINCULAR ${code}`;
  return (
    <Narrow>
      <AutoRefresh seconds={5} />
      <h1>Vincula tu WhatsApp</h1>
      <p>
        Para ver tus contratos aquí, envíale a Pascal este código{' '}
        <strong>desde el WhatsApp que usas con él</strong>. Así sabemos que la cuenta{' '}
        <strong>{session.email}</strong> es tuya.
      </p>
      {error || !code ? (
        <div className="pt-flash error">No pude crear tu código. Recarga la página en un momento.</div>
      ) : (
        <div className="pt-card">
          <div className="pt-code">{code}</div>
          <a className="pt-btn pt-wa block" href={waLink(message)} target="_blank" rel="noopener">
            Enviar «{message}» por WhatsApp
          </a>
          <p className="pt-muted" style={{ marginTop: 12 }}>
            Si el botón no abre WhatsApp, escríbele a Pascal (+57 312 388 5012) el mensaje{' '}
            <strong>{message}</strong>. El código vence en 30 minutos. Esta página se actualiza sola cuando
            Pascal lo reciba.
          </p>
        </div>
      )}
      <form action={signOut} style={{ textAlign: 'center' }}>
        <button type="submit" className="pt-btn ghost small">
          Usar otra cuenta
        </button>
      </form>
    </Narrow>
  );
}
