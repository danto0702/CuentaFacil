import { MONTHS, normalize } from './text.js';

export type Command =
  | 'menu'
  | 'help'
  | 'status'
  | 'contracts'
  | 'draft'
  | 'generate'
  | 'resend'
  | 'cut_mode'
  | 'support'
  | 'stop_reminders'
  | 'start_reminders'
  | 'my_data'
  | 'about'
  | 'add_contract'
  | 'ally'
  | 'undo_note'
  | 'reset'
  | 'signature'
  | 'style'
  | 'delete_data'
  | 'payments'
  | 'describe'
  | 'guide'
  | 'people'
  | 'add_person'
  | 'revoke'
  | 'cancel';

const COMMANDS: [Command, string[]][] = [
  ['menu', ['menu', 'inicio', 'opciones', 'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches']],
  ['help', ['ayuda', 'como funciona', 'instrucciones']],
  ['status', ['estado', 'que me falta', 'faltantes', 'checklist', 'pendientes', 'como voy']],
  ['contracts', ['mis contratos', 'contratos']],
  [
    'draft',
    ['ver borrador', 'borrador', 'cerrar', 'cerrar informe', 'cerrar cuenta', 'redactar', 'redactar informe'],
  ],
  ['generate', ['generar', 'generar documentos', 'generar informe', 'generar cuenta']],
  ['resend', ['reenviar', 'reenviar documentos', 'enviame los documentos']],
  ['cut_mode', ['cambiar corte', 'corte', 'tipo de corte', 'cambiar periodo']],
  ['support', ['soporte', 'hablar con soporte', 'hablar con alguien', 'asesor']],
  ['stop_reminders', ['stop', 'no mas recordatorios', 'detener recordatorios', 'parar recordatorios']],
  ['start_reminders', ['activar recordatorios', 'quiero recordatorios', 'encender recordatorios']],
  ['my_data', ['mis datos']],
  [
    'about',
    [
      'pascalia',
      'conocer pascalia',
      'servicios',
      'servicios de pascalia',
      'quienes son',
      'quien eres',
      'mas informacion',
      'saber mas',
      'pagina web',
      'sitio web',
    ],
  ],
  ['add_contract', ['agregar contrato', 'nuevo contrato', 'configurar contrato', 'registrar contrato']],
  ['ally', ['aliado', 'mi codigo', 'codigo de aliado', 'mis referidos', 'referidos', 'programa de aliados']],
  [
    'undo_note',
    ['borrar nota', 'borrar ultima nota', 'eliminar nota', 'eliminar ultima nota', 'deshacer', 'borrar eso'],
  ],
  [
    'reset',
    ['reiniciar', 'reiniciar cuenta', 'reiniciar informe', 'resetear', 'resetear cuenta', 'empezar de nuevo'],
  ],
  [
    'describe',
    [
      'describir contrato',
      'describir contratos',
      'descripcion del contrato',
      'descripcion de contrato',
      'cambiar descripcion',
      'nombre del contrato',
      'renombrar contrato',
      'ponerle nombre al contrato',
    ],
  ],
  [
    'payments',
    [
      'mis pagos',
      'pagos',
      'que debo',
      'cuanto debo',
      'debo algo',
      'pagos pendientes',
      'estado de pagos',
      'estado de cuenta',
      'mis cobros',
    ],
  ],
  [
    'delete_data',
    ['borrar mis datos', 'borra mis datos', 'eliminar mis datos', 'suprimir mis datos', 'eliminar mi cuenta'],
  ],
  [
    'style',
    [
      'informe anterior',
      'mi informe anterior',
      'cambiar informe anterior',
      'quitar informe anterior',
      'estilo de redaccion',
      'mi estilo',
      'mi forma de escribir',
    ],
  ],
  [
    'signature',
    [
      'firma',
      'mi firma',
      'cargar firma',
      'cargar mi firma',
      'subir firma',
      'cambiar firma',
      'actualizar firma',
    ],
  ],
  [
    'guide',
    [
      'certificados',
      'antecedentes',
      'afiliaciones',
      'guiame',
      'descargar certificados',
      'descargar antecedentes',
      'mis certificados',
      'soportes',
    ],
  ],
  [
    'people',
    [
      'cambiar persona',
      'cambiar de persona',
      'personas',
      'mis personas',
      'personas a cargo',
      'otra persona',
      'cuentas de otra persona',
      'mis cuentas',
    ],
  ],
  [
    'revoke',
    [
      'revocar',
      'revocar autorizacion',
      'quitar autorizacion',
      'quitar gestor',
      'quitar acceso',
      'dejar de gestionar',
      'autorizaciones',
    ],
  ],
  ['add_person', ['agregar persona', 'nueva persona', 'agregar otra persona', 'anadir persona']],
  [
    'cancel',
    [
      'cancelar',
      'salir',
      'olvidalo',
      'olvida',
      'olvidate',
      'dejalo',
      'dejalo asi',
      'no quiero',
      'no quiero seguir',
      'mejor no',
      'detente',
      'para',
      'atras',
      'volver',
    ],
  ],
];

// Requests said in other words ("genera el informe", "hazme la cuenta de cobro", "borra esa nota").
// Only short messages are checked, so a long activity note that mentions a report stays a note.
const ACTION =
  '(genera|generar|generame|genere|haz|hazme|hacer|haga|crea|crear|creame|elabora|elaborar|elaborame|prepara|preparar|preparame|saca|sacar|sacame|arma|armar|armame|redacta|redactar|redactame|cierra|cerrar|cierrame|necesito|quiero|listo para|ya puedes hacer|puedes hacer|ya genera|ya haz)';
