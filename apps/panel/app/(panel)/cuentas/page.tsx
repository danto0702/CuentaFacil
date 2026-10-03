import { formatCOP, formatDdMmYyyy } from '@cuentasbot/shared';
import { dataSource } from '@/lib/data';

export default async function AccountsPage() {
  const rows = await dataSource().listAccounts();
  return (
    <>
      <h2>Cuentas</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Contratista</th>
              <th>Entidad</th>
              <th>Cuenta</th>
              <th>Periodo</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.contract}-${r.number}`}>
                <td>{r.contract}</td>
                <td>{r.contractor}</td>
                <td>{r.entity}</td>
                <td>{r.number}</td>
                <td>
                  {formatDdMmYyyy(r.from)} – {formatDdMmYyyy(r.to)}
                </td>
                <td>{formatCOP(r.amount)}</td>
                <td>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
