/**
 * ESE Hospital Regional Noroccidental (HRNO) report formats, authored in code.
 *
 * - Without a base DOCX they build a self-contained template (synthetic header, used in CI).
 * - With the entity's original DOCX as base they keep its styles, header/footer and logos and only
 *   replace the body (and, for the activity report, the text header) — see `rebodyDocx`.
 *
 * Wording follows the entity's formats with the spelling fixes approved by the owner
 * ("M/CTE", "durante el periodo", "lo establecido", "Se pudo verificar", "a los 29 días").
 */
import { buildDocx, rebodyDocx } from '../container.js';
import { cell, cmd, cmdRow, OFICIO, p, row, table, usableWidth } from '../ooxml.js';

const W = usableWidth(OFICIO); // 8838 twips
const BLUE = 'DEEAF6';
const GREY = 'C0C0C0';
const F = { font: 'Arial', size: 20 } as const; // 10 pt
const SMALL = { font: 'Arial', size: 16 } as const;

const label = (text: string) => ({ text, opts: { bold: true } });

// ---------------------------------------------------------------------------
// Informe de Actividades
// ---------------------------------------------------------------------------

export function hrnoActivityHeader(): string {
  const h = { font: 'Arial Narrow', size: 20, bold: true, align: 'center' as const, spacingAfter: 0 };
  return [
    p('INFORME DE ACTIVIDADES', h),
    p('CONTRATO DE PRESTACION DE SERVICIOS ({{contract_object}})', h),
    p('No. {{contract_number}} DE {{contract_year}}', h),
    p('{{contractor_name}}', h),
    p('INFORME – No. {{report_label}} - {{period_range_upper}}', { ...h, spacingAfter: 120 }),
  ].join('');
}

function generalData(): string {
  const line = (runs: Parameters<typeof p>[0]) => p(runs, { ...F, spacingAfter: 80 });
  return [
    p('1.DATOS GENERALES', { ...F, bold: true, spacingAfter: 120 }),
    line([label('CONTRATO No. '), '{{contract_number}}   ', label('PROCESO: '), '{{process_name}}']),
    line([
      label('PLAZO DE EJECUCION  DESDE: '),
      '{{contract_start_date}}  ',
      label('HASTA: '),
      '{{contract_end_date}}',
    ]),
    line([label('PERIODO LA CUENTA: '), '{{period_range_upper}}']),
    line([label('NOMBRE Y APELLIDOS DEL CONTRATISTA: '), '{{contractor_name}}']),
    line([
      label('No. Documento de identificación: '),
      'C.C No. {{contractor_cedula}}   Régimen común _{{x_regime_common}}_  Régimen simplificado _{{x_regime_simplified}}_',
    ]),
    line([
      label('Consignar a la Cuenta No. '),
      '{{bank_account}}  ',
      label('Del Banco: '),
      "{{bank_name}}  Tipo de Cuenta Ahorros ({{x_account_savings || '__'}}) Corriente ({{x_account_checking || '__'}})",
    ]),
    line([label('Pago No. '), '{{report_number}} de {{report_total}}']),
    line([label('No. de Planilla de Aportes Salud y Pensión: '), '{{ss_planilla}}']),
    line([label('ARL: '), "Si ({{x_arl_yes || '_'}}) NO ({{x_arl_no || '_'}})"]),
  ].join('');
}

function socialSecurityTable(): string {
  const valueW = 2000;
  const r = (labelText: string, tag: string) =>
    row([
      cell(p(labelText, F), { width: W - valueW }),
      cell(p(tag, { ...F, align: 'right' }), { width: valueW }),
    ]);
  return table(
    [W - valueW, valueW],
    [
      row([
        cell(p('APORTES AL SISTEMA DE SEGURIDAD SOCIAL', { ...F, bold: true }), {
          width: W,
          span: 2,
          fill: BLUE,
        }),
      ]),
      r('APORTES OBLIGATORIOS EN SALUD (*):', '{{ss_eps_value}}'),
      r('APORTES OBLIGATORIOS EN PENSIÓN (*):', '{{ss_afp_value}}'),
      r('FONDO DE SOLIDARIDAD PENSIONAL (*):', '{{ss_fsp_value}}'),
      r('APORTE VOLUNTARIO AFC (*):', '{{ss_afc_value}}'),
      r('APORTE ARL (*):', '{{ss_arl_value}}'),
      row([
        cell(p('TOTAL APORTADO (*):', { ...F, bold: true }), { width: W - valueW }),
        cell(p('{{ss_total}}', { ...F, bold: true, align: 'right' }), { width: valueW }),
      ]),
      row([
        cell(
          p(
            '(*) El valor de los pagos correspondientes a los aportes obligatorios en salud, pensión y Fondo de Solidaridad Pensional deben estar calculados con base en el 40% de los honorarios mensuales (sin incluir IVA); en este valor deben estar excluidos los intereses de mora si estos fueron causados.',
            { ...SMALL, italic: true, align: 'both' },
          ),
          { width: W, span: 2 },
        ),
      ]),
    ],
  );
}

