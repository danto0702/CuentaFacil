import { randomUUID } from 'node:crypto';
import { compareIso, type IsoDate } from '@cuentasbot/shared';
import type {
  BillingSettings,
  CashCodeResult,
  Charge,
  ChargeMethod,
  Contract,
  ConversationState,
  Draft,
  Entity,
  Evidence,
  NewContract,
  Note,
  Period,
  PriorPaymentRecord,
  RegistryEntry,
  SocialSecurity,
  SupportFile,
  SupportType,
  User,
} from './domain.js';
import type { Store } from './ports.js';
import { contractFromSetup, institutionKey } from './setup.js';

export interface MemoryData {
  users: User[];
  entities: Entity[];
  supportTypes: Record<string, SupportType[]>;
  contracts: Contract[];
  periods: Period[];
  priorPayments: PriorPaymentRecord[];
  notes: Note[];
  evidences: Evidence[];
  drafts: Draft[];
  supports: SupportFile[];
  socialSecurity: SocialSecurity[];
  conversations: ConversationState[];
  consents?: {
    userId: string;
    phone: string;
    kind?: 'privacy_policy' | 'terms';
    policyVersion: string;
    accepted: boolean;
    wamid: string;
  }[];
  /** Entity contract registry, keyed by entity, contract code (no leading zeros) and document digits. */
  institutionRequests?: {
    userId: string;
    institutionName: string;
    institutionKey: string;
    modelSupportId: string;
    contractSupportId: string;
    firstForInstitution: boolean;
  }[];
  freeReports?: Record<string, number>;
  billing?: BillingSettings;
  charges?: (Charge & { providerTx?: string })[];
  cashCodes?: {
    code: string;
    userId: string;
    product: 'setup' | 'report';
    amount: number;
    expiresAt: string;
    usedAt?: string;
  }[];
  periodCharges?: Record<string, 'paid' | 'free' | 'pilot'>;
  tickets?: { userId: string; subject: string }[];
  allies?: { userId: string; code: string; level: number; newLevels: number[] }[];
  referredBy?: Record<string, string>;
  registry?: (RegistryEntry & { entityId: string; contractCode: string; docNumber: string })[];
}

export function emptyData(): MemoryData {
  return {
    users: [],
    entities: [],
    supportTypes: {},
    contracts: [],
    periods: [],
    priorPayments: [],
    notes: [],
    evidences: [],
    drafts: [],
    supports: [],
    socialSecurity: [],
    conversations: [],
    consents: [],
  };
}

const clone = <T>(x: T): T => structuredClone(x);

/** In-memory Store for tests and the local simulator. The Supabase-backed Store arrives in Phase 1. */
export class MemoryStore implements Store {
  constructor(public data: MemoryData = emptyData()) {}

  private find<T>(items: T[], pred: (x: T) => boolean, what: string): T {
    const x = items.find(pred);
    if (!x) throw new Error(`${what} not found`);
    return clone(x);
  }

