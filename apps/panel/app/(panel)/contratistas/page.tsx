import { dataSource } from '@/lib/data';

export default async function ContractorsPage() {
  const rows = await dataSource().listContractors();
  return (
    <>
      <h2>Contratistas</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>WhatsApp</th>
              <th>Contratos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.phoneMasked}</td>
                <td>{r.contracts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          Detalle, corrección de datos, conversación y reenvío de documentos llegan en la Fase 1.
        </p>
      </div>
    </>
  );
}
