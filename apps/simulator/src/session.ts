import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  DEMO_PHONES,
  demoData,
  deserialize,
  FakeAI,
  FakeSTT,
  FixedClock,
  type Inbound,
  MemoryStore,
  Orchestrator,
  type Outgoing,
  serialize,
  tinyPdf,
} from '@cuentasbot/conversation';
import { addDays, type IsoDate } from '@cuentasbot/shared';
import { AccountGenerator, CodeTemplateProvider } from '@cuentasbot/worker';
import sharp from 'sharp';

export interface SessionOptions {
  stateFile: string;
  outDir: string;
  today: IsoDate;
  phone: string;
  reset: boolean;
  baseActivity?: string;
  baseSupervision?: string;
}

/** A simulated WhatsApp chat using the same orchestrator and generator as production. */
export class Session {
  private seq = 0;
  private lastInteractive: Outgoing | null = null;
  private constructor(
    private readonly opts: SessionOptions,
    readonly store: MemoryStore,
    private readonly clock: FixedClock,
    private readonly orchestrator: Orchestrator,
    public phone: string,
  ) {}

  static async open(opts: SessionOptions): Promise<Session> {
    const data =
      !opts.reset && existsSync(opts.stateFile)
        ? deserialize(await readFile(opts.stateFile, 'utf8'))
        : demoData({ supportsIssuedOn: addDays(opts.today, -5) });
    const store = new MemoryStore(data);
    const clock = new FixedClock(opts.today);
    const templates = new CodeTemplateProvider({
      ...(opts.baseActivity ? { activity_report: await readFile(opts.baseActivity) } : {}),
      ...(opts.baseSupervision ? { supervision_report: await readFile(opts.baseSupervision) } : {}),
    });
    const generator = new AccountGenerator({ store, clock, templates });
    let n = Date.now();
    const orchestrator = new Orchestrator({
      store,
      ai: new FakeAI(),
      stt: new FakeSTT(),
      clock,
      generator,
      newId: () => `sim-${(n++).toString(36)}`,
      confidenceThreshold: 0.6,
    });
    return new Session(opts, store, clock, orchestrator, opts.phone);
  }

  setDate(d: IsoDate): void {
    this.clock.set(d);
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.opts.stateFile), { recursive: true });
    await writeFile(this.opts.stateFile, serialize(this.store.data));
  }

  /** Translates a typed line into an inbound message. Returns null for local commands. */
  async toInbound(line: string): Promise<Omit<Inbound, 'id' | 'from' | 'at'> | null> {
    const trimmed = line.trim();
    if (/^\d{1,2}$/.test(trimmed) && this.lastInteractive) {
      const i = Number(trimmed) - 1;
      const opts =
        this.lastInteractive.type === 'buttons'
          ? this.lastInteractive.buttons
          : this.lastInteractive.type === 'list'
            ? this.lastInteractive.rows
            : [];
      const pick = opts[i];
      if (pick) return { kind: 'reply', replyId: pick.id };
    }
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd) {
      case '/foto': {
        const data = arg ? await readFile(arg) : await samplePhoto(`FOTO ${++this.seq}`);
        return { kind: 'image', media: { data, mime: 'image/jpeg' } };
      }
      case '/adjuntar': {
        if (!arg) throw new Error('Uso: /adjuntar <ruta del archivo>');
        const data = await readFile(arg);
        const mime = arg.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        return { kind: 'document', media: { data, mime, filename: arg.split('/').pop()! } };
      }
      case '/pdf':
        return {
          kind: 'document',
          media: {
            data: samplePdf(arg || 'documento'),
            mime: 'application/pdf',
            filename: `${arg || 'documento'}.pdf`,
          },
        };
      case '/audio':
        return { kind: 'audio', media: { data: Buffer.from(arg), mime: 'audio/ogg' } };
      case '/boton':
        return { kind: 'reply', replyId: arg };
      default:
        return { kind: 'text', text: line };
    }
  }

  async send(msg: Omit<Inbound, 'id' | 'from' | 'at'>): Promise<{ out: Outgoing[]; files: string[] }> {
    const out = await this.orchestrator.handle({
      id: `sim-${++this.seq}`,
      from: this.phone,
      at: this.clock.now(),
      ...msg,
    });
    const files: string[] = [];
    for (const o of out) {
      if (o.type === 'buttons' || o.type === 'list') this.lastInteractive = o;
      if (o.type === 'document') {
        const path = join(this.opts.outDir, o.filename);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, o.data);
        files.push(path);
      }
    }
    await this.save();
    return { out, files };
  }
}

async function samplePhoto(label: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#2b6cb0"/><text x="50%" y="50%" font-size="48" text-anchor="middle" fill="#fff" font-family="sans-serif">${label}</text></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toBuffer();
}

function samplePdf(title: string): Buffer {
  return tinyPdf(title.toUpperCase());
}

export { DEMO_PHONES };
