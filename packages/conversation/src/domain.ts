import type { IsoDate, PeriodMode, ReportNumberFormat, ScheduledPayment } from '@cuentasbot/shared';

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
  confidence?: number;
  evidenceIds: string[];
  createdAt: string;
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
  /** Documents the entity issues after the supervisor signs (DSE, certificado de cumplimiento) don't block generation. */
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

/** A row of the entity contract registry (public SECOP II data, plan v5 §7). */
export interface RegistryEntry {
  startDate: IsoDate | null;
  termDays: number | null;
  initialValue: number | null;
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
