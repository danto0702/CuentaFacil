import type {
  Clock,
  Contract,
  Entity,
  GeneratedFile,
  Generator,
  Period,
  Store,
  SupportFile,
  SupportType,
} from '@cuentasbot/conversation';
import {
  buildTemplateContext,
  buildZips,
  type CuentaInput,
  docxToPdf,
  type ImageInput,
  mergeToPdf,
  type ObligationInput,
  renderDocx,
} from '@cuentasbot/docgen';
import { addMonthsClamped, type IsoDate, monthNameEs, parseIso } from '@cuentasbot/shared';

export type TemplateKind = 'activity_report' | 'supervision_report';

/** Where entity templates come from (code-built in Phase 0; Storage + `templates` table in Phase 1). */
export interface TemplateProvider {
  get(entity: Entity, contract: Contract, kind: TemplateKind): Promise<Buffer>;
}

export interface GeneratorOptions {
  store: Store;
  clock: Clock;
  templates: TemplateProvider;
  /** WhatsApp Cloud API document limit; larger ZIPs are split. */
  maxDocumentBytes?: number;
  maxEvidencePerObligation?: number;
}

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const upper = (s: string) => s.toLocaleUpperCase('es-CO');

function latest(supports: SupportFile[], code: string): SupportFile | undefined {
  return supports
    .filter((s) => s.code === code)
    .sort((a, b) => ((a.issuedOn ?? a.receivedAt) < (b.issuedOn ?? b.receivedAt) ? 1 : -1))[0];
}

function fill(pattern: string, period: Period): string {
  const { year } = parseIso(period.to);
  return pattern.replace('{MES}', upper(monthNameEs(period.to))).replace('{AÑO}', String(year));
}

export class AccountGenerator implements Generator {
  constructor(private readonly opts: GeneratorOptions) {}

  /** Assembles the data of one account (contract + period) for the templates. */
  async buildInput(
    contractId: string,
    periodNumber: number,
  ): Promise<{
    input: CuentaInput;
    entity: Entity;
    contract: Contract;
    period: Period;
    supports: SupportFile[];
    types: SupportType[];
  }> {
    const { store, clock } = this.opts;
    const contract = await store.getContract(contractId);
    const entity = await store.getEntity(contract.entityId);
    const user = await store.getUser(contract.userId);
    const periods = await store.listPeriods(contractId);
    const period = periods.find((p) => p.number === periodNumber);
    if (!period) throw new Error(`Period ${periodNumber} not found`);
    const drafts = await store.listDrafts(contractId, periodNumber);
    const notes = await store.listNotes(contractId, period.from, period.to);
    const maxEv = this.opts.maxEvidencePerObligation ?? 3;

    const obligations: ObligationInput[] = [];
    for (const o of contract.obligations) {
      const d = drafts.find((x) => x.obligationKey === o.key);
      const evIds = notes
        .filter((n) => n.obligationKey === o.key)
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .flatMap((n) => n.evidenceIds)
        .slice(0, maxEv);
      const evidences: ImageInput[] = [];
      for (const id of evIds) evidences.push({ data: (await store.getEvidence(id)).data });
      obligations.push({
        number: o.number,
        kind: o.kind,
        text: o.text,
        activities: d?.paragraphs ?? [],
        evidences,
      });
    }

    const monthStart = `${period.to.slice(0, 8)}01`;
    const contributionMonth =
      entity.settings.pilaContributionMonth === 'previous' ? addMonthsClamped(monthStart, -1) : monthStart;
    const ss = await store.getSocialSecurity(user.id, contributionMonth);
    const supports = await store.listSupports(user.id);
    const types = await store.listSupportTypes(entity.id);
    const prior = (await store.listPriorPayments(contractId)).filter((p) => p.periodNumber < periodNumber);
    const next = periods.find((p) => p.number === periodNumber + 1);
    const today = clock.today();
    const reportDate: IsoDate = period.reportDate ?? (today < period.to ? today : period.to);

    const input: CuentaInput = {
      entity: {
        name: entity.name,
        nit: entity.nit,
        city: entity.city,
        meeting: entity.settings.meeting,
        defaultActivityText: entity.settings.defaultActivityText,
        backgroundCheckDate: entity.settings.backgroundCheckDate,
      },
      contractor: {
        fullName: user.fullName,
        docNumber: user.docNumber,
        docIssuedIn: user.docIssuedIn,
        regime: user.regime,
        bankName: user.bankName,
        accountType: user.accountType,
        accountNumber: user.accountNumber,
        hasArl: user.hasArl,
      },
      contract: {
        number: contract.number,
        fullNumber: contract.fullNumber,
        year: contract.year,
        secopId: contract.secopId,
        object: contract.object,
        processName: contract.processName,
        startDate: contract.startDate,
        endDate: contract.endDate,
        termText: contract.termText,
        initialValue: contract.totalValue,
        additions: 0,
        hasExtension: false,
        monthlyValue: contract.monthlyValue,
        paymentsCount: contract.paymentsCount,
        reportNumberFormat: contract.reportNumberFormat,
        supervisor: contract.supervisor,
        obligations,
        contractorDuties: contract.contractorDuties.map((text) => ({ text })),
      },
      period: {
        number: period.number,
        from: period.from,
        to: period.to,
        amount: period.amount,
        executionPct: period.executionPct,
        items: contract.schedule?.find((s) => s.paymentNumber === period.number)?.items ?? [
          { concept: 'Honorarios', amount: period.amount },
        ],
        reportDate,
        ...(next ? { nextReportDate: next.to } : {}),
      },
      priorPayments: prior.map((p) => ({ voucher: p.voucher, amount: p.amount })),
      ...(ss ? { socialSecurity: ss } : {}),
      certificates: {
        ...(latest(supports, 'POLICIA')?.issuedOn ? { policia: latest(supports, 'POLICIA')!.issuedOn! } : {}),
        ...(latest(supports, 'RNMC')?.issuedOn ? { rnmc: latest(supports, 'RNMC')!.issuedOn! } : {}),
        ...(latest(supports, 'PROCURADURIA')?.issuedOn
          ? { procuraduria: latest(supports, 'PROCURADURIA')!.issuedOn! }
          : {}),
        ...(latest(supports, 'CONTRALORIA')?.issuedOn
          ? { contraloria: latest(supports, 'CONTRALORIA')!.issuedOn! }
          : {}),
      },
    };
    return { input, entity, contract, period, supports, types };
  }

