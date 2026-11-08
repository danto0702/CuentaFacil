// Shared Playwright setup: local libs instead of blocked CDNs, mocked account API (no real accounts/emails).
const fs = require('fs');
const SP = '/tmp/claude-0/-home-user/0efeda94-64c8-51a1-94a3-c54bdb88b035/scratchpad';
const LIB = {
  'pdf.min.js': `${SP}/ps-libs/pdfjs-dist-3.11.174/package/build/pdf.min.js`,
  'pdf.worker.min.js': `${SP}/ps-libs/pdfjs-dist-3.11.174/package/build/pdf.worker.min.js`,
  'pdf-lib.min.js': `${SP}/ps-libs/pdf-lib-1.17.1/package/dist/pdf-lib.min.js`,
};
const iso = (d) => new Date(Date.now() + d * 86400000).toISOString();
const state = { otorgadas: [], firmas: 0 };
const cuenta = () => ({ correo: 'carlos.perez@correo.com', nombre: 'Carlos Pérez', plan: 'prueba', activo: true, prueba: true, nivel: 1, vence_en: iso(7), firmas_mes: 4 + state.firmas, solicitudes: { usadas: 0, cupo: 15, extra: 0 }, productos: {}, admin: false });
const HIST = [
  ['2026-11-07T15:42:00Z', 'Contrato de prestación de servicios.pdf', 'Contrato de servicios', 'RAD-2026-118', 'CP-0005-2026'],
  ['2026-11-05T20:10:00Z', 'Acta de entrega.pdf', 'Acta de entrega', '', 'CP-0004-2026'],
  ['2026-11-02T14:05:00Z', 'Cuenta de cobro octubre.pdf', 'Cuenta de cobro', 'RAD-2026-097', 'CP-0003-2026'],
  ['2026-10-29T16:30:00Z', 'Autorización de tratamiento de datos.pdf', 'Autorización', '', 'CP-0002-2026'],
  ['2026-10-21T13:12:00Z', 'Informe de actividades septiembre.pdf', 'Informe de actividades', 'RAD-2026-071', 'CP-0001-2026'],
];
async function setup(context) {
  await context.addInitScript(() => { try { localStorage.setItem('pascalpdf-sesion', 'demo-token'); } catch (e) {} });
  await context.route(/cdnjs\.cloudflare\.com|unpkg\.com/, (route) => {
    const name = route.request().url().split('/').pop();
    if (LIB[name]) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(LIB[name]) });
    route.abort();
  });
  await context.route(/supabase\.co\/functions/, async (route) => {
    const H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: H });
    let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const ok = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ ok: true, ...o }) });
    switch (b.accion) {
      case 'config': return ok({ google_cliente: null });
      case 'cuenta': return ok({ cuenta: cuenta() });
      case 'registrar_firmas': state.firmas += b.eventos.length; return ok({ registros: b.eventos.map((e, i) => ({ consecutivo: `CP-000${6 + i}-2026`, firmado_en: new Date().toISOString() })) });
      case 'historial': return ok({ eventos: [
        ...(state.firmas ? [[new Date(Date.now() - 2000).toISOString(), 'Cuenta de cobro noviembre.pdf', 'Cuenta de cobro', 'RAD-2026-131', 'CP-0006-2026']] : []), ...HIST,
      ].map(([t, d, o, r, c]) => ({ firmado_en: t, documento_nombre: d, objeto: o, radicado: r, consecutivo: c, firmante: 'Carlos Pérez', metodo: 'dibujada', app: 'pascalsign', documento_hash: 'a3f91c7e2b40d58e6a1f0c9b7d3e2a14' })) });
      case 'delegar_listar': return ok({ otorgadas: state.otorgadas, recibidas: [] });
      case 'delegar_crear': state.otorgadas.unshift({ id: 'd1', delegado_correo: b.delegado_correo, firma_nombre: b.firma.nombre, desde: b.desde, hasta: b.hasta, objetos: b.objetos, estado: 'activa', usos: 0 }); return ok({});
      case 'delegar_estado': state.otorgadas.forEach(d => { if (d.id === b.id) d.estado = b.estado; }); return ok({});
      default: return ok({});
    }
  });
}
module.exports = { setup, state };
