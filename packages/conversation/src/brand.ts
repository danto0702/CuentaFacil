/** Commercial identity shown to contractors. "CuentasBot" is only the internal code name. */
export const BRAND = {
  assistant: 'Pascal',
  service: 'CuentaFacil',
  company: 'PascalIA',
  website: 'https://pascalia.lat/',
  productPage: 'https://pascalia.lat/cuentafacil/',
  privacyPolicy: 'https://pascalia.lat/politica-de-datos/',
  terms: 'https://pascalia.lat/terminos/',
  /** Contractor portal, the web complement of the chat (ADR-061). */
  portal: 'https://cuenta.pascalia.lat/',
  /** Pascal's WhatsApp number, for wa.me links (digits only). */
  whatsapp: '573123885012',
} as const;

export const SIGNATURE = `${BRAND.assistant}, el asistente de ${BRAND.service} de ${BRAND.company}`;
