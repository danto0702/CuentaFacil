import {
  amountInWordsAndNumbers,
  financialBalance,
  formatCOP,
  formatDdMmYyyy,
  formatDocNumber,
  formatPercent,
  formatRangeLong,
  formatReportNumber,
  type IsoDate,
  MONTHS_ES,
  monthNameEs,
  type PriorPayment,
  parseIso,
  type ReportNumberFormat,
} from '@cuentasbot/shared';
import sharp from 'sharp';
import type { ObligationCtx, TemplateContext } from './catalog.js';

export interface ImageInput {
  data: Buffer;
  caption?: string;
}

export interface ObligationInput {
  number: number;
  text: string;
  kind: 'specific' | 'general';
  /** Approved activity paragraphs; empty → entity default text. */
  activities: string[];
  evidences: ImageInput[];
  rating?: 'deficient' | 'improve' | 'satisfactory' | 'outstanding' | 'na';
  observations?: string;
}

export interface SocialSecurityInput {
  platform: string;
  sheetNumber: string;
  pin: string;
  bank: string;
  paymentDate: IsoDate;
  /** First day of the contribution month. */
  contributionMonth: IsoDate;
  ibc: number;
  eps: string;
  epsValue: number;
  afp: string;
  afpValue: number;
  fspValue: number;
  afcValue: number;
  arl?: string;
  arlValue: number;
  total: number;
}

export interface CuentaInput {
  entity: {
    name: string;
    nit: string;
    city: string;
    meeting: { place: string; start: string; end: string };
    defaultActivityText: string;
    /** Which date goes in the background-check section of the supervision report. */
    backgroundCheckDate: 'report_date' | 'issue_date';
  };
  contractor: {
    fullName: string;
    docNumber: string;
    docIssuedIn: string;
    regime: 'simplificado' | 'comun';
    bankName: string;
    accountType: 'ahorros' | 'corriente';
    accountNumber: string;
    hasArl: boolean;
  };
  contract: {
    number: string;
    fullNumber: string;
    year: string;
    secopId: string;
    object: string;
    processName: string;
    startDate: IsoDate;
    endDate: IsoDate;
    termText: string;
    initialValue: number;
    additions: number;
    hasExtension: boolean;
    monthlyValue: number;
    paymentsCount: number;
    reportNumberFormat: ReportNumberFormat;
    supervisor: { name: string; title: string };
    obligations: ObligationInput[];
    /** Contractor duties from the contract clause, rated in the supervision report. */
    contractorDuties: { text: string; rating?: ObligationInput['rating']; observations?: string }[];
  };
  period: {
    number: number;
    from: IsoDate;
    to: IsoDate;
    amount: number;
    executionPct: number;
    items: { concept: string; amount: number }[];
    /** Date of the supervision meeting/report; when absent signature fields stay blank. */
    reportDate?: IsoDate;
    nextReportDate?: IsoDate;
  };
  priorPayments: PriorPayment[];
  socialSecurity?: SocialSecurityInput;
  certificates: { policia?: IsoDate; rnmc?: IsoDate; procuraduria?: IsoDate; contraloria?: IsoDate };
  variables?: Record<string, unknown>;
  /** Evidence image width in cm (2 per row on an "oficio" page ≈ 7.5 cm). */
  evidenceWidthCm?: number;
}

const upper = (s: string) => s.toLocaleUpperCase('es-CO');
const dd = (d?: IsoDate) => (d ? formatDdMmYyyy(d) : '');

