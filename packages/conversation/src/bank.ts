import type { BankReading, User } from './domain.js';
import type { Deps, Inbound, Outgoing } from './ports.js';
import { normalize } from './text.js';

/** Code of the bank certificate among the supports (seed checklist). */
export const BANK_CERTIFICATE = 'CUENTA_BANCARIA';

export interface BankCandidate {
  bankName: string;
  accountType: 'ahorros' | 'corriente' | null;
  accountNumber: string;
  holderName: string | null;
  holderDoc: string | null;
}

/** Banks and wallets in Colombia, as they appear in documents, with the ways people write them. */
const BANKS: [string, string[]][] = [
  ['BANCOLOMBIA', ['bancolombia']],
  ['BANCO DE BOGOTÁ', ['banco de bogota', 'bogota']],
  ['DAVIVIENDA', ['davivienda']],
  ['BBVA', ['bbva']],
  ['BANCO AGRARIO', ['banco agrario', 'agrario']],
  ['BANCO POPULAR', ['banco popular', 'popular']],
  ['BANCO DE OCCIDENTE', ['banco de occidente', 'occidente']],
  ['BANCO AV VILLAS', ['av villas', 'avvillas']],
  ['BANCO CAJA SOCIAL', ['caja social']],
  ['SCOTIABANK COLPATRIA', ['colpatria', 'scotiabank']],
  ['ITAÚ', ['itau']],
  ['BANCO GNB SUDAMERIS', ['sudameris', 'gnb']],
  ['BANCO PICHINCHA', ['pichincha']],
  ['BANCO FALABELLA', ['falabella']],
  ['BANCOOMEVA', ['bancoomeva', 'coomeva']],
  ['BANCO W', ['banco w']],
  ['BANCO MUNDO MUJER', ['mundo mujer']],
  ['BANCO FINANDINA', ['finandina']],
  ['BANCO SERFINANZA', ['serfinanza']],
  ['BANCO COOPERATIVO COOPCENTRAL', ['coopcentral']],
  ['LULO BANK', ['lulo']],
  ['NU COLOMBIA', ['nubank', 'nu colombia']],
  ['NEQUI', ['nequi']],
  ['DAVIPLATA', ['daviplata']],
];

const digits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

/**
 * «Ahorros Bancolombia 123-456789-01»: the account the contractor writes. Null when the text does not
 * look like one (no account number, or neither bank nor type), so other messages are handled normally.
 */
export function parseBankText(text: string): Partial<BankCandidate> | null {
  const t = normalize(text);
  const numbers = (text.match(/\d[\d .-]*\d/g) ?? [])
    .map(digits)
    .filter((n) => n.length >= 6 && n.length <= 20);
  const accountNumber = numbers.sort((a, b) => b.length - a.length)[0];
  if (!accountNumber) return null;
  const accountType = /\bahorro/.test(t) ? 'ahorros' : /\bcorriente\b/.test(t) ? 'corriente' : null;
  const bank = BANKS.find(([, aliases]) => aliases.some((a) => new RegExp(`\\b${a}\\b`).test(t)));
  if (!bank && !accountType) return null;
  return { accountNumber, accountType, ...(bank ? { bankName: bank[0] } : {}) };
}

export const bankAskText = (whose: string) =>
  `🏦 Envíame la *certificación bancaria* ${whose} (PDF o foto), o escríbeme los datos así: *Ahorros Bancolombia 12345678901*.`;

/**
 * Reads a bank certificate (PDF or photo, kept with the supports) or the account written as text.
 * Null when the message is neither; `retry` says what to send again (`notCertificate`: a file that is
 * something else, e.g. an activity photo).
 */
