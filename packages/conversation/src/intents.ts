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
  ['cancel', ['cancelar', 'salir']],
];

/** Exact (normalized) match against known commands and synonyms. Free text returns null. */
export function matchCommand(text: string): Command | null {
  const t = normalize(text);
  for (const [cmd, words] of COMMANDS) if (words.includes(t)) return cmd;
  return null;
}

/** "nota: ..." forces a note even if the text looks like a command. */
export function forcedNote(text: string): string | null {
  const m = /^\s*nota\s*[:-]?\s+(.+)$/is.exec(text);
  return m ? m[1]!.trim() : null;
}
