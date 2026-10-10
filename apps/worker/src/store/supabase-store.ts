import { createHash } from 'node:crypto';
import type {
  Contract,
  ConversationState,
  Draft,
  Entity,
  EntitySettings,
  Evidence,
  NewContract,
  Note,
  Obligation,
  Period,
  PriorPaymentRecord,
  SocialSecurity,
  Store,
  SupportFile,
  SupportType,
  User,
} from '@cuentasbot/conversation';
import type { IsoDate, ScheduledPayment } from '@cuentasbot/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type FieldCipher, last4 } from '../crypto.js';

type Row = Record<string, unknown>;

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

const str = (v: unknown, fallback = '') => (v === null || v === undefined ? fallback : String(v));
const num = (v: unknown) => Number(v ?? 0);
const obligationKey = (kind: string, number: number) => `${kind}-${number}`;
const extOf = (mime: string) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' })[
    mime.split(';')[0] ?? ''
  ] ?? 'bin';

/** Maps the JSONB `entities.settings` (snake_case, see seed.sql) to the domain's EntitySettings. */
export function entitySettingsFromDb(s: Row): EntitySettings {
  const pila = (s.pila ?? {}) as Row;
  const ibc = (s.ibc ?? {}) as Row;
  const meeting = (s.meeting ?? {}) as Row;
  const pkg = (s.package ?? {}) as Row;
  return {
    defaultActivityText: str(s.default_activity_text, 'Actividad cumplida.'),
    certificateMaxAgeDays: num(s.certificate_max_age_days ?? 30),
    backgroundCheckDate: s.background_check_date === 'issue_date' ? 'issue_date' : 'report_date',
    meeting: { place: str(meeting.place), start: str(meeting.start), end: str(meeting.end) },
    pilaContributionMonth: pila.contribution_month === 'previous' ? 'previous' : 'current',
    ibcBlocking: ibc.blocking === true,
    generateWithMissing: s.generate_with_missing === true,
    package: {
      periodFolder: str(pkg.period_folder, 'CUENTAS {MES} {AÑO}'),
      uploadFolder: str(pkg.upload_folder, 'DOCUMENTOS A CARGAR'),
      zipName: str(pkg.zip_name, 'cuenta.zip'),
    },
  };
}

/** Store port on Supabase (service_role). Files live in private Storage buckets. */
export class SupabaseStore implements Store {
  constructor(
    private readonly sb: SupabaseClient,
    private readonly cipher: FieldCipher | null,
  ) {}

  // -------------------------------------------------------------------------
  // Users and entities
  // -------------------------------------------------------------------------
  private decrypt(v: unknown): string {
    if (!v) return '';
    if (!this.cipher) throw new Error('ENCRYPTION_KEY/BLIND_INDEX_KEY are not configured');
    return this.cipher.decrypt(String(v));
  }

  private toUser(r: Row): User {
    return {
      id: str(r.id),
      phone: str(r.phone_e164),
      fullName: str(r.full_name),
      docNumber: this.decrypt(r.doc_number_enc),
      docIssuedIn: str(r.doc_issued_in),
      regime: r.tax_regime === 'comun' ? 'comun' : 'simplificado',
      bankName: str(r.bank_name),
      accountType: r.bank_account_type === 'corriente' ? 'corriente' : 'ahorros',
      accountNumber: this.decrypt(r.bank_account_enc),
      hasArl: r.has_arl !== false,
      remindersOptOut: r.reminders_opt_out === true,
    };
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const r = must(
      await this.sb.from('users').select('*').eq('phone_e164', phone).is('deleted_at', null).maybeSingle(),
      'getUserByPhone',
    ) as Row | null;
    return r ? this.toUser(r) : null;
  }

  async getUser(id: string): Promise<User> {
    return this.toUser(must(await this.sb.from('users').select('*').eq('id', id).single(), 'getUser') as Row);
  }