  async getUserByPhone(phone: string) {
    const u = this.data.users.find((x) => x.phone === phone);
    return u ? clone(u) : null;
  }
  async getUser(id: string) {
    return this.find(this.data.users, (u) => u.id === id, `user ${id}`);
  }
  async getEntity(id: string) {
    return this.find(this.data.entities, (e) => e.id === id, `entity ${id}`);
  }
  async listSupportTypes(entityId: string) {
    return clone(this.data.supportTypes[entityId] ?? []);
  }
  async listContracts(userId: string) {
    return clone(this.data.contracts.filter((c) => c.userId === userId));
  }
  async getContract(id: string) {
    return this.find(this.data.contracts, (c) => c.id === id, `contract ${id}`);
  }
  async updateContract(contract: Contract) {
    this.data.contracts = this.data.contracts.map((c) => (c.id === contract.id ? clone(contract) : c));
  }
  async listPeriods(contractId: string) {
    return clone(
      this.data.periods.filter((p) => p.contractId === contractId).sort((a, b) => a.number - b.number),
    );
  }
  async savePeriods(contractId: string, periods: Period[]) {
    this.data.periods = [...this.data.periods.filter((p) => p.contractId !== contractId), ...clone(periods)];
  }
  async listPriorPayments(contractId: string) {
    return clone(this.data.priorPayments.filter((p) => p.contractId === contractId));
  }
  async addNote(note: Note) {
    this.data.notes.push(clone(note));
  }
  async updateNote(note: Note) {
    this.data.notes = this.data.notes.map((n) => (n.id === note.id ? clone(note) : n));
  }
  async lastNote(userId: string) {
    const mine = this.data.notes.filter((n) => n.userId === userId);
    return mine.length ? clone(mine[mine.length - 1]!) : null;
  }
  async deleteNote(id: string) {
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
  }
  async resetPeriod(contractId: string, periodNumber: number, from: IsoDate, to: IsoDate) {
    const inPeriod = (n: Note) => n.contractId === contractId && n.date >= from && n.date <= to;
    const count = this.data.notes.filter(inPeriod).length;
    this.data.notes = this.data.notes.filter((n) => !inPeriod(n));
    this.data.drafts = this.data.drafts.filter(
      (d) => !(d.contractId === contractId && d.periodNumber === periodNumber),
    );
    return count;
  }
  async getNote(id: string) {
    return this.find(this.data.notes, (n) => n.id === id, `note ${id}`);
  }
  async listNotes(contractId: string, from: IsoDate, to: IsoDate) {
    return clone(
      this.data.notes.filter(
        (n) => n.contractId === contractId && compareIso(from, n.date) <= 0 && compareIso(n.date, to) <= 0,
      ),
    );
  }
  async addEvidence(e: Evidence) {
    this.data.evidences.push(e);
  }
  async getEvidence(id: string) {
    return this.find(this.data.evidences, (e) => e.id === id, `evidence ${id}`);
  }
  async listDrafts(contractId: string, periodNumber: number) {
    return clone(
      this.data.drafts.filter((d) => d.contractId === contractId && d.periodNumber === periodNumber),
    );
  }
  async saveDraft(d: Draft) {
    this.data.drafts = [
      ...this.data.drafts.filter(
        (x) =>
          !(
            x.contractId === d.contractId &&
            x.periodNumber === d.periodNumber &&
            x.obligationKey === d.obligationKey
          ),
      ),
      clone(d),
    ];
  }
  async addSupport(s: SupportFile) {
    this.data.supports = [...this.data.supports.filter((x) => x.id !== s.id), s];
  }
  async openSupportTicket(userId: string, subject: string) {
    this.data.tickets = [...(this.data.tickets ?? []), { userId, subject }];
  }
  async acceptExpiredSupports(ids: string[]) {
    this.data.supports = this.data.supports.map((x) =>
      ids.includes(x.id) ? { ...x, acceptedExpired: true } : x,
    );
  }
  async listSupports(userId: string) {
    return this.data.supports.filter((s) => s.userId === userId);
  }
  async saveSocialSecurity(ss: SocialSecurity, _supportId: string) {
    this.data.socialSecurity = [
      ...this.data.socialSecurity.filter(
        (x) => !(x.userId === ss.userId && x.contributionMonth === ss.contributionMonth),
      ),
      clone(ss),
    ];
  }
  async getSocialSecurity(userId: string, contributionMonth: IsoDate) {
    const s = this.data.socialSecurity.find(
      (x) => x.userId === userId && x.contributionMonth === contributionMonth,
    );
    return s ? clone(s) : null;
  }
  async createUser(phone: string) {
    const user: User = {
      id: randomUUID(),
      phone,
      fullName: '',
      docNumber: '',
      docIssuedIn: '',
      regime: 'simplificado',
      bankName: '',
      accountType: 'ahorros',
      accountNumber: '',
      hasArl: true,
      remindersOptOut: false,
    };
    this.data.users.push(user);
    return clone(user);
  }
  async recordConsent(c: {
    userId: string;
    phone: string;
    kind?: 'privacy_policy' | 'terms';
    policyVersion: string;
    accepted: boolean;
    wamid: string;
  }) {
    this.data.consents = [...(this.data.consents ?? []), clone(c)];
  }
  async acceptedVersion(userId: string, kind: 'privacy_policy' | 'terms') {
    const mine = (this.data.consents ?? []).filter(
      (c) => c.userId === userId && c.accepted && (c.kind ?? 'privacy_policy') === kind,
    );
    return mine.at(-1)?.policyVersion ?? null;
  }
  async saveUserProfile(user: User) {
    this.data.users = this.data.users.map((u) => (u.id === user.id ? clone(user) : u));
  }
  async setRemindersOptOut(userId: string, optOut: boolean) {
    this.data.users = this.data.users.map((u) => (u.id === userId ? { ...u, remindersOptOut: optOut } : u));
  }
  async findEntity(nit: string | null, name: string) {
    const digits = (v: string) => v.replace(/\D/g, '').slice(0, 9);
    const n = name.toLocaleUpperCase('es-CO');
    const e = this.data.entities.find(
      (x) => (nit && digits(x.nit) === digits(nit)) || n.includes(x.name.toLocaleUpperCase('es-CO')),
    );
    return e ? clone(e) : null;
  }
  async listEntities() {
    return clone(this.data.entities);
  }
  async createInstitutionRequest(input: {
    userId: string;
    institutionName: string;
    modelSupportId: string;
    contractSupportId: string;
  }) {
    const key = institutionKey(input.institutionName);
    const known =
      this.data.entities.some((e) => institutionKey(e.name) === key) ||
      (this.data.institutionRequests ?? []).some((r) => r.institutionKey === key);
    const firstForInstitution = !known;
    this.data.institutionRequests = [
      ...(this.data.institutionRequests ?? []),
      { ...input, institutionKey: key, firstForInstitution },
    ];
    if (firstForInstitution) {
      this.data.freeReports = {
        ...this.data.freeReports,
        [input.userId]: (this.data.freeReports?.[input.userId] ?? 0) + 1,
      };
    }
    return { firstForInstitution, requestId: `req-${this.data.institutionRequests.length}` };
  }
  async createAlly(userId: string, _institutionRequestId: string | null) {
    const existing = (this.data.allies ?? []).find((a) => a.userId === userId);
    if (existing) return { code: existing.code };
    const code = `ALI-${String((this.data.allies ?? []).length + 1).padStart(4, '0')}`;
    this.data.allies = [...(this.data.allies ?? []), { userId, code, level: 0, newLevels: [] }];
    return { code };
  }
  async allyStatus(userId: string) {
    const a = (this.data.allies ?? []).find((x) => x.userId === userId);
    if (!a) return null;
    return {
      code: a.code,
      level: a.level,
      premium: a.level >= 10,
      referrals: Object.values(this.data.referredBy ?? {}).filter((c) => c === a.code).length,
      freeReports: this.data.freeReports?.[userId] ?? 0,
      newLevels: [...a.newLevels],
    };
  }
  async getBillingSettings(): Promise<BillingSettings> {
    return clone(this.data.billing ?? { mode: 'pilot', prices: { setup: 15_000, report: 50_000 } });
  }
  async findCharge(contractId: string, product: 'setup' | 'report', periodNumber: number | null) {
    const c = (this.data.charges ?? []).find(
      (x) =>
        x.contractId === contractId &&
        x.product === product &&
        x.periodNumber === periodNumber &&
        x.status !== 'cancelled',
    );
    return c ? clone(c) : null;
  }
  async getCharge(id: string) {
    return clone(this.find(this.data.charges ?? [], (c) => c.id === id, `charge ${id}`));
  }
  async openCharge(input: Omit<Charge, 'id' | 'status' | 'method' | 'reference'>) {
    const existing = await this.findCharge(input.contractId, input.product, input.periodNumber);
    if (existing && existing.status !== 'pending') return existing;
    const charge: Charge = existing
      ? { ...existing, amount: input.amount, coversSetup: input.coversSetup }
      : {
          ...input,
          id: randomUUID(),
          status: 'pending',
          method: null,
          reference: `CF-${randomUUID().slice(0, 8)}`,
        };
    this.data.charges = [...(this.data.charges ?? []).filter((c) => c.id !== charge.id), charge];
    return clone(charge);
  }
  async settleCharge(
    id: string,
    status: 'paid' | 'free' | 'pilot',
    method: ChargeMethod,
    providerTx?: string,
  ) {
    const c = await this.getCharge(id);
    this.data.charges = (this.data.charges ?? []).map((x) =>
      x.id === id ? { ...x, status, method, ...(providerTx ? { providerTx } : {}) } : x,
    );
    if (c.coversSetup) {
      const setup = await this.openCharge({
        userId: c.userId,
        product: 'setup',
        contractId: c.contractId,
        periodNumber: null,
        coversSetup: false,
        amount: 0,
      });
      if (setup.status === 'pending') await this.settleCharge(setup.id, status, method);
    }
  }
  async useFreeGrant(userId: string, _chargeId: string) {
    const n = this.data.freeReports?.[userId] ?? 0;
    if (n <= 0) return false;
    this.data.freeReports = { ...this.data.freeReports, [userId]: n - 1 };
    return true;
  }
  async redeemCashCode(userId: string, code: string, chargeId: string): Promise<CashCodeResult> {
    const wanted = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const c = (this.data.cashCodes ?? []).find((x) => x.code.replace(/[^A-Z0-9]/g, '') === wanted);
    if (!c) return { ok: false, reason: 'not_found' };
    if (c.userId !== userId) return { ok: false, reason: 'other_user' };
    if (c.usedAt) return { ok: false, reason: 'used' };
    if (c.expiresAt < new Date().toISOString()) return { ok: false, reason: 'expired' };
    const charge = await this.getCharge(chargeId);
    if (charge.amount !== c.amount || charge.product !== c.product)
      return { ok: false, reason: 'wrong_amount' };
    c.usedAt = new Date().toISOString();
    return { ok: true };
  }
  async markPeriodCharge(contractId: string, periodNumber: number, charge: 'paid' | 'free' | 'pilot') {
    this.data.periodCharges = { ...this.data.periodCharges, [`${contractId}:${periodNumber}`]: charge };
  }

