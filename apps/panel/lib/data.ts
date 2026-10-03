import 'server-only';
import { demoData } from '@cuentasbot/conversation';
import { supabaseConfigured, supabaseServer } from './supabase';

export interface EntityRow {
  id: string;
  name: string;
  shortName: string;
  nit: string;
  city: string;
}

export interface VariableRow {
  key: string;
  label: string;
  type: string;
  scope: string;
  source: string;
  defaultValue: string;
}

export interface ContractorRow {
  id: string;
  name: string;
  phoneMasked: string;
  contracts: number;
}

export interface AccountRow {
  contract: string;
  contractor: string;
  entity: string;
  number: number;
  from: string;
  to: string;
  amount: number;
  status: string;
}

export interface DataSource {
  mode: 'demo' | 'supabase';
  listEntities(): Promise<EntityRow[]>;
  getEntity(id: string): Promise<EntityRow | null>;
  listVariables(entityId: string): Promise<VariableRow[]>;
  addVariable(entityId: string, v: VariableRow): Promise<void>;
  listContractors(): Promise<ContractorRow[]>;
  listAccounts(): Promise<AccountRow[]>;
}

const mask = (phone: string) => `${phone.slice(0, 5)}*****${phone.slice(-2)}`;

// ---------------------------------------------------------------------------
// Demo mode: synthetic data in memory (no Supabase credentials configured).
// ---------------------------------------------------------------------------
const g = globalThis as unknown as {
  __cbDemo?: { data: ReturnType<typeof demoData>; vars: Map<string, VariableRow[]> };
};
function demo() {
  if (!g.__cbDemo) {
    g.__cbDemo = {
      data: demoData(),
      vars: new Map([
        [
          'ent-hrno',
          [
            {
              key: 'codigo_formato_supervision',
              label: 'Código del formato de supervisión',
              type: 'text',
              scope: 'entity',
              source: 'admin',
              defaultValue: 'MA-GH-IS-03',
            },
            {
              key: 'version_formato_supervision',
              label: 'Versión del formato de supervisión',
              type: 'text',
              scope: 'entity',
              source: 'admin',
              defaultValue: '4.0',
            },
          ],
        ],
      ]),
    };
  }
  return g.__cbDemo;
}

const demoSource: DataSource = {
  mode: 'demo',
  async listEntities() {
    return demo().data.entities.map((e) => ({
      id: e.id,
      name: e.name,
      shortName: e.shortName,
      nit: e.nit,
      city: e.city,
    }));
  },
  async getEntity(id) {
    return (await demoSource.listEntities()).find((e) => e.id === id) ?? null;
  },
  async listVariables(entityId) {
    return demo().vars.get(entityId) ?? [];
  },
  async addVariable(entityId, v) {
    const list = demo().vars.get(entityId) ?? [];
    demo().vars.set(entityId, [...list.filter((x) => x.key !== v.key), v]);
  },
  async listContractors() {
    const { users, contracts } = demo().data;
    return users.map((u) => ({
      id: u.id,
      name: u.fullName,
      phoneMasked: mask(u.phone),
      contracts: contracts.filter((c) => c.userId === u.id).length,
    }));
  },
  async listAccounts() {
    const { periods, contracts, users, entities } = demo().data;
    return periods.map((p) => {
      const c = contracts.find((x) => x.id === p.contractId)!;
      return {
        contract: c.fullNumber,
        contractor: users.find((u) => u.id === c.userId)!.fullName,
        entity: entities.find((e) => e.id === c.entityId)!.shortName,
        number: p.number,
        from: p.from,
        to: p.to,
        amount: p.amount,
        status: p.status,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// Supabase mode: queries run as the signed-in staff member (RLS applies).
// ---------------------------------------------------------------------------
const supabaseSource: DataSource = {
  mode: 'supabase',
  async listEntities() {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from('entities')
      .select('id, name, short_name, nit, municipality')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      shortName: e.short_name,
      nit: e.nit ?? '',
      city: e.municipality ?? '',
    }));
  },
  async getEntity(id) {
    return (await supabaseSource.listEntities()).find((e) => e.id === id) ?? null;
  },
  async listVariables(entityId) {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from('entity_variables')
      .select('key, label, type, scope, source, default_value')
      .eq('entity_id', entityId)
      .order('key');
    if (error) throw error;
    return (data ?? []).map((v) => ({
      key: v.key,
      label: v.label,
      type: v.type,
      scope: v.scope,
      source: v.source,
      defaultValue: v.default_value == null ? '' : String(v.default_value),
    }));
  },
  async addVariable(entityId, v) {
    const sb = await supabaseServer();
    const { error } = await sb.from('entity_variables').upsert(
      {
        entity_id: entityId,
        key: v.key,
        label: v.label,
        type: v.type,
        scope: v.scope,
        source: v.source,
        default_value: v.defaultValue === '' ? null : v.defaultValue,
      },
      { onConflict: 'entity_id,key' },
    );
    if (error) throw error;
  },
  async listContractors() {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from('users')
      .select('id, full_name, phone_e164, contracts(count)')
      .order('full_name');
    if (error) throw error;
    return (data ?? []).map((u) => ({
      id: u.id,
      name: u.full_name ?? '(sin nombre)',
      phoneMasked: mask(u.phone_e164),
      contracts: (u.contracts as unknown as { count: number }[])[0]?.count ?? 0,
    }));
  },
  async listAccounts() {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from('periods')
      .select(
        'report_number, date_from, date_to, amount, status, contracts(number_full, users(full_name), entities(short_name))',
      )
      .order('date_to', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []).map((p) => {
      const c = p.contracts as unknown as {
        number_full: string;
        users: { full_name: string };
        entities: { short_name: string };
      };
      return {
        contract: c.number_full,
        contractor: c.users?.full_name ?? '',
        entity: c.entities?.short_name ?? '',
        number: p.report_number,
        from: p.date_from,
        to: p.date_to,
        amount: Number(p.amount),
        status: p.status,
      };
    });
  },
};

export function dataSource(): DataSource {
  return supabaseConfigured() ? supabaseSource : demoSource;
}