  async getEntity(id: string): Promise<Entity> {
    const r = must(await this.sb.from('entities').select('*').eq('id', id).single(), 'getEntity') as Row;
    return {
      id: str(r.id),
      name: str(r.name),
      shortName: str(r.short_name),
      nit: str(r.nit),
      city: str(r.municipality),
      settings: entitySettingsFromDb((r.settings ?? {}) as Row),
    };
  }

  async listSupportTypes(entityId: string): Promise<SupportType[]> {
    const rows = must(
      await this.sb.from('support_types').select('*').eq('entity_id', entityId).order('bundle_order'),
      'listSupportTypes',
    ) as Row[];
    return rows.map((r) => ({
      code: str(r.code),
      label: str(r.label),
      required: r.required !== false,
      frequency: r.frequency as SupportType['frequency'],
      ...(r.max_age_days != null ? { maxAgeDays: num(r.max_age_days) } : {}),
      ...(r.bundle ? { bundle: r.bundle as 'ANTECEDENTES' | 'AFILIACIONES' } : {}),
      ...(r.bundle_order != null ? { bundleOrder: num(r.bundle_order) } : {}),
      ...(r.official_url ? { officialUrl: str(r.official_url) } : {}),
      ...(r.instructions ? { instructions: str(r.instructions) } : {}),
      ...(r.profiles ? { profiles: r.profiles as string[] } : {}),
      stage: r.stage === 'after_signature' ? 'after_signature' : 'before_generation',
    }));
  }

  async createUser(phone: string): Promise<User> {
    const r = must(
      await this.sb
        .from('users')
        .upsert({ phone_e164: phone, status: 'onboarding', deleted_at: null }, { onConflict: 'phone_e164' })
        .select('*')
        .single(),
      'createUser',
    ) as Row;
    return this.toUser(r);
  }

  async recordConsent(c: {
    userId: string;
    phone: string;
    policyVersion: string;
    accepted: boolean;
    wamid: string;
  }): Promise<void> {
    const policy = must(
      await this.sb
        .from('policy_versions')
        .select('id')
        .eq('kind', 'privacy_policy')
        .eq('version', c.policyVersion)
        .single(),
      'recordConsent.policy',
    ) as Row;
    must(
      await this.sb.from('consents').insert({
        user_id: c.userId,
        phone_e164: c.phone,
        policy_version_id: policy.id,
        accepted: c.accepted,
        evidence_wamid: c.wamid,
      }),
      'recordConsent',
    );
  }

  async saveUserProfile(u: User): Promise<void> {
    if (!this.cipher) throw new Error('ENCRYPTION_KEY/BLIND_INDEX_KEY are not configured');
    const doc = u.docNumber.replace(/\D/g, '');
    must(
      await this.sb
        .from('users')
        .update({
          full_name: u.fullName,
          doc_type: 'CC',
          doc_number_enc: doc ? this.cipher.encrypt(doc) : null,
          doc_number_bidx: doc ? this.cipher.blindIndex(doc) : null,
          doc_number_last4: doc ? last4(doc) : null,
          doc_issued_in: u.docIssuedIn || null,
          tax_regime: u.regime,
          bank_name: u.bankName || null,
          bank_account_type: u.accountType,
          bank_account_enc: u.accountNumber ? this.cipher.encrypt(u.accountNumber) : null,
          bank_account_last4: u.accountNumber ? last4(u.accountNumber) : null,
          has_arl: u.hasArl,
          status: 'active',
        })
        .eq('id', u.id),
      'saveUserProfile',
    );
  }

  async findEntity(nit: string | null, name: string): Promise<Entity | null> {
    const rows = must(
      await this.sb.from('entities').select('id, name, nit').eq('status', 'active'),
      'findEntity',
    ) as Row[];
    const digits = (v: unknown) => str(v).replace(/\D/g, '').slice(0, 9);
    const upper = name.toLocaleUpperCase('es-CO');
    const hit =
      (nit ? rows.find((r) => digits(r.nit) && digits(r.nit) === digits(nit)) : undefined) ??
      rows.find((r) => upper.includes(str(r.name).toLocaleUpperCase('es-CO')));
    return hit ? this.getEntity(str(hit.id)) : null;
  }

