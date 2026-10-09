import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data';
import { FormatUploader } from './uploader';

export default async function FormatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ds = dataSource();
  const entity = await ds.getEntity(id);
  if (!entity) notFound();
  const vars = await ds.listVariables(id);
  return (
    <>
      <h2>{entity.shortName} · Formatos y variables</h2>

      <div className="card">
        <h3>Formatos base incluidos</h3>
        <p className="muted">
          Plantillas con etiquetas construidas a partir de los formatos de HRNO. Descárgalas, ajústalas en
          Word si hace falta y súbelas abajo para validarlas.
        </p>
        <p className="inline" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="button" href="/api/plantillas/activity_report">
            Informe de actividades (.docx)
          </a>
          <a className="button" href="/api/plantillas/supervision_report">
            Informe de supervisión (.docx)
          </a>
        </p>
      </div>

      <FormatUploader entityId={id} />

      <div className="card">
        <h3>2. Vista previa</h3>
        <p className="muted">
          Llena el formato con una cuenta de prueba (datos ficticios) y las variables de la entidad.
        </p>
        <form action="/api/preview" method="post" encType="multipart/form-data" className="inline">
          <input type="hidden" name="entityId" value={id} />
          <input type="file" name="file" accept=".docx" required />
          <label className="muted">
            <input type="checkbox" name="pdf" value="1" /> PDF
          </label>
          <button type="submit">Descargar vista previa</button>
        </form>
      </div>

      <div className="card">
        <h3>Variables de la entidad</h3>
        {vars.length === 0 ? (
          <p className="muted">Aún no hay variables. Se crean desde la revisión de un formato.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Alcance</th>
                <th>Origen</th>
                <th>Por defecto</th>
              </tr>
            </thead>
            <tbody>
              {vars.map((v) => (
                <tr key={v.key}>
                  <td>
                    <code>{`{{ var_${v.key} }}`}</code>
                  </td>
                  <td>{v.label}</td>
                  <td>{v.type}</td>
                  <td>{v.scope}</td>
                  <td>{v.source}</td>
                  <td>{v.defaultValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
