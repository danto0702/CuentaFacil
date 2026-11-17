import { redirect } from 'next/navigation';
import { portalSession } from '@/lib/portal';
import { signIn } from '../../actions';
import { Flash, flashOf, Narrow, type Search } from '../../parts';
import { Submit } from '../../ui';

export default async function SignInPage({ searchParams }: { searchParams: Search }) {
  if (await portalSession()) redirect('/');
  const flash = await flashOf(searchParams);
  return (
    <Narrow>
      <h1>Ingresa a tu cuenta</h1>
      <p className="pt-muted">
        Revisa y edita tus actividades, carga tus soportes, descarga tus documentos y mira tus pagos. Todo
        queda sincronizado con Pascal en WhatsApp.
      </p>
      <Flash {...flash} />
      <form action={signIn} className="pt-card">
        <label>
          Correo
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <Submit className="pt-btn block" pending="Ingresando…">
          Ingresar
        </Submit>
        <p className="pt-muted" style={{ marginTop: 12, textAlign: 'center' }}>
          <a href="/recuperar">Olvidé mi contraseña</a>
        </p>
      </form>
      <div className="pt-card">
        <h3>¿Primera vez?</h3>
        <p className="pt-muted">
          Crea tu cuenta con tu correo y vincúlala a tu WhatsApp con un código. Necesitas haber empezado con
          Pascal en WhatsApp.
        </p>
        <a className="pt-btn ghost block" href="/registro">
          Crear mi cuenta
        </a>
      </div>
    </Narrow>
  );
}
