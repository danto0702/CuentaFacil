import { listCommands } from 'docx-templates';
import { topLevelTags } from './catalog.js';
import { DELIMITERS } from './render.js';

export interface TemplateTagReport {
  /** Root identifiers found in the template. */
  used: string[];
  /** `var_<key>` identifiers (entity-defined variables). */
  entityVariables: string[];
  /** Identifiers that are neither in the base catalog nor entity variables. */
  unknown: string[];
  /** Commands that could not be understood. */
  errors: string[];
}

const JS_WORDS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'new',
  'typeof',
  'in',
  'of',
  'Math',
  'String',
  'Number',
  'Array',
  'JSON',
  'Date',
]);

/** Root identifiers referenced by a JS expression, ignoring loop variables ($x), properties and string literals. */
export function rootIdentifiers(code: string): string[] {
  const noStrings = code.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '');
  const out = new Set<string>();
  const re = /(^|[^.\w$])([A-Za-z_][\w]*)/g;
  for (let m = re.exec(noStrings); m; m = re.exec(noStrings)) {
    const id = m[2]!;
    if (!JS_WORDS.has(id)) out.add(id);
  }
  return [...out];
}

/** Extracts and classifies every tag used in a DOCX template (body, tables, headers, footers). */
export async function inspectTemplate(
  template: Buffer,
  entityVariableKeys: string[] = [],
): Promise<TemplateTagReport> {
  const catalog = topLevelTags();
  const known = new Set(entityVariableKeys.map((k) => `var_${k}`));
  const used = new Set<string>();
  const errors: string[] = [];
  let commands: Awaited<ReturnType<typeof listCommands>>;
  try {
    commands = await listCommands(template as unknown as ArrayBuffer, DELIMITERS);
  } catch (e) {
    return {
      used: [],
      entityVariables: [],
      unknown: [],
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
  for (const c of commands) {
    let expr = c.code;
    if (c.type === 'FOR') {
      const m = /^\s*\$?\w+\s+IN\s+(.+)$/i.exec(c.code);
      if (!m) {
        errors.push(`FOR mal formado: ${c.raw}`);
        continue;
      }
      expr = m[1]!;
    }
    if (c.type === 'END-FOR' || c.type === 'END-IF') continue;
    for (const id of rootIdentifiers(expr)) used.add(id);
  }
  const all = [...used].sort();
  return {
    used: all,
    entityVariables: all.filter((id) => id.startsWith('var_')),
    unknown: all.filter((id) => !catalog.has(id) && !known.has(id)),
    errors,
  };
}
