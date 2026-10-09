import { DEMO_PHONES, demoData } from '../src/demo.js';
import { FakeAI, FakeSTT, FixedClock } from '../src/fakes.js';
import { MemoryStore } from '../src/memory-store.js';
import { Orchestrator } from '../src/orchestrator.js';
import type { Generator, Inbound, Outgoing } from '../src/ports.js';

export const fakeGenerator: Generator = {
  async generate() {
    return [
      { filename: 'INFORME.docx', mime: 'docx', data: Buffer.from('d'), group: 'docx' },
      { filename: 'paquete.zip', mime: 'zip', data: Buffer.from('z'), group: 'zip' },
      { filename: 'INFORME.pdf', mime: 'pdf', data: Buffer.from('p'), group: 'pdf' },
    ];
  },
};

/** Drives the orchestrator like a WhatsApp user would, recording every reply. */
export function harness(opts: { today?: string; generator?: Generator; phone?: string } = {}) {
  const store = new MemoryStore(demoData());
  const clock = new FixedClock(opts.today ?? '2026-09-28');
  let seq = 0;
  const orchestrator = new Orchestrator({
    store,
    ai: new FakeAI(),
    stt: new FakeSTT(),
    clock,
    generator: opts.generator ?? fakeGenerator,
    newId: () => `id-${++seq}`,
    confidenceThreshold: 0.6,
  });
  const from = opts.phone ?? DEMO_PHONES.maria;
  const send = (m: Omit<Inbound, 'id' | 'from' | 'at'>) =>
    orchestrator.handle({ id: `wamid-${++seq}`, from, at: clock.now(), ...m });
  return {
    store,
    clock,
    say: (text: string) => send({ kind: 'text', text }),
    press: (replyId: string) => send({ kind: 'reply', replyId }),
    photo: () => send({ kind: 'image', media: { data: Buffer.from('jpeg'), mime: 'image/jpeg' } }),
    audio: (spoken: string) =>
      send({ kind: 'audio', media: { data: Buffer.from(spoken), mime: 'audio/ogg' } }),
    document: (filename: string) =>
      send({ kind: 'document', media: { data: Buffer.from('%PDF-1.4'), mime: 'application/pdf', filename } }),
  };
}

/** Compact, readable transcript of the replies, for assertions. */
export function show(out: Outgoing[]): string[] {
  return out.map((o) => {
    if (o.type === 'text') return o.text;
    if (o.type === 'buttons') return `${o.text} [${o.buttons.map((b) => b.title).join('] [')}]`;
    if (o.type === 'list') return `${o.text} {${o.rows.map((r) => r.title).join(' | ')}}`;
    if (o.type === 'cta_url') return `${o.text} <${o.button} → ${o.url}>`;
    return `📎 ${o.filename}`;
  });
}