function obligationsTable(): string {
  const half = W / 2;
  const obligationRows = (list: string) => [
    cmdRow(`FOR o IN ${list}`, W, 2),
    row(
      [
        cell(p('{{$o.number}}. {{$o.text}}', { ...F, align: 'both' }), { width: half, vAlign: 'top' }),
        cell(
          [
            cmd('FOR a IN $o.activities', F),
            p('{{$a.text}}', { ...F, align: 'both', spacingAfter: 120 }),
            cmd('END-FOR a', F),
          ],
          {
            width: half,
            vAlign: 'top',
          },
        ),
      ],
      { cantSplit: false },
    ),
    cmdRow('END-FOR o', W, 2),
  ];
  return table(
    [half, half],
    [
      row(
        [
          cell(p('Obligaciones del Contrato', { ...F, bold: true, align: 'center' }), {
            width: half,
            fill: BLUE,
          }),
          cell(p('Actividades Realizadas por el Contratista', { ...F, bold: true, align: 'center' }), {
            width: half,
            fill: BLUE,
          }),
        ],
        { header: true },
      ),
      row([cell(p('Actividades Específicas', { ...F, bold: true }), { width: W, span: 2 })]),
      ...obligationRows('specific_obligations'),
      row([cell(p('Actividades Generales', { ...F, bold: true }), { width: W, span: 2 })]),
      ...obligationRows('general_obligations'),
    ],
  );
}

function sworn(): string {
  return [
    p('CERTIFICACIÓN JURAMENTADA', {
      ...F,
      bold: true,
      align: 'center',
      spacingBefore: 240,
      spacingAfter: 120,
      keepNext: true,
    }),
    p(
      'Como Contratista de la ESE HOSPITAL REGIONAL NOROCCIDENTAL y para dar cumplimiento a lo estipulado en el Artículo 4 del Decreto 2271 de junio 18 de 2009, certifico bajo la gravedad de juramento que los documentos soporte del pago de mis aportes obligatorios al Sistema General de Seguridad Social corresponden a los ingresos provenientes del Contrato No. {{contract_number}} del {{period_range_long}}.',
      { ...F, align: 'both', spacingAfter: 480, keepNext: true },
    ),
    p('NOMBRE Y FIRMA', { ...F, bold: true, keepNext: true, spacingAfter: 480 }),
    p('_____________________________________', { ...F, spacingAfter: 0, keepNext: true }),
    p('{{contractor_name}}', { ...F, bold: true, spacingAfter: 0, keepNext: true }),
    p('C.C No. {{contractor_cedula}} de {{contractor_city}}', F),
  ].join('');
}

function evidenceAnnex(): string {
  return [
    cmd('IF evidence_obligations.length > 0', F),
    p('ANEXOS – EVIDENCIAS', { ...F, bold: true, align: 'center', pageBreakBefore: true, spacingAfter: 240 }),
    cmd('FOR o IN evidence_obligations', F),
    p('Actividad {{$o.number}}.', { ...F, bold: true, spacingBefore: 120, keepNext: true }),
    // Inline images in one paragraph wrap two per line at 7.5 cm on an "oficio" page.
    p(['{{FOR e IN $o.evidences}}', '{{IMAGE $e.image}}', '  ', '{{END-FOR e}}'], {
      ...F,
      align: 'center',
      spacingAfter: 120,
    }),
    cmd('END-FOR o', F),
    cmd('END-IF', F),
  ].join('');
}

