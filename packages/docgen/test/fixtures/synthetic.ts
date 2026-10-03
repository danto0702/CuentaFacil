import sharp from 'sharp';
import type { CuentaInput, ObligationInput } from '../../src/context.js';

/**
 * Synthetic HRNO account (fictitious people and numbers), modeled on the structure of the
 * September 2026 example: contract of 3 payments of $4.000.000 from 06/07/2026 to 30/09/2026.
 */

export async function fakePhoto(label: string, color: string, w = 800, h = 600): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-size="48" text-anchor="middle" fill="#fff" font-family="sans-serif">${label}</text></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toBuffer();
}

const SPECIFIC = [
  'Coordinar los procesos y actividades de vigilancia en salud pública y notificación de eventos epidemiológicos de la entidad a los entes responsables y hacer seguimiento a las IPS.',
  'Reorganizar los programas y actividades que sean establecidos en cada línea de acción de salud pública a nivel de la entidad.',
  'Asistir a las reuniones en las diferentes entidades territoriales de jurisdicción de la ESE cuando sea requerido.',
  'Enlace en las actividades extramurales y/o intramurales en cada uno de los municipios donde tiene injerencia la entidad.',
];
const GENERAL = [
  'Reserva y confidencialidad de la información que se obtenga por medio del presente contrato.',
  'Cumplir las demás obligaciones afines con la naturaleza de la labor contratada.',
];

export async function syntheticAccount(opts: { period: 'full' | 'prorated' }): Promise<CuentaInput> {
  const obligations: ObligationInput[] = [
    {
      number: 1,
      kind: 'specific',
      text: SPECIFIC[0]!,
      activities: [
        'Se realizó seguimiento a la notificación semanal de eventos de las UPGD de Ábrego y El Carmen.',
      ],
      evidences: [{ data: await fakePhoto('EVIDENCIA 1', '#2b6cb0') }],
    },
    {
      number: 2,
      kind: 'specific',
      text: SPECIFIC[1]!,
      activities: [
        'Se realizó seguimiento a las líneas de interés en salud pública (PAI, SAN, TBC) en cada IPS.',
        'Se diseñó la herramienta de seguimiento a la desnutrición.',
      ],
      evidences: [
        { data: await fakePhoto('EVIDENCIA 2A', '#2f855a') },
        { data: await fakePhoto('EVIDENCIA 2B', '#276749', 600, 800) },
      ],
    },
    {
      number: 3,
      kind: 'specific',
      text: SPECIFIC[2]!,
      activities: ['Se participó en el COVE municipal de Ábrego.'],
      evidences: [],
    },
    {
      number: 4,
      kind: 'specific',
      text: SPECIFIC[3]!,
      activities: ['Se acompañó la jornada de salud extramural en la vereda La Esperanza.'],
      evidences: [{ data: await fakePhoto('EVIDENCIA 4', '#9b2c2c') }],
    },
    { number: 5, kind: 'general', text: GENERAL[0]!, activities: [], evidences: [] },
    { number: 6, kind: 'general', text: GENERAL[1]!, activities: [], evidences: [] },
  ];

  const full = opts.period === 'full';
  return {
    entity: {
      name: 'ESE HOSPITAL REGIONAL NOROCCIDENTAL',
      nit: '807.008.842-9',
      city: 'Ábrego',
      meeting: { place: 'ESE HOSPITAL REGIONAL NOROCCIDENTAL', start: '09:00 am', end: '10:30 am' },
      defaultActivityText: 'Actividad cumplida.',
      backgroundCheckDate: 'report_date',
    },
    contractor: {
      fullName: 'María Fernanda Prueba Ficticia',
      docNumber: '1000000001',
      docIssuedIn: 'Ocaña',
      regime: 'simplificado',
      bankName: 'Banco de Prueba',
      accountType: 'ahorros',
      accountNumber: '00000000001',
      hasArl: true,
    },
    contract: {
      number: '0001',
      fullNumber: 'CPS-0001-2026',
      year: '2026',
      secopId: 'CO1.PCCNTR.0000001',
      object:
        'PRESTACIÓN DE LOS SERVICIOS PROFESIONALES ESPECIALIZADOS INDEPENDIENTES COMO COORDINADOR ADMINISTRATIVO DE SALUD PÚBLICA DE LA ESE HOSPITAL REGIONAL NOROCCIDENTAL.',
      processName: 'SALUD PÚBLICA',
      startDate: '2026-07-06',
      endDate: '2026-09-30',
      termText: '3 MESES',
      initialValue: 12_000_000,
      additions: 0,
      hasExtension: false,
      monthlyValue: 4_000_000,
      paymentsCount: 3,
      reportNumberFormat: 'NN DE NN',
      supervisor: { name: 'SUPERVISOR DE PRUEBA', title: 'SUBGERENTE' },
      obligations,
      contractorDuties: [
        {
          text: 'Actuar con plena eficiencia y responsabilidad desarrollando aquellas actividades que sean compatibles con el objeto del contrato.',
        },
        {
          text: 'Cumplir con los objetivos, actos, obligaciones, orientaciones y prioridades que vayan estableciéndose durante la ejecución del contrato.',
        },
      ],
    },
    period: full
      ? {
          number: 3,
          from: '2026-09-01',
          to: '2026-09-30',
          amount: 4_000_000,
          executionPct: 100,
          items: [{ concept: 'Honorarios', amount: 4_000_000 }],
          reportDate: '2026-09-29',
        }
      : {
          number: 1,
          from: '2026-07-06',
          to: '2026-07-31',
          amount: 3_333_333,
          executionPct: 100,
          items: [{ concept: 'Honorarios', amount: 3_333_333 }],
          reportDate: '2026-07-30',
          nextReportDate: '2026-08-31',
        },
    priorPayments: full
      ? [
          { voucher: 'ND 000001', amount: 4_000_000 },
          { voucher: 'ND 000002', amount: 4_000_000 },
        ]
      : [],
    socialSecurity: {
      platform: 'Aportes en Línea',
      sheetNumber: '9000000001',
      pin: '100000001',
      bank: 'Bancolombia',
      paymentDate: full ? '2026-09-23' : '2026-07-22',
      contributionMonth: full ? '2026-09-01' : '2026-07-01',
      ibc: 5_000_000,
      eps: 'EPS de Prueba',
      epsValue: 625_000,
      afp: 'AFP de Prueba',
      afpValue: 800_000,
      fspValue: 0,
      afcValue: 0,
      arl: 'ARL de Prueba',
      arlValue: 121_800,
      total: 1_546_800,
    },
    certificates: {
      policia: '2026-09-23',
      rnmc: '2026-09-23',
      procuraduria: '2026-09-23',
      contraloria: '2026-09-23',
    },
  };
}
