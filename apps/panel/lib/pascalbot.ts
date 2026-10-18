/** Limits of the website chat (PascalBot): it only informs, so turns stay short and few. */
export const PASCALBOT_LIMITS = {
  /** Characters per message. */
  messageChars: 600,
  /** Previous turns sent to the model. */
  historyTurns: 10,
  /** Messages per visitor (IP) per window. */
  perIp: 20,
  windowMs: 10 * 60_000,
  /** Messages per day for the whole site, so a flood cannot run up the bill. */
  perDay: 1500,
  maxTokens: 450,
} as const;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Validates the body the widget sends: `{ messages: [{ role, content }] }`, ending with the visitor's
 * message. Returns the turns to send (trimmed, alternating, starting with the visitor) or null.
 */
export function parseChat(body: unknown): ChatTurn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || !raw.length) return null;
  const turns: ChatTurn[] = [];
  for (const m of raw.slice(-PASCALBOT_LIMITS.historyTurns)) {
    const role = (m as ChatTurn)?.role;
    const content = (m as ChatTurn)?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const text = content.trim().slice(0, PASCALBOT_LIMITS.messageChars);
    if (!text) continue;
    // Consecutive turns of the same role are merged: the API needs them alternating.
    const last = turns[turns.length - 1];
    if (last?.role === role) last.content += `\n${text}`;
    else turns.push({ role, content: text });
  }
  while (turns[0]?.role === 'assistant') turns.shift();
  if (turns[turns.length - 1]?.role !== 'user') return null;
  return turns;
}

/** Fixed-window counters kept in memory (one panel instance). */
export class RateLimiter {
  private readonly hits = new Map<string, { start: number; count: number }>();
  private day = { key: '', count: 0 };

  constructor(private readonly limits: Pick<typeof PASCALBOT_LIMITS, 'perIp' | 'windowMs' | 'perDay'>) {}

  /** Counts a message; 'ip' or 'day' when that limit is already reached. */
  take(ip: string, now = Date.now()): 'ok' | 'ip' | 'day' {
    const today = new Date(now).toISOString().slice(0, 10);
    if (this.day.key !== today) this.day = { key: today, count: 0 };
    if (this.day.count >= this.limits.perDay) return 'day';
    const h = this.hits.get(ip);
    if (!h || now - h.start >= this.limits.windowMs) {
      if (this.hits.size > 5000) this.prune(now);
      this.hits.set(ip, { start: now, count: 1 });
    } else if (h.count >= this.limits.perIp) return 'ip';
    else h.count++;
    this.day.count++;
    return 'ok';
  }

  private prune(now: number) {
    for (const [k, v] of this.hits) if (now - v.start >= this.limits.windowMs) this.hits.delete(k);
  }
}

/** Origins allowed to call the chat: the website, plus extra ones from PASCALBOT_ORIGINS (comma list). */
export function allowedOrigins(extra = process.env.PASCALBOT_ORIGINS ?? ''): Set<string> {
  return new Set([
    'https://pascalia.lat',
    'https://www.pascalia.lat',
    ...extra
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ]);
}