  /** Creates (or, for the same contractor, reconfigures) a contract with its obligations and schedule. */
  async createContract(input: NewContract): Promise<Contract> {
    const e = input.extraction;
    const paymentsCount = e.paymentsCount ?? (e.schedule.length || 1);
    const row = {
      user_id: input.userId,
      entity_id: input.entityId,
      number: e.number,
      number_full: e.fullNumber,
      secop_code: e.secopId,
      object_text: e.object,
      process_area: e.processArea,
      start_date: input.startDate,
      end_date: input.endDate,
      term_text: e.termText,
      total_value: e.totalValue,
      monthly_value: e.monthlyValue ?? Math.round(e.totalValue / paymentsCount),
      payments_count: paymentsCount,
      period_mode: input.periodMode,
      period_mode_set_at: new Date().toISOString(),
      supervisor_name: e.supervisor?.name ?? null,
      supervisor_title: e.supervisor?.title ?? null,
      status: 'active',
      extracted: e,
      confirmed_at: new Date().toISOString(),
      short_label: input.shortLabel,
      requires_certification: input.requiresCertification,
    };
    const existing = must(
      await this.sb
        .from('contracts')
        .select('id, user_id')
        .eq('entity_id', input.entityId)
        .eq('number_full', e.fullNumber)
        .maybeSingle(),
      'createContract.lookup',
    ) as Row | null;
    if (existing && str(existing.user_id) !== input.userId) {
      throw new Error('createContract: contract already registered by another contractor');
    }
    let id: string;
    if (existing) {
      id = str(existing.id);
      must(await this.sb.from('contracts').update(row).eq('id', id), 'createContract.update');
      must(
        await this.sb.from('payment_schedule').delete().eq('contract_id', id),
        'createContract.clearSchedule',
      );
      must(
        await this.sb.from('obligations').delete().eq('contract_id', id),
        'createContract.clearObligations',
      );
    } else {
      id = str(
        (
          must(
            await this.sb.from('contracts').insert(row).select('id').single(),
            'createContract.insert',
          ) as Row
        ).id,
      );
    }
    if (e.obligations.length) {
      must(
        await this.sb.from('obligations').insert(
          e.obligations.map((o) => ({
            contract_id: id,
            kind: o.kind,
            number: o.number,
            literal_text: o.text,
          })),
        ),
        'createContract.obligations',
      );
    }
    for (const p of e.schedule) {
      const sched = must(
        await this.sb
          .from('payment_schedule')
          .insert({
            contract_id: id,
            payment_number: p.paymentNumber,
            days: p.days ?? null,
            months: p.months ?? null,
            amount: p.amount,
          })
          .select('id')
          .single(),
        'createContract.schedule',
      ) as Row;
      if (p.items.length) {
        must(
          await this.sb.from('payment_schedule_items').insert(
            p.items.map((i) => ({
              schedule_id: sched.id,
              concept: i.concept,
              amount: i.amount,
              counts_for_ibc: i.countsForIbc,
            })),
          ),
          'createContract.scheduleItems',
        );
      }
    }
    return this.getContract(id);
  }

  // -------------------------------------------------------------------------
  // Contracts
  // -------------------------------------------------------------------------
  private async obligationIds(
    contractId: string,
  ): Promise<{ byKey: Map<string, string>; byId: Map<string, string> }> {
    const rows = must(
      await this.sb.from('obligations').select('id, kind, number').eq('contract_id', contractId),
      'obligationIds',
    ) as Row[];
    const byKey = new Map<string, string>();
    const byId = new Map<string, string>();
    for (const r of rows) {
      const key = obligationKey(str(r.kind), num(r.number));
      byKey.set(key, str(r.id));
      byId.set(str(r.id), key);
    }
    return { byKey, byId };
  }