  async markAllyLevelsNotified(userId: string) {
    const a = (this.data.allies ?? []).find((x) => x.userId === userId);
    if (a) a.newLevels = [];
  }
  async applyReferral(userId: string, code: string) {
    const a = (this.data.allies ?? []).find((x) => x.code === code.toUpperCase());
    if (!a) return 'invalid' as const;
    if (a.userId === userId) return 'own' as const;
    if (this.data.referredBy?.[userId]) return 'already' as const;
    this.data.referredBy = { ...this.data.referredBy, [userId]: a.code };
    return 'ok' as const;
  }
  async pendingInstitutionRequest(userId: string) {
    return (
      (this.data.institutionRequests ?? []).findLast((r) => r.userId === userId)?.institutionName ?? null
    );
  }
  async findRegistryEntry(entityId: string, contractCode: string, docNumber: string) {
    const doc = docNumber.replace(/\D/g, '');
    const hit = (this.data.registry ?? []).find(
      (r) => r.entityId === entityId && r.contractCode === contractCode && r.docNumber === doc,
    );
    return hit ? { startDate: hit.startDate, termDays: hit.termDays, initialValue: hit.initialValue } : null;
  }
  async createContract(input: NewContract) {
    const c = contractFromSetup(randomUUID(), input);
    this.data.contracts.push(c);
    return clone(c);
  }
  async getConversation(userId: string) {
    const c = this.data.conversations.find((x) => x.userId === userId);
    return c ? clone(c) : null;
  }
  async saveConversation(state: ConversationState) {
    this.data.conversations = [
      ...this.data.conversations.filter((c) => c.userId !== state.userId),
      clone(state),
    ];
  }
}

// JSON persistence for the simulator (Buffers as base64).
export function serialize(data: MemoryData): string {
  return JSON.stringify(data, (_k, v) =>
    v && v.type === 'Buffer' && Array.isArray(v.data) ? { $b64: Buffer.from(v.data).toString('base64') } : v,
  );
}

export function deserialize(json: string): MemoryData {
  return JSON.parse(json, (_k, v) =>
    v && typeof v === 'object' && '$b64' in v ? Buffer.from(v.$b64, 'base64') : v,
  );
}
