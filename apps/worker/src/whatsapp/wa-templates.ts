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

/** Missing-supports reminder (ADR-036), as approved by Meta. The quick reply opens the checklist. */
export const FALTAN_SOPORTES: TemplateDefinition = {
  name: 'faltan_soportes',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Hola {{1}}, para tu cuenta de {{2}} aún me faltan estos soportes: {{3}}. Envíamelos por aquí cuando los tengas.',
      example: { body_text: [['María', 'septiembre de 2026', 'Antecedentes Policía, Afiliación EPS']] },
    },
    { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: '¿Qué me falta?' }] },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [FALTAN_SOPORTES];
