/**
 * WhatsApp templates the worker registers in Meta at start-up if they are missing (docs/WHATSAPP_TEMPLATES.md).
 * Meta reviews each one; until it is APPROVED it cannot be sent.
 */
export interface TemplateDefinition {
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  components: Record<string, unknown>[];
}

/** Missing-supports reminder (ADR-036). The quick reply carries `guide:<contract>` when sent. */
export const FALTAN_SOPORTES: TemplateDefinition = {
  name: 'faltan_soportes',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Hola {{1}}, tu {{2}} cierra pronto y aún me faltan estos soportes: {{3}}. ¿Te guío para descargarlos uno por uno?',
      example: {
        body_text: [
          [
            'María',
            'informe 03 DE 03 (1 al 30 de septiembre de 2026)',
            'Antecedentes Policía, Afiliación EPS',
          ],
        ],
      },
    },
    { type: 'FOOTER', text: 'Responde STOP si no quieres recordatorios' },
    { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Guíame' }] },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [FALTAN_SOPORTES];
