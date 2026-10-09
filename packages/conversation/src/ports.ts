import type { IsoDate } from '@cuentasbot/shared';
import type {
  Contract,
  ConversationState,
  Draft,
  Entity,
  Evidence,
  Note,
  Obligation,
  Period,
  PriorPaymentRecord,
  SocialSecurity,
  SupportFile,
  SupportType,
  User,
} from './domain.js';

// ---------------------------------------------------------------------------
// Messages (shaped after WhatsApp Cloud API limits)
// ---------------------------------------------------------------------------
export interface Button {
  id: string;
  /** ≤ 20 characters. */
  title: string;
}
export interface ListRow {
  id: string;
  /** ≤ 24 characters. */
  title: string;
  /** ≤ 72 characters. */
  description?: string;
}

export type Outgoing =
  | { type: 'text'; text: string }
  | { type: 'buttons'; text: string; buttons: Button[] }
  | { type: 'list'; text: string; button: string; rows: ListRow[] }
  /** Interactive call-to-action button that opens a URL (WhatsApp "cta_url"); button ≤ 20 characters. */
  | { type: 'cta_url'; text: string; button: string; url: string }
  | { type: 'document'; filename: string; mime: string; data: Buffer; caption?: string };

export interface Inbound {
  id: string;
  from: string;
  at: Date;
  kind: 'text' | 'reply' | 'image' | 'document' | 'audio';
  text?: string;
  /** id of the pressed button or list row. */
  replyId?: string;
  media?: { data: Buffer; mime: string; filename?: string };
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------
export interface Clock {
  /** Today in America/Bogota. */
  today(): IsoDate;
  now(): Date;
}

export interface ClassifyResult {
  obligationKey: string | null;
  confidence: number;
}

export type DraftResult = { status: 'ok'; paragraphs: string[] } | { status: 'needs_input'; reason: string };

export interface AI {
  classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult>;
  /** Must only use facts present in the notes; returns needs_input when there is nothing to say. */
  draftObligation(obligation: Obligation, notes: Note[]): Promise<DraftResult>;
  rewrite(paragraphs: string[], instruction: string, obligation: Obligation): Promise<string[]>;
}

export interface STT {
  transcribe(audio: Buffer, mime: string): Promise<string>;
}

export interface Store {
  getUserByPhone(phone: string): Promise<User | null>;
  getUser(id: string): Promise<User>;
  getEntity(id: string): Promise<Entity>;
  listSupportTypes(entityId: string): Promise<SupportType[]>;
  listContracts(userId: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract>;
  updateContract(contract: Contract): Promise<void>;

  listPeriods(contractId: string): Promise<Period[]>;
  savePeriods(contractId: string, periods: Period[]): Promise<void>;
  listPriorPayments(contractId: string): Promise<PriorPaymentRecord[]>;

  addNote(note: Note): Promise<void>;
  updateNote(note: Note): Promise<void>;
  getNote(id: string): Promise<Note>;
  listNotes(contractId: string, from: IsoDate, to: IsoDate): Promise<Note[]>;

  addEvidence(e: Evidence): Promise<void>;
  getEvidence(id: string): Promise<Evidence>;

  listDrafts(contractId: string, periodNumber: number): Promise<Draft[]>;
  saveDraft(d: Draft): Promise<void>;

  addSupport(s: SupportFile): Promise<void>;
  listSupports(userId: string): Promise<SupportFile[]>;
  getSocialSecurity(userId: string, contributionMonth: IsoDate): Promise<SocialSecurity | null>;

  getConversation(userId: string): Promise<ConversationState | null>;
  saveConversation(state: ConversationState): Promise<void>;
}

export interface GeneratedFile {
  filename: string;
  mime: string;
  data: Buffer;
  /** Delivery order: main PDFs, editable DOCX, then ZIP parts. */
  group: 'pdf' | 'docx' | 'zip';
}

export interface Generator {
  generate(contractId: string, periodNumber: number): Promise<GeneratedFile[]>;
}

export interface Deps {
  store: Store;
  ai: AI;
  stt: STT;
  clock: Clock;
  generator: Generator;
  newId(): string;
  /** Minimum confidence to accept the AI's obligation suggestion without asking. */
  confidenceThreshold: number;
}
