'use client';
import { useActionState } from 'react';
import { signIn } from './actions';

export default function LoginPage() {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <main className="login card">
      <h2>CuentasBot · Panel</h2>
      <form action={action}>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        {error && <p className="tag-bad">{error}</p>}
        <p>
          <button type="submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </p>
      </form>
      <p className="muted">
        El superadmin debe tener activada la verificación en dos pasos (MFA) en Supabase Auth.
      </p>
    </main>
  );
}
