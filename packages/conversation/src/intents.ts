import { normalize } from './text.js';

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
  | 'my_data'
  | 'about'
  | 'add_contract'
  | 'ally'
  | 'undo_note'
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
  ['cancel', ['cancelar', 'salir']],
];

// Requests said in other words ("genera el informe", "hazme la cuenta de cobro", "borra esa nota").
// Only short messages are checked, so a long activity note that mentions a report stays a note.
const ACTION =
  '(genera|generar|generame|genere|haz|hazme|hacer|haga|crea|crear|creame|elabora|elaborar|elaborame|prepara|preparar|preparame|saca|sacar|sacame|arma|armar|armame|redacta|redactar|redactame|cierra|cerrar|cierrame|necesito|quiero|listo para|ya puedes hacer|puedes hacer|ya genera|ya haz)';
const REPORT =
  '(informe|informes|la cuenta|las cuentas|cuenta de cobro|cuentas de cobro|documentos|reporte|reportes)';
const PATTERNS: [Command, RegExp][] = [
  [
    'undo_note',
    /\b(borra|borrar|borrala|elimina|eliminar|eliminala|quita|quitar|quitala)\b.*\b(nota|actividad|registro|eso|esa|ultima)\b/,
  ],
  ['draft', new RegExp(`\\b${ACTION}\\b.*\\b${REPORT}\\b`)],
  ['status', /\b(que me falta|que falta|como voy|como va mi cuenta|estado de mi cuenta)\b/],
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

/** "nota: ..." forces a note even if the text looks like a command. */
export function forcedNote(text: string): string | null {
  const m = /^\s*nota\s*[:-]?\s+(.+)$/is.exec(text);
  return m ? m[1]!.trim() : null;
}
