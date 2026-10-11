import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminAvailable, getEntityDetail, listRegistryImports, listSupportTypes } from '@/lib/admin';
import { deleteSupportType, saveSupportType, updateEntity, uploadRegistry } from '../actions';

const FREQUENCY: [string, string][] = [
  ['every_period', 'Cada cuenta'],
  ['once', 'Una vez por contrato'],
  ['at_start', 'Al inicio del contrato'],
];
const STAGE: [string, string][] = [
  ['before_generation', 'Antes de generar la cuenta'],
  ['after_signature', 'Después de la firma (lo expide la entidad)'],
];
const STATUS: [string, string][] = [
  ['active', 'Activa (aparece en WhatsApp)'],
  ['pending_templates', 'Pendiente de configurar'],
  ['inactive', 'Inactiva'],
];

type Obj = Record<string, unknown>;
const get = (o: unknown, ...path: string[]): string => {
  let v: unknown = o;
  for (const k of path) v = v && typeof v === 'object' ? (v as Obj)[k] : undefined;
  return v === undefined || v === null ? '' : String(v);
};

export default async function EntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!adminAvailable())
    return (
      <p className="muted">
        La configuración de entidades necesita Supabase.{' '}
        <Link href={`/entidades/${id}/formatos`}>Formatos →</Link>
      </p>
    );
  const entity = await getEntityDetail(id);
  if (!entity) notFound();
  const [supports, registry] = await Promise.all([listSupportTypes(id), listRegistryImports(id)]);
  const st = entity.settings;
  return (
    <>
      <h2>
        {entity.shortName} · {entity.name}
      </h2>
      <p>
        <Link href={`/entidades/${id}/formatos`}>Formatos y variables de las plantillas →</Link>
      </p>

      <div className="card">
        <h3>Datos generales y variables del contrato</h3>
        <p className="muted">
          Estos valores son iguales para todos los contratistas de la entidad y tienen prioridad sobre lo que
          lee la inteligencia artificial en los documentos.
        </p>
        <form action={updateEntity} className="stack">
          <input type="hidden" name="id" value={id} />
          <div className="cols">
            <label>
              Nombre completo
              <input name="name" defaultValue={entity.name} required />
            </label>
            <label>
              Sigla
              <input name="shortName" defaultValue={entity.shortName} required maxLength={24} />
            </label>
            <label>
              NIT
              <input name="nit" defaultValue={entity.nit} />
            </label>
            <label>
              Municipio
              <input name="municipality" defaultValue={entity.municipality} />
            </label>
            <label>
              Departamento
              <input name="department" defaultValue={entity.department} />
            </label>
            <label>
              Estado
              <select name="status" defaultValue={entity.status}>
                {STATUS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Supervisor (nombre)
              <input
                name="supervisorName"
                defaultValue={get(st, 'contract_defaults', 'supervisor', 'name')}
              />
            </label>
            <label>
              Cargo del supervisor
              <input
                name="supervisorTitle"
                defaultValue={get(st, 'contract_defaults', 'supervisor', 'title')}
              />
            </label>
            <label>
              Vigencia de certificados (días)
              <input
                name="certificateMaxAgeDays"
                type="number"
                min={1}
                defaultValue={get(st, 'certificate_max_age_days') || '30'}
              />
            </label>
            <label>
              Texto por defecto de actividad
              <input name="defaultActivityText" defaultValue={get(st, 'default_activity_text')} />
            </label>
            <label>
              Lugar de reunión (informe de supervisión)
              <input name="meetingPlace" defaultValue={get(st, 'meeting', 'place')} />
            </label>
            <label>
              Hora inicio / fin
              <span style={{ display: 'flex', gap: 6 }}>
                <input
                  name="meetingStart"
                  defaultValue={get(st, 'meeting', 'start')}
                  placeholder="09:00 am"
                />
                <input name="meetingEnd" defaultValue={get(st, 'meeting', 'end')} placeholder="10:30 am" />
              </span>
            </label>
          </div>
          <button type="submit">Guardar</button>
        </form>
      </div>

      <div className="card">
        <h3>Lista de chequeo ({supports.length})</h3>
        <p className="muted">
          Lo que la entidad exige en cada cuenta. Pascal lo pide y lo revisa en el cierre.
        </p>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Soporte</th>
              <th>Cuándo</th>
              <th>Vigencia</th>
              <th>Paquete</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {supports.map((t) => (
              <tr key={t.id}>
                <td>
                  <code>{t.code}</code>
                </td>
                <td>
                  {t.label}
                  {!t.required && <span className="muted"> (opcional)</span>}
                  {t.officialUrl && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={t.officialUrl} target="_blank" rel="noreferrer">
                        portal
                      </a>
                    </>
                  )}
                  {t.instructions && <div className="muted">{t.instructions}</div>}
                </td>
                <td>
                  {FREQUENCY.find(([v]) => v === t.frequency)?.[1] ?? t.frequency}
                  {t.stage === 'after_signature' && <div className="muted">después de la firma</div>}
                </td>
                <td>{t.maxAgeDays ? `${t.maxAgeDays} días` : '—'}</td>
                <td>{t.bundle ? `${t.bundle} #${t.bundleOrder ?? ''}` : '—'}</td>
                <td>
                  <form action={deleteSupportType}>
                    <input type="hidden" name="entityId" value={id} />
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="secondary">
                      Quitar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4>Agregar o editar un soporte</h4>
        <p className="muted">Si el código ya existe, se actualiza.</p>
        <form action={saveSupportType} className="stack">
          <input type="hidden" name="entityId" value={id} />
          <div className="cols">
            <label>
              Código
              <input name="code" required placeholder="POLICIA" />
            </label>
            <label>
              Nombre
              <input name="label" required placeholder="Antecedentes judiciales (Policía)" />
            </label>
            <label>
              Cuándo se pide
              <select name="frequency" defaultValue="every_period">
                {FREQUENCY.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Etapa
              <select name="stage" defaultValue="before_generation">
                {STAGE.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Vigencia máxima (días)
              <input name="maxAgeDays" type="number" min={1} placeholder="30" />
            </label>
            <label>
              Paquete (PDF unido) y orden
              <span style={{ display: 'flex', gap: 6 }}>
                <input name="bundle" placeholder="ANTECEDENTES" />
                <input name="bundleOrder" type="number" min={1} placeholder="1" style={{ width: 70 }} />
              </span>
            </label>
            <label>
              Enlace oficial
              <input name="officialUrl" type="url" placeholder="https://…" />
            </label>
            <label>
              Instrucciones para el contratista
              <input name="instructions" placeholder="Consulta con tu cédula y guarda la página como PDF." />
            </label>
            <label className="check">
              <input type="checkbox" name="required" defaultChecked /> Obligatorio
            </label>
          </div>
          <button type="submit">Guardar soporte</button>
        </form>
      </div>

      <div className="card">
        <h3>Base de contratos (SECOP II)</h3>
        <p className="muted">
          Sube cada mes el Excel de contratos de la entidad (columnas CÓDIGOCONTRATO, CONTRATISTAS, FECHA
          ACTAINICIO…). Pascal toma de aquí la fecha del acta de inicio. Hoy hay{' '}
          <strong>{registry.total}</strong> contratos cargados.
        </p>
        <form action={uploadRegistry} className="inline">
          <input type="hidden" name="entityId" value={id} />
          <input type="file" name="file" accept=".xlsx" required />
          <button type="submit">Subir Excel</button>
        </form>
        {registry.imports.length > 0 && (
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Filas</th>
                <th>Nuevos / actualizados</th>
              </tr>
            </thead>
            <tbody>
              {registry.imports.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                  <td>{r.filename}</td>
                  <td>
                    {r.status === 'processed' ? 'Importado' : r.status === 'pending' ? 'En cola' : 'Falló'}
                    {r.error && <div className="tag-bad">{r.error}</div>}
                  </td>
                  <td>{r.rowCount}</td>
                  <td>{r.inserted == null ? '—' : `${r.inserted} / ${r.updated}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          Los archivos nuevos se importan en el minuto siguiente; recarga la página para ver el resultado.
        </p>
      </div>
    </>
  );
}