export async function readBankMessage(
  deps: Pick<Deps, 'ai' | 'store' | 'newId' | 'clock'> & { warn?: Deps['warn'] },
  userId: string,
  msg: Inbound,
): Promise<{ candidate: BankCandidate } | { retry: string; notCertificate?: true } | null> {
  const media = msg.kind === 'document' || msg.kind === 'image' ? msg.media : undefined;
  if (media) {
    if (!(media.mime === 'application/pdf' || media.mime.startsWith('image/')))
      return {
        retry: 'Envíame la certificación en *PDF* o como *foto*, o escríbeme los datos de la cuenta.',
      };
    const filename = media.filename ?? (msg.kind === 'image' ? 'foto.jpg' : 'documento.pdf');
    let r: BankReading;
    try {
      r = await deps.ai.readBankCertificate({ label: filename, data: media.data, mime: media.mime });
    } catch (e) {
      deps.warn?.('bank.read_failed', { userId, error: String(e) });
      return {
        retry:
          'No pude leer la certificación en este momento. Escríbeme los datos así: *Ahorros Bancolombia 12345678901*.',
      };
    }
    const accountNumber = digits(r.accountNumber);
    if (!r.isBankCertificate || accountNumber.length < 6 || !r.bankName)
      return {
        notCertificate: true,
        retry: `🤔 No encontré los datos de una cuenta en ese documento (parece *${r.summary}*). Envíame la certificación bancaria o escríbeme los datos así: *Ahorros Bancolombia 12345678901*.`,
      };
    // Kept with the supports: some entities ask for it with the first report.
    await deps.store.addSupport({
      id: deps.newId(),
      userId,
      code: BANK_CERTIFICATE,
      data: media.data,
      mime: media.mime,
      filename,
      receivedAt: deps.clock.now().toISOString(),
    });
    return {
      candidate: {
        bankName: r.bankName.toUpperCase(),
        accountType: r.accountType,
        accountNumber,
        holderName: r.holderName,
        holderDoc: digits(r.holderDoc) || null,
      },
    };
  }
  if (msg.kind !== 'text' || !msg.text) return null;
  const p = parseBankText(msg.text);
  if (!p) return null;
  if (!p.bankName)
    return {
      retry: `¿De qué banco es la cuenta *${p.accountNumber}*? Escríbeme todo junto, así: *Ahorros Bancolombia ${p.accountNumber}*.`,
    };
  return {
    candidate: {
      bankName: p.bankName,
      accountType: p.accountType ?? null,
      accountNumber: p.accountNumber!,
      holderName: null,
      holderDoc: null,
    },
  };
}

/** The next question about a candidate: its type if missing, else the confirmation. `prefix` names the buttons. */
export function bankQuestion(
  prefix: string,
  c: BankCandidate,
  owner: { name: string; doc: string; whose: string },
  extra: { id: string; title: string }[] = [],
): Outgoing {
  if (!c.accountType)
    return {
      type: 'buttons',
      text: `🏦 ¿La cuenta *${c.bankName} ${c.accountNumber}* es de ahorros o corriente?`,
      buttons: [
        { id: `${prefix}:ahorros`, title: 'Ahorros' },
        { id: `${prefix}:corriente`, title: 'Corriente' },
      ],
    };
  const lines = [
    `🏦 ¿Guardo esta cuenta${owner.whose ? ` ${owner.whose}` : ''} para los documentos?`,
    `• Banco: *${c.bankName}*`,
    `• Tipo: *${c.accountType === 'ahorros' ? 'Ahorros' : 'Corriente'}*`,
    `• Número: *${c.accountNumber}*`,
  ];
  if (c.holderName) lines.push(`• A nombre de: ${c.holderName}`);
  const doc = digits(owner.doc);
  if (c.holderDoc && doc && c.holderDoc !== doc)
    lines.push(
      '',
      `⚠️ La certificación está a nombre de otra cédula (****${c.holderDoc.slice(-4)}), no de ${owner.name}. La entidad solo paga los honorarios en una cuenta a nombre del contratista.`,
    );
  return {
    type: 'buttons',
    text: lines.join('\n'),
    buttons: [
      { id: `${prefix}:yes`, title: '✅ Sí, guardarla' },
      { id: `${prefix}:no`, title: '✏️ Corregir' },
      ...extra,
    ],
  };
}

export const applyBank = (user: User, c: BankCandidate): User => ({
  ...user,
  bankName: c.bankName,
  accountType: c.accountType ?? 'ahorros',
  accountNumber: c.accountNumber,
});
