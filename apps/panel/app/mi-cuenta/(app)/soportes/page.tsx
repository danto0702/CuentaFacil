import { redirect } from 'next/navigation';
import {
  INTERNAL_SUPPORTS,
  listSupports,
  listSupportTypes,
  type PortalSupport,
  type PortalSupportType,
  portalSession,
  shortDate,
  todayBogota,
  validUntil,
} from '@/lib/portal';
import { removeSupport, uploadSupport } from '../../actions';
import { Flash, flashOf, type Search, waLink } from '../../parts';
import { Submit } from '../../ui';

function Status({ t, last }: { t: PortalSupportType; last?: PortalSupport }) {
  if (!last)
    return <span className={`pt-pill ${t.required ? 'bad' : ''}`}>{t.required ? 'Falta' : 'Opcional'}</span>;
  const until = validUntil(t, last);
  if (!until) return <span className="pt-pill ok">Cargado</span>;
  if (until < todayBogota()) return <span className="pt-pill bad">Vencido</span>;
  return <span className="pt-pill ok">Vigente hasta {shortDate(until)}</span>;
}

export default async function SupportsPage({ searchParams }: { searchParams: Search }) {
  const session = await portalSession();
  if (!session?.user) redirect('/ingresar');
  const flash = await flashOf(searchParams);
  const [types, supports] = await Promise.all([listSupportTypes(session.sb), listSupports(session.sb)]);
  const latest = (code: string) => supports.find((s) => s.code === code);
  const visible = types.filter((t) => !INTERNAL_SUPPORTS.has(t.code));
  const monthly = visible.filter((t) => t.frequency === 'every_period' && t.stage !== 'after_signature');
  const once = visible.filter((t) => t.frequency !== 'every_period' && t.stage !== 'after_signature');
  const later = visible.filter((t) => t.stage === 'after_signature');
  const known = new Set(types.map((t) => t.code));
  const others = supports.filter((s) => !known.has(s.code) && !INTERNAL_SUPPORTS.has(s.code));
  const uploadable = visible.filter((t) => t.code !== 'PILA');

  const row = (t: PortalSupportType) => {
    const last = latest(t.code);
    return (
      <li key={t.code}>
        <div className="pt-spread">
          <strong>{t.label}</strong>
          <Status t={t} last={last} />
        </div>
        {last && (
          <p className="pt-muted" style={{ margin: '4px 0 0' }}>
            {last.url ? (
              <a href={last.url} target="_blank" rel="noopener">
                {last.filename}
              </a>
            ) : (
              last.filename
            )}{' '}
            ·{' '}
            {last.issuedOn
              ? `expedido el ${shortDate(last.issuedOn)}`
              : `recibido el ${shortDate(last.receivedAt.slice(0, 10))}`}
          </p>
        )}
        {t.code === 'PILA' && (
          <p className="pt-muted" style={{ margin: '4px 0 0' }}>
            Envíala a Pascal por{' '}
            <a href={waLink('Te envío la planilla PILA')} target="_blank" rel="noopener">
              WhatsApp
            </a>
            : él lee los valores para la tabla de seguridad social.
          </p>
        )}
        {t.officialUrl && (
          <p className="pt-muted" style={{ margin: '4px 0 0' }}>
            <a href={t.officialUrl} target="_blank" rel="noopener">
              Descárgalo aquí ↗
            </a>
          </p>
        )}
      </li>
    );
  };

  return (
    <>
      <h1>Soportes</h1>
      <p className="pt-muted">
        Los certificados que pide tu entidad para cada cuenta. Los que vencen (antecedentes y afiliaciones) se
        piden de nuevo en cada cuenta.
      </p>
      <Flash {...flash} />

      <form action={uploadSupport} className="pt-card">
        <h2>Cargar un soporte</h2>
        <label>
          ¿Qué soporte es?
          <select name="code" required defaultValue="">
            <option value="" disabled>
              Elige el soporte
            </option>
            {uploadable.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
            <option value="OTRO">Otro documento</option>
          </select>
        </label>
        <label>
          Fecha de expedición (la que dice el certificado)
          <input type="date" name="issuedOn" max={todayBogota()} defaultValue={todayBogota()} />
        </label>
        <label>
          Archivo (PDF o foto, máximo 10 MB)
          <input type="file" name="file" accept="application/pdf,image/*" required />
        </label>
        <Submit pending="Subiendo…">Cargar soporte</Submit>
      </form>

      <section className="pt-card">
        <h2>Para cada cuenta</h2>
        <ul className="pt-list">{monthly.map(row)}</ul>
      </section>
      {once.length > 0 && (
        <section className="pt-card">
          <h2>Una sola vez</h2>
          <ul className="pt-list">{once.map(row)}</ul>
        </section>
      )}
      {later.length > 0 && (
        <section className="pt-card">
          <h2>Después de la firma</h2>
          <p className="pt-muted">Los expide la entidad; no tienes que cargarlos para generar tu cuenta.</p>
          <ul className="pt-list">{later.map(row)}</ul>
        </section>
      )}
      {(others.length > 0 || supports.length > 0) && (
        <section className="pt-card">
          <h2>Todo lo que has cargado</h2>
          <ul className="pt-list">
            {supports
              .filter((s) => !INTERNAL_SUPPORTS.has(s.code))
              .slice(0, 40)
              .map((s) => (
                <li key={s.id} className="pt-spread">
                  <span>
                    <strong>
                      {types.find((t) => t.code === s.code)?.label ??
                        (s.code === 'OTRO' ? 'Otro documento' : s.code)}
                    </strong>
                    <br />
                    <span className="pt-muted">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener">
                          {s.filename}
                        </a>
                      ) : (
                        s.filename
                      )}{' '}
                      · {shortDate(s.receivedAt.slice(0, 10))}
                    </span>
                  </span>
                  <form action={removeSupport}>
                    <input type="hidden" name="supportId" value={s.id} />
                    <Submit className="pt-btn danger small" pending="…" confirm="¿Quitar este soporte?">
                      Quitar
                    </Submit>
                  </form>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
