import Link from 'next/link';
import { adminAvailable } from '@/lib/admin';
import { dataSource } from '@/lib/data';
import { createEntity } from './actions';

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; solicitud?: string }>;
}) {
  const { nombre = '', solicitud = '' } = await searchParams;
  const entities = await dataSource().listEntities();
  return (
    <>
      <h2>Entidades</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Entidad</th>
              <th>NIT</th>
              <th>Municipio</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entities.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.shortName}</strong> · {e.name}
                </td>
                <td>{e.nit}</td>
                <td>{e.city}</td>
                <td>
                  <Link href={`/entidades/${e.id}`}>Configurar →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" id="nueva">
        <h3>Nueva entidad</h3>
        {adminAvailable() ? (
          <>
            <p className="muted">
              Queda en estado <em>pendiente</em>: configura la lista de chequeo, las variables y los formatos,
              y actívala para que aparezca en WhatsApp.
            </p>
            <form action={createEntity} className="stack">
              <input type="hidden" name="requestId" value={solicitud} />
              <label>
                Nombre completo
                <input name="name" defaultValue={nombre} required placeholder="ESE HOSPITAL …" />
              </label>
              <label>
                Sigla (se muestra en WhatsApp, máx. 24)
                <input name="shortName" required maxLength={24} placeholder="HEQC" />
              </label>
              <label>
                NIT
                <input name="nit" placeholder="800.000.000-0" />
              </label>
              <label>
                Municipio
                <input name="municipality" />
              </label>
              <label>
                Departamento
                <input name="department" defaultValue="Norte de Santander" />
              </label>
              <button type="submit">Crear entidad</button>
            </form>
          </>
        ) : (
          <p className="muted">Disponible con Supabase configurado.</p>
        )}
      </div>
    </>
  );
}