  async generate(contractId: string, periodNumber: number): Promise<GeneratedFile[]> {
    const { input, entity, contract, period, supports, types } = await this.buildInput(
      contractId,
      periodNumber,
    );
    const ctx = await buildTemplateContext(input);
    const month = upper(monthNameEs(period.to));
    const year = parseIso(period.to).year;

    const activityDocx = await renderDocx(
      await this.opts.templates.get(entity, contract, 'activity_report'),
      ctx,
    );
    const supervisionDocx = await renderDocx(
      await this.opts.templates.get(entity, contract, 'supervision_report'),
      ctx,
    );
    const activityPdf = await docxToPdf(activityDocx);
    const supervisionPdf = await docxToPdf(supervisionDocx);

    const bundle = async (name: 'ANTECEDENTES' | 'AFILIACIONES') => {
      const parts = types
        .filter((t) => t.bundle === name)
        .sort((a, b) => (a.bundleOrder ?? 0) - (b.bundleOrder ?? 0))
        .map((t) => latest(supports, t.code))
        .filter((s): s is SupportFile => Boolean(s));
      return parts.length ? mergeToPdf(parts.map((s) => ({ data: s.data, mime: s.mime }))) : null;
    };
    const antecedentes = await bundle('ANTECEDENTES');
    const afiliaciones = await bundle('AFILIACIONES');
    const pila = latest(supports, 'PILA');
    const pilaPdf = pila ? await mergeToPdf([{ data: pila.data, mime: pila.mime }]) : null;

    const files: GeneratedFile[] = [
      { filename: `INFORME ${month} ${year}.pdf`, mime: 'application/pdf', data: activityPdf, group: 'pdf' },
      {
        filename: `INFORME DE SUPERVISIÓN ${month} ${year}.pdf`,
        mime: 'application/pdf',
        data: supervisionPdf,
        group: 'pdf',
      },
    ];
    if (antecedentes)
      files.push({ filename: 'ANTECEDENTES.pdf', mime: 'application/pdf', data: antecedentes, group: 'pdf' });
    if (afiliaciones)
      files.push({ filename: 'AFILIACIONES.pdf', mime: 'application/pdf', data: afiliaciones, group: 'pdf' });
    if (pilaPdf)
      files.push({
        filename: `PLANILLA ${month} ${year}.pdf`,
        mime: 'application/pdf',
        data: pilaPdf,
        group: 'pdf',
      });
    files.push(
      { filename: `INFORME ${month} ${year}.docx`, mime: DOCX, data: activityDocx, group: 'docx' },
      {
        filename: `INFORME DE SUPERVISIÓN ${month} ${year}.docx`,
        mime: DOCX,
        data: supervisionDocx,
        group: 'docx',
      },
    );

    const pkg = entity.settings.package;
    const root = fill(pkg.periodFolder, period);
    const upload = `${root}/${pkg.uploadFolder}`;
    const entries = [
      ...files
        .filter((f) => f.group === 'docx')
        .map((f) => ({ path: `${root}/${f.filename}`, data: f.data })),
      ...files
        .filter((f) => f.group === 'pdf')
        .map((f) => ({ path: `${upload}/${f.filename}`, data: f.data })),
    ];
    const zips = await buildZips(entries, this.opts.maxDocumentBytes ?? 100 * 1024 * 1024);
    const base = pkg.zipName.replace(/\.zip$/i, '');
    zips.forEach((z, i) => {
      files.push({
        filename: zips.length === 1 ? `${base}.zip` : `${base} (parte ${i + 1} de ${zips.length}).zip`,
        mime: 'application/zip',
        data: z,
        group: 'zip',
      });
    });
    return files;
  }
}
