import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { purgeExpiredFiles, retentionCutoff } from '../src/runtime/retention.js';

type Row = Record<string, unknown>;

/** Just enough of supabase-js for the purge: filters lt/neq/in and storage list/remove. */
function fakeSupabase(
  tables: Record<string, Row[]>,
  files: Record<string, { name: string; created_at: string }[]>,
) {
  const removed: string[] = [];
  const query = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    let op: 'select' | 'update' | 'delete' = 'select';
    let patch: Row = {};
    const q = {
      select: () => {
        if (op === 'delete') tables[table] = (tables[table] ?? []).filter((r) => !rows.includes(r));
        return q;
      },
      eq: (k: string, v: unknown) => {
        rows = rows.filter((r) => r[k] === v);
        return q;
      },
      lt: (k: string, v: string) => {
        rows = rows.filter((r) => String(r[k]) < v);
        return q;
      },
      neq: (k: string, v: unknown) => {
        rows = rows.filter((r) => r[k] !== v);
        return q;
      },
      or: () => q,
      limit: () => q,
      in: (k: string, vs: unknown[]) => {
        rows = rows.filter((r) => vs.includes(r[k]));
        if (op === 'delete') tables[table] = (tables[table] ?? []).filter((r) => !rows.includes(r));
        if (op === 'update') for (const r of rows) Object.assign(r, patch);
        return q;
      },
      update: (p: Row) => {
        op = 'update';
        patch = p;
        return q;
      },
      delete: () => {
        op = 'delete';
        return q;
      },
      // biome-ignore lint/suspicious/noThenProperty: supabase-js query builders are awaited as thenables.
      then: (ok: (v: { data: Row[]; error: null }) => unknown) =>
        Promise.resolve({ data: rows, error: null }).then(ok),
    };
    return q;
  };
  const sb = {
    from: query,
    storage: {
      from: () => ({
        list: async (prefix: string) => ({ data: files[prefix] ?? [] }),
        remove: async (paths: string[]) => {
          removed.push(...paths);
          return { data: null, error: null };
        },
      }),
    },
  } as unknown as SupabaseClient;
  return { sb, removed, tables };
}

const log = { info: () => undefined, error: () => undefined };

describe('retention purge (data policy, section 7)', () => {
  it('cuts 24 months back', () => {
    expect(retentionCutoff(new Date('2028-10-17T00:00:00Z')).toISOString()).toBe('2026-10-17T00:00:00.000Z');
  });

  it('deletes supports and evidences past 24 months, never the signature, and old delivery copies', async () => {
    const now = new Date('2028-11-01T00:00:00Z');
    const { sb, removed, tables } = fakeSupabase(
      {
        supports: [
          {
            id: 's-old',
            code: 'PILA',
            original_path: 'u/old.pdf',
            normalized_path: null,
            created_at: '2026-10-01',
          },
          {
            id: 's-sig',
            code: 'FIRMA',
            original_path: 'u/firma.jpg',
            normalized_path: null,
            created_at: '2026-10-01',
          },
          {
            id: 's-new',
            code: 'PILA',
            original_path: 'u/new.pdf',
            normalized_path: null,
            created_at: '2028-10-01',
          },
        ],
        social_security_payments: [{ id: 'p1', support_id: 's-old' }],
        institution_requests: [],
        delegations: [
          { id: 'd-declined', status: 'declined', created_at: '2028-10-30' },
          { id: 'd-old', status: 'pending', created_at: '2028-09-01' },
          { id: 'd-new', status: 'pending', created_at: '2028-10-25' },
          { id: 'd-active', status: 'active', created_at: '2027-01-01' },
        ],
        evidences: [
          { id: 'e-old', file_path: 'u/e-old.jpg', created_at: '2026-09-30' },
          { id: 'e-new', file_path: 'u/e-new.jpg', created_at: '2028-10-30' },
        ],
      },
      {
        packages: [{ name: 'abc', created_at: '' }],
        'packages/abc': [{ name: 'cuenta.zip', created_at: '2028-09-01T00:00:00Z' }],
        held: [],
      },
    );
    const r = await purgeExpiredFiles(sb, now, log);
    expect(r).toEqual({ supports: 1, evidences: 1, documents: 1, requests: 2 });
    expect(tables.delegations!.map((d) => d.id)).toEqual(['d-new', 'd-active']);
    expect(removed).toEqual(['u/old.pdf', 'u/e-old.jpg', 'packages/abc/cuenta.zip']);
    expect(tables.supports!.map((s) => s.id)).toEqual(['s-sig', 's-new']);
    expect(tables.social_security_payments![0]!.support_id).toBeNull();
  });
});
