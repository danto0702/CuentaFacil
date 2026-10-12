import Link from 'next/link';
import { adminAvailable, listInstitutionRequests } from '@/lib/admin';
import { setRequestStatus } from '../entidades/actions';

const STATUS: Record<string, string> = {
  pending: 'Nueva',
  in_progress: 'En configuración',
  done: 'Lista',
  rejected: 'Descartada',
};

export default async function RequestsPage() {
  if (!adminAvailable()) return <p className="muted">Disponible con Supabase configurado.</p>;
  const requests = await listInstitutionRequests();
  return (
    <>
      <h2>Solicitudes de instituciones</h2>
      <p className="muted">
        Contratistas que eligieron <em>Otra institución</em> en WhatsApp. Con los modelos, la lista de
        documentos que pide la institución y el contrato crea la entidad, su lista de chequeo y sus formatos;
        luego avísale al contratista.
      </p>
      <div className="card">
        {requests.length === 0 ? (
          <p className="muted">No hay solicitudes.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Institución</th>
                <th>Contratista</th>
                <th>Documentos</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.institutionName}</strong>
                    <div className="muted">
                      {new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                    </div>
                    {r.firstForInstitution && <span className="pill delivered">Primera cuenta gratis</span>}
                  </td>
                  <td>
                    {r.contractor}
                    <div className="muted">{r.phone}</div>
                  </td>
                  <td>
                    {r.models.length > 0 ? (
                      r.models.map((m) => (
                        <div key={m.label}>
                          {m.url ? (
                            <a href={m.url} target="_blank" rel="noreferrer">
                              {m.label}
                            </a>
                          ) : (
                            m.label
                          )}
                        </div>
                      ))
                    ) : r.modelUrl ? (
                      <a href={r.modelUrl} target="_blank" rel="noreferrer">
                        Modelo de cuenta
                      </a>
                    ) : (
                      '—'
                    )}
                    {r.contractUrl ? (
                      <a href={r.contractUrl} target="_blank" rel="noreferrer">
                        Contrato
                      </a>
                    ) : (
                      '—'
                    )}
                    {r.required.length > 0 && (
                      <details>
                        <summary>Documentos que pide ({r.required.length})</summary>
                        <ul>
                          {r.required.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td>
                    <form action={setRequestStatus} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status}>
                        {Object.entries(STATUS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="secondary">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td>
                    <Link
                      href={`/entidades?nombre=${encodeURIComponent(r.institutionName)}&solicitud=${r.id}#nueva`}
                    >
                      Crear entidad →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
