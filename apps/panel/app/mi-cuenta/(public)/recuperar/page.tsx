import { requestRecovery } from '../../actions';
import { Flash, flashOf, Narrow, type Search } from '../../parts';
import { Submit } from '../../ui';

export default async function RecoverPage({ searchParams }: { searchParams: Search }) {
  const flash = await flashOf(searchParams);
  return (
    <Narrow>
      <h1>Recupera tu contraseña</h1>
      <p className="pt-muted">
        Escribe el correo de tu cuenta. Pascal te envía por WhatsApp, al número vinculado, un enlace para
        crear una contraseña nueva.
      </p>
      <Flash {...flash} />
      <form action={requestRecovery} className="pt-card">
        <label>
          Correo
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <Submit className="pt-btn block" pending="Enviando…">
          Enviarme el enlace por WhatsApp
        </Submit>
      </form>
      <p className="pt-muted" style={{ textAlign: 'center' }}>
        <a href="/ingresar">Volver a ingresar</a>
      </p>
    </Narrow>
  );
}