export function hrnoActivityBody(): string {
  return [
    table(
      [W],
      [
        row([
          cell(
            p('INFORME DE ACTIVIDADES CONTRATUALES - CONTRATO DE PRESTACIÓN DE SERVICIOS', {
              ...F,
              bold: true,
              align: 'center',
            }),
            {
              width: W,
              fill: BLUE,
            },
          ),
        ]),
        row([cell(generalData(), { width: W, vAlign: 'top' })]),
        row([cell(p('2. INFORMACION SEGURIDAD SOCIAL', { ...F, bold: true }), { width: W, fill: BLUE })]),
      ],
    ),
    p('', F),
    socialSecurityTable(),
    p('3. INFORME DE ACTIVIDADES', { ...F, bold: true, spacingBefore: 240, spacingAfter: 120 }),
    obligationsTable(),
    sworn(),
    evidenceAnnex(),
  ].join('');
}

/** Informe de Actividades HRNO. `base` = entity's original DOCX (optional). */
export async function buildHrnoActivityTemplate(base?: Buffer): Promise<Buffer> {
  const body = hrnoActivityBody();
  if (base) {
    return rebodyDocx(base, body, (name, xml) =>
      name.startsWith('word/header')
        ? xml.replace(/(<w:hdr[^>]*>)[\s\S]*(<\/w:hdr>)/, `$1${hrnoActivityHeader()}$2`)
        : xml,
    );
  }
  return buildDocx({
    body,
    page: OFICIO,
    header: hrnoActivityHeader(),
    defaultFont: 'Arial',
    defaultSize: 20,
    title: 'Informe de Actividades HRNO',
  });
}

// ---------------------------------------------------------------------------
// Informe de Supervisión (MA-GH-IS-03, versión 4.0)
// ---------------------------------------------------------------------------

const SUP = { font: 'Arial', size: 18 } as const; // 9 pt
const SUPB = { ...SUP, bold: true } as const;

export function hrnoSupervisionHeader(): string {
  const c = (text: string, width: number, opts: { span?: number; bold?: boolean } = {}) =>
    cell(p(text, { ...SMALL, bold: opts.bold ?? false, align: 'center', spacingAfter: 0 }), {
      width,
      ...(opts.span ? { span: opts.span } : {}),
    });
  const a = 2000;
  const b = W - 2 * a;
  return [
    table(
      [a, b, a],
      [
        row([
          c('ESE HRNO', a, { bold: true }),
          cell(
            [
              p('EMPRESA SOCIAL DEL ESTADO', { ...SMALL, bold: true, align: 'center', spacingAfter: 0 }),
              p('HOSPITAL REGIONAL NOROCCIDENTAL', {
                ...SMALL,
                bold: true,
                align: 'center',
                spacingAfter: 0,
              }),
              p('ABREGO-CONVENCIÓN-EL CARMEN-TEORAMA', { ...SMALL, align: 'center', spacingAfter: 0 }),
              p('NIT. 807.008.842-9', { ...SMALL, align: 'center', spacingAfter: 0 }),
            ],
            { width: b },
          ),
          c('', a),
        ]),
        row([c('', a), c('MACROPROCESO DE APOYO', b, { bold: true }), c('', a)]),
        row([c('', a), c('PROCESO: GESTIÓN DEL TALENTO HUMANO', b, { bold: true }), c('', a)]),
        row([
          c('Código: MA-GH-IS-03', a),
          c('INFORME SUPERVISIÓN DE CONTRATO', b, { bold: true }),
          c('Vigente: Enero 2024 · Versión: 4.0', a),
        ]),
      ],
    ),
    p('', SMALL),
  ].join('');
}

export function hrnoSupervisionFooter(): string {
  return p(
    '“Tu Bienestar, MI Compromiso” · ESE Hospital Regional Noroccidental · Ábrego, Norte de Santander',
    {
      ...SMALL,
      italic: true,
      align: 'center',
    },
  );
}

function sTitle(text: string, width: number, span: number): string {
  return row([cell(p(text, { ...SUPB, align: 'center' }), { width, span, fill: GREY })]);
}

