import { catalogEntries } from './catalog.js';

/** Markdown for docs/TEMPLATE_TAGS.md, generated from the catalog schema. */
export function renderTagsDoc(): string {
  const rows = catalogEntries()
    .filter((e) => e.path !== 'var')
    .map((e) => `| \`${e.path}\` | ${e.type} | ${e.description.replace(/\|/g, '\\|')} |`);
  return [
    '# Catálogo de etiquetas de plantillas',
    '',
    '> Archivo generado con `pnpm tags:doc` a partir de `packages/docgen/src/catalog.ts`. No lo edites a mano.',
    '',
    '## Cómo se usan',
    '',
    '- Valor simple: `{{ contract_number }}`. Todos los valores llegan ya formateados (moneda, fechas, mayúsculas).',
    '- Variables propias de la entidad (definidas en el panel): `{{ var_<clave> }}`, por ejemplo `{{ var_codigo_formato }}`.',
    "- Valor por defecto si viene vacío: `{{ x_arl_no || '_' }}`.",
    '- Repetir filas o párrafos: `{{FOR o IN obligations}}` … `{{$o.text}}` … `{{END-FOR o}}`.',
    '  Dentro del ciclo los campos se leen con `$` (`$o.number`, `$o.activities`). En tablas, el `FOR` y el `END-FOR` van en filas propias.',
    '- Condicional: `{{IF has_arl}}` … `{{END-IF}}`.',
    '- Imagen: `{{IMAGE $e.image}}` dentro de `{{FOR e IN $o.evidences}}`.',
    '- Las etiquetas pueden ir en el cuerpo, en tablas, en encabezados y en pies de página.',
    '',
    '## Etiquetas',
    '',
    '| Etiqueta | Tipo | Descripción |',
    '|----------|------|-------------|',
    ...rows,
    '',
  ].join('\n');
}
