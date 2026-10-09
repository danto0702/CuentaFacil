/**
 * Local WhatsApp simulator (Phase 0). Uses the production orchestrator and document generator with
 * an in-memory store, a fake AI and synthetic data.
 *
 *   pnpm sim                         interactive chat as the demo contractor
 *   pnpm sim -- --fecha 2026-08-31   simulate another date
 *   pnpm sim -- --script file.txt    run a scripted conversation
 *   pnpm sim -- --reset              start again from the demo data
 */
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { DEMO_PHONES } from '@cuentasbot/conversation';
import { renderOutgoing } from './render.js';
import { Session } from './session.js';

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = resolve(import.meta.dirname, '..');
const today = arg('--fecha') ?? '2026-09-28';
const outDir = resolve(arg('--out') ?? join(root, 'out', today));

const session = await Session.open({
  stateFile: join(root, '.sim', 'state.json'),
  outDir,
  today,
  phone: arg('--telefono') ?? DEMO_PHONES.maria,
  reset: args.includes('--reset'),
  ...(arg('--base-activity') ? { baseActivity: arg('--base-activity')! } : {}),
  ...(arg('--base-supervision') ? { baseSupervision: arg('--base-supervision')! } : {}),
});

const HELP = `Comandos del simulador:
  (texto)              mensaje normal de WhatsApp
  1, 2, 3…             presionar el botón / opción N del último mensaje
  /foto [ruta]         enviar una foto (sin ruta: foto de prueba)
  /pdf <nombre>        enviar un PDF de prueba
  /adjuntar <ruta>     enviar un archivo local como documento
  /audio <texto>       nota de voz (la transcripción simulada es el texto)
  /boton <id>          responder con un id de botón
  /fecha AAAA-MM-DD    cambiar la fecha simulada
  /telefono +57…       cambiar de contratista (${Object.values(DEMO_PHONES).join(', ')})
  /ayuda  /salir`;

async function handleLine(line: string): Promise<boolean> {
  const t = line.trim();
  if (!t || t.startsWith('#')) return true;
  if (t === '/salir') return false;
  if (t === '/ayuda') {
    console.log(HELP);
    return true;
  }
  if (t.startsWith('/fecha ')) {
    session.setDate(t.slice(7).trim());
    console.log(`📅 Fecha simulada: ${t.slice(7).trim()}`);
    return true;
  }
  if (t.startsWith('/telefono ')) {
    session.phone = t.slice(10).trim();
    console.log(`📱 Ahora escribes desde ${session.phone}`);
    return true;
  }
  const inbound = await session.toInbound(t);
  if (!inbound) return true;
  const { out, files } = await session.send(inbound);
  let f = 0;
  for (const o of out) console.log(renderOutgoing(o, o.type === 'document' ? files[f++] : undefined));
  return true;
}

console.log(
  `Pascal · CuentaFacil de Pascalia · simulador local · fecha ${today} · ${session.phone}\nEscribe /ayuda para ver los comandos.\n`,
);

const script = arg('--script');
if (script) {
  for (const line of (await readFile(script, 'utf8')).split('\n')) {
    if (line.trim() && !line.trim().startsWith('#')) console.log(`\n👤 ${line.trim()}`);
    if (!(await handleLine(line))) break;
  }
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  while (true) {
    const line = await rl.question('\n👤 ');
    if (!(await handleLine(line))) break;
  }
  rl.close();
}