function generalInfoTable(): string {
  const a = 4000;
  const b = (W - a) / 2;
  const l = (t: string) => cell(p(t, SUPB), { width: a });
  const v = (t: string, span = 1) =>
    cell(p(t, { ...SUP, align: 'center' }), { width: span === 2 ? W - a : b, span });
  return table(
    [a, b, b],
    [
      sTitle('INFORMACIÓN GENERAL DEL CONTRATO', W, 3),
      row([
        l('PERÍODO A QUE CORRESPONDE EL INFORME'),
        v('DESDE: {{period_start_date}}'),
        v('HASTA: {{period_end_date}}'),
      ]),
      row([l('FECHA DE INFORME DE SUPERVISIÓN'), v('{{report_date}}', 2)]),
      row([
        l('¿Se reporta algún desempeño deficiente o a mejorar?'),
        v('SI  {{x_deficient_performance_yes}}'),
        v('NO  {{x_deficient_performance_no}}'),
      ]),
      row([l('PORCENTAJE DE EJECUCIÓN DE LA CUENTA QUE SE CERTIFICA'), v('FÍSICA'), v('PRESUPUESTAL')]),
      row([l(''), v('{{physical_execution}}'), v('{{budget_execution}}')]),
      row([l('VALOR DEL CONTRATO'), v('{{contract_value}}', 2)]),
      row([l('PLAZO'), v('{{contract_term}}', 2)]),
      row([l('PRÓRROGA y/o ADICIÓN'), v('{{extension_text}}', 2)]),
      row([
        cell(p([label('OBJETO: '), '{{contract_object}}'], { ...SUP, align: 'both' }), { width: W, span: 3 }),
      ]),
    ],
  );
}

function attendeesTable(): string {
  const a = 2600;
  const c4 = [a, (W - a) / 3, (W - a) / 3, (W - a) / 3] as const;
  const rest = W - a;
  const l = (t: string) => cell(p(t, SUPB), { width: a });
  const v = (content: Parameters<typeof p>[0]) =>
    cell(p(content, { ...SUP, align: 'both' }), { width: rest, span: 3 });
  return table(
    [...c4],
    [
      sTitle('ASISTENTES A LA REUNIÓN', W, 4),
      row([l('Supervisor:'), v('{{supervisor_name_title}}')]),
      row([
        l('Por parte del contratista:'),
        v(
          '{{contractor_name}}, identificado con cédula de ciudadanía número {{contractor_cedula}} de {{contractor_city}}',
        ),
      ]),
      row([l('Otros asistentes:'), v('{{other_attendees}}')]),
      row([l('Lugar donde se realiza la reunión'), v('{{meeting_place}}')]),
      row([
        l('Hora de inicio (a.m./p.m.)'),
        cell(p('{{meeting_start}}', { ...SUP, align: 'center' }), { width: c4[1] }),
        cell(p('Hora de finalización (a.m./p.m.)', SUPB), { width: c4[2] }),
        cell(p('{{meeting_end}}', { ...SUP, align: 'center' }), { width: c4[3] }),
      ]),
    ],
  );
}

function objectiveTable(): string {
  const a = 2600;
  return table(
    [a, W - a],
    [
      sTitle('OBJETIVO DE LA REUNIÓN', W, 2),
      row([
        cell(
          p(
            'Recibo informe de actividades realizadas por parte del contratista durante el periodo del {{period_range_long}}, en cumplimiento a lo establecido en el contrato No. {{contract_number}}-{{contract_year}}.',
            { ...SUP, align: 'both' },
          ),
          { width: W, span: 2 },
        ),
      ]),
      sTitle(
        'VERIFICACIÓN DEL CUMPLIMIENTO DE LOS COMPROMISOS Y/O ACTIVIDADES CONTEMPLADAS EN EL CONTRATO',
        W,
        2,
      ),
      row([
        cell(p('Actividad / Compromiso', SUPB), { width: a }),
        cell(
          p(
            'Certificar que el informe de actividades {{report_number}} de {{report_total}} del presente contrato y demás documentos cumplen con los lineamientos exigidos para el respectivo pago por parte de Gestión Financiera de la ESE Hospital Regional Noroccidental.',
            { ...SUP, align: 'both' },
          ),
          { width: W - a },
        ),
      ]),
    ],
  );
}

