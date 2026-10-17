// Rounded QR (error correction H) for the closing scene: round dots, square finder eyes (rounded eyes fail some readers), centre cleared for the logo.
// Run from composition/: npm i qrcode@1.5.4 && node make-qr.mjs
import QRCode from 'qrcode'; import fs from 'node:fs';
const E = process.env, url = 'https://pascalia.lat/cuentafacil/';
const qr = QRCode.create(url, { errorCorrectionLevel: 'H' }); const n = qr.modules.size, d = qr.modules.data, cell = 20;
const DOT = +(E.DOT || 0.45), LOGO = +(E.LOGO || 0.19), FR = +(E.FR ?? 0), FC = E.FC || '#1F1F1F', SHAPE = E.SHAPE || 'circle', RR = +(E.RR || 0.35);
const at = (r, c) => r >= 0 && c >= 0 && r < n && c < n && d[r * n + c];
const inF = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
const mid = n / 2; let s = '';
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  if (!at(r, c) || inF(r, c) || Math.hypot(r + .5 - mid, c + .5 - mid) < n * LOGO) continue;
  const cx = (c + .5) * cell, cy = (r + .5) * cell, h = cell * DOT;
  s += SHAPE === 'circle' ? `<circle cx="${cx}" cy="${cy}" r="${h}"/>` : `<rect x="${cx - h}" y="${cy - h}" width="${2 * h}" height="${2 * h}" rx="${2 * h * RR}"/>`;
}
const f = (r, c) => { const x = c * cell, y = r * cell;
  return `<rect x="${x + cell / 2}" y="${y + cell / 2}" width="${cell * 6}" height="${cell * 6}" rx="${cell * FR}" fill="none" stroke="#1F1F1F" stroke-width="${cell}"/>` +
    `<rect x="${x + cell * 2}" y="${y + cell * 2}" width="${cell * 3}" height="${cell * 3}" rx="${cell * FR / 2}" fill="${FC}"/>`; };
const S = n * cell;
fs.writeFileSync(E.OUT || 'assets/qr.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><g fill="#1F1F1F">${s}</g>${f(0, 0)}${f(0, n - 7)}${f(n - 7, 0)}</svg>`);
