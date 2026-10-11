import type { IsoDate } from '@cuentasbot/shared';
import type {
  AllyStatus,
  Contract,
  ContractExtraction,
  ConversationState,
  DocumentInput,
  Draft,
  Entity,
  Evidence,
  NewContract,
  Note,
  Obligation,
  Period,
  PriorPaymentRecord,
  ReferralResult,
  RegistryEntry,
  SocialSecurity,
  SupportFile,
  SupportSegment,
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

/** What a short free-text message asks for (checked before saving it as an activity). */
export interface ShortIntent {
  intent:
    | 'activity'
    | 'redo'
    | 'reset'
    | 'open_report'
    | 'draft'
    | 'generate'
    | 'status'
    | 'menu'
    | 'undo_note'
    | 'signature'
    | 'unclear';
  /** 1..12 when the message names a month. */
  month: number | null;
}

export interface AI {
  /** Short messages only: is it a work activity or a request to the assistant? */
  interpretShort(text: string): Promise<ShortIntent>;
  classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult>;
  /** Must only use facts present in the notes; returns needs_input when there is nothing to say. */
  draftObligation(obligation: Obligation, notes: Note[]): Promise<DraftResult>;
  rewrite(paragraphs: string[], instruction: string, obligation: Obligation): Promise<string[]>;
  /** Reads the SECOP contract and the clauses (setup model). Never invents values: unknowns are null. */
  extractContract(docs: DocumentInput[]): Promise<ContractExtraction>;
  /** Applies the contractor's correction ("el valor mensual es 4.000.000") to an extraction. */
  correctExtraction(extraction: ContractExtraction, instruction: string): Promise<ContractExtraction>;
  /** Reads a social-security payment sheet (PILA): operator, entities, values, PIN… Null if unreadable. */
  extractSocialSecurity(doc: DocumentInput): Promise<Omit<SocialSecurity, 'userId'> | null>;
  /** Identifies the supports inside a PDF (one or several, with their pages) against the checklist. */
  classifySupports(doc: DocumentInput, types: { code: string; label: string }[]): Promise<SupportSegment[]>;
}

export interface STT {
  transcribe(audio: Buffer, mime: string): Promise<string>;
}

export interface Store {
  getUserByPhone(phone: string): Promise<User | null>;
  getUser(id: string): Promise<User>;
  getEntity(id: string): Promise<Entity>;
  /** Entities configured and open to contractors, for the choice at registration. */
  listEntities(): Promise<Entity[]>;
  /**
   * Request to configure an institution that is not in the system yet ("Otra"). The first request for
   * an institution grants the contractor one free report.
   */
  createInstitutionRequest(input: {
    userId: string;
    institutionName: string;
    modelSupportId: string;
    contractSupportId: string;
  }): Promise<{ firstForInstitution: boolean; requestId: string }>;
  /** Makes the contractor an Aliado with a fresh referral code (idempotent per user). */
  createAlly(userId: string, institutionRequestId: string | null): Promise<{ code: string }>;
  allyStatus(userId: string): Promise<AllyStatus | null>;
  markAllyLevelsNotified(userId: string): Promise<void>;
  /** Links a contractor to the Aliado who referred them (only once, within 30 days of registering). */
  applyReferral(userId: string, code: string): Promise<ReferralResult>;
  /** Name of the institution the contractor asked us to configure and is still pending, if any. */
  pendingInstitutionRequest(userId: string): Promise<string | null>;
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
  /** The contractor's most recent note, to undo it. */
  lastNote(userId: string): Promise<Note | null>;
  /** Deletes a note; its photos stay stored but unlinked. */
  deleteNote(id: string): Promise<void>;
  /** Starts a report over: deletes its notes (photos are kept, unlinked) and its draft. */
  resetPeriod(contractId: string, periodNumber: number, from: IsoDate, to: IsoDate): Promise<number>;

  addEvidence(e: Evidence): Promise<void>;
  getEvidence(id: string): Promise<Evidence>;

  listDrafts(contractId: string, periodNumber: number): Promise<Draft[]>;
  saveDraft(d: Draft): Promise<void>;

  addSupport(s: SupportFile): Promise<void>;
  listSupports(userId: string): Promise<SupportFile[]>;
  getSocialSecurity(userId: string, contributionMonth: IsoDate): Promise<SocialSecurity | null>;
  /** Stores the data read from a PILA (confirmed), linked to its support file. */
  saveSocialSecurity(ss: SocialSecurity, supportId: string): Promise<void>;

  /** New contractor after consent (status onboarding). */
  createUser(phone: string): Promise<User>;
  recordConsent(input: {
    userId: string;
    phone: string;
    policyVersion: string;
    accepted: boolean;
    wamid: string;
  }): Promise<void>;
  /** Saves identity and bank data taken from the contract (encrypted at rest). */
  saveUserProfile(user: User): Promise<void>;
  /** Matches the contracting entity by NIT (digits) or name; null if the entity is not configured. */
  findEntity(nit: string | null, name: string): Promise<Entity | null>;
  /** Looks up the entity contract registry by contract code and contractor document; null if absent. */
  findRegistryEntry(entityId: string, contractCode: string, docNumber: string): Promise<RegistryEntry | null>;
  /** Creates an active contract with its obligations and payment schedule. */
  createContract(input: NewContract): Promise<Contract>;

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
  /** Sends a message right away, before the turn ends (e.g. "estoy leyendo tus documentos…"). */
  progress?: (to: string, out: Outgoing) => Promise<void>;
  /** Splits a PDF (pages from..to, 1-based). Without it, each support keeps the whole file. */
  extractPages?: (data: Buffer, from: number, to: number) => Promise<Buffer>;
}