function dutiesTable(): string {
  const cols = [600, 3638, 700, 700, 900, 1000, 600, 700];
  const heads = [
    'NÚMERO DE OBLIGACIÓN',
    'OBLIGACIÓN',
    'DEFICIENTE',
    'A MEJORAR',
    'SATISFACTORIO',
    'SOBRESALIENTE',
    'NO APLICA',
    'OBSERVACIONES',
  ];
  const tiny = { font: 'Arial', size: 14 } as const;
  const flag = (tag: string, i: number) =>
    cell(p(tag, { ...SUP, bold: true, align: 'center' }), { width: cols[i]! });
  return table(cols, [
    row(
      heads.map((h, i) =>
        cell(p(h, { ...tiny, bold: true, align: 'center' }), { width: cols[i]!, fill: GREY }),
      ),
      { header: true },
    ),
    cmdRow('FOR d IN contractor_duties', W, 8),
    row(
      [
        cell(p('{{$d.number}}', { ...SUP, align: 'center' }), { width: cols[0]! }),
        cell(p('{{$d.text}}', { ...SUP, align: 'left' }), { width: cols[1]! }),
        flag('{{$d.x_deficient}}', 2),
        flag('{{$d.x_improve}}', 3),
        flag('{{$d.x_satisfactory}}', 4),
        flag('{{$d.x_outstanding}}', 5),
        flag('{{$d.x_na}}', 6),
        cell(p('{{$d.observations}}', SUP), { width: cols[7]! }),
      ],
      { cantSplit: true },
    ),
    cmdRow('END-FOR d', W, 8),
    row([
      cell(p('Concepto general del cumplimiento de las obligaciones', SUPB), {
        width: cols[0]! + cols[1]!,
        span: 2,
      }),
      flag('{{overall_rating.x_deficient}}', 2),
      flag('{{overall_rating.x_improve}}', 3),
      flag('{{overall_rating.x_satisfactory}}', 4),
      flag('{{overall_rating.x_outstanding}}', 5),
      flag('{{overall_rating.x_na}}', 6),
      cell(p('', SUP), { width: cols[7]! }),
    ]),
  ]);
}

function socialSecurityVertical(): string {
  const a = W / 2;
  const r = (l: string, v: string) =>
    row([cell(p(l, SUPB), { width: a }), cell(p(v, { ...SUP, align: 'center' }), { width: a })]);
  return table(
    [a, a],
    [
      r('MES', '{{period_month}}'),
      r('Entidad de aporte en línea', '{{ss_platform}}'),
      r('Empresa de pensiones', '{{ss_afp}}'),
      r('Valor', '{{ss_afp_value}}'),
      r('Empresa administradora de salud', '{{ss_eps}}'),
      r('Valor', '{{ss_eps_value}}'),
      r('Administradora de riesgos laborales', '{{ss_arl}}'),
      r('Valor', '{{ss_arl_value}}'),
      r('Valor total de cotización', '{{ss_total}}'),
      r('N° de Planilla', '{{ss_planilla}}'),
      r('PIN', '{{ss_pin}}'),
      r('Entidad financiera', '{{ss_bank}}'),
      r('Periodo Cotización', '{{ss_period}}'),
      r('Fecha de pago', '{{ss_payment_date}}'),
    ],
  );
}

function activitiesApprovalTable(): string {
  const cols = [1600, W - 3200, 1600];
  return table(cols, [
    row(
      ['ACTIVIDAD RELACIONADA', 'OBLIGACIÓN ESPECIAL ASOCIADA', 'APROBACIÓN'].map((h, i) =>
        cell(p(h, { ...SUPB, align: 'center' }), { width: cols[i]!, fill: GREY }),
      ),
      { header: true },
    ),
    cmdRow('FOR o IN obligations', W, 3),
    row([
      cell(p('Actividad {{$o.number}}', SUP), { width: cols[0]! }),
      cell(p('{{$o.text}}', { ...SUP, align: 'both' }), { width: cols[1]! }),
      cell(p('{{$o.approval}}', { ...SUP, bold: true, align: 'center' }), { width: cols[2]! }),
    ]),
    cmdRow('END-FOR o', W, 3),
  ]);
}

