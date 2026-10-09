import { catalogEntries } from '@cuentasbot/docgen';

export default function CatalogPage() {
  const rows = catalogEntries().filter((e) => e.path !== 'var');
  return (
    <>
      <h2>Catálogo de etiquetas</h2>
      <div className="card">
        <p className="muted">
          Úsalas en los formatos como <code>{'{{ etiqueta }}'}</code>. Las listas se recorren con{' '}
          <code>{'{{FOR o IN obligations}} … {{$o.text}} … {{END-FOR o}}'}</code>.
        </p>
        <table>
          <thead>
            <tr>
              <th>Etiqueta</th>
              <th>Tipo</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path}>
                <td>
                  <code>{r.path}</code>
                </td>
                <td>{r.type}</td>
                <td>{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
