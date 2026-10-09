/** Renders the synthetic HRNO account to out/ (DOCX + PDF). Optional: --base-activity / --base-supervision paths. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildTemplateContext } from '../src/context.js';
import { docxToPdf } from '../src/convert.js';
import { renderDocx } from '../src/render.js';
import { syntheticAccount } from '../src/sample.js';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '../src/templates/hrno.js';

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const outDir = arg('--out') ?? 'out';
await mkdir(outDir, { recursive: true });
const baseA = arg('--base-activity');
const baseS = arg('--base-supervision');
const activity = await buildHrnoActivityTemplate(baseA ? await readFile(baseA) : undefined);
const supervision = await buildHrnoSupervisionTemplate(baseS ? await readFile(baseS) : undefined);
await writeFile(join(outDir, 'PLANTILLA_Informe_Actividades_HRNO.docx'), activity);
await writeFile(join(outDir, 'PLANTILLA_Informe_Supervision_HRNO.docx'), supervision);

for (const period of ['full', 'prorated'] as const) {
  const ctx = await buildTemplateContext(await syntheticAccount({ period }));
  for (const [name, tpl] of [
    ['informe_actividades', activity],
    ['informe_supervision', supervision],
  ] as const) {
    const docx = await renderDocx(tpl, ctx);
    await writeFile(join(outDir, `${name}_${period}.docx`), docx);
    await writeFile(join(outDir, `${name}_${period}.pdf`), await docxToPdf(docx));
    console.log(`✓ ${name}_${period}`);
  }
}