function balanceTable(): string {
  const cols = [2700, 1800, 300, 2238, 1800];
  const lines: [string, string][] = [
    ['Valor inicial del contrato', '{{balance_initial}}'],
    ['Valor adiciones', '{{balance_additions}}'],
    ['Valor total del contrato', '{{balance_total}}'],
    ['Valor pagado', '{{balance_paid}}'],
    ['Valor causado que no se ha pagado', '{{balance_accrued_unpaid}}'],
    ['Valor total ejecutado', '{{balance_executed}}'],
    ['Valor no ejecutado', '{{balance_not_executed}}'],
  ];
  const payments = (field: 'voucher' | 'value') => [
    cmd('IF prior_payments.length === 0', SUP),
    p('-', { ...SUP, align: 'center' }),
    cmd('END-IF', SUP),
    cmd('FOR pp IN prior_payments', SUP),
    p(`{{$pp.${field}}}`, { ...SUP, align: 'center' }),
    cmd('END-FOR pp', SUP),
  ];
  return table(cols, [
    sTitle('BALANCE FINANCIERO DEL CONTRATO', W, 5),
    row([cell(p('Balance General del Contrato', SUPB), { width: W, span: 5 })]),
    row([
      cell(p('Concepto', SUPB), { width: cols[0]! }),
      cell(p('Valor', { ...SUPB, align: 'center' }), { width: cols[1]! }),
      cell(p('', SUP), { width: cols[2]!, borders: false }),
      cell(p('Concepto (Anticipo, actas, pagos)', { ...SUPB, align: 'center' }), { width: cols[3]! }),
      cell(p('Valor', { ...SUPB, align: 'center' }), { width: cols[4]! }),
    ]),
    ...lines.map(([l, v], i) =>
      row([
        cell(p(l, SUP), { width: cols[0]! }),
        cell(p(v, { ...SUP, align: 'right' }), { width: cols[1]! }),
        cell(p('', SUP), { width: cols[2]!, borders: false }),
        i === 0
          ? cell(payments('voucher'), { width: cols[3]!, vMerge: 'restart', vAlign: 'top' })
          : cell(p('', SUP), { width: cols[3]!, vMerge: 'continue' }),
        i === 0
          ? cell(payments('value'), { width: cols[4]!, vMerge: 'restart', vAlign: 'top' })
          : cell(p('', SUP), { width: cols[4]!, vMerge: 'continue' }),
      ]),
    ),
  ]);
}

function commitmentsTable(): string {
  const cols = [4000, (W - 4000) / 2, (W - 4000) / 2];
  return table(cols, [
    sTitle('Compromisos adquiridos', W, 3),
    row(
      ['Compromiso', 'Fecha de entrega', 'Responsable'].map((h, i) =>
        cell(p(h, { ...SUPB, align: 'center' }), { width: cols[i]! }),
      ),
    ),
    row([
      cell(p('PRESENTACIÓN DE INFORME DE ACTIVIDADES Y CUENTA DE COBRO', SUP), { width: cols[0]! }),
      cell(p('{{next_report_date}}', { ...SUP, align: 'center' }), { width: cols[1]! }),
      cell(p('{{contractor_name}}', { ...SUP, align: 'center' }), { width: cols[2]! }),
    ]),
  ]);
}

function signatures(): string {
  const half = W / 2;
  const sig = (name: string, role: string) =>
    cell(
      [
        p('', { ...SUP, spacingAfter: 600 }),
        p('_______________________________', { ...SUP, align: 'center', spacingAfter: 0 }),
        p(name, { ...SUPB, align: 'center', spacingAfter: 0 }),
        p(role, { ...SUP, align: 'center' }),
      ],
      { width: half, borders: false },
    );
  return table(
    [half, half],
    [row([sig('{{supervisor_name}}', 'Supervisor'), sig('{{contractor_name}}', 'Contratista')])],
    {
      borders: false,
    },
  );
}