  private async toContract(r: Row): Promise<Contract> {
    const id = str(r.id);
    const [obligations, duties, schedule] = await Promise.all([
      this.sb
        .from('obligations')
        .select('kind, number, literal_text')
        .eq('contract_id', id)
        .order('kind', { ascending: false })
        .order('number'),
      this.sb.from('contractor_duties').select('number, text').eq('contract_id', id).order('number'),
      this.sb
        .from('payment_schedule')
        .select(
          'payment_number, days, months, amount, payment_schedule_items(concept, amount, counts_for_ibc)',
        )
        .eq('contract_id', id)
        .order('payment_number'),
    ]);
    const obls = (must(obligations, 'obligations') as Row[]).map(
      (o): Obligation => ({
        key: obligationKey(str(o.kind), num(o.number)),
        number: num(o.number),
        kind: o.kind === 'general' ? 'general' : 'specific',
        text: str(o.literal_text),
      }),
    );
    const sched = (must(schedule, 'payment_schedule') as Row[]).map(
      (p): ScheduledPayment => ({
        paymentNumber: num(p.payment_number),
        amount: num(p.amount),
        ...(p.days != null ? { days: num(p.days) } : {}),
        ...(p.months != null ? { months: num(p.months) } : {}),
        items: ((p.payment_schedule_items ?? []) as Row[]).map((i) => ({
          concept: str(i.concept),
          amount: num(i.amount),
          countsForIbc: i.counts_for_ibc !== false,
        })),
      }),
    );
    const number = str(r.number);
    const fullNumber = str(r.number_full, number);
    return {
      id,
      userId: str(r.user_id),
      entityId: str(r.entity_id),
      number,
      fullNumber,
      year: fullNumber.match(/(20\d{2})/)?.[1] ?? str(r.start_date).slice(0, 4),
      secopId: str(r.secop_code),
      object: str(r.object_text),
      shortLabel: str(r.short_label, `${number} ${str(r.process_area)}`.trim()),
      processName: str(r.process_area),
      ...(r.contract_profile ? { profile: str(r.contract_profile) } : {}),
      startDate: str(r.start_date),
      endDate: str(r.end_date),
      termText: str(r.term_text),
      totalValue: num(r.total_value),
      monthlyValue: num(r.monthly_value),
      paymentsCount: num(r.payments_count),
      reportNumberFormat: r.report_number_fmt === 'NN-NN' ? 'NN-NN' : 'NN DE NN',
      periodMode: r.period_mode === 'date_to_date' ? 'date_to_date' : 'month_end',
      supervisor: { name: str(r.supervisor_name), title: str(r.supervisor_title) },
      obligations: obls,
      contractorDuties: (must(duties, 'contractor_duties') as Row[]).map((d) => str(d.text)),
      ...(sched.length ? { schedule: sched } : {}),
    };
  }

