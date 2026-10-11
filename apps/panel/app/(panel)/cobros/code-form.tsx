'use client';
import { useActionState } from 'react';
import type { ContractorOption } from '@/lib/billing';
import { type CashCodeState, createCashCode } from './actions';

export function CashCodeForm({
  contractors,
  prices,
}: {
  contractors: ContractorOption[];
  prices: { setup: number; report: number };
}) {
  const [state, action, pending] = useActionState<CashCodeState, FormData>(createCashCode, {});
  const cop = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
  return (
    <form action={action} className="inline">
      <select name="userId" required defaultValue="">
        <option value="" disabled>
          Contratista…
        </option>
        {contractors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select name="product" defaultValue="report">
        <option value="report">Informe ({cop(prices.report)})</option>
        <option value="setup">Configuración de un contrato ({cop(prices.setup)})</option>
      </select>
      <button type="submit" disabled={pending}>
        {pending ? 'Generando…' : 'Generar código'}
      </button>
      {state.code && (
        <span className="tag-ok">
          ✅ Código: <strong>{state.code}</strong> (vence en 30 días)
        </span>
      )}
      {state.error && <span className="tag-bad">{state.error}</span>}
    </form>
  );
}