export function hrnoSupervisionBody(): string {
  const para = (text: Parameters<typeof p>[0], extra: Parameters<typeof p>[1] = {}) =>
    p(text, { ...SUP, align: 'both', spacingAfter: 120, ...extra });
  const head = (text: string) => p(text, { ...SUPB, spacingBefore: 200, spacingAfter: 120, keepNext: true });
  return [
    para(
      'Dando cumplimiento a lo establecido en los artículos 82 y 83 de la Ley 1474 de 2011 “Estatuto Anticorrupción de 2011”, la Resolución No. 256 del 26 de diciembre de 2022, por medio de la cual se expide el Manual de Contratación de la ESE Hospital Regional Noroccidental, conforme al Estatuto de Contratación expedido por la Junta Directiva mediante el Acuerdo 011 del 26 de diciembre de 2022, Capítulo V, Artículo 40: Supervisión, el subgerente de la ESE Hospital Regional Noroccidental, {{supervisor_name}}, me permito presentar informe de supervisión del Contrato de Prestación de Servicios No. {{contract_number}} en los términos establecidos en la norma antes transcrita:',
    ),
    generalInfoTable(),
    p('', SUP),
    attendeesTable(),
    p('', SUP),
    objectiveTable(),
    head('1. INFORME TÉCNICO Y ADMINISTRATIVO:'),
    head('CUMPLIMIENTO DEL OBJETO:'),
    para(
      'Se pudo verificar por parte de esta supervisión que, respecto del objeto contratado, el contratista cumple con las actividades contractuales.',
    ),
    para(
      'Así mismo, y de conformidad con lo pactado en el objeto contractual, se verificó que el contratista cumplió dentro de los plazos establecidos con las actividades previstas.',
    ),
    para([
      label('1.2 GRADO DE CUMPLIMIENTO DE LAS OBLIGACIONES DEL CONTRATISTA: '),
      'para el presente punto se verificó el cumplimiento de las obligaciones generales consignadas en la cláusula del contrato referenciado así:',
    ]),
    dutiesTable(),
    head('2. INFORME JURÍDICO DEL CONTRATO.'),
    para([
      label('2.1 RELACIÓN DE PAGOS A LA SEGURIDAD SOCIAL Y APORTES PARAFISCALES: '),
      'Relaciono la planilla de pago de aportes a seguridad social aportada por el contratista para la presente cuenta de cobro, de acuerdo con el periodo laborado mencionado y los valores. (Se verificará que la planilla descargada y de soporte tenga el PIN activo y vigente al pago presentado).',
    ]),
    socialSecurityVertical(),
    head('2.2 CUMPLIMIENTO RESPECTO A LA AUSENCIA DE INHABILIDADES E INCOMPATIBILIDADES'),
    para(
      'De acuerdo con lo preceptuado por la Ley 1474 de 2011, Estatuto Anticorrupción, y respecto a la manifestación hecha por el contratista bajo la gravedad del juramento, se constata que el mismo no se halla incurso en ninguna de las causales de inhabilidad e incompatibilidad consagradas en la Constitución y la ley.',
    ),
    para(
      'Que revisado el certificado de Contraloría de fecha {{contraloria_date}}, NO SE ENCUENTRA REPORTADO COMO RESPONSABLE FISCAL.',
    ),
    para(
      'Que revisado el certificado de Procuraduría de fecha {{procuraduria_date}}, NO REGISTRA SANCIONES NI INHABILIDADES DISCIPLINARIAS VIGENTES.',
    ),
    para(
      'Que revisado el certificado de Medidas Correctivas de fecha {{medidas_date}}, NO REGISTRA SANCIONES VIGENTES.',
    ),
    para([
      label('2.3 CUMPLIMIENTO DE LAS ACTIVIDADES: '),
      'Relaciono las actividades descritas (en el estudio previo y/o contrato) por el contratista y su respectiva valoración de acuerdo con las obligaciones especiales descritas en el presente contrato de prestación de servicios.',
    ]),
    activitiesApprovalTable(),
    head('BALANCE FINANCIERO Y CONTABLE DEL CONTRATO'),
    balanceTable(),
    p('', SUP),
    para(
      'Que, en desarrollo de mi función de supervisor, he verificado oportunamente cada uno de los soportes que el contratista presentó para su aprobación, los cuales cargará en la plataforma SECOP II con ocasión de la ejecución del contrato, donde se visualiza el cumplimiento del objeto del contrato.',
    ),
    para(
      'Así mismo, se verificó y constató que el contratista presentó las planillas que acreditan el pago de aportes de salud, pensión y riesgos laborales de acuerdo con las normas vigentes y con las demás obligaciones fiscales del orden regional y nacional.',
    ),
    para(
      'Que esta supervisión certifica que procede al pago generado por valor de {{payment_value_words}}, correspondiente al pago del presente contrato.',
    ),
    commitmentsTable(),
    para(
      'En constancia se firma a los {{signing_day}} días del mes de {{signing_month}} de {{signing_year}}.',
      {
        spacingBefore: 240,
      },
    ),
    signatures(),
  ].join('');
}

/** Informe de Supervisión HRNO. `base` = entity's original DOCX with logos (optional). */
export async function buildHrnoSupervisionTemplate(base?: Buffer): Promise<Buffer> {
  const body = hrnoSupervisionBody();
  if (base) return rebodyDocx(base, body);
  return buildDocx({
    body,
    page: {
      ...OFICIO,
      margins: { top: 1418, right: 1701, bottom: 1418, left: 1701, header: 340, footer: 227 },
    },
    header: hrnoSupervisionHeader(),
    footer: hrnoSupervisionFooter(),
    defaultFont: 'Arial',
    defaultSize: 18,
    title: 'Informe de Supervisión HRNO',
  });
}
