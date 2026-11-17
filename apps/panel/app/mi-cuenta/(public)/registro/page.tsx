import { redirect } from 'next/navigation';
import { portalSession } from '@/lib/portal';
import { signUp } from '../../actions';
import { Flash, flashOf, Narrow, type Search, waLink } from '../../parts';
import { Submit } from '../../ui';

export default async function SignUpPage({ searchParams }: { searchParams: Search }) {
  if (await portalSession()) redirect('/');
  const flash = await flashOf(searchParams);
  return (
    <Narrow>
      <h1>Crea tu cuenta</h1>
      <ol className="pt-steps pt-muted">
        <li>Escribe tu correo y una contraseña.</li>
        <li>Te damos un código: envíaselo a Pascal desde tu WhatsApp para vincular tu cuenta.</li>
      </ol>
      <Flash {...flash} />
      <form action={signUp} className="pt-card">
        <label>
          Correo
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Contraseña (mínimo 8 caracteres)
          <input type="password" name="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Repite la contraseña
          <input type="password" name="password2" autoComplete="new-password" minLength={8} required />
        </label>
        <label className="pt-check">
          <input type="checkbox" name="terms" required />
          <span>
            Acepto los{' '}
            <a href="https://pascalia.lat/terminos/" target="_blank" rel="noopener">
              términos del servicio
            </a>{' '}
            y la{' '}
            <a href="https://pascalia.lat/politica-de-datos/" target="_blank" rel="noopener">
              política de tratamiento de datos
            </a>
            .
          </span>
        </label>
        <Submit className="pt-btn block" pending="Creando…">
          Crear mi cuenta
        </Submit>
      </form>
      <p className="pt-muted" style={{ textAlign: 'center' }}>
        ¿Ya tienes cuenta? <a href="/ingresar">Ingresa</a> · ¿Aún no usas Pascal?{' '}
        <a href={waLink('Hola Pascal')} target="_blank" rel="noopener">
          Escríbele por WhatsApp
        </a>
      </p>
    </Narrow>
  );
}
