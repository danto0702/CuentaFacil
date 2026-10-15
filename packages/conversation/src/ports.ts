import type { IsoDate } from '@cuentasbot/shared';
import type {
  AllyStatus,
  BillingSettings,
  CashCodeResult,
  Charge,
  ChargeMethod,
  Contract,
  ContractExtraction,
  ConversationState,
  Delegation,
  DocumentInput,
  Draft,
  Entity,
  Evidence,
  NewContract,
  Note,
  Obligation,
  Period,
  PreviousReportReading,
  PriorPaymentRecord,
  ReferralResult,
  RegistryEntry,
  SocialSecurity,
  SupportFile,
  SupportSegment,
  SupportType,
  User,
  WritingStyle,
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
export type MessageIntentKind =
  | 'activity'
  | 'redo'
  | 'reset'
  | 'open_report'
  | 'draft'
  | 'generate'
  | 'status'
  | 'guide'
  | 'contracts'
  | 'add_contract'
  | 'my_data'
  | 'signature'
  | 'undo_note'
  | 'move_note'
  | 'support'
  | 'help'
  | 'menu'
  | 'unclear';

/** What a free-text message means: a work activity to record, or a request to Pascal (ADR-037). */
export interface MessageIntent {
  intent: MessageIntentKind;
  /** 1..12 when the message names a month. */
  month: number | null;
  /** When unclear: the most likely meaning, offered as a button. */
  guess: MessageIntentKind | null;
  /** When unclear: a short question back to the contractor, in Colombian Spanish (tuteo). */
  question: string | null;
  /** For an activity: the day it happened when the message says or implies it ("el lunes pasado"). */
  date: IsoDate | null;
}

export interface InstitutionDocuments {
  /** `code` matches INSTITUTION_DOCS; null for a document the contractor wrote. */
  required: { code: string | null; label: string }[];
  models: Record<string, string>;
}

export interface AI {
  /** Any free-text message: is it a work activity or a request to the assistant (cheapest model)? */
  interpretMessage(text: string, today: IsoDate): Promise<MessageIntent>;
  classifyNote(text: string, obligations: Obligation[]): Promise<ClassifyResult>;
  /** Must only use facts present in the notes; returns needs_input when there is nothing to say. */
  draftObligation(obligation: Obligation, notes: Note[], style?: WritingStyle | null): Promise<DraftResult>;
  /** Reads a report the contractor made before (PDF or Word): is it one, and how do they write? */
  readPreviousReport(doc: DocumentInput): Promise<PreviousReportReading>;
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
    /** What the institution asks for in each cuenta de cobro, and the model of each generated document. */
    documents?: InstitutionDocuments;
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
  /** The contractor's writing style (ADR-046); null removes it. */
  saveWritingStyle(userId: string, style: WritingStyle | null): Promise<void>;
  getWritingStyle(userId: string): Promise<WritingStyle | null>;
  /** The contractor generates with these expired supports anyway (their responsibility). */
  acceptExpiredSupports(ids: string[]): Promise<void>;
  /** Asks a person of the team to write to the contractor (shown in the panel). */
  openSupportTicket(userId: string, subject: string): Promise<void>;
  getSocialSecurity(userId: string, contributionMonth: IsoDate): Promise<SocialSecurity | null>;
  /** Stores the data read from a PILA (confirmed), linked to its support file. */
  saveSocialSecurity(ss: SocialSecurity, supportId: string): Promise<void>;

  // Billing (ADR-034)
  getBillingSettings(): Promise<BillingSettings>;
  /** The live (not cancelled) charge for a product, contract and period; null if none. */
  findCharge(
    contractId: string,
    product: 'setup' | 'report',
    periodNumber: number | null,
  ): Promise<Charge | null>;
  getCharge(id: string): Promise<Charge>;
  /** Creates a pending charge (unique reference) or updates the amount of the pending one. */
  openCharge(input: Omit<Charge, 'id' | 'status' | 'method' | 'reference'>): Promise<Charge>;
  /** Marks a charge settled (paid, free or pilot); also settles the setup charge it covers. */
  settleCharge(
    id: string,
    status: 'paid' | 'free' | 'pilot',
    method: ChargeMethod,
    providerTx?: string,
  ): Promise<void>;
  /** Uses one unexpired free report of the user for this charge; false if none. */
  useFreeGrant(userId: string, chargeId: string): Promise<boolean>;
  /** Validates and uses a cash code for this charge (same user, same amount, unused, unexpired). */
  redeemCashCode(userId: string, code: string, chargeId: string): Promise<CashCodeResult>;
  /** How the delivered report was charged (counts for the Programa de Aliados only when 'paid'). */
  markPeriodCharge(
    contractId: string,
    periodNumber: number,
    charge: 'paid' | 'free' | 'pilot',
  ): Promise<void>;

  /** New contractor after consent (status onboarding). */
  createUser(phone: string): Promise<User>;
  recordConsent(input: {
    userId: string;
    phone: string;
    /** Default: privacy_policy. */
    kind?: 'privacy_policy' | 'terms';
    policyVersion: string;
    accepted: boolean;
    wamid: string;
  }): Promise<void>;
  /** Latest version of the policy or terms the user accepted; null if never. */
  acceptedVersion(userId: string, kind: 'privacy_policy' | 'terms'): Promise<string | null>;
  /** Saves identity and bank data taken from the contract (encrypted at rest). */
  saveUserProfile(user: User): Promise<void>;
  // Gestor (ADR-042)
  /** Asks a person to authorize a gestor; one live delegation per manager and phone. */
  createDelegation(input: {
    managerId: string;
    personName: string;
    personPhone: string;
  }): Promise<Delegation>;
  getDelegation(id: string): Promise<Delegation | null>;
  /** Delegations of a manager (all statuses), oldest first. */
  listDelegations(managerId: string): Promise<Delegation[]>;
  /** Pending delegations addressed to this phone. */
  pendingDelegationsFor(phone: string): Promise<Delegation[]>;
  /** The person answered: active (linked to their user) or declined. */
  answerDelegation(
    id: string,
    answer: { accepted: true; personId: string } | { accepted: false },
  ): Promise<void>;
  /** Users who manage this person (active delegations). */
  managersOf(personId: string): Promise<User[]>;
  /** Active delegations where this user is the person managed. */
  delegationsOf(personId: string): Promise<Delegation[]>;
  /** Ends an active delegation (by the person or the gestor). */
  revokeDelegation(id: string): Promise<void>;
  /** STOP / «activar recordatorios»: whether Pascal may write first (reminders). */
  setRemindersOptOut(userId: string, optOut: boolean): Promise<void>;
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
  /** Problems Pascal works around (a voice note it could not transcribe): for the logs and alerts. */
  warn?: (event: string, data: Record<string, unknown>) => void;
  /** Online payment links (Wompi). Without it only cash codes and free reports are offered. */
  payments?: { checkoutUrl(charge: Charge, phone: string): string };
  /** Splits a PDF (pages from..to, 1-based). Without it, each support keeps the whole file. */
  extractPages?: (data: Buffer, from: number, to: number) => Promise<Buffer>;
  /**
   * Asks a person to authorize a gestor (approved WhatsApp template, ADR-042). Without it the gestor is
   * told to ask the person to write to Pascal and accept from there.
   */
  inviteDelegate?: (d: Delegation, managerName: string) => Promise<void>;
  /** Writes to another number outside the current turn (e.g. tells the gestor the person accepted). */
  notify?: (to: string, out: Outgoing[]) => Promise<void>;
}
