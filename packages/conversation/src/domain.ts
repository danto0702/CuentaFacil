import {
  addMonthsClamped,
  type IsoDate,
  type PeriodMode,
  type ReportNumberFormat,
  type ScheduledPayment,
} from '@cuentasbot/shared';

export interface Entity {
  id: string;
  name: string;
  shortName: string;
  nit: string;
  city: string;
  settings: EntitySettings;
}

export interface EntitySettings {
  defaultActivityText: string;
  certificateMaxAgeDays: number;
  backgroundCheckDate: 'report_date' | 'issue_date';
  meeting: { place: string; start: string; end: string };
  pilaContributionMonth: 'current' | 'previous';
  ibcBlocking: boolean;
  generateWithMissing: boolean;
  package: { periodFolder: string; uploadFolder: string; zipName: string };
  /**
   * Obligations without activities in the period: 'omit' leaves them out of the activity report (and
   * the review shows them as a single line); 'text' writes `emptyObligationText`.
   */
  emptyObligations: 'omit' | 'text';
  emptyObligationText: string;
  /** Values that are the same for every contractor of the entity; they win over what the AI reads. */
  contractDefaults: { supervisor: { name: string; title: string } | null };
}

export interface User {
  id: string;
  phone: string;
  fullName: string;
  docNumber: string;
  docIssuedIn: string;
  regime: 'simplificado' | 'comun';
  bankName: string;
  accountType: 'ahorros' | 'corriente';
  accountNumber: string;
  hasArl: boolean;
  remindersOptOut: boolean;
}

export interface Obligation {
  /** Stable key within the contract, e.g. "specific-3". */
  key: string;
  number: number;
  kind: 'specific' | 'general';
  text: string;
}

export interface Contract {
  id: string;
  userId: string;
  entityId: string;
  number: string;
  fullNumber: string;
  year: string;
  secopId: string;
  object: string;
  /** Short label for buttons ("0001 Salud Pública"). */
  shortLabel: string;
  processName: string;
  profile?: string;
  startDate: IsoDate;
  endDate: IsoDate;
  termText: string;
  totalValue: number;
  monthlyValue: number;
  paymentsCount: number;
  reportNumberFormat: ReportNumberFormat;
  /**
   * Whether this contract's accounts need the certificado de cumplimiento issued by a dependency or
   * coordinator (it states how much to pay). Not the supervisor's own approval, which is never asked.
   */
  requiresCertification?: boolean;
  periodMode: PeriodMode;
  supervisor: { name: string; title: string };
  obligations: Obligation[];
  contractorDuties: string[];
  schedule?: ScheduledPayment[];
}

export type PeriodStatus =
  | 'scheduled'
  | 'collecting'
  | 'ready_to_draft'
  | 'draft_review'
  | 'approved'
  | 'generating'
  | 'delivered'
  | 'blocked_payment';

export interface Period {
  contractId: string;
  number: number;
  from: IsoDate;
  to: IsoDate;
  amount: number;
  amountSource: 'schedule' | 'certificate' | 'contractor' | 'computed';
  executionPct: number;
  status: PeriodStatus;
  reportDate?: IsoDate;
}

export interface Note {
  id: string;
  userId: string;
  contractId: string;
  date: IsoDate;
  text: string;
  obligationKey?: string;
  /** Other obligations the same activity also supports (the contractor can mark several). */
  alsoKeys?: string[];
  confidence?: number;
  evidenceIds: string[];
  createdAt: string;
}

/** True when the note counts for the obligation (main or additional). */
/** Month of contributions (first day) whose PILA backs a report ending on `periodTo`. */
export function pilaMonthFor(
  settings: Pick<EntitySettings, 'pilaContributionMonth'>,
  periodTo: IsoDate,
): IsoDate {
  const monthStart = `${periodTo.slice(0, 8)}01`;
  return settings.pilaContributionMonth === 'previous' ? addMonthsClamped(monthStart, -1) : monthStart;
}

export function noteSupports(note: Note, key: string): boolean {
  return note.obligationKey === key || (note.alsoKeys ?? []).includes(key);
}

export interface Evidence {
  id: string;
  userId: string;
  data: Buffer;
  mime: string;
}

export interface Draft {
  contractId: string;
  periodNumber: number;
  obligationKey: string;
  paragraphs: string[];
  status: 'proposed' | 'approved' | 'needs_input' | 'not_applicable' | 'default';
  sourceNoteIds: string[];
}

export interface SupportFile {
  id: string;
  userId: string;
  code: string;
  issuedOn?: IsoDate;
  data: Buffer;
  mime: string;
  filename: string;
  receivedAt: string;
  /** Expired (older than allowed) but the contractor chose to generate with it anyway. */
  acceptedExpired?: boolean;
}

/** One document found inside an uploaded PDF (a PDF can bundle several certificates). */
export interface SupportSegment {
  /** Support type code from the entity checklist; null when the pages are not a known support. */
  code: string | null;
  fromPage: number;
  toPage: number;
  /** Issue / query date printed on the document. */
  issuedOn: IsoDate | null;
  /** Short note for the contractor (e.g. "sin antecedentes", "periodo septiembre 2026"). */
  note: string | null;
  /** Compliance certificate only: the value it certifies for payment, in pesos. */
  amount?: number | null;
}

