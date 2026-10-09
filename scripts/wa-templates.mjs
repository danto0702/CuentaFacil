// Creates the WhatsApp message templates defined in infra/whatsapp/templates.json
// in the WhatsApp Business Account (Meta Cloud API). Templates that already
// exist (same name and language) are skipped.
//
// Usage:
//   pnpm wa:templates            # dry run: shows what would be created
//   pnpm wa:templates --crear    # creates the missing templates
//
// Requires WA_BUSINESS_ACCOUNT_ID and WA_ACCESS_TOKEN (in .env or the environment).

import { readFile } from 'node:fs/promises';

const create = process.argv.includes('--crear');
const version = process.env.WA_GRAPH_API_VERSION || 'v23.0';
const wabaId = process.env.WA_BUSINESS_ACCOUNT_ID;
const token = process.env.WA_ACCESS_TOKEN;

if (!wabaId || !token) {
  console.error('Faltan WA_BUSINESS_ACCOUNT_ID y WA_ACCESS_TOKEN (ponlos en .env).');
  process.exit(1);
}

const base = `https://graph.facebook.com/${version}/${wabaId}/message_templates`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const templates = JSON.parse(
  await readFile(new URL('../infra/whatsapp/templates.json', import.meta.url), 'utf8'),
);

const existing = new Map();
let next = `${base}?fields=name,language,status&limit=100`;
while (next) {
  const res = await fetch(next, { headers });
  const body = await res.json();
  if (!res.ok) {
    console.error('No pude leer las plantillas existentes:', body.error?.message ?? body);
    process.exit(1);
  }
  for (const t of body.data) existing.set(`${t.name}/${t.language}`, t.status);
  next = body.paging?.next;
}

let failed = 0;
for (const template of templates) {
  const key = `${template.name}/${template.language}`;
  if (existing.has(key)) {
    console.log(`= ${template.name}: ya existe (${existing.get(key)})`);
    continue;
  }
  if (!create) {
    console.log(`+ ${template.name}: se crearía (usa --crear)`);
    continue;
  }
  const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify(template) });
  const body = await res.json();
  if (res.ok) {
    console.log(`✓ ${template.name}: creada, estado ${body.status} (${body.category})`);
  } else {
    failed++;
    const e = body.error ?? {};
    console.error(`✗ ${template.name}: ${e.error_user_msg ?? e.message ?? JSON.stringify(body)}`);
  }
}
process.exit(failed ? 1 : 0);
