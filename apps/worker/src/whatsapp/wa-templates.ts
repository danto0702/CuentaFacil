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

/** The same reminder for a gestor, naming whose account it is (ADR-042). Payload who:<id>:status. */
export const FALTAN_SOPORTES_GESTOR: TemplateDefinition = {
  name: 'faltan_soportes_gestor',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Hola {{1}}, para la cuenta de {{2}} de {{3}} aún faltan estos soportes: {{4}}. Envíamelos por aquí cuando los tengas.',
      example: {
        body_text: [
          ['Danilo', 'Ana María Pérez', 'septiembre de 2026', 'Antecedentes Policía, Afiliación EPS'],
        ],
      },
    },
    { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Ver sus soportes' }] },
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

/**
 * Something Pascal could not send because the 24-hour window was closed (ADR-043). The quick reply
 * (payload held:show) delivers it.
 */
export const AVISO_PENDIENTE: TemplateDefinition = {
  name: 'aviso_pendiente',
  language: 'es',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Hola {{1}}, tengo listo {{2}}. Toca Ver ahora y te lo envío por aquí.',
      example: { body_text: [['María', 'los documentos de tu cuenta']] },
    },
    { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Ver ahora' }] },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [
  FALTAN_SOPORTES,
  FALTAN_SOPORTES_GESTOR,
  AUTORIZAR_GESTOR,
  AVISO_PENDIENTE,
];