export interface SocialSecurity {
  userId: string;
  /** First day of the contribution month. */
  contributionMonth: IsoDate;
  platform: string;
  sheetNumber: string;
  pin: string;
  bank: string;
  paymentDate: IsoDate;
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

export interface PriorPaymentRecord {
  contractId: string;
  voucher: string;
  amount: number;
  periodNumber: number;
}

export interface ConversationState {
  userId: string;
  flow: string;
  step: string;
  context: Record<string, unknown>;
  updatedAt: string;
}

export interface SupportType {
  code: string;
  label: string;
  required: boolean;
  frequency: 'every_period' | 'once' | 'at_start';
  maxAgeDays?: number;
  bundle?: 'ANTECEDENTES' | 'AFILIACIONES';
  bundleOrder?: number;
  officialUrl?: string;
  instructions?: string;
  /** Contract profiles this applies to; undefined = all. */
  profiles?: string[];
  /** Documents the entity issues after the supervisor signs (e.g. DSE) don't block generation. */
  stage?: 'before_generation' | 'after_signature';
}

/** What the AI reads from the SECOP contract + clauses PDFs during setup (plan v5 §2.1). */
export interface ContractExtraction {
  secopId: string | null;
  /** Short number as used in the formats ("0330"). */
  number: string;
  /** As written in SECOP ("CPS-0330-2026"). */
  fullNumber: string;
  object: string;
  entity: { name: string; nit: string | null };
  contractor: {
    fullName: string;
    docNumber: string;
    docIssuedIn: string | null;
    bankName: string | null;
    accountType: 'ahorros' | 'corriente' | null;
    accountNumber: string | null;
  };
  totalValue: number;
  monthlyValue: number | null;
  paymentsCount: number | null;
  termText: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  processArea: string | null;
  supervisor: { name: string; title: string } | null;
  /** Literal text, in the clauses' order. */
  obligations: { kind: 'specific' | 'general'; number: number; text: string }[];
  schedule: ScheduledPayment[];
  /** Anything the AI could not confirm, in Colombian Spanish, for the summary. */
  warnings: string[];
}

/** Programa de Aliados (ADR-032): the first contractor of a new institution and their referrals. */
export interface AllyStatus {
  code: string;
  level: number;
  premium: boolean;
  referrals: number;
  freeReports: number;
  /** Levels reached that the Aliado has not been told about yet. */
  newLevels: number[];
}

export type ReferralResult = 'ok' | 'invalid' | 'own' | 'already' | 'late';

/** A row of the entity contract registry (public SECOP II data, plan v5 §7). */
export interface RegistryEntry {
  startDate: IsoDate | null;
  termDays: number | null;
  initialValue: number | null;
}

/**
 * How the contractor writes, read from a report they made before (ADR-046). Pascal imitates it when
 * drafting; the facts always come from the period's notes.
 */
export interface WritingStyle {
  /** The support file it was read from. */
  supportId: string;
  /** What the document is, as read: «Informe de actividades de septiembre de 2026, CPS-0330-2026». */
  summary: string;
  /** Tone, person, tense, length and structure of the activity paragraphs (Spanish). */
  guide: string;
  /** Up to 3 activity paragraphs copied from the report, as samples of style only. */
  examples: string[];
}

/** What the AI read in a document sent as «informe anterior». */
export interface PreviousReportReading {
  isActivityReport: boolean;
  summary: string;
  guide: string;
  examples: string[];
}

export interface DocumentInput {
  label: string;
  data: Buffer;
  mime: string;
}

export interface NewContract {
  userId: string;
  entityId: string;
  extraction: ContractExtraction;
  startDate: IsoDate;
  endDate: IsoDate;
  periodMode: PeriodMode;
  requiresCertification: boolean;
  shortLabel: string;
}

// ---------------------------------------------------------------------------
// Billing (ADR-034)
// ---------------------------------------------------------------------------
export interface BillingSettings {
  /** 'pilot': nothing is charged. 'live': configuration and reports are paid before delivery. */
  mode: 'pilot' | 'live';
  prices: { setup: number; report: number };
}

export type ChargeStatus = 'pending' | 'paid' | 'free' | 'pilot' | 'cancelled';
export type ChargeMethod = 'wompi' | 'cash_code' | 'free_grant' | 'pilot';

export interface Charge {
  id: string;
  userId: string;
  product: 'setup' | 'report';
  contractId: string;
  periodNumber: number | null;
  coversSetup: boolean;
  amount: number;
  status: ChargeStatus;
  method: ChargeMethod | null;
  /** Reference sent to the payment provider. */
  reference: string;
  /** Who asked for it when a gestor works for the contractor (ADR-042): receives the documents. */
  requestedBy?: string | null;
}

/**
 * A gestor (one WhatsApp number) preparing the accounts of another person (ADR-042). The person
 * authorizes it from their own WhatsApp; until then the delegation is pending.
 */
export interface Delegation {
  id: string;
  managerId: string;
  /** Null until the person accepts (they may not be registered yet). */
  personId: string | null;
  personName: string;
  personPhone: string;
  status: 'pending' | 'active' | 'declined' | 'revoked';
}

export type CashCodeResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'other_user' | 'used' | 'expired' | 'wrong_amount' };