async function toImage(img: ImageInput, widthCm: number, maxHeightCm: number) {
  const meta = await sharp(img.data).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  let width = widthCm;
  let height = (widthCm * h) / w;
  if (height > maxHeightCm) {
    height = maxHeightCm;
    width = (maxHeightCm * w) / h;
  }
  const ext = meta.format === 'png' ? '.png' : meta.format === 'gif' ? '.gif' : '.jpg';
  // Normalize anything that is not PNG/JPEG/GIF (e.g. WebP/HEIC already converted upstream) to JPEG.
  const data =
    ext === '.jpg' && meta.format !== 'jpeg'
      ? await sharp(img.data).jpeg({ quality: 85 }).toBuffer()
      : img.data;
  return {
    image: { width: round2(width), height: round2(height), data, extension: ext as '.png' | '.jpg' | '.gif' },
    caption: img.caption ?? '',
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const RATING_KEYS = ['deficient', 'improve', 'satisfactory', 'outstanding', 'na'] as const;

function ratingFlags(rating: ObligationInput['rating']) {
  const r = rating ?? 'outstanding';
  return {
    x_deficient: r === 'deficient' ? 'X' : '',
    x_improve: r === 'improve' ? 'X' : '',
    x_satisfactory: r === 'satisfactory' ? 'X' : '',
    x_outstanding: r === 'outstanding' ? 'X' : '',
    x_na: r === 'na' ? 'X' : '',
  } as const;
}

export async function buildTemplateContext(input: CuentaInput): Promise<TemplateContext> {
  const { entity, contractor, contract, period } = input;
  const widthCm = input.evidenceWidthCm ?? 7.5;
  const end = parseIso(period.to);
  const start = parseIso(period.from);
  const isLast = period.number === contract.paymentsCount;
  const balance = financialBalance({
    initialValue: contract.initialValue,
    additions: contract.additions,
    priorPayments: input.priorPayments,
    currentAmount: period.amount,
  });

  const obligations: ObligationCtx[] = [];
  const sorted = [...contract.obligations].sort((a, b) =>
    a.kind === b.kind ? a.number - b.number : a.kind === 'specific' ? -1 : 1,
  );
  for (const o of sorted) {
    const activities = o.activities.length ? o.activities : [entity.defaultActivityText];
    const evidences = await Promise.all(o.evidences.map((e) => toImage(e, widthCm, 10)));
    obligations.push({
      number: String(o.number),
      text: o.text,
      kind: o.kind,
      activities: activities.map((text) => ({ text })),
      evidences,
      has_evidence: evidences.length > 0,
      approval: 'CUMPLE',
      ...ratingFlags(o.rating),
      observations: o.observations ?? '',
    });
  }

  const ss = input.socialSecurity;
  const checkDate = (issued?: IsoDate) =>
    entity.backgroundCheckDate === 'report_date' ? dd(period.reportDate ?? issued) : dd(issued);
  const report = parseIso(period.reportDate ?? period.to);

  return {
    entity_name: entity.name,
    entity_nit: entity.nit,
    entity_city: entity.city,

    contract_number: contract.number,
    contract_number_full: contract.fullNumber,
    contract_year: contract.year,
    contract_secop: contract.secopId,
    contract_object: contract.object,
    process_name: contract.processName,
    contract_start_date: dd(contract.startDate),
    contract_end_date: dd(contract.endDate),
    contract_term: contract.termText,
    contract_value: formatCOP(contract.initialValue),
    contract_value_words: amountInWordsAndNumbers(contract.initialValue),
    contract_monthly_value: formatCOP(contract.monthlyValue),
    has_extension: contract.hasExtension,
    extension_text: contract.hasExtension ? 'SI' : 'NO',
    supervisor_name: contract.supervisor.name,
    supervisor_title: contract.supervisor.title,
    supervisor_name_title: `${contract.supervisor.name} – ${contract.supervisor.title}`,

    contractor_name: upper(contractor.fullName),
    contractor_cedula: formatDocNumber(contractor.docNumber),
    contractor_cedula_num: contractor.docNumber.replace(/\D/g, ''),
    contractor_city: upper(contractor.docIssuedIn),
    contractor_regime: contractor.regime === 'comun' ? 'común' : 'simplificado',
    x_regime_common: contractor.regime === 'comun' ? 'X' : '',
    x_regime_simplified: contractor.regime === 'simplificado' ? 'X' : '',
    bank_name: upper(contractor.bankName),
    bank_account: contractor.accountNumber,
    account_type: contractor.accountType === 'ahorros' ? 'Ahorros' : 'Corriente',
    x_account_savings: contractor.accountType === 'ahorros' ? 'X' : '',
    x_account_checking: contractor.accountType === 'corriente' ? 'X' : '',

    period_start_date: dd(period.from),
    period_end_date: dd(period.to),
    period_start_day: String(start.day),
    period_end_day: String(end.day),
    period_month: upper(monthNameEs(period.to)),
    period_month_lower: monthNameEs(period.to),
    period_year: String(end.year),
    period_range_long: formatRangeLong(period.from, period.to),
    period_range_upper: `DEL ${upper(formatRangeLong(period.from, period.to))}`,
    report_number: String(period.number).padStart(2, '0'),
    report_total: String(contract.paymentsCount).padStart(2, '0'),
    report_label: formatReportNumber(period.number, contract.paymentsCount, contract.reportNumberFormat),
    is_last_report: isLast,
    next_report_date: isLast || !period.nextReportDate ? 'N/A – informe final' : dd(period.nextReportDate),
    report_date: dd(period.reportDate),
    signing_day: period.reportDate ? String(report.day) : '____',
    signing_month: period.reportDate ? upper(MONTHS_ES[report.month - 1]!) : '________',
    signing_year: String(report.year),

    payment_value: formatCOP(period.amount),
    payment_value_words: amountInWordsAndNumbers(period.amount),
    payment_items: period.items.map((i) => ({ concept: i.concept, value: formatCOP(i.amount) })),
    execution_pct: formatPercent(period.executionPct),

    has_arl: contractor.hasArl,
    x_arl_yes: contractor.hasArl ? 'X' : '',
    x_arl_no: contractor.hasArl ? '' : 'X',
    ss_platform: upper(ss?.platform ?? ''),
    ss_planilla: ss?.sheetNumber ?? '',
    ss_pin: ss?.pin ?? '',
    ss_bank: upper(ss?.bank ?? ''),
    ss_payment_date: dd(ss?.paymentDate),
    ss_period: ss ? upper(`${monthNameEs(ss.contributionMonth)} ${parseIso(ss.contributionMonth).year}`) : '',
    ss_ibc: ss ? formatCOP(ss.ibc) : '',
    ss_eps: upper(ss?.eps ?? ''),
    ss_eps_value: ss ? formatCOP(ss.epsValue) : '',
    ss_afp: upper(ss?.afp ?? ''),
    ss_afp_value: ss ? formatCOP(ss.afpValue) : '',
    ss_fsp_value: ss ? formatCOP(ss.fspValue) : '',
    ss_afc_value: ss ? formatCOP(ss.afcValue) : '',
    ss_arl: upper(ss?.arl ?? ''),
    ss_arl_value: ss ? formatCOP(ss.arlValue) : '',
    ss_total: ss ? formatCOP(ss.total) : '',

    policia_date: checkDate(input.certificates.policia),
    medidas_date: checkDate(input.certificates.rnmc),
    procuraduria_date: checkDate(input.certificates.procuraduria),
    contraloria_date: checkDate(input.certificates.contraloria),

    physical_execution: '100%',
    budget_execution: formatPercent(balance.budgetExecutionPct),
    meeting_place: entity.meeting.place,
    meeting_start: entity.meeting.start,
    meeting_end: entity.meeting.end,
    other_attendees: 'NO HUBO',
    x_deficient_performance_yes: '',
    x_deficient_performance_no: 'X',
    overall_rating: ratingFlags('outstanding'),

    balance_initial: formatCOP(balance.initialValue),
    balance_additions: formatCOP(balance.additions),
    balance_total: formatCOP(balance.totalValue),
    balance_paid: formatCOP(balance.paid),
    balance_accrued_unpaid: formatCOP(balance.accruedUnpaid),
    balance_executed: formatCOP(balance.executed),
    balance_not_executed: formatCOP(balance.notExecuted),
    prior_payments: input.priorPayments.map((pp) => ({ voucher: pp.voucher, value: formatCOP(pp.amount) })),

    obligations,
    specific_obligations: obligations.filter((o) => o.kind === 'specific'),
    general_obligations: obligations.filter((o) => o.kind === 'general'),
    evidence_obligations: obligations.filter((o) => o.has_evidence),
    contractor_duties: contract.contractorDuties.map((d, i) => ({
      number: String(i + 1),
      text: d.text,
      ...ratingFlags(d.rating),
      observations: d.observations ?? '',
    })),

    var: input.variables ?? {},
  };
}

export { RATING_KEYS };
