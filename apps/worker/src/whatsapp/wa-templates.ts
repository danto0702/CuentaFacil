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

/** A gestor asks a person to authorize preparing their accounts (ADR-042). Payloads: dlg:yes|no:<id>. */
export const AUTORIZAR_GESTOR: TemplateDefinition = {
  name: 'autorizar_gestor',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Hola {{1}}, {{2}} quiere preparar tus cuentas de cobro con Pascal, el asistente de CuentaFacil. Si lo autorizas, podrá registrar tus actividades, cargar tus soportes y recibir tus documentos, y aceptas nuestra política de tratamiento de datos y los términos del servicio: https://pascalia.lat/terminos/ ¿Lo autorizas?',
      example: { body_text: [['Ana', 'Danilo Torrado']] },
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Autorizo' },
        { type: 'QUICK_REPLY', text: 'No autorizo' },
      ],
    },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [FALTAN_SOPORTES, AUTORIZAR_GESTOR];
