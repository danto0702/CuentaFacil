import { compareIso, type IsoDate } from '@cuentasbot/shared';
import type {
  Contract,
  ConversationState,
  Draft,
  Entity,
  Evidence,
  Note,
  Period,
  PriorPaymentRecord,
  SocialSecurity,
  SupportFile,
  SupportType,
  User,
} from './domain.js';
import type { Store } from './ports.js';

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
  async listSupports(userId: string) {
    return this.data.supports.filter((s) => s.userId === userId);
  }
  async getSocialSecurity(userId: string, contributionMonth: IsoDate) {
    const s = this.data.socialSecurity.find(
      (x) => x.userId === userId && x.contributionMonth === contributionMonth,
    );
    return s ? clone(s) : null;
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