  async listContracts(userId: string): Promise<Contract[]> {
    const rows = must(
      await this.sb
        .from('contracts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active'])
        .order('start_date'),
      'listContracts',
    ) as Row[];
    return Promise.all(rows.map((r) => this.toContract(r)));
  }

  async getContract(id: string): Promise<Contract> {
    return this.toContract(
      must(await this.sb.from('contracts').select('*').eq('id', id).single(), 'getContract') as Row,
    );
  }

  /** Persists the fields the conversation can change (period mode, supervisor, end date). */
  async updateContract(c: Contract): Promise<void> {
    must(
      await this.sb
        .from('contracts')
        .update({
          period_mode: c.periodMode,
          period_mode_set_at: new Date().toISOString(),
          supervisor_name: c.supervisor.name,
          supervisor_title: c.supervisor.title,
          end_date: c.endDate,
          short_label: c.shortLabel,
        })
        .eq('id', c.id),
      'updateContract',
    );
  }

  // -------------------------------------------------------------------------
  // Periods and prior payments
  // -------------------------------------------------------------------------
  async listPeriods(contractId: string): Promise<Period[]> {
    const rows = must(
      await this.sb.from('periods').select('*').eq('contract_id', contractId).order('report_number'),
      'listPeriods',
    ) as Row[];
    return rows.map((r) => ({
      contractId,
      number: num(r.report_number),
      from: str(r.date_from),
      to: str(r.date_to),
      amount: num(r.amount),
      amountSource: r.amount_source as Period['amountSource'],
      executionPct: num(r.execution_pct),
      status: r.status as Period['status'],
      ...(r.report_date ? { reportDate: str(r.report_date) } : {}),
    }));
  }

  async savePeriods(contractId: string, periods: Period[]): Promise<void> {
    const rows = periods.map((p) => ({
      contract_id: contractId,
      report_number: p.number,
      payment_number: p.number,
      date_from: p.from,
      date_to: p.to,
      amount: p.amount,
      amount_source: p.amountSource,
      execution_pct: p.executionPct,
      status: p.status,
      report_date: p.reportDate ?? null,
    }));
    if (rows.length) {
      must(
        await this.sb.from('periods').upsert(rows, { onConflict: 'contract_id,report_number' }),
        'savePeriods.upsert',
      );
    }
    const keep = periods.map((p) => p.number);
    let del = this.sb.from('periods').delete().eq('contract_id', contractId);
    if (keep.length) del = del.not('report_number', 'in', `(${keep.join(',')})`);
    must(await del, 'savePeriods.delete');
  }

  async listPriorPayments(contractId: string): Promise<PriorPaymentRecord[]> {
    const rows = must(
      await this.sb
        .from('period_payments')
        .select('voucher, amount, periods!inner(contract_id, report_number)')
        .eq('periods.contract_id', contractId),
      'listPriorPayments',
    ) as Row[];
    return rows.map((r) => ({
      contractId,
      voucher: str(r.voucher),
      amount: num(r.amount),
      periodNumber: num((r.periods as Row).report_number),
    }));
  }

  // -------------------------------------------------------------------------
  // Notes and evidences
  // -------------------------------------------------------------------------
  private async noteRow(note: Note) {
    const { byKey } = await this.obligationIds(note.contractId);
    const obligationId = note.obligationKey ? (byKey.get(note.obligationKey) ?? null) : null;
    return {
      id: note.id,
      user_id: note.userId,
      contract_id: note.contractId,
      activity_date: note.date,
      text: note.text,
      confirmed_obligation_id: obligationId,
      confidence: note.confidence ?? null,
      created_at: note.createdAt,
    };
  }

  private async linkEvidence(note: Note): Promise<void> {
    if (!note.evidenceIds.length) return;
    const { byKey } = await this.obligationIds(note.contractId);
    must(
      await this.sb
        .from('evidences')
        .update({
          note_id: note.id,
          obligation_id: note.obligationKey ? (byKey.get(note.obligationKey) ?? null) : null,
          taken_on: note.date,
        })
        .in('id', note.evidenceIds),
      'linkEvidence',
    );
  }

  async addNote(note: Note): Promise<void> {
    must(await this.sb.from('activity_notes').insert(await this.noteRow(note)), 'addNote');
    await this.linkEvidence(note);
  }

  async updateNote(note: Note): Promise<void> {
    must(await this.sb.from('activity_notes').upsert(await this.noteRow(note)), 'updateNote');
    await this.linkEvidence(note);
  }

  private async toNote(r: Row): Promise<Note> {
    const contractId = str(r.contract_id);
    const [{ byId }, ev] = await Promise.all([
      this.obligationIds(contractId),
      this.sb.from('evidences').select('id').eq('note_id', str(r.id)).order('sort_order'),
    ]);
    const key = r.confirmed_obligation_id ? byId.get(str(r.confirmed_obligation_id)) : undefined;
    return {
      id: str(r.id),
      userId: str(r.user_id),
      contractId,
      date: str(r.activity_date),
      text: str(r.text ?? r.transcript),
      ...(key ? { obligationKey: key } : {}),
      ...(r.confidence != null ? { confidence: num(r.confidence) } : {}),
      evidenceIds: (must(ev, 'note evidences') as Row[]).map((e) => str(e.id)),
      createdAt: str(r.created_at),
    };
  }

  async getNote(id: string): Promise<Note> {
    return this.toNote(
      must(await this.sb.from('activity_notes').select('*').eq('id', id).single(), 'getNote') as Row,
    );
  }

  async listNotes(contractId: string, from: IsoDate, to: IsoDate): Promise<Note[]> {
    const rows = must(
      await this.sb
        .from('activity_notes')
        .select('*')
        .eq('contract_id', contractId)
        .gte('activity_date', from)
        .lte('activity_date', to)
        .order('activity_date')
        .order('created_at'),
      'listNotes',
    ) as Row[];
    return Promise.all(rows.map((r) => this.toNote(r)));
  }

  private async upload(bucket: string, path: string, data: Buffer, mime: string): Promise<void> {
    must(
      await this.sb.storage.from(bucket).upload(path, data, { contentType: mime, upsert: true }),
      `upload ${bucket}`,
    );
  }

  private async download(bucket: string, path: string): Promise<{ data: Buffer; mime: string }> {
    const blob = must(await this.sb.storage.from(bucket).download(path), `download ${bucket}`);
    if (!blob) throw new Error(`download ${bucket}: empty file ${path}`);
    return { data: Buffer.from(await blob.arrayBuffer()), mime: blob.type || 'application/octet-stream' };
  }

  async addEvidence(e: Evidence): Promise<void> {
    const path = `${e.userId}/${e.id}.${extOf(e.mime)}`;
    await this.upload('evidences', path, e.data, e.mime);
    must(
      await this.sb.from('evidences').insert({ id: e.id, user_id: e.userId, file_path: path }),
      'addEvidence',
    );
  }

  async getEvidence(id: string): Promise<Evidence> {
    const r = must(
      await this.sb.from('evidences').select('id, user_id, file_path').eq('id', id).single(),
      'getEvidence',
    ) as Row;
    const file = await this.download('evidences', str(r.file_path));
    return { id, userId: str(r.user_id), data: file.data, mime: file.mime };
  }

  // -------------------------------------------------------------------------
  // Drafts
  // -------------------------------------------------------------------------
  private async periodId(contractId: string, periodNumber: number): Promise<string> {
    const r = must(
      await this.sb
        .from('periods')
        .select('id')
        .eq('contract_id', contractId)
        .eq('report_number', periodNumber)
        .single(),
      'periodId',
    ) as Row;
    return str(r.id);
  }

  async listDrafts(contractId: string, periodNumber: number): Promise<Draft[]> {
    const [periodId, { byId }] = await Promise.all([
      this.periodId(contractId, periodNumber),
      this.obligationIds(contractId),
    ]);
    const rows = must(
      await this.sb.from('drafts').select('*').eq('period_id', periodId),
      'listDrafts',
    ) as Row[];
    return rows.map((r) => ({
      contractId,
      periodNumber,
      obligationKey: byId.get(str(r.obligation_id)) ?? '',
      paragraphs: str(r.final_text).split('\n\n').filter(Boolean),
      status: r.status as Draft['status'],
      sourceNoteIds: (r.source_note_ids ?? []) as string[],
    }));
  }

  async saveDraft(d: Draft): Promise<void> {
    const [periodId, { byKey }] = await Promise.all([
      this.periodId(d.contractId, d.periodNumber),
      this.obligationIds(d.contractId),
    ]);
    const obligationId = byKey.get(d.obligationKey);
    if (!obligationId) throw new Error(`saveDraft: unknown obligation ${d.obligationKey}`);
    must(
      await this.sb.from('drafts').upsert(
        {
          period_id: periodId,
          obligation_id: obligationId,
          version: 1,
          final_text: d.paragraphs.join('\n\n'),
          status: d.status === 'proposed' ? 'proposed' : d.status,
          source_note_ids: d.sourceNoteIds,
          approved_at: d.status === 'approved' ? new Date().toISOString() : null,
        },
        { onConflict: 'period_id,obligation_id,version' },
      ),
      'saveDraft',
    );
  }

  // -------------------------------------------------------------------------
  // Supports and social security
  // -------------------------------------------------------------------------
  async addSupport(s: SupportFile): Promise<void> {
    const existing = must(
      await this.sb.from('supports').select('original_path').eq('id', s.id).maybeSingle(),
      'addSupport.lookup',
    ) as Row | null;
    let path = existing ? str(existing.original_path) : '';
    if (!existing) {
      path = `${s.userId}/${s.id}.${extOf(s.mime)}`;
      await this.upload('supports', path, s.data, s.mime);
    }
    must(
      await this.sb.from('supports').upsert({
        id: s.id,
        user_id: s.userId,
        code: s.code,
        filename: s.filename,
        original_path: path,
        mime_type: s.mime,
        sha256: createHash('sha256').update(s.data).digest('hex'),
        issued_on: s.issuedOn ?? null,
        created_at: s.receivedAt,
      }),
      'addSupport',
    );
  }

  async listSupports(userId: string): Promise<SupportFile[]> {
    const rows = must(
      await this.sb
        .from('supports')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'rejected')
        .order('created_at'),
      'listSupports',
    ) as Row[];
    return Promise.all(
      rows.map(async (r) => {
        const file = await this.download('supports', str(r.original_path));
        return {
          id: str(r.id),
          userId,
          code: str(r.code),
          ...(r.issued_on ? { issuedOn: str(r.issued_on) } : {}),
          data: file.data,
          mime: str(r.mime_type, file.mime),
          filename: str(r.filename, `${str(r.code)}.${extOf(str(r.mime_type))}`),
          receivedAt: str(r.created_at),
        };
      }),
    );
  }

  async getSocialSecurity(userId: string, contributionMonth: IsoDate): Promise<SocialSecurity | null> {
    const r = must(
      await this.sb
        .from('social_security_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('contribution_month', contributionMonth)
        .not('confirmed_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'getSocialSecurity',
    ) as Row | null;
    if (!r) return null;
    return {
      userId,
      contributionMonth,
      platform: str(r.operator),
      sheetNumber: str(r.sheet_number),
      pin: str(r.auth_code),
      bank: str(r.bank),
      paymentDate: str(r.paid_on),
      ibc: num(r.ibc),
      eps: str(r.health_entity),
      epsValue: num(r.health_value),
      afp: str(r.pension_entity),
      afpValue: num(r.pension_value),
      fspValue: num(r.fsp_value),
      afcValue: num(r.afc_value),
      ...(r.arl_entity ? { arl: str(r.arl_entity) } : {}),
      arlValue: num(r.arl_value),
      total: num(r.total_value),
    };
  }

  // -------------------------------------------------------------------------
  // Conversation state
  // -------------------------------------------------------------------------
  async getConversation(userId: string): Promise<ConversationState | null> {
    const r = must(
      await this.sb.from('conversations').select('*').eq('user_id', userId).maybeSingle(),
      'getConversation',
    ) as Row | null;
    return r
      ? {
          userId,
          flow: str(r.flow),
          step: str(r.step),
          context: (r.context ?? {}) as Record<string, unknown>,
          updatedAt: str(r.updated_at),
        }
      : null;
  }

  async saveConversation(state: ConversationState): Promise<void> {
    must(
      await this.sb.from('conversations').upsert({
        user_id: state.userId,
        flow: state.flow,
        step: state.step,
        context: state.context,
        updated_at: state.updatedAt,
      }),
      'saveConversation',
    );
  }
}
