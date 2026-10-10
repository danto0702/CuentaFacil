/**
 * Synthetic demo data (fictitious people), mirroring supabase/seed.sql.
 * Used by the local simulator and by recorded-conversation tests.
 */
import { buildPeriods, type IsoDate, resolvePeriodAmount, type ScheduledPayment } from '@cuentasbot/shared';
import type { Contract, Entity, Period, SupportType } from './domain.js';
import { emptyData, type MemoryData } from './memory-store.js';

/** A one-page PDF with a line of text (no dependencies). */
export function tinyPdf(title: string): Buffer {
  const content = `BT /F1 18 Tf 72 720 Td (${title.replace(/[()\\]/g, '')}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

export const DEMO_IDS = {
  hrno: 'ent-hrno',
  other: 'ent-prueba',
  maria: 'usr-maria',
  carlos: 'usr-carlos',
  salud: 'ctr-0001',
  ebs: 'ctr-0002',
  admin: 'ctr-0003',
} as const;

export const DEMO_PHONES = { maria: '+573000000001', carlos: '+573000000002' } as const;

const HRNO: Entity = {
  id: DEMO_IDS.hrno,
  name: 'ESE HOSPITAL REGIONAL NOROCCIDENTAL',
  shortName: 'HRNO',
  nit: '807.008.842-9',
  city: 'Ábrego',
  settings: {
    defaultActivityText: 'Actividad cumplida.',
    certificateMaxAgeDays: 30,
    backgroundCheckDate: 'report_date',
    meeting: { place: 'ESE HOSPITAL REGIONAL NOROCCIDENTAL', start: '09:00 am', end: '10:30 am' },
    pilaContributionMonth: 'current',
    ibcBlocking: false,
    generateWithMissing: false,
    package: {
      periodFolder: 'CUENTAS {MES} {AÑO}',
      uploadFolder: 'DOCUMENTOS A CARGAR',
      zipName: 'aprobacindelossoportespresentadosalsupervisordelcon.zip',
    },
    contractDefaults: { supervisor: { name: 'CARLOS EDUARDO BONILLA DIAZ', title: 'Subgerente' } },
  },
};

const OTHER: Entity = {
  ...HRNO,
  id: DEMO_IDS.other,
  name: 'ESE DE PRUEBA SAN JOSÉ',
  shortName: 'ESEPRUEBA',
  nit: '900.000.000-1',
  city: 'Ocaña',
  settings: { ...HRNO.settings, pilaContributionMonth: 'previous', backgroundCheckDate: 'issue_date' },
};

export const HRNO_SUPPORT_TYPES: SupportType[] = [
  { code: 'PILA', label: 'Planilla PILA', required: true, frequency: 'every_period' },
  {
    code: 'POLICIA',
    label: 'Antecedentes Policía',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'ANTECEDENTES',
    bundleOrder: 1,
    officialUrl: 'https://antecedentes.policia.gov.co:7005/WebJudicial/',
  },
  {
    code: 'RNMC',
    label: 'Medidas Correctivas',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'ANTECEDENTES',
    bundleOrder: 2,
    officialUrl: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
  },
  {
    code: 'PROCURADURIA',
    label: 'Antecedentes Procuraduría',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'ANTECEDENTES',
    bundleOrder: 3,
    officialUrl: 'https://www.procuraduria.gov.co/Pages/Generacion-de-antecedentes.aspx',
  },
  {
    code: 'CONTRALORIA',
    label: 'Antecedentes Contraloría',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'ANTECEDENTES',
    bundleOrder: 4,
    officialUrl: 'https://www.contraloria.gov.co/web/guest/persona-natural',
  },
  {
    code: 'EPS',
    label: 'Afiliación EPS',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'AFILIACIONES',
    bundleOrder: 1,
  },
  {
    code: 'ARL',
    label: 'Afiliación ARL',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'AFILIACIONES',
    bundleOrder: 2,
  },
  {
    code: 'AFP',
    label: 'Afiliación pensión',
    required: true,
    frequency: 'every_period',
    maxAgeDays: 30,
    bundle: 'AFILIACIONES',
    bundleOrder: 3,
  },
  {
    code: 'CERT_EJECUCION_EBS',
    label: 'Certificado ejecución EBS',
    required: true,
    frequency: 'every_period',
    profiles: ['ebs'],
  },
  {
    code: 'CERT_CUMPLIMIENTO',
    label: 'Certificado de cumplimiento',
    required: true,
    frequency: 'every_period',
    stage: 'after_signature',
  },
  {
    code: 'DSE',
    label: 'Documento Soporte DIAN',
    required: true,
    frequency: 'every_period',
    stage: 'after_signature',
  },
  { code: 'FICHA_SECOP', label: 'Ficha SECOP', required: true, frequency: 'once' },
];

function periodsFor(c: Contract, delivered: number[]): Period[] {
  return buildPeriods({ contractStart: c.startDate, contractEnd: c.endDate, mode: c.periodMode }).map((r) => {
    const schedule = c.schedule?.find((s) => s.paymentNumber === r.number);
    // HRNO's first salud pública payment was billed complete (owner's answer A): contractor-provided value.
    const contractor = c.id === DEMO_IDS.salud && r.number === 1 ? c.monthlyValue : undefined;
    const res = resolvePeriodAmount({
      monthlyValue: c.monthlyValue,
      period: r,
      ...(schedule ? { schedule } : {}),
      ...(contractor !== undefined ? { contractor } : {}),
    });
    return {
      contractId: c.id,
      number: r.number,
      from: r.from,
      to: r.to,
      amount: res.amount,
      amountSource: res.source,
      executionPct: res.executionPct,
      status: delivered.includes(r.number) ? 'delivered' : 'collecting',
    };
  });
}

const ebsSchedule: ScheduledPayment[] = [
  {
    paymentNumber: 1,
    amount: 3_608_000,
    days: 12,
    items: [
      { concept: 'Honorarios', amount: 3_360_000, countsForIbc: true },
      { concept: 'Auxilio de transporte', amount: 248_000, countsForIbc: false },
    ],
  },
  ...[2, 3, 4, 5].map((n) => ({
    paymentNumber: n,
    amount: 9_020_000,
    months: 1,
    items: [
      { concept: 'Honorarios', amount: 8_400_000, countsForIbc: true },
      { concept: 'Auxilio de transporte', amount: 620_000, countsForIbc: false },
    ],
  })),
];

export function demoData(opts: { supportsIssuedOn?: IsoDate } = {}): MemoryData {
  const issued = opts.supportsIssuedOn ?? '2026-09-23';
  const d = emptyData();
  d.entities = [HRNO, OTHER];
  d.supportTypes = {
    [HRNO.id]: HRNO_SUPPORT_TYPES,
    [OTHER.id]: HRNO_SUPPORT_TYPES.filter((t) => t.code !== 'CERT_EJECUCION_EBS'),
  };
  d.users = [
    {
      id: DEMO_IDS.maria,
      phone: DEMO_PHONES.maria,
      fullName: 'María Fernanda Prueba Ficticia',
      docNumber: '1000000001',
      docIssuedIn: 'Ocaña',
      regime: 'simplificado',
      bankName: 'Banco de Prueba',
      accountType: 'ahorros',
      accountNumber: '00000000001',
      hasArl: true,
      remindersOptOut: false,
    },
    {
      id: DEMO_IDS.carlos,
      phone: DEMO_PHONES.carlos,
      fullName: 'Carlos Andrés Ejemplo Sintético',
      docNumber: '1000000002',
      docIssuedIn: 'Ábrego',
      regime: 'simplificado',
      bankName: 'Banco de Prueba',
      accountType: 'ahorros',
      accountNumber: '00000000002',
      hasArl: true,
      remindersOptOut: false,
    },
  ];

  const salud: Contract = {
    id: DEMO_IDS.salud,
    userId: DEMO_IDS.maria,
    entityId: HRNO.id,
    number: '0001',
    fullNumber: 'CPS-0001-2026',
    year: '2026',
    secopId: 'CO1.PCCNTR.0000001',
    object:
      'PRESTACIÓN DE LOS SERVICIOS PROFESIONALES ESPECIALIZADOS INDEPENDIENTES COMO COORDINADOR ADMINISTRATIVO DE SALUD PÚBLICA DE LA ESE HOSPITAL REGIONAL NOROCCIDENTAL.',
    shortLabel: '0001 Salud Pública',
    processName: 'SALUD PÚBLICA',
    profile: 'salud_publica',
    startDate: '2026-07-06',
    endDate: '2026-09-30',
    termText: '3 MESES',
    totalValue: 12_000_000,
    monthlyValue: 4_000_000,
    paymentsCount: 3,
    reportNumberFormat: 'NN DE NN',
    periodMode: 'month_end',
    supervisor: { name: 'SUPERVISOR DE PRUEBA', title: 'SUBGERENTE' },
    obligations: [
      {
        key: 'specific-1',
        number: 1,
        kind: 'specific',
        text: 'Coordinar los procesos y actividades de vigilancia en salud pública y notificación de eventos epidemiológicos de la entidad a los entes responsables y hacer seguimiento a las IPS.',
      },
      {
        key: 'specific-2',
        number: 2,
        kind: 'specific',
        text: 'Reorganizar los programas y actividades que sean establecidos en cada línea de acción de salud pública a nivel de la entidad.',
      },
      {
        key: 'specific-3',
        number: 3,
        kind: 'specific',
        text: 'Asistir a las reuniones en las diferentes entidades territoriales de jurisdicción de la ESE cuando sea requerido.',
      },
      {
        key: 'specific-4',
        number: 4,
        kind: 'specific',
        text: 'Capacitación y seguimiento al personal sobre la ruta en misión médica.',
      },
      {
        key: 'general-5',
        number: 5,
        kind: 'general',
        text: 'Reserva y confidencialidad de la información que se obtenga por medio del presente contrato.',
      },
      {
        key: 'general-6',
        number: 6,
        kind: 'general',
        text: 'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.',
      },
    ],
    contractorDuties: [
      'Actuar con plena eficiencia y responsabilidad desarrollando aquellas actividades que sean compatibles con el objeto del contrato.',
      'Cumplir con los objetivos, actos, obligaciones, orientaciones y prioridades que vayan estableciéndose durante la ejecución del contrato.',
      'Asumir por cuenta propia los valores de los gastos por concepto de estampillas e impuestos.',
      'Afiliarse al Sistema General de Seguridad Social y presentar dichas certificaciones para su respectivo pago.',
    ],
  };

  const ebs: Contract = {
    ...salud,
    id: DEMO_IDS.ebs,
    number: '0002',
    fullNumber: 'CPS-0002-2026',
    secopId: 'CO1.PCCNTR.0000002',
    object:
      'PRESTACIÓN DE SERVICIOS INDEPENDIENTES COMO ENFERMERO PROFESIONAL PARA LA CONFORMACIÓN DEL EQUIPO BÁSICO DE ATENCIÓN.',
    shortLabel: '0002 EBS',
    processName: 'EQUIPOS BÁSICOS DE SALUD',
    profile: 'ebs',
    startDate: '2026-08-20',
    endDate: '2026-12-23',
    termText: '126 DÍAS',
    totalValue: 39_688_000,
    monthlyValue: 9_020_000,
    paymentsCount: 5,
    reportNumberFormat: 'NN-NN',
    // Month-end cut matches the clauses' schedule: a first payment of 12 days (20 to 31 August).
    periodMode: 'month_end',
    supervisor: { name: 'COORDINADOR DE PRUEBA', title: 'COORDINADOR EBS' },
    schedule: ebsSchedule,
    obligations: [
      {
        key: 'specific-1',
        number: 1,
        kind: 'specific',
        text: 'Caracterización y seguimiento a planes de cuidado familiares.',
      },
      {
        key: 'specific-2',
        number: 2,
        kind: 'specific',
        text: 'Formulación y ejecución del plan de cuidado comunitario.',
      },
      {
        key: 'specific-3',
        number: 3,
        kind: 'specific',
        text: 'Formulación y seguimiento a planes de cuidado individuales: consultas, citologías y planificación familiar.',
      },
      {
        key: 'general-4',
        number: 4,
        kind: 'general',
        text: 'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.',
      },
    ],
  };

  const admin: Contract = {
    ...salud,
    id: DEMO_IDS.admin,
    userId: DEMO_IDS.carlos,
    entityId: OTHER.id,
    number: '0003',
    fullNumber: 'CPS-0003-2026',
    secopId: '',
    object: 'PRESTACIÓN DE SERVICIOS DE APOYO ADMINISTRATIVO.',
    shortLabel: '0003 Administrativo',
    processName: 'ADMINISTRATIVA',
    startDate: '2026-10-03',
    endDate: '2027-01-02',
    totalValue: 6_000_000,
    monthlyValue: 2_000_000,
    periodMode: 'date_to_date',
    obligations: [
      { key: 'specific-1', number: 1, kind: 'specific', text: 'Apoyar la gestión documental del área.' },
      {
        key: 'general-2',
        number: 2,
        kind: 'general',
        text: 'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.',
      },
    ],
  };
  delete (admin as Partial<Contract>).profile;

  d.contracts = [salud, ebs, admin];
  d.periods = [...periodsFor(salud, [1, 2]), ...periodsFor(ebs, []), ...periodsFor(admin, [])];
  d.priorPayments = [
    { contractId: salud.id, voucher: 'ND 000001', amount: 4_000_000, periodNumber: 1 },
    { contractId: salud.id, voucher: 'ND 000002', amount: 4_000_000, periodNumber: 2 },
  ];

  // One PILA covers both of María's contracts (IBC = 40 % × (4.000.000 + 8.400.000) = 4.960.000).
  d.socialSecurity = [
    {
      // August: only the EBS contract was in force for the full month's fees (40 % × 8.400.000).
      userId: DEMO_IDS.maria,
      contributionMonth: '2026-08-01',
      platform: 'Aportes en Línea',
      sheetNumber: '9000000000',
      pin: '100000000',
      bank: 'Bancolombia',
      paymentDate: '2026-08-21',
      ibc: 3_360_000,
      eps: 'EPS de Prueba',
      epsValue: 420_000,
      afp: 'AFP de Prueba',
      afpValue: 537_600,
      fspValue: 0,
      afcValue: 0,
      arl: 'ARL de Prueba',
      arlValue: 81_900,
      total: 1_039_500,
    },
    {
      userId: DEMO_IDS.maria,
      contributionMonth: '2026-09-01',
      platform: 'Aportes en Línea',
      sheetNumber: '9000000001',
      pin: '100000001',
      bank: 'Bancolombia',
      paymentDate: '2026-09-23',
      ibc: 4_960_000,
      eps: 'EPS de Prueba',
      epsValue: 620_000,
      afp: 'AFP de Prueba',
      afpValue: 793_600,
      fspValue: 0,
      afcValue: 0,
      arl: 'ARL de Prueba',
      arlValue: 120_900,
      total: 1_534_500,
    },
  ];

  const support = (code: string) => ({
    id: `sup-${code.toLowerCase()}`,
    userId: DEMO_IDS.maria,
    code,
    issuedOn: issued,
    data: tinyPdf(`SOPORTE SINTETICO ${code}`),
    mime: 'application/pdf',
    filename: `${code}.pdf`,
    receivedAt: `${issued}T15:00:00.000Z`,
  });
  // Demo starts with everything except the EBS execution certificate, to show the checklist.
  d.supports = ['PILA', 'POLICIA', 'RNMC', 'PROCURADURIA', 'CONTRALORIA', 'EPS', 'ARL', 'AFP'].map(support);
  return d;
}