const REPORT =
  '(informe|informes|la cuenta|las cuentas|cuenta de cobro|cuentas de cobro|documentos|reporte|reportes)';
const REDO =
  // Stems, so every form counts: rehacer, rehace, rehaz, rehaga, rehízo, regenera, repite, reenvía…
  '(reha\\w*|rehiz\\w*|regener\\w*|repit\\w*|repet\\w*|reenvi\\w*|(volver|vuelve|vuelva|vuelvas) a (generar|hacer|enviar|sacar|mandar))';
const RESET =
  '(reinici\\w*|resete\\w*|reset|(empezar|empecemos|empieza|comenzar|comencemos) de (nuevo|cero)|borra(r)? todo)';
const CONTINUE =
  '(iniciemos|iniciar|inicia|empecemos|empezar|empieza|comencemos|comenzar|realizar|realicemos|hagamos|sigamos|seguimos|seguir|sigue|continuemos|continuar|continua|trabajemos|trabajar|trabajando|volvamos|vamos|ver|veamos|muestrame|abre|abrir|retomemos|retomar)';
const PATTERNS: [Command, RegExp][] = [
  [
    'undo_note',
    /\b(borra|borrar|borrala|elimina|eliminar|eliminala|quita|quitar|quitala)\b.*\b(nota|actividad|registro|eso|esa|ultima)\b/,
  ],
  ['resend', new RegExp(`\\b${REDO}\\b.*\\b${REPORT}\\b`)],
  ['draft', new RegExp(`\\b${ACTION}\\b.*\\b${REPORT}\\b`)],
  ['status', /\b(que me falta|que falta|como voy|como va mi cuenta|estado de mi cuenta)\b/],
  // «¿Debo la configuración del contrato 0385?», «ya pagué el informe?»
  [
    'payments',
    /\b(debo|adeudo|ya pague|ya esta pagad[oa]|cuanto (debo|vale|cuesta)|tengo que pagar)\b.*\b(configuracion|informe|cuenta|contrato|pago)\b|\b(debo|adeudo) algo\b/,
  ],
];
const MAX_WORDS_FOR_PATTERNS = 8;

/** Known commands: exact synonyms, or a short request in other words. Free text returns null. */
export function matchCommand(text: string): Command | null {
  const t = normalize(text);
  for (const [cmd, words] of COMMANDS) if (words.includes(t)) return cmd;
  if (t.split(' ').length > MAX_WORDS_FOR_PATTERNS) return null;
  for (const [cmd, re] of PATTERNS) if (re.test(t)) return cmd;
  return null;
}

/**
 * «Quiero anotar una actividad», «registrar actividad», «nueva actividad»: the contractor wants to
 * record something but has not said what. Never saved as an activity.
 */
export function isNoteRequest(text: string): boolean {
  const t = normalize(text)
    .replace(/[^a-zñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.split(' ').length > 9) return false;
  const verb =
    '(anotar|anota|anoto|registrar|registra|registro|agregar|agrega|añadir|anadir|reportar|cargar|subir|meter|poner|apuntar)';
  const what =
    '(una |otra |la |mi |mis |las |unas |nueva |nuevas |algo|lo de hoy)*\\s*(actividad|actividades|nota|notas|algo|lo de hoy)?';
  return (
    new RegExp(
      `^(hola )?((yo )?(quiero|quisiera|voy a|vamos a|necesito|deseo|me gustaria|puedo|podemos|ayudame a|para) )?${verb} ?${what}( por favor)?$`,
    ).test(t) ||
    /^(nueva|otra) (actividad|nota)( por favor)?$/.test(t) ||
    /^tengo (una|otra) (actividad|nota)( para anotar| para registrar)?$/.test(t)
  );
}

/** "nota: ..." forces a note even if the text looks like a command. */
export function forcedNote(text: string): string | null {
  const m = /^\s*nota\s*[:-]?\s+(.+)$/is.exec(text);
  return m ? m[1]!.trim() : null;
}

export interface MonthRequest {
  /** 1..12 */
  month: number;
  /** The contractor asked to redo (regenerate) a report already delivered. */
  redo: boolean;
  /** The contractor asked to start the report over (delete its notes and draft). */
  reset?: boolean;
}

/**
 * A short message about the report of a given month: "informe de julio", "sigamos con la cuenta de
 * agosto", "rehacer julio". It must not be taken as an activity for whatever Pascal was asking.
 */
export function matchMonthRequest(text: string): MonthRequest | null {
  const t = normalize(text);
  if (t.split(' ').length > MAX_WORDS_FOR_PATTERNS + 2) return null;
  const m = new RegExp(`\\b(${MONTHS.join('|')})\\b`).exec(t);
  if (!m) return null;
  if (new RegExp(`\\b${RESET}\\b`).test(t))
    return { month: MONTHS.indexOf(m[1]!) + 1, redo: false, reset: true };
  const redo = new RegExp(`\\b${REDO}\\b`).test(t);
  if (redo) return { month: MONTHS.indexOf(m[1]!) + 1, redo };
  // "Entregué el informe de julio" is an activity; "sigamos con el informe de julio" is a request.
  const aboutReport = new RegExp(`\\b${REPORT}\\b`).test(t);
  const asks = new RegExp(`\\b(${ACTION}|${CONTINUE})\\b`).test(t) || t.split(' ').length <= 4;
  if (!aboutReport || !asks) return null;
  return { month: MONTHS.indexOf(m[1]!) + 1, redo };
}
