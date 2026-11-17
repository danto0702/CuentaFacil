import { setPassword } from '../../actions';
import { Flash, flashOf, Narrow, type Search } from '../../parts';
import { Submit } from '../../ui';

export default async function ResetPage({ searchParams }: { searchParams: Search }) {
  const flash = await flashOf(searchParams);
  return (
    <Narrow>
      <h1>Crea tu contraseña nueva</h1>
      <Flash {...flash} />
      <form action={setPassword} className="pt-card">
        <label>
          Contraseña nueva (mínimo 8 caracteres)
          <input type="password" name="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Repítela
          <input type="password" name="password2" autoComplete="new-password" minLength={8} required />
        </label>
        <Submit className="pt-btn block">Guardar contraseña</Submit>
      </form>
    </Narrow>
  );
}
