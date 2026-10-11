import { BRAND } from './brand.js';
import type { AllyStatus, ReferralResult } from './domain.js';
import type { Outgoing } from './ports.js';

/** Programa de Aliados (ADR-032): message texts and code handling. */
export const ALLY_CODE_RE = /\bALI-[A-Z0-9]{4}\b/i;
export const ALLY_STEP = 10;
export const ALLY_MAX_LEVEL = 10;
export const ALLY_PREMIUM_BONUS = '$500.000';

const text = (t: string): Outgoing => ({ type: 'text', text: t });

export function findAllyCode(input: string): string | null {
  return input.match(ALLY_CODE_RE)?.[0].toUpperCase() ?? null;
}

export function shareLink(code: string): string {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(`Hola Pascal, vengo de parte de ${code}`)}`;
}

const rules = `• Cada mes subes un nivel cuando tus referidos pagan *10 × el siguiente nivel* cuentas ese mes (10 para el nivel 1, 20 para el 2… hasta 100). Cuenta una cuenta por persona al mes.\n• Cada nivel te da *una cuenta gratis*.\n• En el nivel ${ALLY_MAX_LEVEL} eres *Aliado Premium*: además de tus ${ALLY_MAX_LEVEL} cuentas gratis recibes *${ALLY_PREMIUM_BONUS}* por transferencia.`;

/** Sent when the contractor becomes the Aliado of a new institution. */
export function allyWelcome(code: string, institution: string): Outgoing[] {
  return [
    text(
      `🤝 Además, eres el *Aliado* de ${BRAND.service} en *${institution}*.\n\nTu código es *${code}*. Compártelo con tus compañeros: quienes se registren con él quedan como tus referidos.\n${rules}`,
    ),
    text(`Este es tu enlace para compartir (abre el chat con tu código ya escrito):\n${shareLink(code)}`),
  ];
}

export function allyStatusText(s: AllyStatus): Outgoing[] {
  const next = s.level < ALLY_MAX_LEVEL ? (s.level + 1) * ALLY_STEP : null;
  return [
    text(
      `🤝 *Programa de Aliados*\n• Tu código: *${s.code}*\n• Nivel: *${s.level} de ${ALLY_MAX_LEVEL}*${s.premium ? ' 🏆 Aliado Premium' : ''}\n• Referidos registrados: ${s.referrals}\n• Cuentas gratis disponibles: ${s.freeReports}${
        next
          ? `\n• Para el nivel ${s.level + 1} necesitas ${next} cuentas pagadas de tus referidos en un mismo mes.`
          : ''
      }\n\n${rules}`,
    ),
    text(`Enlace para compartir:\n${shareLink(s.code)}`),
  ];
}

export function levelUpText(level: number): Outgoing {
  return level >= ALLY_MAX_LEVEL
    ? text(
        `🏆 ¡Felicitaciones! Llegaste al nivel ${ALLY_MAX_LEVEL}: ahora eres *Aliado Premium*. Ganaste otra cuenta gratis y un premio de *${ALLY_PREMIUM_BONUS}*. Te escribiremos para coordinar la transferencia.`,
      )
    : text(
        `🎉 ¡Subiste al *nivel ${level}* del Programa de Aliados! Tu próxima cuenta de cobro es *gratis*. Gracias por recomendarnos.`,
      );
}

export function referralText(result: ReferralResult, code: string): Outgoing {
  return text(
    {
      ok: `✅ Quedaste registrado como referido de ${code}. ¡Gracias por llegar por recomendación!`,
      invalid: `No encontré el código ${code}. Revisa que esté bien escrito (ejemplo: ALI-7K3M).`,
      own: 'Ese es tu propio código de Aliado; compártelo con tus compañeros. 😉',
      already: 'Ya estás registrado como referido de un Aliado; ese dato no se puede cambiar.',
      late: 'El código de un Aliado solo se puede registrar en los primeros 30 días desde que te registraste.',
    }[result],
  );
}

export const NOT_ALLY_TEXT = text(
  `🤝 El *Programa de Aliados* es para la primera persona que trae a ${BRAND.service} una institución nueva: recibe un código para recomendarnos, una cuenta gratis por cada nivel y, en el nivel ${ALLY_MAX_LEVEL}, un premio de ${ALLY_PREMIUM_BONUS}.\nSi tu institución todavía no está en el servicio, escribe *agregar contrato* y elige *Otra institución*.`,
);
