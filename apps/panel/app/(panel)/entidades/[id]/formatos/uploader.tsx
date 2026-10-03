'use client';
import { useActionState } from 'react';
import { createVariable, type InspectState, inspectFormat } from './actions';

const TYPES = ['text', 'long_text', 'number', 'money', 'date', 'boolean', 'select', 'image'];
const SCOPES: [string, string][] = [
  ['entity', 'Entidad (valor fijo)'],
  ['contract', 'Por contrato'],
  ['period', 'Por cuenta'],
  ['user', 'Por contratista'],
];
const SOURCES: [string, string][] = [
  ['admin', 'Lo llena el panel'],
  ['ask_contractor', 'Lo pregunta el bot'],
  ['computed', 'Calculada'],
];

export function FormatUploader({ entityId }: { entityId: string }) {
  const [state, action, pending] = useActionState<InspectState, FormData>(inspectFormat, {});
  const r = state.report;
  return (
    <div className="card">
      <h3>1. Revisar un formato</h3>
      <p className="muted">
        Sube el DOCX de la entidad con etiquetas <code>{'{{ etiqueta }}'}</code>. Te digo cuáles existen en el
        catálogo, cuáles son variables de la entidad (<code>{'{{ var_clave }}'}</code>) y cuáles no reconozco.
      </p>
      <form action={action} className="inline">
        <input type="hidden" name="entityId" value={entityId} />
        <input type="file" name="file" accept=".docx" required />
        <button type="submit" disabled={pending}>
          {pending ? 'Revisando…' : 'Revisar etiquetas'}
        </button>
      </form>
      {state.error && <p className="tag-bad">{state.error}</p>}
      {r && (
        <div style={{ marginTop: 14 }}>
          <p>
            <strong>{state.fileName}</strong>: {r.used.length} etiquetas.{' '}
            {r.unknown.length === 0 && r.errors.length === 0 ? (
              <span className="tag-ok">✅ Lista para activarse.</span>
            ) : (
              <span className="tag-bad">Corrige lo siguiente antes de activarla.</span>
            )}
          </p>
          {r.errors.length > 0 && (
            <ul>
              {r.errors.map((e) => (
                <li key={e} className="tag-bad">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <table>
            <tbody>
              {r.used.map((t) => {
                const unknown = r.unknown.includes(t);
                const entityVar = t.startsWith('var_');
                return (
                  <tr key={t}>
                    <td>
                      <code>{t}</code>
                    </td>
                    <td className={unknown ? 'tag-bad' : entityVar ? 'tag-var' : 'tag-ok'}>
                      {unknown ? 'Desconocida' : entityVar ? 'Variable de la entidad' : 'Catálogo'}
                    </td>
                    <td>
                      {unknown && (
                        <form action={createVariable} className="inline">
                          <input type="hidden" name="entityId" value={entityId} />
                          <input
                            name="key"
                            defaultValue={t.replace(/^var_/, '')}
                            size={18}
                            aria-label="Clave"
                          />
                          <input
                            name="label"
                            placeholder="Nombre visible"
                            required
                            size={18}
                            aria-label="Nombre"
                          />
                          <select name="type" aria-label="Tipo">
                            {TYPES.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                          <select name="scope" aria-label="Alcance">
                            {SCOPES.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          <select name="source" aria-label="Origen">
                            {SOURCES.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          <input
                            name="defaultValue"
                            placeholder="Valor por defecto"
                            size={14}
                            aria-label="Valor por defecto"
                          />
                          <button type="submit" className="secondary">
                            Crear variable
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="muted">
            Si una etiqueta desconocida es un error de digitación, corrígela en Word usando el{' '}
            <a href="/catalogo">catálogo</a> y vuelve a subir el archivo. Al crear una variable, en el formato
            debe escribirse como <code>{'{{ var_clave }}'}</code>.
          </p>
        </div>
      )}
    </div>
  );
}
