import Link from 'next/link';
import { dataSource } from '@/lib/data';

export default async function EntitiesPage() {
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
                  <Link href={`/entidades/${e.id}/formatos`}>Formatos y variables →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
